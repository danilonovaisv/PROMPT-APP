## 2024-05-19 - Dexie.js Bulk Operations
**Learning:** Checking for existing records in a loop using `.where('field').equals(value).first()` causes an N+1 query problem, which can be a significant performance bottleneck in indexedDB / Dexie.
**Action:** Always batch queries using `.where('field').anyOf(array).toArray()` to retrieve all existing records at once, reducing database roundtrips.

## 2026-03-26 - Dexie.js Table Counting
**Learning:** Loading entire Dexie.js tables into memory (e.g. `db.prompts.toArray()`) just to count items per category or total items is extremely inefficient, especially since prompt records can have large JSON payloads. IndexedDB counts are fast.
**Action:** Use Dexie's `.count()` and indexed queries (like `.where('categoryId').equals(id).count()`) instead of `.toArray()` followed by array traversal whenever calculating statistics.

## 2024-05-20 - Sync Memory Bloat via Full Table Scans
**Learning:** During cloud synchronization (`downloadFromCloud`), using `.toArray()` to pre-fetch entire Dexie tables (like `prompts`) into memory Maps to avoid N+1 queries creates a severe memory bottleneck, as large records (e.g. JSON payloads) bloat the RAM and can crash the app or slow it down significantly.
**Action:** Extract the relevant IDs from the remote sync payload and query only the required subset from the local database using `.where('remoteId').anyOf(remoteIds).toArray()`. This eliminates both N+1 query problems and full-table scan memory issues safely.
