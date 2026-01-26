#!/usr/bin/env node
/**
 * File Utils Tests
 */

import {
  safeReadFile,
  safeReadJson,
  safeReaddir,
  safeStat,
  validateFilePath
} from '../file-utils.js';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = join(dirname(fileURLToPath(import.meta.url)), '..');
const TEST_DIR = join(__dirname, 'test-temp');
const TEST_FILE = join(TEST_DIR, 'test.json');

describe('safeReadFile', () => {
  beforeAll(() => {
    if (!existsSync(TEST_DIR)) {
      mkdirSync(TEST_DIR, { recursive: true });
    }
    writeFileSync(TEST_FILE, '{"test": "data"}', 'utf-8');
  });

  afterAll(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it('should read existing file successfully', () => {
    const result = safeReadFile(TEST_FILE);
    expect(result.success).toBe(true);
    expect(result.content).toBe('{"test": "data"}');
  });

  it('should handle missing file', () => {
    const result = safeReadFile('/nonexistent/path/file.txt');
    expect(result.success).toBe(false);
    expect(result.error).toBe('ENOENT');
  });

  it('should return path in result', () => {
    const result = safeReadFile(TEST_FILE);
    expect(result.path).toBe(TEST_FILE);
  });
});

describe('safeReadJson', () => {
  beforeAll(() => {
    if (!existsSync(TEST_DIR)) {
      mkdirSync(TEST_DIR, { recursive: true });
    }
  });

  it('should parse valid JSON', () => {
    writeFileSync(TEST_FILE, '{"name": "test", "value": 123}', 'utf-8');
    const result = safeReadJson(TEST_FILE);
    expect(result.success).toBe(true);
    expect(result.data.name).toBe('test');
    expect(result.data.value).toBe(123);
  });

  it('should handle invalid JSON', () => {
    writeFileSync(TEST_FILE, 'not valid json', 'utf-8');
    const result = safeReadJson(TEST_FILE);
    expect(result.success).toBe(false);
    expect(result.error).toBe('JSON_PARSE_ERROR');
  });

  it('should handle missing file', () => {
    const result = safeReadJson('/nonexistent/file.json');
    expect(result.success).toBe(false);
  });
});

describe('safeReaddir', () => {
  beforeAll(() => {
    if (!existsSync(TEST_DIR)) {
      mkdirSync(TEST_DIR, { recursive: true });
    }
    // Create test files
    writeFileSync(join(TEST_DIR, 'file1.txt'), '');
    writeFileSync(join(TEST_DIR, 'file2.txt'), '');
  });

  afterAll(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it('should read directory contents', () => {
    const result = safeReaddir(TEST_DIR);
    expect(result.success).toBe(true);
    expect(Array.isArray(result.entries)).toBe(true);
    expect(result.entries.length).toBeGreaterThanOrEqual(2);
  });

  it('should handle missing directory', () => {
    const result = safeReaddir('/nonexistent/directory');
    expect(result.success).toBe(false);
    expect(result.error).toBe('ENOENT');
  });

  it('should return path in result', () => {
    const result = safeReaddir(TEST_DIR);
    expect(result.path).toBe(TEST_DIR);
  });
});

describe('safeStat', () => {
  beforeAll(() => {
    if (!existsSync(TEST_DIR)) {
      mkdirSync(TEST_DIR, { recursive: true });
    }
    writeFileSync(TEST_FILE, 'test', 'utf-8');
  });

  afterAll(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it('should stat existing file', () => {
    const result = safeStat(TEST_FILE);
    expect(result.success).toBe(true);
    expect(result.isFile).toBe(true);
  });

  it('should identify directories', () => {
    const result = safeStat(TEST_DIR);
    expect(result.success).toBe(true);
    expect(result.isDirectory).toBe(true);
  });

  it('should handle missing path', () => {
    const result = safeStat('/nonexistent/path');
    expect(result.success).toBe(false);
  });
});

describe('validateFilePath', () => {
  it('should accept relative paths', () => {
    const result = validateFilePath('plugins/my-plugin');
    expect(result.valid).toBe(true);
  });

  it('should reject absolute paths on Unix', () => {
    const result = validateFilePath('/etc/passwd');
    expect(result.valid).toBe(false);
  });

  it('should reject absolute paths on Windows', () => {
    const result = validateFilePath('C:\\Windows\\System32');
    expect(result.valid).toBe(false);
  });

  it('should reject path traversal', () => {
    const result = validateFilePath('../../etc/passwd');
    expect(result.valid).toBe(false);
  });

  it('should reject null bytes', () => {
    const result = validateFilePath('file\0name');
    expect(result.valid).toBe(false);
  });

  it('should validate path stays within base directory', () => {
    const result = validateFilePath('../outside', '/plugins');
    expect(result.valid).toBe(false);
  });

  it('should accept valid path within base directory', () => {
    const result = validateFilePath('my-plugin/package.json', '/plugins');
    expect(result.valid).toBe(true);
  });
});