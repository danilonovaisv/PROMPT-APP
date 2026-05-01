---
name: "source-command-unit-test-addition-or-fix-workflow"
description: "Workflow command scaffold for unit-test-addition-or-fix-workflow in PROMPT-APP."
---

# source-command-unit-test-addition-or-fix-workflow

Use this skill when the user asks to run the migrated source command `unit-test-addition-or-fix-workflow`.

## Command Template

# /unit-test-addition-or-fix-workflow

Use this workflow when working on **unit-test-addition-or-fix-workflow** in `PROMPT-APP`.

## Goal

Add new unit tests or fix existing ones, often to address CI issues or cover new features.

## Common Files

- `tests/unit/exportJson.test.ts`
- `tests/unit/autoSync.test.ts`
- `tests/unit/backupManager.test.ts`
- `tests/unit/contextMenuSync.test.ts`
- `tests/setup.ts`
- `package.json`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Edit or add files in tests/unit/ (e.g., exportJson.test.ts, autoSync.test.ts, backupManager.test.ts, contextMenuSync.test.ts)
- Edit tests/setup.ts for test environment setup or fixes
- Update package.json or pnpm-lock.yaml if dependencies are involved
- Commit with a message referencing test addition or fix
- Open a pull request

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.
