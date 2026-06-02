## Bugs Investigation

### 1. Playground: "Fixed Memory" feature missing input/implementation
`src/components/editor/EditorPlayground.tsx` has code for `fixedMemory` (mapping keys to values via `<textarea>` in `memory-card`). However, in `src/pages/EditorPage.tsx`, `fixedMemory` logic exists to handle variables in memory context. The integration between user-selected menus and variables or maybe `memoryKeys.length > 0` might be hiding things when there are no pre-populated keys from the template, despite the UI allowing `isAddingKey` and adding a new key.

### 2. Variables: Difficulty filling in fixed variables
The user states "Difficulty filling in fixed variables." When `debouncedFixedMemory` updates, it triggers `syncMemory` which saves to Dexie `promptMemory` table via `memoryService.ts`. The inputs in EditorPlayground use `onSaveMemory` mapped to `handleSaveMemory`, which does an immediate React state update. The debounce handles save. There may be an issue with typing, rendering loop, or missing `importService` filling initial fixed variables from templates when there is none.

### 3. Importation: Prompts imported via JSON appear empty in the UI
In `src/services/importService.ts`, when importing via bulk:
`db.prompts.bulkAdd(promptsToInsert as Prompt[])` is used.
`promptsToInsert` are structured correctly. But if it "appears empty", it might be that they lack `categoryId` correctly mapped, or maybe React Router loader for `PromptPage` or `CategoryPage` requires a certain ID. If they appear empty in UI, it could be a Dexie index issue or React Context. `syncStatus: 'pending'` is present.

### 4. Menus: Failure in the menu selector when linking to existing templates
In `src/pages/EditorPage.tsx` or Menu components. The menu linking could be failing because of string IDs vs Number IDs. `contextMenus` has `menuId` (string) but also an internal `id` (number/string from Supabase).

### 5. Sync: N+1 queries in category/prompt loading
In `src/services/importService.ts`, the developer added: "Bolt Optimization: Pre-fetch categories used in this bulk import to eliminate N+1 query problem." BUT, during `sync/promptSync.ts` there might still be N+1 queries. We saw `where('remoteId').anyOf(remoteIds).toArray()` used, which eliminates it, but wait: is there N+1 when mapping relationships? We need to review `syncService.ts` and `db.prompts` hooks.
