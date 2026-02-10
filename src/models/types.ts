/* ======================================================
   Tipos e Interfaces — Prompt App
   ====================================================== */

/** Categoria para organizar prompts */
export interface Category {
    id?: number;
    name: string;
    icon: string;
    color: string;
    createdAt: Date;
}

/** Menu pré-configurado (tom, público, idioma, estilo) */
export interface MenuOption {
    id?: number;
    menuKey: 'tom' | 'publico' | 'idioma' | 'estilo';
    label: string;
    value: string;
}

/** Seleção de menus no prompt */
export interface MenuSelections {
    tom: string;
    publico: string;
    idioma: string;
    estilo: string;
}

/** Exemplo few-shot */
export interface FewShotExample {
    input: string;
    output: string;
}

/** Schema de saída do prompt */
export interface OutputSchema {
    formato: 'json' | 'texto' | 'markdown';
    estrutura: string;
}

/** Prompt completo (modelo interno) */
export interface Prompt {
    id?: number;
    categoryId: number;
    title: string;
    systemRole: string;
    task: string;
    context: string;
    menus: MenuSelections;
    constraints: string[];
    negativePrompt: string[];
    outputSchema: OutputSchema;
    fewShotExamples: FewShotExample[];
    createdAt: Date;
    updatedAt: Date;
}

/** Formato de exportação JSON padrão (obrigatório) */
export interface PromptExportFormat {
    system_role: string;
    task: string;
    input_data: {
        context: string;
        menus_selecionados: {
            tom: string;
            publico: string;
            idioma: string;
            estilo: string;
        };
    };
    constraints: string[];
    negative_prompt: string[];
    output_schema: {
        formato: string;
        estrutura: string;
    };
    few_shot_examples: FewShotExample[];
}

/** Formato de exportação em lote */
export interface BulkExport {
    app: string;
    version: string;
    exportedAt: string;
    prompts: Array<{
        title: string;
        category: string;
        prompt: PromptExportFormat;
    }>;
}

/** Menu keys tipados */
export type MenuKey = 'tom' | 'publico' | 'idioma' | 'estilo';

/** Menu labels em português */
export const MENU_LABELS: Record<MenuKey, string> = {
    tom: 'Tom',
    publico: 'Público',
    idioma: 'Idioma',
    estilo: 'Estilo',
};
