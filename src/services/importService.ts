import { db } from '@/db/database';
import {
  MenuDefinitionSchema,
  PromptContractSchema,
  createPromptPayloadFromLegacyRecord,
  getPrimaryReferenceUrl,
  getPromptSummaryFields,
  type PromptContract,
} from '@/models/promptSchema';
import type { ContextMenu, Prompt } from '@/models/types';
import { saveCategoryToSupabase } from '@/services/supabaseCategories';
import { saveMenuToSupabase } from '@/services/supabaseMenus';
import { savePromptToSupabase } from '@/services/supabasePrompts';
import { saveLocalBackup } from '@/utils/backupManager';

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
  prompts: Array<{ title?: string; category?: string; prompt: unknown }>;
  menuDefinitions?: unknown[];
  contextMenus?: unknown[];
} {
  return isObject(value) && Array.isArray(value.prompts);
}

function parsePromptContract(value: unknown): PromptContract {
  const parsed = PromptContractSchema.safeParse(value);
  if (parsed.success) {
    return parsed.data;
  }

  if (isObject(value)) {
    return createPromptPayloadFromLegacyRecord({
      title: typeof value.title === 'string' ? value.title : '',
      systemRole: typeof value.system_role === 'string'
        ? value.system_role
        : typeof value.systemRole === 'string'
          ? value.systemRole
          : '',
      task: typeof value.task === 'string' ? value.task : '',
      context: isObject(value.input_data) && typeof value.input_data.context === 'string'
        ? value.input_data.context
        : typeof value.context === 'string'
          ? value.context
          : '',
      contextMenus: isObject(value.input_data) && isObject(value.input_data.menus_selecionados)
        ? Object.fromEntries(
            Object.entries(value.input_data.menus_selecionados).map(([group, selected]) => {
              if (typeof selected === 'string') {
                return [group, { option: selected, subOptions: [] }];
              }

              const normalized = isObject(selected)
                ? {
                    option: typeof selected.opcao === 'string' ? selected.opcao : '',
                    subOptions: Array.isArray(selected.sub_opcoes)
                      ? selected.sub_opcoes.filter((sub): sub is string => typeof sub === 'string')
                      : [],
                  }
                : { option: '', subOptions: [] };

              return [group, normalized];
            })
          )
        : undefined,
      enabledMenuIds:
        isObject(value.input_data) && isObject(value.input_data.menus_selecionados)
          ? Object.keys(value.input_data.menus_selecionados)
          : undefined,
      constraints: Array.isArray(value.constraints)
        ? value.constraints.filter((item): item is string => typeof item === 'string')
        : [],
      negativePrompt: Array.isArray(value.negative_prompt)
        ? value.negative_prompt.filter((item): item is string => typeof item === 'string')
        : [],
      outputSchema: isObject(value.output_schema)
        ? {
            formato: typeof value.output_schema.formato === 'string' ? value.output_schema.formato : 'markdown',
            estrutura: typeof value.output_schema.estrutura === 'string' ? value.output_schema.estrutura : '',
          }
        : undefined,
      referenceUrl:
        isObject(value.input_data) && typeof value.input_data.reference_url === 'string'
          ? value.input_data.reference_url
          : undefined,
    });
  }

  throw new Error('Formato de prompt inválido');
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
    menuId: parsed.id,
    menuName: parsed.label,
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

  for (const definition of menuDefinitions) {
    try {
      const contextMenu = definitionToContextMenu(definition);
      const existing = await db.contextMenus.where('menuId').equals(contextMenu.menuId).first();
      if (existing) {
        continue;
      }

      await db.contextMenus.add({
        ...contextMenu,
        syncStatus: 'pending',
      } as ContextMenu);

      try {
        const savedRemote = await saveMenuToSupabase(contextMenu);
        const localMenu = await db.contextMenus.where('menuId').equals(contextMenu.menuId).first();
        if (localMenu?.id) {
          await db.contextMenus.update(localMenu.id, {
            remoteId: savedRemote.id,
            syncStatus: 'synced',
          });
        }
      } catch {
        warnings.push(`Menu "${contextMenu.menuName}" salvo localmente. Sincronize ao fazer login.`);
      }

      count++;
    } catch (error: any) {
      errors.push({
        type: 'processing',
        field: 'menu_definition',
        message: error.message || 'Falha ao importar definição de menu',
        data: definition,
      });
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

async function processPromptImport(
  rawPrompt: unknown,
  categoryId: number,
  errors: ImportError[],
  warnings: string[]
): Promise<boolean> {
  try {
    const promptPayload = parsePromptContract(rawPrompt);
    const promptRecord = buildPromptRecord(promptPayload, categoryId);
    const localId = await db.prompts.add({
      ...promptRecord,
      syncStatus: 'pending',
    } as Prompt);

    try {
      const savedRemote = await savePromptToSupabase(promptRecord);
      await db.prompts.update(localId, {
        remoteId: savedRemote.id,
        syncStatus: 'synced',
      });
    } catch {
      warnings.push(`Prompt "${promptRecord.title}" salvo localmente. Sincronize ao fazer login.`);
    }

    return true;
  } catch (error: any) {
    errors.push({
      type: 'validation',
      field: 'prompt',
      message: error.message || 'Formato de prompt inválido',
      data: rawPrompt,
    });
    return false;
  }
}

export async function importFromFile(file: File): Promise<ImportResult> {
  const startTime = Date.now();
  const errors: ImportError[] = [];
  const warnings: string[] = [];
  let count = 0;

  try {
    if (!file.name.endsWith('.json')) {
      throw new Error('Apenas arquivos .json são aceitos');
    }

    const parsed = JSON.parse(await file.text()) as unknown;
    const importCategoryId = await ensureImportCategory(warnings);

    if (isBulkExport(parsed)) {
      const menuDefinitions = Array.isArray(parsed.menuDefinitions)
        ? parsed.menuDefinitions
        : Array.isArray(parsed.contextMenus)
          ? parsed.contextMenus.map((menu) =>
              isObject(menu)
                ? {
                    id: menu.menuId,
                    label: menu.menuName,
                    description: menu.description,
                    selection_mode: menu.selectionMode || 'single',
                    options: Array.isArray(menu.options)
                      ? menu.options.map((option) => ({
                          value: isObject(option) ? option.value : '',
                          label: isObject(option) ? option.label : '',
                          sub_options:
                            isObject(option) && Array.isArray(option.subOptions)
                              ? option.subOptions.map((subOption) => ({
                                  value: isObject(subOption) ? subOption.value : '',
                                  label: isObject(subOption) ? subOption.label : '',
                                }))
                              : [],
                        }))
                      : [],
                  }
                : menu
            )
          : [];

      if (menuDefinitions.length > 0) {
        await importMenuDefinitions(menuDefinitions, errors, warnings);
      }

      for (const item of parsed.prompts) {
        let categoryId = importCategoryId;

        if (item.category) {
          const existingCategory = await db.categories.where('name').equals(item.category).first();
          if (existingCategory?.id) {
            categoryId = existingCategory.id;
          }
        }

        const success = await processPromptImport(item.prompt, categoryId, errors, warnings);
        if (success) {
          count++;
        }
      }
    } else if (Array.isArray(parsed)) {
      for (const item of parsed) {
        const success = await processPromptImport(item, importCategoryId, errors, warnings);
        if (success) {
          count++;
        }
      }
    } else {
      const success = await processPromptImport(parsed, importCategoryId, errors, warnings);
      if (success) {
        count = 1;
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
  } catch (error: any) {
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
