/**
 * Input validation utilities
 * OWASP A03:2021 - Injection prevention
 */

import fs from 'fs';
import path from 'path';

/**
 * Sanitizes user input for safe processing
 * @param {string} input - Raw user input
 * @param {object} options - Validation options
 * @returns {string} Sanitized input
 */
export function sanitizeInput(input, options = {}) {
  const {
    maxLength = 10000,
    allowNewlines = true,
    allowSpecialChars = false,
    stripHtml = true
  } = options;

  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }

  let sanitized = input.slice(0, maxLength);

  if (!allowNewlines) {
    sanitized = sanitized.replace(/[\r\n]/g, ' ');
  }

  if (stripHtml) {
    sanitized = sanitized.replace(/<[^>]*>/g, '');
    // Also remove script tag content which could contain XSS
    sanitized = sanitized.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  }

  if (!allowSpecialChars) {
    // Remove potentially dangerous characters
    sanitized = sanitized.replace(/[<>"\'\\\x00-\x1f\x7f]/g, '');
  }

  return sanitized.trim();
}

/**
 * Validates file path to prevent path traversal
 * @param {string} filePath - The file path to validate
 * @param {string} baseDir - The allowed base directory
 * @returns {{ valid: boolean, sanitizedPath: string|null, error: string|null }}
 */
export function validateFilePath(filePath, baseDir) {
  if (!filePath || typeof filePath !== 'string') {
    return { valid: false, sanitizedPath: null, error: 'Invalid file path' };
  }

  // Check for null bytes first - reject immediately
  if (filePath.includes('\0')) {
    return { valid: false, sanitizedPath: null, error: 'Null bytes not allowed' };
  }

  // Check for path traversal attempts
  if (filePath.includes('..') || filePath.includes('//')) {
    return { valid: false, sanitizedPath: null, error: 'Path traversal detected' };
  }

  // Resolve and verify it's within base directory
  const resolved = path.resolve(baseDir, filePath);
  const resolvedBase = path.resolve(baseDir);

  if (!resolved.startsWith(resolvedBase)) {
    return { valid: false, sanitizedPath: null, error: 'Path outside base directory' };
  }

  return { valid: true, sanitizedPath: resolved, error: null };
}

/**
 * Validates a URL is safe and well-formed
 * @param {string} url - URL to validate
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateUrl(url) {
  try {
    const parsed = new URL(url);

    // Only allow http and https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Only HTTP/HTTPS URLs allowed' };
    }

    // Block private IP addresses
    const hostname = parsed.hostname;
    if (/^(10\.\d{1,3}|192\.168|172\.(1[6-9]|2\d|3[01]))\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return { valid: false, error: 'Private IP addresses not allowed' };
    }

    // Block localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return { valid: false, error: 'Localhost URLs not allowed' };
    }

    return { valid: true, error: null };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Validates identifier names (for code generation, etc.)
 * @param {string} name - Name to validate
 * @param {string} type - Type of identifier (variable, function, class)
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateIdentifier(name, type = 'variable') {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name is required' };
  }

  const patterns = {
    variable: /^[a-zA-Z_$][a-zA-Z0-9_$]*$/,
    function: /^[a-zA-Z_$][a-zA-Z0-9_$]*$/,
    class: /^[A-Z][a-zA-Z0-9_]*$/,
    file: /^[a-zA-Z0-9._-]+$/
  };

  const pattern = patterns[type] || patterns.variable;
  if (!pattern.test(name)) {
    return { valid: false, error: `Invalid ${type} name: ${name}` };
  }

  // Check for reserved words
  const reservedWords = new Set(['if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'return', 'function', 'class', 'var', 'let', 'const', 'async', 'await']);
  if (reservedWords.has(name)) {
    return { valid: false, error: `Reserved word cannot be used: ${name}` };
  }

  return { valid: true, error: null };
}

/**
 * Sanitizes Markdown content to prevent XSS
 * @param {string} content - Markdown content
 * @returns {string} Sanitized content
 */
export function sanitizeMarkdown(content) {
  if (typeof content !== 'string') {
    return '';
  }

  // Remove script tags and event handlers
  let sanitized = content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, 'data-blocked:');

  return sanitized;
}

export default {
  sanitizeInput,
  validateFilePath,
  validateUrl,
  validateIdentifier,
  sanitizeMarkdown
};