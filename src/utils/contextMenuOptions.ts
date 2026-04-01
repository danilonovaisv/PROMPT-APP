import type { ContextMenuOption, ContextMenuSubOption } from '@/models/types';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function pickString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeSubOption(value: unknown): ContextMenuSubOption | null {
  if (!isRecord(value)) return null;

  const label = pickString(value.label);
  const rawValue = pickString(value.value);

  if (!label || !rawValue) return null;

  return {
    label,
    value: rawValue,
  };
}

function normalizeSubOptions(value: unknown): ContextMenuSubOption[] {
  if (Array.isArray(value)) {
    return value.map(normalizeSubOption).filter((item): item is ContextMenuSubOption => Boolean(item));
  }

  const single = normalizeSubOption(value);
  return single ? [single] : [];
}

function normalizeOption(value: unknown): ContextMenuOption | null {
  if (!isRecord(value)) return null;

  const label = pickString(value.label);
  const rawValue = pickString(value.value);

  if (!label || !rawValue) return null;

  return {
    label,
    value: rawValue,
    subOptions: normalizeSubOptions(value.subOptions ?? value.sub_options),
  };
}

export function normalizeContextMenuOptions(value: unknown): ContextMenuOption[] {
  if (Array.isArray(value)) {
    return value.map(normalizeOption).filter((item): item is ContextMenuOption => Boolean(item));
  }

  const single = normalizeOption(value);
  return single ? [single] : [];
}
