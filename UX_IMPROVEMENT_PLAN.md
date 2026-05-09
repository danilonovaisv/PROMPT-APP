# UX Improvement Plan

## 1. Audit Findings

### 1.1 Mobile-First Responsiveness
- **Viewport Issues:** The `EditorDefinitionForm` and `EditorPlayground` do not stack well on mobile screens. Multi-column layouts break or overflow on viewports smaller than 768px.
- **Overflow:** The JSON preview in the `EditorPlayground` and `EditorPreviewModal` can cause horizontal scrolling on mobile.
- **Touch Targets:** Some buttons and interactive elements (`.btn--sm`, `.menu-tag`) fall short of the 44x44px minimum touch target size recommended for mobile interfaces.
- **Sticky Actions:** Critical actions like "Save" and "Preview" in the editor are located at the very top or bottom, requiring excessive scrolling on mobile.

### 1.2 UX Friction
- **Complex Forms:** The prompt creation flow (`EditorDefinitionForm`) is dense. The cognitive load is high due to many fields visible simultaneously without clear visual hierarchy or progressive disclosure.
- **Template Export:** Exporting a template requires navigating through menus or scrolling to find the action button.
- **Lack of Keyboard Shortcuts:** Advanced users have to rely heavily on the mouse to navigate and perform actions like saving (`Ctrl+S`) or previewing.

### 1.3 UI Consistency
- **Glassmorphism Adherence:** The current implementation of Glassmorphism in the sidebar (`.app-sidebar`) and header (`.app-header`) is basic. It lacks depth and layered blur effects that define the "Ghost Era Premium Tokens" mentioned in the design.
- **Color Contrast:** Muted text (`--color-text-muted`) on dark surfaces (`--color-surface-2`) may fail WCAG AA contrast ratios, making it hard to read.
- **Neo-brutalist Elements:** The design currently leans heavily into dark mode/glass, but lacks the stark contrast and defined borders characteristic of Neo-brutalism, if that's the intended secondary style.

### 1.4 Accessibility
- **WCAG AA Compliance:** Some color contrast issues exist. Focus states are present but could be enhanced for better visibility (`:focus-visible`).
- **ARIA Labels:** Dynamic components like `MultiSelect` and custom dropdowns need rigorous ARIA attribute audits to ensure screen readers announce state changes correctly.
- **Keyboard Navigation:** While mostly functional, the visual indicator for keyboard focus can be subtle against the dark background.

## 2. Action Plan

### 2.1 Critical Fixes (Performance & Accessibility)
- Ensure all actionable items meet the 44x44px touch target minimum by adjusting padding and min-height in `src/styles/components/buttons.css` and related component files.
- Audit and adjust `--color-text-muted` to improve contrast against dark backgrounds.
- Add robust `aria-label`, `aria-expanded`, and `aria-controls` attributes to custom interactive components, particularly the mobile menu toggle and custom selects.

### 2.2 Usability Enhancements
- **Editor Action Bar:** Introduce a sticky action bar at the bottom or top of the viewport for mobile users in the Editor, housing the Save and Preview buttons.
- **React 19 Actions:** Refactor forms, starting with `EditorMetaForm`, to use React 19's `<form action={...}>` and `useActionState` to handle loading states and submissions more gracefully without blocking the UI.
- **Keyboard Shortcuts:** Implement global hotkeys (e.g., `Cmd/Ctrl + S` to save) within the editor context.

### 2.3 Mobile Optimizations & UI Refinement
- **Header Refactor:** Extract the header logic into a dedicated `src/components/layout/Header.tsx`. Implement a "Glass" effect with enhanced blur and a staggered animation for the mobile menu appearance.
- **Responsive Grids:** Update `EditorDefinitionForm` to use a responsive grid that collapses into a single column on mobile, utilizing Tailwind-like utility classes or updating `editor.css`.
- **CSS Variables:** Refine tokens in `src/styles/tokens.css` to deepen the Glassmorphism effect (e.g., adjust `--glass-blur` and `--color-glass` opacity).
