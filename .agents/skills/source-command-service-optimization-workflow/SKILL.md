---
name: "source-command-service-optimization-workflow"
description: "Workflow command scaffold for service-optimization-workflow in PROMPT-APP."
---

# source-command-service-optimization-workflow

Use this skill when the user asks to run the migrated source command `service-optimization-workflow`.

## Command Template

# /service-optimization-workflow

Use this workflow when working on **service-optimization-workflow** in `PROMPT-APP`.

## Goal

Optimize performance or memory usage of service modules (e.g., syncService, importService, realtimeService).

## Common Files

- `src/services/syncService.ts`
- `src/services/importService.ts`
- `src/services/realtimeService.ts`
- `.jules/bolt.md`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Edit one or more files in src/services/ (commonly syncService.ts, importService.ts, or realtimeService.ts)
- Update related documentation in .jules/bolt.md if applicable
- Commit with a message referencing optimization (e.g., 'Optimize', 'Batch', 'Remove debug', 'Fix memory usage')
- Open a pull request for review

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.
