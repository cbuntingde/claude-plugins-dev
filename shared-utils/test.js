/**
 * Test suite for shared-utils library
 * Run with: node --experimental-vm-modules test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// Metadata module tests
import {
  validatePluginMetadata,
  createPluginJson
} from './src/metadata.js';

// Validation module tests
import {
  sanitizeInput,
  validateFilePath,
  validateUrl,
  validateIdentifier,
  sanitizeMarkdown
} from './src/validation.js';

// Template module tests
import {
  generateReadmeTemplate,
  generateCommandTemplate,
  generateAgentTemplate,
  generateHookJson,
  generateSkillTemplate
} from './src/templates.js';

// ============================================================================
// Metadata Module Tests
// ============================================================================

describe('metadata.js', () => {
  describe('createPluginJson()', () => {
    it('creates valid plugin.json with default author', () => {
      const result = createPluginJson({
        name: 'test-plugin',
        description: 'A test plugin'
      });

      assert.strictEqual(result.name, 'test-plugin');
      assert.strictEqual(result.version, '1.0.0');
      assert.strictEqual(result.description, 'A test plugin');
      assert.strictEqual(result.author.name, 'cbuntingde');
      assert.strictEqual(result.author.email, 'cbuntingde@gmail.com');
    });

    it('creates plugin.json with custom author', () => {
      const result = createPluginJson({
        name: 'custom-plugin',
        description: 'Custom plugin',
        version: '2.0.0',
        authorName: 'Custom Author',
        authorEmail: 'custom@example.com'
      });

      assert.strictEqual(result.version, '2.0.0');
      assert.strictEqual(result.author.name, 'Custom Author');
      assert.strictEqual(result.author.email, 'custom@example.com');
    });
  });

  describe('validatePluginMetadata()', () => {
    it('returns error for missing plugin.json', () => {
      const result = validatePluginMetadata('/nonexistent/path');
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.length > 0);
    });

    it('validates required fields', () => {
      const result = validatePluginMetadata('/nonexistent');
      // The function returns errors for missing plugin.json or missing fields
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.length > 0);
    });
  });
});

// ============================================================================
// Validation Module Tests
// ============================================================================

describe('validation.js', () => {
  describe('sanitizeInput()', () => {
    it('removes HTML tags when stripHtml is true', () => {
      const result = sanitizeInput('<div>Hello</div><span>World</span>', { stripHtml: true });
      assert.ok(!result.includes('<div>'));
      assert.ok(!result.includes('<span>'));
      assert.ok(result.includes('Hello'));
      assert.ok(result.includes('World'));
    });

    it('removes dangerous characters when allowSpecialChars is false', () => {
      const result = sanitizeInput('Test <>"\'&', { allowSpecialChars: false });
      assert.ok(!result.includes('<'));
      assert.ok(!result.includes('>'));
    });

    it('enforces maxLength limit', () => {
      const longInput = 'a'.repeat(20000);
      const result = sanitizeInput(longInput, { maxLength: 1000 });
      assert.strictEqual(result.length, 1000);
    });

    it('rejects non-string input', () => {
      assert.throws(() => sanitizeInput(123), /Input must be a string/);
      assert.throws(() => sanitizeInput(null), /Input must be a string/);
    });
  });

  describe('validateFilePath()', () => {
    it('accepts safe relative paths', () => {
      const result = validateFilePath('docs/readme.md', '/base');
      assert.strictEqual(result.valid, true);
      assert.ok(result.sanitizedPath?.endsWith('docs/readme.md'));
    });

    it('rejects path traversal attempts', () => {
      const result = validateFilePath('../../etc/passwd', '/base');
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.error, 'Path traversal detected');
    });

    it('rejects null bytes', () => {
      const result = validateFilePath('file\x00name.txt', '/base');
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.error, 'Null bytes not allowed');
    });

    it('rejects paths outside base directory', () => {
      // Using a path that goes to /base/../../../other which resolves to /other
      const result = validateFilePath('../../../other/file.txt', '/base/dir');
      assert.strictEqual(result.valid, false);
      // This should be caught as path traversal due to multiple ..
      assert.ok(['Path traversal detected', 'Path outside base directory'].includes(result.error));
    });

    it('rejects empty path', () => {
      const result = validateFilePath('', '/base');
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.error, 'Invalid file path');
    });
  });

  describe('validateUrl()', () => {
    it('accepts valid HTTPS URLs', () => {
      const result = validateUrl('https://example.com/path?query=value');
      assert.strictEqual(result.valid, true);
    });

    it('accepts HTTP URLs', () => {
      const result = validateUrl('http://example.com');
      assert.strictEqual(result.valid, true);
    });

    it('rejects localhost URLs', () => {
      const result = validateUrl('http://localhost:8080');
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.error, 'Localhost URLs not allowed');
    });

    it('rejects private IP addresses (10.x.x.x)', () => {
      const result = validateUrl('https://10.0.0.1/api');
      assert.strictEqual(result.valid, false);
    });

    it('rejects private IP addresses (192.168.x.x)', () => {
      const result = validateUrl('https://192.168.1.100/api');
      assert.strictEqual(result.valid, false);
    });

    it('rejects private IP addresses (172.16-31.x.x)', () => {
      const result = validateUrl('https://172.20.0.1/api');
      assert.strictEqual(result.valid, false);
    });

    it('rejects 127.0.0.1', () => {
      const result = validateUrl('https://127.0.0.1:3000');
      assert.strictEqual(result.valid, false);
    });

    it('rejects invalid URL format', () => {
      const result = validateUrl('not-a-url');
      assert.strictEqual(result.valid, false);
    });
  });

  describe('validateIdentifier()', () => {
    it('accepts valid variable names', () => {
      assert.strictEqual(validateIdentifier('myVariable').valid, true);
      assert.strictEqual(validateIdentifier('_privateVar').valid, true);
      assert.strictEqual(validateIdentifier('$special').valid, true);
    });

    it('rejects invalid variable names', () => {
      assert.strictEqual(validateIdentifier('123invalid').valid, false);
      assert.strictEqual(validateIdentifier('has-dash').valid, false);
    });

    it('accepts valid class names', () => {
      assert.strictEqual(validateIdentifier('MyClass', 'class').valid, true);
      assert.strictEqual(validateIdentifier('UserController', 'class').valid, true);
    });

    it('rejects lowercase class names', () => {
      assert.strictEqual(validateIdentifier('myClass', 'class').valid, false);
    });

    it('rejects reserved words', () => {
      assert.strictEqual(validateIdentifier('if', 'variable').valid, false);
      assert.strictEqual(validateIdentifier('function', 'variable').valid, false);
      assert.strictEqual(validateIdentifier('class', 'variable').valid, false);
    });

    it('rejects empty or non-string input', () => {
      assert.strictEqual(validateIdentifier('').valid, false);
      assert.strictEqual(validateIdentifier(null).valid, false);
    });

    it('accepts valid file names', () => {
      assert.strictEqual(validateIdentifier('my-file.js', 'file').valid, true);
      assert.strictEqual(validateIdentifier('file_name.txt', 'file').valid, true);
    });
  });

  describe('sanitizeMarkdown()', () => {
    it('removes script tags', () => {
      const result = sanitizeMarkdown('<script>alert(1)</script>Hello');
      assert.ok(!result.includes('<script>'));
      assert.ok(result.includes('Hello'));
    });

    it('removes event handlers', () => {
      const result = sanitizeMarkdown('<div onclick="alert(1)">Click me</div>');
      assert.ok(!result.includes('onclick'));
    });

    it('blocks javascript: protocol', () => {
      const result = sanitizeMarkdown('[link](javascript:alert(1))');
      assert.ok(!result.includes('javascript:'));
    });

    it('handles non-string input', () => {
      assert.strictEqual(sanitizeMarkdown(null), '');
      assert.strictEqual(sanitizeMarkdown(undefined), '');
      assert.strictEqual(sanitizeMarkdown(123), '');
    });
  });
});

// ============================================================================
// Template Module Tests
// ============================================================================

describe('templates.js', () => {
  describe('generateReadmeTemplate()', () => {
    it('generates README with required sections', () => {
      const result = generateReadmeTemplate({
        name: 'my-plugin',
        description: 'A test plugin',
        installation: 'npm install my-plugin',
        usage: 'Use /test command'
      });

      assert.ok(result.includes('# My Plugin'));
      assert.ok(result.includes('## Installation'));
      assert.ok(result.includes('## Usage'));
      assert.ok(result.includes('## Author'));
    });

    it('includes features when provided', () => {
      const result = generateReadmeTemplate({
        name: 'feature-plugin',
        description: 'Feature plugin',
        installation: 'npm i',
        usage: 'Run it',
        features: ['Feature A', 'Feature B']
      });

      assert.ok(result.includes('## Features'));
      assert.ok(result.includes('- Feature A'));
      assert.ok(result.includes('- Feature B'));
    });

    it('includes configuration when provided', () => {
      const result = generateReadmeTemplate({
        name: 'config-plugin',
        description: 'Config plugin',
        installation: 'npm i',
        usage: 'Use it',
        configuration: 'Set API_KEY env var'
      });

      assert.ok(result.includes('## Configuration'));
      assert.ok(result.includes('Set API_KEY env var'));
    });
  });

  describe('generateCommandTemplate()', () => {
    it('generates command documentation', () => {
      const result = generateCommandTemplate({
        name: 'my-command',
        description: 'Does something useful',
        parameters: [
          { name: 'input', type: 'string', required: true, description: 'Input value' }
        ],
        examples: [
          { title: 'Basic usage', code: '/my-command hello' }
        ]
      });

      assert.ok(result.includes('# my-command'));
      assert.ok(result.includes('## Parameters'));
      assert.ok(result.includes('## Usage'));
    });

    it('handles no parameters case', () => {
      const result = generateCommandTemplate({
        name: 'simple-command',
        description: 'Simple command',
        parameters: [],
        examples: []
      });

      assert.ok(result.includes('No parameters required'));
    });

    it('includes notes when provided', () => {
      const result = generateCommandTemplate({
        name: 'noted-command',
        description: 'Command with notes',
        parameters: [],
        examples: [],
        notes: ['Note 1', 'Note 2']
      });

      assert.ok(result.includes('## Notes'));
      assert.ok(result.includes('- Note 1'));
    });
  });

  describe('generateAgentTemplate()', () => {
    it('generates agent documentation', () => {
      const result = generateAgentTemplate({
        name: 'my-agent',
        description: 'An agent that does stuff',
        capabilities: ['Capability 1', 'Capability 2'],
        workflow: 'Step 1, Step 2, Step 3',
        outputFormat: 'JSON object'
      });

      assert.ok(result.includes('# my-agent'));
      assert.ok(result.includes('## Capabilities'));
      assert.ok(result.includes('- Capability 1'));
      assert.ok(result.includes('## Workflow'));
      assert.ok(result.includes('## Output Format'));
    });
  });

  describe('generateHookJson()', () => {
    it('generates valid JSON', () => {
      const result = generateHookJson({
        name: 'my-hook',
        description: 'A test hook',
        events: ['PostToolUse'],
        conditions: { tool: 'Write' },
        action: { type: 'suggest' }
      });

      const parsed = JSON.parse(result);
      assert.strictEqual(parsed.name, 'my-hook');
      assert.strictEqual(parsed.description, 'A test hook');
      assert.deepStrictEqual(parsed.events, ['PostToolUse']);
    });
  });

  describe('generateSkillTemplate()', () => {
    it('generates skill documentation', () => {
      const result = generateSkillTemplate({
        name: 'my-skill',
        description: 'A useful skill',
        commands: [
          { name: 'cmd1', description: 'Command 1' },
          { name: 'cmd2', description: 'Command 2' }
        ],
        agents: [
          { name: 'agent1', description: 'Agent 1' }
        ],
        usage: 'Use the commands'
      });

      assert.ok(result.includes('# my-skill'));
      assert.ok(result.includes('/cmd1'));
      assert.ok(result.includes('Command 1'));
      assert.ok(result.includes('@agent1'));
    });
  });
});

// ============================================================================
// Run Tests
// ============================================================================

console.log('Running shared-utils test suite...\n');