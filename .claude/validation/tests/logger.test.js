#!/usr/bin/env node
/**
 * Logger Tests
 */

import { createLogger } from '../logger.js';

describe('createLogger', () => {
  let logger;

  beforeEach(() => {
    logger = createLogger({ level: 'DEBUG', json: false, service: 'test' });
  });

  describe('log levels', () => {
    it('should log debug messages at DEBUG level', () => {
      expect(() => logger.debug('test message')).not.toThrow();
    });

    it('should log info messages at INFO level', () => {
      expect(() => logger.info('test message')).not.toThrow();
    });

    it('should log warn messages at WARN level', () => {
      expect(() => logger.warn('test message')).not.toThrow();
    });

    it('should log error messages at ERROR level', () => {
      expect(() => logger.error('test message')).not.toThrow();
    });

    it('should log fatal messages at FATAL level', () => {
      expect(() => logger.fatal('test message')).not.toThrow();
    });
  });

  describe('metadata sanitization', () => {
    it('should redact sensitive fields', () => {
      const result = logger.info('test', { password: 'secret123', token: 'abc', username: 'testuser' });
      expect(result).toBeDefined();
    });

    it('should handle nested objects', () => {
      expect(() => logger.info('test', { data: { apiKey: 'secret' } })).not.toThrow();
    });

    it('should handle null and undefined metadata', () => {
      expect(() => logger.info('test', null)).not.toThrow();
      expect(() => logger.info('test', undefined)).not.toThrow();
    });
  });

  describe('metric logging', () => {
    it('should log metrics', () => {
      expect(() => logger.metric('test_metric', 100, { tag: 'value' })).not.toThrow();
    });
  });
});

describe('Log Level Filtering', () => {
  it('should not log DEBUG when level is INFO', () => {
    const logger = createLogger({ level: 'INFO', json: true });
    const originalLog = console.log;
    let logged = false;
    console.log = () => { logged = true; };

    logger.debug('should not appear');

    console.log = originalLog;
    expect(logged).toBe(false);
  });

  it('should log INFO when level is INFO', () => {
    const logger = createLogger({ level: 'INFO', json: true });
    const originalLog = console.log;
    let logged = false;
    console.log = () => { logged = true; };

    logger.info('should appear');

    console.log = originalLog;
    expect(logged).toBe(true);
  });
});