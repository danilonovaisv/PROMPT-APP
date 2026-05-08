import { MemoryMap } from "@/models/memory";

export const LOCAL_STORAGE_KEY_PREFIX = '@prompt-app:fixed_memory:';

/**
 * Lê a memória fixa salva localmente para um template.
 */
export function getLocalMemory(templateId: string): MemoryMap {
  try {
    const data = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${templateId}`);
    return data ? JSON.parse(data) : {};
  } catch (err) {
    console.error('Erro ao ler memória local:', err);
    return {};
  }
}

/**
 * Salva a memória fixa localmente para um template.
 */
export function setLocalMemory(templateId: string, memory: MemoryMap): void {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${templateId}`, JSON.stringify(memory));
  } catch (err) {
    console.error('Erro ao salvar memória local:', err);
  }
}
