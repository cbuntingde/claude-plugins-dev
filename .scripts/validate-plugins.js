#!/usr/bin/env node
/**
 * Plugin validation script
 * Validates all plugins against schema and standards
 */

import fs from 'fs';
import path from 'path';
import Ajv from 'ajv';

const SCHEMA_PATH = path.join(process.cwd(), '.schema', 'plugin-schema.json');
const PLUGINS_PATH = path.join(process.cwd(), 'plugins');

const ajv = new Ajv({ allErrors: true });
let schema;
let validate;

try {
  schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf-8'));
  validate = ajv.compile(schema);
} catch (error) {
  console.error(`Failed to load schema: ${error.message}`);
  process.exit(1);
}

const results = {
  passed: 0,
  failed: 0,
  plugins: []
};

function validatePlugin(pluginPath) {
  const pluginName = path.basename(pluginPath);
  const pluginJsonPath = path.join(pluginPath, '.claude-plugin', 'plugin.json');

  const result = {
    name: pluginName,
    valid: true,
    errors: [],
    warnings: []
  };

  // Check plugin.json exists
  if (!fs.existsSync(pluginJsonPath)) {
    result.valid = false;
    result.errors.push('Missing .claude-plugin/plugin.json');
    results.failed++;
    results.plugins.push(result);
    return;
  }

  try {
    const pluginJson = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf-8'));

    // Validate against schema
    const schemaValid = validate(pluginJson);
    if (!schemaValid) {
      result.valid = false;
      result.errors.push(...validate.errors.map(e => `${e.instancePath}: ${e.message}`));
    }

    // Additional checks
    if (!pluginJson.name) result.errors.push('Missing required field: name');
    if (!pluginJson.version) result.errors.push('Missing required field: version');
    if (!pluginJson.description) result.errors.push('Missing required field: description');
    if (!pluginJson.author) result.errors.push('Missing required field: author');
    if (!pluginJson.author?.name) result.errors.push('Missing required field: author.name');
    if (!pluginJson.author?.email) result.errors.push('Missing required field: author.email');

    // Check README exists
    const readmePath = path.join(pluginPath, 'README.md');
    if (!fs.existsSync(readmePath)) {
      result.warnings.push('Missing README.md');
    }

    // Check directory structure
    const dirs = ['.claude-plugin'];
    for (const dir of dirs) {
      if (!fs.existsSync(path.join(pluginPath, dir))) {
        result.warnings.push(`Missing directory: ${dir}`);
      }
    }

  } catch (error) {
    result.valid = false;
    result.errors.push(`Parse error: ${error.message}`);
  }

  if (result.valid) {
    results.passed++;
  } else {
    results.failed++;
  }

  results.plugins.push(result);
}

console.log('Validating plugins...\n');

const plugins = fs.readdirSync(PLUGINS_PATH).filter(p => {
  return fs.statSync(path.join(PLUGINS_PATH, p)).isDirectory();
});

for (const plugin of plugins) {
  validatePlugin(path.join(PLUGINS_PATH, plugin));
}

// Print results
console.log('='.repeat(60));
console.log(`Plugin Validation Results`);
console.log('='.repeat(60));
console.log(`Total: ${results.passed + results.failed}`);
console.log(`Passed: ${results.passed}`);
console.log(`Failed: ${results.failed}`);
console.log('='.repeat(60));

for (const plugin of results.plugins) {
  if (plugin.valid) {
    console.log(`[PASS] ${plugin.name}`);
    if (plugin.warnings.length > 0) {
      plugin.warnings.forEach(w => console.log(`  WARN: ${w}`));
    }
  } else {
    console.log(`[FAIL] ${plugin.name}`);
    plugin.errors.forEach(e => console.log(`  ERR: ${e}`));
  }
}

console.log('='.repeat(60));

if (results.failed > 0) {
  console.log('\nValidation FAILED');
  process.exit(1);
} else {
  console.log('\nAll plugins validated successfully!');
  process.exit(0);
}