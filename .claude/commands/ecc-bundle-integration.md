---
name: ecc-bundle-integration
description: Workflow command scaffold for ecc-bundle-integration in PROMPT-APP.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /ecc-bundle-integration

Use this workflow when working on **ecc-bundle-integration** in `PROMPT-APP`.

## Goal

Integrate or update an ECC (External Cognitive Component) bundle for PROMPT-APP, including commands, skills, agents, and configuration files.

## Common Files

- `.claude/commands/*.md`
- `.claude/skills/PROMPT-APP/SKILL.md`
- `.claude/ecc-tools.json`
- `.claude/identity.json`
- `.claude/homunculus/instincts/inherited/PROMPT-APP-instincts.yaml`
- `.codex/agents/*.toml`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Add or update files in .claude/commands/ (such as database-migration-and-application-update.md, database-schema-migration.md, feature-development.md, refactoring.md)
- Add or update .claude/skills/PROMPT-APP/SKILL.md
- Add or update .claude/ecc-tools.json
- Add or update .claude/identity.json
- Add or update .claude/homunculus/instincts/inherited/PROMPT-APP-instincts.yaml

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.