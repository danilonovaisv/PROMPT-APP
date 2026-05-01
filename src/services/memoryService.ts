import { supabase } from '@/lib/supabase';
import type { MemoryMap } from '@/models/memory';

/**
 * Busca todas as entradas de memória do usuário atual.
 */
export async function fetchMemory(): Promise<MemoryMap> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  const { data, error } = await supabase
    .from('prompt_memory_context')
    .select('key, value')
    .eq('user_id', user.id);

  if (error) {
    console.error('Erro ao buscar memória:', error);
    throw error;
  }

  return (data || []).reduce<MemoryMap>((acc, item) => {
    acc[item.key] = item.value;
    return acc;
  }, {});
}

/**
 * Salva ou atualiza uma entrada de memória (upsert).
 */
export async function saveMemory(key: string, value: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { error } = await supabase
    .from('prompt_memory_context')
    .upsert(
      { user_id: user.id, key, value },
      { onConflict: 'user_id,key' }
    );

  if (error) {
    console.error(`Erro ao salvar memória (${key}):`, error);
    throw error;
  }
}

/**
 * Remove uma entrada de memória.
 */
export async function deleteMemory(key: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('prompt_memory_context')
    .delete()
    .eq('user_id', user.id)
    .eq('key', key);

  if (error) {
    console.error(`Erro ao remover memória (${key}):`, error);
    throw error;
  }
}
