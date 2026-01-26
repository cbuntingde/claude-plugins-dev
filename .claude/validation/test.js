#!/usr/bin/env node
/**
 * Test Runner for Validation Modules
 * Uses Node's built-in test runner
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, writeFileSync, mkdirSync, rmSync } from 'fs';

const __dirname = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const TEST_DIR = join(__dirname, '.claude', 'validation', 'test-temp');
const TEST_FILE = join(TEST_DIR, 'test.json');

// Import modules
const { createLogger } = await import('./logger.js');
const { gitExec, getModifiedPlugins, validatePluginName } = await import('./git-utils.js');
const { createCircuitBreaker, createCircuitBreakerRegistry, CIRCUIT_STATE } = await import('./circuit-breaker.js');
const { safeReadFile, safeReadJson, safeReaddir, safeStat, validateFilePath } = await import('./file-utils.js');
const { createMetrics, createValidationMetrics } = await import('./metrics.js');

console.log('Running validation module tests...\n');

// ========== LOGGER TESTS ==========

test('createLogger - should log at all levels without throwing', () => {
  const logger = createLogger({ level: 'DEBUG', json: false, service: 'test' });
  // Logger methods return undefined, just ensure they don't throw
  logger.debug('debug');
  logger.info('info');
  logger.warn('warn');
  logger.error('error');
  logger.fatal('fatal');
  assert.ok(true);
});

test('createLogger - should log metrics without throwing', () => {
  const logger = createLogger({ level: 'INFO', json: false, service: 'test' });
  logger.metric('test_metric', 100, { tag: 'value' });
  assert.ok(true);
});

// ========== GIT UTILS TESTS ==========

test('gitExec - should execute git status', () => {
  const result = gitExec(['status', '--porcelain'], { cwd: process.cwd(), timeout: 5000 });
  assert.ok(typeof result.success === 'boolean');
  assert.ok(typeof result.duration === 'number');
});

test('gitExec - should handle timeout', () => {
  const result = gitExec(['status'], { cwd: process.cwd(), timeout: 1 });
  assert.ok(result.timedOut !== undefined);
});

test('gitExec - should handle invalid command', () => {
  const result = gitExec(['invalid-command-xyz'], { timeout: 5000 });
  assert.strictEqual(result.success, false);
});

test('validatePluginName - should accept valid names', () => {
  assert.ok(validatePluginName('my-plugin').valid);
  assert.ok(validatePluginName('my_plugin').valid);
  assert.ok(validatePluginName('plugin123').valid);
});

test('validatePluginName - should reject invalid names', () => {
  assert.ok(!validatePluginName('').valid);
  assert.ok(!validatePluginName(null).valid);
  assert.ok(!validatePluginName('/path').valid);
  assert.ok(!validatePluginName('..').valid);
  assert.ok(!validatePluginName('con').valid);
  assert.ok(!validatePluginName('plugin/name').valid);
  assert.ok(!validatePluginName('a'.repeat(101)).valid);
});

test('validatePluginName - should accept maximum length', () => {
  const result = validatePluginName('a'.repeat(100));
  assert.ok(result.valid);
});

// ========== CIRCUIT BREAKER TESTS ==========

test('createCircuitBreaker - should start in CLOSED state', async () => {
  const breaker = createCircuitBreaker({ failureThreshold: 3, successThreshold: 2, timeout: 100 });
  const state = breaker.getState();
  assert.strictEqual(state.state, CIRCUIT_STATE.CLOSED);
});

test('createCircuitBreaker - should execute successfully', async () => {
  const breaker = createCircuitBreaker({ failureThreshold: 3 });
  const result = await breaker.execute(() => Promise.resolve('success'));
  assert.strictEqual(result, 'success');
});

test('createCircuitBreaker - should count failures', async () => {
  const breaker = createCircuitBreaker({ failureThreshold: 3 });
  try { await breaker.execute(() => Promise.reject(new Error('fail'))); } catch {}
  const state = breaker.getState();
  assert.strictEqual(state.failureCount, 1);
});

test('createCircuitBreaker - should open after failure threshold', async () => {
  const breaker = createCircuitBreaker({ failureThreshold: 2, timeout: 100 });
  try { await breaker.execute(() => Promise.reject(new Error('fail'))); } catch {}
  try { await breaker.execute(() => Promise.reject(new Error('fail'))); } catch {}
  const state = breaker.getState();
  assert.strictEqual(state.state, CIRCUIT_STATE.OPEN);
});

test('createCircuitBreaker - should transition to HALF_OPEN after timeout', async () => {
  const breaker = createCircuitBreaker({ failureThreshold: 1, timeout: 50 });
  try { await breaker.execute(() => Promise.reject(new Error('fail'))); } catch {}
  await new Promise(resolve => setTimeout(resolve, 100));
  const result = await breaker.execute(() => Promise.resolve('test'));
  assert.strictEqual(result, 'test');
  assert.strictEqual(breaker.getState().state, CIRCUIT_STATE.HALF_OPEN);
});

test('createCircuitBreaker - reset should clear state', async () => {
  const breaker = createCircuitBreaker({ failureThreshold: 1, timeout: 50 });
  try { await breaker.execute(() => Promise.reject(new Error('fail'))); } catch {}
  breaker.reset();
  const state = breaker.getState();
  assert.strictEqual(state.state, CIRCUIT_STATE.CLOSED);
  assert.strictEqual(state.failureCount, 0);
});

test('createCircuitBreakerRegistry - should manage multiple breakers', async () => {
  const registry = createCircuitBreakerRegistry();
  const b1 = registry.getOrCreate('test1');
  const b2 = registry.getOrCreate('test2');
  assert.ok(b1 !== b2);
  assert.strictEqual(registry.getOrCreate('test1'), b1);

  const states = registry.getAllStates();
  assert.ok('test1' in states);
  assert.ok('test2' in states);
});

// ========== FILE UTILS TESTS ==========

test('safeReadFile - should read existing file', () => {
  if (!existsSync(TEST_DIR)) mkdirSync(TEST_DIR, { recursive: true });
  writeFileSync(TEST_FILE, '{"test": "data"}', 'utf-8');

  const result = safeReadFile(TEST_FILE);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.content, '{"test": "data"}');
});

test('safeReadFile - should handle missing file', () => {
  const result = safeReadFile('/nonexistent/path/file.txt');
  assert.strictEqual(result.success, false);
  assert.strictEqual(result.error, 'ENOENT');
});

test('safeReadJson - should parse valid JSON', () => {
  writeFileSync(TEST_FILE, '{"name": "test"}', 'utf-8');
  const result = safeReadJson(TEST_FILE);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.data.name, 'test');
});

test('safeReadJson - should handle invalid JSON', () => {
  writeFileSync(TEST_FILE, 'not valid json', 'utf-8');
  const result = safeReadJson(TEST_FILE);
  assert.strictEqual(result.success, false);
  assert.strictEqual(result.error, 'JSON_PARSE_ERROR');
});

test('safeReaddir - should read directory', () => {
  if (!existsSync(TEST_DIR)) mkdirSync(TEST_DIR, { recursive: true });
  writeFileSync(join(TEST_DIR, 'file1.txt'), '');
  writeFileSync(join(TEST_DIR, 'file2.txt'), '');

  const result = safeReaddir(TEST_DIR);
  assert.strictEqual(result.success, true);
  assert.ok(result.entries.length >= 2);
});

test('safeReaddir - should handle missing directory', () => {
  const result = safeReaddir('/nonexistent/directory');
  assert.strictEqual(result.success, false);
});

test('safeStat - should stat existing file', () => {
  if (!existsSync(TEST_DIR)) mkdirSync(TEST_DIR, { recursive: true });
  writeFileSync(TEST_FILE, 'test', 'utf-8');

  const result = safeStat(TEST_FILE);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.isFile, true);
});

test('safeStat - should handle missing path', () => {
  const result = safeStat('/nonexistent/path');
  assert.strictEqual(result.success, false);
});

test('validateFilePath - should accept relative paths', () => {
  const result = validateFilePath('plugins/my-plugin');
  assert.strictEqual(result.valid, true);
});

test('validateFilePath - should reject absolute paths', () => {
  assert.strictEqual(validateFilePath('/etc/passwd').valid, false);
  assert.strictEqual(validateFilePath('C:\\Windows\\System32').valid, false);
});

test('validateFilePath - should reject path traversal', () => {
  assert.strictEqual(validateFilePath('../../etc/passwd').valid, false);
});

test('validateFilePath - should reject null bytes', () => {
  assert.strictEqual(validateFilePath('file\0name').valid, false);
});

// ========== METRICS TESTS ==========

test('createMetrics - should increment counter', () => {
  const metrics = createMetrics({ service: 'test', prefix: 'test_' });
  metrics.counter('test_counter', 1);
  const result = metrics.getMetrics();
  assert.strictEqual(result.counters['test_test_counter'].value, 1);
});

test('createMetrics - should set gauge', () => {
  const metrics = createMetrics({ service: 'test', prefix: 'test_' });
  metrics.gauge('test_gauge', 100);
  const result = metrics.getMetrics();
  assert.strictEqual(result.gauges['test_test_gauge'].value, 100);
});

test('createMetrics - should record histogram', () => {
  const metrics = createMetrics({ service: 'test', prefix: 'test_' });
  metrics.histogram('test_histogram', 10);
  metrics.histogram('test_histogram', 20);
  metrics.histogram('test_histogram', 30);
  const result = metrics.getMetrics();

  const hist = result.histograms['test_test_histogram'];
  assert.strictEqual(hist.count, 3);
  assert.strictEqual(hist.min, 10);
  assert.strictEqual(hist.max, 30);
});

test('createMetrics - should calculate percentiles', () => {
  const metrics = createMetrics({ service: 'test', prefix: 'test_' });
  for (let i = 1; i <= 100; i++) {
    metrics.histogram('test_histogram', i);
  }
  const result = metrics.getMetrics();

  const hist = result.histograms['test_test_histogram'];
  assert.strictEqual(hist.p50, 50);
  assert.strictEqual(hist.p95, 95);
  assert.strictEqual(hist.p99, 99);
});

test('createMetrics - should reset all metrics', () => {
  const metrics = createMetrics({ service: 'test', prefix: 'test_' });
  metrics.counter('test_counter', 1);
  metrics.gauge('test_gauge', 100);
  metrics.reset();

  const result = metrics.getMetrics();
  assert.strictEqual(Object.keys(result.counters).length, 0);
  assert.strictEqual(Object.keys(result.gauges).length, 0);
});

// ========== VALIDATION METRICS TESTS ==========

test('createValidationMetrics - should record plugin attempts', () => {
  const metrics = createValidationMetrics();
  metrics.recordPluginAttempt('test-plugin');
  const result = metrics.getMetrics();
  assert.ok('validator_plugin_validation_attempts' in result.counters);
});

test('createValidationMetrics - should record plugin success', () => {
  const metrics = createValidationMetrics();
  metrics.recordPluginSuccess('test-plugin', 'full', 100);
  const result = metrics.getMetrics();
  assert.strictEqual(result.counters['validator_plugin_validation_success'].value, 1);
});

test('createValidationMetrics - should record check results', () => {
  const metrics = createValidationMetrics();
  metrics.recordCheck('plugin.json schema', true);
  metrics.recordCheck('package.json', false);
  const result = metrics.getMetrics();
  assert.strictEqual(result.counters['validator_checks_passed'].value, 1);
  assert.strictEqual(result.counters['validator_checks_failed'].value, 1);
});

test('createValidationMetrics - should record run lifecycle', () => {
  const metrics = createValidationMetrics();
  metrics.recordRunStart();
  metrics.recordRunEnd(true);

  const result = metrics.getMetrics();
  assert.strictEqual(result.gauges['validator_validation_run_active'].value, 0);
  assert.strictEqual(result.counters['validator_validation_runs'].tags.outcome, 'success');
});

// Cleanup
test('cleanup - remove test files', () => {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
  assert.ok(true);
});

console.log('\n✓ All tests completed');