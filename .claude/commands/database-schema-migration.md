---
name: database-schema-migration
description: Workflow command scaffold for database-schema-migration in PROMPT-APP.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /database-schema-migration

Use this workflow when working on **database-schema-migration** in `PROMPT-APP`.

## Goal

Add or modify a database table or column, including schema changes, migration scripts, and updating related backend services.

## Common Files

- `supabase/migrations/*.sql`
- `src/models/types.ts`
- `src/services/*.ts`
- `.max/project-context.json`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Create or update a migration SQL file in supabase/migrations/
- Update related model/types files (e.g., src/models/types.ts)
- Update backend service files that interact with the changed table (e.g., src/services/syncService.ts, src/services/supabaseMenus.ts)
- Optionally update .max/project-context.json for project context
- Update UI or page files if the schema change affects the frontend

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.