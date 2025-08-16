import EventEmitter from 'events';

class CircuitBreaker extends EventEmitter {
  constructor(options = {}) {
    super();
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 10000; // 10 seconds
    this.name = options.name || 'unnamed';
    
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.nextAttempt = null;
    this.successCount = 0;
    this.requestCount = 0;
  }

  async execute(fn, fallbackFn = null) {
    this.requestCount++;
    
    // Check if circuit should be opened
    if (this.state === 'OPEN') {
      if (Date.now() >= this.nextAttempt) {
        this.state = 'HALF_OPEN';
        console.log(`[CircuitBreaker ${this.name}] Moving to HALF_OPEN state`);
      } else {
        console.log(`[CircuitBreaker ${this.name}] Circuit OPEN, using fallback`);
        this.emit('open');
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
      if (fallbackFn) {
        console.log(`[CircuitBreaker ${this.name}] Using fallback after failure`);
        return await fallbackFn();
      }
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.successCount++;
    
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      console.log(`[CircuitBreaker ${this.name}] Circuit recovered - moving to CLOSED`);
      this.emit('close');
    }
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
      console.log(`[CircuitBreaker ${this.name}] Circuit OPEN after ${this.failureCount} failures`);
      this.emit('open');
    }
  }

  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      requestCount: this.requestCount,
      lastFailureTime: this.lastFailureTime,
      nextAttempt: this.nextAttempt
    };
  }

  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.requestCount = 0;
    this.lastFailureTime = null;
    this.nextAttempt = null;
    console.log(`[CircuitBreaker ${this.name}] Manual reset`);
  }
}

// Service-specific circuit breakers
export const circuitBreakers = {
  tomtom: new CircuitBreaker({ 
    name: 'TomTom', 
    failureThreshold: 3,
    resetTimeout: 30000 
  }),
  streetManager: new CircuitBreaker({ 
    name: 'StreetManager', 
    failureThreshold: 5,
    resetTimeout: 60000 
  }),
  nationalHighways: new CircuitBreaker({ 
    name: 'NationalHighways', 
    failureThreshold: 4,
    resetTimeout: 45000 
  }),
  weather: new CircuitBreaker({ 
    name: 'Weather', 
    failureThreshold: 2,
    resetTimeout: 20000 
  })
};

export default CircuitBreaker;
