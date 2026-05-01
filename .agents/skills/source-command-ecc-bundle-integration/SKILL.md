---
name: "source-command-ecc-bundle-integration"
description: "Workflow command scaffold for ecc-bundle-integration in PROMPT-APP."
---

# source-command-ecc-bundle-integration

Use this skill when the user asks to run the migrated source command `ecc-bundle-integration`.

## Command Template

# /ecc-bundle-integration

Use this workflow when working on **ecc-bundle-integration** in `PROMPT-APP`.

## Goal

Integrate or update an ECC (External Cognitive Component) bundle for PROMPT-APP, including commands, skills, agents, and configuration files.

## Common Files

- `.Codex/commands/*.md`
- `.Codex/skills/PROMPT-APP/SKILL.md`
- `.Codex/ecc-tools.json`
- `.Codex/identity.json`
- `.Codex/homunculus/instincts/inherited/PROMPT-APP-instincts.yaml`
- `.codex/agents/*.toml`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Add or update files in .Codex/commands/ (such as database-migration-and-application-update.md, database-schema-migration.md, feature-development.md, refactoring.md)
- Add or update .Codex/skills/PROMPT-APP/SKILL.md
- Add or update .Codex/ecc-tools.json
- Add or update .Codex/identity.json
- Add or update .Codex/homunculus/instincts/inherited/PROMPT-APP-instincts.yaml

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.
