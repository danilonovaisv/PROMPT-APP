/* ======================================================
   Utilitários de importação JSON
   ====================================================== */

import { db } from '@/db/database';
import type { Prompt, BulkExport, PromptExportFormat } from '@/models/types';

/** Valida se o objeto é um PromptExportFormat válido */
function isValidPromptExport(obj: unknown): obj is PromptExportFormat {
    if (!obj || typeof obj !== 'object') return false;
    const p = obj as Record<string, unknown>;
    return (
        typeof p.system_role === 'string' &&
        typeof p.task === 'string' &&
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

/** Converte PromptExportFormat para Prompt interno */
function fromExportFormat(
    exported: PromptExportFormat,
    categoryId: number,
    title: string
): Omit<Prompt, 'id'> {
    return {
        categoryId,
        title,
        systemRole: exported.system_role || '',
        task: exported.task || '',
        context: exported.input_data?.context || '',
        menus: {
            tom: exported.input_data?.menus_selecionados?.tom || '',
            publico: exported.input_data?.menus_selecionados?.publico || '',
            idioma: exported.input_data?.menus_selecionados?.idioma || '',
            estilo: exported.input_data?.menus_selecionados?.estilo || '',
        },
        constraints: exported.constraints || [],
        negativePrompt: exported.negative_prompt || [],
        outputSchema: {
            formato: (exported.output_schema?.formato as 'json' | 'texto' | 'markdown') || 'texto',
            estrutura: exported.output_schema?.estrutura || '',
        },
        fewShotExamples: exported.few_shot_examples || [],
        createdAt: new Date(),
        updatedAt: new Date(),
    };
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
        importCategoryId = (await db.categories.add({
            name: 'Importados',
            icon: '📥',
            color: '#6366f1',
            createdAt: new Date(),
        })) as number;
    }

    let count = 0;

    if (isBulkExport(parsed)) {
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
                await db.prompts.add(
                    fromExportFormat(item.prompt, catId, item.title || `Prompt importado ${count + 1}`)
                );
                count++;
            }
        }
    } else if (isValidPromptExport(parsed)) {
        /* Prompt único */
        await db.prompts.add(
            fromExportFormat(parsed, importCategoryId, file.name.replace('.json', '') || 'Prompt importado')
        );
        count = 1;
    } else if (Array.isArray(parsed)) {
        /* Array de prompts */
        for (const item of parsed) {
            if (isValidPromptExport(item)) {
                await db.prompts.add(
                    fromExportFormat(item, importCategoryId, `Prompt importado ${count + 1}`)
                );
                count++;
            }
        }
    }

    return count;
}
