import type { ContextMenu } from '@/models/types';
export declare function saveMenuToSupabase(input: Partial<ContextMenu>): Promise<unknown>;
export declare function deleteMenuFromSupabase(remoteId: number): Promise<boolean>;
