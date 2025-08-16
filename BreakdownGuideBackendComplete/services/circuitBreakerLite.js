// Lightweight Circuit Breaker - Memory Optimized
// Only creates instances when services are actually called

class CircuitBreakerLite {
  constructor(options = {}) {
    this.state = 'CLOSED';
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000;
    this.name = options.name || 'unnamed';
    
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.nextAttempt = null;
    
    // Don't create event emitters or other heavy objects
  }

  async execute(fn, fallbackFn = null) {
    // Check if circuit should be opened
    if (this.state === 'OPEN') {
      if (Date.now() >= this.nextAttempt) {
        this.state = 'HALF_OPEN';
      } else {
        if (fallbackFn) return await fallbackFn();
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      if (fallbackFn) return await fallbackFn();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
    }
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
    }
  }

  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      nextAttempt: this.nextAttempt
    };
  }

  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.nextAttempt = null;
  }
}

// Lazy-loaded circuit breakers - only create when accessed
const circuitBreakerConfigs = {
  tomtom: { name: 'TomTom', failureThreshold: 3, resetTimeout: 30000 },
  streetManager: { name: 'StreetManager', failureThreshold: 5, resetTimeout: 60000 },
  nationalHighways: { name: 'NationalHighways', failureThreshold: 4, resetTimeout: 45000 },
  weather: { name: 'Weather', failureThreshold: 2, resetTimeout: 20000 }
};

// Proxy to create circuit breakers on demand
export const circuitBreakers = new Proxy({}, {
  get(target, prop) {
    if (!target[prop] && circuitBreakerConfigs[prop]) {
      target[prop] = new CircuitBreakerLite(circuitBreakerConfigs[prop]);
    }
    return target[prop];
  }
});

export default CircuitBreakerLite;
