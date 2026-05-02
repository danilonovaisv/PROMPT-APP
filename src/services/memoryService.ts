import { supabase } from '@/lib/supabase';
import type { MemoryMap } from '@/models/memory';

const LOCAL_STORAGE_KEY = '@prompt-app:fixed_memory';

/**
 * Lê a memória fixa salva localmente (fallback offline/deslogado).
 */
function getLocalMemory(): MemoryMap {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (err) {
    console.error('Erro ao ler memória local:', err);
    return {};
  }
}

/**
 * Salva a memória fixa localmente.
 */
function setLocalMemory(memory: MemoryMap): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(memory));
  } catch (err) {
    console.error('Erro ao salvar memória local:', err);
  }
}

/**
 * Busca todas as entradas de memória do usuário atual,
 * com fallback para LocalStorage (estratégia local-first).
 */
export async function fetchMemory(): Promise<MemoryMap> {
  const localMemory = getLocalMemory();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return localMemory; // Modo offline ou deslogado

    const { data, error } = await supabase
      .from('prompt_memory_context')
      .select('key, value')
      .eq('user_id', user.id);

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
    setLocalMemory(merged);
    return merged;
  } catch (error) {
    console.warn('Falha na sincronização da memória fixa. Retornando dados locais.', error);
    return localMemory;
  }
}

/**
 * Salva ou atualiza uma entrada de memória.
 * Sincroniza local e tenta salvar remoto (upsert).
 */
export async function saveMemory(key: string, value: string): Promise<void> {
  // 1. Persistência local imediata (optimistic)
  const localMemory = getLocalMemory();
  localMemory[key] = value;
  setLocalMemory(localMemory);

  try {
    // 2. Tenta sincronizar com Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Silent return para fluxo offline/deslogado

    const { error } = await supabase
      .from('prompt_memory_context')
      .upsert(
        { user_id: user.id, key, value },
        { onConflict: 'user_id,key' }
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
export async function deleteMemory(key: string): Promise<void> {
  // 1. Remove localmente
  const localMemory = getLocalMemory();
  delete localMemory[key];
  setLocalMemory(localMemory);

  try {
    // 2. Tenta remover no Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('prompt_memory_context')
      .delete()
      .eq('user_id', user.id)
      .eq('key', key);

    if (error) {
      console.error(`Erro ao remover memória remota (${key}):`, error);
      throw error;
    }
  } catch (error) {
    console.warn(`Aviso: falha ao remover memória (${key}) remotamente. Removido apenas localmente.`, error);
  }
}
