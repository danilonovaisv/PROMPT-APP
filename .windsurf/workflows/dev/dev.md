---
description: Unified development tools commands
---

# /dev - Development Tools

Access MAx Framework development utilities with unified commands.

## Usage

```bash
# Debug errors
/dev debug AttributeError: 'CommandExecutor' has no attribute 'execute_plan'

# Check prompt context size
/dev context --chars 14000

# Find unfinished features
/dev dropped

# Get optimization recommendations
/dev optimize

# Migrate workspace setup
/dev migrate
```

## Commands

### /dev debug
Paste an error and get category + next steps.

### /dev context
Estimate prompt size risk before sending (check character count).

### /dev dropped
Find unfinished features and dropped work.

### /dev optimize
Get cost and model optimization recommendations.

### /dev migrate
Migrate `.windsurf` setup to a new workspace.

This replaces the old `/bug-continue`, `/context-track`, `/dropped-threads`, `/optimization`, and `/migrate` commands.
