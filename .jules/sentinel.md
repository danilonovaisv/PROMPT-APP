## 2026-03-24 - [Incomplete Data Validation]
**Vulnerability:** Application crashed with `TypeError: Cannot read properties of undefined` when attempting to load prompts with corrupted `selectionPayload` from legacy database versions.
**Learning:** Legacy records might contain structural inconsistencies not captured by simple type assertions (`as UserSelection`).
**Prevention:** Implement custom type guards (like `isValidSnapshot`) or use strict Zod schemas (`UserSelectionSchema.safeParse`) to validate untrusted or legacy data structures retrieved from IndexedDB or `localStorage` before accessing nested properties.

## 2026-03-28 - [Over-fetching Data into Memory]
**Vulnerability:** Synchronizing prompts involved fetching the entire local `categories` table into a JavaScript Map (`await db.categories.toArray()`), which can cause Out-Of-Memory (OOM) crashes on devices with large datasets or low memory availability.
**Learning:** Pre-fetching entire datasets into memory to solve N+1 query problems trades a CPU/Network bottleneck for a Memory bottleneck.
**Prevention:** Extract the necessary foreign keys (e.g., `remoteCategoryIds`) from the incoming payload and query only the required subset of records using `.where('remoteId').anyOf(remoteIds).toArray()`.

## 2026-10-27 - [Arbitrary Code Execution via Links]
**Vulnerability:** Anchor tags (`<a target="_blank">`) dynamically generated from user input lacked the `rel="noopener noreferrer"` attributes, potentially allowing newly opened tabs to hijack the original window object via `window.opener`.
**Learning:** Modern browsers have largely mitigated this by defaulting to `noopener` for `target="_blank"`, but explicitly defining it remains a critical defense-in-depth measure, especially for older clients.
**Prevention:** Enforce `rel="noopener noreferrer"` on all external links, particularly those rendering user-provided URLs (like references in `PromptCard.tsx`).
## 2026-04-18 - [Over-fetching Data into Memory]
**Vulnerability:** Fetching the entire prompts table (`await db.prompts.toArray()`) just to filter out soft-deleted items creates severe memory bottlenecks, especially with large JSON payloads.
**Learning:** The `isDeleted` field is not indexed, so using a simple `.where('isDeleted').equals(false)` fails. However, fetching the entire table is not the solution.
**Prevention:** Use Dexie's Collection `.filter()` method (e.g., `db.prompts.filter(p => !p.isDeleted).toArray()`) to evaluate conditions efficiently without loading all objects into the main JavaScript array, or ensure critical query fields are added to the IndexedDB schema.

## 2026-04-24 - [Over-fetching Data into Memory]
**Vulnerability:** Fetching the entire prompts table (`await db.prompts.toArray()`) just to filter out soft-deleted items creates severe memory bottlenecks, especially with large JSON payloads.
**Learning:** The `isDeleted` field is not indexed, so using a simple `.where('isDeleted').equals(false)` fails. However, fetching the entire table is not the solution.
**Prevention:** Use Dexie's Collection `.filter()` method (e.g., `db.prompts.filter(p => !p.isDeleted).toArray()`) to evaluate conditions efficiently without loading all objects into the main JavaScript array, or ensure critical query fields are added to the IndexedDB schema.

## 2026-05-13 - [Sync State Vulnerability]
**Vulnerability:** Sync methods `downloadCategories` and `downloadPrompts` blindly overwrite local Dexie records with cloud data.
**Learning:** This caused silent data loss if a user had local unsynced edits (`syncStatus` set to 'pending' or 'error').
**Prevention:** Always verify `existing?.syncStatus` before updating local IndexedDB records from the cloud.
