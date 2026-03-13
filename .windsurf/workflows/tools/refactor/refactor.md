---
description: Comprehensive refactoring system with robust regression testing
---

# Refactor System Workflow

This workflow provides comprehensive code refactoring with robust regression testing to ensure code quality and prevent regressions. It's like having a senior developer who can safely refactor code while maintaining functionality! 🔄

## Usage

### Basic Commands
```bash
# Analyze code for refactoring opportunities
/refactor
# or
/r

# Analyze specific files
/refactor --files src/main.py utils.py

# Only run regression tests
/refactor --tests-only

# Only analyze, don't refactor
/refactor --analyze-only

# Auto-apply safe refactoring operations
/refactor --auto-apply

# Set confidence threshold
/refactor --confidence 0.8
```

### Command Line Interface
```bash
# Direct Python execution
python3 .max/refactor_system.py

# With options
python3 .max/refactor_system.py --files src/main.py --auto-apply --confidence 0.7
```

## Refactoring Types

### 🔧 Function-Level Refactoring
- **Extract Function**: Break down long functions into smaller ones
- **Extract Variable**: Pull out repeated expressions into variables
- **Rename Variable**: Improve variable naming for clarity
- **Rename Function**: Better function names for readability
- **Inline Variable**: Remove unnecessary variables
- **Inline Function**: Replace simple function calls with direct code

### 🏗️ Structure-Level Refactoring
- **Move Code**: Reorganize code structure
- **Simplify Conditional**: Reduce complex conditional logic
- **Introduce Parameter**: Add parameters for flexibility
- **Remove Parameter**: Remove unnecessary parameters

## Regression Testing

### 🧪 Test Types
1. **Unit Tests**: Test individual functions and methods
2. **Integration Tests**: Test module interactions
3. **Behavioral Tests**: Test overall behavior preservation
4. **Performance Tests**: Ensure performance isn't degraded

### 🛡️ Safety Features
- **Automatic Backup**: Creates backup before refactoring
- **Pre-Test Validation**: Runs tests before refactoring
- **Post-Test Verification**: Runs tests after refactoring
- **Rollback Capability**: Automatically restores if tests fail
- **Confidence Scoring**: Only applies high-confidence changes

## Example Workflow

### 1. Analysis Phase
```bash
$ /refactor --analyze-only

🔍 Analyzing code for refactoring opportunities...

🎯 Found 8 refactoring opportunities:

1. 🔥 extract_function
   📁 src/analyzer.py:45
   📝 Function 'process_data' is too long and should be broken down
   🎯 Confidence: 0.8 🟡 Risk: medium
   💭 Current: def process_data(data, config, options):...

2. ⚡ rename_variable
   📁 utils/helpers.py:23
   📝 Generic variable name
   🎯 Confidence: 0.6 🟢 Risk: low
   💭 Current: data = get_user_info()
```

### 2. Regression Testing Phase
```bash
🧪 Generating regression tests...
📋 Generated 42 regression tests
🏃 Running regression tests...

✅ test_main_imports (0.12s)
✅ test_analyzer_instantiation (0.08s)
✅ test_process_data_behavior (0.15s)
❌ test_helper_function (0.09s)

📊 Test Results:
   ✅ Passed: 40
   ❌ Failed: 2
   💥 Errors: 0
   ⏰ Timeouts: 0

⚠️  2 tests failed - review before refactoring!
```

### 3. Safe Refactoring Phase
```bash
🛡️  Starting safe refactoring process...
💾 Creating backup...
   Backup created: stash_1708421234

🧪 Running pre-refactor regression tests...
📋 Generated 42 regression tests
📊 Test Results: 40 passed, 2 failed

🎯 Applying 6 safe refactoring operations...
Apply extract_function to src/analyzer.py:45? (y/N): y
   ✅ Applied: Function 'process_data' is too long and should be broken down
Apply rename_variable to utils/helpers.py:23? (y/N): y
   ✅ Applied: Generic variable name

🧪 Running post-refactor regression tests...
📊 Test Results: 42 passed, 0 failed

✅ Refactoring successful - tests maintained or improved
🎉 Refactoring completed successfully!
```

## Refactoring Patterns Detected

### 📏 Code Quality Issues
```python
# ❌ Long function detected
def process_data(data, config, options):
    # 50+ lines of complex logic
    for item in data:
        # nested logic
        if condition:
            # more nested logic
            pass

# ✅ Suggested refactor
def process_data(data, config, options):
    cleaned_data = clean_input_data(data)
    processed_items = process_items(cleaned_data, config)
    return format_results(processed_items, options)
```

### 🏷️ Naming Issues
```python
# ❌ Generic variable names
data = get_user_info()
temp = calculate_result()
obj = create_instance()

# ✅ Descriptive names
user_profile = get_user_info()
calculation_result = calculate_result()
user_instance = create_instance()
```

### 🔀 Logic Issues
```python
# ❌ Redundant nested condition
if condition:
    if condition:
        do_something()

# ✅ Simplified
if condition:
    do_something()
```

### 📐 Structure Issues
```python
# ❌ Too many parameters
def create_user(name, email, age, address, phone, role, department, salary):
    pass

# ✅ Parameter object
def create_user(user_config):
    pass
```

## Regression Test Generation

### 🧪 Automatic Test Creation
The system automatically generates tests for:

1. **Function Behavior**: Tests that functions work the same way
2. **Class Instantiation**: Ensures classes can still be created
3. **Module Imports**: Verifies modules import correctly
4. **API Contracts**: Maintains public API compatibility

### 📝 Test Templates
```python
# Generated test example
def test_process_data_behavior():
    # Setup
    from src.analyzer import process_data
    
    # Execution
    result = process_data(sample_data, config, options)
    
    # Assertions
    assert result is not None
    assert isinstance(result, dict)
    # Add specific assertions based on function behavior
```

## Safety Mechanisms

### 🛡️ Multi-Layer Protection
1. **Backup Creation**: Git stash or file backup
2. **Pre-Test Validation**: Ensure tests pass before refactoring
3. **Confidence Filtering**: Only apply high-confidence changes
4. **Risk Assessment**: Avoid high-risk operations
5. **Post-Test Verification**: Confirm functionality preserved
6. **Automatic Rollback**: Restore if tests fail

### 📊 Confidence Scoring
- **0.8-1.0 (🔥 High)**: Safe to apply automatically
- **0.6-0.8 (⚡ Medium)**: Apply with confirmation
- **0.0-0.6 (💡 Low)**: Manual review required

### 🎯 Risk Levels
- **🟢 Low**: Simple renames, formatting changes
- **🟡 Medium**: Function extraction, logic changes
- **🔴 High**: API changes, major restructuring

## Integration with Quality Gate

### 🔗 Quality Gate Integration
The refactor system integrates with the MAx quality gate:

```bash
# Run as part of quality gate
/max-quality --include-refactor

# Custom quality gate with refactor
/max-quality --custom-checks refactor,annoying-mode,lint
```

### 📋 Quality Gate Checklist
- [ ] Standard linting passes
- [ ] PR Annoying Mode passes
- [ ] Regression tests pass
- [ ] Refactoring safety checks pass
- [ ] Performance benchmarks maintained

## Advanced Usage

### 🎯 Targeted Refactoring
```bash
# Refactor specific files
/refactor --files src/main.py utils/helpers.py

# High confidence only
/refactor --confidence 0.9

# Auto-apply safe changes
/refactor --auto-apply --confidence 0.8
```

### 📊 Custom Patterns
Add custom refactoring patterns:

```python
# In refactor_system.py
self.patterns[RefactorType.CUSTOM] = [
    (r'pattern_here', "Description of issue"),
]
```

### 🔄 Continuous Refactoring
Set up automated refactoring:

```yaml
# .github/workflows/refactor.yml
name: Auto Refactor
on: [push]
jobs:
  refactor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run safe refactoring
        run: python3 .max/refactor_system.py --auto-apply --confidence 0.9
```

## Best Practices

### 1. Before Refactoring
```bash
# Ensure clean state
git status

# Run full test suite
/refactor --tests-only

# Analyze opportunities
/refactor --analyze-only
```

### 2. During Refactoring
```bash
# Start with high confidence
/refactor --confidence 0.9

# Review suggested changes
# Confirm each operation manually

# Monitor test results
```

### 3. After Refactoring
```bash
# Verify all tests pass
/refactor --tests-only

# Run quality gate
/max-quality

# Review changes
git diff
```

## Troubleshooting

### ❌ Common Issues

#### Tests Failing After Refactor
```bash
# Check what changed
git diff

# Run specific failing tests
python3 -m pytest tests/test_failing.py

# Restore backup if needed
git stash pop
```

#### Too Many False Positives
```bash
# Increase confidence threshold
/refactor --confidence 0.8

# Focus on specific files
/refactor --files src/problematic.py
```

#### Performance Degradation
```bash
# Run performance tests
/refactor --tests-only --performance

# Check for inefficient refactoring
git diff
```

### 🔧 Debug Mode
```bash
# Enable verbose output
/refactor --verbose

# Keep temporary files
/refactor --debug

# Dry run mode
/refactor --dry-run
```

## Configuration

### ⚙️ System Configuration
```python
# In .max/max-config.json
{
  "refactor": {
    "enabled": true,
    "confidence_threshold": 0.7,
    "auto_apply_safe": false,
    "backup_enabled": true,
    "test_timeout": 30,
    "max_operations_per_run": 10
  }
}
```

### 🎯 Custom Rules
```python
# Custom refactoring rules
custom_patterns = {
    "company_specific": [
        (r'old_api_call', "Use new API instead"),
        (r'deprecated_function', "Update to new function"),
    ]
}
```

## Examples in Practice

### Before Refactoring
```python
def process_user_data(data):
    # Process user data
    result = []
    for i in range(len(data)):
        if data[i]['active']:
            temp = data[i]['profile']
            if temp['verified']:
                obj = create_user_object(temp)
                result.append(obj)
    return result
```

### After Refactoring
```python
def process_user_data(user_data):
    """Process and filter active, verified user data."""
    active_users = filter_active_users(user_data)
    verified_users = filter_verified_users(active_users)
    return create_user_objects(verified_users)

def filter_active_users(users):
    """Filter for active users only."""
    return [user for user in users if user['active']]

def filter_verified_users(users):
    """Filter for verified users only."""
    return [user for user in users if user['profile']['verified']]

def create_user_objects(users):
    """Create user objects from user data."""
    return [create_user_object(user['profile']) for user in users]
```

### Regression Test Results
```
📊 Test Results:
   ✅ Passed: 42 (same as before)
   ❌ Failed: 0 (same as before)
   💥 Errors: 0 (same as before)
   ⏰ Timeouts: 0 (same as before)

✅ Refactoring successful - behavior preserved, code improved!
```

## Performance Impact

### 📈 Benefits
- **Maintainability**: Easier to understand and modify
- **Readability**: Cleaner, more descriptive code
- **Testability**: Smaller functions are easier to test
- **Reusability**: Extracted functions can be reused
- **Debugging**: Easier to isolate issues

### ⚡ Performance Considerations
- **Function Call Overhead**: Minimal for most cases
- **Memory Usage**: Slightly increased due to more functions
- **Compilation Time**: Negligible impact
- **Runtime Performance**: Usually unchanged or improved

---

**🔄 The MAx Refactor System makes code improvement safe and systematic!**

Remember: **Good refactoring improves code without changing behavior!** 🛡️
