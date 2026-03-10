import type { ContextMenu } from '@/models/types';
export declare function saveMenuToSupabase(input: Partial<ContextMenu>): Promise<any>;
export declare function deleteMenuFromSupabase(remoteId: number): Promise<boolean>;
