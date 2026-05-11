/* ======================================================
   Sistema de Backup Centralizado — Dexie Store
   ====================================================== */

import { db } from '@/db/database';
import type { Category, Prompt, ContextMenu } from '@/models/types';
import { encrypt, decrypt } from './crypto';

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

/** Salva o snapshot no localStorage como backup de emergência (criptografado) */
export async function saveLocalBackup() {
    try {
        const snapshot = await createSnapshot();

        // Verificação de segurança: Não sobrescrever um backup que tem dados com um vazio 
        const existingRaw = localStorage.getItem(BACKUP_KEY);
        if (existingRaw) {
            try {
                // Tentar descriptografar se for um backup novo, ou usar direto se for legado (JSON)
                let existingSnapshot: AppSnapshot | null = null;

                if (existingRaw.startsWith('{')) {
                    existingSnapshot = JSON.parse(existingRaw);
                } else {
                    const decrypted = await decrypt(existingRaw);
                    if (decrypted) {
                        existingSnapshot = JSON.parse(decrypted);
                    }
                }

                if (existingSnapshot && isValidSnapshot(existingSnapshot)) {
                    const hasExistingData = existingSnapshot.data.prompts.length > 0 || existingSnapshot.data.categories.length > 6; // 6 é o seed padrão
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

        const snapshotJson = JSON.stringify(snapshot);
        const encrypted = await encrypt(snapshotJson);
        localStorage.setItem(BACKUP_KEY, encrypted);
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

/** Carrega e descriptografa o backup local se existir */
export async function loadLocalBackup(): Promise<AppSnapshot | null> {
    const raw = localStorage.getItem(BACKUP_KEY);
    if (!raw) return null;
    try {
        let snapshot: AppSnapshot | null = null;
        if (raw.startsWith('{')) {
            snapshot = JSON.parse(raw);
        } else {
            const decrypted = await decrypt(raw);
            if (decrypted) {
                snapshot = JSON.parse(decrypted);
            }
        }

        if (snapshot && isValidSnapshot(snapshot)) {
            return snapshot;
        }
    } catch (e) {
        console.error('❌ Erro ao carregar backup local:', e);
    }
    return null;
}

/** Verifica se existe um backup local e retorna metadados */
export async function getLocalBackupInfo() {
    const snapshot = await loadLocalBackup();
    if (!snapshot) return null;

    return {
        timestamp: snapshot.timestamp,
        count: {
            prompts: snapshot.data.prompts.length,
            categories: snapshot.data.categories.length
        }
    };
}

/** Valida se um objeto segue a interface AppSnapshot */
function isValidSnapshot(obj: unknown): obj is AppSnapshot {
    if (!obj || typeof obj !== 'object') return false;
    const candidate = obj as Record<string, unknown>;
    
    return (
        typeof candidate.version === 'string' &&
        typeof candidate.timestamp === 'string' &&
        candidate.data !== null &&
        typeof candidate.data === 'object' &&
        Array.isArray(candidate.data && (candidate.data as Record<string, unknown>).categories) &&
        Array.isArray(candidate.data && (candidate.data as Record<string, unknown>).prompts) &&
        Array.isArray(candidate.data && (candidate.data as Record<string, unknown>).contextMenus)
    );
}
