import type { Category } from '@/models/types';
export declare function saveCategoryToSupabase(input: Partial<Category>): Promise<any>;
export declare function deleteCategoryFromSupabase(remoteId: number): Promise<boolean>;
