/* ======================================================
   Utilitários de importação JSON
   ====================================================== */

import { db } from '@/db/database';
import { saveCategoryToSupabase } from '@/services/supabaseCategories';
import { saveMenuToSupabase } from '@/services/supabaseMenus';
import { savePromptToSupabase } from '@/services/supabasePrompts';
import type { Prompt, BulkExport, PromptExportFormat, ContextMenu, MenuSelectionsMap } from '@/models/types';

/** Valida se o objeto é um PromptExportFormat válido */
function isValidPromptExport(obj: unknown): obj is PromptExportFormat {
    if (!obj || typeof obj !== 'object') return false;
    const p = obj as Record<string, unknown>;
    return (
        p.system_role !== undefined &&
        p.task !== undefined &&
        p.input_data !== undefined &&
        typeof p.input_data === 'object'
    );
}

/** Valida se é um export em lote */
function isBulkExport(obj: unknown): obj is BulkExport {
    if (!obj || typeof obj !== 'object') return false;
    const b = obj as Record<string, unknown>;
    return b.app === 'Prompt App' && Array.isArray(b.prompts);
}

/** Converte menus_selecionados do JSON para MenuSelectionsMap */
function parseMenuSelections(
    menus: Record<string, unknown> | undefined
): MenuSelectionsMap {
    if (!menus || typeof menus !== 'object') return {};

    const result: MenuSelectionsMap = {};

    for (const [key, value] of Object.entries(menus)) {
        if (typeof value === 'string') {
            /* Formato v1: { tom: "formal" } */
            if (value) {
                result[key] = { option: value, subOptions: [] };
            }
        } else if (value && typeof value === 'object') {
            /* Formato v2: { tom: { opcao: "formal", sub_opcoes: [...] } } */
            const v = value as Record<string, unknown>;
            result[key] = {
                option: (v.opcao as string) || '',
                subOptions: Array.isArray(v.sub_opcoes) ? v.sub_opcoes : [],
            };
        }
    }

    return result;
}

/** Converte PromptExportFormat para Prompt interno */
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

/** Importa menus de contexto de um export em lote */
async function importContextMenus(menus: ContextMenu[]): Promise<number> {
    let count = 0;
    for (const menu of menus) {
        const existing = await db.contextMenus
            .where('menuId')
            .equals(menu.menuId)
            .first();
        if (!existing) {
            try {
                const savedRemote = await saveMenuToSupabase({
                    ...menu,
                    id: undefined,
                });
                await db.contextMenus.add({
                    ...menu,
                    id: undefined,
                    remoteId: savedRemote.id,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                count++;
            } catch (err) {
                console.error("Erro importando menu para supabase:", err);
            }
        }
    }
    return count;
}

/** Lê e importa um arquivo JSON de prompts */
export async function importFromFile(file: File): Promise<number> {
    const text = await file.text();
    const parsed = JSON.parse(text);

    /* Obter ou criar categoria padrão para importação */
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
            })) as number;
        } catch (err) {
            console.error("Erro ao criar categoria importada no supabase", err);
            importCategoryId = (await db.categories.add({
                name: 'Importados',
                icon: '📥',
                color: '#6366f1',
                createdAt: new Date(),
            })) as number;
        }
    }

    let count = 0;

    if (isBulkExport(parsed)) {
        /* Importar menus de contexto se existirem */
        if (Array.isArray(parsed.contextMenus)) {
            await importContextMenus(parsed.contextMenus);
        }

        /* Importação em lote */
        for (const item of parsed.prompts) {
            if (isValidPromptExport(item.prompt)) {
                /* Tentar encontrar ou criar categoria pelo nome */
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
                const internalPrompt = fromExportFormat(item.prompt, catId, item.title || `Prompt importado ${count + 1}`);
                try {
                    const savedRemote = await savePromptToSupabase(internalPrompt);
                    await db.prompts.add({ ...internalPrompt, remoteId: savedRemote.id });
                } catch (err) {
                    console.error("Falha ao salvar no supabase", err);
                    await db.prompts.add(internalPrompt);
                }
                count++;
            }
        }
    } else if (isValidPromptExport(parsed)) {
        /* Prompt único */
        const internalPrompt = fromExportFormat(parsed, importCategoryId, file.name.replace('.json', '') || 'Prompt importado');
        try {
            const savedRemote = await savePromptToSupabase(internalPrompt);
            await db.prompts.add({ ...internalPrompt, remoteId: savedRemote.id });
        } catch (err) {
            await db.prompts.add(internalPrompt);
        }
        count = 1;
    } else if (Array.isArray(parsed)) {
        /* Array de prompts */
        for (const item of parsed) {
            if (isValidPromptExport(item)) {
                const internalPrompt = fromExportFormat(item, importCategoryId, `Prompt importado ${count + 1}`);
                try {
                    const savedRemote = await savePromptToSupabase(internalPrompt);
                    await db.prompts.add({ ...internalPrompt, remoteId: savedRemote.id });
                } catch (err) {
                    await db.prompts.add(internalPrompt);
                }
                count++;
            }
        }
    }

    return count;
}
