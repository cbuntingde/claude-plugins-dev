#!/usr/bin/env node
/**
 * Structured Logging Module
 * Provides JSON-structured logging with configurable log levels
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4
};

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

/**
 * Creates a logger instance with the specified configuration
 * @param {Object} options - Logger configuration
 * @param {string} options.level - Log level (DEBUG, INFO, WARN, ERROR, FATAL)
 * @param {boolean} options.json - Output as JSON instead of colored text
 * @param {string} options.service - Service name for log entries
 * @returns {Object} Logger instance
 */
export function createLogger(options = {}) {
  const {
    level = process.env.LOG_LEVEL || 'INFO',
    json = false,
    service = 'validator'
  } = options;

  const currentLevel = LOG_LEVELS[level] ?? LOG_LEVELS.INFO;

  function formatMessage(level, message, metadata = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      service,
      message,
      metadata: sanitizeMetadata(metadata)
    };

    if (json) {
      return JSON.stringify(entry);
    }

    const color = COLORS[level] || COLORS.reset;
    let formatted = `${color}[${level}]${COLORS.reset} ${message}`;

    if (Object.keys(metadata).length > 0) {
      const metaStr = JSON.stringify(metadata);
      formatted += ` ${metaStr}`;
    }

    return formatted;
  }

  function shouldLog(level) {
    return LOG_LEVELS[level] >= currentLevel;
  }

  return {
    debug(message, metadata = {}) {
      if (shouldLog('DEBUG')) {
        console.log(formatMessage('DEBUG', message, metadata));
      }
    },
    info(message, metadata = {}) {
      if (shouldLog('INFO')) {
        console.log(formatMessage('INFO', message, metadata));
      }
    },
    warn(message, metadata = {}) {
      if (shouldLog('WARN')) {
        console.warn(formatMessage('WARN', message, metadata));
      }
    },
    error(message, metadata = {}) {
      if (shouldLog('ERROR')) {
        console.error(formatMessage('ERROR', message, metadata));
      }
    },
    fatal(message, metadata = {}) {
      if (shouldLog('FATAL')) {
        console.error(formatMessage('FATAL', message, metadata));
      }
    },
    metric(name, value, metadata = {}) {
      if (shouldLog('INFO')) {
        const entry = {
          timestamp: new Date().toISOString(),
          level: 'METRIC',
          service,
          metric: name,
          value,
          metadata: sanitizeMetadata(metadata)
        };
        console.log(json ? JSON.stringify(entry) : `[METRIC] ${name}=${value} ${JSON.stringify(metadata)}`);
      }
    }
  };
}

/**
 * Sanitizes metadata to remove sensitive values and circular references
 * @param {Object} metadata - Metadata to sanitize
 * @returns {Object} Sanitized metadata
 */
function sanitizeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }

  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'credential', 'auth'];
  const sanitized = {};

  for (const [key, value] of Object.entries(metadata)) {
    const lowerKey = key.toLowerCase();

    if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeMetadata(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export default createLogger;