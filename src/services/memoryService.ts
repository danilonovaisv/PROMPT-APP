import { supabase } from '@/lib/supabase';
import type { MemoryMap } from '@/models/memory';

const LOCAL_STORAGE_KEY_PREFIX = '@prompt-app:fixed_memory:';

/**
 * Lê a memória fixa salva localmente (fallback offline/deslogado).
 */
function getLocalMemory(templateId: string): MemoryMap {
  try {
    const data = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${templateId}`);
    return data ? JSON.parse(data) : {};
  } catch (err) {
    console.error('Erro ao ler memória local:', err);
    return {};
  }
}

/**
 * Salva a memória fixa localmente.
 */
function setLocalMemory(templateId: string, memory: MemoryMap): void {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${templateId}`, JSON.stringify(memory));
  } catch (err) {
    console.error('Erro ao salvar memória local:', err);
  }
}

/**
 * Busca todas as entradas de memória do usuário atual para um template específico,
 * com fallback para LocalStorage (estratégia local-first).
 */
export async function fetchMemory(templateId: string): Promise<MemoryMap> {
  const localMemory = getLocalMemory(templateId);
  
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
    const merged = { ...localMemory, ...remoteMemory };
    setLocalMemory(templateId, merged);
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
  const localMemory = getLocalMemory(templateId);
  localMemory[key] = value;
  setLocalMemory(templateId, localMemory);

  try {
    // 2. Tenta sincronizar com Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Silent return para fluxo offline/deslogado

    const { error } = await supabase
      .from('prompt_memory_context')
      .upsert(
        { user_id: user.id, template_id: templateId, key, value },
        { onConflict: 'user_id,template_id,key' }
      );

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
  const localMemory = getLocalMemory(templateId);
  delete localMemory[key];
  setLocalMemory(templateId, localMemory);

  try {
    // 2. Tenta remover no Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('prompt_memory_context')
      .delete()
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
