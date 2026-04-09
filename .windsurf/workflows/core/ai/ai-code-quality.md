# /ai-code-quality - AI-Powered Code Quality & Test Generation

This workflow analyzes code and automatically generates unit tests for new features, ensuring code quality standards are met.

## What /ai-code-quality Does

1. **Analyzes Code** - Identifies functions, classes, and modules
2. **Generates Tests** - Creates unit tests automatically
3. **Estimates Coverage** - Predicts test coverage percentage
4. **Runs Tests** - Executes generated tests
5. **Quality Report** - Provides comprehensive quality metrics

## Usage

### Analyze a File
```
/ai-code-quality analyze --file path/to/file.py
```

### Generate Tests for a File
```
/ai-code-quality generate --file path/to/file.py
```

### Run Generated Tests
```
/ai-code-quality test --test-file path/to/test_file.py
```

### Get Quality Report
```
/ai-code-quality report
```

## Output Format

### Analysis Results
```json
{
  "file": "path/to/file.py",
  "features_found": 3,
  "tests_generated": 3,
  "estimated_coverage": 75.0,
  "features": [
    {
      "name": "function_name",
      "type": "function",
      "complexity": "Medium",
      "test_file": "tests/file_test.py"
    }
  ]
}
```

### Quality Report
```json
{
  "timestamp": "2026-02-20 14:30",
  "project_root": "/path/to/project",
  "code_quality": {
    "python_files": 25,
    "features_identified": 120,
    "test_files": 18,
    "test_coverage_ratio": 0.72
  },
  "recommendations": [
    "Generate 7 test files",
    "Improve test coverage to at least 80%"
  ]
}
```

## Features Detected

### Functions
- **Name**: Function identifier
- **Dependencies**: Imported modules and functions
- **Complexity**: Simple, Medium, or Complex
- **Test Requirements**: Mocking, fixtures, etc.

### Classes
- **Name**: Class identifier
- **Methods**: List of methods found
- **Inheritance**: Base classes
- **Test Requirements**: Constructor testing, etc.

### Modules
- **Name**: Module identifier
- **Imports**: List of imports
- **Dependencies**: Required modules

## Test Generation

### Function Tests
```python
def test_function_name(self):
    """Test function_name"""
    import module_name

    # TODO: Implement test cases for function_name
    # Expected behavior: Medium complexity
    # Dependencies: os, json

    # Example test case:
    # result = module.function_name()
    # self.assertIsNotNone(result)
```

### Class Tests
```python
class TestClassName(unittest.TestCase):
    """Test ClassName class"""
    import unittest
    import module_name

    def setUp(self):
        """Set up test fixtures"""
        # TODO: Initialize test fixtures
        pass

    def test_ClassName_init(self):
        """Test ClassName initialization"""
        # TODO: Test constructor
        pass
```

### Module Tests
```python
def test_module_name_imports(self):
    """Test module_name module imports"""
    import unittest

    # TODO: Test module imports
    try:
        import module_name
        self.assertTrue(True, "module_name imported successfully")
    except ImportError as e:
        self.fail(f"Failed to import module_name: {e}")
```

## Integration with Development Workflow

### Before Commit
```
/ai-code-quality generate --file new_feature.py
/ai-code-quality test --test-file tests/new_feature_test.py
```

### During Development
- Run analysis after adding new functions
- Generate tests for new classes
- Check quality report weekly

### Code Review
- Ensure all new features have tests
- Verify coverage meets standards
- Check quality metrics

## Test Coverage Estimation

The system estimates coverage based on:

- **Feature Complexity**
  - Simple: 80% coverage
  - Medium: 60% coverage
  - Complex: 40% coverage

- **Test Requirements**
  - +10% per requirement (mocking, fixtures, etc.)

- **Maximum**: 95% coverage

## Quality Standards

### Code Quality Metrics
- **Test Coverage**: Minimum 80%
- **Test Files**: One per source file
- **Feature Coverage**: All features tested

### Generated Test Quality
- **Structure**: Follows unittest conventions
- **Documentation**: Clear docstrings
- **Fixtures**: Proper setup/teardown
- **Assertions**: Meaningful test cases

## Advanced Features

### Custom Test Templates
The system uses templates for different feature types:
- Function template
- Class template
- Method template
- Module template

### Dependency Analysis
- Identifies imported modules
- Detects external dependencies
- Suggests mocking requirements

### Coverage Prediction
- Estimates test coverage
- Identifies untested code paths
- Recommends additional tests

## Examples

### Example 1: Simple Function
```python
# Code
def add_numbers(a, b):
    return a + b

# Generated Test
def test_add_numbers(self):
    """Test add_numbers"""
    import module

    # TODO: Implement test cases for add_numbers
    # Expected behavior: Simple complexity
    # Dependencies: None

    # Example test case:
    # result = module.add_numbers(2, 3)
    # self.assertEqual(result, 5)
```

### Example 2: Complex Class
```python
# Code
class DataProcessor:
    def __init__(self, config):
        self.config = config

    def process(self, data):
        return self.transform(data)

    def transform(self, data):
        return data.upper()

# Generated Test
class TestDataProcessor(unittest.TestCase):
    """Test DataProcessor class"""
    import unittest
    import module

    def setUp(self):
        """Set up test fixtures"""
        # TODO: Initialize test fixtures
        pass

    def test_DataProcessor_init(self):
        """Test DataProcessor initialization"""
        # TODO: Test constructor
        pass

    def test_DataProcessor_methods(self):
        """Test DataProcessor methods"""
        # TODO: Test class methods
        pass
```

## Best Practices

### When to Use
- **New Features**: Generate tests immediately
- **Refactoring**: Update tests accordingly
- **Code Review**: Verify test coverage
- **Quality Gates**: Enforce coverage standards

### Test Maintenance
- Review generated tests
- Add specific test cases
- Update tests when code changes
- Run tests regularly

### Coverage Goals
- **New Code**: 90%+ coverage
- **Existing Code**: 80%+ coverage
- **Critical Path**: 95%+ coverage

## Configuration

### Test Directory Structure
```
project/
├── src/
│   ├── module1.py
│   └── module2.py
└── tests/
    ├── module1_test.py
    └── module2_test.py
```

### Customization
- Modify templates in `ai_code_quality.py`
- Add custom test patterns
- Configure coverage thresholds

## Philosophy

The AI Code Quality system ensures:
- **No untested code** - Automatic test generation
- **Quality standards** - Consistent test structure
- **Coverage tracking** - Monitor test coverage
- **Developer productivity** - Reduce manual test writing

This helps maintain high code quality while reducing the burden of writing tests manually.

## Troubleshooting

### Common Issues
1. **Syntax Errors**: Fix code before analysis
2. **Missing Imports**: Add required imports
3. **Test Failures**: Review generated tests
4. **Low Coverage**: Add more test cases

### Error Messages
- "Syntax error in file": Fix Python syntax
- "Could not read file": Check file permissions
- "Test execution timed out": Optimize tests

## Future Enhancements

- **Smart Test Generation**: AI-powered test logic
- **Regression Detection**: Identify breaking changes
- **Performance Testing**: Generate performance tests
- **Integration Tests**: Generate integration test suites
