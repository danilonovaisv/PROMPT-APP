# Root Cause Analysis: Prompt I/O & Persistence Errors

## 1. Executive Summary
This report details the findings of Agent A (Prompt Flow Orchestrator) regarding the data integrity and persistence lifecycle of Prompts in the Ghost System portfolio. The analysis covered State Management, Supabase Database Services, and Import/Export utilities.

## 2. Identified Root Causes

### A. Persistence & Supabase Integration (Already partially addressed, but missing local sync fallback)
1. **Schema Mismatches:** Supabase expects specific snake_case column names (`system_role`, `output_schema`, etc.) and JSON/text formats. The local Dexie state uses camelCase (`systemRole`, `outputSchema`). This was causing silent drops of payload fields. 
2. **Missing `remoteId` Mapping:** Newly created prompts locally in Dexie lacked the remote Supabase ID assignment upon initial creation, causing subsequent edits to trigger multiple INSERTs instead of UPDATEs mapping to the same user and category.

### B. Export Utility Failures (`src/utils/exportJson.ts`)
1. **Strict Object Property Access:** `toExportFormat` eagerly accesses properties like `prompt.outputSchema.formato` and `prompt.fewShotExamples.filter`. Legacy prompts might not have these nested structures initialized, leading to throwing a `TypeError: Cannot read properties of undefined` and crashing the export entirely.
2. **Data Truncation on Export:** Legacy `menus` properties were sometimes skipped correctly, but `enabledMenuIds` was assumed to always be an array.

### C. Import Utility Failures (`src/utils/importJson.ts`)
1. **Rigid Schema Validation:** The `isValidPromptExport` function strictly checks `typeof p.system_role === 'string'`. If a user exported an older prompt without a system role or task (e.g. `undefined`), the prompt is silently dropped during batch DB import.
2. **Fallbacks Missing:** Missing strict array checks for `constraints` and `negativePrompt` during `fromExportFormat` leading to errors when mapping these items on the UI later.

## 3. Recommended Actions for Agent B
- Refactor `exportJson.ts` with rigorous fallback values (`prompt.outputSchema?.formato || 'texto'`).
- Refactor `importJson.ts` to loosen `isValidPromptExport` strictness and apply array validation/type coercion to imported data.
- Ensure `supabasePrompts.ts` payload covers any missing Edge Case (e.g., explicit nullifications for DB columns).

**Handoff to Agent B:** Proceeding with code modifications in `src/utils/exportJson.ts` and `src/utils/importJson.ts`.
