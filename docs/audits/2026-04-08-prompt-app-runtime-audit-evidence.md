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

## 4) Audit Matrix For Follow-up

The next tasks will exercise these flows:

- App boot in `StrictMode`
- Login and logout transitions
- Editor create, edit, save, reload
- Realtime update while editor is open
- Offline and reconnect behavior
- Toast and modal mount/unmount churn

---

## 5) Baseline Summary

- Local verification is green except for the pre-existing `any` warnings.
- The live site is reachable and returns a `200`, but the surface audit shows real hygiene issues in metadata, sitemap validation, security headers, and production source maps.
- The baseline is stable enough to proceed to state, memory, and type-boundary auditing without changing application code in this task.
