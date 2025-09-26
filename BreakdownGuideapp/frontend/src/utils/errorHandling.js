// Comprehensive Error Handling Strategy for Authentication System
// Provides consistent error messaging and handling across the application

// Error message constants - consistent user-facing messages
export const ERROR_MESSAGES = {
  // Authentication errors
  'invalid_credentials': 'Invalid email or password',
  'auth/invalid-login-credentials': 'Invalid email or password',
  'auth/user-not-found': 'Invalid email or password', // Generic to prevent email enumeration
  'auth/wrong-password': 'Invalid email or password', // Generic to prevent email enumeration
  'auth/too-many-requests': 'Too many login attempts. Please wait before trying again.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password is too weak. Please choose a stronger password.',
  'auth/invalid-email': 'Please enter a valid email address.',

  // Network and connectivity errors
  'network_error': 'Connection error. Please check your internet connection.',
  'offline': 'You appear to be offline. Please check your connection.',
  'timeout': 'Request timed out. Please try again.',
  'cors_error': 'Connection error. Please try again.',

  // Session and token errors
  'session_expired': 'Your session has expired. Please sign in again.',
  'token_expired': 'Your session has expired. Please sign in again.',
  'invalid_token': 'Authentication error. Please sign in again.',
  'refresh_failed': 'Session refresh failed. Please sign in again.',

  // Server errors
  'server_error': 'Server error. Please try again later.',
  'internal_error': 'An unexpected error occurred. Please try again.',
  'service_unavailable': 'Service temporarily unavailable. Please try again later.',
  'maintenance': 'System maintenance in progress. Please try again later.',

  // Rate limiting
  'rate_limited': 'Too many attempts. Please wait before trying again.',
  'rate_limit_exceeded': 'Rate limit exceeded. Please wait a few minutes.',

  // Validation errors
  'invalid_input': 'Please check your input and try again.',
  'missing_fields': 'Please fill in all required fields.',
  'email_required': 'Email address is required.',
  'password_required': 'Password is required.',
  'invalid_email_format': 'Please enter a valid email address.',
  'password_too_short': 'Password must be at least 6 characters long.',

  // Permission errors
  'insufficient_permissions': 'You do not have permission to perform this action.',
  'access_denied': 'Access denied. Please contact your administrator.',
  'unauthorized': 'You are not authorized to access this resource.',

  // Default fallback
  'unknown': 'An unexpected error occurred. Please try again.',
  'default': 'Something went wrong. Please try again.'
};

// Error severity levels for logging and UI treatment
export const ERROR_SEVERITY = {
  LOW: 'low',       // Minor issues, user can continue
  MEDIUM: 'medium', // Requires user action but not critical
  HIGH: 'high',     // Critical errors that block functionality
  CRITICAL: 'critical' // System-level errors requiring immediate attention
};

// Error categories for analytics and monitoring
export const ERROR_CATEGORIES = {
  AUTHENTICATION: 'authentication',
  NETWORK: 'network',
  VALIDATION: 'validation',
  PERMISSION: 'permission',
  SERVER: 'server',
  CLIENT: 'client',
  UNKNOWN: 'unknown'
};

// Comprehensive error classification
export const ERROR_CLASSIFICATION = {
  // Authentication
  'invalid_credentials': { severity: ERROR_SEVERITY.MEDIUM, category: ERROR_CATEGORIES.AUTHENTICATION, retryable: true },
  'auth/invalid-login-credentials': { severity: ERROR_SEVERITY.MEDIUM, category: ERROR_CATEGORIES.AUTHENTICATION, retryable: true },
  'auth/user-not-found': { severity: ERROR_SEVERITY.MEDIUM, category: ERROR_CATEGORIES.AUTHENTICATION, retryable: false },
  'auth/wrong-password': { severity: ERROR_SEVERITY.MEDIUM, category: ERROR_CATEGORIES.AUTHENTICATION, retryable: true },
  'auth/too-many-requests': { severity: ERROR_SEVERITY.HIGH, category: ERROR_CATEGORIES.AUTHENTICATION, retryable: true, retryDelay: 60000 },
  'auth/user-disabled': { severity: ERROR_SEVERITY.HIGH, category: ERROR_CATEGORIES.AUTHENTICATION, retryable: false },
  'session_expired': { severity: ERROR_SEVERITY.MEDIUM, category: ERROR_CATEGORIES.AUTHENTICATION, retryable: false },

  // Network
  'network_error': { severity: ERROR_SEVERITY.HIGH, category: ERROR_CATEGORIES.NETWORK, retryable: true, retryDelay: 3000 },
  'offline': { severity: ERROR_SEVERITY.HIGH, category: ERROR_CATEGORIES.NETWORK, retryable: true, retryDelay: 5000 },
  'timeout': { severity: ERROR_SEVERITY.MEDIUM, category: ERROR_CATEGORIES.NETWORK, retryable: true, retryDelay: 2000 },

  // Server
  'server_error': { severity: ERROR_SEVERITY.HIGH, category: ERROR_CATEGORIES.SERVER, retryable: true, retryDelay: 5000 },
  'service_unavailable': { severity: ERROR_SEVERITY.CRITICAL, category: ERROR_CATEGORIES.SERVER, retryable: true, retryDelay: 10000 },

  // Rate limiting
  'rate_limited': { severity: ERROR_SEVERITY.HIGH, category: ERROR_CATEGORIES.AUTHENTICATION, retryable: true, retryDelay: 15000 },

  // Validation
  'invalid_input': { severity: ERROR_SEVERITY.LOW, category: ERROR_CATEGORIES.VALIDATION, retryable: false },
  'missing_fields': { severity: ERROR_SEVERITY.LOW, category: ERROR_CATEGORIES.VALIDATION, retryable: false },

  // Permission
  'insufficient_permissions': { severity: ERROR_SEVERITY.HIGH, category: ERROR_CATEGORIES.PERMISSION, retryable: false },
  'unauthorized': { severity: ERROR_SEVERITY.HIGH, category: ERROR_CATEGORIES.PERMISSION, retryable: false }
};

// Error handler class for consistent processing
export class AuthErrorHandler {
  constructor(options = {}) {
    this.enableLogging = options.enableLogging !== false;
    this.enableAnalytics = options.enableAnalytics !== false;
    this.defaultRetryDelay = options.defaultRetryDelay || 1000;
    this.maxRetryDelay = options.maxRetryDelay || 30000;
  }

  // Process and normalize errors
  processError(error, context = '') {
    const timestamp = new Date().toISOString();

    // Normalize error to a standard format
    const normalizedError = this.normalizeError(error);

    // Get error classification
    const classification = this.classifyError(normalizedError.code);

    // Create processed error object
    const processedError = {
      code: normalizedError.code,
      message: this.getUserMessage(normalizedError.code),
      originalMessage: normalizedError.message,
      severity: classification.severity,
      category: classification.category,
      retryable: classification.retryable,
      retryDelay: classification.retryDelay || this.defaultRetryDelay,
      context,
      timestamp,
      originalError: error
    };

    // Log error if enabled
    if (this.enableLogging) {
      this.logError(processedError);
    }

    // Send to analytics if enabled
    if (this.enableAnalytics) {
      this.trackError(processedError);
    }

    return processedError;
  }

  // Normalize different error formats to a standard structure
  normalizeError(error) {
    if (!error) {
      return { code: 'unknown', message: 'Unknown error occurred' };
    }

    // Handle Supabase errors
    if (error.message?.includes('Invalid login credentials')) {
      return { code: 'invalid_credentials', message: error.message };
    }

    // Handle Auth errors with auth/ prefix
    if (error.code?.startsWith('auth/')) {
      return { code: error.code, message: error.message };
    }

    // Handle network errors
    if (error.message?.includes('fetch') || error.message?.includes('network') || !navigator.onLine) {
      return { code: 'network_error', message: 'Network connection error' };
    }

    // Handle timeout errors
    if (error.message?.includes('timeout') || error.code === 'TIMEOUT') {
      return { code: 'timeout', message: 'Request timed out' };
    }

    // Handle HTTP status codes
    if (error.status) {
      switch (error.status) {
        case 401:
          return { code: 'unauthorized', message: 'Unauthorized access' };
        case 403:
          return { code: 'insufficient_permissions', message: 'Access forbidden' };
        case 429:
          return { code: 'rate_limited', message: 'Too many requests' };
        case 500:
        case 502:
        case 503:
          return { code: 'server_error', message: 'Server error' };
        case 504:
          return { code: 'timeout', message: 'Gateway timeout' };
        default:
          return { code: 'unknown', message: `HTTP ${error.status}` };
      }
    }

    // Handle string errors
    if (typeof error === 'string') {
      return { code: 'unknown', message: error };
    }

    // Handle Error objects
    if (error instanceof Error) {
      return { code: 'unknown', message: error.message };
    }

    // Fallback
    return { code: 'unknown', message: 'An unexpected error occurred' };
  }

  // Get error classification
  classifyError(errorCode) {
    return ERROR_CLASSIFICATION[errorCode] || {
      severity: ERROR_SEVERITY.MEDIUM,
      category: ERROR_CATEGORIES.UNKNOWN,
      retryable: false
    };
  }

  // Get user-friendly error message
  getUserMessage(errorCode) {
    return ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.default;
  }

  // Log error for debugging
  logError(processedError) {
    const logLevel = this.getLogLevel(processedError.severity);
    const logMessage = `[${processedError.category.toUpperCase()}] ${processedError.context}: ${processedError.message}`;

    console.group(`🔴 Authentication Error - ${processedError.timestamp}`);
    console[logLevel](logMessage);
    console.log('Error Code:', processedError.code);
    console.log('Severity:', processedError.severity);
    console.log('Retryable:', processedError.retryable);
    if (processedError.retryable) {
      console.log('Retry Delay:', `${processedError.retryDelay}ms`);
    }
    console.log('Original Error:', processedError.originalError);
    console.groupEnd();
  }

  // Get appropriate console log level
  getLogLevel(severity) {
    switch (severity) {
      case ERROR_SEVERITY.LOW:
        return 'info';
      case ERROR_SEVERITY.MEDIUM:
        return 'warn';
      case ERROR_SEVERITY.HIGH:
      case ERROR_SEVERITY.CRITICAL:
        return 'error';
      default:
        return 'log';
    }
  }

  // Track error for analytics (placeholder for analytics integration)
  trackError(processedError) {
    // In a real implementation, this would send to analytics service
    if (window.gtag) {
      window.gtag('event', 'auth_error', {
        error_code: processedError.code,
        error_category: processedError.category,
        error_severity: processedError.severity,
        error_context: processedError.context
      });
    }

    // Could also send to error tracking service like Sentry
    if (window.Sentry) {
      window.Sentry.captureException(processedError.originalError, {
        tags: {
          error_code: processedError.code,
          error_category: processedError.category,
          error_severity: processedError.severity
        },
        contexts: {
          error_details: {
            context: processedError.context,
            retryable: processedError.retryable,
            retry_delay: processedError.retryDelay
          }
        }
      });
    }
  }

  // Check if error is retryable with exponential backoff
  shouldRetry(processedError, attemptCount = 1, maxAttempts = 3) {
    if (!processedError.retryable || attemptCount >= maxAttempts) {
      return { shouldRetry: false, delay: 0 };
    }

    // Calculate exponential backoff delay
    const baseDelay = processedError.retryDelay;
    const exponentialDelay = baseDelay * Math.pow(2, attemptCount - 1);
    const jitteredDelay = exponentialDelay + (Math.random() * 1000); // Add jitter
    const finalDelay = Math.min(jitteredDelay, this.maxRetryDelay);

    return { shouldRetry: true, delay: finalDelay };
  }

  // Create user notification object for UI display
  createNotification(processedError) {
    const iconMap = {
      [ERROR_SEVERITY.LOW]: '⚠️',
      [ERROR_SEVERITY.MEDIUM]: '❌',
      [ERROR_SEVERITY.HIGH]: '🚫',
      [ERROR_SEVERITY.CRITICAL]: '💥'
    };

    const typeMap = {
      [ERROR_SEVERITY.LOW]: 'warning',
      [ERROR_SEVERITY.MEDIUM]: 'error',
      [ERROR_SEVERITY.HIGH]: 'error',
      [ERROR_SEVERITY.CRITICAL]: 'error'
    };

    return {
      id: `error_${Date.now()}`,
      type: typeMap[processedError.severity],
      icon: iconMap[processedError.severity],
      title: this.getErrorTitle(processedError.category),
      message: processedError.message,
      dismissible: processedError.severity !== ERROR_SEVERITY.CRITICAL,
      autoHide: processedError.severity === ERROR_SEVERITY.LOW,
      retryable: processedError.retryable,
      timestamp: processedError.timestamp
    };
  }

  // Get error title based on category
  getErrorTitle(category) {
    const titleMap = {
      [ERROR_CATEGORIES.AUTHENTICATION]: 'Authentication Error',
      [ERROR_CATEGORIES.NETWORK]: 'Connection Error',
      [ERROR_CATEGORIES.VALIDATION]: 'Validation Error',
      [ERROR_CATEGORIES.PERMISSION]: 'Permission Error',
      [ERROR_CATEGORIES.SERVER]: 'Server Error',
      [ERROR_CATEGORIES.CLIENT]: 'Application Error',
      [ERROR_CATEGORIES.UNKNOWN]: 'Error'
    };

    return titleMap[category] || 'Error';
  }
}

// Create default error handler instance
export const authErrorHandler = new AuthErrorHandler({
  enableLogging: true,
  enableAnalytics: true,
  defaultRetryDelay: 1000,
  maxRetryDelay: 30000
});

// Convenience function for quick error processing
export const processAuthError = (error, context = '') => {
  return authErrorHandler.processError(error, context);
};

// React hook for error handling in components
export const useAuthErrorHandler = () => {
  const [error, setError] = React.useState(null);
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleError = React.useCallback((error, context = '') => {
    const processedError = authErrorHandler.processError(error, context);
    setError(processedError);
    return processedError;
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
    setIsRetrying(false);
  }, []);

  const retryWithBackoff = React.useCallback(async (operation, attemptCount = 1, maxAttempts = 3) => {
    if (!error || !error.retryable) return;

    const retryInfo = authErrorHandler.shouldRetry(error, attemptCount, maxAttempts);
    if (!retryInfo.shouldRetry) return;

    setIsRetrying(true);

    // Wait for retry delay
    await new Promise(resolve => setTimeout(resolve, retryInfo.delay));

    try {
      const result = await operation();
      clearError();
      return result;
    } catch (newError) {
      const processedError = authErrorHandler.processError(newError, error.context);
      setError(processedError);

      // Try again if still retryable
      if (attemptCount < maxAttempts) {
        return retryWithBackoff(operation, attemptCount + 1, maxAttempts);
      }
    } finally {
      setIsRetrying(false);
    }
  }, [error, clearError]);

  return {
    error,
    isRetrying,
    handleError,
    clearError,
    retryWithBackoff,
    createNotification: error ? authErrorHandler.createNotification(error) : null
  };
};

export default authErrorHandler;