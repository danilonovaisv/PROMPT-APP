---
description: Feature Request System - Track and annotate feature requests with granular command aliases
---

# Feature Request Workflow

The Feature Request system provides comprehensive tracking and annotation capabilities for feature requests with granular command aliases and automatic code/shell script annotation.

## Usage

### Granular Command Aliases

The system supports multiple levels of command granularity:

```bash
# Full form
max:feature-request create "Add new feature" "Description here" --priority high

# Short form
max:fr list --status open

# Minimal form
m:fr show FR-20250220-001

# Legacy forms
feature-request update FR-20250220-001 --status in_progress
fr create "Quick feature" "Simple description"
```

### Basic Operations

#### Create Feature Request
```bash
# Basic creation
max:feature-request create "Add dark mode" "Implement dark theme for UI" --priority high

# With tags
max:fr create "API endpoints" "Add REST API for user management" --tags api,backend --priority medium

# From file
m:fr create "Complex feature" --file feature_description.md --priority critical
```

#### List and Filter
```bash
# List all requests
max:feature-request list

# Filter by status
max:fr list --status open

# Filter by priority
feature-request list --priority high

# Combined filters
m:fr list --status open --priority high
```

#### View Details
```bash
# Show specific request
max:feature-request show FR-20250220-001

# Short form
m:fr show FR-20250220-001
```

#### Update Requests
```bash
# Update status
max:fr update FR-20250220-001 --status in_progress

# Update priority
feature-request update FR-20250220-001 --priority critical

# Both status and priority
m:fr update FR-20250220-001 --status completed --priority low
```

#### Delete Requests
```bash
# Delete a request
max:feature-request delete FR-20250220-001
```

## Annotation Features

### Automatic Code Block Annotation

The system automatically detects and annotates code blocks in feature request descriptions:

#### Python Code Annotation
```python
def process_data(data):
    # 📝 Function: process_data - defines reusable logic
    for item in data:
        # 📝 Loop - iterates over sequence
        if item.is_valid():
            # 📝 Conditional logic - controls program flow
            yield transform(item)
```

#### Shell Command Annotation
```bash
cd /Users/ethandellaposta/Documents/git/MAx
# 📋 Navigate to directory: /Users/ethandellaposta/Documents/git/MAx
git log --oneline --since="2 weeks ago"
# 📋 Git operation: log
&& git show --name-only HEAD
# 📋 Chain command - execute if previous succeeds
```

#### Mixed Content Annotation
The system handles mixed content with multiple annotation types:

```
Based on my analysis, I can see that the workflow needs updates.

Command cd, git
cd /Users/ethandellaposta/Documents/git/MAx && git log --oneline
# 📋 Navigate to directory: /Users/ethandellaposta/Documents/git/MAx
# 📋 Chain command - execute if previous succeeds
# 📋 Git operation: log

```python
# 📝 Import: specific module import - targeted functionality
from feature_request import FeatureRequestSystem

def main():
    # 📝 Function: main - defines reusable logic
    system = FeatureRequestSystem()
    # 📝 Import: FeatureRequestSystem - brings in external functionality
```

## Command Reference

### Actions

| Action | Description | Example |
|--------|-------------|---------|
| `create` | Create new feature request | `max:fr create "Title" "Description"` |
| `list` | List feature requests | `max:fr list --status open` |
| `show` | Show specific request | `max:fr show FR-20250220-001` |
| `update` | Update request status/priority | `max:fr update FR-001 --status in_progress` |
| `delete` | Delete a request | `max:fr delete FR-20250220-001` |

### Options

| Option | Description | Values |
|--------|-------------|--------|
| `--title` | Request title | String |
| `--description` | Request description | String |
| `--priority` | Priority level | low, medium, high, critical |
| `--status` | Status filter | open, in_progress, completed, rejected |
| `--tags` | Categorization tags | List of strings |
| `--file` | Read description from file | File path |

### Alias Hierarchy

```
max:feature-request  (Full form - most explicit)
     ↓
max:fr              (Short form - balanced)
     ↓
m:fr                (Minimal form - quickest)
     ↓
feature-request     (Legacy form - compatible)
     ↓
fr                  (Shortest form - minimal)
```

## Annotation Patterns

### Code Block Detection

The system detects:

1. **Markdown code blocks** with language specification
2. **Shell command blocks** with command prefixes
3. **Mixed content** with multiple annotation types

### Annotation Types

| Type | Trigger | Example |
|------|---------|---------|
| Function definition | `def ` or `class ` | `# 📝 Function: name - defines reusable logic` |
| Import statements | `import ` or `from ` | `# 📝 Import: module - brings in external functionality` |
| Control structures | `if `, `for `, `while ` | `# 📝 Conditional logic - controls program flow` |
| Shell commands | `cd `, `git `, `ls ` | `# 📋 Navigate to directory: path` |
| Command chaining | `&&`, `||`, `|` | `# 📋 Chain command - execute if previous succeeds` |

### Annotation Logic

The annotation system:

1. **Detects blocks** using regex patterns
2. **Analyzes content** for specific patterns
3. **Adds contextual annotations** after relevant lines
4. **Preserves original code** while adding insights
5. **Handles multiple languages** (Python, Bash, JavaScript, etc.)

## Integration

### With Git Hooks

Add to pre-commit hooks for feature request validation:

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: feature-request-check
        name: Feature Request Validation
        entry: python3 .max/feature_request.py list
        language: system
```

### With IDE

The command aliases work directly in IDE command palette:

- `max:feature-request` - Full feature request operations
- `max:fr` - Quick feature request actions
- `m:fr` - Rapid feature request management

### With CI/CD

Integrate with GitHub Actions:

```yaml
# .github/workflows/feature-requests.yml
name: Feature Request Check
on: [pull_request]
jobs:
  check-requests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: List open feature requests
        run: python3 .max/feature_request.py list --status open
```

## Data Storage

Feature requests are stored in `.max/feature_requests.json` with the following structure:

```json
[
  {
    "id": "FR-20250220-001",
    "title": "Feature title",
    "description": "Detailed description with code blocks",
    "priority": "high",
    "status": "open",
    "created_at": "2025-02-20T12:00:00",
    "updated_at": "2025-02-20T12:00:00",
    "annotations": ["Found code_block at lines 5-10"],
    "code_blocks": [
      {
        "type": "code_block",
        "language": "python",
        "original": "def example():\n    pass",
        "annotated": "def example():\n    # 📝 Function: example - defines reusable logic\n    pass",
        "line_start": 5,
        "line_end": 6
      }
    ],
    "tags": ["enhancement", "ui"]
  }
]
```

## Best Practices

### 1. Use Granular Aliases

- **Full form** for documentation and scripts: `max:feature-request`
- **Short form** for daily use: `max:fr`
- **Minimal form** for quick operations: `m:fr`

### 2. Write Annotatable Descriptions

Include code blocks and commands in descriptions:

```markdown
Need to implement the following:

```python
def new_feature():
    # Implementation here
    pass
```

Shell commands for testing:
```bash
cd project && python test_new_feature.py
```

### 3. Use Tags Effectively

Categorize requests for better organization:

```bash
max:fr create "API feature" "Description" --tags api,backend,high-priority
```

### 4. Regular Status Updates

Keep requests current:

```bash
m:fr update FR-001 --status in_progress
# Work on feature...
m:fr update FR-001 --status completed
```

## Examples

### Complete Workflow

```bash
# Create feature request with detailed description
max:feature-request create "Add user authentication" """
Implement OAuth2 authentication with the following:

```python
# 📝 Import: specific module import - targeted functionality
from authlib.integrations.flask_client import OAuth

def setup_oauth(app):
    # 📝 Function: setup_oauth - defines reusable logic
    oauth = OAuth(app)
    # Configure OAuth providers...
```

Shell commands for setup:
```bash
# 📋 Navigate to directory: /project
cd /project
# 📋 Git operation: checkout
git checkout -b feature/auth
# 📋 Chain command - execute if previous succeeds
&& pip install authlib
```
""" --priority high --tags security,authentication

# List high priority open requests
max:fr list --status open --priority high

# Update status when starting work
m:fr update FR-20250220-001 --status in_progress

# Mark as completed when done
feature-request update FR-20250220-001 --status completed
```

### Quick Operations

```bash
# Quick status check
m:fr list

# Fast feature creation
fr create "Quick fix" "Minor bug fix" --priority low

# Rapid status update
m:fr update FR-001 --status completed
```

---

**🚀 The Feature Request system provides comprehensive tracking with intelligent annotation and granular command control!**
