import { ZodError } from 'zod';
import { db } from '@/db/database';
import {
  listMemoryPlaceholderKeys,
  MenuDefinitionSchema,
  parseTemplatePayload,
  type ImportSourceFormat,
  type MenuDefinition,
  type MemoryMergeStrategy,
  type PromptContract,
} from '@/models/promptSchema';
import type { ContextMenu, Prompt } from '@/models/types';
import { planMemoryUpserts, applyMemoryPlan, type MemoryPlanItem } from '@/services/memoryService';
import { saveCategoryToSupabase } from '@/services/supabaseCategories';
import { saveLocalBackup } from '@/utils/backupManager';
import { normalizeRawMenu } from '@/utils/menuValidation';
import { contextMenuToDefinition, syncTemplateWithMenuDefinitions } from '@/utils/promptArtifacts';
import { getBulkExportWarning, getPromptSchemaWarning } from '@/utils/schemaCompatibility';
import { migrateTemplateToCurrentSchema } from '@/utils/templateMigration';

export interface ImportError {
  type: 'validation' | 'processing' | 'network' | 'conflict';
  field: string;
  message: string;
  data?: unknown;
}

export interface ImportPlanSummary {
  detectedFormat: ImportSourceFormat;
  schemaVersion: string;
  menusToCreate: string[];
  menusToUpdate: string[];
  promptsToCreate: string[];
  promptsToUpdate: string[];
  memoryToCreate: string[];
  memoryToUpdate: string[];
  memoryToPreserve: string[];
  memoryToIgnore: string[];
  conflicts: Array<{ path: string; code: string; message: string }>;
  warnings: Array<{ path?: string; message: string }>;
  errors: Array<{ path: string; message: string }>;
}

export interface ImportResult {
  success: boolean;
  count: number;
  errors: ImportError[];
  warnings: string[];
  processingTime: number;
  plan?: ImportPlanSummary;
  importedMenus?: number;
  importedPrompts?: number;
  importedMemory?: number;
}

export interface ImportPreviewData {
  detectedFormat: ImportSourceFormat;
  schemaVersion: string;
  prompts: Array<{
    title: string;
    description?: string;
    category?: string;
    action?: 'create' | 'update';
  }>;
  menus: Array<{
    menuName: string;
    menuId: string;
    action?: 'create' | 'update';
  }>;
  memory: Array<{
    key: string;
    templateId: string;
    action: 'create' | 'update' | 'preserve' | 'ignore';
  }>;
  warnings: string[];
  errors: ImportError[];
  plan: ImportPlanSummary;
}

interface CanonicalPromptImport {
  rawPrompt: unknown;
  category?: string;
}

interface CanonicalImportPayload {
  app: string;
  version: string;
  format: string;
  schemaVersion: string;
  exportedAt: string;
  contextMenus: unknown[];
  prompts: CanonicalPromptImport[];
  sourceFormat: ImportSourceFormat;
}

interface PreparedPrompt {
  categoryName?: string;
  promptPayload: PromptContract;
  existingPrompt?: Prompt;
  memoryPlan: MemoryPlanItem[];
}

interface BuiltImportState {
  canonical: CanonicalImportPayload;
  parsedMenus: MenuDefinition[];
  preparedPrompts: PreparedPrompt[];
  warnings: string[];
  errors: ImportError[];
  plan: ImportPlanSummary;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function sanitizeJsonString(jsonStr: string): string {
  const cleaned = jsonStr.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let startIndex = -1;

  if (firstBrace !== -1 && firstBracket !== -1) {
    startIndex = Math.min(firstBrace, firstBracket);
  } else if (firstBrace !== -1) {
    startIndex = firstBrace;
  } else if (firstBracket !== -1) {
    startIndex = firstBracket;
  }

  if (startIndex !== -1) {
    const isObjectPayload = cleaned[startIndex] === '{';
    const closingChar = isObjectPayload ? '}' : ']';
    const lastIndex = cleaned.lastIndexOf(closingChar);
    if (lastIndex !== -1 && lastIndex >= startIndex) {
      return cleaned.substring(startIndex, lastIndex + 1);
    }
  }

  return cleaned;
}

function getIssuePath(path: ReadonlyArray<PropertyKey>): string {
  if (path.length === 0) return 'general';
  return path.reduce<string>((accumulator, segment) => {
    if (typeof segment === 'number') {
      return `${accumulator}[${segment}]`;
    }
    const safeSegment = String(segment);
    return accumulator ? `${accumulator}.${safeSegment}` : safeSegment;
  }, '');
}

function pushUniqueWarning(warnings: string[], warning: string | null) {
  if (!warning || warnings.includes(warning)) return;
  warnings.push(warning);
}

function appendIssuesFromZod(
  error: ZodError,
  errors: ImportError[],
  basePath = '',
  type: ImportError['type'] = 'validation',
) {
  error.issues.forEach((issue) => {
    const issuePath = getIssuePath(issue.path);
    errors.push({
      type,
      field: basePath ? `${basePath}${issuePath ? `.${issuePath}` : ''}` : issuePath || 'general',
      message: issue.message,
    });
  });
}

function detectImportFormat(value: unknown): ImportSourceFormat {
  if (Array.isArray(value)) {
    return 'legacy-prompt-array';
  }

  if (!isObject(value)) {
    return 'invalid';
  }

  if (value.format === 'prompt-app-import') {
    return 'canonical-envelope';
  }

  if (Array.isArray(value.prompts)) {
    return value.format === 'prompt-app-bulk-export'
      ? 'legacy-bulk-export'
      : 'legacy-bulk-export';
  }

  const hasMenuEnvelope =
    Array.isArray(value.context_menus) ||
    Array.isArray(value.contextMenus) ||
    Array.isArray(value.menuDefinitions) ||
    Array.isArray(value.menu_definitions);

  const hasPromptShape =
    'meta' in value ||
    'prompt_definition' in value ||
    'system_role' in value ||
    'task' in value ||
    'input_data' in value;

  if (hasMenuEnvelope && !hasPromptShape) {
    return 'legacy-menu-import';
  }

  if (hasPromptShape) {
    return 'legacy-prompt-template';
  }

  return 'invalid';
}

function normalizeToCanonicalPayload(parsed: unknown): CanonicalImportPayload {
  const sourceFormat = detectImportFormat(parsed);
  const exportedAt = new Date().toISOString();

  if (sourceFormat === 'legacy-prompt-array') {
    return {
      app: 'Prompt App',
      version: '3.0.0',
      format: 'prompt-app-import',
      schemaVersion: '1.1.0',
      exportedAt,
      contextMenus: [],
      prompts: (parsed as unknown[]).map((rawPrompt) => ({ rawPrompt })),
      sourceFormat,
    };
  }

  if (!isObject(parsed)) {
    return {
      app: 'Prompt App',
      version: '3.0.0',
      format: 'prompt-app-import',
      schemaVersion: '1.1.0',
      exportedAt,
      contextMenus: [],
      prompts: [],
      sourceFormat: 'invalid',
    };
  }

  if (sourceFormat === 'canonical-envelope') {
    return {
      app: typeof parsed.app === 'string' ? parsed.app : 'Prompt App',
      version: typeof parsed.version === 'string' ? parsed.version : '3.0.0',
      format: 'prompt-app-import',
      schemaVersion:
        typeof parsed.schemaVersion === 'string'
          ? parsed.schemaVersion
          : typeof parsed.schema_version === 'string'
          ? parsed.schema_version
          : '1.1.0',
      exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : exportedAt,
      contextMenus: Array.isArray(parsed.context_menus)
        ? parsed.context_menus
        : Array.isArray(parsed.contextMenus)
        ? parsed.contextMenus
        : Array.isArray(parsed.menuDefinitions)
        ? parsed.menuDefinitions
        : Array.isArray(parsed.menu_definitions)
        ? parsed.menu_definitions
        : [],
      prompts: Array.isArray(parsed.prompts)
        ? parsed.prompts.map((rawPrompt) => ({ rawPrompt }))
        : [],
      sourceFormat,
    };
  }

  if (sourceFormat === 'legacy-bulk-export') {
    return {
      app: typeof parsed.app === 'string' ? parsed.app : 'Prompt App',
      version: typeof parsed.version === 'string' ? parsed.version : '3.0.0',
      format: 'prompt-app-import',
      schemaVersion:
        typeof parsed.schemaVersion === 'string'
          ? parsed.schemaVersion
          : typeof parsed.schema_version === 'string'
          ? parsed.schema_version
          : '1.0.0',
      exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : exportedAt,
      contextMenus: Array.isArray(parsed.menuDefinitions)
        ? parsed.menuDefinitions
        : Array.isArray(parsed.contextMenus)
        ? parsed.contextMenus
        : Array.isArray(parsed.context_menus)
        ? parsed.context_menus
        : [],
      prompts: Array.isArray(parsed.prompts)
        ? parsed.prompts.map((item) => {
            const promptItem = isObject(item) ? item : {};
            return {
              rawPrompt: promptItem.prompt ?? promptItem,
              category: typeof promptItem.category === 'string' ? promptItem.category : undefined,
            };
          })
        : [],
      sourceFormat,
    };
  }

  if (sourceFormat === 'legacy-menu-import') {
    return {
      app: typeof parsed.app === 'string' ? parsed.app : 'Prompt App',
      version: typeof parsed.version === 'string' ? parsed.version : '3.0.0',
      format: 'prompt-app-import',
      schemaVersion:
        typeof parsed.schemaVersion === 'string'
          ? parsed.schemaVersion
          : typeof parsed.schema_version === 'string'
          ? parsed.schema_version
          : '1.0.0',
      exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : exportedAt,
      contextMenus: Array.isArray(parsed.context_menus)
        ? parsed.context_menus
        : Array.isArray(parsed.contextMenus)
        ? parsed.contextMenus
        : Array.isArray(parsed.menuDefinitions)
        ? parsed.menuDefinitions
        : Array.isArray(parsed.menu_definitions)
        ? parsed.menu_definitions
        : [],
      prompts: [],
      sourceFormat,
    };
  }

  return {
    app: 'Prompt App',
    version: typeof parsed.version === 'string' ? parsed.version : '3.0.0',
    format: 'prompt-app-import',
    schemaVersion:
      typeof parsed.schemaVersion === 'string'
        ? parsed.schemaVersion
        : typeof parsed.schema_version === 'string'
        ? parsed.schema_version
        : '1.0.0',
    exportedAt,
    contextMenus: [],
    prompts: [{ rawPrompt: parsed }],
    sourceFormat: sourceFormat === 'legacy-prompt-template' ? sourceFormat : 'invalid',
  };
}

function parseMenuDefinitions(
  rawMenus: unknown[],
  errors: ImportError[],
): MenuDefinition[] {
  const parsedMenus: MenuDefinition[] = [];

  rawMenus.forEach((rawMenu, index) => {
    try {
      const normalizedMenu = normalizeRawMenu(rawMenu);
      parsedMenus.push(MenuDefinitionSchema.parse(normalizedMenu));
    } catch (error) {
      if (error instanceof ZodError) {
        appendIssuesFromZod(error, errors, `context_menus[${index}]`);
        return;
      }

      errors.push({
        type: 'validation',
        field: `context_menus[${index}]`,
        message: error instanceof Error ? error.message : 'Menu inválido',
      });
    }
  });

  return parsedMenus;
}

async function ensureImportCategory(warnings: string[]): Promise<number> {
  const existingCategory = await db.categories.where('name').equals('Importados').first();
  if (existingCategory?.id) {
    return existingCategory.id;
  }

  try {
    const savedRemote = await saveCategoryToSupabase({
      name: 'Importados',
      icon: '📥',
      color: '#6366f1',
    });

    return (await db.categories.add({
      name: 'Importados',
      icon: '📥',
      color: '#6366f1',
      remoteId: savedRemote.id,
      createdAt: new Date(),
      syncStatus: 'synced',
    })) as number;
  } catch {
    warnings.push('Categoria "Importados" salva localmente. Sincronize ao fazer login.');
    return (await db.categories.add({
      name: 'Importados',
      icon: '📥',
      color: '#6366f1',
      createdAt: new Date(),
      syncStatus: 'pending',
    })) as number;
  }
}

async function buildImportState(
  rawJson: string,
  sourceName = 'clipboard.json',
  mergeStrategyOverride?: MemoryMergeStrategy,
): Promise<BuiltImportState> {
  const warnings: string[] = [];
  const errors: ImportError[] = [];

  if (!sourceName.endsWith('.json')) {
    errors.push({
      type: 'processing',
      field: 'general',
      message: 'Apenas arquivos .json são aceitos',
    });
    return {
      canonical: normalizeToCanonicalPayload({}),
      parsedMenus: [],
      preparedPrompts: [],
      warnings,
      errors,
      plan: {
        detectedFormat: 'invalid',
        schemaVersion: '1.1.0',
        menusToCreate: [],
        menusToUpdate: [],
        promptsToCreate: [],
        promptsToUpdate: [],
        memoryToCreate: [],
        memoryToUpdate: [],
        memoryToPreserve: [],
        memoryToIgnore: [],
        conflicts: [],
        warnings: [],
        errors: [{ path: 'general', message: 'Apenas arquivos .json são aceitos' }],
      },
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(sanitizeJsonString(rawJson)) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao analisar JSON';
    errors.push({
      type: 'processing',
      field: 'general',
      message,
    });
    return {
      canonical: normalizeToCanonicalPayload({}),
      parsedMenus: [],
      preparedPrompts: [],
      warnings,
      errors,
      plan: {
        detectedFormat: 'invalid',
        schemaVersion: '1.1.0',
        menusToCreate: [],
        menusToUpdate: [],
        promptsToCreate: [],
        promptsToUpdate: [],
        memoryToCreate: [],
        memoryToUpdate: [],
        memoryToPreserve: [],
        memoryToIgnore: [],
        conflicts: [],
        warnings: [],
        errors: [{ path: 'general', message }],
      },
    };
  }

  const canonical = normalizeToCanonicalPayload(parsed);
  if (canonical.sourceFormat === 'invalid') {
    errors.push({
      type: 'validation',
      field: 'general',
      message: 'Formato de importação inválido ou não reconhecido',
    });
  }
  if (canonical.sourceFormat === 'legacy-bulk-export') {
    pushUniqueWarning(warnings, getBulkExportWarning(canonical.version || '0.0.0'));
  }

  const parsedMenus = parseMenuDefinitions(canonical.contextMenus, errors);
  const menuIdSet = new Set<string>();
  parsedMenus.forEach((menu, index) => {
    if (menuIdSet.has(menu.menu_id)) {
      errors.push({
        type: 'conflict',
        field: `context_menus[${index}].menu_id`,
        message: 'Menu id deve ser único',
      });
    }
    menuIdSet.add(menu.menu_id);
  });

  const existingMenus = await db.contextMenus.toArray();
  const existingMenuDefinitions = existingMenus
    .filter((menu) => !menu.isDeleted)
    .map((menu) => contextMenuToDefinition(menu));
  const availableMenuDefinitions = [
    ...existingMenuDefinitions,
    ...parsedMenus,
  ];

  const existingPrompts = await db.prompts.toArray();
  const existingPromptByTemplateId = new Map(
    existingPrompts
      .filter((prompt) => !prompt.isDeleted)
      .map((prompt) => [prompt.promptPayload.meta.template_id, prompt]),
  );

  const preparedPrompts: PreparedPrompt[] = [];
  const promptTemplateIds = new Set<string>();

  for (let index = 0; index < canonical.prompts.length; index += 1) {
    const promptImport = canonical.prompts[index];

    try {
      const parsedPrompt = parseTemplatePayload(promptImport.rawPrompt);
      const requestedMenuIds = Array.from(new Set([
        ...(parsedPrompt.menu_ids || []),
        ...(parsedPrompt.menu_definitions || []).map((menu) => menu.menu_id),
      ]));

      requestedMenuIds.forEach((menuId) => {
        const available = availableMenuDefinitions.some((menu) => menu.menu_id === menuId) ||
          parsedPrompt.menu_definitions.some((menu) => menu.menu_id === menuId);
        if (!available) {
          errors.push({
            type: 'validation',
            field: `prompts[${index}].menu_ids`,
            message: `Menu inexistente referenciado: ${menuId}`,
          });
        }
      });

      const syncedPrompt = syncTemplateWithMenuDefinitions(
        parsedPrompt,
        [...availableMenuDefinitions, ...parsedPrompt.menu_definitions],
      );
      const migration = migrateTemplateToCurrentSchema(syncedPrompt);
      migration.warnings.forEach((warning) => pushUniqueWarning(warnings, warning));
      pushUniqueWarning(warnings, getPromptSchemaWarning(migration.template.meta.schema_version));

      const templateId = migration.template.meta.template_id;
      if (promptTemplateIds.has(templateId)) {
        errors.push({
          type: 'conflict',
          field: `prompts[${index}].meta.template_id`,
          message: 'template_id duplicado no arquivo importado',
        });
        continue;
      }
      promptTemplateIds.add(templateId);

      const placeholderKeys = listMemoryPlaceholderKeys(migration.template);
      const memoryContext = migration.template.prompt_memory_context;
      const memoryEntries = memoryContext?.entries || [];
      const memoryKeys = new Set(memoryEntries.map((entry) => entry.key));

      placeholderKeys.forEach((key) => {
        if (!memoryKeys.has(key)) {
          errors.push({
            type: 'validation',
            field: `prompts[${index}].prompt_memory_context.entries`,
            message: `Variável de memória obrigatória ausente para placeholder: ${key}`,
          });
        }
      });

      const memoryPlan = memoryContext?.enabled
        ? await planMemoryUpserts(
            templateId,
            memoryEntries,
            (mergeStrategyOverride || memoryContext.merge_strategy || 'preserve_existing') as MemoryMergeStrategy,
          )
        : [];

      preparedPrompts.push({
        categoryName: promptImport.category,
        promptPayload: migration.template,
        existingPrompt: existingPromptByTemplateId.get(templateId),
        memoryPlan,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        appendIssuesFromZod(error, errors, `prompts[${index}]`);
        continue;
      }

      errors.push({
        type: 'validation',
        field: `prompts[${index}]`,
        message: error instanceof Error ? error.message : 'Formato de prompt inválido',
      });
    }
  }

  const plan: ImportPlanSummary = {
    detectedFormat: canonical.sourceFormat,
    schemaVersion: canonical.schemaVersion,
    menusToCreate: parsedMenus
      .filter((menu) => !existingMenus.some((existing) => existing.menuId === menu.menu_id && !existing.isDeleted))
      .map((menu) => menu.menu_id),
    menusToUpdate: parsedMenus
      .filter((menu) => existingMenus.some((existing) => existing.menuId === menu.menu_id && !existing.isDeleted))
      .map((menu) => menu.menu_id),
    promptsToCreate: preparedPrompts
      .filter((prompt) => !prompt.existingPrompt)
      .map((prompt) => prompt.promptPayload.meta.template_id),
    promptsToUpdate: preparedPrompts
      .filter((prompt) => !!prompt.existingPrompt)
      .map((prompt) => prompt.promptPayload.meta.template_id),
    memoryToCreate: preparedPrompts.flatMap((prompt) =>
      prompt.memoryPlan
        .filter((item) => item.action === 'create')
        .map((item) => `${item.templateId}:${item.key}`),
    ),
    memoryToUpdate: preparedPrompts.flatMap((prompt) =>
      prompt.memoryPlan
        .filter((item) => item.action === 'update')
        .map((item) => `${item.templateId}:${item.key}`),
    ),
    memoryToPreserve: preparedPrompts.flatMap((prompt) =>
      prompt.memoryPlan
        .filter((item) => item.action === 'preserve')
        .map((item) => `${item.templateId}:${item.key}`),
    ),
    memoryToIgnore: preparedPrompts.flatMap((prompt) =>
      prompt.memoryPlan
        .filter((item) => item.action === 'ignore')
        .map((item) => `${item.templateId}:${item.key}`),
    ),
    conflicts: errors
      .filter((error) => error.type === 'conflict')
      .map((error) => ({ path: error.field, code: 'conflict', message: error.message })),
    warnings: warnings.map((warning) => ({ message: warning })),
    errors: errors.map((error) => ({ path: error.field, message: error.message })),
  };

  return {
    canonical,
    parsedMenus,
    preparedPrompts,
    warnings,
    errors,
    plan,
  };
}

function buildPromptRecord(
  promptPayload: PromptContract,
  categoryId: number,
  selectedMenuIds: number[],
  fixedVariables: Record<string, string>,
  existingPrompt?: Prompt,
): Prompt {
  const summary = promptPayload.meta;
  const now = new Date();

  return {
    id: existingPrompt?.id,
    remoteId: existingPrompt?.remoteId,
    syncStatus: 'pending',
    isDeleted: false,
    categoryId,
    title: summary.template_name,
    selectedMenuIds,
    promptPayload,
    selectionPayload: {
      template_id: promptPayload.meta.template_id,
      selected_menus: [],
      free_inputs: {},
      fixed_variables: fixedVariables,
    },
    schemaVersion: promptPayload.meta.schema_version,
    language: promptPayload.meta.language,
    outputFormat: promptPayload.output_contract.format,
    fewShotExamples: promptPayload.prompt_definition.few_shot_examples,
    createdAt: existingPrompt?.createdAt || now,
    updatedAt: now,
  };
}

async function resolveCategoryIdMap(preparedPrompts: PreparedPrompt[], warnings: string[]) {
  const importCategoryId = await ensureImportCategory(warnings);
  const categoryNames = Array.from(
    new Set(
      preparedPrompts
        .map((prompt) => prompt.categoryName)
        .filter((category): category is string => typeof category === 'string' && category.trim() !== ''),
    ),
  );
  const categoryMap = new Map<string, number>();

  if (categoryNames.length > 0) {
    const existingCategories = await db.categories.where('name').anyOf(categoryNames).toArray();
    existingCategories.forEach((category) => {
      if (category.id) {
        categoryMap.set(category.name, category.id);
      }
    });
  }

  return { importCategoryId, categoryMap };
}

export async function parseImportData(
  rawJson: string,
  sourceName = 'clipboard.json',
  mergeStrategyOverride?: MemoryMergeStrategy,
): Promise<ImportPreviewData> {
  const builtState = await buildImportState(rawJson, sourceName, mergeStrategyOverride);

  return {
    detectedFormat: builtState.canonical.sourceFormat,
    schemaVersion: builtState.canonical.schemaVersion,
    prompts: builtState.preparedPrompts.map((prompt) => ({
      title: prompt.promptPayload.meta.template_name,
      description: prompt.promptPayload.prompt_definition.task,
      category: prompt.categoryName,
      action: prompt.existingPrompt ? 'update' : 'create',
    })),
    menus: builtState.parsedMenus.map((menu) => ({
      menuName: menu.menu_name,
      menuId: menu.menu_id,
      action: builtState.plan.menusToUpdate.includes(menu.menu_id) ? 'update' : 'create',
    })),
    memory: builtState.preparedPrompts.flatMap((prompt) =>
      prompt.memoryPlan.map((item) => ({
        key: item.key,
        templateId: item.templateId,
        action: item.action,
      })),
    ),
    warnings: builtState.warnings,
    errors: builtState.errors,
    plan: builtState.plan,
  };
}

export async function importFromFile(file: File): Promise<ImportResult> {
  return importFromJsonText(await file.text(), file.name);
}

export async function importFromJsonText(
  rawJson: string,
  sourceName = 'clipboard.json',
  mergeStrategyOverride?: MemoryMergeStrategy,
): Promise<ImportResult> {
  const startTime = Date.now();

  try {
    const builtState = await buildImportState(rawJson, sourceName, mergeStrategyOverride);
    if (builtState.errors.length > 0) {
      return {
        success: false,
        count: 0,
        errors: builtState.errors,
        warnings: builtState.warnings,
        processingTime: Date.now() - startTime,
        plan: builtState.plan,
        importedMenus: 0,
        importedPrompts: 0,
        importedMemory: 0,
      };
    }

    const { importCategoryId, categoryMap } = await resolveCategoryIdMap(
      builtState.preparedPrompts,
      builtState.warnings,
    );
    const existingMenus = await db.contextMenus.toArray();
    const existingMenuByMenuId = new Map(existingMenus.map((menu) => [menu.menuId, menu]));
    const menuRecords = builtState.parsedMenus.map((menu) => {
      const existing = existingMenuByMenuId.get(menu.menu_id);
      const now = new Date();
      return {
        id: existing?.id,
        remoteId: existing?.remoteId,
        syncStatus: 'pending' as const,
        isDeleted: false,
        menuId: menu.menu_id,
        menuName: menu.menu_name,
        description: menu.description,
        selectionMode: menu.selection_mode,
        options: menu.options.map((option) => ({
          label: option.label,
          value: option.value,
          description: option.description,
          subOptions: option.sub_options.map((subOption) => ({
            label: subOption.label,
            value: subOption.value,
            description: subOption.description,
          })),
        })),
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      } satisfies ContextMenu;
    });

    let importedMenus = 0;
    let importedPrompts = 0;
    let importedMemory = 0;

    await db.transaction('rw', db.categories, db.contextMenus, db.prompts, db.promptMemory, async () => {
      if (menuRecords.length > 0) {
        await db.contextMenus.bulkPut(menuRecords);
        importedMenus = menuRecords.length;
      }

      const persistedMenus = await db.contextMenus.toArray();
      const menuIdToLocalId = new Map(
        persistedMenus
          .filter((menu) => typeof menu.id === 'number')
          .map((menu) => [menu.menuId, menu.id as number]),
      );

      const promptRecords = builtState.preparedPrompts.map((preparedPrompt) => {
        const promptCategoryId =
          (preparedPrompt.categoryName && categoryMap.get(preparedPrompt.categoryName)) ||
          preparedPrompt.existingPrompt?.categoryId ||
          importCategoryId;
        const selectedMenuIds = preparedPrompt.promptPayload.menu_ids
          .map((menuId) => menuIdToLocalId.get(menuId))
          .filter((menuId): menuId is number => typeof menuId === 'number');
        const fixedVariables = Object.fromEntries(
          (preparedPrompt.promptPayload.prompt_memory_context?.entries || []).map((entry) => [
            entry.key,
            entry.value,
          ]),
        );

        return buildPromptRecord(
          preparedPrompt.promptPayload,
          promptCategoryId,
          selectedMenuIds,
          fixedVariables,
          preparedPrompt.existingPrompt,
        );
      });

      if (promptRecords.length > 0) {
        await db.prompts.bulkPut(promptRecords);
        importedPrompts = promptRecords.length;
      }

      const allMemoryPlanItems = builtState.preparedPrompts.flatMap((prompt) => prompt.memoryPlan);
      if (allMemoryPlanItems.length > 0) {
        await applyMemoryPlan(allMemoryPlanItems);
        importedMemory = allMemoryPlanItems.filter((item) =>
          item.action === 'create' || item.action === 'update'
        ).length;
      }
    });

    if (importedMenus > 0) {
      builtState.warnings.push('Menus importados localmente. A sincronização com a nuvem ocorrerá em segundo plano.');
    }
    if (importedPrompts > 0) {
      builtState.warnings.push('Prompts importados localmente. A sincronização com a nuvem ocorrerá em segundo plano.');
    }

    if (importedMenus > 0 || importedPrompts > 0 || importedMemory > 0) {
      await saveLocalBackup();
    }

    return {
      success: true,
      count: importedPrompts,
      errors: [],
      warnings: Array.from(new Set(builtState.warnings)),
      processingTime: Date.now() - startTime,
      plan: builtState.plan,
      importedMenus,
      importedPrompts,
      importedMemory,
    };
  } catch (error) {
    return {
      success: false,
      count: 0,
      errors: [
        {
          type: 'processing',
          field: 'general',
          message: error instanceof Error ? error.message : 'Erro desconhecido durante a importação',
        },
      ],
      warnings: [],
      processingTime: Date.now() - startTime,
      importedMenus: 0,
      importedPrompts: 0,
      importedMemory: 0,
    };
  }
}

export function getImportStats(result: ImportResult): string {
  const duration = (result.processingTime / 1000).toFixed(2);
  const errorCount = result.errors.length;
  const warningCount = result.warnings.length;

  let stats = `Importação concluída em ${duration}s\n`;
  stats += `✓ ${result.importedPrompts ?? result.count} prompt(s) processado(s)\n`;
  stats += `✓ ${result.importedMenus ?? 0} menu(s) processado(s)\n`;
  stats += `✓ ${result.importedMemory ?? 0} memória(s) processada(s)\n`;

  if (errorCount > 0) {
    stats += `✗ ${errorCount} erro(s) encontrados\n`;
  }

  if (warningCount > 0) {
    stats += `⚠ ${warningCount} aviso(s)\n`;
  }

  return stats;
}
