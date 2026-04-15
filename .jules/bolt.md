## 2024-05-19 - Dexie.js Bulk Operations
**Learning:** Checking for existing records in a loop using `.where('field').equals(value).first()` causes an N+1 query problem, which can be a significant performance bottleneck in indexedDB / Dexie.
**Action:** Always batch queries using `.where('field').anyOf(array).toArray()` to retrieve all existing records at once, reducing database roundtrips.

## 2026-03-26 - Dexie.js Table Counting
**Learning:** Loading entire Dexie.js tables into memory (e.g. `db.prompts.toArray()`) just to count items per category or total items is extremely inefficient, especially since prompt records can have large JSON payloads. IndexedDB counts are fast.
**Action:** Use Dexie's `.count()` and indexed queries (like `.where('categoryId').equals(id).count()`) instead of `.toArray()` followed by array traversal whenever calculating statistics.

## 2026-03-28 - N+1 Database Writes in Synchronization
**Learning:** Individual `add` and `update` calls within a loop during large data synchronization (e.g., downloading from cloud) cause significant performance degradation due to multiple IPC calls and transactions.
**Action:** Use Dexie's `bulkPut` to batch all additions and updates into a single operation. For cases where internal ID mapping is required (like Category IDs for Prompts), use `bulkPut(data, { allKeys: true })` to capture the resulting local IDs in a single pass.

## 2026-10-27 - N+1 Network & DB Writes in Bulk Imports
**Learning:** Individual `.add()` calls combined with inline remote synchronization (`savePromptToSupabase`) within a bulk JSON import loop causes catastrophic N+1 performance degradation. It blocks the main thread, delays the import process proportionally to network latency, and can trigger API rate limits.
**Action:** Extract database insertions from the loop and use `bulkAdd()` for batch processing. Defer cloud synchronization to the background `syncService` by initially marking records with `syncStatus: 'pending'`.
## 2026-10-30 - Replace In-Memory Arrays with Dexie Queries
**Learning:** Calling `toArray()` on large Dexie tables and then using standard Javascript `Array.prototype.filter()` fetches the entire table into memory, leading to severe main-thread blocking and OOM (out-of-memory) crashes on clients with large databases.
**Action:** Chain Dexie methods directly: use `.where('field').equals(value).filter(...)` and `.count()` or `.toArray()` to ensure data reduction is handled by the IndexedDB engine before loading the payload into memory.
