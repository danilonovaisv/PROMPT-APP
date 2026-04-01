```markdown
# PROMPT-APP Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill teaches you the core development patterns, coding conventions, and operational workflows of the PROMPT-APP codebase. PROMPT-APP is a Python project (with TypeScript/JS frontend components) focused on prompt management, real-time data synchronization, and cloud deployment. The repository emphasizes clear commit practices, consistent file organization, and robust workflows for database migrations, soft-delete logic, dependency management, real-time sync, and cloud configuration.

## Coding Conventions

- **File Naming:**  
  Use PascalCase for files, e.g., `CategoryManagerPage.tsx`, `EditorPage.tsx`.

- **Import Style:**  
  Use relative imports for internal modules.
  ```python
  from .models import Category
  ```

- **Export Style:**  
  Use named exports in TypeScript/JavaScript.
  ```typescript
  export function syncCategories() { ... }
  export type Category = { ... }
  ```

- **Commit Patterns:**  
  - Prefixes: `feat`, `chore`, `fix`, `build`
  - Example:  
    ```
    feat: add soft-delete support for categories
    fix: correct syncService bug on deleted items
    ```

## Workflows

### Database Migration and Application Update
**Trigger:** When adding/modifying database schema (tables, columns, policies) and updating application code to match.  
**Command:** `/new-table`

1. Create or modify a migration SQL file in `supabase/migrations/`.
2. Update related TypeScript types (e.g., `src/models/types.ts`).
3. Update relevant service files (e.g., `src/services/syncService.ts`, `src/services/contextMenuSync.ts`, `src/services/supabaseMenus.ts`).
4. Update UI or page files if needed (e.g., `src/pages/CategoryManagerPage.tsx`, `src/pages/EditorPage.tsx`).
5. Update `.gitignore` or `docs/PLAN.md` if relevant.
6. Commit migration and code changes together.

**Example:**  
_Adding a new column to the `categories` table:_
```sql
-- supabase/migrations/20240101_add_category_color.sql
ALTER TABLE categories ADD COLUMN color VARCHAR(20);
```
```typescript
// src/models/types.ts
export type Category = {
  id: string;
  name: string;
  color?: string;
};
```

---

### Soft-Delete Feature Implementation
**Trigger:** When adding soft-delete support for a resource and ensuring it is respected across sync, UI, and DB.  
**Command:** `/add-soft-delete`

1. Add `is_deleted` or `isDeleted` flag to TypeScript types (`src/models/types.ts`).
2. Update sync logic to handle soft-deleted items (`src/services/syncService.ts` and related files).
3. Update UI to filter or display soft-deleted items appropriately (`src/pages/CategoryManagerPage.tsx`, `src/pages/EditorPage.tsx`).
4. Add or update migration to add soft-delete column or related policy (`supabase/migrations/*.sql`).
5. Update `docs/PLAN.md` or `.max/project-context.json` if needed.

**Example:**  
```sql
-- supabase/migrations/20240102_add_is_deleted_to_categories.sql
ALTER TABLE categories ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
```
```typescript
// src/models/types.ts
export type Category = {
  id: string;
  name: string;
  isDeleted?: boolean;
};
```
```typescript
// src/services/syncService.ts
function filterActiveCategories(categories: Category[]) {
  return categories.filter(cat => !cat.isDeleted);
}
```

---

### Dependency and Build Artifact Update
**Trigger:** When updating dependencies or refreshing build outputs for deployment.  
**Command:** `/update-deps`

1. Update `pnpm-lock.yaml` or `package.json`.
2. Rebuild frontend assets (`dist/index.html`, `node_modules/.bin/*`, `.netlify/edge-functions-dist/*`, `.netlify/edge-functions-dist/manifest.json`).
3. Commit lockfile and build artifacts together.

**Example:**  
```bash
pnpm install some-new-package
pnpm build
git add pnpm-lock.yaml dist/index.html .netlify/edge-functions-dist/
git commit -m "build: update deps and rebuild assets"
```

---

### Realtime or Sync Service Enhancement
**Trigger:** When fixing or enhancing real-time sync/subscription logic due to schema changes or bugs.  
**Command:** `/fix-sync`

1. Update `src/services/realtimeService.ts` or `src/services/syncService.ts`.
2. Update related migration or diagnostic SQL if needed.
3. Update UI or types if relevant.
4. Commit service and migration/diagnostic changes together.

**Example:**  
```typescript
// src/services/realtimeService.ts
export function subscribeToCategoryChanges() {
  // ...subscription logic
}
```
```sql
-- supabase/diagnostics/20240103_check_category_sync.sql
SELECT * FROM categories WHERE updated_at > NOW() - INTERVAL '1 day';
```

---

### Cloud Environment or Config Update
**Trigger:** When changing cloud environment settings or Codex config for deployment/testing.  
**Command:** `/update-config`

1. Edit `.codex/config.toml` or `.codex/environments/environment.toml`.
2. Update `.env.example` or `scripts/setup-cloud-env.sh` if needed.
3. Commit config and environment changes together.

**Example:**  
```toml
# .codex/config.toml
[project]
name = "prompt-app"
region = "us-east-1"
```
```bash
cp .env.example .env
./scripts/setup-cloud-env.sh
```

---

## Testing Patterns

- **Test File Pattern:**  
  Test files use the `*.test.*` naming convention (e.g., `CategoryManagerPage.test.tsx`).
- **Framework:**  
  The specific testing framework is not detected, but standard JS/TS test runners (like Jest or Vitest) are likely.

**Example:**  
```typescript
// CategoryManagerPage.test.tsx
import { render } from '@testing-library/react';
import CategoryManagerPage from './CategoryManagerPage';

test('renders category manager', () => {
  render(<CategoryManagerPage />);
  // assertions...
});
```

## Commands

| Command         | Purpose                                                      |
|-----------------|--------------------------------------------------------------|
| /new-table      | Start a database migration and update application code        |
| /add-soft-delete| Implement or update soft-delete logic for a resource         |
| /update-deps    | Update dependencies and rebuild build artifacts              |
| /fix-sync       | Enhance or fix real-time sync/subscription logic             |
| /update-config  | Update cloud environment or Codex configuration              |
```