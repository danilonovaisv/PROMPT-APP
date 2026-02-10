/* ======================================================
   Utilitários de exportação JSON
   ====================================================== */

import type { Prompt, PromptExportFormat, BulkExport, MenuSelectionsMap } from '@/models/types';
import { db } from '@/db/database';

/** Converte MenuSelectionsMap para o formato de exportação */
function exportMenuSelections(
    contextMenus: MenuSelectionsMap
): Record<string, { opcao: string; sub_opcoes: string[] }> {
    const result: Record<string, { opcao: string; sub_opcoes: string[] }> = {};

    for (const [menuId, selection] of Object.entries(contextMenus)) {
        if (selection.option) {
            result[menuId] = {
                opcao: selection.option,
                sub_opcoes: selection.subOptions || [],
            };
        }
    }

    /* Fallback: incluir menus v1 se contextMenus estiver vazio */
    return result;
}

/** Converte prompt interno para o formato JSON cognitivo */
export function toExportFormat(prompt: Prompt): PromptExportFormat {
    /* Monta menus_selecionados a partir de contextMenus (v2) e/ou menus (v1) */
    let menusSelecionados = exportMenuSelections(prompt.contextMenus || {});

    /* Fallback v1: se não há contextMenus, usar seleções v1 */
    if (Object.keys(menusSelecionados).length === 0 && prompt.menus) {
        const v1Menus = prompt.menus;
        for (const [key, value] of Object.entries(v1Menus)) {
            if (value) {
                menusSelecionados[key] = { opcao: value, sub_opcoes: [] };
            }
        }
    }

    return {
        system_role: prompt.systemRole,
        task: prompt.task,
        input_data: {
            context: prompt.context,
            menus_selecionados: menusSelecionados,
        },
        constraints: prompt.constraints.filter(Boolean),
        negative_prompt: prompt.negativePrompt.filter(Boolean),
        output_schema: {
            formato: prompt.outputSchema.formato,
            estrutura: prompt.outputSchema.estrutura,
        },
        few_shot_examples: prompt.fewShotExamples.filter(
            (ex) => ex.input.trim() || ex.output.trim()
        ),
    };
}

/** Faz download de um objeto como arquivo .json */
export function downloadJson(data: unknown, filename: string) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.json') ? filename : `${filename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/** Exporta um único prompt para download */
export function downloadPrompt(prompt: Prompt) {
    const exported = toExportFormat(prompt);
    const safeName = prompt.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    downloadJson(exported, `prompt_${safeName}`);
}

/** Exporta todos os prompts + menus de contexto em formato bulk */
export async function downloadAllPrompts() {
    const prompts = await db.prompts.toArray();
    const categories = await db.categories.toArray();
    const contextMenus = await db.contextMenus.toArray();
    const categoryMap = new Map(categories.map((c) => [c.id!, c.name]));

    const bulk: BulkExport = {
        app: 'Prompt App',
        version: '2.0.0',
        exportedAt: new Date().toISOString(),
        contextMenus: contextMenus,
        prompts: prompts.map((p) => ({
            title: p.title,
            category: categoryMap.get(p.categoryId) || 'Sem categoria',
            prompt: toExportFormat(p),
        })),
    };

    downloadJson(bulk, `prompt_app_export_${Date.now()}`);
}

/** Copia texto para a área de transferência */
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        /* Fallback para navegadores antigos */
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        return success;
    }
}
