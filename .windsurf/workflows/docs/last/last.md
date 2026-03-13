---
description: Unified review and analysis commands
---

# /last - Review & Analysis

Review and analyze previous AI responses with unified commands.

## Usage

```bash
# Review last response for issues
/last review

# Harsh critique of last response
/last critique

# Summarize last response
/last summarize

# Check what's hard to undo
/last risk

# Show git diff of changes
/last changes

# Check model cost justification
/last cost

# Variable depth examples
/last-3 review
/last-5 summarize
```

## Commands

### /last review
Scan last response for suspicious assumptions and missed edge cases.

### /last critique
Harsh but fair critique of the last response.

### /last summarize
Compress last response to 3 bullet points.

### /last risk
Flag what's hard to reverse (🔴🟡🟢).

### /last changes
Show git diff of what actually changed.

### /last cost
Evaluate if the model tier was justified.

### Variable Depth
Add a number after `/last` to analyze multiple responses:
- `/last-3 review` - Review last 3 responses
- `/last-5 summarize` - Summarize last 5 responses

This replaces the old `/sus`, `/roast`, `/tldr`, `/risk`, `/diff`, and `/cost` commands.
