/* ======================================================
   useSearchFilter — Audit Fix #10
   Filtro em tempo real com debounce para listas de prompts
   ====================================================== */

import { useMemo } from 'react';

interface Searchable {
  title?: string;
  description?: string;
}

/**
 * Filters an array of items by a search term (case-insensitive).
 * Matches against `title` and `description` fields.
 */
export function useSearchFilter<T extends Searchable>(
  items: T[],
  searchTerm: string,
): T[] {
  return useMemo(() => {
    if (!searchTerm.trim()) return items;

    const normalized = searchTerm.toLowerCase().trim();
    return items.filter((item) => {
      const inTitle = item.title?.toLowerCase().includes(normalized) ?? false;
      const inDescription =
        item.description?.toLowerCase().includes(normalized) ?? false;
      return inTitle || inDescription;
    });
  }, [items, searchTerm]);
}
