#!/usr/bin/env node
/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures and provides error recovery
 */

export const CIRCUIT_STATE = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN'
};

const STATE = CIRCUIT_STATE;

/**
 * Creates a circuit breaker for external operations
 * @param {Object} options - Circuit breaker configuration
 * @param {number} options.failureThreshold - Number of failures before opening (default: 5)
 * @param {number} options.successThreshold - Number of successes to close from half-open (default: 3)
 * @param {number} options.timeout - Time in ms before trying half-open (default: 30000)
 * @param {Function} options.onStateChange - Callback when state changes
 * @returns {Object} Circuit breaker instance
 */
export function createCircuitBreaker(options = {}) {
  const {
    failureThreshold = 5,
    successThreshold = 3,
    timeout = 30000,
    onStateChange = null
  } = options;

  let state = STATE.CLOSED;
  let failureCount = 0;
  let successCount = 0;
  let lastFailureTime = null;
  let halfOpenAttempts = 0;

  function transition(newState, reason) {
    const oldState = state;
    state = newState;
    lastFailureTime = newState === STATE.OPEN ? Date.now() : null;
    successCount = newState === STATE.CLOSED ? 0 : successCount;
    halfOpenAttempts = newState === STATE.HALF_OPEN ? 0 : halfOpenAttempts;

    if (onStateChange) {
      onStateChange({ from: oldState, to: newState, reason, timestamp: new Date().toISOString() });
    }
  }

  return {
    getState() {
      return {
        state,
        failureCount,
        successCount,
        lastFailureTime
      };
    },

    /**
     * Execute a function through the circuit breaker
     * @param {Function} fn - Async function to execute
     * @returns {Promise<any>} Result of the function
     * @throws {CircuitOpenError} If circuit is open
     */
    async execute(fn) {
      if (state === STATE.OPEN) {
        const timeSinceFailure = Date.now() - (lastFailureTime || 0);
        if (timeSinceFailure >= timeout) {
          transition(STATE.HALF_OPEN, 'timeout elapsed');
        } else {
          throw new CircuitOpenError(`Circuit is open. Retry after ${Math.ceil((timeout - timeSinceFailure) / 1000)}s`);
        }
      }

      try {
        const result = await Promise.resolve(fn());

        // Success handling
        if (state === STATE.HALF_OPEN) {
          halfOpenAttempts++;
          successCount++;
          if (successCount >= successThreshold) {
            transition(STATE.CLOSED, 'success threshold reached');
          }
        } else if (state === STATE.CLOSED) {
          // Reset failure count on success
          failureCount = Math.max(0, failureCount - 1);
        }

        return result;
      } catch (error) {
        // Failure handling
        failureCount++;
        lastFailureTime = Date.now();

        if (state === STATE.HALF_OPEN) {
          transition(STATE.OPEN, `half-open failure: ${error.message}`);
          throw new CircuitOpenError(`Circuit reopened due to failure: ${error.message}`);
        }

        if (failureCount >= failureThreshold) {
          transition(STATE.OPEN, `failure threshold reached: ${failureCount}`);
        }

        throw error;
      }
    },

    /**
     * Reset the circuit breaker to initial state
     */
    reset() {
      state = STATE.CLOSED;
      failureCount = 0;
      successCount = 0;
      lastFailureTime = null;
      halfOpenAttempts = 0;
    }
  };
}

/**
 * Error thrown when circuit is open
 */
export class CircuitOpenError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CircuitOpenError';
    this.retryable = true;
  }
}

/**
 * Creates a circuit breaker registry for managing multiple circuit breakers
 * @returns {Object} Circuit breaker registry
 */
export function createCircuitBreakerRegistry() {
  const breakers = new Map();

  return {
    /**
     * Get or create a circuit breaker
     * @param {string} name - Identifier for the breaker
     * @param {Object} options - Circuit breaker options
     * @returns {Object} Circuit breaker instance
     */
    getOrCreate(name, options = {}) {
      if (!breakers.has(name)) {
        breakers.set(name, createCircuitBreaker(options));
      }
      return breakers.get(name);
    },

    /**
     * Get all circuit breaker states
     * @returns {Object} Map of name to state
     */
    getAllStates() {
      const states = {};
      for (const [name, breaker] of breakers) {
        states[name] = breaker.getState();
      }
      return states;
    },

    /**
     * Reset all circuit breakers
     */
    resetAll() {
      for (const breaker of breakers.values()) {
        breaker.reset();
      }
    }
  };
}

export default {
  createCircuitBreaker,
  createCircuitBreakerRegistry,
  CircuitOpenError,
  STATE
};