#!/usr/bin/env node
/**
 * File System Utilities Module
 * Safe file operations with timeout handling and error recovery
 */

import {
  readFileSync,
  readdirSync,
  existsSync,
  statSync,
  readFile
} from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Default timeout for file operations in milliseconds
 */
const DEFAULT_TIMEOUT = 5000;

/**
 * Reads a file with timeout
 * @param {string} filePath - Path to file
 * @param {Object} options - Options
 * @param {string} options.encoding - File encoding (default: utf-8)
 * @param {number} options.timeout - Timeout in ms
 * @returns {Object} Result with content or error
 */
export function readFileWithTimeout(filePath, options = {}) {
  const { encoding = 'utf-8', timeout = DEFAULT_TIMEOUT } = options;

  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      resolve({
        success: false,
        error: 'ETIMEDOUT',
        message: `Read timeout for file: ${filePath}`
      });
    }, timeout);

    readFile(filePath, encoding, (err, content) => {
      clearTimeout(timeoutId);

      if (err) {
        resolve({
          success: false,
          error: err.code,
          message: err.message,
          path: filePath
        });
      } else {
        resolve({
          success: true,
          content,
          path: filePath
        });
      }
    });
  });
}

/**
 * Synchronously reads a file with error handling
 * @param {string} filePath - Path to file
 * @param {string} encoding - File encoding
 * @returns {Object} Result with content or error
 */
export function safeReadFile(filePath, encoding = 'utf-8') {
  try {
    if (!existsSync(filePath)) {
      return {
        success: false,
        error: 'ENOENT',
        message: `File not found: ${filePath}`
      };
    }

    const content = readFileSync(filePath, encoding);
    return {
      success: true,
      content,
      path: filePath
    };
  } catch (error) {
    return {
      success: false,
      error: error.code,
      message: error.message,
      path: filePath
    };
  }
}

/**
 * Safely reads and parses JSON from a file
 * @param {string} filePath - Path to JSON file
 * @param {Object} options - Options
 * @returns {Object} Result with parsed JSON or error
 */
export function safeReadJson(filePath, options = {}) {
  const readResult = safeReadFile(filePath);

  if (!readResult.success) {
    return readResult;
  }

  try {
    const data = JSON.parse(readResult.content);
    return {
      success: true,
      data,
      path: filePath
    };
  } catch (error) {
    return {
      success: false,
      error: 'JSON_PARSE_ERROR',
      message: `Invalid JSON in ${filePath}: ${error.message}`,
      path: filePath,
      content: readResult.content.substring(0, 200)
    };
  }
}

/**
 * Safely gets directory contents with error handling
 * @param {string} dirPath - Path to directory
 * @returns {Object} Result with file list or error
 */
export function safeReaddir(dirPath) {
  try {
    if (!existsSync(dirPath)) {
      return {
        success: false,
        error: 'ENOENT',
        message: `Directory not found: ${dirPath}`
      };
    }

    const stats = statSync(dirPath);
    if (!stats.isDirectory()) {
      return {
        success: false,
        error: 'ENOTDIR',
        message: `Path is not a directory: ${dirPath}`
      };
    }

    const entries = readdirSync(dirPath);
    return {
      success: true,
      entries,
      path: dirPath
    };
  } catch (error) {
    return {
      success: false,
      error: error.code,
      message: error.message,
      path: dirPath
    };
  }
}

/**
 * Safely gets file/directory stats
 * @param {string} path - Path to file or directory
 * @returns {Object} Result with stats or error
 */
export function safeStat(path) {
  try {
    if (!existsSync(path)) {
      return {
        success: false,
        error: 'ENOENT',
        message: `Path not found: ${path}`
      };
    }

    const stats = statSync(path);
    return {
      success: true,
      stats,
      path,
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile()
    };
  } catch (error) {
    return {
      success: false,
      error: error.code,
      message: error.message,
      path
    };
  }
}

/**
 * Validates a file path to prevent path traversal
 * @param {string} filePath - File path to validate
 * @param {string} baseDir - Base directory for validation
 * @returns {Object} Validation result
 */
export function validateFilePath(filePath, baseDir = null) {
  const errors = [];

  if (!filePath || typeof filePath !== 'string') {
    return { valid: false, errors: ['File path must be a non-empty string'] };
  }

  // Block null bytes
  if (filePath.includes('\0')) {
    errors.push('File path contains null byte');
  }

  // Block path traversal
  if (filePath.includes('..')) {
    errors.push('File path contains path traversal sequence (..)');
  }

  // Block absolute paths
  if (filePath.startsWith('/') || /^[a-zA-Z]:/.test(filePath)) {
    errors.push('File path must be relative');
  }

  // Check resolved path is within base directory if specified
  if (baseDir) {
    const resolved = join(baseDir, filePath);
    const baseResolved = join(baseDir, '');

    if (!resolved.startsWith(baseResolved)) {
      errors.push('File path resolves outside allowed directory');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Gets all plugin directories from the plugins folder
 * @param {string} pluginsDir - Plugins directory path
 * @returns {Object} Result with plugin directories or error
 */
export function getPluginDirectories(pluginsDir) {
  const dirResult = safeReaddir(pluginsDir);

  if (!dirResult.success) {
    return dirResult;
  }

  const plugins = dirResult.entries
    .filter(name => name !== 'node_modules')
    .map(name => join(pluginsDir, name))
    .filter(path => {
      const statResult = safeStat(path);
      return statResult.success && statResult.isDirectory;
    });

  return {
    success: true,
    plugins,
    count: plugins.length
  };
}

export default {
  readFileWithTimeout,
  safeReadFile,
  safeReadJson,
  safeReaddir,
  safeStat,
  validateFilePath,
  getPluginDirectories
};