# Graph Report - src  (2026-08-11)

## Corpus Check
- 100 files · ~50,157 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 504 nodes · 671 edges · 20 communities detected
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 87 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Prompt Payload Engine|Prompt Payload Engine]]
- [[_COMMUNITY_Import & Export Components|Import & Export Components]]
- [[_COMMUNITY_Legacy Schema Normalizer|Legacy Schema Normalizer]]
- [[_COMMUNITY_UI Hooks & Category Manager|UI Hooks & Category Manager]]
- [[_COMMUNITY_Supabase Config & Assertions|Supabase Config & Assertions]]
- [[_COMMUNITY_Cloud Sync Auth & Workflows|Cloud Sync Auth & Workflows]]
- [[_COMMUNITY_Editor Definition Forms|Editor Definition Forms]]
- [[_COMMUNITY_Auth & Import Modals|Auth & Import Modals]]
- [[_COMMUNITY_Menu Manager Page|Menu Manager Page]]
- [[_COMMUNITY_Realtime Synchronization Service|Realtime Synchronization Service]]
- [[_COMMUNITY_Database & Seeder Context|Database & Seeder Context]]
- [[_COMMUNITY_Memory Service & Storage|Memory Service & Storage]]
- [[_COMMUNITY_Resource Audit Service|Resource Audit Service]]
- [[_COMMUNITY_Batching & Local Cache Utils|Batching & Local Cache Utils]]
- [[_COMMUNITY_Menu Validation Helpers|Menu Validation Helpers]]
- [[_COMMUNITY_Prompt Renderer Engine|Prompt Renderer Engine]]
- [[_COMMUNITY_Backup & Sync Utilities|Backup & Sync Utilities]]
- [[_COMMUNITY_Category Service|Category Service]]
- [[_COMMUNITY_Few-Shot Normalizer|Few-Shot Normalizer]]
- [[_COMMUNITY_Context Menu Utils|Context Menu Utils]]

## God Nodes (most connected - your core abstractions)
1. `saveLocalBackup()` - 18 edges
2. `buildImportState()` - 15 edges
3. `compilePromptPayload()` - 13 edges
4. `getLegacyPromptColumns()` - 11 edges
5. `buildPersistedArtifacts()` - 10 edges
6. `normalizeContextMenuOptions()` - 10 edges
7. `parseTemplatePayload()` - 9 edges
8. `getPromptSummaryFields()` - 9 edges
9. `withRetry()` - 9 edges
10. `createTemplatePayloadFromLegacyRecord()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `handleMenuChange()` --calls--> `normalizeContextMenuOptions()`  [INFERRED]
  src/services/realtimeService.ts → /Users/PROJETOS DEV/PROMPT-APP/src/utils/contextMenuOptions.ts
- `saveMenuToSupabase()` --calls--> `normalizeContextMenuOptions()`  [INFERRED]
  src/services/supabaseMenus.ts → /Users/PROJETOS DEV/PROMPT-APP/src/utils/contextMenuOptions.ts
- `contextMenuToDefinition()` --calls--> `normalizeContextMenuOptions()`  [INFERRED]
  src/utils/promptArtifacts.ts → /Users/PROJETOS DEV/PROMPT-APP/src/utils/contextMenuOptions.ts
- `runAutoSyncIfAuthenticated()` --calls--> `syncToCloud()`  [INFERRED]
  src/services/autoSync.ts → src/services/syncService.ts
- `handleSmartSync()` --calls--> `smartSync()`  [INFERRED]
  src/components/CloudSyncItem.tsx → src/services/assetManager.ts

## Communities

### Community 0 - "Prompt Payload Engine"
Cohesion: 0.06
Nodes (37): compilePromptPayload(), createEmptyPromptPayload(), createEmptyUserSelection(), getMissingRequiredMemoryKeys(), buildFormStateFromPrompt(), buildInitialFormState(), buildPersistedArtifacts(), fromFreeInputEntries() (+29 more)

### Community 1 - "Import & Export Components"
Cohesion: 0.11
Nodes (28): handleConfirmImport(), handleDownloadTemplate(), handleImport(), handleImportFromText(), listMemoryPlaceholderKeys(), appendIssuesFromZod(), buildImportState(), detectImportFormat() (+20 more)

### Community 2 - "Legacy Schema Normalizer"
Cohesion: 0.15
Nodes (23): convertContextMenuSelectionToSelectedMenus(), createDefaultOutputContract(), createEmptyTemplatePayload(), createPromptPayloadFromLegacyRecord(), createTemplatePayloadFromLegacyRecord(), getLegacyPromptColumns(), getPromptSummaryFields(), normalizeFewShotExamples() (+15 more)

### Community 3 - "UI Hooks & Category Manager"
Cohesion: 0.13
Nodes (16): useConfirm(), useDebounce(), useSearchFilter(), cancel(), handleDelete(), save(), deleteCategoryFromSupabase(), saveCategoryToSupabase() (+8 more)

### Community 4 - "Supabase Config & Assertions"
Cohesion: 0.13
Nodes (18): handleRestore(), assertSupabaseConfigured(), getSupabaseConfigErrorMessage(), normalize(), resolveSupabaseConfig(), downloadFromCloud(), runPhase(), syncToCloud() (+10 more)

### Community 5 - "Cloud Sync Auth & Workflows"
Cohesion: 0.15
Nodes (19): handleSmartSync(), useCloudSync(), parsePromptPayload(), parseUserSelection(), applyRemoteChanges(), checkForUpdates(), detectConflicts(), fetchRemoteSummaries() (+11 more)

### Community 6 - "Editor Definition Forms"
Cohesion: 0.12
Nodes (7): addItems(), handleBlur(), handleKeyDown(), handlePaste(), cn(), Checkbox(), MultiSelect()

### Community 7 - "Auth & Import Modals"
Cohesion: 0.15
Nodes (11): getAuthErrorMessage(), handleSubmit(), handleConfirmImport(), handleFileSelect(), useAccessibleModal(), saveMenusToSupabaseBulk(), checkMenuIdConflicts(), getExistingMenuState() (+3 more)

### Community 8 - "Menu Manager Page"
Cohesion: 0.13
Nodes (7): async(), cancel(), save(), toSlug(), deleteMenuFromSupabase(), saveMenuToSupabase(), exportMenusToJson()

### Community 9 - "Realtime Synchronization Service"
Cohesion: 0.19
Nodes (12): cleanupRealtimeListeners(), createEmptySetupResult(), handleMenuChange(), reconnectRealtime(), setupRealtimeListeners(), subscribeWithStatus(), isRecord(), normalizeContextMenuOptions() (+4 more)

### Community 10 - "Database & Seeder Context"
Cohesion: 0.15
Nodes (7): CloudSyncProvider(), seedDatabase(), getDuplicateIds(), getMissingSeedRecords(), runAutoSyncIfAuthenticated(), setupAutoSync(), init()

### Community 11 - "Memory Service & Storage"
Cohesion: 0.29
Nodes (10): applyMemoryPlan(), deleteMemory(), fetchMemory(), saveMemory(), syncMemory(), deleteDexieMemory(), getDexieMemory(), migrateLegacyMemory() (+2 more)

### Community 12 - "Resource Audit Service"
Cohesion: 0.57
Nodes (7): asError(), getMainResourceSafely(), hasValidResourceId(), isApiUnsupportedError(), isRecord(), log(), runGetResourceContentAudit()

### Community 13 - "Batching & Local Cache Utils"
Cohesion: 0.25
Nodes (1): LocalCache

### Community 14 - "Menu Validation Helpers"
Cohesion: 0.48
Nodes (5): isObject(), normalizeAndValidateMenu(), normalizeMenuBatch(), normalizeOptions(), normalizeRawMenu()

### Community 15 - "Prompt Renderer Engine"
Cohesion: 0.67
Nodes (4): isSemanticallyEmpty(), validateImportPayload(), validatePromptDefinition(), validateTextField()

### Community 16 - "Backup & Sync Utilities"
Cohesion: 0.5
Nodes (2): hasNonEmptyTrimmedString(), isValidFewShotExample()

### Community 18 - "Category Service"
Cohesion: 0.67
Nodes (2): SEO(), getRouteMetadata()

### Community 20 - "Few-Shot Normalizer"
Cohesion: 0.67
Nodes (2): emitState(), syncToCloudWithPhases()

### Community 21 - "Context Menu Utils"
Cohesion: 0.67
Nodes (1): Header()

## Knowledge Gaps
- **Thin community `Batching & Local Cache Utils`** (8 nodes): `batchingUtils.ts`, `createBatcher()`, `LocalCache`, `.constructor()`, `.get()`, `.invalidate()`, `.invalidateAll()`, `.set()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Backup & Sync Utilities`** (5 nodes): `normalizeFewShot.ts`, `hasNonEmptyTrimmedString()`, `isValidFewShotExample()`, `normalizeFewShotExamples()`, `toNonEmptyString()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Category Service`** (4 nodes): `SEO()`, `SEO.tsx`, `routeMetadata.ts`, `getRouteMetadata()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Few-Shot Normalizer`** (4 nodes): `emitState()`, `subscribeSyncState()`, `syncToCloudWithPhases()`, `syncStatus.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Context Menu Utils`** (3 nodes): `Header()`, `Header.tsx`, `HomePage.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `saveLocalBackup()` connect `UI Hooks & Category Manager` to `Prompt Payload Engine`, `Import & Export Components`, `Supabase Config & Assertions`, `Cloud Sync Auth & Workflows`, `Menu Manager Page`, `Realtime Synchronization Service`?**
  _High betweenness centrality (0.119) - this node is a cross-community bridge._
- **Why does `getPromptSummaryFields()` connect `Legacy Schema Normalizer` to `Prompt Payload Engine`, `Database & Seeder Context`, `Cloud Sync Auth & Workflows`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `normalizeContextMenuOptions()` connect `Realtime Synchronization Service` to `Menu Manager Page`, `Prompt Payload Engine`, `Supabase Config & Assertions`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `saveLocalBackup()` (e.g. with `save()` and `handleDelete()`) actually correct?**
  _`saveLocalBackup()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `buildImportState()` (e.g. with `getBulkExportWarning()` and `parseTemplatePayload()`) actually correct?**
  _`buildImportState()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `compilePromptPayload()` (e.g. with `buildPersistedArtifacts()` and `applyRemoteChanges()`) actually correct?**
  _`compilePromptPayload()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `getLegacyPromptColumns()` (e.g. with `pushLocalChanges()` and `savePromptToSupabase()`) actually correct?**
  _`getLegacyPromptColumns()` has 3 INFERRED edges - model-reasoned connections that need verification._