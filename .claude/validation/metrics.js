#!/usr/bin/env node
/**
 * Metrics Module
 * Tracks and reports validation metrics
 */

/**
 * Creates a metrics collector
 * @param {Object} options - Configuration options
 * @returns {Object} Metrics collector instance
 */
export function createMetrics(options = {}) {
  const {
    service = 'validator',
    prefix = 'validator_'
  } = options;

  // Counters for various metrics
  const counters = new Map();
  const gauges = new Map();
  const histograms = new Map();
  const startTimes = new Map();

  return {
    /**
     * Increment a counter
     * @param {string} name - Counter name
     * @param {number} value - Value to increment by (default: 1)
     * @param {Object} tags - Tags for the metric
     */
    counter(name, value = 1, tags = {}) {
      const key = JSON.stringify({ name, tags });
      const current = counters.get(key) || 0;
      counters.set(key, current + value);
    },

    /**
     * Set a gauge value
     * @param {string} name - Gauge name
     * @param {number} value - Value to set
     * @param {Object} tags - Tags for the metric
     */
    gauge(name, value, tags = {}) {
      const key = JSON.stringify({ name, tags });
      gauges.set(key, value);
    },

    /**
     * Record a histogram value
     * @param {string} name - Histogram name
     * @param {number} value - Value to record
     * @param {Object} tags - Tags for the metric
     */
    histogram(name, value, tags = {}) {
      const key = JSON.stringify({ name, tags });
      const current = histograms.get(key) || [];
      current.push(value);
      histograms.set(key, current);
    },

    /**
     * Start a timer
     * @param {string} name - Timer name
     * @param {Object} tags - Tags for the metric
     */
    startTimer(name, tags = {}) {
      const key = JSON.stringify({ name, tags });
      startTimes.set(key, Date.now());
    },

    /**
     * Stop a timer and record the duration
     * @param {string} name - Timer name
     * @param {Object} tags - Tags for the metric
     * @returns {number} Duration in milliseconds
     */
    stopTimer(name, tags = {}) {
      const key = JSON.stringify({ name, tags });
      const startTime = startTimes.get(key);
      if (startTime) {
        const duration = Date.now() - startTime;
        this.histogram(`${name}_duration`, duration, tags);
        startTimes.delete(key);
        return duration;
      }
      return 0;
    },

    /**
     * Get all collected metrics
     * @returns {Object} Metrics snapshot
     */
    getMetrics() {
      const snapshot = {
        service,
        timestamp: new Date().toISOString(),
        counters: {},
        gauges: {},
        histograms: {}
      };

      // Process counters
      for (const [key, value] of counters) {
        const { name, tags } = JSON.parse(key);
        const fullName = `${prefix}${name}`;
        snapshot.counters[fullName] = { value, tags };
      }

      // Process gauges
      for (const [key, value] of gauges) {
        const { name, tags } = JSON.parse(key);
        const fullName = `${prefix}${name}`;
        snapshot.gauges[fullName] = { value, tags };
      }

      // Process histograms with statistics
      for (const [key, values] of histograms) {
        const { name, tags } = JSON.parse(key);
        const fullName = `${prefix}${name}`;

        if (values.length > 0) {
          const sorted = [...values].sort((a, b) => a - b);
          const len = sorted.length;
          snapshot.histograms[fullName] = {
            count: values.length,
            min: sorted[0],
            max: sorted[len - 1],
            avg: values.reduce((a, b) => a + b, 0) / len,
            p50: sorted[Math.floor((len - 1) * 0.5)],
            p95: sorted[Math.floor((len - 1) * 0.95)],
            p99: sorted[Math.floor((len - 1) * 0.99)],
            tags
          };
        }
      }

      return snapshot;
    },

    /**
     * Reset all metrics
     */
    reset() {
      counters.clear();
      gauges.clear();
      histograms.clear();
      startTimes.clear();
    }
  };
}

/**
 * Creates a validation-specific metrics collector
 * @returns {Object} Metrics collector with validation-specific methods
 */
export function createValidationMetrics() {
  const metrics = createMetrics();

  return {
    /**
     * Record a plugin validation attempt
     */
    recordPluginAttempt(pluginName, type = 'unknown') {
      metrics.counter('plugin_validation_attempts', 1, { plugin: pluginName, type });
    },

    /**
     * Record a successful plugin validation
     */
    recordPluginSuccess(pluginName, type = 'unknown', duration) {
      metrics.counter('plugin_validation_success', 1, { plugin: pluginName, type });
      metrics.histogram('plugin_validation_duration', duration, { plugin: pluginName, type });
    },

    /**
     * Record a failed plugin validation
     */
    recordPluginFailure(pluginName, type = 'unknown', errorType) {
      metrics.counter('plugin_validation_failures', 1, { plugin: pluginName, type, error: errorType });
    },

    /**
     * Record a check result
     */
    recordCheck(checkName, passed) {
      metrics.counter(passed ? 'checks_passed' : 'checks_failed', 1, { check: checkName });
    },

    /**
     * Record overall validation run
     */
    recordRunStart() {
      metrics.gauge('validation_run_active', 1);
      metrics.startTimer('validation_run');
    },

    recordRunEnd(success) {
      const duration = metrics.stopTimer('validation_run');
      metrics.gauge('validation_run_active', 0);
      metrics.counter('validation_runs', 1, { outcome: success ? 'success' : 'failure' });
      metrics.histogram('validation_run_duration', duration);
    },

    getMetrics() {
      return metrics.getMetrics();
    },

    reset() {
      metrics.reset();
    }
  };
}

export default {
  createMetrics,
  createValidationMetrics
};