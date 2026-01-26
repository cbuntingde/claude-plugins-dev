#!/usr/bin/env node
/**
 * Plugin Validation Script - Enterprise Grade
 * Validates all plugins against schemas and business rules
 *
 * Features:
 * - Structured JSON logging with configurable levels
 * - Timeout handling for all external operations
 * - Circuit breaker pattern for resilience
 * - Path traversal prevention
 * - Comprehensive metrics and observability
 * - Unit test coverage ready
 *
 * Exit codes: 0 = success, 1 = validation failures, 2 = error
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Ajv from 'ajv';

import { createLogger } from './logger.js';
import { getModifiedPlugins, validatePluginName } from './git-utils.js';
import {
  safeReadJson,
  safeReaddir,
  safeStat,
  validateFilePath,
  getPluginDirectories
} from './file-utils.js';
import { createCircuitBreaker, createCircuitBreakerRegistry, CIRCUIT_STATE } from './circuit-breaker.js';
import { createValidationMetrics } from './metrics.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '../..');
const PLUGINS_DIR = join(ROOT_DIR, 'plugins');
const SCHEMAS_DIR = join(__dirname, 'schemas');

// Initialize components
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'INFO',
  json: process.env.LOG_JSON === 'true',
  service: 'plugin-validator'
});

const metrics = createValidationMetrics();

const circuitBreakers = createCircuitBreakerRegistry({
  git: createCircuitBreaker({ failureThreshold: 3, timeout: 10000 }),
  file: createCircuitBreaker({ failureThreshold: 5, timeout: 5000 })
});

// Validation results
const results = {
  passed: [],
  failed: [],
  errors: []
};

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

// Initialize AJV with email format and no schema caching
const ajv = new Ajv({
  allErrors: true,
  formats: {
    email: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
    uri: /^https?:\/\/.+/
  }
});

// Cache for compiled validators
const validatorCache = new Map();

/**
 * Logs a success for a validation check
 */
function logSuccess(plugin, check) {
  results.passed.push({ plugin, check });
  metrics.recordCheck(check, true);
  logger.debug(`Validation passed: ${plugin} - ${check}`);
  console.log(`  ${colors.green}✓${colors.reset} ${check}`);
}

/**
 * Logs a failure for a validation check
 */
function logFailure(plugin, check, details) {
  results.failed.push({ plugin, check, details });
  metrics.recordCheck(check, false);
  logger.warn(`Validation failed: ${plugin} - ${check}`, { details });
  console.log(`  ${colors.red}✗${colors.reset} ${check}`);
  if (details) {
    console.log(`    ${colors.yellow}${details}${colors.reset}`);
  }
}

/**
 * Logs an error during validation
 */
function logError(plugin, error) {
  results.errors.push({ plugin, error });
  logger.error(`Validation error: ${plugin}`, { error });
  console.log(`  ${colors.red}ERROR: ${error}${colors.reset}`);
}

/**
 * Loads a JSON schema
 * Schemas are internal files from a known location, no path traversal risk
 */
function loadSchema(schemaName) {
  const schemaPath = join(SCHEMAS_DIR, schemaName);

  // Basic validation - ensure name doesn't contain path separators
  if (schemaName.includes('/') || schemaName.includes('\\') || schemaName.includes('..')) {
    throw new Error(`Invalid schema name: ${schemaName}`);
  }

  try {
    const content = readFileSync(schemaPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to load schema ${schemaName}: ${error.message}`);
  }
}

/**
 * Validates JSON against schema using AJV with caching
 */
function validateSchema(data, schemaName) {
  let validate = validatorCache.get(schemaName);

  if (!validate) {
    const schema = loadSchema(schemaName);
    validate = ajv.compile(schema);
    validatorCache.set(schemaName, validate);
  }

  const valid = validate(data);

  return {
    valid,
    errors: validate.errors || []
  };
}

/**
 * Validates plugin metadata file
 */
function validatePluginMetadata(pluginDir) {
  const pluginName = pluginDir.split('\\').pop().split('/').pop();
  console.log(`\n${colors.blue}Validating ${pluginName}...${colors.reset}`);

  // Validate plugin name
  const nameValidation = validatePluginName(pluginName);
  if (!nameValidation.valid) {
    logFailure(pluginName, 'Plugin name validation', nameValidation.errors.join(', '));
    return false;
  }

  const metadataPath = join(pluginDir, '.claude-plugin', 'plugin.json');

  if (!existsSync(metadataPath)) {
    logFailure(pluginName, 'plugin.json exists', 'Missing .claude-plugin/plugin.json');
    return false;
  }

  try {
    const content = readFileSync(metadataPath, 'utf-8');
    const metadata = JSON.parse(content);
    const validation = validateSchema(metadata, 'plugin.json');

    if (validation.valid) {
      logSuccess(pluginName, 'plugin.json schema');
      return true;
    } else {
      const errors = validation.errors.map(e => `${e.instancePath || 'root'}: ${e.message}`).join(', ');
      logFailure(pluginName, 'plugin.json schema', errors);
      return false;
    }
  } catch (error) {
    logError(pluginName, `plugin.json parse error: ${error.message}`);
    return false;
  }
}

/**
 * Validates hooks configuration
 */
function validateHooks(pluginDir) {
  const pluginName = pluginDir.split('\\').pop().split('/').pop();
  const hooksPath = join(pluginDir, 'hooks', 'hooks.json');

  if (!existsSync(hooksPath)) {
    console.log(`  ${colors.blue}⊘ No hooks.json (skipping hook validation)${colors.reset}`);
    return true;
  }

  try {
    const content = readFileSync(hooksPath, 'utf-8');
    const hooks = JSON.parse(content);
    const validation = validateSchema(hooks, 'hooks.json');

    if (!validation.valid) {
      const errors = validation.errors.map(e => `${e.instancePath || 'root'}: ${e.message}`).join(', ');
      logFailure(pluginName, 'hooks.json schema', errors);
      return false;
    }

    // Additional business rules for agent hooks
    let agentHooksValid = true;
    for (const [hookType, hookConfigs] of Object.entries(hooks.hooks || {})) {
      for (const config of hookConfigs) {
        for (const hook of config.hooks || []) {
          if (hook.type === 'agent' && !hook.messages) {
            logFailure(pluginName, 'agent hook messages field', `${hookType} hook missing required messages array`);
            agentHooksValid = false;
          }
        }
      }
    }

    if (agentHooksValid) {
      logSuccess(pluginName, 'hooks.json schema and business rules');
    }

    return agentHooksValid;
  } catch (error) {
    logError(pluginName, `hooks.json parse error: ${error.message}`);
    return false;
  }
}

/**
 * Validates package.json
 */
function validatePackageJson(pluginDir) {
  const pluginName = pluginDir.split('\\').pop().split('/').pop();
  const packagePath = join(pluginDir, 'package.json');

  if (!existsSync(packagePath)) {
    logFailure(pluginName, 'package.json exists', 'Missing package.json');
    return false;
  }

  try {
    const content = readFileSync(packagePath, 'utf-8');
    const pkg = JSON.parse(content);
    const validation = validateSchema(pkg, 'package.json');

    if (!validation.valid) {
      const errors = validation.errors.map(e => `${e.instancePath || 'root'}: ${e.message}`).join(', ');
      logFailure(pluginName, 'package.json schema', errors);
      return false;
    }

    // Validate author field matches project standards
    const pluginNameFromPkg = pkg.name;
    const authorEmail = typeof pkg.author === 'object' ? pkg.author?.email : null;

    if (authorEmail !== 'cbuntingde@gmail.com') {
      logFailure(pluginName, 'Author email', 'Must be cbuntingde@gmail.com');
      return false;
    }

    const expectedHomepage = `https://github.com/cbuntingde/claude-plugins-dev/tree/main/plugins/${pluginNameFromPkg}`;
    if (pkg.homepage !== expectedHomepage) {
      logFailure(pluginName, 'Homepage URL', `Expected: ${expectedHomepage}, Got: ${pkg.homepage || 'none'}`);
      return false;
    }

    logSuccess(pluginName, 'package.json schema and metadata');
    return true;
  } catch (error) {
    logError(pluginName, `package.json parse error: ${error.message}`);
    return false;
  }
}

/**
 * Validates README exists
 */
function validateReadme(pluginDir) {
  const pluginName = pluginDir.split('\\').pop().split('/').pop();
  const readmePath = join(pluginDir, 'README.md');

  if (!existsSync(readmePath)) {
    logFailure(pluginName, 'README.md exists', 'Missing README.md');
    return false;
  }

  const content = readFileSync(readmePath, 'utf-8');

  // Check for required sections
  const requiredSections = ['## Installation', '## Usage', '## Configuration'];
  const missingSections = requiredSections.filter(section => !content.includes(section));

  if (missingSections.length > 0) {
    logFailure(pluginName, 'README.md sections', `Missing: ${missingSections.join(', ')}`);
    return false;
  }

  logSuccess(pluginName, 'README.md structure');
  return true;
}

/**
 * Validates entry point exists
 */
function validateEntryPoint(pluginDir) {
  const pluginName = pluginDir.split('\\').pop().split('/').pop();

  const jsEntry = join(pluginDir, 'index.js');
  const tsEntry = join(pluginDir, 'index.ts');
  const entryExists = existsSync(jsEntry) || existsSync(tsEntry);

  if (!entryExists) {
    logFailure(pluginName, 'Entry point exists', 'Missing index.js or index.ts');
    return false;
  }

  logSuccess(pluginName, 'Entry point exists');
  return true;
}

/**
 * Validates command files have corresponding scripts
 */
function validateCommandDocs(pluginDir) {
  const pluginName = pluginDir.split('\\').pop().split('/').pop();
  const commandsDir = join(pluginDir, 'commands');

  if (!existsSync(commandsDir)) {
    console.log(`  ${colors.blue}⊘ No commands directory (skipping)${colors.reset}`);
    return true;
  }

  try {
    const dirResult = safeReaddir(commandsDir);

    if (!dirResult.success) {
      logError(pluginName, `Cannot read commands directory: ${dirResult.message}`);
      return false;
    }

    const commandFiles = dirResult.entries
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace('.md', ''));

    if (commandFiles.length === 0) {
      console.log(`  ${colors.blue}⊘ No command markdown files (skipping)${colors.reset}`);
      return true;
    }

    let allValid = true;

    // Check each command markdown file has corresponding script
    for (const command of commandFiles) {
      const scriptPath = join(pluginDir, 'scripts', `${command}.sh`);
      const jsScriptPath = join(pluginDir, 'scripts', `${command}.js`);

      const scriptExists = existsSync(scriptPath) || existsSync(jsScriptPath);

      if (!scriptExists) {
        logFailure(pluginName, `Command implementation exists`, `Missing script for command: ${command}`);
        allValid = false;
      }
    }

    // Check scripts referenced in hooks exist
    const hooksPath = join(pluginDir, 'hooks', 'hooks.json');
    if (existsSync(hooksPath)) {
      const hooks = JSON.parse(readFileSync(hooksPath, 'utf-8'));
      const referencedScripts = new Set();

      for (const hookConfigs of Object.values(hooks.hooks || {})) {
        for (const config of hookConfigs) {
          for (const hook of config.hooks || []) {
            if (hook.type === 'command' && hook.command) {
              const scriptName = hook.command.split(/[\/\\]/).pop();
              referencedScripts.add(scriptName);
            }
          }
        }
      }

      for (const scriptFile of referencedScripts) {
        // Extract just the script name (handle commands like "script.sh || fallback")
        const cleanScriptName = scriptFile.split('||')[0].trim();
        const scriptPath = join(pluginDir, 'scripts', cleanScriptName);
        if (!existsSync(scriptPath)) {
          logFailure(pluginName, `Hook-referenced script exists`, `Missing: scripts/${cleanScriptName}`);
          allValid = false;
        }
      }
    }

    if (allValid) {
      logSuccess(pluginName, 'Command implementations exist');
    }

    return allValid;
  } catch (error) {
    logError(pluginName, `Command validation error: ${error.message}`);
    return false;
  }
}

/**
 * Gets directories for plugins to validate
 */
async function getPluginDirsToValidate() {
  const args = process.argv.slice(2);

  // Check for --all flag
  if (args.includes('--all')) {
    logger.info('Validating all plugins');
    const pluginDirsResult = getPluginDirectories(PLUGINS_DIR);
    if (!pluginDirsResult.success) {
      throw new Error(`Failed to get plugin directories: ${pluginDirsResult.message}`);
    }
    return pluginDirsResult.plugins;
  }

  // If arguments provided, use them as plugin names
  if (args.length > 0) {
    const pluginNames = args.filter(arg => !arg.startsWith('-'));
    if (pluginNames.length > 0) {
      return pluginNames.map(name => {
        // Validate plugin name before use
        const nameValidation = validatePluginName(name);
        if (!nameValidation.valid) {
          throw new Error(`Invalid plugin name: ${nameValidation.errors.join(', ')}`);
        }

        const pluginDir = join(PLUGINS_DIR, name);
        const statResult = safeStat(pluginDir);

        if (!statResult.success || !statResult.isDirectory) {
          throw new Error(`Plugin not found: ${name}`);
        }

        return pluginDir;
      });
    }
  }

  // No arguments - get modified plugins from git
  const gitBreaker = circuitBreakers.getOrCreate('git');
  const gitResult = await gitBreaker.execute(() => getModifiedPlugins(ROOT_DIR));

  if (gitResult.timedOut) {
    logger.warn('Git status timed out, validating all plugins');
    const pluginDirsResult = getPluginDirectories(PLUGINS_DIR);
    if (!pluginDirsResult.success) {
      throw new Error(`Failed to get plugin directories: ${pluginDirsResult.message}`);
    }
    return pluginDirsResult.plugins;
  }

  if (gitResult.error) {
    logger.warn(`Git status failed: ${gitResult.error}, validating all plugins`);
    const pluginDirsResult = getPluginDirectories(PLUGINS_DIR);
    if (!pluginDirsResult.success) {
      throw new Error(`Failed to get plugin directories: ${pluginDirsResult.message}`);
    }
    return pluginDirsResult.plugins;
  }

  const modifiedPlugins = gitResult.modifiedPlugins;

  if (modifiedPlugins.length > 0) {
    // Filter to only actual directories
    const validPluginDirs = modifiedPlugins
      .map(name => ({ name, path: join(PLUGINS_DIR, name) }))
      .filter(({ path }) => {
        const statResult = safeStat(path);
        return statResult.success && statResult.isDirectory;
      });

    if (validPluginDirs.length > 0) {
      logger.info(`Auto-detected ${validPluginDirs.length} modified/new plugin(s)`,
        { plugins: validPluginDirs.map(p => p.name) });
      return validPluginDirs.map(p => p.path);
    }
  }

  // Fallback: validate all plugins
  logger.info('No modified plugins detected, validating all plugins');
  const pluginDirsResult = getPluginDirectories(PLUGINS_DIR);
  if (!pluginDirsResult.success) {
    throw new Error(`Failed to get plugin directories: ${pluginDirsResult.message}`);
  }
  return pluginDirsResult.plugins;
}

/**
 * Prints validation summary
 */
function printSummary(totalPlugins, passedPlugins) {
  console.log(`\n${colors.blue}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}SUMMARY${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`Plugins validated: ${totalPlugins}`);
  console.log(`Passed: ${passedPlugins}`);
  console.log(`Failed: ${totalPlugins - passedPlugins}`);
  console.log(`Total checks passed: ${results.passed.length}`);
  console.log(`Total checks failed: ${results.failed.length}`);

  if (results.errors.length > 0) {
    console.log(`Errors encountered: ${results.errors.length}`);
  }

  // Print metrics summary
  const metricsData = metrics.getMetrics();
  console.log(`\n${colors.blue}METRICS:${colors.reset}`);
  if (metricsData.counters) {
    for (const [name, data] of Object.entries(metricsData.counters)) {
      console.log(`  ${name}: ${data.value}`);
    }
  }
  if (metricsData.histograms) {
    for (const [name, data] of Object.entries(metricsData.histograms)) {
      console.log(`  ${name}: avg=${data.avg.toFixed(2)}ms, p95=${data.p95}ms`);
    }
  }

  // Print circuit breaker states
  const breakerStates = circuitBreakers.getAllStates();
  const openBreakers = Object.entries(breakerStates)
    .filter(([_, state]) => state.state === CIRCUIT_STATE.OPEN)
    .map(([name, _]) => name);

  if (openBreakers.length > 0) {
    console.log(`\n${colors.yellow}Open circuit breakers: ${openBreakers.join(', ')}${colors.reset}`);
  }
}

/**
 * Main validation function
 */
async function main() {
  logger.info('Starting plugin validation', { rootDir: ROOT_DIR });

  // Record validation run start
  metrics.recordRunStart();

  let totalPlugins = 0;
  let passedPlugins = 0;

  try {
    const pluginDirs = await getPluginDirsToValidate();

    if (pluginDirs.length === 0) {
      console.log(`\n${colors.yellow}⚠ No plugins found to validate${colors.reset}`);
      metrics.recordRunEnd(true);
      return 0;
    }

    logger.info(`Found ${pluginDirs.length} plugins to validate`);

    for (const pluginDir of pluginDirs) {
      totalPlugins++;
      const pluginName = pluginDir.split('\\').pop().split('/').pop();
      const startTime = Date.now();

      metrics.recordPluginAttempt(pluginName);

      try {
        const checks = [
          validatePluginMetadata(pluginDir),
          validateHooks(pluginDir),
          validatePackageJson(pluginDir),
          validateReadme(pluginDir),
          validateEntryPoint(pluginDir),
          validateCommandDocs(pluginDir)
        ];

        const allPassed = checks.every(check => check === true);

        // Record metrics
        const duration = Date.now() - startTime;
        if (allPassed) {
          metrics.recordPluginSuccess(pluginName, 'full', duration);
          passedPlugins++;
        } else {
          metrics.recordPluginFailure(pluginName, 'full', 'validation_failed');
        }
      } catch (error) {
        logger.error(`Plugin validation error: ${pluginName}`, { error: error.message });
        metrics.recordPluginFailure(pluginName, 'full', error.name || 'unknown');
      }
    }

    // Print summary
    printSummary(totalPlugins, passedPlugins);

    // Record validation run end
    metrics.recordRunEnd(results.errors.length === 0 && results.failed.length === 0);

    // Exit with appropriate code
    if (results.errors.length > 0) {
      logger.fatal('Validation completed with errors', { errorCount: results.errors.length });
      return 2;
    } else if (results.failed.length > 0) {
      logger.warn('Validation completed with failures', { failureCount: results.failed.length });
      return 1;
    } else {
      logger.info('All plugins passed validation');
      console.log(`\n${colors.green}✓ All plugins passed validation!${colors.reset}`);
      return 0;
    }
  } catch (error) {
    logger.fatal('Fatal validation error', { error: error.message, stack: error.stack });
    console.error(`\n${colors.red}Fatal error: ${error.message}${colors.reset}`);
    metrics.recordRunEnd(false);
    return 2;
  }
}

// Export for testing
export {
  validatePluginMetadata,
  validateHooks,
  validatePackageJson,
  validateReadme,
  validateEntryPoint,
  validateCommandDocs
};

// Run main function
const exitCode = await main();
process.exit(exitCode);