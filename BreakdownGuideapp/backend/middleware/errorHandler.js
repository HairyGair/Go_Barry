/**
 * Centralized error handling middleware
 * Ensures consistent error responses across all endpoints
 */

export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message, err.stack);

  const errorResponse = {
    success: false,
    error: err.message || 'An unexpected error occurred',
    code: err.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  // Validation errors
  if (err.name === 'ValidationError' || err.code === 'VALIDATION_ERROR') {
    return res.status(400).json({
      ...errorResponse,
      code: 'VALIDATION_ERROR',
      details: err.details || []
    });
  }

  // Authentication errors
  if (err.code === 'AUTH_FAILED' || err.code === 'TOKEN_EXPIRED') {
    return res.status(401).json({
      ...errorResponse,
      code: 'AUTHENTICATION_FAILED'
    });
  }

  // Rate limit errors
  if (err.code === 'RATE_LIMIT_EXCEEDED') {
    return res.status(429).json({
      ...errorResponse,
      resetTime: err.resetTime,
      retryAfter: err.retryAfter
    });
  }

  // Database errors (hide details from client)
  if (err.code?.startsWith('ER_')) {
    return res.status(500).json({
      success: false,
      error: 'Database error occurred',
      code: 'DATABASE_ERROR',
      timestamp: new Date().toISOString()
    });
  }

  // Default 500 error
  res.status(err.statusCode || 500).json(errorResponse);
};

/**
 * Async error wrapper for Express routes
 * Automatically catches Promise rejections
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Not Found handler
 * Should be added before error handler
 */
export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  error.code = 'NOT_FOUND';
  next(error);
};
