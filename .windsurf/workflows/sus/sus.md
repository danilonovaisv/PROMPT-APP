# /sus - Suspicious Activity Analysis

This command analyzes everything since the last prompt with maximum suspicion.

## Usage

```bash
/sus
```

## What It Analyzes

### Recent File Activity
- Files modified in the last 5 minutes
- Large files (>10MB) that might be hiding something
- Files with suspicious names (secret, password, key, hack, etc.)

### System State
- Network activity (or lack thereof)
- Process activity
- User permissions
- Working directory

### User Behavior
- Command patterns
- Request frequency
- Paranoia level (very high if using /sus)

### Environment Scan
- Hidden directories
- Configuration files
- System resources

## Output Format

```
🕵️ SUSPICIOUS ACTIVITY ANALYSIS
============================================================

🕐 Timestamp: 2026-02-20 02:57:45
📍 Location: /Users/ethandellaposta/Documents/git/max
👤 User: Acting suspiciously

🔍 RECENT ACTIVITY REVIEW:
🚨 FILES MODIFIED RECENTLY:
   • ./.max/sus.py
   • ./.max/command_executor.py
   ...

🤔 USER BEHAVIOR ANALYSIS:
   • Requested 'sus' command (very suspicious)
   • Looking for something (what are you hiding?)
   • Acting paranoid (classic guilty behavior)

⚖️ VERDICT:
   • Suspicion Level: LOW
   • Threat Assessment: User is definitely up to something
   • Recommendation: Keep watching 👀
```

## Features

### 🔍 File Analysis
- Recent modifications (last 5 minutes)
- Large file detection
- Suspicious filename patterns
- Hidden file scanning

### 🌐 Network Monitoring
- Detects network requests
- Flags suspiciously clean activity
- Monitors external connections

### ⚙️ System State
- Process monitoring
- Permission checking
- Resource usage analysis

### 🤔 Behavioral Analysis
- Command frequency
- Request patterns
- Paranoia indicators

## Security Indicators

### 🚨 High Suspicion
- Multiple recent file modifications
- Suspicious filenames detected
- Network activity to unknown hosts
- Elevated privileges detected

### ⚠️ Medium Suspicion
- Large files present
- Hidden directories with unusual content
- Unusual command patterns

### ✅ Low Suspicion
- Normal development activity
- No network requests
- Standard file operations

## Use Cases

### Security Auditing
```bash
/sus
# Check if anything suspicious happened while you were away
```

### Before Commit
```bash
/sus
# Make sure nothing sus is being committed
```

### After Suspicious Activity
```bash
/sus
# Analyze what happened during that weird period
```

### Just for Fun
```bash
/sus
# Because sometimes you just need to be sus
```

## Technical Details

### File Scanning
- Recursively scans current directory
- Excludes `.git` and `.max/context-cache`
- Checks modification timestamps
- Analyzes file sizes and names

### Pattern Matching
Suspicious patterns include:
- secret, password, key, hack, exploit
- backdoor, admin, root, sudo
- .tmp, .bak, .old files
- Executable files in unusual locations

### Time Window
- Default: Last 5 minutes
- Adjust based on activity level
- Ignores files older than 1 hour

## Philosophy

The sus command follows the principle:
> "The sus-pest sus is always the one calling sus"

It's designed to be both useful and humorous, providing real security analysis while acknowledging that requesting a suspicious analysis is itself suspicious.

## Integration

### Standalone
```bash
python3 .max/sus.py
```

### Through Command Executor
```bash
python3 .max/command_executor.py sus
```

### In IDE
Type `/sus` in the chat interface

## Limitations

- Only scans local filesystem
- No actual network monitoring (simulated)
- Doesn't check running processes deeply
- Limited to current working directory

## Future Enhancements

- [ ] Cross-platform process monitoring
- [ ] Real network traffic analysis
- [ ] Integration with security tools
- [ ] Customizable suspicious patterns
- [ ] Automated reporting

## Remember

Stay suspicious out there! 🕵️
