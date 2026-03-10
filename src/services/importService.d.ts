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
 * Lê e importa um arquivo JSON de prompts com tratamento completo de erros
 */
export declare function importFromFile(file: File): Promise<ImportResult>;
/**
 * Retorna estatísticas da última importação
 */
export declare function getImportStats(result: ImportResult): string;
