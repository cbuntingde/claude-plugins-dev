#!/usr/bin/env node
/**
 * Git Utilities Module
 * Safe git operations with timeouts and error handling
 */

import { spawnSync } from 'child_process';
import { join } from 'path';

/**
 * Git operation timeout in milliseconds
 */
const GIT_TIMEOUT = 5000;

/**
 * Safely executes a git command with timeout
 * @param {string[]} args - Git command arguments
 * @param {Object} options - Execution options
 * @param {string} options.cwd - Working directory
 * @param {number} options.timeout - Timeout in ms
 * @returns {Object} Result with success, stdout, stderr
 */
export function gitExec(args, options = {}) {
  const {
    cwd = process.cwd(),
    timeout = GIT_TIMEOUT
  } = options;

  const startTime = Date.now();
  let result;

  try {
    result = spawnSync('git', args, {
      cwd,
      encoding: 'utf-8',
      timeout,
      maxBuffer: 1024 * 1024, // 1MB max output
      windowsHide: true
    });

    const duration = Date.now() - startTime;

    return {
      success: result.status === 0,
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      duration,
      timedOut: false
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      return {
        success: false,
        stdout: '',
        stderr: 'Command timed out',
        duration,
        timedOut: true
      };
    }

    return {
      success: false,
      stdout: '',
      stderr: error.message || 'Unknown error',
      duration,
      timedOut: false,
      error: error.code
    };
  }
}

/**
 * Gets modified plugins from git status
 * @param {string} rootDir - Root directory of the project
 * @returns {Object} Result with modified plugins array and any errors
 */
export function getModifiedPlugins(rootDir) {
  const result = gitExec(['status', '--porcelain'], { cwd: rootDir });

  if (!result.success && !result.timedOut) {
    return {
      modifiedPlugins: [],
      error: `Git status failed: ${result.stderr}`,
      timedOut: result.timedOut
    };
  }

  if (result.timedOut) {
    return {
      modifiedPlugins: [],
      error: 'Git status timed out',
      timedOut: true
    };
  }

  const pluginDirs = new Set();

  for (const line of result.stdout.trim().split('\n')) {
    if (!line.trim()) continue;

    // Extract file path (status chars are at positions 0-2)
    const filePath = line.substring(3).trim();

    // Check if file is under plugins/
    if (filePath.startsWith('plugins/')) {
      // Extract plugin name (first directory after plugins/)
      const parts = filePath.split('/');
      if (parts.length >= 2) {
        const pluginName = parts[1];
        if (pluginName && pluginName !== 'node_modules') {
          pluginDirs.add(pluginName);
        }
      }
    }
  }

  return {
    modifiedPlugins: Array.from(pluginDirs),
    error: null,
    timedOut: false
  };
}

/**
 * Validates a plugin name to prevent path traversal
 * @param {string} name - Plugin name to validate
 * @returns {Object} Validation result
 */
export function validatePluginName(name) {
  const errors = [];

  if (!name || typeof name !== 'string') {
    return { valid: false, errors: ['Plugin name must be a non-empty string'] };
  }

  if (name.length > 100) {
    errors.push('Plugin name exceeds maximum length of 100 characters');
  }

  // Only allow alphanumeric characters, hyphens, and underscores
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    errors.push('Plugin name contains invalid characters. Only a-z, A-Z, 0-9, hyphens, and underscores are allowed');
  }

  // Block common path traversal attempts
  const traversalPatterns = ['..', '.', '/', '\\', '%00'];
  for (const pattern of traversalPatterns) {
    if (name.includes(pattern)) {
      errors.push(`Plugin name contains path traversal pattern: ${pattern}`);
    }
  }

  // Block reserved names
  const reservedNames = ['con', 'prn', 'aux', 'nul', 'com1', 'com2', 'com3', 'com4', 'com5',
    'com6', 'com7', 'com8', 'com9', 'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6',
    'lpt7', 'lpt8', 'lpt9'];
  if (reservedNames.includes(name.toLowerCase())) {
    errors.push('Plugin name is a reserved system name');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export default {
  gitExec,
  getModifiedPlugins,
  validatePluginName
};