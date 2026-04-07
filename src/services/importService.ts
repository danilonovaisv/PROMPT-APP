import { db } from '@/db/database';
import {
  MenuDefinitionSchema,
  PromptContractSchema,
  parsePromptPayload,
  getPrimaryReferenceUrl,
  getPromptSummaryFields,
  type PromptContract,
} from '@/models/promptSchema';
import type { ContextMenu, Prompt } from '@/models/types';
import { saveCategoryToSupabase } from '@/services/supabaseCategories';
import { saveMenuToSupabase } from '@/services/supabaseMenus';
import { saveLocalBackup } from '@/utils/backupManager';
import { syncTemplateWithMenuDefinitions } from '@/utils/promptArtifacts';
import { getBulkExportWarning, getPromptSchemaWarning } from '@/utils/schemaCompatibility';
import { migrateTemplateToCurrentSchema } from '@/utils/templateMigration';

export interface ImportError {
  type: 'validation' | 'processing' | 'network' | 'conflict';
  field: string;
  message: string;
  data?: unknown;
}

export interface ImportResult {
  success: boolean;
  count: number;
  errors: ImportError[];
  warnings: string[];
  processingTime: number;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isBulkExport(value: unknown): value is {
  app: string;
  version?: string;
  prompts: Array<{ title?: string; category?: string; prompt: unknown }>;
  menuDefinitions?: unknown[];
  contextMenus?: unknown[];
} {
  return isObject(value) && Array.isArray(value.prompts);
}

function pushUniqueWarning(warnings: string[], warning: string | null) {
  if (!warning || warnings.includes(warning)) return;
  warnings.push(warning);
}

function parsePromptContract(value: unknown): PromptContract {
  const parsed = PromptContractSchema.safeParse(value);
  if (parsed.success) {
    return parsed.data;
  }
  return parsePromptPayload(value);
}

function normalizeBulkMenuDefinition(menu: unknown): unknown {
  if (!isObject(menu)) return menu;

  if (typeof menu.menu_id === 'string' && typeof menu.menu_name === 'string') {
    return {
      ...menu,
      required: typeof menu.required === 'boolean' ? menu.required : false,
    };
  }

  if (typeof menu.menuId === 'string' && typeof menu.menuName === 'string') {
    return {
      menu_id: menu.menuId,
      menu_name: menu.menuName,
      description: typeof menu.description === 'string' ? menu.description : '',
      selection_mode: typeof menu.selectionMode === 'string' ? menu.selectionMode : 'single',
      required: false,
      options: Array.isArray(menu.options)
        ? menu.options.map((option) =>
            isObject(option)
              ? {
                  value: typeof option.value === 'string' ? option.value : '',
                  label: typeof option.label === 'string' ? option.label : '',
                  description: typeof option.description === 'string' ? option.description : '',
                  sub_options: Array.isArray(option.subOptions)
                    ? option.subOptions.map((subOption) =>
                        isObject(subOption)
                          ? {
                              value: typeof subOption.value === 'string' ? subOption.value : '',
                              label: typeof subOption.label === 'string' ? subOption.label : '',
                              description:
                                typeof subOption.description === 'string'
                                  ? subOption.description
                                  : '',
                            }
                          : subOption
                      )
                    : [],
                }
              : option
          )
        : [],
    };
  }

  return menu;
}

function buildPromptRecord(promptPayload: PromptContract, categoryId: number): Omit<Prompt, 'id'> {
  const summary = getPromptSummaryFields(promptPayload);
  const now = new Date();

  return {
    categoryId,
    title: summary.title,
    promptPayload,
    schemaVersion: summary.schemaVersion,
    language: summary.language,
    outputFormat: summary.outputFormat,
    referenceUrl: getPrimaryReferenceUrl(promptPayload),
    fewShotExamples: [],
    createdAt: now,
    updatedAt: now,
  };
}

function definitionToContextMenu(definition: unknown): Omit<ContextMenu, 'id'> {
  const parsed = MenuDefinitionSchema.parse(definition);
  const now = new Date();

  return {
    menuId: parsed.menu_id,
    menuName: parsed.menu_name,
    description: parsed.description,
    selectionMode: parsed.selection_mode,
    options: parsed.options.map((option) => ({
      value: option.value,
      label: option.label,
      subOptions: option.sub_options.map((subOption) => ({
        value: subOption.value,
        label: subOption.label,
      })),
    })),
    createdAt: now,
    updatedAt: now,
  };
}

async function importMenuDefinitions(
  menuDefinitions: unknown[],
  errors: ImportError[],
  warnings: string[]
): Promise<number> {
  let count = 0;

  const existingMenus = await db.contextMenus.toArray();
  const existingMenuIds = new Set(existingMenus.map((m) => m.menuId));
  const menusToPut: ContextMenu[] = [];

  for (const definition of menuDefinitions) {
    try {
      const contextMenu = definitionToContextMenu(definition);
      if (existingMenuIds.has(contextMenu.menuId)) {
        continue;
      }

      menusToPut.push({
        ...contextMenu,
        syncStatus: 'pending',
      } as ContextMenu);
      existingMenuIds.add(contextMenu.menuId);
    } catch (e: unknown) {
      const error = e as Error;
      errors.push({
        type: 'processing',
        field: 'menu_definition',
        message: error.message || 'Falha ao importar definição de menu',
        data: definition,
      });
    }
  }

  // ⚡ Bolt Optimization: Use bulkPut to avoid N+1 database writes in Dexie.js
  if (menusToPut.length > 0) {
    const localIds = await db.contextMenus.bulkPut(menusToPut, { allKeys: true });

    // Maintain immediate Supabase synchronization
    for (let i = 0; i < menusToPut.length; i++) {
      const contextMenu = menusToPut[i];
      const localId = localIds[i] as number | undefined;

      try {
        const savedRemote = await saveMenuToSupabase(contextMenu);
        if (localId) {
          await db.contextMenus.update(localId, {
            remoteId: savedRemote.id,
            syncStatus: 'synced',
          });
        }
      } catch {
        warnings.push(`Menu "${contextMenu.menuName}" salvo localmente. Sincronize ao fazer login.`);
      }
      count++;
    }
  }

  return count;
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

function buildPromptRecordFromRaw(
  rawPrompt: unknown,
  categoryId: number,
  errors: ImportError[],
  warnings: string[],
  importedMenuDefinitions: PromptContract['menu_definitions'] = []
): Omit<Prompt, 'id'> | null {
  try {
    const migration = migrateTemplateToCurrentSchema(
      syncTemplateWithMenuDefinitions(
        parsePromptContract(rawPrompt),
        importedMenuDefinitions
      )
    );
    const promptPayload = migration.template;
    migration.warnings.forEach((warning) => pushUniqueWarning(warnings, warning));
    pushUniqueWarning(warnings, getPromptSchemaWarning(promptPayload.meta.schema_version));
    return {
      ...buildPromptRecord(promptPayload, categoryId),
      syncStatus: 'pending',
    };
  } catch (e: unknown) {
    const error = e as Error;
    errors.push({
      type: 'validation',
      field: 'prompt',
      message: error.message || 'Formato de prompt inválido',
      data: rawPrompt,
    });
    return null;
  }
}

export async function importFromFile(file: File): Promise<ImportResult> {
  return importFromJsonText(await file.text(), file.name);
}

export async function importFromJsonText(
  rawJson: string,
  sourceName = 'clipboard.json'
): Promise<ImportResult> {
  const startTime = Date.now();
  const errors: ImportError[] = [];
  const warnings: string[] = [];
  let count = 0;

  // Função interna para sanitizar o JSON removendo artefatos e lixo no início/fim
  const sanitizeJsonString = (jsonStr: string): string => {
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
        const isObject = cleaned[startIndex] === '{';
        const closingChar = isObject ? '}' : ']';
        const lastIndex = cleaned.lastIndexOf(closingChar);
        if (lastIndex !== -1 && lastIndex >= startIndex) {
            return cleaned.substring(startIndex, lastIndex + 1);
        }
    }
    return cleaned;
  };

  try {
    if (!sourceName.endsWith('.json')) {
      throw new Error('Apenas arquivos .json são aceitos');
    }

    const sanitizedStr = sanitizeJsonString(rawJson);
    const parsed = JSON.parse(sanitizedStr) as unknown;
    const importCategoryId = await ensureImportCategory(warnings);

    if (isBulkExport(parsed)) {
      pushUniqueWarning(warnings, getBulkExportWarning(parsed.version || '0.0.0'));
      const menuDefinitions = Array.isArray(parsed.menuDefinitions)
        ? parsed.menuDefinitions.map(normalizeBulkMenuDefinition)
        : Array.isArray(parsed.contextMenus)
          ? parsed.contextMenus.map(normalizeBulkMenuDefinition)
          : [];
      const parsedMenuDefinitions = menuDefinitions.flatMap((definition) => {
        const parsedDefinition = MenuDefinitionSchema.safeParse(definition);
        return parsedDefinition.success ? [parsedDefinition.data] : [];
      });

      if (menuDefinitions.length > 0) {
        await importMenuDefinitions(menuDefinitions, errors, warnings);
      }

      // ⚡ Bolt Optimization:
      // Pre-fetch categories used in this bulk import to eliminate N+1 query problem.
      // Instead of querying `db.categories.where('name').equals(item.category).first()` in a loop,
      // we do a single batch query using `.anyOf()` and cache the category IDs in a Map.
      const categoryNames = Array.from(
        new Set(
          parsed.prompts
            .map((item) => item.category)
            .filter((cat): cat is string => typeof cat === 'string' && cat.trim() !== '')
        )
      );

      const categoryCache = new Map<string, number>();
      if (categoryNames.length > 0) {
        const existingCategories = await db.categories.where('name').anyOf(categoryNames).toArray();
        for (const cat of existingCategories) {
          if (cat.id) {
            categoryCache.set(cat.name, cat.id);
          }
        }
      }

      const promptsToInsert: Omit<Prompt, 'id'>[] = [];
      for (const item of parsed.prompts) {
        let categoryId = importCategoryId;

        if (item.category) {
          const cachedId = categoryCache.get(item.category);
          if (cachedId) {
            categoryId = cachedId;
          }
        }

        const promptRecord = buildPromptRecordFromRaw(
          item.prompt,
          categoryId,
          errors,
          warnings,
          parsedMenuDefinitions
        );
        if (promptRecord) {
          promptsToInsert.push(promptRecord);
        }
      }

      if (promptsToInsert.length > 0) {
        // ⚡ Bolt Optimization:
        // Replaced N+1 individual db.prompts.add() calls with a single bulkAdd() operation.
        // Cloud synchronization is deferred to the background syncService by setting syncStatus to 'pending',
        // preventing blocking network requests and rate limits during bulk import.
        await db.prompts.bulkAdd(promptsToInsert as any);
        count += promptsToInsert.length;
        warnings.push('Prompts importados localmente. A sincronização com a nuvem ocorrerá em segundo plano.');
      }
    } else if (Array.isArray(parsed)) {
      const promptsToInsert: Omit<Prompt, 'id'>[] = [];
      for (const item of parsed) {
        const promptRecord = buildPromptRecordFromRaw(item, importCategoryId, errors, warnings);
        if (promptRecord) {
          promptsToInsert.push(promptRecord);
        }
      }
      if (promptsToInsert.length > 0) {
        await db.prompts.bulkAdd(promptsToInsert as Prompt[]);
        count += promptsToInsert.length;
        warnings.push('Prompts importados localmente. A sincronização com a nuvem ocorrerá em segundo plano.');
      }
    } else {
       const promptRecord = buildPromptRecordFromRaw(parsed, importCategoryId, errors, warnings);
      if (promptRecord) {
        await db.prompts.add(promptRecord as Prompt);
        count = 1;
        warnings.push('Prompt importado localmente. A sincronização com a nuvem ocorrerá em segundo plano.');
      }
    }

    if (count > 0) {
      await saveLocalBackup();
    }

    return {
      success: errors.length === 0,
      count,
      errors,
      warnings,
      processingTime: Date.now() - startTime,
    };
  } catch (e: unknown) {
    const error = e as Error;
    return {
      success: false,
      count: 0,
      errors: [
        {
          type: 'processing',
          field: 'general',
          message: error.message || 'Erro desconhecido durante a importação',
        },
      ],
      warnings,
      processingTime: Date.now() - startTime,
    };
  }
}

export function getImportStats(result: ImportResult): string {
  const duration = (result.processingTime / 1000).toFixed(2);
  const errorCount = result.errors.length;
  const warningCount = result.warnings.length;

  let stats = `Importação concluída em ${duration}s\n`;
  stats += `✓ ${result.count} prompts importados com sucesso\n`;

  if (errorCount > 0) {
    stats += `✗ ${errorCount} erro(s) encontrados\n`;
  }

  if (warningCount > 0) {
    stats += `⚠ ${warningCount} aviso(s)\n`;
  }

  return stats;
}
