/**
 * batchingUtils.ts — Mitigação N+1
 */

interface BatchRequest<T, R> { key: T; resolve: (value: R) => void; reject: (reason: unknown) => void; }

export function createBatcher<T, R>(fetcher: (keys: T[]) => Promise<Map<T, R>>, options: { maxBatchSize?: number; delayMs?: number } = {}) {
  const { maxBatchSize = 50, delayMs = 10 } = options;
  let queue: BatchRequest<T, R>[] = [];
  let timeout: ReturnType<typeof setTimeout> | null = null;
  async function flush() {
    if (queue.length === 0) return;
    const batch = queue.splice(0, maxBatchSize);
    const keys = batch.map(r => r.key);
    try {
      const results = await fetcher(keys);
      batch.forEach(({ key, resolve, reject }) => {
        const result = results.get(key);
        if (result !== undefined) resolve(result); else reject(new Error(`Key not found: ${String(key)}`));
      });
    } catch (err) { batch.forEach(({ reject }) => reject(err)); }
    if (queue.length > 0) { timeout = setTimeout(flush, delayMs); }
  }
  return function load(key: T): Promise<R> {
    return new Promise((resolve, reject) => {
      queue.push({ key, resolve, reject });
      if (!timeout) { timeout = setTimeout(() => { timeout = null; flush(); }, delayMs); }
    });
  };
}

export class LocalCache<K, V> {
  private store = new Map<K, { value: V; expiresAt: number }>();
  constructor(private defaultTtlMs: number = 60000) {}
  get(key: K): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) { this.store.delete(key); return undefined; }
    return entry.value;
  }
  set(key: K, value: V, ttlMs?: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs) });
  }
  invalidate(key: K): void { this.store.delete(key); }
  invalidateAll(): void { this.store.clear(); }
}

import { useRef } from 'react';
export function useStableMemo<T>(factory: () => T, deps: React.DependencyList, isEqual: (a: T, b: T) => boolean = (a, b) => JSON.stringify(a) === JSON.stringify(b)): T {
  const ref = useRef<{ value: T; deps: React.DependencyList } | null>(null);
  if (!ref.current) { ref.current = { value: factory(), deps }; }
  else {
    const depsChanged = deps.length !== ref.current.deps.length || deps.some((dep, i) => dep !== ref.current!.deps[i]);
    if (depsChanged) {
      const newValue = factory();
      if (!isEqual(newValue, ref.current.value)) { ref.current = { value: newValue, deps }; }
      else { ref.current.deps = deps; }
    }
  }
  return ref.current.value;
}
