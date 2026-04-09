/** Categoria para organizar prompts */
export interface Category {
    id?: number;
    remoteId?: number;
    syncStatus?: SyncStatus;
    name: string;
    icon: string;
    color: string;
    createdAt: Date;
}
/** Sub-opção de um menu de contexto */
export interface ContextMenuSubOption {
    label: string;
    value: string;
}
/** Opção principal de um menu de contexto (com sub-opções opcionais) */
export interface ContextMenuOption {
    label: string;
    value: string;
    subOptions: ContextMenuSubOption[];
}
/** Menu de contexto completo — criado e gerenciado pelo usuário */
export interface ContextMenu {
    id?: number;
    remoteId?: number;
    syncStatus?: SyncStatus;
    menuId: string;
    menuName: string;
    description: string;
    options: ContextMenuOption[];
    createdAt: Date;
    updatedAt: Date;
}
/** Seleção de um menu hierárquico em um prompt */
export interface ContextMenuSelection {
    option: string;
    subOptions: string[];
}
/** Todas as seleções de menus de um prompt */
export type MenuSelectionsMap = Record<string, ContextMenuSelection>;
/** @deprecated Usar MenuSelectionsMap para novos prompts */
export interface MenuOption {
    id?: number;
    menuKey: 'tom' | 'publico' | 'idioma' | 'estilo';
    label: string;
    value: string;
}
/** @deprecated Mantido para compatibilidade */
export interface MenuSelections {
    tom: string;
    publico: string;
    idioma: string;
    estilo: string;
}
/** Menu keys tipados (v1) */
export type MenuKey = 'tom' | 'publico' | 'idioma' | 'estilo';
/** Menu labels em português (v1) */
export declare const MENU_LABELS: Record<MenuKey, string>;
/** Exemplo few-shot */
export interface FewShotExample {
    input: string;
    output: string;
}
/** Schema de saída do prompt */
export interface OutputSchema {
    formato: 'json' | 'texto' | 'markdown' | 'imagem' | 'code';
    estrutura: string;
}
/** Prompt completo (modelo interno) */
export interface Prompt {
    id?: number;
    remoteId?: number;
    syncStatus?: SyncStatus;
    categoryId: number;
    title: string;
    systemRole: string;
    task: string;
    context: string;
    /** @deprecated v1 menus fixos — mantido para retrocompatibilidade */
    menus: MenuSelections;
    /** v2 menus hierárquicos */
    contextMenus: MenuSelectionsMap;
    /** IDs dos menus de contexto habilitados neste prompt */
    enabledMenuIds: string[];
    constraints: string[];
    negativePrompt: string[];
    outputSchema: OutputSchema;
    fewShotExamples: FewShotExample[];
    referenceUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}
/** Formato de exportação JSON cognitivo */
export interface PromptExportFormat {
    system_role: string;
    task: string;
    input_data: {
        context: string;
        reference_url?: string;
        menus_selecionados: Record<string, {
            opcao: string;
            sub_opcoes: string[];
        }>;
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
    contextMenus?: ContextMenu[];
    prompts: Array<{
        title: string;
        category: string;
        prompt: PromptExportFormat;
    }>;
}
export type SyncStatus = 'pending' | 'synced' | 'error';
