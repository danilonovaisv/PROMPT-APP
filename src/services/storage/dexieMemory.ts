import { db } from '@/db/database';
import type { SyncStatus } from '@/models/types';
import type { MemoryMap } from '@/models/memory';

const LOCAL_STORAGE_KEY_PREFIX = '@prompt-app:fixed_memory:';

/**
 * Migrate legacy localStorage memory to Dexie
 */
export async function migrateLegacyMemory() {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(LOCAL_STORAGE_KEY_PREFIX));
    
    if (keys.length === 0) return;

    console.log(`📦 Dexie Memory: Migrating ${keys.length} legacy memory contexts...`);

    for (const storageKey of keys) {
        try {
            const templateId = storageKey.replace(LOCAL_STORAGE_KEY_PREFIX, '');
            const data = localStorage.getItem(storageKey);
            if (!data) continue;

            const memoryMap: MemoryMap = JSON.parse(data);
            
            for (const [key, value] of Object.entries(memoryMap)) {
                // Check if already exists in Dexie to avoid duplicates
                const existing = await db.promptMemory
                    .where({ templateId, key })
                    .first();

                if (!existing) {
                    await db.promptMemory.add({
                        key,
                        value,
                        templateId,
                        syncStatus: 'pending',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                }
            }

            // After migration, we can remove from localStorage
            localStorage.removeItem(storageKey);
            console.log(`✅ Dexie Memory: Migrated template ${templateId}`);
        } catch (err) {
            console.error(`❌ Dexie Memory: Error migrating ${storageKey}:`, err);
        }
    }
}

/**
 * Get memory map from Dexie for a specific template
 */
export async function getDexieMemory(templateId: string): Promise<MemoryMap> {
    const records = await db.promptMemory
        .where('templateId')
        .equals(templateId)
        .filter(r => !r.isDeleted)
        .toArray();

    return records.reduce<MemoryMap>((acc, record) => {
        acc[record.key] = record.value;
        return acc;
    }, {});
}

/**
 * Upsert memory entry in Dexie
 */
export async function setDexieMemory(templateId: string, key: string, value: string, syncStatus: SyncStatus = 'pending'): Promise<void> {
    const existing = await db.promptMemory
        .where({ templateId, key })
        .first();

    if (existing) {
        await db.promptMemory.update(existing.id!, {
            value,
            syncStatus,
            isDeleted: false,
            updatedAt: new Date(),
        });
    } else {
        await db.promptMemory.add({
            templateId,
            key,
            value,
            syncStatus,
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }
}

/**
 * Batch update memory in Dexie (used during full sync)
 */
export async function saveDexieMemoryMap(templateId: string, memory: MemoryMap, syncStatus: SyncStatus = 'pending'): Promise<void> {
    await db.transaction('rw', db.promptMemory, async () => {
        const existingRecords = await db.promptMemory
            .where('templateId')
            .equals(templateId)
            .toArray();

        const activeKeys = new Set(Object.keys(memory));

        // 1. Update or Add
        for (const [key, value] of Object.entries(memory)) {
            const existing = existingRecords.find(r => r.key === key);
            if (existing) {
                if (existing.value !== value || existing.isDeleted) {
                    await db.promptMemory.update(existing.id!, {
                        value,
                        syncStatus,
                        isDeleted: false,
                        updatedAt: new Date(),
                    });
                }
            } else {
                await db.promptMemory.add({
                    templateId,
                    key,
                    value,
                    syncStatus,
                    isDeleted: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }
        }

        // 2. Soft-delete keys not in memory map
        const recordsToSoftDelete = existingRecords.filter(r => !activeKeys.has(r.key) && !r.isDeleted);
        for (const record of recordsToSoftDelete) {
            await db.promptMemory.update(record.id!, {
                isDeleted: true,
                syncStatus: 'pending',
                updatedAt: new Date(),
            });
        }
    });
}

/**
 * Delete a specific memory key from Dexie
 */
export async function deleteDexieMemory(templateId: string, key: string): Promise<void> {
    const existing = await db.promptMemory
        .where({ templateId, key })
        .first();

    if (existing) {
        await db.promptMemory.update(existing.id!, {
            isDeleted: true,
            syncStatus: 'pending',
            updatedAt: new Date(),
        });
    }
}
