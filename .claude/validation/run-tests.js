#!/usr/bin/env node
/**
 * Test Runner for Validation Modules
 * Runs Jest tests for all validation utilities
 */

import { spawnSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEST_DIR = join(__dirname, 'tests');
const NODE_MODULES_BIN = join(__dirname, '../../node_modules/.bin');

/**
 * Check if jest is installed, if not install it
 */
function ensureJestInstalled() {
  const jestPath = join(NODE_MODULES_BIN, 'jest');
  if (!existsSync(jestPath)) {
    console.log('Installing Jest...');
    const result = spawnSync('npm', ['install', '--save-dev', 'jest', 'jest-environment-jsdom'], {
      cwd: __dirname,
      encoding: 'utf-8',
      stdio: 'inherit'
    });

    if (result.status !== 0) {
      console.error('Failed to install Jest');
      process.exit(1);
    }
  }
}

/**
 * Run tests with Jest
 */
function runTests() {
  console.log('Running validation module tests...\n');

  const result = spawnSync('jest', [
    '--testMatch', '**/tests/*.test.js',
    '--testPathIgnorePatterns', '/node_modules/',
    '--collectCoverage',
    '--coverageDirectory', 'coverage',
    '--coverageReporters', ['text', 'lcov'],
    '--verbose',
    '--forceExit',
    '--detectOpenHandles'
  ], {
    cwd: __dirname,
    encoding: 'utf-8',
    stdio: 'inherit'
  });

  return result.status;
}

/**
 * Main entry point
 */
function main() {
  ensureJestInstalled();
  const exitCode = runTests();
  process.exit(exitCode);
}

main();