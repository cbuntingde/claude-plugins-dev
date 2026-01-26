/**
 * Plugin metadata utilities
 * Ensures consistent plugin.json structure across all plugins
 */

import fs from 'fs';
import path from 'path';

const REQUIRED_FIELDS = ['name', 'version', 'description', 'author'];
const AUTHOR_FIELDS = ['name', 'email'];

/**
 * Validates plugin.json structure
 * @param {string} pluginPath - Path to plugin directory
 * @returns {{ valid: boolean, errors: string[], metadata: object|null }}
 */
export function validatePluginMetadata(pluginPath) {
  const errors = [];
  let metadata = null;

  try {
    const pluginJsonPath = path.join(pluginPath, '.claude-plugin', 'plugin.json');

    if (!fs.existsSync(pluginJsonPath)) {
      return { valid: false, errors: ['plugin.json not found at .claude-plugin/plugin.json'], metadata: null };
    }

    const content = fs.readFileSync(pluginJsonPath, 'utf-8');
    metadata = JSON.parse(content);

    // Check required fields
    for (const field of REQUIRED_FIELDS) {
      if (!metadata[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate author structure
    if (metadata.author) {
      for (const field of AUTHOR_FIELDS) {
        if (!metadata.author[field]) {
          errors.push(`Missing required author field: ${field}`);
        }
      }
    }

    // Validate version format (semver)
    if (metadata.version && !/^\d+\.\d+\.\d+$/.test(metadata.version)) {
      errors.push('Version must be in semver format (x.y.z)');
    }

    // Validate name format
    if (metadata.name && !/^[a-z0-9-]+$/.test(metadata.name)) {
      errors.push('Plugin name must be lowercase with hyphens only');
    }

    return { valid: errors.length === 0, errors, metadata };

  } catch (error) {
    return { valid: false, errors: [`Parse error: ${error.message}`], metadata: null };
  }
}

/**
 * Creates a standardized plugin.json template
 * @param {object} params - Plugin parameters
 * @returns {object} Standardized plugin.json
 */
export function createPluginJson({ name, version = '1.0.0', description, authorName, authorEmail }) {
  return {
    name,
    version,
    description,
    author: {
      name: authorName || 'cbuntingde',
      email: authorEmail || 'cbuntingde@gmail.com'
    }
  };
}

/**
 * Validates README.md exists and has required sections
 * @param {string} pluginPath - Path to plugin directory
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateReadme(pluginPath) {
  const errors = [];
  const readmePath = path.join(pluginPath, 'README.md');

  if (!fs.existsSync(readmePath)) {
    return { valid: false, errors: ['README.md not found'] };
  }

  const content = fs.readFileSync(readmePath, 'utf-8');
  const requiredSections = ['Description', 'Installation', 'Usage'];
  const contentLower = content.toLowerCase();

  for (const section of requiredSections) {
    if (!contentLower.includes(section.toLowerCase())) {
      errors.push(`Missing README section: ${section}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export default {
  validatePluginMetadata,
  createPluginJson,
  validateReadme
};