import type { Prompt } from '@/models/types';
export declare function savePromptToSupabase(input: Partial<Prompt>): Promise<unknown>;
export declare function deletePromptFromSupabase(remoteId: number): Promise<boolean>;
