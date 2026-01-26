#!/usr/bin/env node
/**
 * Metrics Tests
 */

import { createMetrics, createValidationMetrics } from '../metrics.js';

describe('createMetrics', () => {
  let metrics;

  beforeEach(() => {
    metrics = createMetrics({ service: 'test', prefix: 'test_' });
  });

  describe('counter', () => {
    it('should increment counter', () => {
      metrics.counter('test_counter', 1);
      const result = metrics.getMetrics();
      expect(result.counters['test_test_counter']).toBeDefined();
      expect(result.counters['test_test_counter'].value).toBe(1);
    });

    it('should increment counter by value', () => {
      metrics.counter('test_counter', 5);
      const result = metrics.getMetrics();
      expect(result.counters['test_test_counter'].value).toBe(5);
    });

    it('should support tags', () => {
      metrics.counter('test_counter', 1, { plugin: 'my-plugin' });
      const result = metrics.getMetrics();
      expect(result.counters['test_test_counter'].tags).toEqual({ plugin: 'my-plugin' });
    });
  });

  describe('gauge', () => {
    it('should set gauge value', () => {
      metrics.gauge('test_gauge', 100);
      const result = metrics.getMetrics();
      expect(result.gauges['test_test_gauge']).toBeDefined();
      expect(result.gauges['test_test_gauge'].value).toBe(100);
    });

    it('should update gauge value', () => {
      metrics.gauge('test_gauge', 100);
      metrics.gauge('test_gauge', 200);
      const result = metrics.getMetrics();
      expect(result.gauges['test_test_gauge'].value).toBe(200);
    });
  });

  describe('histogram', () => {
    it('should record histogram values', () => {
      metrics.histogram('test_histogram', 10);
      metrics.histogram('test_histogram', 20);
      metrics.histogram('test_histogram', 30);

      const result = metrics.getMetrics();
      expect(result.histograms['test_test_histogram']).toBeDefined();
      expect(result.histograms['test_test_histogram'].count).toBe(3);
      expect(result.histograms['test_test_histogram'].min).toBe(10);
      expect(result.histograms['test_test_histogram'].max).toBe(30);
      expect(result.histograms['test_test_histogram'].avg).toBe(20);
    });

    it('should calculate percentiles', () => {
      for (let i = 1; i <= 100; i++) {
        metrics.histogram('test_histogram', i);
      }

      const result = metrics.getMetrics();
      const hist = result.histograms['test_test_histogram'];

      expect(hist.p50).toBe(50);
      expect(hist.p95).toBe(95);
      expect(hist.p99).toBe(99);
    });
  });

  describe('timers', () => {
    it('should record timer duration', () => {
      metrics.startTimer('operation');
      // Simulate some work
      const start = Date.now();
      while (Date.now() - start < 10) { /* spin */ }
      const duration = metrics.stopTimer('operation');

      expect(duration).toBeGreaterThanOrEqual(10);

      const result = metrics.getMetrics();
      expect(result.histograms['test_operation_duration']).toBeDefined();
    });

    it('should return 0 for non-existent timer', () => {
      const duration = metrics.stopTimer('nonexistent');
      expect(duration).toBe(0);
    });
  });

  describe('reset', () => {
    it('should reset all metrics', () => {
      metrics.counter('test_counter', 1);
      metrics.gauge('test_gauge', 100);
      metrics.histogram('test_histogram', 50);

      metrics.reset();

      const result = metrics.getMetrics();
      expect(Object.keys(result.counters).length).toBe(0);
      expect(Object.keys(result.gauges).length).toBe(0);
      expect(Object.keys(result.histograms).length).toBe(0);
    });
  });

  describe('service metadata', () => {
    it('should include service name', () => {
      const result = metrics.getMetrics();
      expect(result.service).toBe('test');
    });

    it('should include timestamp', () => {
      const result = metrics.getMetrics();
      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp).getTime()).not.toBeNaN();
    });
  });
});

describe('createValidationMetrics', () => {
  let metrics;

  beforeEach(() => {
    metrics = createValidationMetrics();
  });

  describe('plugin validation metrics', () => {
    it('should record plugin attempt', () => {
      metrics.recordPluginAttempt('test-plugin');
      const result = metrics.getMetrics();
      expect(result.counters['validator_plugin_validation_attempts']).toBeDefined();
    });

    it('should record plugin success with duration', () => {
      metrics.recordPluginSuccess('test-plugin', 'full', 100);
      const result = metrics.getMetrics();
      expect(result.counters['validator_plugin_validation_success'].value).toBe(1);
    });

    it('should record plugin failure', () => {
      metrics.recordPluginFailure('test-plugin', 'full', 'validation_failed');
      const result = metrics.getMetrics();
      expect(result.counters['validator_plugin_validation_failures'].value).toBe(1);
    });
  });

  describe('check metrics', () => {
    it('should record passed check', () => {
      metrics.recordCheck('plugin.json schema', true);
      const result = metrics.getMetrics();
      expect(result.counters['validator_checks_passed']).toBeDefined();
    });

    it('should record failed check', () => {
      metrics.recordCheck('plugin.json schema', false);
      const result = metrics.getMetrics();
      expect(result.counters['validator_checks_failed']).toBeDefined();
    });
  });

  describe('run metrics', () => {
    it('should record run start', () => {
      metrics.recordRunStart();
      const result = metrics.getMetrics();
      expect(result.gauges['validator_validation_run_active'].value).toBe(1);
    });

    it('should record run end', () => {
      metrics.recordRunStart();
      metrics.recordRunEnd(true);
      const result = metrics.getMetrics();
      expect(result.gauges['validator_validation_run_active'].value).toBe(0);
      expect(result.counters['validator_validation_runs'].tags.outcome).toBe('success');
    });

    it('should record failed run', () => {
      metrics.recordRunStart();
      metrics.recordRunEnd(false);
      const result = metrics.getMetrics();
      expect(result.counters['validator_validation_runs'].tags.outcome).toBe('failure');
    });
  });
});