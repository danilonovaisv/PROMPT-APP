# STEP 4 — BUGS TO FIX (INVESTIGATION)

## 1. Playground: "Memória Fixa" input missing
- **File:** `src/components/editor/EditorPlayground.tsx` (lines ~159-178)
- **Observation:** The component iterates over `memoryKeys.map((key) => ...)`, rendering labels and a delete button, but the *actual `<input>` or `<textarea>` element where the user would type the value for the fixed memory is completely absent*. It only displays the key and a delete button.

## 2. Empty Imported Prompts
- **File:** `src/services/importService.ts`
- **Observation:** `buildPromptRecordFromRaw` catches errors and returns `null` silently pushing an error to the array, but `importFromJsonText` and `processPromptImport` might be failing to correctly handle the structure of the incoming JSON if `sanitizeJsonString` or `migrateTemplateToCurrentSchema` strips out essential fields without crashing, resulting in "empty" prompts being saved or discarded. Specifically, `importMenuDefinitions` and schema validation mismatches often cause silent failures.

## 3. Menus Selector Failure
- **File:** `src/components/ImportMenusModal.tsx` & `src/pages/MenuManagerPage.tsx`
- **Observation:** In `EditorPage.tsx`, there is `form.selectedMenuIds` mapped via `displayContextMenus`. The bug report states "Falha no seletor de menus ao vincular a templates existentes". If `selectedMenuIds` contains a numeric ID but the `ContextMenu` interface uses string IDs (or vice-versa due to remote vs local ID mappings), the `.includes()` check will fail, causing the menus to not render or link properly.

## 4. N+1 Queries in Sync
- **Files:** `src/services/sync/categorySync.ts` and `src/services/sync/promptSync.ts`
- **Observation:** Although both files use `await db.categories.where('remoteId').anyOf(remoteIds).toArray()`, avoiding the worst N+1 scenario during reads, there might be N+1 loops during *writes* or *remote fetches*. For instance, if `syncPrompts` iterates and calls Supabase inside a loop instead of batching, or if `db.prompts.add()` is called in a loop instead of `bulkPut`. `Dexie.js` `bulkPut` should be enforced globally.

## 5. Variáveis Fixas
- **File:** `src/components/editor/EditorPlayground.tsx` and `src/pages/EditorPage.tsx`
- **Observation:** The variables fixed memory feature is closely tied to the "Memória Fixa" bug. Since there is no input field provided to actually fill out these fixed variables (only the key name and a delete button are present), users experience difficulty or impossibility in utilizing fixed variables. This needs to be addressed concurrently with adding the input fields in the UI.
