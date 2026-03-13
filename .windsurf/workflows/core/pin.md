# /pin - Pin Tasks for Later

This workflow allows you to pin tasks from the Next block for later execution.

## What /pin Does

1. **Pins a task** - Saves a task from the Next block
2. **Stores metadata** - Model, cost, timestamp, notes
3. **Persists across sessions** - Tasks survive session restarts
4. **Visual display** - Shows all pinned tasks with details

## Usage

### Pin a Task
```
/pin C) [ ⚡ Sonnet — ~$0.06 ] Set up pre-commit hooks
```

### Pin with Notes
```
/pin C) [ ⚡ Sonnet — ~$0.06 ] Set up pre-commit hooks --notes "Important for code quality"
```

### Show All Pins
```
/pin show
```

### Unpin a Specific Task
```
/pin unpin pin_1234567890
```

### Pop All Pins (Execute and Clear)
```
/pin pop
```

### Clear All Pins
```
/pin clear
```

## Output Format

### Pinning a Task
```
📌 Pinned task: ⚡ Set up pre-commit hooks
```

### Showing Pins
```
============================================================
📌 PINNED TASKS
============================================================

1. ⚡ Set up pre-commit hooks
   Model: Sonnet (~$0.06)
   Pinned: 2026-02-20 14:30
   Notes: Important for code quality
   ID: pin_1234567890

============================================================
Total pinned: 1 task
Commands: /unpin <id>, /pop, /clear-pins
============================================================
```

### Popping Pins
```
📤 Popped 1 pinned tasks:
  • ⚡ Set up pre-commit hooks
```

## Integration with Workflows

### Before /end-session
Run /pin show to review any unpinned tasks before ending session.

### After /start-session
Run /pin pop to execute any tasks pinned from previous session.

### During Development
Pin tasks that require:
- Different environment setup
- More time than available
- External dependencies
- Higher-level model

## Pin Storage

Pins are stored in `.max/pinned_tasks.json`:

```json
{
  "pin_1234567890": {
    "id": "pin_1234567890",
    "task": "Set up pre-commit hooks",
    "model": "Sonnet",
    "cost": "~$0.06",
    "emoji": "⚡",
    "timestamp": 1708426200,
    "session_id": "session_123",
    "notes": "Important for code quality"
  }
}
```

## Advanced Features

### Session Persistence
- Pins survive across IDE restarts
- Pins survive across session restarts
- Timestamps track when tasks were pinned

### Task Metadata
- Model recommendation preserved
- Cost information saved
- Optional notes for context
- Session ID for tracking

### Bulk Operations
- /pin pop executes all pinned tasks
- /pin clear removes all pins
- Batch unpinning with multiple IDs

## Examples

### Example 1: Pin a Complex Task
```
User: /pin C) [ 🚀 Opus — ~$0.06 🔥 PROMO ] Design microservices architecture
AI: 📌 Pinned task: 🚀 Design microservices architecture
```

### Example 2: Pin Multiple Tasks
```
User: /pin A) [ 🌱 SWE-1.5 — FREE ] Fix typo in README
AI: 📌 Pinned task: 🌱 Fix typo in README

User: /pin B) [ ⚡ Sonnet — ~$0.06 ] Add error handling
AI: 📌 Pinned task: ⚡ Add error handling
```

### Example 3: Show and Pop
```
User: /pin show
AI: [Shows all pinned tasks]

User: /pin pop
AI: 📤 Popped 2 pinned tasks:
  • 🌱 Fix typo in README
  • ⚡ Add error handling
```

## Best Practices

### When to Pin
- **Complex tasks** requiring more time
- **Multi-step workflows** needing context
- **Environment-dependent** tasks
- **High-cost** tasks to budget for later

### Pin Management
- Review pins regularly with /pin show
- Clear completed pins with /unpin
- Use descriptive notes
- Pin related tasks together

### Session Workflow
1. Start session → /pin pop (execute previous pins)
2. Work on tasks → /pin complex ones for later
3. End session → /pin show (review remaining pins)

## Philosophy

The /pin command helps with:
- **Task management** - Save tasks for later
- **Context preservation** - Keep task details
- **Session continuity** - Work across sessions
- **Priority handling** - Focus on what's important now

This ensures no good ideas are lost and complex tasks get the attention they need.
