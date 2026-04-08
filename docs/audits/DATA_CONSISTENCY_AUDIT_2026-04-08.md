# Data Consistency Audit - April 8, 2026

## Executive Summary

**Status:** ⚠️ IN PROGRESS - Gaps Identified  
**Date:** April 8, 2026  
**Auditor:** AI Agent with Superpowers Skills  
**Scope:** Legacy JSON structure vs Supabase schema vs TypeScript interfaces

---

## Legacy JSON Fields vs Current Schema

| Legacy Field | Current Location | Status | Notes |
|--------------|------------------|--------|-------|
| `system_role` | `prompt_definition.system_role` | ✅ Mapped | Direct column + JSONB |
| `task` | `prompt_definition.task` | ✅ Mapped | Direct column + JSONB |
| `input_data.context` | `prompt_definition.context` | ✅ Mapped | Extracted from nested object |
| `input_data.menus_selecionados` | ⚠️ RENAMED | 🟡 Documented | Migrated to `menu_definitions` + `selectionPayload` in v3 |
| `user_scene_description` | ❌ MISSING | 🔴 GAP | Only in placeholder text, not in schema |
| `constraints` | `prompt_definition.constraints` | ✅ Mapped | Array in JSONB |
| `negative_prompt` | `prompt_definition.negative_prompt` | ✅ Mapped | Array in JSONB |
| `output_schema.formato` | `output_contract.format` | ✅ Mapped | Normalized (texto→text) |
| `output_schema.estrutura` | `output_contract.response_rules` | ✅ Mapped | Split by comma on import, joined on export |
| `required_fields` | `output_contract.required_fields` | 🔴 GAP | **NOT MAPPED** from legacy format |
| `response_rules` | `output_contract.response_rules` | ✅ Mapped | Array in JSONB |
| `few_shot_examples` | `prompt_definition.few_shot_examples` | ✅ Mapped | Array in JSONB |

## Critical Gaps Identified

### 1. `required_fields` NOT MAPPED (HIGH PRIORITY)
**Problem:** Legacy JSON has `required_fields` array but it's not being extracted during `parsePromptPayload()`.

**Evidence:** Test failure shows `output_contract.required_fields` returns empty array `[]` instead of `["field1"]`.

**Impact:** Required fields specified in legacy prompts are lost during migration/sync.

**Location:** `src/models/promptSchema.ts` - `createTemplatePayloadFromLegacyRecord()` function

**Fix Needed:** Add mapping for `required_fields` from legacy format to `output_contract.required_fields`.

### 2. `user_scene_description` MISSING (MEDIUM PRIORITY)
**Problem:** Field appears in UI placeholder text but has no schema definition or storage.

**Evidence:** Found only in `EditorPlayground.tsx:63` as placeholder, nowhere in Zod schemas.

**Impact:** Users cannot save scene descriptions; data entered would be lost.

**Fix Needed:** 
- Add field to `PromptDefinitionSchema`
- Add UI input in `EditorDefinitionForm`
- Update legacy conversion

### 3. `input_data.menus_selecionados` / `contextMenus` MIGRATION ISSUE (HIGH PRIORITY)
**Problem:** Legacy `contextMenus` object is NOT being converted to new format during parsing.

**Evidence:** Test shows `parsed.menu_ids` returns empty array `[]` instead of `["tom"]`.

**Expected Behavior:**
- Legacy format: `contextMenus: { tom: { option: "formal", subOptions: [...] } }`
- Should convert to: `menu_ids: ["tom"]` + proper selectionPayload

**Current State:** 
- Conversion function exists: `convertContextMenuSelectionToSelectedMenus()` (line 270-291)
- BUT it's only called in `parseUserSelection()`, NOT in `parsePromptPayload()`
- Menu data is lost during prompt payload parsing

**Impact:** Menu selections from legacy prompts are lost during migration/sync.

**Fix Needed:** 
- Call `convertContextMenuSelectionToSelectedMenus()` in `createTemplatePayloadFromLegacyRecord()`
- Set `menu_ids` field in returned TemplatePayload
- Ensure menu_definitions are passed through

---

## Database Columns Verified

### From `supabase/migrations/20260220000000_initial_schema.sql`:
```sql
CREATE TABLE public.prompts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  category_id BIGINT REFERENCES public.categories(id),
  title TEXT NOT NULL,
  system_role TEXT,                    ✅
  task TEXT,                           ✅
  context TEXT,                        ✅
  menus JSONB,                         ⚠️ Deprecated
  context_menus JSONB,                 ⚠️ Deprecated
  enabled_menu_ids TEXT[],             ⚠️ Deprecated
  constraints JSONB,                   ✅
  negative_prompt JSONB,               ✅
  output_schema JSONB,                 ✅
  selected_menu_ids BIGINT[],          ✅
  few_shot_examples JSONB,             ✅
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### From `supabase/migrations/20260319000000_restore_missing_columns.sql`:
```sql
ALTER TABLE public.prompts ADD COLUMN:
  reference_url TEXT,                  ✅
  prompt_payload_jsonb JSONB,          ✅ (contains full TemplatePayload)
  schema_version TEXT,                 ✅
  output_format TEXT,                  ✅
  language TEXT,                       ✅
  selected_menu_ids BIGINT[];          ✅
```

**Note:** Legacy columns (`system_role`, `task`, etc.) are kept for backward compatibility alongside `prompt_payload_jsonb`.

---

## Sync Logic Analysis

### Upload (`syncToCloud`) - `src/services/syncService.ts`

**Lines 241-261:** Calls `getLegacyPromptColumns()` to extract legacy fields
```typescript
const legacyColumns = getLegacyPromptColumns(
  data.promptPayload,
  data.selectionPayload,
  data.compiledPayload,
);

const payload = {
  user_id: userId,
  category_id: remoteCategoryId || null,
  title: summary.title,
  prompt_payload_jsonb: data.promptPayload,  // Full structured data
  ...legacyColumns,  // Legacy columns for backward compat
};
```

**Status:** ✅ All available legacy columns are populated

### Download (`downloadFromCloud`) - `src/services/syncService.ts`

**Lines 458-471:** Calls `parsePromptPayload()` with fallback legacy fields
```typescript
promptPayload: parsePromptPayload(p.prompt_payload_jsonb, {
  title: p.title,
  systemRole: p.system_role,
  task: p.task,
  context: p.context,
  contextMenus: p.context_menus,
  enabledMenuIds: p.enabled_menu_ids,
  constraints: p.constraints,
  negativePrompt: p.negative_prompt,
  outputSchema: p.output_schema,
  referenceUrl: p.reference_url,
  language: p.language,
  schemaVersion: p.schema_version,
}),
```

**Status:** ⚠️ Missing `required_fields` in fallback object

---

## Test Results

### Unit Tests Created
- File: `tests/unit/promptSchemaAudit.test.ts`
- Tests: 2
- Passing: 1
- Failing: 1 (`required_fields` mapping)

### Failure Details
```
expect(mapped.output_contract.required_fields).toEqual(["field1"]);
                                                       ^
Expected: ["field1"]
Received: []
```

---

## Next Steps

1. **Fix `required_fields` mapping** (Task 4 continuation)
   - Update `createTemplatePayloadFromLegacyRecord()` to extract `required_fields`
   - Add to fallback object in `downloadFromCloud()`
   - Verify with tests

2. **Add `user_scene_description` field** (Task 3)
   - Add to `PromptDefinitionSchema`
   - Add UI input
   - Update legacy conversion

3. **Complete round-trip integration test** (Task 5)
   - Verify all fields preserved through upload/download cycle

4. **Update frontend forms** (Task 6)
   - Ensure all fields have UI inputs

---

## Recommendations

### Immediate Actions
1. Fix `required_fields` mapping (data loss issue)
2. Add `user_scene_description` to schema (missing feature)

### Future Improvements
1. **Deprecate Legacy Columns:** Once all clients migrate to v3, remove duplicate legacy columns and rely solely on `prompt_payload_jsonb`
2. **Schema Validation:** Add runtime validation on Supabase insert/update triggers
3. **Migration Script:** Create script to backfill `required_fields` for existing prompts if data exists elsewhere
4. **Monitoring:** Add telemetry to track sync errors related to schema mismatches

---

**Last Updated:** April 8, 2026  
**Next Review:** After Task 4 completion
