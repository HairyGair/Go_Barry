// backend/services/communications/errorHandler.js
// Error Handling Framework for Communications Platform
// Centralized error handling, logging, and recovery strategies

import EventEmitter from 'events';

class CommunicationsErrorHandler extends EventEmitter {
  constructor() {
    super();
    this.errorCounts = new Map(); // Track error frequencies
    this.circuitBreakers = new Map(); // Circuit breaker states
    this.lastErrors = []; // Recent error history
    this.maxRecentErrors = 100;
    
    // Circuit breaker thresholds
    this.circuitBreakerThreshold = 5; // Failures before opening
    this.circuitBreakerTimeout = 30000; // 30 seconds before retry
    
    console.log('🛡️ Communications Error Handler initialized');
  }

  /**
   * Handle communication service errors
   */
  handleError(error, context = {}) {
    const errorInfo = this.analyzeError(error, context);
    
    // Log the error
    this.logError(errorInfo);
    
    // Track error frequency
    this.trackErrorFrequency(errorInfo);
    
    // Check circuit breaker status
    this.updateCircuitBreaker(errorInfo);
    
    // Determine recovery strategy
    const recoveryStrategy = this.determineRecoveryStrategy(errorInfo);
    
    // Emit error event for monitoring
    this.emit('error', errorInfo);
    
    return {
      errorInfo,
      recoveryStrategy,
      shouldRetry: recoveryStrategy.shouldRetry,
      retryDelay: recoveryStrategy.retryDelay
    };
  }

  /**
   * Analyze error and categorize
   */
  analyzeError(error, context) {
    const errorInfo = {
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack,
      name: error.name,
      context,
      category: this.categorizeError(error),
      severity: this.determineSeverity(error, context),
      service: context.service || 'unknown',
      operation: context.operation || 'unknown',
      supervisorId: context.supervisorId || 'system',
      retryable: this.isRetryable(error),
      id: this.generateErrorId()
    };

    return errorInfo;
  }

  /**
   * Categorize error types
   */
  categorizeError(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('timeout') || message.includes('econnreset')) {
      return 'NETWORK_ERROR';
    }
    
    if (message.includes('auth') || message.includes('unauthorized') || message.includes('forbidden')) {
      return 'AUTHENTICATION_ERROR';
    }
    
    if (message.includes('rate limit') || message.includes('quota') || message.includes('throttle')) {
      return 'RATE_LIMIT_ERROR';
    }
    
    if (message.includes('validation') || message.includes('invalid') || message.includes('malformed')) {
      return 'VALIDATION_ERROR';
    }
    
    if (message.includes('not found') || message.includes('404')) {
      return 'NOT_FOUND_ERROR';
    }
    
    if (message.includes('server error') || message.includes('500') || message.includes('internal')) {
      return 'SERVER_ERROR';
    }
    
    if (message.includes('email') || message.includes('smtp') || message.includes('mail')) {
      return 'EMAIL_ERROR';
    }
    
    if (message.includes('voip') || message.includes('call') || message.includes('8x8')) {
      return 'VOIP_ERROR';
    }
    
    return 'UNKNOWN_ERROR';
  }

  /**
   * Determine error severity
   */
  determineSeverity(error, context) {
    const category = this.categorizeError(error);
    
    // Critical errors - require immediate attention
    if (category === 'AUTHENTICATION_ERROR' || 
        category === 'SERVER_ERROR' ||
        (context.isEmergency && category === 'VOIP_ERROR')) {
      return 'CRITICAL';
    }
    
    // High severity - affects functionality
    if (category === 'NETWORK_ERROR' || 
        category === 'EMAIL_ERROR' ||
        category === 'VOIP_ERROR') {
      return 'HIGH';
    }
    
    // Medium severity - degraded experience
    if (category === 'RATE_LIMIT_ERROR' || 
        category === 'NOT_FOUND_ERROR') {
      return 'MEDIUM';
    }
    
    // Low severity - minor issues
    if (category === 'VALIDATION_ERROR') {
      return 'LOW';
    }
    
    return 'MEDIUM'; // Default
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error) {
    const category = this.categorizeError(error);
    
    // Retryable errors
    const retryableCategories = [
      'NETWORK_ERROR',
      'RATE_LIMIT_ERROR',
      'SERVER_ERROR'
    ];
    
    // Non-retryable errors
    const nonRetryableCategories = [
      'AUTHENTICATION_ERROR',
      'VALIDATION_ERROR',
      'NOT_FOUND_ERROR'
    ];
    
    if (retryableCategories.includes(category)) {
      return true;
    }
    
    if (nonRetryableCategories.includes(category)) {
      return false;
    }
    
    // Default to retryable for unknown errors
    return true;
  }

  /**
   * Determine recovery strategy
   */
  determineRecoveryStrategy(errorInfo) {
    const strategy = {
      shouldRetry: false,
      retryDelay: 0,
      maxRetries: 0,
      fallbackAction: null,
      escalate: false
    };

    // Check circuit breaker
    if (this.isCircuitBreakerOpen(errorInfo.service)) {
      strategy.shouldRetry = false;
      strategy.fallbackAction = 'CIRCUIT_BREAKER_OPEN';
      return strategy;
    }

    // Base retry logic on error category and severity
    switch (errorInfo.category) {
      case 'NETWORK_ERROR':
        strategy.shouldRetry = true;
        strategy.retryDelay = this.calculateBackoffDelay(errorInfo);
        strategy.maxRetries = 3;
        strategy.fallbackAction = 'QUEUE_FOR_LATER';
        break;

      case 'RATE_LIMIT_ERROR':
        strategy.shouldRetry = true;
        strategy.retryDelay = 60000; // 1 minute for rate limits
        strategy.maxRetries = 2;
        strategy.fallbackAction = 'REDUCE_REQUEST_RATE';
        break;

      case 'SERVER_ERROR':
        strategy.shouldRetry = true;
        strategy.retryDelay = this.calculateBackoffDelay(errorInfo);
        strategy.maxRetries = 2;
        strategy.fallbackAction = 'ESCALATE_TO_ADMIN';
        break;

      case 'AUTHENTICATION_ERROR':
        strategy.shouldRetry = false;
        strategy.fallbackAction = 'REFRESH_AUTH_TOKEN';
        strategy.escalate = true;
        break;

      case 'EMAIL_ERROR':
        strategy.shouldRetry = true;
        strategy.retryDelay = 30000; // 30 seconds
        strategy.maxRetries = 2;
        strategy.fallbackAction = 'USE_BACKUP_EMAIL_SERVICE';
        break;

      case 'VOIP_ERROR':
        strategy.shouldRetry = errorInfo.severity !== 'CRITICAL';
        strategy.retryDelay = 10000; // 10 seconds
        strategy.maxRetries = 1;
        strategy.fallbackAction = 'LOG_CALL_FAILURE';
        break;

      case 'VALIDATION_ERROR':
        strategy.shouldRetry = false;
        strategy.fallbackAction = 'RETURN_VALIDATION_ERROR';
        break;

      default:
        strategy.shouldRetry = true;
        strategy.retryDelay = 5000;
        strategy.maxRetries = 1;
        strategy.fallbackAction = 'LOG_AND_CONTINUE';
    }

    return strategy;
  }

  /**
   * Update circuit breaker state
   */
  updateCircuitBreaker(errorInfo) {
    const service = errorInfo.service;
    const breaker = this.circuitBreakers.get(service) || {
      state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
      failureCount: 0,
      lastFailure: null,
      nextRetry: null
    };

    if (errorInfo.severity === 'CRITICAL' || errorInfo.category === 'SERVER_ERROR') {
      breaker.failureCount++;
      breaker.lastFailure = Date.now();

      if (breaker.failureCount >= this.circuitBreakerThreshold) {
        breaker.state = 'OPEN';
        breaker.nextRetry = Date.now() + this.circuitBreakerTimeout;
        
        console.log(`⚡ Circuit breaker opened for service: ${service}`);
        this.emit('circuitBreakerOpened', { service, failureCount: breaker.failureCount });
      }
    }

    this.circuitBreakers.set(service, breaker);
  }

  /**
   * Check if circuit breaker is open for a service
   */
  isCircuitBreakerOpen(service) {
    const breaker = this.circuitBreakers.get(service);
    if (!breaker || breaker.state === 'CLOSED') {
      return false;
    }

    if (breaker.state === 'OPEN') {
      // Check if it's time to try again
      if (Date.now() >= breaker.nextRetry) {
        breaker.state = 'HALF_OPEN';
        console.log(`🔄 Circuit breaker half-open for service: ${service}`);
        this.emit('circuitBreakerHalfOpen', { service });
        return false;
      }
      return true;
    }

    return false; // HALF_OPEN allows one attempt
  }

  /**
   * Reset circuit breaker on successful operation
   */
  resetCircuitBreaker(service) {
    const breaker = this.circuitBreakers.get(service);
    if (breaker && breaker.state !== 'CLOSED') {
      breaker.state = 'CLOSED';
      breaker.failureCount = 0;
      breaker.lastFailure = null;
      breaker.nextRetry = null;
      
      console.log(`✅ Circuit breaker reset for service: ${service}`);
      this.emit('circuitBreakerReset', { service });
    }
  }

  /**
   * Calculate exponential backoff delay
   */
  calculateBackoffDelay(errorInfo, attempt = 1) {
    const baseDelay = 1000; // 1 second
    const maxDelay = 60000; // 1 minute
    const jitter = Math.random() * 0.1; // ±10% jitter
    
    const delay = Math.min(
      baseDelay * Math.pow(2, attempt - 1),
      maxDelay
    );
    
    return Math.floor(delay * (1 + jitter));
  }

  /**
   * Track error frequency for pattern detection
   */
  trackErrorFrequency(errorInfo) {
    const key = `${errorInfo.service}_${errorInfo.category}`;
    const count = this.errorCounts.get(key) || 0;
    this.errorCounts.set(key, count + 1);

    // Add to recent errors list
    this.lastErrors.unshift(errorInfo);
    if (this.lastErrors.length > this.maxRecentErrors) {
      this.lastErrors = this.lastErrors.slice(0, this.maxRecentErrors);
    }

    // Check for error spikes
    this.detectErrorSpikes(key, count + 1);
  }

  /**
   * Detect error spikes and patterns
   */
  detectErrorSpikes(errorKey, count) {
    const recentTimeframe = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    
    const recentErrors = this.lastErrors.filter(error => 
      error.timestamp > (now - recentTimeframe) &&
      `${error.service}_${error.category}` === errorKey
    );

    if (recentErrors.length >= 5) {
      console.log(`🚨 Error spike detected: ${errorKey} (${recentErrors.length} errors in 5 minutes)`);
      this.emit('errorSpike', { errorKey, count: recentErrors.length, timeframe: recentTimeframe });
    }
  }

  /**
   * Log error with appropriate level
   */
  logError(errorInfo) {
    const logLevel = this.getLogLevel(errorInfo.severity);
    const logMessage = this.formatErrorMessage(errorInfo);

    switch (logLevel) {
      case 'error':
        console.error(logMessage);
        break;
      case 'warn':
        console.warn(logMessage);
        break;
      case 'info':
        console.info(logMessage);
        break;
      default:
        console.log(logMessage);
    }
  }

  /**
   * Get appropriate log level for severity
   */
  getLogLevel(severity) {
    switch (severity) {
      case 'CRITICAL':
        return 'error';
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warn';
      case 'LOW':
        return 'info';
      default:
        return 'warn';
    }
  }

  /**
   * Format error message for logging
   */
  formatErrorMessage(errorInfo) {
    return `🚨 [${errorInfo.severity}] ${errorInfo.category} in ${errorInfo.service}/${errorInfo.operation}: ${errorInfo.message} (ID: ${errorInfo.id}, Supervisor: ${errorInfo.supervisorId})`;
  }

  /**
   * Generate unique error ID
   */
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    const lastHour = now - (60 * 60 * 1000);

    const recent24h = this.lastErrors.filter(e => e.timestamp > last24Hours);
    const recent1h = this.lastErrors.filter(e => e.timestamp > lastHour);

    const stats = {
      total: this.lastErrors.length,
      last24Hours: recent24h.length,
      lastHour: recent1h.length,
      byCategory: {},
      bySeverity: {},
      byService: {},
      circuitBreakers: Object.fromEntries(this.circuitBreakers)
    };

    // Count by category, severity, and service
    this.lastErrors.forEach(error => {
      stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
      stats.byService[error.service] = (stats.byService[error.service] || 0) + 1;
    });

    return stats;
  }

  /**
   * Get overall health summary
   */
  getOverallHealth() {
    const services = ['email', 'voip', 'sms', 'ticketer', 'queue'];
    const serviceHealth = services.map(service => this.getServiceHealth(service));
    
    const criticalServices = serviceHealth.filter(s => s.health === 'CRITICAL').length;
    const degradedServices = serviceHealth.filter(s => s.health === 'DEGRADED').length;
    
    let overallStatus = 'HEALTHY';
    if (criticalServices > 0) {
      overallStatus = 'CRITICAL';
    } else if (degradedServices > 1) {
      overallStatus = 'DEGRADED';
    } else if (degradedServices > 0) {
      overallStatus = 'WARNING';
    }

    return {
      status: overallStatus,
      services: serviceHealth,
      summary: {
        healthy: serviceHealth.filter(s => s.health === 'HEALTHY').length,
        warning: serviceHealth.filter(s => s.health === 'WARNING').length,
        degraded: serviceHealth.filter(s => s.health === 'DEGRADED').length,
        critical: serviceHealth.filter(s => s.health === 'CRITICAL').length
      }
    };
  }

  /**
   * Get service health
   */
  getServiceHealth(service) {
    const now = Date.now();
    const last15Minutes = now - (15 * 60 * 1000);
    
    const recentErrors = this.lastErrors.filter(error => 
      error.service === service && error.timestamp > last15Minutes
    );

    const breaker = this.circuitBreakers.get(service);
    
    let health = 'HEALTHY';
    
    if (breaker && breaker.state === 'OPEN') {
      health = 'CRITICAL';
    } else if (recentErrors.length >= 10) {
      health = 'DEGRADED';
    } else if (recentErrors.length >= 5) {
      health = 'WARNING';
    }

    return {
      service,
      health,
      recentErrors: recentErrors.length,
      circuitBreakerState: breaker?.state || 'CLOSED',
      lastError: recentErrors[0] || null
    };
  }

  /**
   * Record successful operation
   */
  recordSuccess(service) {
    this.resetCircuitBreaker(service);
  }
}

// Export singleton instance
export const communicationsErrorHandler = new CommunicationsErrorHandler();
export default communicationsErrorHandler;