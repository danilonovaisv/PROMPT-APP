---
description: MAx Framework coding standards contract enforcement
---

# /standards - Coding Standards Contract

Enforces MAx Framework coding standards for file size limits and code organization.

## Usage

```bash
# Check all files against coding standards
/standards check

# Check specific directory
/standards check .max/core

# Check specific file
/standards check .max/command_executor.py

# Generate refactoring plan
/standards plan

# Apply automatic refactoring (safe operations only)
/standards refactor --auto

# Show standards summary
/standards summary
```

## Coding Standards Contract

### 📏 File Size Limits
- **Maximum file length**: 100 lines
- **Maximum function length**: 30 lines
- **Maximum class length**: 80 lines
- **Maximum nesting depth**: 4 levels

### 🎯 Code Organization Principles
- **Single responsibility**: Each file has one clear purpose
- **Strong cohesion**: Related functionality grouped together
- **Polymorphic design**: Use abstract base classes and interfaces
- **Small functions**: Break down complex logic into simple functions

### 🏗️ Architectural Guidelines
- **Modular design**: Split large files into cohesive modules
- **Interface segregation**: Create focused, minimal interfaces
- **Dependency inversion**: Depend on abstractions, not implementations
- **Open/closed principle**: Open for extension, closed for modification

## Violation Types

### 🚨 Errors (Must Fix)
- **Large files**: Files exceeding 100 lines
- **Long functions**: Functions exceeding 30 lines
- **Large classes**: Classes exceeding 80 lines

### ⚠️ Warnings (Should Fix)
- **Deep nesting**: Nesting depth exceeding 4 levels
- **Missing polymorphism**: Classes lacking polymorphic design
- **Low cohesion**: Unrelated code mixed in same module

## Refactoring Strategies

### 📁 File Splitting
```python
# ❌ Large file (command_executor.py - 500+ lines)
class CommandExecutor:
    def execute(self): # 50 lines
    def execute_feature_request(self): # 40 lines
    def execute_ai_code_quality(self): # 35 lines
    # ... many more methods

# ✅ Split into cohesive modules
# command_executor.py (25 lines)
class CommandExecutor:
    def execute(self):
        return CommandRouter().route(command)

# command_router.py (30 lines)
class CommandRouter:
    def route(self, command):
        return CommandFactory().create(command)

# feature_request_handler.py (35 lines)
class FeatureRequestHandler:
    def handle(self, request):
        # focused implementation
```

### 🔧 Function Extraction
```python
# ❌ Long function (50 lines)
def process_data(data, config, options):
    # 20 lines of validation
    # 15 lines of transformation
    # 10 lines of formatting
    # 5 lines of error handling

# ✅ Small, focused functions
def process_data(data, config, options):
    validated_data = validate_input(data, config)
    transformed_data = transform_data(validated_data, options)
    return format_output(transformed_data)

def validate_input(data, config):
    # 20 lines of validation logic

def transform_data(data, options):
    # 15 lines of transformation logic

def format_output(data):
    # 10 lines of formatting logic
```

### 🏛️ Polymorphic Design
```python
# ❌ Missing polymorphism
class DataProcessor:
    def process_csv(self, data): pass
    def process_json(self, data): pass
    def process_xml(self, data): pass

# ✅ Polymorphic design
class DataProcessor(ABC):
    @abstractmethod
    def process(self, data): pass

class CSVProcessor(DataProcessor):
    def process(self, data): pass

class JSONProcessor(DataProcessor):
    def process(self, data): pass

class XMLProcessor(DataProcessor):
    def process(self, data): pass
```

## Integration with Quality Gate

The coding standards checker integrates with the MAx quality gate system:

```bash
# Run as part of quality gate
/max-quality --include-standards

# Fail build on standards violations
/standards check --strict
```

## Strict Enforcement

### 🔒 Pre-commit Hook
The MAx Framework includes a strict pre-commit hook that enforces coding standards:

```bash
# Enable strict pre-commit enforcement
cp .git/hooks/pre-commit-max .git/hooks/pre-commit

# Now every commit will be checked for violations
git add .
git commit  # Will fail if standards violations exist
```

### 🚨 Blocking Behavior
In strict mode, violations will:
- **Block commits** - Cannot commit with violations
- **Block operations** - Cannot proceed with violations
- **Provide guidance** - Clear fix suggestions
- **Show impact** - Detailed violation reports

### ⚡ Quick Fix Commands
```bash
# Check current violations
/standards check --strict

# Get refactoring plan
/standards plan

# Auto-fix safe violations
/standards refactor --auto

# Manual fix guidance
/standards summary
```

## Enforcement Levels

### 🟢 Non-strict Mode
- Reports violations but allows continuation
- Provides warnings and suggestions
- Suitable for development phase

### 🔴 Strict Mode
- Blocks operations on violations
- Exits with error code
- Enforces compliance before proceeding
- Suitable for production/CI environments

## Automated Enforcement

### Pre-commit Hook
```bash
#!/bin/sh
# .git/hooks/pre-commit
python3 .max/scripts/coding_standards.py .
if [ $? -ne 0 ]; then
    echo "❌ Coding standards violations found!"
    echo "Run '/standards plan' for refactoring suggestions"
    exit 1
fi
```

### CI/CD Integration
```yaml
# .github/workflows/standards.yml
name: Coding Standards
on: [push, pull_request]
jobs:
  standards:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Check coding standards
        run: python3 .max/scripts/coding_standards.py .
```

## Benefits

### 🧠 Mental Model Improvements
- **Easier navigation**: Small files are quick to scan
- **Better understanding**: Single-purpose modules are intuitive
- **Faster onboarding**: New developers grasp structure quickly
- **Reduced cognitive load**: Less code to reason about at once

### 🔧 Maintenance Benefits
- **Easier testing**: Small functions are simple to test
- **Better reusability**: Focused modules can be reused
- **Simpler debugging**: Issues are isolated to small areas
- **Safer refactoring**: Changes have limited scope

### 📈 Quality Improvements
- **Higher cohesion**: Related code stays together
- **Lower coupling**: Modules have minimal dependencies
- **Better extensibility**: Polymorphic design enables growth
- **Cleaner architecture**: Standards enforce good design

This coding standards contract ensures MAx Framework remains maintainable, understandable, and high-quality as it evolves.
