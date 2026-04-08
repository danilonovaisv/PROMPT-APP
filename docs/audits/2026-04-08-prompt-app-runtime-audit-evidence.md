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
- [`vite.config.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/vite.config.ts#L8)
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

## 6) Browser Reproduction

### Commands run

```bash
pnpm dev -- --host 127.0.0.1 --port 4173
npx playwright install chromium
node --input-type=module
```

### What was exercised

- Opened `/editor/novo` in a real Chromium session against the local Vite app.
- Created a draft by typing into the editor and reloaded the page.
- Confirmed the draft restored after reload with the same title value.
- Opened the cloud login modal, submitted a mocked Supabase password login, and confirmed the `SIGNED_IN` auth path fired.
- Observed real browser network calls to `/auth/v1/token` and `/rest/v1/*` during the auth-triggered sync path.
- Confirmed the auth-triggered sync path produced the expected runtime logs for `SIGNED_IN`, auto-sync, and smart-merge requests.

### What was not fully reproduced

- A second-tab overwrite simulation was started, but the final run was interrupted before a conclusive freshness result could be captured.
- Because the project has no local teardown API for `autoSync`, no browser-level teardown verification was attempted.

---

## 7) Audit Matrix For Follow-up

The next tasks will exercise these flows:

- App boot in `StrictMode`
- Login and logout transitions
- Editor create, edit, save, reload
- Realtime update while editor is open
- Offline and reconnect behavior
- Toast and modal mount/unmount churn

---

## 8) Baseline Summary

- Local verification is green except for the pre-existing `any` warnings.
- The live site is reachable and returns a `200`, but the surface audit shows real hygiene issues in metadata, sitemap validation, security headers, and production source maps.
- The baseline is stable enough to proceed to state, memory, and type-boundary auditing without changing application code in this task.
