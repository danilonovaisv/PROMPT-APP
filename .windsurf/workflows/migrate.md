---
description: Migrate existing .windsurf setups to use MAx Framework (Model Awareness eXtension)
---

# Migrating to MAx Framework

This guide helps you migrate existing `.windsurf` directories to use the centralized MAx Framework (Model Awareness eXtension) persona framework.

## Migration Options

### Option 1: Sync with MAx Framework (Recommended)

Keep your existing persona but sync with MAx updates:

```bash
# 1. Clone MAx Framework (if not already)
git clone https://github.com/ethandellaposta/max.git ~/MAx

# 2. Backup your existing .windsurf
cp -r /path/to/project/.windsurf /path/to/project/.windsurf.backup

# 3. Copy MAx Framework structure, preserving your customizations
cp -r ~/MAx/.windsurf /path/to/project/.windsurf

# 4. Restore your custom persona
cp /path/to/project/.windsurf.backup/persona.md /path/to/project/.max/persona.md

# 5. Restore your project config
cp /path/to/project/.windsurf.backup/project-config.md /path/to/project/.max/project-config.md
```

### Option 2: In-Place Upgrade

Update your existing files with Max improvements:

```bash
# 1. Download specific files from Max
curl -o .max/rules/persona-rules.md https://raw.githubusercontent.com/ethandellaposta/max/main/.max/rules/persona-rules.md
curl -o .max/workflows/humanify.md https://raw.githubusercontent.com/ethandellaposta/max/main/.max/workflows/humanify.md

# 2. Create new directories
mkdir -p .max/insights

# 3. Update your persona.md to include /humanify command
# (Manual edit - see "What to Add" below)
```

### Option 3: Fresh Start with Backup

Start fresh but keep your old work as reference:

```bash
# 1. Backup everything
mv .windsurf .windsurf.old

# 2. Copy fresh Max setup
cp -r ~/MAx/.windsurf .

# 3. Manually migrate key customizations
# - Copy your persona identity sections
# - Copy your project milestones
# - Copy any custom rules
```

## What to Add to Existing persona.md

Add this section to your existing persona.md:

```markdown
## Workflow Commands

### /start-session
[existing content]

### /end-session
[existing content]

### /humanify
Extracts human insights and learning from your work:
- Analyzes what was built and changed
- Identifies key technical insights
- Creates human-readable takeaways
- Suggests what to write down for reinforcement
- Helps you feel like a co-creator, not just a prompter

Use /humanify after complex tasks, before /end-session, or when you want to reinforce learning.
```

## Sync Script (Automated)

Create this script to sync multiple projects:

```bash
#!/bin/bash
# sync-max.sh - Sync all projects with MAx Framework

MAX_REPO="$HOME/MAx"
PROJECTS=(
    "/path/to/project1"
    "/path/to/project2"
    "/path/to/project3"
)

for project in "${PROJECTS[@]}"; do
    echo "Syncing $project..."

    # Backup
    cp -r "$project/.windsurf" "$project/.windsurf.backup.$(date +%Y%m%d)"

    # Copy Max structure
    cp -r "$MAX_REPO/.windsurf" "$project/"

    # Restore custom files if they exist
    if [ -f "$project/.windsurf.backup/persona.md" ]; then
        cp "$project/.windsurf.backup/persona.md" "$project/.max/persona.md"
    fi

    echo "✅ $project synced"
done
```

## What Changes in the Migration

### Fixed Credit Calculation
- Old: `💳 500 - X = Y credits remaining`
- New: `💳 X credits used`

### New Commands
- `/humanify` - Extract learning insights
- Enhanced `/start-session` and `/end-session`

### New Directories
- `.max/insights/` - Store humanify outputs
- Better organized workflows

### Updated Rules
- Fixed credit tracking
- Better model tier guidance
- Enhanced rabbithole prevention

## Verification

After migration, verify:

1. **Persona loads** - Start a new session, persona should load correctly
2. **Commands work** - Try `/start-session`, `/end-session`, `/humanify`
3. **Scoreboard correct** - Should show credits used, not remaining
4. **No conflicts** - No duplicate or conflicting files

## Troubleshooting

### Persona Not Loading
- Check `.max/persona.md` exists and is valid YAML frontmatter
- Verify rules file has `trigger: always_on`

### Commands Not Working
- Ensure workflow files are in `.max/workflows/`
- Check file names match exactly

### Credit Calc Still Wrong
- Update rules file with new format
- Clear IDE cache and restart

## Multiple Projects Strategy

For multiple projects:

1. **Central Max repo** - Clone once, reference from all projects
2. **Project-specific personas** - Keep unique persona.md per project
3. **Shared rules** - Use same rules/persona-rules.md everywhere
4. **Sync script** - Run updates across all projects

## Ongoing Updates

When MAx Framework updates:

```bash
cd ~/MAx
git pull

# Run sync script
./sync-max.sh
```

This keeps all projects in sync with latest MAx Framework improvements while preserving your custom personas.
