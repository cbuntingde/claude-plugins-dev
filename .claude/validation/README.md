# Plugin Validation System

## Overview

All plugins in the marketplace must pass automated validation before being committed. This ensures quality, consistency, and prevents common errors.

## Running Validation

### Validate All Plugins
```bash
npm run validate
```

### Validate Specific Plugin
```bash
npm run validate -- --plugin=bug-catcher-plugin
```

### Quick Validation (Schema Only)
```bash
npm run validate:quick
```

## What Gets Validated

### 1. Plugin Metadata (`.claude-plugin/plugin.json`)

**Required Fields:**
- `name`: Kebab-case, max 50 characters
- `version`: Semantic versioning (e.g., 1.0.0)
- `description`: Brief description, max 200 characters
- `author.name`: Author name
- `author.email`: Valid email address

**Validation Rules:**
- Must be located at `.claude-plugin/plugin.json` (not root)
- No additional fields allowed
- JSON must be valid

### 2. Hooks Configuration (`hooks/hooks.json`)

**Hook Types Supported:**
- `PostToolUse`
- `PostToolUseFailure`
- `PreToolUse`
- `SessionStart`
- `SessionEnd`
- `UserPromptSubmit`
- `PermissionRequest`
- `PreCompact`

**Hook Configuration Types:**

#### Command Hook
```json
{
  "type": "command",
  "command": "${CLAUDE_PLUGIN_ROOT}/scripts/script.sh",
  "description": "Optional description",
  "runInBackground": false,
  "timeout": 30000
}
```

#### Prompt Hook
```json
{
  "type": "prompt",
  "prompt": "Text to inject into conversation",
  "description": "Optional description"
}
```

#### Agent Hook
```json
{
  "type": "agent",
  "agent": "agent-name",
  "description": "Optional description",
  "tools": ["Read", "Grep"],
  "messages": [
    {
      "role": "user",
      "content": "Message content"
    }
  ]
}
```

**Critical Rule:** Agent hooks MUST include `messages` array. This is a common source of errors.

### 3. Package Metadata (`package.json`)

**Required Fields:**
- `name`: Kebab-case, max 50 characters
- `version`: Semantic versioning
- `description`: Brief description, max 200 characters
- `author`: Object with `name` and `email`
- `repository`: Git repository URL
- `bugs`: Bug tracker URL
- `homepage`: Plugin homepage URL
- `license`: License identifier
- `engines`: Runtime requirements

**Project Standards:**
- `author.email` must be `cbuntingde@gmail.com`
- `homepage` must follow pattern: `https://github.com/cbuntingde/claude-plugins-dev/tree/main/plugins/{plugin-name}`

### 4. README Structure

**Required Sections:**
- `## Installation`
- `## Usage`
- `## Configuration`

**Best Practices:**
- Keep descriptions concise
- Use bullet points over paragraphs
- Include security considerations
- Provide troubleshooting section

### 5. Entry Point

**Requirements:**
- Must have `index.js` or `index.ts` in plugin root
- File must exist and be readable

### 6. Command Documentation

**Validation:**
- All scripts referenced in hooks must exist
- Scripts must be in `scripts/` directory
- Filenames must match hook references

## Common Validation Failures

### Error: "Messages are required for agent hooks"

**Problem:** Agent hook missing `messages` field

**Fix:**
```json
{
  "type": "agent",
  "agent": "my-agent",
  "messages": [  // ← ADD THIS
    {
      "role": "user",
      "content": "Your message here"
    }
  ]
}
```

### Error: "plugin.json exists: Missing .claude-plugin/plugin.json"

**Problem:** plugin.json in wrong location

**Fix:** Move from `plugin.json` to `.claude-plugin/plugin.json`

### Error: "Homepage URL mismatch"

**Problem:** Incorrect homepage URL

**Fix:**
```json
{
  "homepage": "https://github.com/cbuntingde/claude-plugins-dev/tree/main/plugins/your-plugin-name"
}
```

## CI/CD Integration

### GitHub Actions

Validation runs automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual workflow dispatch

**Workflow Steps:**
1. Plugin validation
2. Security audit (npm audit + trufflehog)
3. Schema validation (AJV)

### Pre-commit Hooks

Git pre-commit hooks automatically run validation before allowing commits.

**Install hooks:**
```bash
npm install --save-dev husky
npx husky install
```

**Bypass pre-commit (not recommended):**
```bash
git commit --no-verify
```

## Adding New Validation Rules

### 1. Update Schema

Edit the appropriate schema in `.claude/validation/schemas/`:
- `plugin.json` - Plugin metadata
- `hooks.json` - Hooks configuration
- `package.json` - Package metadata

### 2. Add Validation Logic

Edit `.claude/validation/validate-plugin.js` to add new checks:

```javascript
function validateNewRule(pluginDir) {
  const pluginName = pluginDir.split('\\').pop();
  // Your validation logic here
  if (condition) {
    logFailure(pluginName, 'Rule name', 'Details');
    return false;
  }
  logSuccess(pluginName, 'Rule name');
  return true;
}
```

### 3. Update Documentation

Add documentation for the new rule in this file.

## Exit Codes

- `0` - All validations passed
- `1` - Validation failures found
- `2` - Error occurred (invalid JSON, missing files, etc.)

## Debugging

### Enable Verbose Output
```bash
DEBUG=1 npm run validate
```

### Validate Single Plugin
```bash
npm run validate -- --plugin=my-plugin
```

### Skip Specific Checks
Create a `.validateignore` file in plugin root:
```
# Skip README validation
README.md

# Skip command doc validation
commands/
```

## Related Documentation

- [Project Rules](../../../CLAUDE.md)
- [Plugin Development Standards](../../../.claude/rules/plugin_dev.md)
- [Production Readiness Checklist](../../../.claude/rules/production_checklist.md)
- [Security Code Review](../../../.claude/rules/security_review.md)
