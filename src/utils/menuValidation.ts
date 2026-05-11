/**
 * menuValidation.ts
 * Shared validation and normalization for context menus.
 * Used by both importService.ts (bulk import) and importMenusJson.ts (file import).
 */

import { MenuDefinitionSchema, type MenuDefinition } from '@/models/promptSchema';
import type { ContextMenu } from '@/models/types';

/* -------------------------------------------------------
   Internal raw-input shapes (allow both naming conventions)
   ------------------------------------------------------- */

interface RawSubOption {
  value?: string;
  valor?: string;
  label?: string;
  rotulo?: string;
  description?: string;
}

interface RawOption {
  value?: string;
  valor?: string;
  label?: string;
  rotulo?: string;
  description?: string;
  sub_options?: RawSubOption[];
  subOptions?: RawSubOption[];
}

interface RawMenuDefinition {
  menu_id?: string;
  menuId?: string;
  menu_name?: string;
  menuName?: string;
  description?: string;
  selection_mode?: string;
  selectionMode?: string;
  required?: boolean;
  obrigatorio?: boolean;
  options?: RawOption[];
  menu_options?: RawOption[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/* -------------------------------------------------------
   Normalization helpers
   ------------------------------------------------------- */

function normalizeSubOptions(raw: RawSubOption[]) {
  return raw.map((sub) => ({
    value: typeof (sub.value ?? sub.valor) === 'string' ? (sub.value ?? sub.valor)! : '',
    label: typeof (sub.label ?? sub.rotulo) === 'string' ? (sub.label ?? sub.rotulo)! : '',
    description: typeof sub.description === 'string' ? sub.description : '',
  }));
}

function normalizeOptions(raw: RawOption[]) {
  return raw.map((opt) => ({
    value: typeof (opt.value ?? opt.valor) === 'string' ? (opt.value ?? opt.valor)! : '',
    label: typeof (opt.label ?? opt.rotulo) === 'string' ? (opt.label ?? opt.rotulo)! : '',
    description: typeof opt.description === 'string' ? opt.description : '',
    sub_options: normalizeSubOptions(Array.isArray(opt.sub_options) ? opt.sub_options : Array.isArray(opt.subOptions) ? opt.subOptions! : []),
  }));
}

/**
 * Normalizes a raw menu definition object, handling all field naming aliases.
 * Returns a strict-schema-compatible object or the original input if unrecognized.
 */
export function normalizeRawMenu(menu: unknown): unknown {
  if (!isObject(menu)) return menu;
  const raw = menu as RawMenuDefinition;

  const menuId = raw.menu_id ?? raw.menuId;
  const menuName = raw.menu_name ?? raw.menuName;
  if (typeof menuId !== 'string' || typeof menuName !== 'string') return menu;

  const rawOptions = Array.isArray(raw.options) ? raw.options : Array.isArray(raw.menu_options) ? raw.menu_options : [];

  return {
    menu_id: menuId,
    menu_name: menuName,
    description: typeof raw.description === 'string' ? raw.description : '',
    selection_mode: raw.selection_mode ?? raw.selectionMode ?? 'single',
    required: typeof (raw.required ?? raw.obrigatorio) === 'boolean' ? (raw.required ?? raw.obrigatorio) : false,
    options: normalizeOptions(rawOptions),
  };
}

/* -------------------------------------------------------
   Public exports
   ------------------------------------------------------- */

export interface MenuValidationSuccess {
  success: true;
  data: Omit<ContextMenu, 'id'>;
  parsed: MenuDefinition;
}

export interface MenuValidationFailure {
  success: false;
  error: string;
}

export type MenuValidationResult = MenuValidationSuccess | MenuValidationFailure;

/**
 * Normalizes AND validates a single raw menu definition.
 * Returns a ContextMenu-compatible object with syncStatus = 'pending'.
 */
export function normalizeAndValidateMenu(raw: unknown): MenuValidationResult {
  try {
    const normalized = normalizeRawMenu(raw);
    const parsed = MenuDefinitionSchema.parse(normalized);
    const now = new Date();

    const contextMenu: Omit<ContextMenu, 'id'> = {
      menuId: parsed.menu_id,
      menuName: parsed.menu_name,
      description: parsed.description,
      selectionMode: parsed.selection_mode,
      options: parsed.options.map((opt) => ({
        value: opt.value,
        label: opt.label,
        subOptions: (opt.sub_options ?? []).map((sub) => ({
          value: sub.value,
          label: sub.label,
        })),
      })),
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
    };

    return { success: true, data: contextMenu, parsed };
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Menu validation failed';
    return { success: false, error };
  }
}

export interface MenuBatchResult {
  valid: Omit<ContextMenu, 'id'>[];
  parsed: MenuDefinition[]; // snake_case definitions
  errors: Array<{ input: unknown; error: string }>;
}

/**
 * Validates a batch of raw menu definitions.
 * Returns valid ContextMenu objects and a list of errors for invalid ones.
 */
export function normalizeMenuBatch(definitions: unknown[]): MenuBatchResult {
  const valid: Omit<ContextMenu, 'id'>[] = [];
  const parsed: MenuDefinition[] = [];
  const errors: Array<{ input: unknown; error: string }> = [];

  for (const definition of definitions) {
    const result = normalizeAndValidateMenu(definition);
    if (result.success) {
      valid.push(result.data);
      parsed.push(result.parsed);
    } else {
      errors.push({ input: definition, error: result.error });
    }
  }

  return { valid, parsed, errors };
}
