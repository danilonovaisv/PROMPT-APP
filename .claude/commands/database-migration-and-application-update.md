---
name: database-migration-and-application-update
description: Workflow command scaffold for database-migration-and-application-update in PROMPT-APP.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /database-migration-and-application-update

Use this workflow when working on **database-migration-and-application-update** in `PROMPT-APP`.

## Goal

Adds or modifies database schema (tables, columns, policies) and updates application code to match new schema, ensuring frontend/backend and sync logic are consistent with database changes.

## Common Files

- `supabase/migrations/*.sql`
- `src/models/types.ts`
- `src/services/*.ts`
- `src/pages/*.tsx`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Create or modify migration SQL file in supabase/migrations/
- Update related TypeScript types (e.g., src/models/types.ts)
- Update relevant service files (e.g., src/services/syncService.ts, src/services/contextMenuSync.ts, src/services/supabaseMenus.ts)
- Update UI or page files if needed (e.g., src/pages/CategoryManagerPage.tsx, src/pages/EditorPage.tsx)
- Update .gitignore or docs/PLAN.md if relevant

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.