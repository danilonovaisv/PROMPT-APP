# /visualize-task - Task Type Visualization

This workflow analyzes prompts and creates color-coded visualizations of task types, helping users understand what kind of work they're requesting.

## What /visualize-task Does

1. **Analyzes the prompt** - Scans for keywords and patterns
2. **Determines task type** - Categorizes into 10 types with colors
3. **Estimates complexity** - Simple, Medium, or Complex
4. **Recommends model** - Suggests best AI model for the task
5. **Creates visualization** - Color-coded ASCII art representation

## Task Types and Colors

| Type | Color | Emoji | Description |
|-------|--------|-------|-------------|
| CODE | 🔴 Red | 🔴 Creating, building, implementing code |
| DEBUG | 🟢 Teal | 🟢 Fixing errors, troubleshooting |
| DESIGN | 🔵 Blue | 🔵 Architecture, UI/UX, planning |
| ANALYSIS | 🟢 Green | 🟢 Reviewing, examining, understanding |
| REFACTOR | 🟡 Yellow | 🟡 Improving, restructuring code |
| DOC | 🟣 Plum | 🟣 Documentation, guides, explanations |
| TEST | 🔴 Light Red | 🔴 Testing, validation, verification |
| OPTIMIZE | 🟢 Mint | 🟢 Performance, speed, efficiency |
| SETUP | 🟡 Light Yellow | 🟡 Installation, configuration |
| MAINTAIN | 🟣 Medium Purple | 🟣 Updates, maintenance, migration |

## Usage

### Basic Usage
```
/visualize-task "Create a new Python function that validates email addresses"
```

### Complex Task
```
/visualize-task "Debug the authentication system that's failing with JWT tokens and update the error handling"
```

### Design Task
```
/visualize-task "Design a microservices architecture for a real-time chat application with WebSocket support"
```

## Output Format

The visualization includes:

```
🔴 TASK VISUALIZATION
==================================================

CODE Task
Confidence: 95%
Complexity: Simple
Estimated Time: 5-15 min
Recommended Model: SWE-1.5 (for quick tasks)

Keywords Found: create, python, function

==================================================
#FF6B6B■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■#FF6B6B
==================================================

Task Breakdown:
┌─ Prompt Analysis
│  ├─ Type: CODE
│  ├─ Keywords: 3 matches
│  └─ Confidence: 95%
├─ Complexity Assessment
│  ├─ Level: Simple
│  └─ Time Estimate: 5-15 min
└─ Model Recommendation
   ├─ Primary: SWE-1.5 (for quick tasks)
   └─ Reason: Simple tasks can be handled efficiently by free models

Prompt Summary:
Create a new Python function that validates email addresses

==================================================
```

## Integration with Other Workflows

### Before /start-session
Run /visualize-task to understand the type of work ahead.

### During Complex Tasks
Use /visualize-task to break down complex requests into manageable parts.

### Before /end-session
Run /visualize-task on completed work to categorize achievements.

## Model Recommendations

The system recommends models based on:

- **Simple tasks** → SWE-1.5 (FREE, fast)
- **Medium tasks** → SWE-1.5 (balanced)
- **Complex tasks** → Sonnet (multi-file, judgment)
- **Design/architecture** → Opus (hard-to-reverse decisions)

## Time Estimates

Based on task complexity and type:

| Complexity | Code | Debug | Design | Analysis |
|------------|------|-------|--------|----------|
| Simple | 5-15 min | 10-30 min | 5-15 min | 5-10 min |
| Medium | 30-60 min | 30-90 min | 20-45 min | 15-30 min |
| Complex | 2-4 hours | 2-5 hours | 1-3 hours | 30-60 min |

## Advanced Features

### Batch Analysis
The system can analyze multiple prompts and create a dashboard:

```
/visualize-task "Create API" "Fix bug" "Write docs" "Add tests"
```

### JSON Export
For programmatic use, the analysis can be exported as JSON:

```python
from task_visualizer import TaskVisualizer

visualizer = TaskVisualizer()
analysis = visualizer.analyze_task(prompt)
json_data = visualizer.export_json(analysis, prompt)
```

### Custom Patterns
Add new task types by modifying the pattern dictionary in `task_visualizer.py`.

## Examples

### Example 1: Simple Coding Task
```
Input: "Write a Python function to calculate fibonacci numbers"

Output:
🔴 CODE Task (95% confidence, Simple, 5-15 min)
Keywords: write, python, function
```

### Example 2: Complex Debugging
```
Input: "Debug the race condition in the multi-threaded data processing pipeline"

Output:
🟢 DEBUG Task (85% confidence, Complex, 2-5 hours)
Keywords: debug, race condition, multi-threaded
```

### Example 3: Design Task
```
Input: "Design the database schema for an e-commerce platform with user management"

Output:
🔵 DESIGN Task (90% confidence, Medium, 20-45 min)
Keywords: design, database schema, user management
```

## Customization

### Adding New Task Types
1. Add to `TaskType` enum with color and emoji
2. Add patterns to `task_patterns` dictionary
3. Update time estimates in `estimate_time` method

### Adjusting Complexity
Modify `complexity_indicators` to change how complexity is detected.

### Model Recommendations
Update `recommend_model` method to change model selection logic.

## Philosophy

The goal of /visualize-task is to:
1. **Provide clarity** - Help users understand what they're asking for
2. **Guide model selection** - Recommend the right AI model for the job
3. **Manage expectations** - Give realistic time estimates
4. **Track work patterns** - Visualize the types of work being done

This helps users make informed decisions about their development workflow and optimize their use of AI assistants.
