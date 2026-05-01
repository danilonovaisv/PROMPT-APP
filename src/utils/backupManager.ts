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

        // Verificação de segurança: Não sobrescrever um backup que tem dados com um vazio 
        // a menos que o usuário explicitamente delete tudo ou seja o primeiro backup.
        const existingRaw = localStorage.getItem(BACKUP_KEY);
        if (existingRaw) {
            try {
                const parsed = JSON.parse(existingRaw);
                if (isValidSnapshot(parsed)) {
                    const hasExistingData = parsed.data.prompts.length > 0 || parsed.data.categories.length > 6; // 6 é o seed padrão
                    const isNewEmpty = snapshot.data.prompts.length === 0 && snapshot.data.categories.length <= 6;

                    if (hasExistingData && isNewEmpty) {
                        console.warn('⚠️ Tentativa de backup vazio detectada. Preservando backup anterior com dados.');
                        return;
                    }
                } else {
                    console.warn('⚠️ Backup anterior inválido ou corrompido. Será sobrescrito.');
                }
            } catch (e) {
                console.warn('⚠️ Falha ao ler backup anterior, sobrescrevendo.', e);
            }
        }

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
        const parsed = JSON.parse(raw);
        if (!isValidSnapshot(parsed)) return null;

        return {
            timestamp: parsed.timestamp,
            count: {
                prompts: parsed.data.prompts.length,
                categories: parsed.data.categories.length
            }
        };
    } catch {
        return null;
    }
}
