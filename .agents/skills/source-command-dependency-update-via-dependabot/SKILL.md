---
name: "source-command-dependency-update-via-dependabot"
description: "Workflow command scaffold for dependency-update-via-dependabot in PROMPT-APP."
---

# source-command-dependency-update-via-dependabot

Use this skill when the user asks to run the migrated source command `dependency-update-via-dependabot`.

## Command Template

# /dependency-update-via-dependabot

Use this workflow when working on **dependency-update-via-dependabot** in `PROMPT-APP`.

## Goal

Update project dependencies, especially npm/yarn packages, often triggered by Dependabot or similar tools.

## Common Files

- `.netlify/plugins/package-lock.json`
- `pnpm-lock.yaml`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Update .netlify/plugins/package-lock.json and/or pnpm-lock.yaml
- Merge or review the pull request

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.
