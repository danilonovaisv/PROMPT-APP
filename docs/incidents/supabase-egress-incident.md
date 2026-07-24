# Supabase Egress Incident

## Timeline

- 2026-07-24: Supabase project `dpejskjpghoozbpfxkpf` observed in restricted state with `exceed_cached_egress_quota` and `exceed_egress_quota`.
- 2026-07-24: Repository audit confirmed the live app is a Vite React SPA using browser-side Supabase sync and Realtime, not Next.js SSR.
- 2026-07-24: Read-only SQL inventory confirmed a public Storage bucket with 5 objects totaling about 9.4 MB and application tables dominated by large prompt JSON payloads.
- 2026-07-24: Code audit confirmed repeated full-table reads on authenticated sessions through conflict detection and sync helpers.
- 2026-07-24: Mitigation branch added lightweight metadata checks, reduced polling, and preserved manual hydration only when a real remote diff exists.

## Symptom

Supabase restricted the project due to cached and uncached egress quota violations. API health probes currently return HTTP `402`, preventing normal service operation until billing restrictions are cleared.

## Impact

- Auth, REST, Realtime, and any browser sync flow are unavailable while the project remains restricted.
- Users cannot rely on cloud synchronization for prompts, menus, categories, or prompt memory.
- The owner cannot safely restore service by billing action alone without first reducing repeated egress from the app.

## Services Affected

- Supabase Auth
- Supabase PostgREST / API
- Supabase Realtime
- Supabase Storage
- Browser-side sync flows in the SPA

## Root Cause

Primary root cause for uncached egress:

- The app performed repeated authenticated full-table reads for conflict detection and sync preparation.
- `checkForUpdates()` called `detectConflicts()`, which loaded entire tables, including large prompt payload JSON, on a timer from the browser session.
- `pullLatestChanges()` also loaded complete tables before deciding whether any local change was needed.

Primary suspected cause for cached egress:

- A public Storage bucket named `HIGGSFIELD` exists in the same project.
- The current app code does not reference Supabase Storage, so cached egress likely came from external access patterns such as shared public URLs, hotlinking, or repeated manual/bot downloads.

## Contributing Factors

- Prompt rows contain large JSON payloads, with prompt payload plus compiled payload plus selection payload totaling roughly 3.5 MB across only 85 rows.
- The app previously polled every 30 seconds even when Realtime was healthy.
- The project mixes application data and public media in the same Supabase project, making incident attribution harder.
- Local `.env` files contain sensitive Supabase credentials. This was not used as the confirmed egress source, but it raises the risk profile if those secrets were ever exposed outside the workstation.

## Evidence

- Repository evidence:
  - `src/context/CloudSyncContext.tsx` previously scheduled `refreshUpdates()` every 30 seconds for authenticated sessions.
  - `src/services/assetManager.ts` previously used `select("*")` across `categories`, `prompts`, `context_menus`, and `prompt_memory_context` for conflict checks and pull logic.
- Database evidence:
  - `prompts`: 85 rows, average `prompt_payload_jsonb` size about 25.5k chars, maximum about 172k chars.
  - Approximate prompt-related text volume: about 3,525,921 characters.
  - `prompt_memory_context`: 216 rows, about 355,293 characters.
  - `context_menus`: 140 rows, about 219,201 characters.
- Storage evidence:
  - Buckets: `HIGGSFIELD` public, `attachments` private.
  - `HIGGSFIELD` object count: 5.
  - `HIGGSFIELD` total bytes: about 9,447,814.
- Operational evidence:
  - Current API logs show repeated `402` on internal health paths, consistent with active project restriction.

## Resolution

Code mitigation applied in this branch:

- Replaced automatic conflict polling from full row hydration to metadata-only remote summaries.
- Added selective hydration so full payloads are fetched only when a real diff must be applied.
- Disabled periodic update polling while Realtime is active.
- Reduced fallback polling interval from 30 seconds to 5 minutes when Realtime is not active.
- Added regression coverage to ensure polling does not continue while Realtime is healthy.

Administrative action still required:

- The project owner must clear the Supabase restriction by upgrading, disabling Spend Cap, or waiting for billing cycle reset, depending on the organization plan and billing state.

## Preventive Actions

- Keep update checks metadata-only unless a diff requires full row fetch.
- Use Realtime as the primary change signal, not timer-driven full sync.
- Separate public media from app data when media is not part of the core product path.
- Audit public buckets and disable unused public exposure.
- Add usage monitoring and a runbook for egress anomalies.

## Pending Items

- Confirm actual plan, Spend Cap state, and billing cycle end date in the Supabase dashboard.
- Confirm whether `HIGGSFIELD` assets were linked externally.
- Decide whether to rotate sensitive Supabase credentials after the incident.
- Observe post-unblock usage to verify that uncached egress drops to the expected range.
