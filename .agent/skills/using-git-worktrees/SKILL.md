---
name: using-git-worktrees
description: Use when starting new feature work in PROMPT-APP to create isolated development environment
---

# Using Git Worktrees for PROMPT-APP

## Overview

Create isolated workspace on new branch for each feature. Never work directly on main/master.

**Core principle:** Isolated branches prevent conflicts and enable parallel development.

## When to Use

**Always, before starting any feature or bug fix:**
- New feature development
- Bug fixes
- Experiments
- Testing ideas

**No exceptions.** Main/master stays clean.

## The Process

### 1. Create Worktree

```bash
git worktree add ../prompt-app-feature-name -b feature/feature-name
```

This creates:
- New branch `feature/feature-name`
- Separate working directory `../prompt-app-feature-name`
- Isolated from your current work

### 2. Navigate to Worktree

```bash
cd ../prompt-app-feature-name
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Verify Clean State

```bash
npm test
npm run build
```

Confirm everything passes before starting work.

### 5. Do Your Work

Implement the feature following TDD and other skills.

### 6. Commit Frequently

```bash
git add .
git commit -m "feat: description of change"
```

Small, frequent commits are better than large ones.

### 7. Finish Work

When done, use `finishing-a-development-branch` skill to:
- Verify all tests pass
- Decide: merge, create PR, keep, or discard
- Clean up worktree

## Benefits

**Isolation:**
- Each feature in separate directory
- No conflicts between features
- Can switch contexts instantly

**Safety:**
- Main/master always clean
- Easy to abandon bad experiments
- No risk of breaking production code

**Parallel Development:**
- Multiple features at once
- Different branches for different tasks
- No need to stash changes

## Common Commands

### List Worktrees

```bash
git worktree list
```

### Remove Worktree

```bash
git worktree remove ../prompt-app-feature-name
```

### Prune Stale Worktrees

```bash
git worktree prune
```

## Red Flags

**Never:**
- Work directly on main/master
- Skip creating worktree
- Forget to verify clean state
- Leave worktrees around after finishing
- Have multiple worktrees on same branch

## Integration with Other Skills

- **writing-plans** → Create worktree after plan approval
- **subagent-driven-development** → Each plan execution uses worktree
- **finishing-a-development-branch** → Clean up worktree when done
- **brainstorming** → Creates worktree during design phase

## Example Workflow

```bash
# Start new feature
git worktree add ../prompt-app-sync-improvement -b feature/sync-improvement
cd ../prompt-app-sync-improvement
npm install
npm test  # Verify clean state

# Do work...
git add .
git commit -m "feat: improve sync performance"

# Finish
git worktree remove ../prompt-app-sync-improvement
git branch -d feature/sync-improvement  # After merge
```

## Final Rule

```
New feature = New worktree
No worktree = Not started
```

**No exceptions without your human partner's explicit permission.**
