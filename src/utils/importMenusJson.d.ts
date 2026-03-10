/** Sub-opção no schema de importação */
export interface ImportSubOption {
    label: string;
    value: string;
}
/** Opção principal no schema de importação */
export interface ImportOption {
    label: string;
    value: string;
    sub_options?: ImportSubOption[];
}
/** Menu individual no schema de importação */
export interface ImportMenu {
    menu_id: string;
    menu_name: string;
    description: string;
    options: ImportOption[];
}
/** Schema raiz do arquivo de importação */
export interface MenuImportSchema {
    version: string;
    menus: ImportMenu[];
}
export interface ValidationError {
    field: string;
    message: string;
}
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    data: MenuImportSchema | null;
}
/** Valida o JSON completo contra o schema de importação */
export declare function validateMenuImportFile(raw: unknown): ValidationResult;
/** Verifica conflitos com menus existentes no banco */
export declare function checkMenuIdConflicts(menuIds: string[]): Promise<string[]>;
export interface ImportResult {
    success: boolean;
    imported: number;
    errors: ValidationError[];
    conflicts: string[];
    log: string[];
}
/**
 * Importa menus de um arquivo JSON.
 * Operação atômica: falha se qualquer validação ou conflito for detectado.
 *
 * @param file - arquivo .json
 * @param skipConflicts - se true, pula menus com ID já existente (default: false)
 */
export declare function importMenusFromFile(file: File, skipConflicts?: boolean): Promise<ImportResult>;
/**
 * Exporta todos os menus de contexto no formato de importação (MenuImportSchema).
 * Permite exportar menus para reutilização em outros projetos.
 */
export declare function exportMenusToJson(): Promise<MenuImportSchema>;
