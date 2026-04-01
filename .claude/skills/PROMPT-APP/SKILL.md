```markdown
# PROMPT-APP Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill teaches the core development patterns, workflows, and coding conventions used in the PROMPT-APP repository. PROMPT-APP is a Python-based application (no framework detected) with a strong focus on modularity, service optimization, robust testing, and maintainable UI components. The repository uses a variety of workflows for service optimization, unit testing, dependency management, UI enhancements, and agent/ECC bundle configuration.

## Coding Conventions

- **File Naming:**  
  Use PascalCase for file names.  
  _Example:_  
  ```
  CategoryPage.tsx
  AuthModal.tsx
  CloudSyncItem.tsx
  ```

- **Import Style:**  
  Use relative imports.  
  _Example:_  
  ```python
  from .utils import parse_config
  from ..services.syncService import SyncService
  ```

- **Export Style:**  
  Use named exports.  
  _Example:_  
  ```python
  def export_json(data):
      ...
  ```

- **Commit Messages:**  
  Use descriptive prefixes such as `feat`, `chore`, `fix`, `build`, `perf`.  
  _Example:_  
  ```
  feat: add batch processing to syncService
  fix: resolve n+1 query issue in importService
  ```

## Workflows

### Service Optimization Workflow
**Trigger:** When you want to optimize performance or memory usage of service modules (e.g., database queries, memory leaks, n+1 queries).  
**Command:** `/optimize-service`

1. Edit one or more files in `src/services/` (commonly `syncService.ts`, `importService.ts`, or `realtimeService.ts`).
2. Update related documentation in `.jules/bolt.md` if applicable.
3. Commit with a message referencing optimization (e.g., "Optimize", "Batch", "Fix memory usage").
4. Open a pull request for review.

_Example commit message:_  
```
perf: batch database writes in syncService to reduce load
```

---

### Unit Test Addition or Fix Workflow
**Trigger:** When you want to add new unit tests or fix existing ones, especially for new features or CI issues.  
**Command:** `/add-unit-test`

1. Edit or add files in `tests/unit/` (e.g., `exportJson.test.ts`, `autoSync.test.ts`).
2. Edit `tests/setup.ts` for environment setup or fixes.
3. Update `package.json` or `pnpm-lock.yaml` if dependencies are involved.
4. Commit with a message referencing test addition or fix.
5. Open a pull request.

_Example test file:_  
```python
# tests/unit/exportJson.test.ts

def test_export_json_valid_data():
    result = export_json({"foo": "bar"})
    assert result == '{"foo": "bar"}'
```

---

### Dependency Update Workflow
**Trigger:** When you or an automated tool (like dependabot) want to update npm/yarn dependencies.  
**Command:** `/update-deps`

1. Update `.netlify/plugins/package-lock.json` and/or `pnpm-lock.yaml`.
2. Optionally update `package.json`.
3. Commit with a message referencing dependency update or dependabot.
4. Open a pull request.

_Example commit message:_  
```
chore: update dependencies via dependabot
```

---

### UI Component or Page Fix Workflow
**Trigger:** When you want to fix a UI bug, improve accessibility, or add a small feature to a component or page.  
**Command:** `/fix-ui`

1. Edit files in `src/components/` or `src/pages/` (e.g., `Layout.tsx`, `CategoryPage.tsx`).
2. Optionally update related tests or documentation.
3. Commit with a message referencing UI fix, a11y, or enhancement.
4. Open a pull request.

_Example commit message:_  
```
fix: improve keyboard navigation in AuthModal for a11y
```

---

### ECC Bundle or Agent Config Workflow
**Trigger:** When you want to add or update agent skills, ECC tools, or related configuration for PROMPT-APP.  
**Command:** `/update-ecc-bundle`

1. Edit or add files in `.agents/skills/PROMPT-APP/`, `.claude/`, or `.codex/` directories (e.g., `SKILL.md`, `openai.yaml`, `ecc-tools.json`).
2. Commit with a message referencing ECC bundle or agent config.
3. Open a pull request.

_Example commit message:_  
```
chore: update ECC tools and add new agent config for prompt optimization
```

## Testing Patterns

- **Test File Naming:**  
  Test files use the `*.test.*` pattern and are located under `tests/unit/`.
  _Example:_  
  ```
  tests/unit/backupManager.test.ts
  tests/unit/contextMenuSync.test.ts
  ```

- **Test Structure:**  
  Tests are written as functions, typically asserting expected outcomes.
  _Example:_  
  ```python
  def test_auto_sync_triggers_on_save():
      # setup
      # action
      # assert
      assert sync_triggered is True
  ```

- **Test Setup:**  
  Shared setup logic is placed in `tests/setup.ts`.

- **Framework:**  
  No specific testing framework detected, but structure is compatible with common Python or TypeScript test runners.

## Commands

| Command             | Purpose                                                      |
|---------------------|--------------------------------------------------------------|
| /optimize-service   | Optimize performance or memory usage in service modules       |
| /add-unit-test      | Add or fix unit tests                                        |
| /update-deps        | Update project dependencies                                  |
| /fix-ui             | Fix or enhance UI components or pages                        |
| /update-ecc-bundle  | Add or update ECC bundles or agent configuration             |
```