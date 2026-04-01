```markdown
# PROMPT-APP Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill provides a comprehensive guide to the development patterns, coding conventions, and core workflows used in the PROMPT-APP Python codebase. It covers file organization, commit practices, code style, and the main processes for integrating ECC bundles, updating dependencies, optimizing cloud sync services, and maintaining the test suite. This guide is intended for contributors and maintainers seeking consistency and efficiency in PROMPT-APP development.

## Coding Conventions

- **Language:** Python
- **Framework:** None detected

### File Naming

- Use **PascalCase** for file names.
  - Example: `PromptEngine.py`, `CloudSyncService.py`

### Import Style

- Use **relative imports** within the package.
  ```python
  from .utils import DatabaseManager
  from ..models import UserProfile
  ```

### Export Style

- Use **named exports** (explicitly define what is exported in `__all__`).
  ```python
  __all__ = ["PromptEngine", "DatabaseManager"]
  ```

### Commit Patterns

- **Prefixes:** `feat`, `chore`, `fix`, `build`, `perf`
- **Message Example:**
  ```
  feat: add support for multi-agent prompt orchestration
  fix: resolve memory leak in cloud sync service
  perf: optimize database query for sync performance
  ```

## Workflows

### ECC Bundle Integration

**Trigger:** When adding or updating an ECC (External Cognitive Component) bundle (e.g., new commands, skills, agent configs) for PROMPT-APP  
**Command:** `/ecc-bundle`

1. Add or update files in `.claude/commands/` (e.g., `database-migration-and-application-update.md`, `feature-development.md`).
2. Add or update `.claude/skills/PROMPT-APP/SKILL.md`.
3. Add or update `.claude/ecc-tools.json`.
4. Add or update `.claude/identity.json`.
5. Add or update `.claude/homunculus/instincts/inherited/PROMPT-APP-instincts.yaml`.
6. Add or update agent configuration files in `.codex/agents/*.toml` and `.codex/AGENTS.md`.
7. Add or update `.agents/skills/PROMPT-APP/SKILL.md` and `.agents/skills/PROMPT-APP/agents/openai.yaml`.
8. Commit changes with an appropriate message (e.g., `feat: integrate new ECC bundle for agent X`).

**Example Directory Structure:**
```
.claude/
  commands/
    feature-development.md
  skills/
    PROMPT-APP/
      SKILL.md
  ecc-tools.json
  identity.json
  homunculus/
    instincts/
      inherited/
        PROMPT-APP-instincts.yaml
.codex/
  agents/
    agent1.toml
  AGENTS.md
.agents/
  skills/
    PROMPT-APP/
      SKILL.md
      agents/
        openai.yaml
```

---

### Dependency Update via Dependabot

**Trigger:** When updating project dependencies for security or maintenance, often via automated PRs  
**Command:** `/update-deps`

1. Update `.netlify/plugins/package-lock.json` and/or `pnpm-lock.yaml` as needed.
2. Review and merge the pull request.
3. Ensure application builds and tests pass after dependency updates.

**Example Commit Message:**
```
chore: update dependencies via dependabot
```

---

### Cloud Sync Service Optimization

**Trigger:** When optimizing or fixing cloud synchronization services for performance or bug fixes  
**Command:** `/optimize-sync`

1. Edit `src/services/syncService.ts` (and, if needed, `assetManager.ts` or `importService.ts`).
2. Update related documentation in `.jules/bolt.md` if applicable.
3. Commit changes with a `perf`, `fix`, or `optimize` prefix.
4. Merge changes after review.

**Example Commit Message:**
```
perf: improve memory usage in syncService
```

---

### Test Suite Update or Fix

**Trigger:** When adding new tests or fixing broken tests due to environment or dependency changes  
**Command:** `/test-fix`

1. Edit or add files in `tests/unit/` (e.g., `exportJson.test.ts`, `autoSync.test.ts`).
2. Update `tests/setup.ts` or related test configuration if necessary.
3. Update `pnpm-lock.yaml` or patch files if related to test environment setup.
4. Commit and merge changes.

**Example Commit Message:**
```
fix: update unit tests for new sync logic
```

## Testing Patterns

- **Test File Pattern:** `*.test.*` (e.g., `exportJson.test.ts`)
- **Testing Framework:** Unknown (ensure to check project documentation or `requirements.txt` for specifics)
- **Test Location:** `tests/unit/`
- **Setup Files:** `tests/setup.ts` (for test environment configuration)
- **Best Practice:** Keep tests close to the code they cover and update them with each feature or bug fix.

**Example Test File:**
```python
# tests/unit/PromptEngine.test.py

from ..PromptEngine import PromptEngine

def test_prompt_generation():
    engine = PromptEngine()
    result = engine.generate("Hello, world!")
    assert result is not None
```

## Commands

| Command         | Purpose                                                        |
|-----------------|----------------------------------------------------------------|
| /ecc-bundle     | Integrate or update an ECC bundle for PROMPT-APP               |
| /update-deps    | Update project dependencies (e.g., via Dependabot)             |
| /optimize-sync  | Optimize or fix cloud synchronization services                 |
| /test-fix       | Add or fix unit tests and resolve test environment issues      |
```
