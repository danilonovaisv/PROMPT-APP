## 2024-05-19 - Dexie.js Bulk Operations
**Learning:** Checking for existing records in a loop using `.where('field').equals(value).first()` causes an N+1 query problem, which can be a significant performance bottleneck in indexedDB / Dexie.
**Action:** Always batch queries using `.where('field').anyOf(array).toArray()` to retrieve all existing records at once, reducing database roundtrips.
