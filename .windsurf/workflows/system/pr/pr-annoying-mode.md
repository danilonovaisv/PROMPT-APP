---
description: PR Annoying Mode - Aggressive code quality gate for finding annoying issues
---

# PR Annoying Mode Workflow

This workflow activates an extremely picky code reviewer that finds annoying quality issues that standard linters miss. It's like having a senior developer who's passionate about code quality review your PR! 😤

## Usage

### Basic Usage
```bash
# Run annoying mode on entire repository
/pr-annoying-mode

# Run on specific files
/pr-annoying-mode --files file1.py file2.py

# Run and apply automatic fixes
/pr-annoying-mode --fix

# Save feedback to file
/pr-annoying-mode --output annoying-feedback.md
```

### Command Line Interface
```bash
# Direct Python execution
python3 .max/pr_annoying_mode.py

# With options
python3 .max/pr_annoying_mode.py --files src/main.py --fix --output feedback.md
```

## What It Finds

### 🔥 Infuriating Issues (Actually Bad)
These are real problems that should be fixed immediately:

- **Security Issues**: `eval()`, `exec()`, `shell=True`, hardcoded passwords
- **Performance Issues**: `range(len())`, string concatenation in loops, missing list comprehensions

### 😤 Frustrating Issues (Hard to Maintain)
These make code difficult to work with:

- **Complex Functions**: Cyclomatic complexity > 15
- **Too Many Parameters**: Functions with > 7 parameters
- **Deep Nesting**: Code nested > 4 levels deep

### 😠 Annoying Issues (Shows Laziness)
These indicate lazy coding practices:

#### Bad Variable Names
```python
# ❌ Annoying
data = get_user_info()
temp = calculate_result()
obj = create_instance()

# ✅ Better
user_data = get_user_info()
calculation_result = calculate_result()
user_instance = create_instance()
```

#### Useless Comments
```python
# ❌ Annoying
# Get the user data
user_data = get_user()

# TODO: Fix this later
# FIXME: Something is broken
# This function processes the data

# ✅ Better
# User data includes profile and preferences (needed for caching)
user_data = get_user()

# TODO: Refactor to use async when API supports it (deadline: 2024-03-01)
# FIXME: Race condition when multiple requests hit same user ID
```

#### Bad Function Names
```python
# ❌ Annoying
def get_x():
def process_y():
def handle_z():

# ✅ Better
def get_user_profile():
def process_payment_data():
def handle_api_error():
```

#### Magic Numbers
```python
# ❌ Annoying
if timeout > 30:
    retry_count = 3
    max_retries = 5

# ✅ Better
DEFAULT_TIMEOUT_SECONDS = 30
INITIAL_RETRY_COUNT = 3
MAX_RETRY_ATTEMPTS = 5

if timeout > DEFAULT_TIMEOUT_SECONDS:
    retry_count = INITIAL_RETRY_COUNT
    max_retries = MAX_RETRY_ATTEMPTS
```

#### Bad Imports
```python
# ❌ Annoying
from module import *
import os, sys, json

# ✅ Better
from module import specific_function, SpecificClass
import os
import sys
import json
```

#### Questionable Logic
```python
# ❌ Annoying
if True:  # Why?!
if False:  # This never runs!
except:  # Catches everything!
except Exception:  # Too broad!
pass  # Empty block

# ✅ Better
# Remove unnecessary condition
# Remove dead code
except ValueError:
except TypeError:
raise NotImplementedError("TODO: Implement this logic")
```

## Example Output

```
😤 PR ANNOYING MODE FEEDBACK
==================================================
Found 23 annoying issues that standard linters missed:

🔥 INFURIATING ISSUES (These are actually bad):
  ❌ src/security.py:45
     shell=True is dangerous
     Code: subprocess.run(command, shell=True)
     💡 Fix: Use shell=False or validate input

  ❌ src/processor.py:123
     eval() is a security nightmare
     Code: result = eval(user_input)

😤 FRUSTRATING ISSUES (These make code hard to maintain):
  ⚠️  src/analyzer.py:67
     Function 'complex_analysis' has complexity 18 (too complex)
     Code: def complex_analysis(...)

  ⚠️  src/data_handler.py:234
     Code nested 5 levels deep (too deep)
     Code: Nested block

😠 ANNOYING ISSUES (These show laziness):
  🤔 src/utils.py:12
     Use descriptive variable names instead of generic ones
     Code: data = fetch_api_response()
     💡 Fix: Use more descriptive name

  🤔 src/main.py:45
     Single letter variables are too cryptic
     Code: for i in range(len(items)):

  🤔 src/config.py:8
     Magic numbers need constants
     Code: if timeout > 30:
     💡 Fix: Define constant: CONSTANT_30 = 30

📊 SUMMARY:
  Infuriating: 2
  Frustrating: 5
  Annoying: 16

💡 REMEMBER:
  - Good code is readable code
  - Be explicit, not clever
  - Your future self will thank you
  - Code is read more than it's written
```

## Auto-Fixes

PR Annoying Mode can automatically fix some issues:

### ✅ Auto-Fixable Issues
- **Bad Imports**: Split multiple imports, remove wildcard imports
- **Questionable Logic**: Add specific exception types, comment dead code
- **Magic Numbers**: Suggest constant definitions (manual implementation)

### ❌ Manual Fixes Required
- **Naming Issues**: Need human judgment for good names
- **Complexity Issues**: Require refactoring
- **Comment Issues**: Need meaningful content
- **Security Issues**: Require careful review

## Integration with Git Hooks

Add to your pre-commit hooks for maximum annoyance:

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: pr-annoying-mode
        name: PR Annoying Mode
        entry: python3 .max/pr_annoying_mode.py
        language: system
        args: [--files]
        pass_filenames: true
```

## Configuration

You can customize the annoying patterns by editing the `pr_annoying_mode.py` file:

```python
# Add your own annoying patterns
self.annoying_patterns["my_pet_peeves"] = [
    (r'print\(', "Use logging instead of print statements"),
    (r'len\(.*\) > 0', "Use if variable: instead of len(variable) > 0"),
    (r'variable == True', "Use if variable: instead of if variable == True"),
]
```

## Best Practices

### 1. Use in Development
Run PR Annoying Mode before committing:
```bash
python3 .max/pr_annoying_mode.py --fix
```

### 2. Use in Code Review
Add it to your PR checklist:
- [ ] Standard linting passes
- [ ] Tests pass
- [ ] PR Annoying Mode passes
- [ ] Manual review

### 3. Team Configuration
Customize patterns for your team's standards:
- Add project-specific naming conventions
- Include domain-specific magic numbers
- Set appropriate complexity thresholds

### 4. Gradual Adoption
Start with the most critical issues:
```bash
# Focus on infuriating issues first
python3 .max/pr_annoying_mode.py --files $(git diff --name-only HEAD~1)
```

## Why This is Useful

### 1. Catches What Linters Miss
Standard linters focus on syntax and style. PR Annoying Mode focuses on:
- **Code readability**
- **Maintainability**
- **Best practices**
- **Common anti-patterns**

### 2. Educational Value
Great for:
- **Junior developers**: Learn best practices
- **Code reviews**: Consistent quality standards
- **Onboarding**: Team coding standards

### 3. Prevents Technical Debt
Catches issues early before they become:
- **Hard to maintain**
- **Confusing to understand**
- **Expensive to refactor**

### 4. Team Alignment
Ensures everyone follows the same:
- **Naming conventions**
- **Coding patterns**
- **Quality standards**

## Advanced Usage

### Custom Severity Levels
```python
# Add your own severity levels
severity_order = {
    "infuriating": 0,  # Security/performance critical
    "frustrating": 1,  # Maintainability issues
    "annoying": 2,     # Style/laziness issues
    "pedantic": 3,     # Extremely picky (optional)
}
```

### Integration with CI/CD
```yaml
# .github/workflows/annoying-check.yml
name: PR Annoying Mode Check
on: [pull_request]
jobs:
  annoying-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run PR Annoying Mode
        run: python3 .max/pr_annoying_mode.py --output annoying-report.md
      - name: Upload report
        uses: actions/upload-artifact@v2
        with:
          name: annoying-report
          path: annoying-report.md
```

### Team-Specific Rules
```python
# Add team-specific patterns
def add_team_patterns(self):
    if self.team == "security":
        self.infuriating_patterns["security"].extend([
            (r'password.*=.*["\'][^"\']+["\']', "Hardcoded passwords detected"),
            (r'api_key.*=.*["\'][^"\']+["\']', "Hardcoded API keys detected"),
        ])
    elif self.team == "performance":
        self.annoying_patterns["performance"].extend([
            (r'for .* in range\(len\(', "Use enumerate for better performance"),
            (r'\.append\(.*\)\s*for .* in', "Use list comprehension"),
        ])
```

## Troubleshooting

### False Positives
If you get false positives:
1. **Customize patterns**: Remove or modify problematic patterns
2. **Add exceptions**: Whitelist specific files or patterns
3. **Adjust thresholds**: Change complexity or nesting limits

### Performance Issues
For large repositories:
1. **Limit scope**: Use `--files` to check only changed files
2. **Parallel processing**: Run on multiple files simultaneously
3. **Cache results**: Cache AST parsing results

### Team Adoption
If team resists:
1. **Start small**: Begin with most critical issues
2. **Explain benefits**: Show how it prevents technical debt
3. **Customize**: Adapt to team's coding style
4. **Gradual rollout**: Introduce incrementally

## Examples in Practice

### Before PR Annoying Mode
```python
def process_data(data):
    # Process the data
    result = []
    for i in range(len(data)):
        if data[i] > 0:
            temp = data[i] * 2
            result.append(temp)
    return result
```

### After PR Annoying Mode Feedback
```
😠 ANNOYING ISSUES:
  🤔 process_data.py:2 - Obvious comments are annoying
  🤔 process_data.py:4 - Single letter variables are too cryptic
  🤔 process_data.py:4 - Use enumerate instead of range(len())
  🤔 process_data.py:5 - Generic variable names instead of descriptive ones
```

### Improved Code
```python
def transform_positive_values(data):
    """Transform positive values by doubling them."""
    transformed_values = []
    for index, value in enumerate(data):
        if value > 0:
            doubled_value = value * 2
            transformed_values.append(doubled_value)
    return transformed_values
```

---

**🎯 PR Annoying Mode makes your code reviews more thorough and your codebase more maintainable!**

Remember: **Good code is read more than it's written.** Make it count! 😤
