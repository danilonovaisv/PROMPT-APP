---
description: Essential MAx Framework commands for streamlined development
---

# /commands - Essential Command Explorer

Core MAx Framework commands for efficient development workflow.

## Usage

```bash
# Show all essential commands
/commands

# Filter commands by category
/commands test
/commands task
/commands perf
```

## Essential Commands

### 🧪 Testing System
- `/test` - Run comprehensive tests with auto-fix
- `/test quick` - Quick test run (minimal output)
- `/test file <path>` - Run specific test file

### � Progress Tracking
- `/bookmark` - Create manual progress bookmark
- `/bookmark list` - List all bookmarks
- `/bookmark show` - Show latest bookmark
- `/bookmark session` - Show session information

### �📋 Task Management
- `/task pin` - Pin important task to queue
- `/task unpin` - Remove pinned task
- `/task pop` - Execute all pinned tasks
- `/task show` - Show pinned tasks

### ⚡ Performance
- `/perf stats` - Show performance metrics
- `/perf optimize` - Optimize system performance
- `/perf clear-cache` - Clear all caches

### 📏 Quality & Standards
- `/standards check` - Check coding standards
- `/standards plan` - Generate refactoring plan
- `/standards refactor` - Apply safe refactoring

### 🤖 AI Tools
- `/ai analyze` - Analyze code quality
- `/ai generate-tests` - Generate unit tests

### 🗂️ Workspace
- `/ws organize` - Auto-organize workspace
- `/ws status` - Show workspace status

### 🧠 Memory
- `/memory capture` - Store important insights
- `/memory retrieve` - Retrieve stored insights
- `/memory list` - List captured insights

## Removed Commands

The following commands have been removed to reduce bundle size and complexity:

- ❌ `/test-runner` - Redundant with `/test`
- ❌ `/test-cross-repo` - Niche use case
- ❌ `/quality-summary` - Integrated into `/standards`
- ❌ Complex dashboard commands - Overkill for most use cases
- ❌ Extensive meta commands - Simplified to essentials
- ❌ Multiple planning commands - Consolidated into task system

## Streamlined Benefits

✅ **Smaller Bundle Size**: Removed 40% of commands
✅ **Faster Execution**: Less command parsing overhead
✅ **Easier Learning**: Focus on essential commands only
✅ **Better Maintenance**: Fewer commands to maintain
✅ **Cleaner API**: More focused command set

## Quick Reference

```bash
# Daily workflow
/task pin "Implement feature X"
/test quick
/perf stats
/task pop

# Code quality workflow
/standards check
/ai analyze
/test file my_feature.py
/ws organize

# Performance workflow
/perf optimize
/perf clear-cache
/perf stats
```

This streamlined command set provides 80% of the functionality with 40% of the complexity.
