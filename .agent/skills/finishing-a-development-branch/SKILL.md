---
name: finishing-a-development-branch
description: Use when completing feature work in PROMPT-APP to verify, merge, and clean up
---

# Finishing a Development Branch for PROMPT-APP

## Overview

Verify tests, present options (merge/PR/keep/discard), clean up worktree.

**Core principle:** Every branch must be properly finished - merged, reviewed, or discarded.

## When to Use

**Always, after completing any feature or bug fix:**
- All tasks from plan complete
- Ready to integrate changes
- Need to decide what to do with branch

**No exceptions.** Don't leave branches hanging.

## The Process

### 1. Verify All Tests Pass

```bash
npm test
```

Confirm:
- All tests pass
- No new failures
- Coverage maintained

**If tests fail:** Fix them before proceeding.

### 2. Run Build

```bash
npm run build
```

Confirm:
- Build succeeds
- No TypeScript errors
- Bundle size acceptable

**If build fails:** Fix it before proceeding.

### 3. Check Code Quality

```bash
npm run lint
```

Confirm:
- No style errors
- Code follows conventions
- No warnings

**If lint fails:** Fix it before proceeding.

### 4. Review Changes

```bash
git diff main..HEAD
```

Review:
- What changed?
- Is it complete?
- Any TODOs left?
- Documentation updated?

### 5. Present Options to Human Partner

Show summary and ask:

**"Branch ready. Options:**

1. **Merge to main** - Direct merge (for small, safe changes)
2. **Create Pull Request** - For review (recommended for larger changes)
3. **Keep branch** - Continue working later
4. **Discard** - Abandon this work

**Which option?"**

### 6. Execute Chosen Option

#### Option 1: Merge to Main

```bash
git checkout main
git merge feature/feature-name
git branch -d feature/feature-name
git worktree remove ../prompt-app-feature-name
```

#### Option 2: Create Pull Request

```bash
git push origin feature/feature-name
# Open PR on GitHub/GitLab
# Keep worktree for now
```

#### Option 3: Keep Branch

```bash
# Do nothing, leave worktree intact
echo "Worktree preserved at ../prompt-app-feature-name"
```

#### Option 4: Discard

```bash
git checkout main
git branch -D feature/feature-name
git worktree remove ../prompt-app-feature-name
```

### 7. Clean Up

After merge or discard:
- Remove worktree
- Delete branch (if merged)
- Update project tracking

## Verification Checklist

Before presenting options:

- [ ] All tests pass
- [ ] Build succeeds
- [ ] Lint clean
- [ ] No console errors
- [ ] Documentation updated
- [ ] Commit messages clear
- [ ] No debug code left
- [ ] No commented-out code

## Red Flags

**Never:**
- Skip verification steps
- Merge without human approval
- Leave worktrees around indefinitely
- Forget to update documentation
- Merge failing tests
- Push directly to main without approval

## Example Workflow

```bash
# Verify
$ npm test
✓ All 45 tests passing

$ npm run build
✓ Build successful

$ npm run lint
✓ No issues found

# Present options
Branch ready. Options:
1. Merge to main
2. Create Pull Request  
3. Keep branch
4. Discard

User: "Create Pull Request"

# Execute
$ git push origin feature/sync-improvement
$ echo "PR created: https://github.com/org/prompt-app/pull/123"
```

## Integration with Other Skills

- **using-git-worktrees** → Created worktree at start
- **subagent-driven-development** → Executes plan in worktree
- **verification-before-completion** → Verifies before finishing
- **requesting-code-review** → Part of PR process

## Final Rule

```
Finished work = Verified + Merged/Discarded + Cleaned up
Not cleaned up = Not finished
```

**No exceptions without your human partner's explicit permission.**
