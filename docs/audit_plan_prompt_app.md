# PROMPT-APP Audit Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to execute this audit plan task-by-task.

**Goal:** Auditar o PROMPT-APP em produção e no código local para encontrar inconsistências de estado, vazamentos de memória e fragilidades de tipagem TypeScript, produzindo evidência reproduzível e backlog priorizado de correções.

**Architecture:** O trabalho é dividido em quatro trilhas: baseline do app local e do deploy, auditoria de estado entre React/Dexie/Supabase, investigação de retenção de memória em timers/listeners/subscriptions e revisão de tipagem nos limites de dados. Cada hipótese precisa virar evidência concreta antes de qualquer correção: comando, trace, heap snapshot, ou teste que falha.

**Tech Stack:** React 19, Vite 8, TypeScript 6, React Router 7, Dexie, Supabase, Zod, Jest 30, Playwright, Sentry, Netlify, squirrelscan.

---

## Current Baseline

- `npm run type-check` passa hoje sem erros.
- `npm test` passa hoje com 20 suites e 108 testes.
- `npm run build` passa hoje localmente.
- `npm run lint` ainda acusa 3 warnings de `any` em [`src/services/assetManager.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/services/assetManager.ts) e [`src/services/importService.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/services/importService.ts).
- `squirrel report 61866d28 --format llm` para `https://prompt-app-dan.netlify.app` retornou score geral `88/B`.
- O surface audit do site encontrou metadados duplicados, validação de sitemap incompleta e source maps publicados em produção.

## Audit Outputs

- Primary artifact: `docs/audits/2026-04-08-prompt-app-runtime-audit.md`
- Evidence appendix: `docs/audits/2026-04-08-prompt-app-runtime-audit-evidence.md`
- If code changes are approved later: targeted fixes only after evidence review

## Acceptance Criteria

- Cada problema listado no relatório final tem reprodução ou evidência objetiva.
- O relatório separa claramente `confirmed issue`, `high-confidence risk`, e `not reproduced`.
- Há cobertura explícita para estado local, sync cloud, realtime, editor, modais/toasts e fronteiras de tipo.
- O backlog final classifica achados em `P0`, `P1`, `P2` com impacto, risco e arquivos afetados.

### Task 1: Freeze the Baseline

**Files:**
- Inspect: [`package.json`](/Users/PROJETOS%20DEV/PROMPT-APP/package.json)
- Inspect: [`src/App.tsx`](/Users/PROJETOS%20DEV/PROMPT-APP/src/App.tsx)
- Inspect: [`src/main.tsx`](/Users/PROJETOS%20DEV/PROMPT-APP/src/main.tsx)
- Inspect: [`vite.config.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/vite.config.ts)
- Inspect: [`netlify.toml`](/Users/PROJETOS%20DEV/PROMPT-APP/netlify.toml)
- Update later: `docs/audits/2026-04-08-prompt-app-runtime-audit-evidence.md`

**Step 1: Capture local verification**

Run:
```bash
npm run lint
npm run type-check
npm test
npm run build
```

Expected:
- `type-check`, `test`, and `build` succeed
- `lint` warnings are recorded with exact file and line numbers

**Step 2: Capture live deployment verification**

Run:
```bash
curl -I -L --max-redirs 3 https://prompt-app-dan.netlify.app
squirrel audit https://prompt-app-dan.netlify.app --coverage surface --max-pages 20 --format llm
```

Expected:
- Response headers, CSP, and cache behavior are documented
- Surface audit score and issue categories are copied into the evidence appendix

**Step 3: Snapshot current known issues**

Record:
- Duplicate titles and descriptions from [`src/components/SEO.tsx`](/Users/PROJETOS%20DEV/PROMPT-APP/src/components/SEO.tsx) and route pages
- `no-explicit-any` warnings from [`src/services/assetManager.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/services/assetManager.ts) and [`src/services/importService.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/services/importService.ts)
- Realtime, auto-sync, and auth lifecycle entry points in [`src/App.tsx`](/Users/PROJETOS%20DEV/PROMPT-APP/src/App.tsx)

**Step 4: Define audit matrix**

The matrix must include these flows:
- App boot in `StrictMode`
- Login and logout transitions
- Editor create, edit, save, reload
- Realtime update while editor is open
- Offline and reconnect behavior
- Toast and modal mount/unmount churn

### Task 2: Audit State Consistency Across Local and Cloud Data

**Files:**
- Inspect: [`src/App.tsx`](/Users/PROJETOS%20DEV/PROMPT-APP/src/App.tsx)
- Inspect: [`src/db/database.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/db/database.ts)
- Inspect: [`src/pages/EditorPage.tsx`](/Users/PROJETOS%20DEV/PROMPT-APP/src/pages/EditorPage.tsx)
- Inspect: [`src/services/autoSync.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/services/autoSync.ts)
- Inspect: [`src/services/syncService.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/services/syncService.ts)
- Inspect: [`src/services/realtimeService.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/services/realtimeService.ts)
- Inspect: [`src/services/contextMenuSync.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/services/contextMenuSync.ts)
- Inspect: [`src/utils/backupManager.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/utils/backupManager.ts)
- Modify later: [`tests/unit/autoSync.test.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/tests/unit/autoSync.test.ts)
- Modify later: [`tests/unit/syncService.test.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/tests/unit/syncService.test.ts)
- Create later: `tests/unit/realtimeService.test.ts`
- Create later: `tests/integration/editor-state-consistency.test.tsx`

**Step 1: Map every writer and subscriber**

Build a table with:
- Which code writes Dexie
- Which code writes Supabase
- Which code listens to Supabase realtime
- Which code writes backups
- Which code reacts to auth changes

Minimum functions to map:
- `setupAutoSync`
- `syncToCloud`
- `setupRealtimeListeners`
- `cleanupRealtimeListeners`
- editor save flow in `EditorPage`
- backup triggers in app boot and realtime

**Step 2: Turn current suspicions into reproducible tests**

Add or extend tests for:
- `StrictMode` double-mount does not duplicate realtime subscriptions
- auth state change does not install duplicate listeners
- auto-sync timer debounces correctly and does not push after teardown
- editor load plus async menu hydration does not overwrite fresher form state
- remote record newer than local does not get clobbered by stale local sync

Representative test targets:
```ts
expect(setupRealtimeListeners).toHaveBeenCalledTimes(1);
expect(activeChannelCount()).toBe(1);
expect(savedPrompt.updatedAt).toEqual(expectedLatestDate);
```

**Step 3: Reproduce real flows manually or via browser automation**

Exercise:
1. Open `/editor/novo`
2. Create a draft
3. Reload
4. Log in
5. Trigger sync
6. Modify the same entity from another tab or simulated realtime payload

Expected:
- No duplicate records
- No stale overwrite
- No loss of `selectedMenuIds`, `selectionPayload`, or `compiledPayload`

**Step 4: Record each confirmed inconsistency**

For each confirmed issue, capture:
- exact steps
- observed behavior
- expected behavior
- likely boundary that owns the fix

### Task 3: Audit Memory Retention and Cleanup Behavior

**Files:**
- Inspect: [`src/App.tsx`](/Users/PROJETOS%20DEV/PROMPT-APP/src/App.tsx)
- Inspect: [`src/services/autoSync.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/services/autoSync.ts)
- Inspect: [`src/services/realtimeService.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/services/realtimeService.ts)
- Inspect: [`src/hooks/useAccessibleModal.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/hooks/useAccessibleModal.ts)
- Inspect: [`src/context/ToastContext.tsx`](/Users/PROJETOS%20DEV/PROMPT-APP/src/context/ToastContext.tsx)
- Inspect: [`src/components/ImportExportModal.tsx`](/Users/PROJETOS%20DEV/PROMPT-APP/src/components/ImportExportModal.tsx)
- Modify later: [`tests/unit/useAccessibleModal.test.tsx`](/Users/PROJETOS%20DEV/PROMPT-APP/tests/unit/useAccessibleModal.test.tsx)
- Create later: `tests/unit/realtimeService.cleanup.test.ts`
- Create later: `tests/unit/ToastContext.test.tsx`

**Step 1: Inventory long-lived resources**

Capture every:
- `setTimeout`
- event listener
- Supabase channel
- Dexie hook
- detached focus reference
- closure retaining large payloads

Immediate audit suspects:
- `setTimeout` in app bootstrap backup
- global timer and one-time install flags in `autoSync.ts`
- debounced backup timeout in `realtimeService.ts`
- toast dismissal timers in `ToastContext.tsx`
- focus timer in `useAccessibleModal.ts`

**Step 2: Add cleanup-focused tests**

Test cases:
- unmount restores body overflow and removes keydown listener
- toast auto-dismiss timer does not call `setState` after provider unmount
- realtime cleanup removes all active channels
- boot/login/logout cycles do not increase active listener counts

Representative expectations:
```ts
expect(document.body.style.overflow).toBe('');
expect(removeEventListenerSpy).toHaveBeenCalled();
expect(channelUnsubscribeSpy).toHaveBeenCalledTimes(expectedCount);
```

**Step 3: Run a runtime memory session**

Use browser tooling against the live app or a local production build:
1. Heap snapshot before interaction
2. Repeatedly open and close modal flows
3. Navigate between `/`, `/categorias`, `/menus`, `/editor/novo`
4. Trigger login or mocked auth transitions if possible
5. Take a second heap snapshot

Expected:
- No monotonic growth in retained DOM nodes or timer callbacks
- No additional active realtime subscriptions after repeated route changes

**Step 4: Classify findings**

Label each item as:
- confirmed leak
- benign retention
- missing cleanup with no current user impact

### Task 4: Audit Type Boundaries and Unsafe Type Narrowing

**Files:**
- Inspect: [`src/models/types.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/models/types.ts)
- Inspect: [`src/models/promptSchema.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/models/promptSchema.ts)
- Inspect: [`src/services/syncService.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/services/syncService.ts)
- Inspect: [`src/services/realtimeService.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/services/realtimeService.ts)
- Inspect: [`src/services/assetManager.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/services/assetManager.ts)
- Inspect: [`src/services/importService.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/services/importService.ts)
- Inspect: [`src/lib/supabase.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/src/lib/supabase.ts)
- Modify later: [`tests/unit/schemaCompatibility.test.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/tests/unit/schemaCompatibility.test.ts)
- Create later: `tests/unit/realtimePayloadParsing.test.ts`
- Create later: `tests/unit/importService.validation.test.ts`

**Step 1: Inventory type debt**

Run:
```bash
rg -n "\\bany\\b|unknown as|as unknown as|Record<string, unknown>" src tests
```

Expected:
- A list of files where runtime payloads are trusted too early
- A list of unsafe casts that need parser or guard coverage

**Step 2: Focus on data boundaries**

Audit these boundaries first:
- Supabase `select/insert/upsert` results
- realtime payload coercion
- import payload normalization
- migration code in Dexie upgrades
- backup snapshot parsing

**Step 3: Convert risky casts into testable contracts**

For each boundary, define:
- source shape
- parser or guard
- failure mode
- current trust gap

Examples:
- `assetManager` currently uses explicit `any` for remote collections
- `realtimeService` coerces `payload.new` and `payload.old` into local shapes
- `importService` accepts wide `unknown` payloads and normalizes them progressively

**Step 4: Define remediation criteria**

A boundary is only considered fixed when:
- type-check still passes
- the relevant unit test covers invalid payloads
- the boundary no longer relies on `any` or double-cast coercion without a parser

### Task 5: Audit Route Metadata and Deploy Hygiene as Secondary Findings

**Files:**
- Inspect: [`src/components/SEO.tsx`](/Users/PROJETOS%20DEV/PROMPT-APP/src/components/SEO.tsx)
- Inspect: [`src/pages/HomePage.tsx`](/Users/PROJETOS%20DEV/PROMPT-APP/src/pages/HomePage.tsx)
- Inspect: [`src/pages/AboutPage.tsx`](/Users/PROJETOS%20DEV/PROMPT-APP/src/pages/AboutPage.tsx)
- Inspect: [`src/pages/ContactPage.tsx`](/Users/PROJETOS%20DEV/PROMPT-APP/src/pages/ContactPage.tsx)
- Inspect: [`src/pages/PrivacyPage.tsx`](/Users/PROJETOS%20DEV/PROMPT-APP/src/pages/PrivacyPage.tsx)
- Inspect: [`vite.config.ts`](/Users/PROJETOS%20DEV/PROMPT-APP/vite.config.ts)
- Inspect: [`netlify.toml`](/Users/PROJETOS%20DEV/PROMPT-APP/netlify.toml)

**Step 1: Verify duplicate metadata finding**

Compare route-level `SEO` props and rendered output for:
- title uniqueness
- description uniqueness
- canonical correctness

**Step 2: Verify production artifact hygiene**

Check:
- source maps intentionally published or not
- CSP policy tradeoff around `unsafe-inline`
- sitemap endpoints actually served by the deploy

**Step 3: Keep these findings secondary**

These items belong in the final audit as:
- deployment hygiene
- metadata hygiene

They should not displace the main scope unless they materially affect state, memory, or type safety.

### Task 6: Produce the Final Audit Report

**Files:**
- Create: `docs/audits/2026-04-08-prompt-app-runtime-audit.md`
- Create: `docs/audits/2026-04-08-prompt-app-runtime-audit-evidence.md`

**Step 1: Summarize confirmed findings only**

The main report must contain:
- executive summary
- system map
- confirmed issues
- high-confidence risks
- clean areas already validated
- prioritized remediation backlog

**Step 2: Attach evidence**

The evidence appendix must include:
- command outputs
- screenshots or heap notes when available
- links to exact source files
- failing or newly added tests that prove each issue

**Step 3: Rank findings**

Use this rubric:
- `P0`: data loss, duplicated subscriptions, stale overwrite, auth/sync corruption
- `P1`: retained listeners/timers, unsafe runtime casts on network boundaries
- `P2`: metadata duplication, source map exposure, non-blocking typing cleanup

**Step 4: Define stop conditions**

The audit is complete only when:
- every primary scope area was exercised
- every suspected issue is either confirmed or explicitly disproven
- next actions are actionable without re-reading the whole codebase

## Commands Checklist

```bash
npm run lint
npm run type-check
npm test
npm run build
rg -n "\\bany\\b|unknown as|as unknown as|Record<string, unknown>" src tests
curl -I -L --max-redirs 3 https://prompt-app-dan.netlify.app
squirrel audit https://prompt-app-dan.netlify.app --coverage surface --max-pages 20 --format llm
```

## Notes for Execution

- Do not fix anything while still in audit mode unless the user explicitly switches from planning to execution.
- Prefer failing tests and reproducible traces over intuition.
- Treat `StrictMode` double-invocation as part of the baseline, not as noise.
- Realtime and auto-sync must be evaluated together; isolating only one side will miss races.

Plan complete and saved to `docs/audit_plan_prompt_app.md`.
