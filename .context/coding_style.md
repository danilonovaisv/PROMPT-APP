# 🎨 Coding Style & Technical Standards: PROMPT-APP

## ⚛️ Frontend (React 19 + VITE)
- **Functional Components:** Always use functional components with hooks.
- **Strict Typing:** No `any`. Use interfaces in `src/models/types.ts`.
- **React Router 7:** Use standardized routing patterns in `src/pages/`.
- **Validation:** Every data entry or import MUST pass through a **Zod** schema (see `src/models/promptSchema.ts`).

## 💅 Styling (Vanilla CSS)
- **Centralization:** All styles reside in `src/index.css`.
- **No Frameworks:** No Tailwind, Styled-Components, or CSS-in-JS unless explicitly requested.
- **Variables:** Use CSS Custom Properties for theme consistency.
- **Fluid Layout:** Use `clamp()`, `rem`, and Flexbox/Grid for responsive design.

## 💾 Persistence (Dexie.js + Supabase)
- **IndexedDB First:** Local interaction must be synchronous with Dexie.
- **Background Sync:** Cloud synchronization (Supabase) must occur in the background without blocking the UI.
- **Soft Deletes:** Use the `isDeleted` flag for logic synchronization rather than hard removals.

## 🧪 Testing (Jest + Playwright)
- **Snapshots:** Use for UI consistency.
- **E2E:** Critical flows (Create Prompt -> Sync -> Edit) must have Playwright coverage.
- **Zod Testing:** Ensure schema edge cases are covered.
