import Dexie, { type EntityTable } from 'dexie';
import type { Category, Prompt, MenuOption, ContextMenu } from '@/models/types';
declare const db: Dexie & {
    categories: EntityTable<Category, "id">;
    prompts: EntityTable<Prompt, "id">;
    menuOptions: EntityTable<MenuOption, "id">;
    contextMenus: EntityTable<ContextMenu, "id">;
};
export declare function seedDatabase(): Promise<void>;
export { db };
