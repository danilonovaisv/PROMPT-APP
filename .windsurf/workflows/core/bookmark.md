---
description: Automatic progress bookmarking system for session tracking
---

# /bookmark - Progress Bookmarking System

Create and manage automatic bookmarks for tracking progress, sessions, and milestones.

## Usage

```bash
# Create a manual bookmark
/bookmark

# Create a bookmark with custom type
/bookmark milestone

# List all bookmarks
/bookmark list

# Show latest bookmark
/bookmark show

# Show specific bookmark
/bookmark show <bookmark_id>

# Remove a bookmark
/bookmark remove <bookmark_id>

# Clear all bookmarks
/bookmark clear

# Show session information
/bookmark session
```

## Automatic Bookmarks

The bookmark system automatically creates bookmarks for key events:

### 🚀 Session Management
- **Session Start**: Automatically created when session begins
- **Session End**: Automatically created when session ends
- **Duration Tracking**: Calculates session duration automatically

### 📊 Progress Tracking
- **Test Runs**: After test executions (passed/failed)
- **Quality Checks**: After quality gate runs (score tracking)
- **Milestones**: Major development milestones

### 🔄 Context Tracking
- **Git Status**: Current branch and modified files
- **Working Directory**: Current directory context
- **Timestamp**: Precise timing for all events

## Bookmark Types

| Type | Description | When Created |
|------|-------------|--------------|
| `session_start` | Session begins | Automatic |
| `session_end` | Session ends | Automatic |
| `manual` | Manual bookmark | User request |
| `progress` | Milestone reached | Automatic |
| `test_run` | Test execution | Automatic |
| `quality_check` | Quality gate | Automatic |

## Bookmark Data Structure

Each bookmark contains:

```json
{
  "id": "manual_1640092800",
  "type": "manual",
  "timestamp": "2026-02-20T08:45:00",
  "context": "Branch: main | Directory: MAx",
  "files_modified": ["M file.py", "A new_file.py"],
  "git_status": "Modified: 2, Added: 1, Deleted: 0",
  "working_directory": "/path/to/project",
  "session_id": "session_1640092000"
}
```

## Session Tracking

Sessions provide comprehensive tracking:

```json
{
  "session_id": "session_1640092000",
  "start_time": "2026-02-20T08:30:00",
  "end_time": "2026-02-20T12:45:00",
  "duration": "4h 15m",
  "start_context": "Branch: feature-x | Directory: src",
  "end_context": "Branch: feature-x | Directory: src",
  "start_files": ["M file1.py"],
  "end_files": ["M file1.py", "M file2.py", "A file3.py"]
}
```

## Automatic Integration

### Test Integration
```python
# Automatically called after test runs
from .max.core.commands.bookmark_handler import auto_test_bookmark

auto_test_bookmark("passed")  # or "failed"
```

### Quality Integration
```python
# Automatically called after quality checks
from .max.core.commands.bookmark_handler import auto_quality_bookmark

auto_quality_bookmark(8.5)  # Quality score
```

### Progress Integration
```python
# Automatically called for milestones
from .max.core.commands.bookmark_handler import auto_progress_bookmark

auto_progress_bookmark("Feature X completed")
```

## Use Cases

### 📝 Daily Development
```bash
# Start day
# (Automatic session_start bookmark)

# Work on feature
/bookmark milestone "Started feature implementation"

# Run tests
/test
# (Automatic test_run bookmark)

# End day
# (Automatic session_end bookmark)
```

### 🎯 Feature Development
```bash
# Feature start
/bookmark "feature_start"

# Progress checkpoints
/bookmark "api_completed"
/bookmark "tests_written"
/bookmark "documentation_done"

# Feature complete
/bookmark "feature_complete"
```

### 🐛 Bug Fixing
```bash
# Bug identified
/bookmark "bug_identified"

# Fix implemented
/bookmark "fix_implemented"

# Tests passing
/test
# (Automatic test_run bookmark)

# Bug resolved
/bookmark "bug_resolved"
```

## Session Management

### Automatic Session Tracking
Sessions are automatically tracked when:
- MAx Framework starts up
- MAx Framework shuts down
- Significant time gaps between interactions

### Manual Session Control
```bash
# Start new session manually
/bookmark session_start

# End current session manually
/bookmark session_end

# View session info
/bookmark session
```

## Progress Analysis

### Bookmark History
```bash
# View all bookmarks
/bookmark list

# Filter by type
# (Coming soon: /bookmark list --type progress)

# Filter by date range
# (Coming soon: /bookmark list --since 2026-02-19)
```

### Session Analytics
```bash
# Session summary
/bookmark session

# Session duration tracking
# (Coming soon: /bookmark sessions --stats)

# Progress over time
# (Coming soon: /bookmark progress --timeline)
```

## Storage

Bookmarks are stored in:
- **Location**: `.max/bookmarks/`
- **Bookmarks**: `bookmarks.json`
- **Sessions**: `session.json`
- **Format**: JSON for easy parsing

## Benefits

✅ **Progress Tracking**: Automatic milestone recording
✅ **Session Management**: Comprehensive session analytics
✅ **Context Preservation**: Git status and file changes
✅ **Timeline Creation**: Complete development timeline
✅ **Resume Capability**: Know exactly where you left off
✅ **Productivity Analytics**: Session duration and patterns

## Examples

### Daily Workflow
```bash
$ /bookmark list
🔖 Latest bookmarks:
1. session_end - 2026-02-20 12:45 (Duration: 4h 15m)
2. test_run - 2026-02-20 12:30 (Result: passed)
3. progress - 2026-02-20 11:15 (Milestone: API completed)
4. session_start - 2026-02-20 08:30
```

### Feature Development
```bash
$ /bookmark show progress_1640092800
🔖 Bookmark Details:
Type: progress
Time: 2026-02-20 11:15:00
Context: Branch: feature-auth | Directory: src/auth
Files: M auth.py, A user_model.py
Milestone: API completed
Session: session_1640092000
```

This bookmarking system provides comprehensive progress tracking with automatic session management and milestone recording! 🎯
