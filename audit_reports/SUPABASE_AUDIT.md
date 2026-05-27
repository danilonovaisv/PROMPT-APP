## Supabase Audit

- Configuration in `src/lib/supabase.ts` uses `@supabase/supabase-js`.
- Session validation depends on `supabase.auth.getSession()`.
- RLS Policies (as seen in migrations) properly restrict actions using `user_id = auth.uid()` for all CRUD operations, including fix for multiple permissive policies.
- Sync logic in `src/services/syncService.ts` groups synchronization across `syncCategories`, `syncMenus`, `syncPrompts`, and `syncMemoryToCloud`.
- Could not find "Dirty" directly handled under that exact naming, but `syncStatus` is defined as 'pending' | 'synced'. When offline or facing network issues, Supabase handles it but local Dexie records with `syncStatus: 'pending'` act as the "Dirty" queue.
