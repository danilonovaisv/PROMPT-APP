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
## 2026-04-17 - Dexie.js Frontend Filtering
**Learning:** React frontend code commonly loads entire tables into memory just to filter them locally (e.g. `const allPrompts = await db.prompts.toArray(); return allPrompts.filter(...)`). This creates severe memory bottlenecks with large JSON payloads, locking the main thread and slowing down renders.
**Action:** Always delegate filtering to IndexedDB by replacing `table.toArray().filter(...)` with `.where('field').equals(value).filter(condition).toArray()`. If only a total is needed, replace `.toArray().length` with `.count()`.

## 2024-05-30 - O(N) memory allocation avoidance for Dexie queries
**Learning:** Calling `.toArray()` on a Dexie table before filtering (e.g. `await db.table.toArray().then(arr => arr.filter(...))`) causes an unnecessary intermediate array allocation in memory that includes all items, which is highly inefficient for large tables containing heavy JSON payloads, and can cause memory bottlenecks.
**Action:** Chain `.filter()` directly onto the Dexie query object before calling `.toArray()` (e.g. `await db.table.filter(...).toArray()`) to evaluate the filter sequentially during iteration and prevent loading excluded (e.g., soft-deleted) items into the final JS array.
## 2024-05-18 - Prevent memory allocation on deletion
**Learning:** Checking the number of items using `db.table.filter(...).toArray().length` just to show a user confirmation prompt pulls all actual objects into memory, significantly pausing the main thread for large datasets (like prompt arrays with JSON payloads).
**Action:** Call `await db.table.filter(...).count()` to get statistics for confirmation prompts and only call `await db.table.filter(...).toArray()` *after* the user confirms the action to avoid unnecessary allocations.
