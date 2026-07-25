# PROMPT-APP Runtime Audit Evidence

> Task 1 baseline capture for the PROMPT-APP runtime audit.

**Scope:** Freeze the current state of the app and deployed site before deeper audit work. This document records only evidence verified in this batch.

**Baseline date:** 2026-04-08

---

## 1) Verified Local Baseline

### Commands run

```bash
npm run lint
npm run type-check
npm test
npm run build
```

### Outcomes

- `npm run type-check` passed with exit code `0`.
- `npm test` passed with `20` suites and `108` tests.
- `npm run build` passed and produced a production bundle in `dist/`.
- `npm run lint` completed with `3` warnings and `0` errors.

### Lint warnings

- [`src/services/assetManager.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/services/assetManager.ts#L482) - `@typescript-eslint/no-explicit-any`
- [`src/services/assetManager.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/services/assetManager.ts#L539) - `@typescript-eslint/no-explicit-any`
- [`src/services/importService.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/services/importService.ts#L388) - `@typescript-eslint/no-explicit-any`

### Relevant baseline files

- [`package.json`](/Users/PROJETOS%20DEV/PROMPT-APP/package.json#L7)
- [`src/App.tsx`](/Users/PROJETOS%20DEV/PROMPT-APP/src/App.tsx#L35)
- [`src/components/SEO.tsx`](/Users/PROJETOS%20DEV/PROMPT-APP/src/components/SEO.tsx#L13)
- [`NEXT.config.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/NEXT.config.ts#L8)
- [`netlify.toml`](/Users/PROJETOS%20DEV/PROMPT-APP/netlify.toml#L3)

---

## 2) Verified Live Deployment Baseline

### Commands run

```bash
curl -I -L --max-redirs 3 --max-time 20 https://prompt-app-dan.netlify.app
squirrel audit https://prompt-app-dan.netlify.app --coverage surface --max-pages 20 --format llm
```

### Headers observed

- `HTTP/2 200`
- `cache-control: public,max-age=0,must-revalidate`
- `content-security-policy` allows `unsafe-inline` in `style-src` and `script-src`
- `server: Netlify`
- `x-frame-options: DENY`
- `x-content-type-options: nosniff`
- `referrer-policy: strict-origin-when-cross-origin`
- `strict-transport-security: max-age=31536000; includeSubDomains; preload`

### Surface audit result

- Overall score: `87/B`
- Pages crawled: `6`
- Summary: `544` passed, `24` warnings, `1` failed

### Confirmed surface issues

- `crawl/sitemap-valid` failed with `7` sitemap format errors.
- `core/title-unique` warned about `1` duplicate title across `6` pages.
- `content/duplicate-title` warned about the same duplicate title across `6` pages.
- `content/duplicate-description` warned about the same duplicate description across `6` pages.
- `content/keyword-stuffing` flagged overuse of `para`.
- `security/csp` warned that CSP allows `unsafe-inline`.
- `security/http-to-https` warned on `6` HTTP URLs redirecting to HTTPS.
- `links/broken-external-links` warned about `https://github.com/danilonovaisv/PROMPT-APP` returning `404`.
- `perf/source-maps` detected a source map in production: `/assets/index-D8Pbr7c_.js.map`.

### Baseline reference files

- [`src/components/SEO.tsx`](/Users/PROJETOS%20DEV/PROMPT-APP/src/components/SEO.tsx#L13)
- [`src/pages/HomePage.tsx`](/Users/PROJETOS%20DEV/PROMPT-APP/src/pages/HomePage.tsx#L1)
- [`src/pages/AboutPage.tsx`](/Users/PROJETOS%20DEV/PROMPT-APP/src/pages/AboutPage.tsx#L1)
- [`src/pages/ContactPage.tsx`](/Users/PROJETOS%20DEV/PROMPT-APP/src/pages/ContactPage.tsx#L1)
- [`src/pages/PrivacyPage.tsx`](/Users/PROJETOS%20DEV/PROMPT-APP/src/pages/PrivacyPage.tsx#L1)

---

## 3) Current Known Issues Snapshot

### Duplicate metadata

- The SEO helper sets a shared default title and description at [`src/components/SEO.tsx`](/Users/PROJETOS%20DEV/PROMPT-APP/src/components/SEO.tsx#L13).
- Route pages all use the same client-side SEO injection pattern, so duplicated metadata is a live risk until route-specific output is validated end-to-end.
- This baseline keeps the issue as a confirmed audit warning rather than a code change target in Task 1.

### Type debt

- [`src/services/assetManager.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/services/assetManager.ts#L482) and [`src/services/assetManager.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/services/assetManager.ts#L539) still contain explicit `any` usage around remote payload handling.
- [`src/services/importService.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/services/importService.ts#L388) still bulk-adds prompts through an `any` cast.

### State lifecycle entry points

- App bootstrap seeds local data, schedules a backup, installs auto-sync, and conditionally starts realtime listeners in [`src/App.tsx`](/Users/PROJETOS%20DEV/PROMPT-APP/src/App.tsx#L35).
- Auth state changes can reinstall realtime listeners and trigger cloud sync in [`src/App.tsx`](/Users/PROJETOS%20DEV/PROMPT-APP/src/App.tsx#L58).
- These are the primary state-transition boundaries to audit in later tasks.

---

## 4) State Boundary Map

| Boundary | Writes Dexie | Writes Supabase | Listens to Supabase realtime | Writes backups | Reacts to auth changes |
| --- | --- | --- | --- | --- | --- |
| `setupAutoSync` | No direct write; installs Dexie hooks on `prompts`, `categories`, and `contextMenus` | Indirectly via `syncToCloud` | No | No | Yes, via `supabase.auth.getSession()` gate inside the timer |
| `syncToCloud` | Yes, updates `remoteId` and `syncStatus` after cloud writes | Yes, inserts/updates categories, menus, and prompts | No | No | Yes, requires authenticated session |
| `setupRealtimeListeners` | Yes, merges remote category/prompt/menu payloads into Dexie | No | Yes, subscribes to `categories_changes`, `prompts_changes`, and `context_menus_changes` | Yes, schedules `saveLocalBackup()` after realtime writes | Yes, only installs listeners when a session exists |
| `cleanupRealtimeListeners` | No | No | Yes, unsubscribes active channels | No | Yes, used on logout and app teardown |
| `EditorPage` save flow | Yes, writes the prompt locally first and clears the local draft | Yes, `savePromptToSupabase()` persists the prompt remotely | No | Yes, calls `saveLocalBackup()` after local save | No direct auth handling |
| App boot in `App.tsx` | Yes, seeds the local database | No direct write | Yes, starts realtime listeners when configured | Yes, schedules `saveLocalBackup()` on boot | Yes, auth change listener restarts realtime or cleans it up |
| `downloadFromCloud` | Yes, bulk-merges remote state into Dexie | No direct write | No | No | Yes, requires authenticated session |

---

## 5) Task 2 Verification Runs

### Commands run

```bash
npm test -- --runInBand tests/unit/App.test.tsx tests/unit/syncService.test.ts tests/unit/realtimeService.test.ts tests/integration/editor-state-consistency.test.tsx tests/unit/autoSync.test.ts
```

### Outcomes

- `5` suites passed.
- `19` tests passed.
- No new failures were introduced in the targeted consistency coverage.

### Confirmed non-reproductions

- `tests/unit/syncService.test.ts` confirmed that `syncToCloud()` skips a stale local prompt when the remote `updated_at` is newer.
- `tests/unit/syncService.test.ts` confirmed that `downloadFromCloud()` preserves `selectedMenuIds`, `selectionPayload`, and `compiledPayload` when hydrating a remote prompt into local state.
- `tests/unit/App.test.tsx` confirmed that the `App.tsx` auth callback re-invokes `setupRealtimeListeners()` on sign-in and calls `syncToCloud()` from the reinstallation path.
- `tests/unit/realtimeService.test.ts` confirmed that repeated `setupRealtimeListeners()` calls do not stack live subscriptions and that cleanup unsubscribes the active channels once.
- `tests/integration/editor-state-consistency.test.tsx` confirmed that a saved draft survives async menu hydration without losing the selected menu state.
- `tests/unit/autoSync.test.ts` remained green and continues to characterize debounce and single-install behavior for auto-sync hooks, but there is no teardown API in `src/services/autoSync.ts`, so teardown behavior could not be asserted without inventing source behavior.

### Confirmed inconsistencies

- `src/services/autoSync.ts` has no teardown path. The module-scoped hooks and timer can be installed once, but there is no exported cleanup or unhook logic to verify.

---

## 6) Task 3 Memory and Cleanup Audit

### Resource inventory

- [`src/App.tsx`](/Users/PROJETOS%20DEV/PROMPT-APP/src/App.tsx#L35) schedules a one-shot backup timeout during bootstrap and installs auth-state cleanup/reinstall paths.
- [`src/services/autoSync.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/services/autoSync.ts#L1) keeps a module-scoped debounce timer and one-time install flag, but exposes no teardown API.
- [`src/services/realtimeService.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/services/realtimeService.ts#L1) tracks three Supabase channels plus a debounced backup timer in `_backupTimeout`.
- [`src/hooks/useAccessibleModal.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/hooks/useAccessibleModal.ts#L1) creates a zero-delay focus timer and a document keydown listener.
- [`src/context/ToastContext.tsx`](/Users/PROJETOS%20DEV/PROMPT-APP/src/context/ToastContext.tsx#L1) schedules per-toast auto-dismiss timers with no unmount cancellation.
- [`src/components/ImportExportModal.tsx`](/Users/PROJETOS%20DEV/PROMPT-APP/src/components/ImportExportModal.tsx#L1) uses the modal hook and resets local form state on close; no additional long-lived resource was identified.

### Cleanup-focused test checks

```bash
npm test -- --runInBand tests/unit/useAccessibleModal.test.tsx tests/unit/realtimeService.cleanup.test.ts tests/unit/ToastContext.test.tsx tests/unit/realtimeService.test.ts tests/unit/App.test.tsx tests/unit/autoSync.test.ts
```

- `6` suites passed and `21` tests passed.
- `tests/unit/useAccessibleModal.test.tsx` now verifies that unmount restores body overflow and removes the `keydown` listener.
- `tests/unit/realtimeService.cleanup.test.ts` verifies login/logout cycles keep active realtime subscriptions bounded.
- `tests/unit/ToastContext.test.tsx` is a characterization test for the current missing unmount cleanup of toast auto-dismiss timers.

### Runtime checks

```bash
npx playwright install chromium
node --input-type=module
```

- A raw CDP session against Playwright's downloaded `chrome-headless-shell` reached the live app and observed bootstrap logs, including seed, auth initial session, and auto-sync setup.
- The run was interrupted before a complete before/after heap comparison could be captured.
- The partial failure happened after a modal-close selector mismatch during the navigation churn sequence, so the runtime pass remains evidence of bootstrap behavior only, not a full heap verdict.

### Classified findings

- Confirmed leak: none proven end-to-end in this task.
- Missing cleanup: `ToastContext` auto-dismiss timers survive provider unmount; `realtimeService` does not clear `_backupTimeout`; `autoSync` still has no teardown API.
- Benign retention: `useAccessibleModal`'s zero-delay focus timer is cleaned up by unmount flow; the bootstrap backup timeout in `App.tsx` is one-shot and was not observed to grow across repeated route changes.

---

## 7) Task 4 Type Boundary Audit

### Commands run

```bash
rg -n "\bany\b|unknown as|as unknown as|Record<string, unknown>" src tests
npm test -- --runInBand tests/unit/schemaCompatibility.test.ts tests/unit/realtimePayloadParsing.test.ts tests/unit/importService.validation.test.ts
```

### Outcomes

- The focused Task 4 verification passed with `3` suites and `8` tests.
- The new realtime tests confirmed that invalid `selection_payload_jsonb` input is normalized through `parseUserSelection()` when the realtime listener path is used.
- The new realtime tests confirmed that malformed menu `options` payloads are normalized into an empty array rather than crashing the menu merge path.
- The existing import-service validation tests still reject malformed legacy prompt arrays and non-JSON sources before the bulk insert path runs.
- The schema-compatibility tests now confirm that leading and trailing whitespace does not falsely downgrade otherwise valid version strings.

### Type-boundary inventory

- [`src/services/syncService.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/services/syncService.ts#L456) parses `prompt_payload_jsonb`, but the same download path directly trusts truthy `selection_payload_jsonb` and `compiled_payload_jsonb` via casts at [`src/services/syncService.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/services/syncService.ts#L488) and [`src/services/syncService.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/services/syncService.ts#L502).
- [`src/services/syncService.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/services/syncService.ts#L482) also accepts `few_shot_examples` without validating element shape before persisting to Dexie.
- [`src/services/realtimeService.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/services/realtimeService.ts#L240) still starts from raw `Record<string, unknown>` payloads and narrows them with `as unknown as`, but the tested `selection_payload_jsonb` and `options` fields are normalized downstream at [`src/services/realtimeService.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/services/realtimeService.ts#L300) and [`src/services/realtimeService.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/services/realtimeService.ts#L421).
- [`src/services/realtimeService.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/services/realtimeService.ts#L311) and [`src/services/realtimeService.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/services/realtimeService.ts#L316) still trust `compiled_payload_jsonb` and `few_shot_examples` via direct casts.
- [`src/services/assetManager.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/services/assetManager.ts#L482) and [`src/services/assetManager.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/services/assetManager.ts#L539) use `any` to cross Dexie and remote-sync helper boundaries, which prevents the compiler from proving payload shape safety in those loops.
- [`src/services/importService.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/services/importService.ts#L388) still uses `bulkAdd(promptsToInsert as any)`, but the tested import path rejected malformed legacy prompt input before that cast was exercised with bad data.

### Classified findings

- Confirmed issue: `downloadFromCloud()` bypasses validation for truthy `selection_payload_jsonb` and `compiled_payload_jsonb`, so malformed remote prompt payloads can be persisted locally without going through `parseUserSelection()` or `compilePromptPayload()`.
- High-confidence risk: `few_shot_examples` are accepted as raw arrays in both sync and realtime paths with no element-level validation, so bad cloud data can still cross the boundary as long as the array itself is truthy.
- High-confidence risk: `assetManager` helper loops rely on `any[]` and `table as any`, which hides mismatches between local table contracts and remote payload shapes during conflict pulls and pending pushes.
- Not reproduced: malformed realtime `selection_payload_jsonb` and malformed realtime menu `options` did not break the tested listener paths because the current normalization helpers downgraded them to safe fallback values.
- Not reproduced: the bulk import path did not admit malformed legacy prompts in the tested scenarios even though the final `bulkAdd()` still uses an explicit `any` cast.

---

## 8) Task 5 Route Metadata and Production Hygiene Audit

### Commands run

```bash
curl -sL https://prompt-app-dan.netlify.app/ | sed -n '1,220p'
curl -sL https://prompt-app-dan.netlify.app/sobre | sed -n '1,220p'
curl -sL https://prompt-app-dan.netlify.app/portfolio | sed -n '1,220p'
curl -sI https://prompt-app-dan.netlify.app/robots.txt
curl -sI https://prompt-app-dan.netlify.app/sitemap.xml
curl -sL https://prompt-app-dan.netlify.app/assets/index-BiZRg6ga.js | tail -n 5
curl -sI https://prompt-app-dan.netlify.app/assets/index-BiZRg6ga.js.map
curl -sI https://github.com/danilonovaisv/PROMPT-APP
```

### Outcomes

- The raw HTML for `/`, `/sobre`, and `/portfolio` still ships the same `<title>`, `description`, `canonical`, `og:url`, and JSON-LD document before hydration.
- The deploy currently serves the same SEO fallback shell found in [`index.html`](/Users/PROJETOS%20DEV/PROMPT-APP/index.html#L1), so crawlers that do not execute React will always see the homepage metadata.
- `robots.txt` is served as `text/plain` and points to the public sitemap declared in [`public/robots.txt`](/Users/PROJETOS%20DEV/PROMPT-APP/public/robots.txt#L1).
- `sitemap.xml` is currently served as `application/xml` and matches the static file in [`public/sitemap.xml`](/Users/PROJETOS%20DEV/PROMPT-APP/public/sitemap.xml#L1).
- The live JS bundle still ends with `//# sourceMappingURL=index-BiZRg6ga.js.map`, and the corresponding source map is publicly reachable with `HTTP/2 200`.
- The GitHub repository URL previously flagged as broken now returns `HTTP/2 200`, so that specific broken-link warning was not reproduced.

### Code/deploy correlation

- [`src/components/SEO.tsx`](/Users/PROJETOS%20DEV/PROMPT-APP/src/components/SEO.tsx#L52) mutates `document.head` inside `useEffect`, which means route-specific `title`, `description`, `canonical`, and social tags only exist after client hydration.
- [`index.html`](/Users/PROJETOS%20DEV/PROMPT-APP/index.html#L7) hardcodes the default homepage metadata and canonical URL that the deploy serves for every rewritten route.
- [`netlify.toml`](/Users/PROJETOS%20DEV/PROMPT-APP/netlify.toml#L47) rewrites every route to `/index.html`, which explains why the raw HTML for `/sobre` and `/portfolio` is identical to `/`.
- [`NEXT.config.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/NEXT.config.ts#L45) still sets `build.sourcemap = true`, which aligns with the current production bundle exposing a source-map reference.

### Classified findings

- Confirmed issue: route-specific metadata is missing from the initial HTML of client-routed pages because the deploy serves a shared SPA shell from `index.html`, and `SEO.tsx` only mutates head tags after hydration.
- Confirmed issue: production source maps are still exposed. The current bundle references `index-BiZRg6ga.js.map`, and that file is publicly downloadable from the live deploy.
- High-confidence risk: the current Netlify CSP still allows `'unsafe-inline'` for both `style-src` and `script-src`, which weakens injection resistance even though no exploit was reproduced in this audit.
- Not reproduced: sitemap invalidity. The current `sitemap.xml` is well-formed, served with the correct content type, and matches the checked-in static file.
- Not reproduced: the GitHub repository link in the privacy/contact surface. The live repository URL returned `200` during this audit run.

---

## 9) Browser Reproduction

### Commands run

```bash
pnpm dev -- --host 127.0.0.1 --port 4173
npx playwright install chromium
node --input-type=module
```

### What was exercised

- Opened `/editor/novo` in a real Chromium session against the local NEXT app.
- Created a draft by typing into the editor and reloaded the page.
- Confirmed the draft restored after reload with the same title value.
- Opened the cloud login modal, submitted a mocked Supabase password login, and confirmed the `SIGNED_IN` auth path fired.
- Observed real browser network calls to `/auth/v1/token` and `/rest/v1/*` during the auth-triggered sync path.
- Confirmed the auth-triggered sync path produced the expected runtime logs for `SIGNED_IN`, auto-sync, and smart-merge requests.

### What was not fully reproduced

- A second-tab overwrite simulation was started, but the final run was interrupted before a conclusive freshness result could be captured.
- Because the project has no local teardown API for `autoSync`, no browser-level teardown verification was attempted.

---

## 10) Audit Matrix For Follow-up

The next tasks will exercise these flows:

- App boot in `StrictMode`
- Login and logout transitions
- Editor create, edit, save, reload
- Realtime update while editor is open
- Offline and reconnect behavior
- Toast and modal mount/unmount churn

---

## 11) Baseline Summary

- Local verification is green except for the pre-existing `any` warnings.
- The live site is reachable and returns a `200`, but the surface audit shows real hygiene issues in metadata, sitemap validation, security headers, and production source maps.
- The baseline is stable enough to proceed to state, memory, and type-boundary auditing without changing application code in this task.
