#!/usr/bin/env node
/**
 * Circuit Breaker Tests
 */

import { createCircuitBreaker, createCircuitBreakerRegistry, CircuitOpenError, CIRCUIT_STATE } from '../circuit-breaker.js';

describe('createCircuitBreaker', () => {
  let breaker;

  beforeEach(() => {
    breaker = createCircuitBreaker({
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 100
    });
  });

  describe('initial state', () => {
    it('should start in CLOSED state', () => {
      const state = breaker.getState();
      expect(state.state).toBe(CIRCUIT_STATE.CLOSED);
      expect(state.failureCount).toBe(0);
    });
  });

  describe('successful executions', () => {
    it('should execute function successfully', async () => {
      const result = await breaker.execute(() => Promise.resolve('success'));
      expect(result).toBe('success');
    });

    it('should remain CLOSED after success', async () => {
      await breaker.execute(() => Promise.resolve('success'));
      const state = breaker.getState();
      expect(state.state).toBe(CIRCUIT_STATE.CLOSED);
    });

    it('should decrement failure count on success', async () => {
      breaker = createCircuitBreaker({ failureThreshold: 3 });
      // Simulate some failures
      try { await breaker.execute(() => Promise.reject(new Error('fail'))); } catch {}
      try { await breaker.execute(() => Promise.reject(new Error('fail'))); } catch {}

      await breaker.execute(() => Promise.resolve('success'));
      const state = breaker.getState();
      expect(state.failureCount).toBe(1); // Should decrement from 2 to 1
    });
  });

  describe('failed executions', () => {
    it('should execute function and handle rejection', async () => {
      await expect(breaker.execute(() => Promise.reject(new Error('fail'))))
        .rejects.toThrow('fail');
    });

    it('should increment failure count on error', async () => {
      try { await breaker.execute(() => Promise.reject(new Error('fail'))); } catch {}

      const state = breaker.getState();
      expect(state.failureCount).toBe(1);
    });

    it('should open circuit after failure threshold', async () => {
      for (let i = 0; i < 3; i++) {
        try { await breaker.execute(() => Promise.reject(new Error('fail'))); } catch {}
      }

      const state = breaker.getState();
      expect(state.state).toBe(CIRCUIT_STATE.OPEN);
    });

    it('should throw CircuitOpenError when circuit is open', async () => {
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try { await breaker.execute(() => Promise.reject(new Error('fail'))); } catch {}
      }

      await expect(breaker.execute(() => Promise.resolve('should not run')))
        .rejects.toThrow(CircuitOpenError);
    });
  });

  describe('half-open state', () => {
    it('should transition to HALF_OPEN after timeout', async () => {
      for (let i = 0; i < 3; i++) {
        try { await breaker.execute(() => Promise.reject(new Error('fail'))); } catch {}
      }

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      await expect(breaker.execute(() => Promise.resolve('test')))
        .resolves.toBe('test');

      const state = breaker.getState();
      expect(state.state).toBe(CIRCUIT_STATE.HALF_OPEN);
    });

    it('should transition to CLOSED after success threshold', async () => {
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try { await breaker.execute(() => Promise.reject(new Error('fail'))); } catch {}
      }

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Success in half-open state
      await breaker.execute(() => Promise.resolve('success'));
      await breaker.execute(() => Promise.resolve('success'));

      const state = breaker.getState();
      expect(state.state).toBe(CIRCUIT_STATE.CLOSED);
    });

    it('should transition back to OPEN on failure in half-open', async () => {
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try { await breaker.execute(() => Promise.reject(new Error('fail'))); } catch {}
      }

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Fail in half-open state
      try { await breaker.execute(() => Promise.reject(new Error('fail'))); } catch {}

      const state = breaker.getState();
      expect(state.state).toBe(CIRCUIT_STATE.OPEN);
    });
  });

  describe('state change callback', () => {
    it('should call onStateChange when state changes', async () => {
      const callback = jest.fn();
      breaker = createCircuitBreaker({
        failureThreshold: 1,
        timeout: 100,
        onStateChange: callback
      });

      try { await breaker.execute(() => Promise.reject(new Error('fail'))); } catch {}

      expect(callback).toHaveBeenCalledWith({
        from: CIRCUIT_STATE.CLOSED,
        to: CIRCUIT_STATE.OPEN,
        reason: 'failure threshold reached: 1',
        timestamp: expect.any(String)
      });
    });
  });

  describe('reset', () => {
    it('should reset state to initial values', async () => {
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try { await breaker.execute(() => Promise.reject(new Error('fail'))); } catch {}
      }

      breaker.reset();

      const state = breaker.getState();
      expect(state.state).toBe(CIRCUIT_STATE.CLOSED);
      expect(state.failureCount).toBe(0);
    });
  });
});

describe('createCircuitBreakerRegistry', () => {
  let registry;

  beforeEach(() => {
    registry = createCircuitBreakerRegistry();
  });

  it('should create and retrieve circuit breakers', () => {
    const breaker1 = registry.getOrCreate('test1');
    const breaker2 = registry.getOrCreate('test2');

    expect(breaker1).not.toBe(breaker2);
    expect(registry.getOrCreate('test1')).toBe(breaker1); // Same instance
  });

  it('should get all states', () => {
    registry.getOrCreate('breaker1');
    registry.getOrCreate('breaker2');

    const states = registry.getAllStates();
    expect(Object.keys(states)).toContain('breaker1');
    expect(Object.keys(states)).toContain('breaker2');
  });

  it('should reset all breakers', () => {
    const breaker = registry.getOrCreate('test');
    breaker.execute(() => Promise.reject(new Error('fail'))).catch(() => {});
    breaker.execute(() => Promise.reject(new Error('fail'))).catch(() => {});
    breaker.execute(() => Promise.reject(new Error('fail'))).catch(() => {});

    registry.resetAll();

    const state = breaker.getState();
    expect(state.state).toBe(CIRCUIT_STATE.CLOSED);
  });
});

describe('CircuitOpenError', () => {
  it('should have correct properties', () => {
    const error = new CircuitOpenError('Circuit is open');
    expect(error.name).toBe('CircuitOpenError');
    expect(error.message).toBe('Circuit is open');
    expect(error.retryable).toBe(true);
  });
});