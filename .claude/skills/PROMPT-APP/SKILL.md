```markdown
# PROMPT-APP Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill teaches the core development patterns and workflows used in the PROMPT-APP repository, a Python-based application with no detected framework. It covers coding conventions, file organization, commit practices, and step-by-step guides for common development tasks such as database migrations, feature implementation, build/deploy processes, dependency updates, and realtime/sync service adjustments. This guide is designed to help contributors quickly understand and follow the established practices in the codebase.

## Coding Conventions

**File Naming**
- Use PascalCase for file names.
  - Example: `CategoryManagerPage.tsx`, `EditorPage.tsx`

**Import Style**
- Prefer relative imports.
  - Example:
    ```python
    from .models import Category
    from ..services.syncService import SyncService
    ```

**Export Style**
- Use named exports (in TypeScript/JavaScript files).
  - Example:
    ```typescript
    export function syncData() { ... }
    export const CATEGORY_TYPE = 'main';
    ```

**Commit Patterns**
- Mixed commit types, using prefixes: `feat`, `chore`, `fix`, `build`
- Commit messages average 75 characters.
  - Example: `feat: add category manager page and sync service integration`

## Workflows

### Database Schema Migration
**Trigger:** When you need to add, remove, or change a table/column in the database.  
**Command:** `/new-table`

1. Create or update a migration SQL file in `supabase/migrations/`.
2. Update related model/types files (e.g., `src/models/types.ts`).
3. Update backend service files that interact with the changed table (e.g., `src/services/syncService.ts`, `src/services/supabaseMenus.ts`).
4. Optionally update `.max/project-context.json` for project context.
5. Update UI or page files if the schema change affects the frontend.

**Example:**
```sql
-- supabase/migrations/20240401_add_category_table.sql
CREATE TABLE category (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);
```
```typescript
// src/models/types.ts
export type Category = {
  id: number;
  name: string;
};
```

---

### Feature Implementation with UI and Service Update
**Trigger:** When adding a new feature or major capability to the app.  
**Command:** `/new-feature`

1. Update or create UI page/component files (e.g., `src/pages/CategoryManagerPage.tsx`).
2. Update or create service files (e.g., `src/services/syncService.ts`).
3. Update types or models if new data is introduced (e.g., `src/models/types.ts`).
4. Update migration files if persistent data is involved.
5. Optionally update documentation (e.g., `docs/PLAN.md`).

**Example:**
```typescript
// src/pages/CategoryManagerPage.tsx
import { Category } from '../models/types';

export function CategoryManagerPage() {
  // UI logic here
}
```

---

### Build and Deploy Assets Update
**Trigger:** When building the project for deployment or after significant code/config changes.  
**Command:** `/build-deploy`

1. Regenerate frontend assets (`dist/index.html`, `node_modules/.bin/*`).
2. Update Netlify edge function bundles (`.netlify/edge-functions-dist/*`, `.netlify/edge-functions-dist/manifest.json`).
3. Update dependency lockfiles (`pnpm-lock.yaml`, `package-lock.json`).
4. Commit all updated build and deployment files.

---

### Dependency Update
**Trigger:** When updating dependencies for security, bugfixes, or new features.  
**Command:** `/update-deps`

1. Update `pnpm-lock.yaml` and/or `package-lock.json`.
2. Optionally update `package.json`.
3. Regenerate build assets if necessary.
4. Commit updated lockfiles and related files.

---

### Realtime or Sync Service Adjustment
**Trigger:** When fixing bugs or improving the data sync/realtime features.  
**Command:** `/sync-fix`

1. Update `src/services/realtimeService.ts` and/or `src/services/syncService.ts`.
2. Optionally update diagnostics SQL or documentation (`supabase/diagnostics/*.sql`, `docs/audits/*.md`).
3. Update related UI files if needed.

**Example:**
```typescript
// src/services/syncService.ts
export function syncCategories() {
  // Improved sync logic here
}
```

## Testing Patterns

- Test files follow the `*.test.*` pattern.
- The specific testing framework is unknown.
- Place tests alongside the code or in a dedicated test directory.
- Example test file: `CategoryManagerPage.test.tsx`

## Commands

| Command        | Purpose                                                      |
|----------------|--------------------------------------------------------------|
| /new-table     | Start a database schema migration workflow                   |
| /new-feature   | Implement a new feature with UI and service updates          |
| /build-deploy  | Update build artifacts and deployment bundles                |
| /update-deps   | Update project dependencies and lockfiles                    |
| /sync-fix      | Fix or enhance realtime subscriptions and sync logic         |
```