---
description: Comprehensive MAx configuration management system
---

# MAx Configuration System

This is the comprehensive configuration system that makes **EVERYTHING** in MAx configurable! 🎛️

## Overview

The MAx configuration system provides centralized control over all aspects of the framework:

- **🔧 Code Quality & Linting**
- **🔒 Push Safety & Protection**
- **🧠 Memory Management**
- **📊 Quality Summaries**
- **⚡ Workflows & Automation**
- **🤖 AI Model Configuration**
- **🎨 User Interface**
- **⚡ Performance Optimization**
- **📝 Logging & Debugging**
- **🔗 External Integrations**
- **🛡️ Security & Privacy**
- **🧪 Experimental Features**

## Quick Start

### Check Current Status
```bash
max-config status
```

### List All Components
```bash
max-config list
```

### View Component Configuration
```bash
max-config show quality
max-config show safety
max-config show memory
```

### Configure Settings
```bash
# Enable/disable components
max-config toggle quality
max-config set safety enabled true

# Adjust specific settings
max-config set quality max_complexity 25
max-config set memory auto_capture true
max-config set ui theme dark

# Get current values
max-config get quality max_complexity
max-config get safety protected_branches
```

## Component Configuration

### 🔧 Quality Configuration
Controls code quality, linting, and formatting:

```bash
# Enable/disable quality checks
max-config set quality enabled true

# Configure linting rules
max-config set quality max_complexity 30
max-config set quality max_line_length 100
max-config set quality auto_fix true

# Configure specific tools
max-config set quality mypy_enabled true
max-config set quality black_enabled true
max-config set quality isort_enabled true

# Set ignore patterns
max-config set quality ignore_patterns "E402,E501,W503"
```

**Settings:**
- `enabled` - Enable quality system
- `pre_commit_hooks` - Run hooks before commits
- `max_complexity` - Maximum cyclomatic complexity
- `max_line_length` - Maximum line length
- `auto_fix` - Automatically fix issues
- `fail_fast` - Stop on first error
- `ignore_patterns` - Patterns to ignore
- `mypy_enabled` - Enable mypy type checking
- `black_enabled` - Enable black formatting
- `isort_enabled` - Enable import sorting

### 🔒 Safety Configuration
Controls push safety and repository protection:

```bash
# Enable/disable safety system
max-config set safety enabled true
max-config set safety require_confirmation true

# Configure protected branches
max-config set safety protected_branches "main,master,develop,staging"

# Set dangerous patterns
max-config set safety dangerous_patterns "force.*push,delete.*branch"

# Configure auto-approval
max-config set safety auto_approve_patterns "docs/,README*,*.md"
```

**Settings:**
- `enabled` - Enable push safety
- `require_confirmation` - Require confirmation for pushes
- `protected_branches` - Branches requiring confirmation
- `dangerous_patterns` - Patterns that trigger confirmation
- `auto_approve_patterns` - Patterns auto-approved
- `quiet_mode` - Reduce output verbosity
- `emergency_bypass_enabled` - Allow --no-verify bypass

### 🧠 Memory Configuration
Controls memory capture and management:

```bash
# Enable/disable memory system
max-config set memory enabled true
max-config set memory auto_capture true

# Configure capture frequency
max-config set memory capture_frequency "on_commit"  # on_commit, on_change, manual

# Set limits
max-config set memory max_memories_per_session 100
max-config set memory memory_retention_days 30

# Configure cleanup
max-config set memory auto_cleanup true
max-config set memory compression_enabled true
```

**Settings:**
- `enabled` - Enable memory system
- `auto_capture` - Automatically capture memories
- `capture_frequency` - When to capture
- `max_memories_per_session` - Maximum memories per session
- `memory_retention_days` - Days to keep memories
- `auto_cleanup` - Automatically clean old memories
- `compression_enabled` - Compress stored memories
- `categories` - Memory categories
- `default_format` - Storage format

### 📊 Quality Summary Configuration
Controls automatic quality summary generation:

```bash
# Enable/disable summaries
max-config set quality_summary enabled true
max-config set quality_summary auto_generate true

# Configure generation timing
max-config set quality_summary generate_on_commit true
max-config set quality_summary update_changelog true

# Set output format
max-config set quality_summary output_format "markdown"  # markdown, json, html

# Configure file patterns
max-config set quality_summary include_patterns ".max/*.py,*.py,*.md"
max-config set quality_summary exclude_patterns "*test*,*__pycache__*"
```

**Settings:**
- `enabled` - Enable quality summaries
- `auto_generate` - Generate automatically
- `generate_on_commit` - Generate after commits
- `update_changelog` - Update changelog
- `output_format` - Output format
- `include_patterns` - Files to include
- `exclude_patterns` - Files to exclude
- `categories` - Quality categories
- `output_dir` - Output directory

### ⚡ Workflow Configuration
Controls workflow automation and execution:

```bash
# Enable/disable workflows
max-config set workflow enabled true
max-config set workflow auto_load_workflows true

# Configure execution
max-config set workflow max_concurrent_workflows 5
max-config set workflow timeout_seconds 300
max-config set workflow retry_attempts 3

# Configure caching
max-config set workflow workflow_cache_enabled true
max-config set workflow cache_ttl_hours 24
```

**Settings:**
- `enabled` - Enable workflow system
- `auto_load_workflows` - Auto-load workflows
- `workflow_dirs` - Workflow directories
- `max_concurrent_workflows` - Maximum concurrent workflows
- `timeout_seconds` - Workflow timeout
- `retry_attempts` - Retry attempts
- `auto_retry_on_failure` - Auto-retry on failure
- `workflow_cache_enabled` - Enable caching
- `cache_ttl_hours` - Cache TTL

### 🤖 Model Configuration
Controls AI model selection and optimization:

```bash
# Configure default model
max-config set model default_model "SWE-1.5"
max-config set model cost_optimization true

# Configure model tiers
max-config set model eco_models "gpt-3.5-turbo,claude-instant"
max-config set model standard_models "gpt-4,claude-3-sonnet"
max-config set model power_models "gpt-4-turbo,claude-3-opus"

# Configure limits
max-config set model max_tokens_per_request 4000
max-config set model temperature_default 0.7
```

**Settings:**
- `default_model` - Default AI model
- `cost_optimization` - Optimize for cost
- `auto_upgrade_threshold` - Upgrade threshold
- `eco_models` - Cost-effective models
- `standard_models` - Standard models
- `power_models` - High-performance models
- `max_tokens_per_request` - Token limit
- `temperature_default` - Default temperature
- `enable_context_optimization` - Optimize context
- `context_compression` - Compress context

### 🎨 UI Configuration
Controls user interface and experience:

```bash
# Configure appearance
max-config set ui theme "dark"  # dark, light, auto
max-config set ui font_size 14
max-config set ui font_family "Monaco,Consolas,monospace"

# Configure editor
max-config set ui show_line_numbers true
max-config set ui word_wrap true
max-config set ui minimap_enabled true

# Configure behavior
max-config set ui auto_save true
max-config set ui auto_save_delay_ms 1000
max-config set ui confirm_before_exit true
```

**Settings:**
- `theme` - UI theme
- `font_size` - Font size
- `font_family` - Font family
- `show_line_numbers` - Show line numbers
- `word_wrap` - Word wrap
- `minimap_enabled` - Enable minimap
- `auto_save` - Auto-save
- `auto_save_delay_ms` - Auto-save delay
- `confirm_before_exit` - Confirm before exit

### ⚡ Performance Configuration
Controls performance optimization:

```bash
# Configure caching
max-config set performance enable_caching true
max-config set performance cache_size_mb 512

# Configure processing
max-config set performance enable_parallel_processing true
max-config set performance max_workers 4

# Configure loading
max-config set performance enable_lazy_loading true
max-config set performance preload_common_modules true
```

**Settings:**
- `enable_caching` - Enable caching
- `cache_size_mb` - Cache size in MB
- `enable_parallel_processing` - Parallel processing
- `max_workers` - Maximum workers
- `enable_lazy_loading` - Lazy loading
- `preload_common_modules` - Preload modules
- `enable_profiling` - Enable profiling
- `memory_limit_mb` - Memory limit
- `cpu_limit_percent` - CPU limit

### 📝 Logging Configuration
Controls logging and debugging:

```bash
# Configure logging level
max-config set logging enabled true
max-config set logging level "INFO"  # DEBUG, INFO, WARNING, ERROR, CRITICAL

# Configure output
max-config set logging file_enabled true
max-config set logging file_path ".max/logs/max.log"
max-config set logging console_enabled true

# Configure rotation
max-config set logging max_file_size_mb 10
max-config set logging backup_count 5
```

**Settings:**
- `enabled` - Enable logging
- `level` - Log level
- `format` - Log format
- `file_enabled` - Enable file logging
- `file_path` - Log file path
- `max_file_size_mb` - Max file size
- `backup_count` - Backup count
- `console_enabled` - Enable console logging
- `structured_logging` - Structured logging
- `include_traceback` - Include traceback

### 🔗 Integration Configuration
Controls external tool integrations:

```bash
# Enable integrations
max-config set integration git_enabled true
max-config set integration git_hooks_enabled true
max-config set integration vscode_integration true

# Configure services
max-config set integration api_server_enabled false
max-config set integration api_port 8080
max-config set integration webhook_enabled false

# Configure notifications
max-config set integration slack_integration false
max-config set integration email_notifications false
```

**Settings:**
- `git_enabled` - Git integration
- `git_hooks_enabled` - Git hooks
- `model_agent_extender_integration` - Model Agent Extender VS Code integration
- `terminal_integration` - Terminal integration
- `web_browser_preview` - Browser preview
- `api_server_enabled` - API server
- `api_port` - API port
- `webhook_enabled` - Webhooks
- `slack_integration` - Slack integration
- `email_notifications` - Email notifications

### 🛡️ Security Configuration
Controls security and privacy:

```bash
# Configure encryption
max-config set security enable_encryption false
max-config set security encrypt_sensitive_data true

# Configure auditing
max-config set security audit_log_enabled true
max-config set security sanitize_logs true

# Configure limits
max-config set security max_api_key_age_days 90
max-config set security enable_rate_limiting true
max-config set security max_requests_per_minute 60
```

**Settings:**
- `enable_encryption` - Enable encryption
- `encrypt_sensitive_data` - Encrypt sensitive data
- `audit_log_enabled` - Audit logging
- `audit_log_path` - Audit log path
- `max_api_key_age_days` - API key age limit
- `require_api_key_rotation` - Require key rotation
- `sanitize_logs` - Sanitize logs
- `block_external_requests` - Block external requests
- `enable_rate_limiting` - Rate limiting
- `max_requests_per_minute` - Rate limit

### 🧪 Experimental Configuration
Controls experimental features:

```bash
# Enable experimental features
max-config set experimental enabled false

# Enable specific features
max-config set experimental.features.ai_code_completion true
max-config set experimental.features.smart_refactoring true
max-config set experimental.features.automated_testing true

# Enable beta features
max-config set experimental.beta_features.enhanced_memory true
max-config set experimental.beta_features.workflow_automation true
```

**Settings:**
- `enabled` - Enable experimental features
- `features` - Experimental feature flags
- `beta_features` - Beta feature flags

## Global Settings

### Auto-save and Backup
```bash
# Configure auto-save
max-config set auto_save_config true

# Configure backups
max-config set config_backup_enabled true
max-config set config_backup_count 5

# Configure remote sync
max-config set enable_remote_config false
max-config set remote_config_url ""
max-config set sync_interval_minutes 30
```

## Configuration Management

### Export/Import Configuration
```bash
# Export to JSON
max-config export my-config.json

# Export to YAML
max-config export my-config.yaml --format yaml

# Import from file
max-config import my-config.json
max-config import my-config.yaml --format yaml
```

### Backup and Restore
```bash
# Create manual backup
max-config backup

# List available backups
max-config backups

# Restore from backup
max-config restore max-config_20240120_120000.json
```

### Validation
```bash
# Validate current configuration
max-config validate
```

### Reset Configuration
```bash
# Reset specific component
max-config reset quality

# Reset all configuration
max-config reset
```

## Configuration File Structure

The main configuration is stored in `.max/max-config.json`:

```json
{
  "version": "1.0.0",
  "config_version": "1.0.0",
  "last_updated": "2024-01-20T12:00:00",
  "quality": {
    "enabled": true,
    "max_complexity": 30,
    "max_line_length": 100,
    "auto_fix": true,
    "mypy_enabled": true,
    "black_enabled": true,
    "isort_enabled": true
  },
  "safety": {
    "enabled": true,
    "require_confirmation": true,
    "protected_branches": ["main", "master", "develop"],
    "auto_approve_patterns": ["docs/", "README*", "*.md"]
  },
  "memory": {
    "enabled": true,
    "auto_capture": true,
    "capture_frequency": "on_commit",
    "max_memories_per_session": 100,
    "memory_retention_days": 30
  },
  "quality_summary": {
    "enabled": true,
    "auto_generate": true,
    "generate_on_commit": true,
    "update_changelog": true,
    "output_format": "markdown"
  },
  "workflow": {
    "enabled": true,
    "auto_load_workflows": true,
    "max_concurrent_workflows": 5,
    "timeout_seconds": 300
  },
  "model": {
    "default_model": "SWE-1.5",
    "cost_optimization": true,
    "auto_upgrade_threshold": 0.8,
    "max_tokens_per_request": 4000
  },
  "ui": {
    "theme": "dark",
    "font_size": 14,
    "show_line_numbers": true,
    "auto_save": true
  },
  "performance": {
    "enable_caching": true,
    "cache_size_mb": 512,
    "enable_parallel_processing": true,
    "max_workers": 4
  },
  "logging": {
    "enabled": true,
    "level": "INFO",
    "file_enabled": true,
    "console_enabled": true
  },
  "integration": {
    "git_enabled": true,
    "git_hooks_enabled": true,
    "vscode_integration": true,
    "api_server_enabled": false
  },
  "security": {
    "enable_encryption": false,
    "encrypt_sensitive_data": true,
    "audit_log_enabled": true,
    "enable_rate_limiting": true
  },
  "experimental": {
    "enabled": false,
    "features": {
      "ai_code_completion": false,
      "smart_refactoring": false,
      "automated_testing": false
    },
    "beta_features": {
      "enhanced_memory": false,
      "workflow_automation": false
    }
  },
  "auto_save_config": true,
  "config_backup_enabled": true,
  "config_backup_count": 5
}
```

## Best Practices

### 1. Start with Defaults
Begin with the default configuration and only modify what you need.

### 2. Use Component Toggles
Enable/disable entire components rather than individual settings when starting out.

### 3. Backup Before Major Changes
Always create a backup before making significant configuration changes.

### 4. Validate Changes
Use `max-config validate` to ensure your configuration is valid.

### 5. Document Customizations
Keep track of why you changed specific settings for future reference.

### 6. Test Incrementally
Make changes incrementally and test each change.

### 7. Use Environment-Specific Configs
Consider different configurations for development vs. production.

## Examples

### Development Setup
```bash
# Enable all development tools
max-config set quality enabled true
max-config set quality auto_fix true
max-config set logging level "DEBUG"
max-config set experimental enabled true
max-config set experimental.features.ai_code_completion true
```

### Production Setup
```bash
# Conservative production settings
max-config set quality enabled true
max-config set safety require_confirmation true
max-config set logging level "WARNING"
max-config set experimental enabled false
max-config set security enable_rate_limiting true
```

### Minimal Setup
```bash
# Bare essentials only
max-config set quality enabled false
max-config set safety enabled true
max-config set memory enabled false
max-config set workflow enabled false
```

## Troubleshooting

### Configuration Not Loading
1. Check file permissions on `.max/max-config.json`
2. Validate JSON syntax: `python3 -m json.tool .max/max-config.json`
3. Reset to defaults: `max-config reset`

### Settings Not Applying
1. Check if component is enabled: `max-config show <component>`
2. Validate configuration: `max-config validate`
3. Restart MAx to apply changes

### Performance Issues
1. Disable experimental features: `max-config set experimental enabled false`
2. Reduce cache size: `max-config set performance cache_size_mb 256`
3. Disable parallel processing: `max-config set performance enable_parallel_processing false`

## Integration with Other Tools

The configuration system integrates with:
- **Git Hooks** - Uses safety and quality settings
- **Model Agent Extender** - Uses UI and integration settings
- **API Server** - Uses model and performance settings
- **Workflow Engine** - Uses workflow and logging settings

## Advanced Usage

### Programmatic Configuration
```python
from .windsurf.max_config import get_config_manager

# Get configuration manager
manager = get_config_manager()

# Update settings
manager.update_component_config('quality', {
    'max_complexity': 25,
    'auto_fix': True
})

# Save configuration
manager.save_config()
```

### Configuration Templates
Create templates for different environments:

```bash
# Export development template
max-config export dev-config.json

# Import for new project
max-config import dev-config.json
```

### Dynamic Configuration
Some settings can be changed at runtime and will take effect immediately, while others require a restart.

---

**🎛️ Everything in MAx is now configurable! Customize your experience exactly how you want it!**
