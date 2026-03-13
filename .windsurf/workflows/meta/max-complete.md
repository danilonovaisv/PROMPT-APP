---
description: Complete MAx command reference with all prefixed versions
---

# /max - Complete MAx Command Set

The `/max` command is the main entry point for all MAx Framework operations. Every command has both a full prefixed version and a short alias.

## Core MAx Commands

### Framework Management
```bash
# Full versions
/max status
/max config show
/max config set <key> <value>
/max info
/max health
/max update

# Short aliases (where applicable)
/max
/max config
/max info
/max health
/max update
```

### Complete Command Namespace Structure

#### 📋 Task Commands
```bash
# Full prefixed versions
/task-pin <text>
/task-unpin <pin-id>
/task-pop
/task-show
/task-queue

# Short aliases
/pin <text>
/unpin <pin-id>
/pop
/show-pins
/task-queue
```

#### 🧭 Planning Commands
```bash
# Full prefixed versions
/plan-set <focus>
/plan-next --n 5
/plan-done <task#>

# Short aliases
/plan-set <focus>
/plan-next --n 5
/plan-done <task#>
```

#### 🔍 Review Commands
```bash
# Full prefixed versions
/last-review
/last-critique
/last-summarize
/last-risk
/last-changes
/last-cost

# Variable depth
/last-3-review
/last-5-summarize

# Short aliases
/sus
/roast
/tldr
/risk
/diff
/cost
```

#### 🐛 Development Commands
```bash
# Full prefixed versions
/dev-debug <error>
/dev-context [--chars N]
/dev-dropped
/dev-optimize
/dev-migrate

# Short aliases
/bug-continue <error>
/context-track [--chars N]
/dropped-threads
/optimization
/migrate
```

#### 🤖 AI Code Commands
```bash
# Full prefixed versions
/ai-analyze --file <path>
/ai-generate-tests --file <path>
/ai-report
/ai-visualize <prompt>

# Short aliases
/ai-code-quality analyze --file <path>
/ai-code-quality generate --file <path>
/ai-code-quality report
/visualize-task <prompt>
```

#### 🗂️ Workspace Commands
```bash
# Full prefixed versions
/workspace-refresh
/workspace-status
/workspace-auto-organize

# Short aliases
/ws-r
/ws-s
/ws-a

# Unified format
/ws refresh
/ws status
/ws organize
```

#### 🗓️ Session Commands
```bash
# Full prefixed versions
/session-start
/session-end
/session-status

# Short aliases
/start-session
/end-session
/session-status
```

#### 📖 Meta Commands
```bash
# Full prefixed versions
/meta-explain [concept]
/meta-eco
/meta-model-calc
/meta-format
/meta-templates

# Short aliases
/humanify [concept]
/eco
/model-calculator
/format
/templates
```

#### 🧠 Memory Commands
```bash
# Full prefixed versions
/memory-capture <model> <task> <output>
/memory-retrieve <query> [--limit N]
/memory-list [--category]
/memory-stats

# Short aliases
/mem-capture <model> <task> <output>
/mem <query> [--limit N]
/mem-list [--category]
/mem-stats
```

## Command Discovery

Use `/commands` to see all available commands in an interactive dropdown format.

## Quick Reference

- **Full commands**: `/namespace-action` (e.g., `/task-pin`)
- **Short aliases**: `/alias` (e.g., `/pin`)
- **Both work**: Choose your preferred style
- **Consistent**: Every command has both versions
