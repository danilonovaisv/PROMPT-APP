import type { Category, Prompt, ContextMenu } from '@/models/types';
export interface AppSnapshot {
    version: string;
    timestamp: string;
    data: {
        categories: Category[];
        prompts: Prompt[];
        contextMenus: ContextMenu[];
    };
}
/** Gera um snapshot completo de todos os dados do banco */
export declare function createSnapshot(): Promise<AppSnapshot>;
/** Salva o snapshot no localStorage como backup de emergência */
export declare function saveLocalBackup(): Promise<void>;
/** Restaura o banco a partir de um snapshot */
export declare function restoreFromSnapshot(snapshot: AppSnapshot): Promise<boolean>;
/** Carrega e descriptografa o backup local se existir */
export declare function loadLocalBackup(): Promise<AppSnapshot | null>;
/** Verifica se existe um backup local e retorna metadados */
export declare function getLocalBackupInfo(): Promise<{
    timestamp: string;
    count: {
        prompts: number;
        categories: number;
    };
} | null>;
