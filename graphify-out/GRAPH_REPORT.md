# Graph Report - src  (2026-05-04)

## Corpus Check
- Corpus is ~35,976 words - fits in a single context window. You may not need a graph.

## Summary
- 305 nodes · 429 edges · 16 communities detected
- Extraction: 82% EXTRACTED · 18% INFERRED · 0% AMBIGUOUS · INFERRED: 77 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Prompt Schema Builders|Prompt Schema Builders]]
- [[_COMMUNITY_Editor Form State|Editor Form State]]
- [[_COMMUNITY_ImportExport Pipeline|Import/Export Pipeline]]
- [[_COMMUNITY_Auth & Cloud Sync|Auth & Cloud Sync]]
- [[_COMMUNITY_Category Management|Category Management]]
- [[_COMMUNITY_Sync Conflict Resolution|Sync Conflict Resolution]]
- [[_COMMUNITY_Context Menu Editor|Context Menu Editor]]
- [[_COMMUNITY_Realtime Subscriptions|Realtime Subscriptions]]
- [[_COMMUNITY_Menu Import Flow|Menu Import Flow]]
- [[_COMMUNITY_ExportDownload Tools|Export/Download Tools]]
- [[_COMMUNITY_Prompt Rendering Engine|Prompt Rendering Engine]]
- [[_COMMUNITY_Resource Audit Utils|Resource Audit Utils]]
- [[_COMMUNITY_Memory Service|Memory Service]]
- [[_COMMUNITY_Few-Shot Normalizer|Few-Shot Normalizer]]
- [[_COMMUNITY_Supabase Config|Supabase Config]]
- [[_COMMUNITY_Auth Modal|Auth Modal]]

## God Nodes (most connected - your core abstractions)
1. `buildPersistedArtifacts()` - 11 edges
2. `syncToCloud()` - 11 edges
3. `saveLocalBackup()` - 10 edges
4. `importFromJsonText()` - 10 edges
5. `createTemplatePayloadFromLegacyRecord()` - 8 edges
6. `getLegacyPromptColumns()` - 8 edges
7. `buildPromptRecordFromRaw()` - 8 edges
8. `compilePromptPayload()` - 7 edges
9. `handleSave()` - 7 edges
10. `pushLocalChanges()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `handleSmartSync()` --calls--> `smartSync()`  [INFERRED]
  components/CloudSyncItem.tsx → services/assetManager.ts
- `syncToCloud()` --calls--> `normalizeContextMenuOptions()`  [INFERRED]
  services/syncService.ts → utils/contextMenuOptions.ts
- `handleMenuChange()` --calls--> `normalizeContextMenuOptions()`  [INFERRED]
  services/realtimeService.ts → utils/contextMenuOptions.ts
- `saveMenuToSupabase()` --calls--> `normalizeContextMenuOptions()`  [INFERRED]
  services/supabaseMenus.ts → utils/contextMenuOptions.ts
- `importMenusFromFile()` --calls--> `saveMenuToSupabase()`  [INFERRED]
  utils/importMenusJson.ts → services/supabaseMenus.ts

## Communities

### Community 0 - "Prompt Schema Builders"
Cohesion: 0.14
Nodes (25): compilePromptPayload(), convertContextMenuSelectionToSelectedMenus(), createDefaultOutputContract(), createEmptyPromptPayload(), createEmptyTemplatePayload(), createEmptyUserSelection(), createPromptPayloadFromLegacyRecord(), createTemplatePayloadFromLegacyRecord() (+17 more)

### Community 1 - "Editor Form State"
Cohesion: 0.12
Nodes (17): buildFormStateFromPrompt(), buildPersistedArtifacts(), clearDraft(), fromFreeInputEntries(), getLinkedContextMenusFromSelection(), handleDeleteMemory(), handleSave(), isUnauthenticatedCloudError() (+9 more)

### Community 2 - "Import/Export Pipeline"
Cohesion: 0.16
Nodes (18): handleImport(), handleImportFromText(), buildPromptRecordFromRaw(), definitionToContextMenu(), importFromFile(), importFromJsonText(), importMenuDefinitions(), isBulkExport() (+10 more)

### Community 3 - "Auth & Cloud Sync"
Cohesion: 0.12
Nodes (8): handleRestore(), handleSmartSync(), assertSupabaseConfigured(), runAutoSyncIfAuthenticated(), persistContextMenuRecord(), downloadFromCloud(), syncToCloud(), withRetry()

### Community 4 - "Category Management"
Cohesion: 0.15
Nodes (11): cancel(), handleDelete(), save(), ensureImportCategory(), deleteCategoryFromSupabase(), saveCategoryToSupabase(), deletePromptFromSupabase(), createSnapshot() (+3 more)

### Community 5 - "Sync Conflict Resolution"
Cohesion: 0.24
Nodes (14): getPrimaryReferenceUrl(), getPromptSummaryFields(), applyRemoteChanges(), checkForUpdates(), detectConflicts(), getLocalItem(), mergeChanges(), pullLatestChanges() (+6 more)

### Community 6 - "Context Menu Editor"
Cohesion: 0.14
Nodes (4): cancel(), save(), toSlug(), saveMenuToSupabase()

### Community 7 - "Realtime Subscriptions"
Cohesion: 0.23
Nodes (11): cleanupRealtimeListeners(), handleMenuChange(), reconnectRealtime(), setupRealtimeListeners(), isRecord(), normalizeContextMenuOptions(), normalizeOption(), normalizeSubOption() (+3 more)

### Community 8 - "Menu Import Flow"
Cohesion: 0.27
Nodes (10): handleConfirmImport(), handleFileSelect(), checkMenuIdConflicts(), importMenusFromFile(), isObject(), toContextMenu(), validateMenu(), validateMenuImportFile() (+2 more)

### Community 9 - "Export/Download Tools"
Cohesion: 0.21
Nodes (12): handleDownloadTemplate(), handleCopy(), handleDownload(), async(), copyToClipboard(), downloadAllPrompts(), downloadJson(), downloadPrompt() (+4 more)

### Community 10 - "Prompt Rendering Engine"
Cohesion: 0.33
Nodes (8): buildListBlock(), buildMenuLines(), getCompiledPayloadForPrompt(), renderFinalPromptText(), renderPromptTextFromPrompt(), syncTemplateWithLinkedMenus(), syncTemplateWithMenuDefinitions(), uniqueStrings()

### Community 11 - "Resource Audit Utils"
Cohesion: 0.57
Nodes (7): asError(), getMainResourceSafely(), hasValidResourceId(), isApiUnsupportedError(), isRecord(), log(), runGetResourceContentAudit()

### Community 12 - "Memory Service"
Cohesion: 0.73
Nodes (5): deleteMemory(), fetchMemory(), getLocalMemory(), saveMemory(), setLocalMemory()

### Community 13 - "Few-Shot Normalizer"
Cohesion: 0.5
Nodes (2): hasNonEmptyTrimmedString(), isValidFewShotExample()

### Community 17 - "Supabase Config"
Cohesion: 0.67
Nodes (2): normalize(), resolveSupabaseConfig()

### Community 20 - "Auth Modal"
Cohesion: 1.0
Nodes (2): getAuthErrorMessage(), handleSubmit()

## Knowledge Gaps
- **Thin community `Few-Shot Normalizer`** (5 nodes): `hasNonEmptyTrimmedString()`, `isValidFewShotExample()`, `normalizeFewShotExamples()`, `toNonEmptyString()`, `normalizeFewShot.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Supabase Config`** (4 nodes): `getSupabaseConfigErrorMessage()`, `normalize()`, `resolveSupabaseConfig()`, `supabaseConfig.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Auth Modal`** (3 nodes): `getAuthErrorMessage()`, `handleSubmit()`, `AuthModal.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `saveLocalBackup()` connect `Category Management` to `Editor Form State`, `Import/Export Pipeline`, `Sync Conflict Resolution`, `Context Menu Editor`?**
  _High betweenness centrality (0.135) - this node is a cross-community bridge._
- **Why does `handleSave()` connect `Editor Form State` to `Category Management`, `Sync Conflict Resolution`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Why does `syncToCloud()` connect `Auth & Cloud Sync` to `Prompt Schema Builders`, `Category Management`, `Sync Conflict Resolution`, `Realtime Subscriptions`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `buildPersistedArtifacts()` (e.g. with `migrateTemplateToCurrentSchema()` and `syncTemplateWithLinkedMenus()`) actually correct?**
  _`buildPersistedArtifacts()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `syncToCloud()` (e.g. with `assertSupabaseConfigured()` and `createSnapshot()`) actually correct?**
  _`syncToCloud()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `saveLocalBackup()` (e.g. with `handleSave()` and `save()`) actually correct?**
  _`saveLocalBackup()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `importFromJsonText()` (e.g. with `handleImportFromText()` and `getBulkExportWarning()`) actually correct?**
  _`importFromJsonText()` has 3 INFERRED edges - model-reasoned connections that need verification._