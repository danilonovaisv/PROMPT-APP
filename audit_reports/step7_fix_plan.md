# STEP 7 — FIX PLAN

## 1. Blockers (P0)
- **Fix "Memória Fixa" Input**: Edit `src/components/editor/EditorPlayground.tsx` (lines 160-170) to insert a `<textarea>` or `<input>` tied to `onSaveMemory(key, value)`. Currently, it only renders the label and delete button.
- **Fix Empty Import Prompts**: Review the error handling in `src/services/importService.ts` (`buildPromptRecordFromRaw`). Ensure that schema transformations inside `migrateTemplateToCurrentSchema` do not silently drop essential payload properties, leaving the prompt definition visually blank.

## 2. Stability (P1)
- **Sync N+1 Writing Fixes**: Investigate the loops within `src/services/sync/promptSync.ts` and `categorySync.ts`. Implement batch requests to Supabase (e.g., using `.insert(array)`) rather than awaiting individual saves within loops.
- **Test Suite Stabilization**: Ensure missing `VITE_SUPABASE_URL` env variable errors in Jest are bypassed or mocked properly in `tests/setup.ts` to unblock CI.

## 3. UX/DX (P2)
- **Menu Selector Fix**: In `src/components/ImportMenusModal.tsx` and `src/pages/EditorPage.tsx`, resolve the ID type mismatch. Ensure `selectedMenuIds` accurately maps between numeric local IDs and string/UUID remote IDs using `remoteToLocalMenuMap` before calling `.includes()`.
