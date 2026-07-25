import { supabase } from '@/lib/supabase';
import { db } from '@/db/database';
import type { MemoryMap } from '@/models/memory';
import type {
  MemoryMergeStrategy,
  PromptMemoryEntry,
} from '@/models/promptSchema';
import { 
    getDexieMemory, 
    setDexieMemory, 
    deleteDexieMemory, 
    saveDexieMemoryMap, 
    migrateLegacyMemory 
} from './storage/dexieMemory';

export interface MemoryPlanItem {
  key: string;
  templateId: string;
  action: 'create' | 'update' | 'preserve' | 'ignore';
  value: string;
  reason?: string;
}

function isEmptyMemoryValue(value: string | null | undefined): boolean {
  return value === undefined || value === null || value.trim() === '';
}

export async function planMemoryUpserts(
  templateId: string,
  entries: PromptMemoryEntry[],
  mergeStrategy: MemoryMergeStrategy,
): Promise<MemoryPlanItem[]> {
  const keys = entries.map((entry) => entry.key);
  const existingRecords = keys.length > 0
    ? await db.promptMemory.where('[templateId+key]').anyOf(
      keys.map((key) => [templateId, key] as [string, string]),
    ).toArray()
    : [];
  const existingMap = new Map(existingRecords.map((record) => [record.key, record]));

  return entries.map((entry) => {
    const existing = existingMap.get(entry.key);
    if (mergeStrategy === 'skip') {
      return {
        key: entry.key,
        templateId,
        action: 'ignore',
        value: entry.value,
        reason: 'merge_strategy=skip',
      };
    }

    if (!existing || existing.isDeleted) {
      return {
        key: entry.key,
        templateId,
        action: 'create',
        value: entry.value,
      };
    }

    if (mergeStrategy === 'preserve_existing') {
      return {
        key: entry.key,
        templateId,
        action: 'preserve',
        value: existing.value,
        reason: 'existing value preserved',
      };
    }

    if (mergeStrategy === 'fill_empty') {
      if (isEmptyMemoryValue(existing.value) && !isEmptyMemoryValue(entry.value)) {
        return {
          key: entry.key,
          templateId,
          action: 'update',
          value: entry.value,
          reason: 'existing value was empty',
        };
      }

      return {
        key: entry.key,
        templateId,
        action: 'preserve',
        value: existing.value,
        reason: 'existing value was not empty',
      };
    }

    return {
      key: entry.key,
      templateId,
      action: 'update',
      value: entry.value,
    };
  });
}

export async function applyMemoryPlan(plan: MemoryPlanItem[]): Promise<void> {
  for (const item of plan) {
    if (item.action === 'ignore' || item.action === 'preserve') {
      continue;
    }

    await setDexieMemory(item.templateId, item.key, item.value, 'pending');
  }
}

/**
 * Busca todas as entradas de memória do usuário atual para um template específico,
 * com fallback para LocalStorage (estratégia local-first).
 */
export async function fetchMemory(templateId: string): Promise<MemoryMap> {
  // Inicializa migração se necessário
  await migrateLegacyMemory();
  
  const localMemory = await getDexieMemory(templateId);
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return localMemory; // Modo offline ou deslogado

    const { data, error } = await supabase
      .from('prompt_memory_context')
      .select('key, value')
      .eq('user_id', user.id)
      .eq('template_id', templateId);

    if (error) {
      console.error('Erro ao buscar memória remota:', error);
      throw error;
    }

    const remoteMemory = (data || []).reduce<MemoryMap>((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});

    // Sincroniza local com remoto (remoto prevalece em caso de conflito)
    // Nota: O merge agora é mais complexo, mas saveDexieMemoryMap lida com isso.
    // Porém, fetchMemory retorna o mapa ATIVO.
    const merged = { ...localMemory, ...remoteMemory };
    await saveDexieMemoryMap(templateId, merged, 'synced');
    return merged;
  } catch (error) {
    console.warn(`Falha na sincronização da memória fixa para ${templateId}. Retornando dados locais.`, error);
    return localMemory;
  }
}

/**
 * Salva ou atualiza uma entrada de memória vinculada a um template.
 * Sincroniza local e tenta salvar remoto (upsert).
 */
export async function saveMemory(templateId: string, key: string, value: string): Promise<void> {
  // 1. Persistência local imediata (optimistic)
  await setDexieMemory(templateId, key, value, 'pending');

  try {
    // 2. Tenta sincronizar com Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Silent return para fluxo offline/deslogado

    const { error } = await supabase
      .from('prompt_memory_context')
      .upsert(
        { 
          user_id: user.id, 
          template_id: templateId, 
          key, 
          value, 
          is_deleted: false, 
          deleted_at: null,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id,template_id,key' }
      );

    if (!error) {
      // Atualiza status para sincronizado
      await setDexieMemory(templateId, key, value, 'synced');
    }

    if (error) {
      console.error(`Erro ao salvar memória remota (${key}):`, error);
      throw error;
    }
  } catch (error) {
    // Apenas log, não quebra a UI, mantendo o valor salvo no local-first
    console.warn(`Aviso: falha ao sincronizar memória (${key}) remotamente. Salvo apenas localmente.`, error);
  }
}

/**
 * Remove uma entrada de memória (local e remota).
 */
export async function deleteMemory(templateId: string, key: string): Promise<void> {
  // 1. Remove localmente
  await deleteDexieMemory(templateId, key);

  try {
    // 2. Tenta remover no Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('prompt_memory_context')
      .update({ 
        is_deleted: true, 
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('template_id', templateId)
      .eq('key', key);

    if (error) {
      console.error(`Erro ao remover memória remota (${key}):`, error);
      throw error;
    }
  } catch (error) {
    console.warn(`Aviso: falha ao remover memória (${key}) remotamente. Removido apenas localmente.`, error);
  }
}

/**
 * Sincroniza todo o mapa de memória para um template, removendo o que não estiver no mapa.
 * Utiliza operações em lote para maior eficiência.
 */
export async function syncMemory(templateId: string, memory: MemoryMap): Promise<void> {
  // 1. Persistência local imediata
  await saveDexieMemoryMap(templateId, memory, 'pending');

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;


    // 3. Upsert em lote (local para remoto) - Incluindo marcados para exclusão
    const allLocalRecords = await db.promptMemory
      .where('templateId')
      .equals(templateId)
      .toArray();

    const pendingRecords = allLocalRecords.filter(record => record.syncStatus !== 'synced');

    if (pendingRecords.length > 0) {
      const upsertPayload = pendingRecords.map(record => ({
        user_id: user.id,
        template_id: templateId,
        key: record.key,
        value: record.value,
        is_deleted: !!record.isDeleted,
        deleted_at: record.isDeleted ? record.updatedAt.toISOString() : null,
        updated_at: record.updatedAt.toISOString()
      }));

      const { error: upsertError } = await supabase
        .from('prompt_memory_context')
        .upsert(upsertPayload, { onConflict: 'user_id,template_id,key' });

      if (upsertError) throw upsertError;

      // Atualiza local para 'synced'
      const ids = pendingRecords.map(r => r.id!).filter(id => id !== undefined);
      await db.promptMemory.bulkUpdate(ids.map(id => ({
        key: id,
        changes: { syncStatus: 'synced' }
      })));
    }

    console.log(`✅ Memória sincronizada para template: ${templateId}`);
  } catch (error) {
    console.error(`❌ Erro na sincronização completa da memória para ${templateId}:`, error);
    throw error;
  }
}
