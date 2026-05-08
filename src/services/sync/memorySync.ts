import { supabase } from "@/lib/supabase";
import { db } from "@/db/database";
import { withRetry, fetchAllPages } from "./utils";

/**
 * Sincroniza a memória fixa do usuário (Upload).
 * ⚡ Bulk: um único upsert para todos os registros 'pending' — sem loop por template.
 */
export const syncMemoryToCloud = async (userId: string) => {
  try {
    // 1. Buscar todas as memórias pendentes no Dexie
    const pendingRecords = await db.promptMemory
      .where('syncStatus')
      .equals('pending')
      .toArray();

    if (pendingRecords.length === 0) return;

    console.log(`🧠 Sincronizando ${pendingRecords.length} registro(s) de memória...`);

    // 2. ⚡ Bulk: construir payload flat — sem agrupar por template
    const upsertPayload = pendingRecords.map(record => ({
      user_id: userId,
      template_id: record.templateId,
      key: record.key,
      value: record.value,
      is_deleted: !!record.isDeleted,
      deleted_at: record.isDeleted ? record.updatedAt.toISOString() : null,
      updated_at: record.updatedAt.toISOString(),
    }));

    // 3. ⚡ Único upsert para todos os templates de uma vez
    const { error } = await withRetry(() =>
      supabase
        .from('prompt_memory_context')
        .upsert(upsertPayload, { onConflict: 'user_id,template_id,key' })
    );

    if (error) {
      console.error('Erro no bulk upsert de memória:', error);
      return;
    }

    // 4. ⚡ Bulk update local: todos para 'synced' em uma chamada
    const ids = pendingRecords.map(r => r.id!).filter(id => id !== undefined);
    await db.promptMemory.bulkUpdate(
      ids.map(id => ({ key: id, changes: { syncStatus: 'synced' } }))
    );

    console.log(`✅ ${pendingRecords.length} registro(s) de memória sincronizados.`);
  } catch (error) {
    console.error("Erro ao processar sync de memória para cloud:", error);
  }
};

/**
 * Baixa toda a memória fixa da nuvem e atualiza o banco local (Download).
 * ⚡ Bulk: uma transação única com bulkPut/bulkUpdate — sem loop de transações por template.
 */
export const downloadMemoryFromCloud = async () => {
  try {
    const remoteData = await fetchAllPages<{
      template_id: string;
      key: string;
      value: string;
      is_deleted: boolean;
      created_at: string;
      updated_at: string;
    }>((r) =>
      supabase.from("prompt_memory_context").select("*").range(r[0], r[1])
    );

    if (remoteData.length === 0) return;

    const templates = Array.from(new Set(remoteData.map(item => item.template_id)));
    console.log(`🧠 Baixando memória para ${templates.length} template(s)...`);

    // 1. ⚡ Buscar todos os registros locais relevantes em UMA query
    const allLocalRecords = await db.promptMemory
      .where('templateId')
      .anyOf(templates)
      .toArray();

    // 2. Indexar locais por "templateId|key" para lookup O(1)
    const localByKey = new Map(
      allLocalRecords.map(r => [`${r.templateId}|${r.key}`, r])
    );

    // 3. Classificar registros remotos
    const toUpdate: { key: number; changes: Partial<typeof allLocalRecords[0]> }[] = [];
    const toAdd: Omit<typeof allLocalRecords[0], 'id'>[] = [];

    for (const item of remoteData) {
      const lookupKey = `${item.template_id}|${item.key}`;
      const existing = localByKey.get(lookupKey);
      const remoteUpdatedAt = new Date(item.updated_at).getTime();

      if (existing) {
        // Só atualiza se o remoto for mais recente
        if (remoteUpdatedAt > existing.updatedAt.getTime()) {
          toUpdate.push({
            key: existing.id!,
            changes: {
              value: item.value,
              isDeleted: !!item.is_deleted,
              syncStatus: 'synced',
              updatedAt: new Date(item.updated_at),
            },
          });
        }
      } else if (!item.is_deleted) {
        // Não existe localmente e não está excluído remotamente — criar
        toAdd.push({
          templateId: item.template_id,
          key: item.key,
          value: item.value,
          isDeleted: false,
          syncStatus: 'synced',
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at),
        });
      }
    }

    // 4. ⚡ Aplicar em transação única
    await db.transaction('rw', db.promptMemory, async () => {
      if (toAdd.length > 0) {
        await db.promptMemory.bulkAdd(toAdd as any);
      }
      if (toUpdate.length > 0) {
        await db.promptMemory.bulkUpdate(toUpdate as any);
      }
    });

    console.log(
      `✅ Download de memória concluído: ${toAdd.length} adicionado(s), ${toUpdate.length} atualizado(s).`
    );
  } catch (error) {
    console.error("Erro ao baixar memória da nuvem:", error);
  }
};
