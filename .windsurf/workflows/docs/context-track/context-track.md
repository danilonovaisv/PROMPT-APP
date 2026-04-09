---
description: Accurate context tracking and parsing
---

# /context-track - Accurate Context Monitoring

This workflow provides methods to accurately track context usage instead of guessing percentages.

## The Problem with Guessing

Previous approach: "increment 1-2% per exchange"
- This is estimation, not measurement
- Leads to inaccurate warnings
- Doesn't account for actual token usage

## Accurate Context Methods

### Method 1: IDE Metadata (Preferred)

Many IDEs provide actual token counts:

```bash
# In Windsurf/Cascade
# Check if IDE provides token count in metadata
echo "Tokens: $IDE_TOKEN_COUNT"
```

### Method 2: Context Cache Analysis

Parse `.max/context-cache/` files:

```bash
# Count tokens in cached sessions
find .max/context-cache -name "*.md" -exec wc -c {} + |
awk '{sum += $1} END {print "Estimated tokens:", int(sum * 1.33)}'
```

### Method 3: Manual Parser Script

Use the provided `context-parser.sh`:

```bash
./context-parser.sh
```

## Before/After Context Tracking

To accurately measure response sizes, track context before and after each prompt:

```bash
# Before prompt
BEFORE_TOKENS=$(get_current_context)

# Generate response...

# After prompt
AFTER_TOKENS=$(get_current_context)
DIFF=$((AFTER_TOKENS - BEFORE_TOKENS))
```

### context-diff.sh Script

The `context-diff.sh` script provides:
- Before/after token comparison
- Response size classification (Small/Medium/Large)
- CSV logging of context changes
- Trend analysis of recent prompts

## Implementation in Max

### Updated Rules

Old rule:
```
Context %: Estimate how full... increment 3-4% per exchange
```

New rule:
```
Context %: Parse actual token count from IDE metadata.
Track before and after each prompt to calculate response size.
If not available, calculate from .max/context-cache files
or use IDE-provided token count.
```

### Usage in Responses

Instead of guessing, the scoreboard should:

1. **Track before prompt** - Save initial token count
2. **Generate response** - Create the answer
3. **Track after prompt** - Get new token count
4. **Calculate diff** - Show response size
5. **Update scoreboard** - Display accurate context

Example implementation:
```javascript
// Before response
const before = await getContextTokens();

// Generate response...
const response = await generateAnswer();

// After response
const after = await getContextTokens();
const diff = after - before;

// Update scoreboard
console.log(`📍 Goal: ${goal} | Prompt ${n} | 💳 ${credits} | ~$${cost} | Context: ${after/2000}% (${diff > 3000 ? 'Large' : diff > 1000 ? 'Medium' : 'Small'})`);
```

## Example Implementation

```javascript
// Pseudocode for context parsing
function getContextPercent() {
  // Method 1: IDE API
  if (ideMetadata.tokens) {
    return (ideMetadata.tokens / 200000) * 100;
  }

  // Method 2: Context cache
  const cacheTokens = parseContextCache();
  if (cacheTokens > 0) {
    return (cacheTokens / 200000) * 100;
  }

  // Method 3: Provided count
  if (providedTokenCount) {
    return (providedTokenCount / 200000) * 100;
  }

  // Method 4: Estimate (with disclaimer)
  return estimateFromPromptCount() + " (estimated)";
}
```

## Context Parser Script

The `context-parser.sh` script provides:

1. **IDE API check** - Attempts to read IDE metadata
2. **Cache analysis** - Parses `.max/context-cache/`
3. **Token estimation** - Converts file sizes to token estimates
4. **Fallback methods** - Multiple approaches for accuracy

## Best Practices

1. **Always prefer actual data** over estimation
2. **Clearly label estimates** as such
3. **Update in real-time** as context changes
4. **Cache results** to avoid repeated parsing

## Integration with Commands

### /start-session
- Parse initial context
- Set baseline token count

### /end-session
- Calculate final context usage
- Save to session summary

### Ongoing responses
- Update context each prompt
- Show accurate percentage
- Warn at actual thresholds

## Future Improvements

1. **IDE API integration** - Direct access to token counts
2. **WebSocket updates** - Real-time context tracking
3. **Token compression analysis** - Account for context optimization
4. **Multi-turn context** - Track conversation flow

## Philosophy

"Measure, don't guess" - Accurate context tracking prevents:
- False warnings
- Premature session endings
- Lost context due to miscalculation

The goal is precise tracking, not rough estimation.
