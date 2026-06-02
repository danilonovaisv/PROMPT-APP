---
trigger: always_on
---

# Workflow Rules

### R-06 — Deterministic Workflows

All workflows must define:

* Inputs
* Agents involved
* Execution order
* Outputs
* Validation checkpoints

Implicit workflows are forbidden.

### R-07 — Validation Gates

Each workflow step must validate output **before** the next step.
Invalid outputs halt execution.
