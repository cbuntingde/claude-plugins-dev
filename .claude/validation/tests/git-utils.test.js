#!/usr/bin/env node
/**
 * Git Utils Tests
 */

import { gitExec, getModifiedPlugins, validatePluginName } from '../git-utils.js';

describe('gitExec', () => {
  describe('valid git commands', () => {
    it('should execute git status successfully', () => {
      const result = gitExec(['status', '--porcelain'], { cwd: process.cwd(), timeout: 5000 });
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('stdout');
      expect(result).toHaveProperty('stderr');
      expect(result).toHaveProperty('duration');
    });

    it('should handle timeout for long-running commands', () => {
      const result = gitExec(['status'], { cwd: process.cwd(), timeout: 1 });
      // Either success or timeout, should not hang
      expect(result).toHaveProperty('timedOut');
    });
  });

  describe('invalid git commands', () => {
    it('should handle invalid command gracefully', () => {
      const result = gitExec(['invalid-command-xyz'], { timeout: 5000 });
      expect(result.success).toBe(false);
      expect(result.stderr.length).toBeGreaterThan(0);
    });
  });
});

describe('getModifiedPlugins', () => {
  it('should return modified plugins array', () => {
    const result = getModifiedPlugins(process.cwd());
    expect(result).toHaveProperty('modifiedPlugins');
    expect(Array.isArray(result.modifiedPlugins)).toBe(true);
    expect(result).toHaveProperty('error');
    expect(result).toHaveProperty('timedOut');
  });
});

describe('validatePluginName', () => {
  describe('valid names', () => {
    it('should accept valid kebab-case names', () => {
      const result = validatePluginName('my-plugin');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept valid snake_case names', () => {
      const result = validatePluginName('my_plugin');
      expect(result.valid).toBe(true);
    });

    it('should accept names with numbers', () => {
      const result = validatePluginName('plugin123');
      expect(result.valid).toBe(true);
    });

    it('should accept names with hyphens and underscores', () => {
      const result = validatePluginName('my_awesome-plugin123');
      expect(result.valid).toBe(true);
    });
  });

  describe('invalid names', () => {
    it('should reject empty string', () => {
      const result = validatePluginName('');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject null', () => {
      const result = validatePluginName(null);
      expect(result.valid).toBe(false);
    });

    it('should reject undefined', () => {
      const result = validatePluginName(undefined);
      expect(result.valid).toBe(false);
    });

    it('should reject names with slashes', () => {
      const result = validatePluginName('plugin/path');
      expect(result.valid).toBe(false);
    });

    it('should reject names with backslashes', () => {
      const result = validatePluginName('plugin\\path');
      expect(result.valid).toBe(false);
    });

    it('should reject names with path traversal', () => {
      const result = validatePluginName('..');
      expect(result.valid).toBe(false);
    });

    it('should reject names with dots', () => {
      const result = validatePluginName('plugin.name');
      expect(result.valid).toBe(false);
    });

    it('should reject reserved names', () => {
      const reserved = ['con', 'prn', 'aux', 'nul', 'com1', 'lpt1'];
      for (const name of reserved) {
        const result = validatePluginName(name);
        expect(result.valid).toBe(false);
      }
    });

    it('should reject names exceeding max length', () => {
      const result = validatePluginName('a'.repeat(101));
      expect(result.valid).toBe(false);
    });

    it('should reject names with special characters', () => {
      const result = validatePluginName('plugin@name');
      expect(result.valid).toBe(false);
    });
  });
});