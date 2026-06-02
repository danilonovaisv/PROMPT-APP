---
name: verification-before-completion
description: Use before declaring any task complete in PROMPT-APP, to ensure work is actually done correctly
---

# Verification Before Completion for PROMPT-APP

## Overview

Never claim success without evidence. Verification is mandatory, not optional.

**Core principle:** Evidence before claims. Run verification commands before saying "done".

**Violating this rule means you haven't finished the task.**

## When to Use

**Always, before marking any task complete:**
- After implementing a feature
- After fixing a bug
- After refactoring code
- After updating configuration
- After adding tests

**No exceptions.** If you can't verify it, you can't claim it's done.

## The Iron Law

```
NO CLAIMS OF COMPLETION WITHOUT VERIFICATION EVIDENCE
```

## Verification Checklist

Before saying "done", you MUST:

### 1. Run Tests

```bash
npm test
```

Confirm:
- All tests pass
- No new test failures
- Output is clean (no warnings, errors)

**If tests fail:** Fix them. Don't claim completion.

### 2. Build Project

```bash
npm run build
```

Confirm:
- Build succeeds
- No TypeScript errors
- No bundling errors
- Output files generated

**If build fails:** Fix it. Don't claim completion.

### 3. Lint Code

```bash
npm run lint
```

Confirm:
- No code style errors
- Code follows project conventions
- No unused imports or variables

**If lint fails:** Fix it. Don't claim completion.

### 4. Verify Specific Requirements

For each requirement in the task:
- Can you demonstrate it works?
- Can you show evidence (test output, screenshots, logs)?
- Did you test edge cases?

### 5. Check for Regressions

- Did other tests still pass?
- Did you break existing functionality?
- Are there any side effects?

## Common Verification Commands for PROMPT-APP

### Unit Tests
```bash
npm test
npm test -- path/to/specific.test.ts
```

### Integration Tests
```bash
npm run test:integration
```

### End-to-End Tests
```bash
npm run test:e2e
npx playwright test
```

### Type Checking
```bash
npx tsc --noEmit
```

### Build
```bash
npm run build
```

### Code Style Check
```bash
npm run lint
npm run lint:fix
```

### Database Migrations
```bash
npm run db:migrate
npm run db:check
```

## Red Flags - STOP and Verify

If you catch yourself thinking:
- "Tests should pass" → **Run them**
- "Build will probably work" → **Build it**
- "I manually tested it" → **Write automated test**
- "It worked last time" → **Verify again**
- "I'll verify later" → **Verify now**
- "Close enough" → **Not acceptable**

**ALL of these mean: STOP. Run verification commands.**

## Example: Feature Implementation

**Task:** Add prompt validation

**WRONG (no verification):**
```
✅ Done! Added prompt validation.
```

**RIGHT (with verification):**
```
Running verification...

$ npm test src/utils/promptValidator.test.ts
PASS ✓ Validates empty text
PASS ✓ Validates missing tags
PASS ✓ Accepts valid prompt

$ npx tsc --noEmit
✓ No TypeScript errors

$ npm run lint
✓ No linting issues

✅ Complete! All tests pass, no type errors, clean lint.
```

## Example: Bug Fix

**Task:** Fix sync service memory leak

**WRONG (no verification):**
```
✅ Fixed the memory leak in syncService.
```

**RIGHT (with verification):**
```
Running verification...

$ npm test src/services/syncService.test.ts
PASS ✓ Releases database connections
PASS ✓ Clears cache after sync
PASS ✓ No memory growth over 100 iterations

$ npm run build
✓ Build successful
✓ Bundle size unchanged

✅ Complete! Memory leak fixed, all tests pass, build clean.
```

## What Counts as Evidence

**Good evidence:**
- Test output showing PASS
- Build output showing success
- Lint output showing no errors
- Screenshots of working UI
- Log output showing correct behavior
- Performance metrics showing improvement

**Bad evidence (not acceptable):**
- "I think it works"
- "It should be fine"
- "I tested it manually"
- "Looks good to me"
- No output at all

## When Verification Fails

If verification shows problems:

1. **Don't claim completion**
2. **Fix the issue**
3. **Re-run verification**
4. **Repeat until clean**

## Integration with Other Skills

- **test-driven-development** → Verification includes running the tests you wrote
- **systematic-debugging** → Verification proves the bug is actually fixed
- **subagent-driven-development** → Each subagent must verify their task
- **writing-plans** → Plans should include verification steps

## Final Rule

```
Claimed done = Verification evidence provided
No evidence = Not done
```

**No exceptions without your human partner's explicit permission.**
