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
/** Verifica se existe um backup local e retorna a data */
export declare function getLocalBackupInfo(): {
    timestamp: string;
    count: {
        prompts: number;
        categories: number;
    };
} | null;
