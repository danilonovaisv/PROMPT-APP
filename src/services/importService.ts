/* ======================================================
   Serviço de Importação Aprimorado
   ====================================================== */

import { db } from '@/db/database';
import { saveCategoryToSupabase } from '@/services/supabaseCategories';
import { saveMenuToSupabase } from '@/services/supabaseMenus';
import { savePromptToSupabase } from '@/services/supabasePrompts';
import { saveLocalBackup } from '@/utils/backupManager';
import type { Prompt, BulkExport, PromptExportFormat, ContextMenu, MenuSelectionsMap } from '@/models/types';

export interface ImportError {
  type: 'validation' | 'processing' | 'network' | 'conflict';
  field: string;
  message: string;
  data?: any;
}

export interface ImportResult {
  success: boolean;
  count: number;
  errors: ImportError[];
  warnings: string[];
  processingTime: number;
}

/**
 * Valida se o objeto é um PromptExportFormat válido
 */
function isValidPromptExport(obj: unknown): obj is PromptExportFormat {
  if (!obj || typeof obj !== 'object') return false;
  const p = obj as Record<string, unknown>;
  return (
    typeof p.system_role === 'string' &&
    typeof p.task === 'string' &&
    typeof p.input_data === 'object' &&
    p.input_data !== null
  );
}

/**
 * Valida se é um export em lote
 */
function isBulkExport(obj: unknown): obj is BulkExport {
  if (!obj || typeof obj !== 'object') return false;
  const b = obj as Record<string, unknown>;
  return b.app === 'Prompt App' && Array.isArray(b.prompts);
}

/**
 * Converte menus_selecionados do JSON para MenuSelectionsMap
 */
function parseMenuSelections(
  menus: Record<string, unknown> | undefined
): MenuSelectionsMap {
  if (!menus || typeof menus !== 'object') return {};

  const result: MenuSelectionsMap = {};

  for (const [key, value] of Object.entries(menus)) {
    if (typeof value === 'string') {
      // Formato v1: { tom: "formal" }
      if (value) {
        result[key] = { option: value, subOptions: [] };
      }
    } else if (value && typeof value === 'object') {
      // Formato v2: { tom: { opcao: "formal", sub_opcoes: [...] } }
      const v = value as Record<string, unknown>;
      result[key] = {
        option: (v.opcao as string) || '',
        subOptions: Array.isArray(v.sub_opcoes) ? v.sub_opcoes : [],
      };
    }
  }

  return result;
}

/**
 * Converte PromptExportFormat para Prompt interno
 */
function fromExportFormat(
  exported: PromptExportFormat,
  categoryId: number,
  title: string
): Omit<Prompt, 'id'> {
  const inputData = exported.input_data as Record<string, unknown> | undefined;
  const menusRaw = inputData?.menus_selecionados as Record<string, unknown> | undefined;
  const contextMenus = parseMenuSelections(menusRaw);

  return {
    categoryId,
    title,
    systemRole: exported.system_role || '',
    task: exported.task || '',
    context: (inputData?.context as string) || '',
    menus: {
      tom: '',
      publico: '',
      idioma: '',
      estilo: '',
    },
    contextMenus,
    enabledMenuIds: Object.keys(contextMenus),
    constraints: Array.isArray(exported.constraints) ? exported.constraints.filter(Boolean) : [],
    negativePrompt: Array.isArray(exported.negative_prompt) ? exported.negative_prompt.filter(Boolean) : [],
    outputSchema: {
      formato: (exported.output_schema?.formato as 'json' | 'texto' | 'markdown') || 'texto',
      estrutura: exported.output_schema?.estrutura || '',
    },
    fewShotExamples: Array.isArray(exported.few_shot_examples) ? exported.few_shot_examples : [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Importa menus de contexto de um export em lote
 */
async function importContextMenus(
  menus: ContextMenu[],
  errors: ImportError[],
  warnings: string[]
): Promise<number> {
  let count = 0;
  for (const menu of menus) {
    try {
      const existing = await db.contextMenus
        .where('menuId')
        .equals(menu.menuId)
        .first();
      
      if (!existing) {
        await db.contextMenus.add({
          ...menu,
          id: undefined,
          syncStatus: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        try {
          const savedRemote = await saveMenuToSupabase({
            ...menu,
            id: undefined,
          });
          const local = await db.contextMenus.where('menuId').equals(menu.menuId).first();
          if (local?.id) {
            await db.contextMenus.update(local.id, {
              remoteId: savedRemote.id,
              syncStatus: 'synced',
            });
          }
        } catch (error: any) {
          warnings.push(`Menu "${menu.menuName}" salvo localmente. Sincronize ao fazer login.`);
        }
        count++;
      }
    } catch (error: any) {
      errors.push({
        type: 'processing',
        field: `menu:${menu.menuId}`,
        message: `Erro ao importar menu "${menu.menuName}": ${error.message}`,
        data: menu
      });
    }
  }
  return count;
}

/**
 * Processa importação de prompts individuais
 */
async function processPromptImport(
  promptData: any,
  categoryId: number,
  title: string,
  errors: ImportError[],
  warnings: string[]
): Promise<boolean> {
  try {
    if (!isValidPromptExport(promptData)) {
      errors.push({
        type: 'validation',
        field: 'prompt_format',
        message: `Formato de prompt inválido: ${title}`,
        data: promptData
      });
      return false;
    }

    const internalPrompt = fromExportFormat(promptData, categoryId, title);
    
    // Validar campos obrigatórios
    if (!internalPrompt.title?.trim()) {
      errors.push({
        type: 'validation',
        field: 'title',
        message: 'Título do prompt é obrigatório',
        data: promptData
      });
      return false;
    }

    const localId = await db.prompts.add({ ...internalPrompt, syncStatus: 'pending' });

    try {
      const savedRemote = await savePromptToSupabase(internalPrompt);
      await db.prompts.update(localId, { remoteId: savedRemote.id, syncStatus: 'synced' });
    } catch (error: any) {
      warnings.push(`Prompt "${title}" salvo localmente. Sincronize ao fazer login.`);
    }
    return true;
  } catch (error: any) {
    errors.push({
      type: error.message?.includes('network') ? 'network' : 'processing',
      field: 'prompt_save',
      message: `Erro ao salvar prompt "${title}": ${error.message}`,
      data: promptData
    });
    return false;
  }
}

/**
 * Lê e importa um arquivo JSON de prompts com tratamento completo de erros
 */
export async function importFromFile(file: File): Promise<ImportResult> {
  const startTime = Date.now();
  const errors: ImportError[] = [];
  const warnings: string[] = [];
  let count = 0;

  try {
    // Validar tipo de arquivo
    if (!file.name.endsWith('.json')) {
      throw new Error('Apenas arquivos .json são aceitos');
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      warnings.push('Arquivo muito grande, a importação pode levar algum tempo');
    }

    const text = await file.text();
    
    // Validar JSON
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch (parseError: any) {
      throw new Error(`JSON inválido: ${parseError.message}`);
    }

    // Obter ou criar categoria padrão para importação
    let importCategoryId: number;
    const existingCategory = await db.categories
      .where('name')
      .equals('Importados')
      .first();
    
    if (existingCategory?.id) {
      importCategoryId = existingCategory.id;
    } else {
      try {
        const savedRemote = await saveCategoryToSupabase({
          name: 'Importados',
          icon: '📥',
          color: '#6366f1',
        });
        importCategoryId = (await db.categories.add({
          name: 'Importados',
          icon: '📥',
          color: '#6366f1',
          remoteId: savedRemote.id,
          createdAt: new Date(),
          syncStatus: 'synced',
        })) as number;
      } catch (err) {
        console.error("Erro ao criar categoria importada no supabase", err);
        importCategoryId = (await db.categories.add({
          name: 'Importados',
          icon: '📥',
          color: '#6366f1',
          createdAt: new Date(),
          syncStatus: 'pending',
        })) as number;
        warnings.push('Categoria "Importados" salva localmente. Sincronize ao fazer login.');
      }
    }

    // Processar diferentes formatos de importação
    if (isBulkExport(parsed)) {
      // Importar menus de contexto se existirem
      if (Array.isArray(parsed.contextMenus)) {
        const menuCount = await importContextMenus(parsed.contextMenus, errors, warnings);
        if (menuCount > 0) {
          console.log(`✅ ${menuCount} menus de contexto importados`);
        }
      }

      // Importação em lote
      for (const [index, item] of parsed.prompts.entries()) {
        try {
          if (!item.prompt || !isValidPromptExport(item.prompt)) {
            errors.push({
              type: 'validation',
              field: `prompt_${index}`,
              message: 'Formato de prompt inválido no item ' + (index + 1),
              data: item
            });
            continue;
          }

          // Tentar encontrar ou criar categoria pelo nome
          let catId = importCategoryId;
          if (item.category) {
            const cat = await db.categories
              .where('name')
              .equals(item.category)
              .first();
            if (cat?.id) {
              catId = cat.id;
            }
          }

          const title = item.title || `Prompt importado ${index + 1}`;
          const success = await processPromptImport(item.prompt, catId, title, errors, warnings);
          if (success) count++;
        } catch (itemError: any) {
          errors.push({
            type: 'processing',
            field: `item_${index}`,
            message: `Erro ao processar item ${index + 1}: ${itemError.message}`,
            data: item
          });
        }
      }
    } else if (isValidPromptExport(parsed)) {
      // Prompt único
      const title = file.name.replace('.json', '') || 'Prompt importado';
      const success = await processPromptImport(parsed, importCategoryId, title, errors, warnings);
      if (success) count = 1;
    } else if (Array.isArray(parsed)) {
      // Array de prompts
      for (const [index, item] of parsed.entries()) {
        const title = `Prompt importado ${index + 1}`;
        const success = await processPromptImport(item, importCategoryId, title, errors, warnings);
        if (success) count++;
      }
    } else {
      throw new Error('Formato de arquivo não reconhecido. Use um export válido do Prompt App.');
    }

    // Salvar backup após importação bem-sucedida
    if (count > 0) {
      await saveLocalBackup();
    }

    const processingTime = Date.now() - startTime;
    
    return {
      success: errors.length === 0,
      count,
      errors,
      warnings,
      processingTime
    };

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    
    return {
      success: false,
      count: 0,
      errors: [{
        type: 'processing',
        field: 'general',
        message: error.message || 'Erro desconhecido durante a importação'
      }],
      warnings,
      processingTime
    };
  }
}

/**
 * Retorna estatísticas da última importação
 */
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
