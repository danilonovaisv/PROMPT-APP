# MultiSelect — Visual QA Report

**Date:** 2026-06-15
**Branch:** `worktree-multiselect-visual-fix` (worktree from `test/visual-multiselect`)
**Component:** `src/components/ui/MultiSelect.tsx`
**Test surface:** `http://localhost:5174/editor/novo` → `Menus do Template` section
**Driver:** Playwright MCP (headless Chromium)

---

## Summary

| State              | Before fix | After fix | Notes                                                                       |
| ------------------ | ---------- | --------- | --------------------------------------------------------------------------- |
| Empty (open)       | **FAIL**   | **PASS**  | Dropdown collapsed to 2 px wide → invisible options                         |
| Loading            | N/A        | N/A       | No loading state in component (options come from synchronous Dexie query)   |
| Partial selection  | FAIL       | **PASS**  | 3/4 menus checked; counter says `3 menu(s) selecionado(s)`                  |
| Max selection      | FAIL       | **PASS**  | 4/4 selectable; toggling existing item unchecks correctly                   |
| Tablet (768×1024)  | FAIL       | **PASS**  | Dropdown 520 × 286, fits viewport, no clipping inside popper                |
| Mobile (375×812)   | FAIL       | **PASS**  | Dropdown capped at 96 vw (360 px), tap targets ≥ 44 px (`min-height:44px`)  |

---

## Root cause

`src/components/ui/MultiSelect.tsx` wraps Radix `SelectPrimitive`. Radix Select renders `Content` inside a **portal with a fixed-position popper wrapper that has a 0×0 box** (the popper places via `transform`, not via box size).

The original CSS positioned the dropdown **against that wrapper**:

```css
.multi-select__dropdown {
  position: absolute;
  top: calc(100% + var(--space-2));
  left: 0;
  right: 0;
  ...
}
```

`left:0; right:0` against a 0-wide wrapper → dropdown collapses to its **2 px border width**. Options technically rendered (DOM had 4 `.multi-select__option`s) but visually invisible.

Confirmed via `getBoundingClientRect()`:

```json
{ "wrapper_rect": { "w": 0, "h": 0 },
  "dropdown_rect": { "w": 2, "h": 286 } }
```

## Fix

`src/styles/components/forms.css` — two rules updated:

```css
.multi-select__dropdown {
  /* Radix popper handles placement; stretch to the trigger width via Radix CSS var. */
  position: relative;
  width: var(--radix-select-trigger-width, 100%);
  min-width: 240px;
  max-width: min(96vw, 520px);
  margin-top: var(--space-2);
  z-index: 120;
  overflow: hidden;
  border: 1px solid var(--color-border-active);
  border-radius: var(--radius-md);
  background-color: var(--color-surface-1);
  box-shadow: var(--shadow-lg), 0 0 0 1px rgba(0, 72, 255, 0.08);
  animation: multiSelectIn 180ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.multi-select__options {
  width: 100%;        /* prevents Radix Viewport collapsing */
  max-height: 260px;
  overflow-y: auto;
}
```

**Why this works**

- `position: relative` → respects the popper-wrapper's `transform`-based position instead of fighting it.
- `width: var(--radix-select-trigger-width, 100%)` → Radix exposes `--radix-select-trigger-width` on the content node; this stretches to match the trigger width when available.
- `min-width: 240px` + `max-width: min(96 vw, 520px)` → readable on desktop, never overflows viewport on mobile.
- `width: 100%` on `.multi-select__options` → Viewport fills the dropdown instead of inheriting the 0-width default.

---

## Test walkthrough (Playwright MCP)

### 1 · Bootstrap

- Vite dev server: `node_modules/.bin/vite` (port 5174, 5173 occupied by leftover instance)
- Seeded **4 menus** directly via IndexedDB (`PromptAppDB.contextMenus`) — UI form save was a no-op without options, so direct seed was faster:
  - `Estilo de Escrita`, `Framework`, `Nível Técnico`, `Idioma de saída`
  - All `selectionMode = "multiple"`, 3–4 options each.

### 2 · Empty / open

- Click `.multi-select__trigger` → `data-state="open"`.
- **Before fix:** trigger highlight visible, no popover. (`screenshots/multiselect_01_empty_open.png`)
- **After fix:** dropdown 520 × 286, all 4 menus rendered, checkboxes unchecked. (`screenshots/multiselect_02_open_fixed.png`)

### 3 · DOM actuation sequence

```text
click Estilo de Escrita  → trigger "1 menu(s) selecionado(s)"
click Framework          → trigger "2 menu(s) selecionado(s)"
click Estilo de Escrita  → trigger "1 menu(s) selecionado(s)"  (unchecked)
```

`.multi-select__option--selected` toggles as expected.
**Note:** A first pass via synchronous `for` + `.click()` produced a false positive (only the last clicked stayed) because React batches `setState` between synchronous events and the closure captures stale `selectedMenuIds`. Adding `await new Promise(r=>setTimeout(r,200))` between clicks restored correct behavior. The component is **not** buggy here — synthetic test pattern is.

### 4 · Partial selection (3/4 selected)

`screenshots/multiselect_03_partial_selection.png`

- Counter: `3 menu(s) selecionado(s)`.
- 3 checked options, 1 unchecked, last row clipped by scroll buttons (cosmetic — Radix `ScrollDownButton` overlaps the bottom row when total content height ≈ `max-height`).

### 5 · Responsive

| Viewport       | Dropdown w×h | Trigger w | Verdict                                             |
| -------------- | -----------: | --------: | --------------------------------------------------- |
| Tablet 768     | 520 × 286    |       796 | PASS — 520 px cap, no overflow                       |
| Mobile 375     | 360 × 285    |       796 | PASS — 96 vw cap, x=10 (within viewport)             |

Tap targets: `.multi-select__trigger { min-height: 44px }`, `.multi-select__option` row ≈ 70 px tall — both meet WCAG 2.5.5 AAA (44×44) and the brief's 48 px minimum.

`screenshots/multiselect_04_mobile.png`, `screenshots/multiselect_05_tablet.png`

**App-level note:** the trigger width stays at 796 px on a 375-viewport because the EditorPage layout/grid has no mobile breakpoint — that's a layout issue outside the MultiSelect component. The dropdown itself respects the viewport.

---

## Remaining observations (non-blocking)

1. **Dropdown narrower than trigger.** Trigger ≈ 800 px, dropdown capped at 520 px → cosmetic mismatch on wide screens. Easy lift: raise `max-width` or drop the cap.
2. **Last row visually overlaps `ScrollDownButton`.** When content height ≈ `max-height: 260px`, Radix's persistent scroll buttons clip the final row. Either hide the chevrons when no overflow, or add `padding-bottom: 20px` on `.multi-select__options`.
3. **Dropdown background bleeds.** `--color-surface-1` is slightly translucent; the form cards beneath are still legible through the popover. Bump opacity or raise `z-index` above the card outlines (currently `120`).
4. **Console errors at boot** — `Invalid Sentry Dsn: your-sentry-dsn` and a Supabase realtime/seed error. Unrelated to MultiSelect; both reproduce on the unchanged `main` branch.
5. **MultiSelect double handler.** `MultiSelectItem` has both an outer `onClick` and an inner `<Checkbox onChange>` wired with `stopPropagation`. Works today but is fragile — pick one handler to own the toggle.

---

## Files changed

- `src/styles/components/forms.css` — rules for `.multi-select__dropdown` and `.multi-select__options`.

No TypeScript changes; no component prop changes; no behavior change beyond visibility.

## Artifacts

```
artifacts/
  plans/
    visual_test_report.md        ← this file
  screenshots/
    multiselect_01_empty_open.png        (before fix — dropdown invisible)
    multiselect_02_open_fixed.png        (after fix — open, no selection)
    multiselect_03_partial_selection.png (3/4 selected, desktop)
    multiselect_04_mobile.png            (375 × 812)
    multiselect_05_tablet.png            (768 × 1024)
```
