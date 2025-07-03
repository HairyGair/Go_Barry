// backend/middleware/errorHandler.js
// Centralized error handling for Communications Platform
// Provides consistent error responses and logging

import fs from 'fs/promises';
import path from 'path';

class CommunicationsErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 1000; // Keep last 1000 errors in memory
    this.logFilePath = path.join(process.cwd(), 'logs', 'communications-errors.log');
    this.initializeLogging();
  }

  async initializeLogging() {
    try {
      // Ensure logs directory exists
      const logsDir = path.dirname(this.logFilePath);
      await fs.mkdir(logsDir, { recursive: true });
      console.log('📝 Communications error logging initialized');
    } catch (error) {
      console.error('❌ Failed to initialize error logging:', error);
    }
  }

  /**
   * Main error handling middleware
   */
  handleError = (error, req, res, next) => {
    const errorInfo = this.processError(error, req);
    
    // Log the error
    this.logError(errorInfo);
    
    // Send appropriate response
    this.sendErrorResponse(res, errorInfo);
  };

  /**
   * Process error and extract relevant information
   */
  processError(error, req) {
    const timestamp = new Date().toISOString();
    const requestId = req.headers['x-request-id'] || this.generateRequestId();
    
    const errorInfo = {
      requestId,
      timestamp,
      path: req.path,
      method: req.method,
      supervisorId: req.supervisor?.id || 'anonymous',
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection?.remoteAddress,
      
      // Error details
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code || 'UNKNOWN_ERROR',
      
      // Additional context
      body: this.sanitizeRequestBody(req.body),
      query: req.query,
      params: req.params
    };

    // Classify error type
    errorInfo.category = this.classifyError(error);
    errorInfo.severity = this.determineSeverity(error);
    
    return errorInfo;
  }

  /**
   * Classify error into categories
   */
  classifyError(error) {
    if (error.name === 'ValidationError') return 'VALIDATION';
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') return 'NETWORK';
    if (error.name === 'UnauthorizedError' || error.message.includes('auth')) return 'AUTHENTICATION';
    if (error.name === 'RateLimitError') return 'RATE_LIMIT';
    if (error.name === 'TimeoutError') return 'TIMEOUT';
    if (error.message.includes('database') || error.message.includes('convex')) return 'DATABASE';
    if (error.message.includes('email') || error.message.includes('smtp')) return 'EMAIL';
    if (error.message.includes('voip') || error.message.includes('call')) return 'VOIP';
    return 'APPLICATION';
  }

  /**
   * Determine error severity
   */
  determineSeverity(error) {
    if (error.name === 'ValidationError') return 'LOW';
    if (error.code === 'ENOTFOUND') return 'MEDIUM';
    if (error.message.includes('database')) return 'HIGH';
    if (error.message.includes('auth')) return 'MEDIUM';
    if (error.name === 'TypeError' || error.name === 'ReferenceError') return 'HIGH';
    return 'MEDIUM';
  }

  /**
   * Sanitize request body to remove sensitive data
   */
  sanitizeRequestBody(body) {
    if (!body || typeof body !== 'object') return body;
    
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'authorization'];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  /**
   * Log error to file and memory
   */
  async logError(errorInfo) {
    try {
      // Add to memory log
      this.errorLog.push(errorInfo);
      if (this.errorLog.length > this.maxLogSize) {
        this.errorLog = this.errorLog.slice(-this.maxLogSize);
      }

      // Write to file
      const logLine = JSON.stringify(errorInfo) + '\n';
      await fs.appendFile(this.logFilePath, logLine);

      // Console log based on severity
      const logMethod = errorInfo.severity === 'HIGH' ? 'error' : 
                       errorInfo.severity === 'MEDIUM' ? 'warn' : 'log';
      
      console[logMethod](`❌ Communications Error [${errorInfo.category}]:`, {
        requestId: errorInfo.requestId,
        path: errorInfo.path,
        supervisor: errorInfo.supervisorId,
        message: errorInfo.message
      });

    } catch (logError) {
      console.error('❌ Failed to log error:', logError);
    }
  }

  /**
   * Send appropriate error response
   */
  sendErrorResponse(res, errorInfo) {
    let statusCode = 500;
    let userMessage = 'An unexpected error occurred';

    // Determine status code and user message based on error
    switch (errorInfo.category) {
      case 'VALIDATION':
        statusCode = 400;
        userMessage = 'Invalid request data provided';
        break;
      case 'AUTHENTICATION':
        statusCode = 401;
        userMessage = 'Authentication required or invalid';
        break;
      case 'RATE_LIMIT':
        statusCode = 429;
        userMessage = 'Too many requests, please try again later';
        break;
      case 'NETWORK':
        statusCode = 503;
        userMessage = 'External service temporarily unavailable';
        break;
      case 'EMAIL':
        statusCode = 502;
        userMessage = 'Email service temporarily unavailable';
        break;
      case 'VOIP':
        statusCode = 502;
        userMessage = 'Voice service temporarily unavailable';
        break;
    }

    const response = {
      success: false,
      error: userMessage,
      code: errorInfo.code,
      requestId: errorInfo.requestId,
      timestamp: errorInfo.timestamp
    };

    // Include additional details for development
    if (process.env.NODE_ENV === 'development') {
      response.details = {
        path: errorInfo.path,
        category: errorInfo.category,
        severity: errorInfo.severity
      };
    }

    res.status(statusCode).json(response);
  }

  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return `comm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get recent errors for monitoring
   */
  getRecentErrors(limit = 50) {
    return this.errorLog.slice(-limit);
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const recent = this.errorLog.slice(-100); // Last 100 errors
    const stats = {
      total: recent.length,
      byCategory: {},
      bySeverity: {},
      byPath: {},
      recentTrends: {}
    };

    recent.forEach(error => {
      // Count by category
      stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;
      
      // Count by severity
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
      
      // Count by path
      stats.byPath[error.path] = (stats.byPath[error.path] || 0) + 1;
    });

    return stats;
  }

  /**
   * Circuit breaker for failing services
   */
  createCircuitBreaker(serviceName, failureThreshold = 5, timeoutMs = 30000) {
    return {
      failures: 0,
      lastFailureTime: null,
      isOpen: false,
      
      async execute(operation) {
        // Check if circuit is open
        if (this.isOpen) {
          const timeSinceFailure = Date.now() - this.lastFailureTime;
          if (timeSinceFailure < timeoutMs) {
            throw new Error(`Circuit breaker open for ${serviceName}`);
          } else {
            // Try to close circuit
            this.isOpen = false;
            this.failures = 0;
          }
        }

        try {
          const result = await operation();
          // Reset on success
          this.failures = 0;
          return result;
        } catch (error) {
          this.failures++;
          this.lastFailureTime = Date.now();
          
          if (this.failures >= failureThreshold) {
            this.isOpen = true;
            console.warn(`🔌 Circuit breaker opened for ${serviceName}`);
          }
          
          throw error;
        }
      }
    };
  }
}

// Create singleton instance
const errorHandler = new CommunicationsErrorHandler();

// Export middleware function and utilities
export const handleCommunicationsError = errorHandler.handleError;
export const getErrorStats = () => errorHandler.getErrorStats();
export const getRecentErrors = (limit) => errorHandler.getRecentErrors(limit);
export const createCircuitBreaker = (serviceName, failureThreshold, timeoutMs) => 
  errorHandler.createCircuitBreaker(serviceName, failureThreshold, timeoutMs);

export default errorHandler;