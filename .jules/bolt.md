## 2024-05-19 - Dexie.js Bulk Operations
**Learning:** Checking for existing records in a loop using `.where('field').equals(value).first()` causes an N+1 query problem, which can be a significant performance bottleneck in indexedDB / Dexie.
**Action:** Always batch queries using `.where('field').anyOf(array).toArray()` to retrieve all existing records at once, reducing database roundtrips.

## 2026-03-26 - Dexie.js Table Counting
**Learning:** Loading entire Dexie.js tables into memory (e.g. `db.prompts.toArray()`) just to count items per category or total items is extremely inefficient, especially since prompt records can have large JSON payloads. IndexedDB counts are fast.
**Action:** Use Dexie's `.count()` and indexed queries (like `.where('categoryId').equals(id).count()`) instead of `.toArray()` followed by array traversal whenever calculating statistics.

## 2026-03-28 - N+1 Database Writes in Synchronization
**Learning:** Individual `add` and `update` calls within a loop during large data synchronization (e.g., downloading from cloud) cause significant performance degradation due to multiple IPC calls and transactions.
**Action:** Use Dexie's `bulkPut` to batch all additions and updates into a single operation. For cases where internal ID mapping is required (like Category IDs for Prompts), use `bulkPut(data, { allKeys: true })` to capture the resulting local IDs in a single pass.
