---
description: System architecture documentation generator and manager
---

# /docs - System Architecture Documentation

Manage MAx Framework system architecture documentation with automatic updates.

## Usage

```bash
# Generate full system architecture documentation
/docs architecture

# Update documentation after quality gate passes
/docs update

# Show documentation status
/docs status

# View specific architecture section
/docs view <section>

# List all documentation sections
/docs list

# Check documentation freshness
/docs check
```

## Commands

### /docs architecture
Generate comprehensive system architecture documentation including:
- Framework structure and components
- Command system architecture
- Workflow system design
- Memory system architecture
- Quality gate integration
- Integration points and APIs

### /docs update
Update documentation after quality gate passes:
- Scans for recent changes
- Updates component diagrams
- Refreshes command mappings
- Validates architecture consistency
- Updates version timestamps

### /docs status
Show current documentation status:
- Last update time
- Sections needing updates
- Quality gate sync status
- Architecture drift detection

### /docs view <section>
View specific documentation section:
- `framework` - Core framework architecture
- `commands` - Command system design
- `workflows` - Workflow architecture
- `memory` - Memory system design
- `quality` - Quality gate integration
- `integrations` - External integrations

### /docs list
List all available documentation sections with metadata.

### /docs check
Check documentation freshness and consistency:
- Compare with current codebase
- Flag outdated sections
- Suggest updates needed

## Automatic Updates

The `/docs update` command automatically triggers:
- **After quality gate passes** - When `/quality-summary` completes successfully
- **On major changes** - When core files are modified
- **Scheduled updates** - At configurable intervals

## Integration Points

- **Quality Gate System** - Auto-update after successful quality checks
- **Workflow System** - Document new workflows automatically
- **Command Registry** - Update command mappings
- **Memory System** - Architecture decision logging

This ensures system architecture documentation stays current with the evolving MAx Framework.
