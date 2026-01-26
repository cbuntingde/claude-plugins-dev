# Plugin Development Standards

## Plugin Structure Rules

### Plugin.json Location
- **NEVER** place `plugin.json` in the plugin root directory
- `plugin.json` **MUST** be located at: `.claude-plugin/plugin.json`

### Plugin.json Format
Only the following fields are permitted in `.claude-plugin/plugin.json`:

```json
{
  "name": "plugin-name",
  "version": "1.0.0",
  "description": "Brief description of the plugin",
  "author": {
    "name": "Author Name",
    "email": "email@example.com"
  }
}
```

## Plugin Requirements
- Each plugin MUST have an `index.js` or `index.ts` entry point
- All commands must have corresponding implementation files with executable permissions
- All dependencies must be declared in `package.json`
- Plugins must follow consistent naming conventions
- Configuration must be through settings files, not hardcoded

## File Structure

### Recommended Layout
```
plugin-name/
├── .claude-plugin/
│   └── plugin.json
├── src/
│   ├── index.ts
│   ├── commands/
│   ├── utils/
│   └── types/
├── tests/
├── package.json
├── tsconfig.json
└── README.md
```

### Entry Point (index.ts)
```typescript
export interface PluginAPI {
  name: string;
  version: string;
  commands: Record<string, CommandHandler>;
  initialize?: () => Promise<void>;
  cleanup?: () => Promise<void>;
}

export default {
  name: 'plugin-name',
  version: '1.0.0',
  commands: {
    'command-name': commandHandler
  }
} as PluginAPI;
```

## README.md Guidelines

Keep README files precise and concise:

### Required Sections
1. **Description** - Brief overview (2-3 sentences)
2. **Installation** - Step-by-step install instructions
3. **Usage** - Command examples with output
4. **Configuration** - Environment variables and settings
5. **Security** - Security considerations and best practices

### README Best Practices
- Use bullet points over paragraphs
- Include only essential information
- Example files should be minimal and focused
- Document all environment variables
- Include troubleshooting section
- Keep examples realistic and practical

### Example README Structure
```markdown
# Plugin Name

Brief description of what the plugin does.

## Installation

- Clone the repository
- Run `npm install`
- Configure environment variables

## Usage

\`\`\`bash
command example
\`\`\`

## Configuration

- `API_KEY` - Your API key (required)
- `TIMEOUT` - Request timeout in ms (default: 5000)

## Security

- Never commit API keys
- Use environment variables for secrets
- Validate all inputs

## Troubleshooting

Common issues and solutions.
```

## Author Information

When creating plugin metadata, use:
- GitHub username: `cbuntingde`
- Email: `cbuntingde@gmail.com`

### Package.json Example
```json
{
  "name": "plugin-name",
  "version": "1.0.0",
  "description": "Brief description",
  "author": {
    "name": "cbuntingde",
    "email": "cbuntingde@gmail.com"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/cbuntingde/claude-plugins-dev.git"
  },
  "bugs": {
    "url": "https://github.com/cbuntingde/claude-plugins-dev/issues"
  },
  "homepage": "https://github.com/cbuntingde/claude-plugins-dev/tree/main/plugins/plugin-name"
}
```

## Plugin Naming Conventions

### Plugin Names
- Use kebab-case: `api-client-generator`
- Be descriptive and specific
- Avoid generic names
- Maximum 50 characters

### Command Names
- Use kebab-case: `generate-client`
- Start with verb: `create`, `generate`, `validate`
- Be clear and concise

### File Names
- Use kebab-case for files: `api-client.ts`
- Use PascalCase for classes: `ApiClient`
- Use camelCase for functions: `generateClient`

## Configuration Management

### Environment Variables
- Document all required variables
- Provide sensible defaults where appropriate
- Validate at startup
- Never commit .env files

### Settings Files
- Use JSON or YAML for config
- Provide example config file
- Document all options
- Validate schema on load

## Error Handling

### Plugin-Specific Errors
```typescript
export class PluginError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'PluginError';
  }
}

export class ValidationError extends PluginError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', details);
  }
}

export class ConfigurationError extends PluginError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONFIGURATION_ERROR', details);
  }
}
```

## Testing Requirements

### Plugin Tests
- Test all commands
- Test configuration loading
- Test error handling
- Mock external dependencies
- Test CLI integration

### Test Structure
```typescript
describe('PluginName', () => {
  describe('initialization', () => {
    it('should load configuration', () => {});
    it('should validate required settings', () => {});
  });

  describe('commands', () => {
    describe('command-name', () => {
      it('should execute successfully', () => {});
      it('should handle errors', () => {});
    });
  });
});
```

## Documentation

### Inline Documentation
- JSDoc comments for all public APIs
- Type definitions for parameters
- Example usage in comments
- Security notes where relevant

### API Documentation
- Document all commands
- Include parameter descriptions
- Show example outputs
- Note any limitations

## Version Management

### Semantic Versioning
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes

### Changelog
- Keep CHANGELOG.md updated
- Document all changes
- Include migration guides for breaking changes
