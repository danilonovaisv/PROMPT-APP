---
description: MAx framework core management and configuration
---

# MAx Core Workflow

The `/max` command provides comprehensive management of the MAx framework itself, including configuration, status, and core operations.

## Usage

```bash
# Show MAx framework status
/max

# Configure MAx settings
/max config

# Show system information
/max info

# Check framework health
/max health

# Update MAx framework
/max update
```

## Core Operations

### Framework Status
```bash
/max status
```
Shows:
- Framework version and installation status
- Active configuration settings
- Component health check
- Recent activity summary

### Configuration Management
```bash
/max config show
/max config set <key> <value>
/max config reset
```
Manage all MAx framework settings:
- Command aliases and preferences
- Workflow configurations
- Integration settings
- Performance parameters

### System Information
```bash
/max info
```
Display comprehensive system information:
- MAx framework details
- Environment configuration
- Available commands and workflows
- Integration status with IDE/tools

### Health Check
```bash
/max health
```
Perform comprehensive health checks:
- File system integrity
- Configuration validation
- Command functionality tests
- Integration connectivity

### Framework Updates
```bash
/max update
/max update check
/max update install
```
Manage MAx framework updates:
- Check for available updates
- Review update contents
- Install updates safely
- Rollback if needed

## Configuration Options

### Core Settings
- `framework.version` - Current MAx version
- `framework.auto_update` - Enable automatic updates
- `framework.debug_mode` - Enable debug logging
- `framework.performance_mode` - Optimize for speed

### Command Settings
- `commands.default_namespace` - Default command namespace
- `commands.show_aliases` - Display command aliases in help
- `commands.enable_colon` - Enable colon-based commands
- `commands.dropdown_filter` - Filter dropdown commands

### Workflow Settings
- `workflows.auto_load` - Automatically load workflows
- `workflows.cache_enabled` - Cache workflow results
- `workflows.timeout` - Workflow execution timeout
- `workflows.parallel_execution` - Enable parallel workflow runs

### Integration Settings
- `ide.auto_sync` - Sync with IDE changes
- `git.auto_commit` - Auto-commit framework changes
- `backup.enabled` - Enable automatic backups
- `backup.location` - Backup storage location

## Advanced Features

### Component Management
```bash
/max components list
/max components enable <component>
/max components disable <component>
/max components update <component>
```

Manage MAx framework components:
- Command executors
- Workflow processors
- Integration modules
- Utility tools

### Performance Optimization
```bash
/max optimize
/max optimize analyze
/max optimize apply
```

Optimize MAx framework performance:
- Analyze bottlenecks
- Optimize configuration
- Cache management
- Resource allocation

### Debugging and Troubleshooting
```bash
/max debug enable
/max debug logs
/max debug trace <command>
/max debug reset
```

Debugging tools for MAx framework:
- Enable debug mode
- View system logs
- Trace command execution
- Reset debug state

## Integration Management

### IDE Integration
```bash
/max ide status
/max ide sync
/max ide configure
```

Manage IDE integrations:
- Check IDE connection status
- Sync settings and configurations
- Configure IDE-specific features

### Git Integration
```bash
/max git status
/max git sync
/max git hooks
```

Git repository management:
- Check git repository status
- Sync framework changes
- Manage git hooks

### External Tools
```bash
/max tools list
/max tools install <tool>
/max tools configure <tool>
```

External tool integrations:
- List available tools
- Install new integrations
- Configure tool settings

## Monitoring and Analytics

### Usage Analytics
```bash
/max analytics usage
/max analytics commands
/max analytics performance
```

Track MAx framework usage:
- Command usage statistics
- Performance metrics
- User behavior patterns
- System resource usage

### Health Monitoring
```bash
/max monitor start
/max monitor status
/max monitor stop
```

Continuous health monitoring:
- Real-time system monitoring
- Alert configuration
- Performance tracking
- Issue detection

## Security and Maintenance

### Security Management
```bash
/max security audit
/max security permissions
/max security update
```

Security features:
- Security audit tools
- Permission management
- Security updates
- Access control

### Maintenance Tasks
```bash
/max maintenance cleanup
/max maintenance backup
/max maintenance restore
```

Routine maintenance:
- Clean up temporary files
- Create backups
- Restore from backup
- System maintenance

## Examples

### Quick Status Check
```bash
/max
```
Output:
```
🚀 MAx Framework Status
Version: 2.0.0
Installation: ✅ Complete
Configuration: ✅ Valid
Components: ✅ All active
Last Update: 2026-02-20
```

### Configuration Update
```bash
/max config set commands.enable_colon true
```
Output:
```
✅ Configuration updated
Setting: commands.enable_colon = true
Restart required for changes to take effect
```

### Health Check
```bash
/max health
```
Output:
```
🏥 MAx Framework Health Check
✅ File System: All files present and valid
✅ Configuration: No syntax errors detected
✅ Commands: All commands functional
✅ Workflows: All workflows loaded
⚠️  Performance: Minor slowdown detected
```

## Troubleshooting

### Common Issues

**Command not found:**
```bash
/max health  # Check framework status
/max config show  # Verify configuration
```

**Performance issues:**
```bash
/max optimize analyze  # Find bottlenecks
/max maintenance cleanup  # Clean up system
```

**Configuration problems:**
```bash
/max config reset  # Reset to defaults
/max maintenance restore  # Restore from backup
```

### Getting Help

```bash
/max help          # Show all available commands
/max help <command> # Get help for specific command
/max docs          # Open documentation
```

---

**🚀 The `/max` command is your central hub for MAx framework management!**
