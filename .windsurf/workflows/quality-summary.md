---
description: Automatically generate quality improvement summaries after successful commits
---

# Quality Summary Workflow

This workflow automatically generates comprehensive summaries of quality improvements made during pre-commit hook fixes.

## Usage

### Automatic Generation (Recommended)
```bash
# After successful commit, run:
quality-summary
```

### Manual Generation
```bash
# Generate summary for last commit
quality-summary --last

# Generate summary for specific commit hash
quality-summary --commit <hash>

# Generate summary for date range
quality-summary --since "2024-01-01" --until "2024-01-31"
```

## What It Does

1. **Analyzes recent commits** for quality-related changes
2. **Categorizes improvements** by type (mypy, flake8, formatting, etc.)
3. **Generates markdown summary** with before/after metrics
4. **Updates changelog** with quality improvements
5. **Creates commit message template** for future use

## Output Files

- `.max/quality-changelog.md` - Cumulative quality improvements log
- `quality-summary.md` - Latest summary (temporary)
- `.max/last-quality-summary.md` - Persistent latest summary

## Integration

This workflow integrates with:
- Pre-commit hooks (automatic detection)
- Git history analysis
- MAx command system
- Existing quality tools (mypy, flake8, black, isort)

## Configuration

Edit `.max/quality-config.json` to customize:
- File patterns to include/exclude
- Summary categories and formatting
- Output locations
- Notification preferences
