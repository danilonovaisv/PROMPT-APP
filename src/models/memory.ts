export interface MemoryEntry {
  id?: string;
  user_id?: string;
  template_id?: string;
  key: string;
  value: string;
  updated_at?: string;
  created_at?: string;
}

export type MemoryMap = Record<string, string>;

export const FIXED_MEMORY_KEYS = {
  USER_INPUT: 'user_input',
  JSON_WORKFLOW_ATUAL: 'JSON_WORKFLOW_ATUAL',
  FOCO_DA_MELHORIA: 'FOCO_DA_MELHORIA',
} as const;
