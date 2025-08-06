// Error Recovery System Configuration
// This module initializes and configures all error recovery mechanisms

import { circuitBreakers } from './services/circuitBreaker.js';
import fallbackManager from './services/fallbackDataManager.js';
import RetryManager from './services/retryManager.js';

class ErrorRecoverySystem {
  constructor() {
    this.initialized = false;
    this.monitors = new Map();
  }

  async initialize() {
    if (this.initialized) return;
    
    console.log('🛡️ Initializing Error Recovery System...');
    
    // Configure circuit breakers
    this.setupCircuitBreakers();
    
    // Setup health monitoring
    this.startHealthMonitoring();
    
    // Setup fallback data cleanup
    this.scheduleFallbackCleanup();
    
    this.initialized = true;
    console.log('✅ Error Recovery System initialized');
  }

  setupCircuitBreakers() {
    // Configure event listeners for circuit breakers
    Object.entries(circuitBreakers).forEach(([name, breaker]) => {
      breaker.on('open', () => {
        console.warn(`⚠️ Circuit breaker ${name} opened - using fallback`);
        this.notifyOpsTeam(name, 'open');
      });
      
      breaker.on('close', () => {
        console.log(`✅ Circuit breaker ${name} recovered`);
        this.notifyOpsTeam(name, 'recovered');
      });
    });
  }

  startHealthMonitoring() {
    // Monitor circuit breaker health every 30 seconds
    setInterval(() => {
      const unhealthyServices = [];
      
      Object.entries(circuitBreakers).forEach(([name, breaker]) => {
        const status = breaker.getStatus();
        if (status.state === 'OPEN') {
          unhealthyServices.push({
            service: name,
            failureCount: status.failureCount,
            nextRetry: new Date(status.nextAttempt).toISOString()
          });
        }
      });
      
      if (unhealthyServices.length > 0) {
        console.warn('⚠️ Unhealthy services detected:', unhealthyServices);
      }
    }, 30000);
  }

  scheduleFallbackCleanup() {
    // Clean up old fallback data daily
    setInterval(async () => {
      console.log('🧹 Running fallback data cleanup...');
      await fallbackManager.cleanOldFallbacks();
    }, 24 * 60 * 60 * 1000);
  }

  async notifyOpsTeam(service, status) {
    // TODO: Integrate with communications hub to notify supervisors
    console.log(`📧 Notification: ${service} service is ${status}`);
  }

  getSystemStatus() {
    const status = {
      initialized: this.initialized,
      circuitBreakers: {},
      timestamp: new Date().toISOString()
    };
    
    Object.entries(circuitBreakers).forEach(([name, breaker]) => {
      status.circuitBreakers[name] = breaker.getStatus();
    });
    
    return status;
  }

  // Force recovery of a specific service
  async forceRecovery(serviceName) {
    if (circuitBreakers[serviceName]) {
      circuitBreakers[serviceName].reset();
      console.log(`🔄 Forced recovery of ${serviceName}`);
      return true;
    }
    return false;
  }

  // Get recommended action for a failed service
  getRecoveryRecommendation(serviceName) {
    const breaker = circuitBreakers[serviceName];
    if (!breaker) return null;
    
    const status = breaker.getStatus();
    
    if (status.state === 'CLOSED') {
      return { action: 'none', message: 'Service is healthy' };
    }
    
    if (status.state === 'HALF_OPEN') {
      return { 
        action: 'monitor', 
        message: 'Service is recovering, monitoring ongoing' 
      };
    }
    
    // OPEN state
    const timeSinceFailure = Date.now() - status.lastFailureTime;
    const timeUntilRetry = status.nextAttempt - Date.now();
    
    if (timeSinceFailure > 5 * 60 * 1000) { // More than 5 minutes
      return {
        action: 'investigate',
        message: `Service has been down for ${Math.round(timeSinceFailure / 60000)} minutes. Investigation needed.`,
        nextRetry: new Date(status.nextAttempt).toISOString()
      };
    }
    
    return {
      action: 'wait',
      message: `Temporary failure. Retry in ${Math.round(timeUntilRetry / 1000)} seconds.`,
      nextRetry: new Date(status.nextAttempt).toISOString()
    };
  }
}

// Export singleton instance
const errorRecoverySystem = new ErrorRecoverySystem();
export default errorRecoverySystem;

// Export individual components for direct access
export { circuitBreakers, fallbackManager, RetryManager };
