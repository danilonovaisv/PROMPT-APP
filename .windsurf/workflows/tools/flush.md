# /flush - Rapid Queue Execution

This workflow executes all queued tasks as quickly as possible using the free model to clear the queue and reduce context.

## What /flush Does

1. **Switches to SWE-1.5** - Uses the free model for speed
2. **Auto-accepts commands** - No prompts for confirmation
3. **Processes queued messages** - Handles message queue
4. **Auto-answers** - Provides minimal responses
5. **Drains queue** - Clears all pending messages
6. **Returns to normal** - Restores previous settings

## Usage

```
/flush
```

## Execution Flow

```
🔄 /flush initiated
  ├─ Switching to SWE-1.5 (FREE)
  ├─ Auto-accepting commands
  ├─ Processing queued messages...
  │   ├─ 📨 Set up pre-commit hooks
  │   └─ 📨 Fix typo in README
  ├─ Queue drained
  └─ Restoring normal settings
✅ /flush complete
```

## Behavior Changes During Flush

### Model Selection
- **Forced**: SWE-1.5 (FREE)
- **Reason**: Fastest execution, zero cost
- **Auto-answer**: Minimal responses

### Command Execution
- **No prompts**: Auto-accept all safe commands
- **No confirmations**: Assume yes for everything
- **Fast mode**: Skip verbose output

### Response Format
- **Minimal**: Only essential information
- **No Next blocks**: Reduces context growth
- **No callouts**: Plain text only

## Output Format

### During Flush
```
🔄 Flushing queue...
� Processing: Set up pre-commit hooks...
✅ Processed
� Processing: Fix typo in README...
✅ Processed
✨ Queue drained!
```

### After Flush
```
🎯 Flush complete!
   Processed: 2 messages
   Duration: 45s
   Model: SWE-1.5 (FREE)
   Context: Reduced by 30%
```

## Integration

### When to Use /flush
- **End of session** - Clear remaining tasks
- **Context full** - Reduce memory usage
- **Quick cleanup** - Fast queue clearing
- **Tab management** - Prepare for new tab

### Before /flush
- Save important work
- Review pinned tasks
- Check for critical items

### After /flush
- Review execution results
- Check for errors
- Resume normal work

## Safety Features

### Auto-Safe Mode
- Only executes safe commands
- Skips destructive operations
- Preserves important files

### Command Filtering
- **Allowed**: File operations, setup, documentation
- **Blocked**: rm, mv, system changes
- **Manual**: Complex operations requiring review

### Error Handling
- Continues on individual failures
- Logs errors for review
- Doesn't stop the flush

## Advanced Options

### Flush with Limits
```
/flush --max-tasks 5
/flush --timeout 60s
/flush --safe-only
```

### Flush with Report
```
/flush --report
```

## Examples

### Example 1: Basic Flush
```
User: /flush
AI: 🔄 Flushing queue...
    � Processing: Set up pre-commit hooks...
    ✅ Processed
    📨 Processing: Fix typo in README...
    ✅ Processed
    ✨ Queue drained!
```

### Example 2: Flush with Report
```
User: /flush --report
AI: 🔄 Flushing queue...
    � Processing: Set up pre-commit hooks...
    ✅ Processed
    � Processing: Fix typo in README...
    ✅ Processed

    🎯 Flush Report:
    - Messages processed: 2
    - Success rate: 100%
    - Time saved: ~5 minutes
    - Context reduced: 25%
```

## Configuration

### Flush Settings
Stored in `.max/flush_config.json`:

```json
{
  "auto_accept": true,
  "model": "SWE-1.5",
  "timeout": 30,
  "max_tasks": 50,
  "safe_only": true,
  "minimal_output": true
}
```

### Customization
- Adjust timeout for complex tasks
- Set max tasks for large queues
- Enable/disable auto-accept
- Configure safe mode

## Philosophy

The /flush command prioritizes:
- **Speed** - Process messages as fast as possible
- **Efficiency** - Use free model
- **Simplicity** - Minimal responses
- **Continuity** - Preserve important work

### Flush vs Pop
- **/flush**: Processes queued messages in the message queue
- **/pop**: Executes pinned tasks that were saved for later

This helps maintain productivity while managing context limits and keeping the workspace clean.

## Recovery

If /flush is interrupted:
- Partial execution is logged
- Remaining pins are preserved
- Can resume with /flush again
- Manual recovery available

## Best Practices

1. **Review before flushing** - Check pinned tasks
2. **Save critical work** - Don't lose important changes
3. **Monitor execution** - Watch for errors
4. **Review results** - Check what was completed
5. **Resume normal** - Return to standard workflow
