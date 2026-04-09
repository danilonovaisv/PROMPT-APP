export function getMissingSeedRecords<T>(
  defaults: T[],
  existing: T[],
  getKey: (item: T) => string
): T[] {
  const existingKeys = new Set(existing.map((item) => getKey(item)));
  return defaults.filter((item) => !existingKeys.has(getKey(item)));
}

export function getDuplicateIds<T>(
  items: T[],
  getKey: (item: T) => string,
  getId: (item: T) => number | undefined
): number[] {
  const seen = new Set<string>();
  const duplicates: number[] = [];

  for (const item of items) {
    const key = getKey(item);
    const id = getId(item);

    if (seen.has(key)) {
      if (typeof id === 'number') {
        duplicates.push(id);
      }
      continue;
    }

    seen.add(key);
  }

  return duplicates;
}
