---
description: Push safety management for MAx repository
---

# Push Safety Workflow

This workflow prevents accidental pushes without confirmation and provides configurable safety measures.

## Usage

### Check Current Status
```bash
push-safety status
```

### Enable/Disable Push Safety
```bash
# Enable push safety (default)
push-safety enable

# Disable push safety (use with caution!)
push-safety disable
```

### Manage Protected Branches
```bash
# Add protected branch
push-safety protect --add staging

# Remove protected branch
push-safety protect --remove staging
```

### Manage Auto-approve Patterns
```bash
# Add auto-approve pattern (documentation changes)
push-safety auto --add "*.md"

# Remove auto-approve pattern
push-safety auto --remove "*.md"
```

## How It Works

### Pre-push Hook
The `.git/hooks/pre-push` hook automatically runs before every push operation:

1. **Analyzes the push** - Checks what files and branches will be pushed
2. **Applies safety rules** - Based on configuration in `.max/push-safety.json`
3. **Prompts for confirmation** - When required, asks user to approve the push
4. **Blocks or allows** - Proceeds based on user response

### Safety Rules

#### Protected Branches
- **Default**: `main`, `master`, `develop`
- **Behavior**: Always requires confirmation when pushing to these branches

#### Dangerous Patterns
- **Examples**: `force.*push`, `delete.*branch`, `reset.*--hard`
- **Behavior**: Always requires confirmation for these operations

#### Auto-approve Patterns
- **Examples**: `docs/`, `README*`, `*.md`
- **Behavior**: Automatically approves pushes with only these file types

## Configuration

### Default Configuration
```json
{
  "require_confirmation": true,
  "confirmation_methods": ["prompt", "checksum"],
  "protected_branches": ["main", "master", "develop"],
  "dangerous_patterns": ["force.*push", "delete.*branch", "reset.*--hard"],
  "quiet_mode": false,
  "auto_approve_patterns": ["docs/", "README*", "*.md"]
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `require_confirmation` | boolean | true | Whether to require confirmation for pushes |
| `protected_branches` | array | ["main", "master", "develop"] | Branches that always require confirmation |
| `dangerous_patterns` | array | ["force.*push", ...] | Patterns that trigger confirmation |
| `auto_approve_patterns` | array | ["docs/", "*.md"] | File patterns that are auto-approved |
| `quiet_mode` | boolean | false | Reduce output verbosity |

## Examples

### Scenario 1: Documentation Push
```bash
# Only README.md changes
git add README.md
git commit -m "Update documentation"
git push origin main

# Output: ✅ Auto-approved push (documentation changes only)
```

### Scenario 2: Code Changes to Main
```bash
# Code changes to main branch
git add src/
git commit -m "Add new feature"
git push origin main

# Output: 🚨 Push Safety Check
# Command: git push origin main
# Files to push: 5
#   - src/main.py
#   - src/utils.py
#   - tests/test_main.py
#   - tests/test_utils.py
#   - requirements.txt
#
# ⚠️  This will push changes to remote repository.
# Do you want to continue? (y/N):
```

### Scenario 3: Force Push
```bash
# Force push (always requires confirmation)
git push --force-with-lease origin main

# Output: 🚨 Push Safety Check
# Command: git push --force-with-lease origin main
# Files to push: 3
#   - src/main.py
#   - src/utils.py
#   - tests/test_main.py
#
# ⚠️  This will push changes to remote repository.
# Do you want to continue? (y/N):
```

## Integration

### IDE Integration
The pre-push hook works automatically with:
- **VS Code/Windsurf** - Git operations trigger the hook
- **Git CLI** - All git push commands are protected
- **GUI Git tools** - Any tool using git hooks is protected

### Bypassing Safety (Emergency Only)
If you need to bypass push safety in an emergency:

```bash
# Bypass the pre-push hook
git push --no-verify origin main
```

⚠️ **Warning**: Only use `--no-verify` in emergency situations and with full understanding of the consequences.

## Best Practices

1. **Keep push safety enabled** for all repositories
2. **Review auto-approve patterns** regularly
3. **Use protected branches** for critical branches
4. **Test changes locally** before pushing
5. **Document exceptions** when bypassing safety

## Troubleshooting

### Hook Not Running
```bash
# Check if hook is executable
ls -la .git/hooks/pre-push

# Make executable if needed
chmod +x .git/hooks/pre-push
```

### Configuration Issues
```bash
# Check configuration
push-safety status

# Reset to defaults
rm .max/push-safety.json
push-safety status
```

### Hook Bypassed
If the hook was bypassed, check:
- Was `--no-verify` used?
- Is the hook executable?
- Are there any git configuration overrides?
