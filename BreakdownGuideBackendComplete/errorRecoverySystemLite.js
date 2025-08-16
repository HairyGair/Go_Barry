// Lightweight Error Recovery System - Memory Optimized
// Initializes components on-demand to prevent memory crashes

class ErrorRecoverySystemLite {
  constructor() {
    this.initialized = false;
    this.circuitBreakers = null;
    this.fallbackManager = null;
  }

  // Lazy initialization - only when needed
  async getCircuitBreakers() {
    if (!this.circuitBreakers) {
      const { circuitBreakers } = await import('./services/circuitBreaker.js');
      this.circuitBreakers = circuitBreakers;
    }
    return this.circuitBreakers;
  }

  async getFallbackManager() {
    if (!this.fallbackManager) {
      const module = await import('./services/fallbackDataManager.js');
      this.fallbackManager = module.default;
    }
    return this.fallbackManager;
  }

  // Minimal initialization - just set a flag
  async initialize() {
    if (this.initialized) return;
    
    console.log('🛡️ Error Recovery System (Lite) ready for on-demand activation');
    this.initialized = true;
    
    // Don't initialize components until they're actually used
    // This prevents memory allocation at startup
  }

  // Get status without initializing everything
  async getSystemStatus() {
    const status = {
      initialized: this.initialized,
      componentsLoaded: {
        circuitBreakers: !!this.circuitBreakers,
        fallbackManager: !!this.fallbackManager
      },
      timestamp: new Date().toISOString()
    };
    
    // Only get circuit breaker status if already loaded
    if (this.circuitBreakers) {
      status.circuitBreakers = {};
      Object.entries(this.circuitBreakers).forEach(([name, breaker]) => {
        status.circuitBreakers[name] = breaker.getStatus();
      });
    }
    
    return status;
  }
}

// Export singleton instance
const errorRecoverySystemLite = new ErrorRecoverySystemLite();
export default errorRecoverySystemLite;
