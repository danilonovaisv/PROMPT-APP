# PROMPT-APP Runtime Audit

> Baseline captured on 2026-04-08. See the evidence appendix for Task 1 verification.

**Status:** In progress

**Evidence:** [`2026-04-08-prompt-app-runtime-audit-evidence.md`](/Users/PROJETOS%20DEV/PROMPT-APP/docs/audits/2026-04-08-prompt-app-runtime-audit-evidence.md)

## Scope

This report will summarize:
- state consistency
- memory retention and cleanup
- TypeScript boundary safety
- deployment hygiene

## Current Baseline

- Local `type-check`, `test`, and `build` pass.
- `lint` has 3 pre-existing warnings.
- Live audit score is `87/B`.
- The site still has confirmed issues in sitemap validity, duplicated metadata, CSP looseness, broken external link coverage, and production source maps.

## Task 2 Result

- Targeted state-consistency tests passed for `App`, `syncService`, `realtimeService`, `EditorPage`, and `autoSync`.
- `App.tsx` auth-state listener reinstallation is now covered by a dedicated unit test instead of only direct `setupRealtimeListeners()` calls.
- No duplicate realtime subscriptions were reproduced under repeated listener setup.
- No stale overwrite of the editor draft was reproduced during async menu hydration.
- No stale local prompt clobbering was reproduced when the remote record was newer.
- `autoSync` has no teardown API in source, so teardown coverage is a documented gap rather than a passing assertion.
- See the evidence appendix for the boundary map and test outcomes.

## Task 3 Result

- Long-lived resources were inventoried across `App`, `autoSync`, `realtimeService`, `useAccessibleModal`, `ToastContext`, and `ImportExportModal`.
- Cleanup-focused tests now cover modal overflow/listener teardown, realtime listener churn, and toast auto-dismiss retention as a characterization of missing cleanup.
- Confirmed findings were classified in the evidence appendix as missing cleanup or benign retention; no end-to-end confirmed leak was proven.
- The browser/runtime pass was partial because the raw CDP run stopped before the full before/after heap comparison could complete.

## Task 4 Result

- Focused Task 4 verification passed for `schemaCompatibility`, `realtimePayloadParsing`, and `importService.validation`.
- The realtime listener path proved more defensive than its type casts suggest: malformed `selection_payload_jsonb` input was normalized through `parseUserSelection()`, and malformed menu `options` were downgraded to an empty array in the tested path.
- The main confirmed unsafe boundary is `downloadFromCloud()` in [`syncService.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/services/syncService.ts#L488), where truthy `selection_payload_jsonb` and `compiled_payload_jsonb` bypass parser validation and are stored through direct casts.
- Additional high-confidence risks remain around unvalidated `few_shot_examples` payloads and `assetManager` helper loops that still cross table boundaries via `any`.
- The explicit `any` in the import path remains type debt, but the tested malformed import scenarios were rejected before that cast reached Dexie persistence.

## Task 5 Result

- The current deploy still serves identical initial metadata for `/`, `/sobre`, and `/portfolio`, including the same canonical URL and JSON-LD block, because the app ships a shared SPA shell from [`index.html`](/Users/PROJETOS%20DEV/PROMPT-APP/index.html#L7) and only patches head tags after hydration in [`SEO.tsx`](/Users/PROJETOS%20DEV/PROMPT-APP/src/components/SEO.tsx#L52).
- Production source maps are still exposed: the live bundle references `index-BiZRg6ga.js.map`, and the deployed `.map` file is publicly reachable. This matches the local build configuration in [`vite.config.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/vite.config.ts#L59).
- The current `robots.txt` and `sitemap.xml` are aligned with the checked-in files in [`public/robots.txt`](/Users/PROJETOS%20DEV/PROMPT-APP/public/robots.txt#L1) and [`public/sitemap.xml`](/Users/PROJETOS%20DEV/PROMPT-APP/public/sitemap.xml#L1), so the earlier sitemap-valid warning was not reproduced in this pass.
- The previously flagged GitHub repository link also did not reproduce as broken in the current live check.

## Next Step

Proceed with Task 6 and consolidate remediation priorities across state, memory, type boundaries, and deploy hygiene.
