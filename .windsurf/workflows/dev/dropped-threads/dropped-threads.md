---
description: Find and track dropped threads and unfinished features
---

# /dropped-threads - Track Unfinished Features

This workflow helps you identify and track feature implementations that were started but not completed in the current chat session.

## What /dropped-threads Does

1. **Scans the conversation** for feature discussions and implementations
2. **Identifies dropped threads** - topics mentioned but not completed
3. **Categorizes by status** - started, in-progress, abandoned, blocked
4. **Creates a tracking file** - Saves to `.max/dropped-threads.md`
5. **Provides summary** - Shows what needs attention

## Detection Patterns

### Feature Indicators
- "Let's implement..." / "We should add..."
- "Create a new..." / "Build a..."
- "Add support for..." / "Implement..."
- Code snippets without completion
- TODO comments mentioned in chat

### Drop Indicators
- Topic changes without completion
- "We'll come back to this..."
- "For now, let's focus on..."
- Unfinished code blocks
- Architecture discussions without implementation

## Output Format

```
🧵 Dropped Threads - [Date]

## Critical (High Priority)
- [ ] **Feature X** - Started implementation at [line/time], dropped at [line/time]
  - Status: Code written but not tested
  - Next step: Complete tests and integration

## Important (Medium Priority)
- [ ] **Feature Y** - Discussed architecture, no implementation
  - Status: Design phase
  - Next step: Create implementation plan

## Nice to Have (Low Priority)
- [ ] **Feature Z** - Brief mention, not explored
  - Status: Idea only
  - Next step: Evaluate if still relevant

## Recently Mentioned
- [ ] **Feature A** - Mentioned in last 5 messages
  - Status: Fresh idea
  - Next step: Decide priority
```

## Usage

### When to Run /dropped-threads

- **Before /end-session** - Capture all unfinished work
- **After complex discussions** - When multiple features were discussed
- **Weekly reviews** - Check accumulation of dropped threads
- **Before starting new features** - Avoid context switching

### Integration with Other Commands

- **/start-session** - Reviews previous dropped threads
- **/end-session** - Updates dropped threads status
- **/humanify** - Includes dropped threads in learning insights

## Storage

- **File**: `.max/dropped-threads.md`
- **Format**: Markdown with checkboxes for tracking
- **Versioning**: New sessions append, don't overwrite
- **Git**: Include in version control for team visibility

## Automation Features

### Smart Detection
- Tracks code snippets without completion
- Identifies "TODO" mentions in chat
- Detects architecture discussions without follow-up
- Recognizes priority language ("critical", "important", "later")

### Status Tracking
- **New** - Just identified
- **In Progress** - Being worked on
- **Blocked** - Waiting on something
- **Completed** - Done (moves to completed section)
- **Archived** - No longer relevant

### Priority Assignment
- **Critical** - Production issues, security, blockers
- **Important** - Core features, user-facing
- **Low** - Nice-to-have, optimizations

## Prevention Strategies

### During Development
- **Finish before switching** - Complete one feature before starting another
- **Explicit parking** - "Parking this for now, will return at X"
- **Mini-milestones** - Break features into completable chunks

### In Chat
- **Clear transitions** - "Done with X, moving to Y"
- **Status updates** - "Feature X is now complete"
- **Backlog management** - "Adding to dropped threads"

## Team Collaboration

### Shared Visibility
- Team members can see what's dropped
- Avoid duplicate work on same features
- Coordinate who picks up dropped threads

### Handoff Protocol
- Clear documentation of state
- Next steps defined
- Dependencies noted

## Analytics

### Metrics to Track
- **Drop rate** - Features started vs completed
- **Average drop time** - How long features stay dropped
- **Category patterns** - Which types get dropped most
- **Resolution rate** - How many get picked up later

### Improvement Insights
- Identify why features get dropped
- Optimize task sizing
- Improve estimation accuracy
- Better priority management

## Philosophy

/dropped-threads helps maintain development momentum by ensuring good ideas don't get lost. It's not about guilt - it's about visibility and intentional decision-making. Every dropped thread is either:
1. **Worth completing** - Schedule it
2. **Worth parking** - Document and revisit later
3. **Worth abandoning** - Explicitly decide and move on

No more "we talked about that once but never did it."
