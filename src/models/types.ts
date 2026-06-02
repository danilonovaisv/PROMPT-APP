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
  description?: string;
}

export interface ContextMenuOption {
  label: string;
  value: string;
  description?: string;
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
  user_id: string;
  category_id: number | null;
  title: string;
  prompt_payload_jsonb: TemplatePayload;
  selected_menu_ids: number[];
  schema_version: string;
  output_format: string;
  language: string;
  reference_url: string | null;
  few_shot_examples: FewShotExample[];
  selection_payload_jsonb?: UserSelection;
  compiled_payload_jsonb?: CompiledPromptPayload;
}

export interface PromptMemory {
  id?: number;
  remoteId?: string;
  syncStatus?: SyncStatus;
  isDeleted?: boolean;
  key: string;
  value: string;
  templateId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RemotePromptMemory {
  id: string;
  user_id: string;
  key: string;
  value: string;
  template_id: string;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}
