/* ======================================================
   Sistema de Backup Centralizado — Dexie Store
   ====================================================== */

import { db } from '@/db/database';
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

const BACKUP_KEY = 'prompt_app_global_backup';

/** Gera um snapshot completo de todos os dados do banco */
export async function createSnapshot(): Promise<AppSnapshot> {
    const categories = await db.categories.toArray();
    const prompts = await db.prompts.toArray();
    const contextMenus = await db.contextMenus.toArray();

    return {
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        data: {
            categories,
            prompts,
            contextMenus,
        }
    };
}

/** Salva o snapshot no localStorage como backup de emergência */
export async function saveLocalBackup() {
    try {
        const snapshot = await createSnapshot();
        localStorage.setItem(BACKUP_KEY, JSON.stringify(snapshot));
        console.log('✅ Backup local atualizado em:', snapshot.timestamp);
    } catch (error) {
        console.error('❌ Erro ao realizar backup local:', error);
    }
}

/** Restaura o banco a partir de um snapshot */
export async function restoreFromSnapshot(snapshot: AppSnapshot) {
    try {
        // Limpar dados atuais
        await db.transaction('rw', [db.categories, db.prompts, db.contextMenus], async () => {
            await db.categories.clear();
            await db.prompts.clear();
            await db.contextMenus.clear();

            // Adicionar dados do backup
            if (snapshot.data.categories.length > 0) {
                await db.categories.bulkAdd(snapshot.data.categories);
            }
            if (snapshot.data.prompts.length > 0) {
                await db.prompts.bulkAdd(snapshot.data.prompts);
            }
            if (snapshot.data.contextMenus.length > 0) {
                await db.contextMenus.bulkAdd(snapshot.data.contextMenus);
            }
        });

        console.log('✅ Banco de dados restaurado com sucesso!');
        return true;
    } catch (error) {
        console.error('❌ Erno na restauração:', error);
        return false;
    }
}

/** Verifica se existe um backup local e retorna a data */
export function getLocalBackupInfo() {
    const raw = localStorage.getItem(BACKUP_KEY);
    if (!raw) return null;
    try {
        const snapshot = JSON.parse(raw) as AppSnapshot;
        return {
            timestamp: snapshot.timestamp,
            count: {
                prompts: snapshot.data.prompts.length,
                categories: snapshot.data.categories.length
            }
        };
    } catch {
        return null;
    }
}
