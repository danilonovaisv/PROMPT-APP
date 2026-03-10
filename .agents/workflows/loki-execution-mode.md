---
description: Autonomous execution protocol for complex features.
---

# Loki Execution Mode Protocol

This workflow defines how the agent operates when in "Loki Mode" (High Agency / Autonomous).

## Trigger

- User command: `/loki` or "Take control".
- Complex refactors requiring multiple steps.

## Steps

### Phase 1: Planning (The Architect)

1. **Read Context**: Always read `.context/active_state.md` and `AGENT.md` first.
2. **Create Plan**: Generate `docs/plans/[feature-name].md`.
   - Must include: Goal, Changes, Verification Plan.
3. **Wait for Approval**: (If strictly required) or proceed if Auto-Run is authorized.

### Phase 2: Execution (The Engineer)

1. **Atomic Operations**:
   - Create/Edit one component at a time.
   - **Rule:** Never edit > 3 files without a verification step.
2. **Context Update**:
   - If a file is created, update `task.md` immediately.

### Phase 3: Verification (The Sentinel)

1. **Lint & Type Check**:
   - Run `npm run lint` and `npm run type-check`.
   - **Stop** if errors occur. Fix them before proceeding.
2. **Visual Check**:
   - If UI involved, ask user to check `localhost:3000`.

### Phase 4: Delivery

1. **Walkthrough**: Create a `walkthrough.md` artifact.
2. **Log**: Update `.context/logs/adjustment_log.md`.
3. **Cleanup**: Remove temporary plan files if no longer needed (archives).
