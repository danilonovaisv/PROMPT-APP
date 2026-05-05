# UX Audit Plan: Prompt App

## Executive Summary
After a comprehensive analysis of the Prompt App frontend components, layout structures, and stylesheets, the following critical UX/UI issues were identified:
1. **Inconsistent Mobile Navigation & Layout Breaks:** The sidebar transforms correctly, but heavy forms (`EditorDefinitionForm`), data tables/grids, and sticky headers break or overflow on small screens (e.g., `max-width: 768px`).
2. **Suboptimal Touch Targets & Interactive States:** Although there's a recent attempt to enforce 44x44px for icon buttons, many standard buttons, list items, and form inputs still lack sufficient padding and clear focus/active states, especially on mobile.
3. **Contrast and Accessibility Gaps:** Some muted text colors against dark surfaces (`--color-text-muted` vs `--color-surface-2`) may fail WCAG AA contrast requirements. Missing ARIA labels on dynamic elements.
4. **Desktop Space Underutilization:** The `EditorPage` and `CategoryManagerPage` don't fully leverage wide screens (e.g., > 1200px). Modals are often constrained or lack keyboard shortcuts (e.g., `Esc` to close, `Ctrl+S` to save).
5. **Lack of Visual Hierarchy in Forms:** Complex forms like `EditorDefinitionForm` can become overwhelming. The distinction between required and optional fields, and grouping of related elements (like Few-Shot examples), needs clearer visual separation.

## Mobile Adaptation Plan
To ensure the app works flawlessly on mobile devices:
- **Responsive Forms:** Convert multi-column forms into single-column layouts. Ensure `textarea` and `input` fields have `w-full` (or `width: 100%`).
- **Sticky Actions:** Implement a sticky bottom bar for primary actions (Save, Preview) in the Editor, rather than keeping them hidden at the top or bottom of a long scroll.
- **Touch Targets:** Audit and enforce a minimum height of `48px` (or `44px`) for all actionable items (buttons, links, select inputs).
- **Navigation:** Improve the mobile toggle button visibility and ensure the sidebar overlay dims the background (`backdrop-blur` and dark overlay) to focus user attention.

## Desktop Refinement Plan
To better utilize screen real estate and improve power-user experience:
- **Layout Expansion:** Use CSS Grid/Flexbox to create a side-by-side split view in the Editor (e.g., Form on the left, Live Preview/Playground on the right) on screens wider than `1200px`.
- **Hover & Focus States:** Enhance hover effects (`:hover`, `:focus-visible`) on cards and buttons. Add subtle scale transforms or border highlights.
- **Keyboard Shortcuts:** Implement global keyboard shortcuts (e.g., `Cmd/Ctrl + S` to save, `Cmd/Ctrl + P` to preview) and document them in the UI (e.g., tooltips).
- **Fluid Typography:** Refine typography scales to adapt smoothly between breakpoints, avoiding overly large headings on small screens and tiny text on massive monitors.

## Technical Tasks (Checklist)
- [ ] **CSS Updates (`src/index.css`):**
  - Adjust `--color-text-muted` to improve contrast.
  - Refine `@media (max-width: 768px)` queries for `.app-header__actions`, `.form-group`, and `.btn`.
  - Add specific styles for sticky mobile action bars.
- [ ] **Layout Components (`src/components/Layout.tsx`):**
  - Add an overlay `div` when the sidebar is open on mobile to allow click-to-close functionality.
- [ ] **Editor Components (`src/components/editor/EditorPage.tsx`, `EditorDefinitionForm.tsx`):**
  - Implement a split-pane layout for desktop (`lg:grid lg:grid-cols-2`).
  - Move action buttons to a sticky header/footer for easier access on mobile.
  - Add keyboard event listeners for saving and previewing.
- [ ] **General UI:**
  - Audit `.btn` classes to ensure minimum touch target sizes.
  - Check ARIA attributes on all custom interactive elements (like the `CategoryCard` click handlers).
