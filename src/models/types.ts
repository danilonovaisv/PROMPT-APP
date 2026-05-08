import type {
  CompiledPromptPayload,
  MenuDefinition,
  MenuSelectionMode,
  TemplatePayload,
  UserSelection,
  PromptOutputFormat,
} from './promptSchema';

export interface Category {
  id?: number;
  remoteId?: number;
  syncStatus?: SyncStatus;
  isDeleted?: boolean;
  name: string;
  icon: string;
  color: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ContextMenuSubOption {
  label: string;
  value: string;
}

export interface ContextMenuOption {
  label: string;
  value: string;
  subOptions: ContextMenuSubOption[];
}

export interface ContextMenu {
  id?: number;
  remoteId?: number;
  syncStatus?: SyncStatus;
  isDeleted?: boolean;
  menuId: string;
  menuName: string;
  description: string;
  selectionMode: MenuSelectionMode;
  options: ContextMenuOption[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ContextMenuSelection {
  option: string;
  subOptions: string[];
}

export type MenuSelectionsMap = Record<string, ContextMenuSelection>;

export interface MenuOption {
  id?: number;
  menuKey: 'tom' | 'publico' | 'idioma' | 'estilo';
  label: string;
  value: string;
}

export interface MenuSelections {
  tom: string;
  publico: string;
  idioma: string;
  estilo: string;
}

export type MenuKey = 'tom' | 'publico' | 'idioma' | 'estilo';

export const MENU_LABELS: Record<MenuKey, string> = {
  tom: 'Tom',
  publico: 'Público',
  idioma: 'Idioma',
  estilo: 'Estilo',
};

export interface FewShotExample {
  input: string;
  output: string;
}

export interface PromptOutputSchemaLegacy {
  formato: string;
  estrutura: string;
}

export interface Prompt {
  id?: number;
  remoteId?: number;
  syncStatus?: SyncStatus;
  isDeleted?: boolean;
  categoryId: number;
  title: string;
  selectedMenuIds?: number[];
  promptPayload: TemplatePayload;
  selectionPayload?: UserSelection;
  compiledPayload?: CompiledPromptPayload;
  schemaVersion: string;
  language: string;
  outputFormat: PromptOutputFormat;
  referenceUrl?: string;
  fewShotExamples: FewShotExample[];
  createdAt: Date;
  updatedAt: Date;
}

export type PromptExportFormat = TemplatePayload;

export interface BulkExport {
  app: string;
  version: string;
  format?: string;
  schemaVersion?: string;
  exportedAt: string;
  menuDefinitions?: MenuDefinition[];
  prompts: Array<{
    title: string;
    category: string;
    schemaVersion: string;
    prompt: TemplatePayload;
  }>;
}

export type PromptMenuSelection = UserSelection;
export type SyncStatus = 'pending' | 'synced' | 'error';

export interface BaseRemoteEntity {
  id: number;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface RemoteCategory extends BaseRemoteEntity {
  name: string;
  icon: string;
  color: string;
}

export interface RemoteContextMenu extends BaseRemoteEntity {
  menu_id: string;
  menu_name: string;
  description: string;
  selection_mode: MenuSelectionMode;
  options: ContextMenuOption[];
}

export interface RemotePrompt extends BaseRemoteEntity {
  category_id: number;
  title: string;
  payload: TemplatePayload;
}
