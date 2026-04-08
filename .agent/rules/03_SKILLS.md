# Skills Rules

### R-04 — Skills Are Passive

Skills are **capabilities**, not decision-makers.
They:

* Cannot execute autonomously
* Cannot override agent logic
* Cannot store memory

### R-05 — Skill Invocation

Skills may only be invoked by:

* Orchestrator Agent
* An agent explicitly allowed by scope

Every skill call must be traceable.
