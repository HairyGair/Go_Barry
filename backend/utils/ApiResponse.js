// Standardized API Response Helper
// Ensures consistent response format across all endpoints

class ApiResponse {
  static success(data, metadata = {}) {
    return {
      success: true,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };
  }
  
  static error(message, code = 500, details = null) {
    const response = {
      success: false,
      error: {
        message,
        code,
        timestamp: new Date().toISOString()
      }
    };
    
    if (details) {
      response.error.details = details;
    }
    
    return response;
  }
  
  static paginated(data, page, limit, total) {
    return {
      success: true,
      data,
      metadata: {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total
        },
        timestamp: new Date().toISOString()
      }
    };
  }
  
  static cached(data, cacheInfo) {
    return {
      success: true,
      data,
      metadata: {
        cached: true,
        cacheTimestamp: cacheInfo.timestamp,
        cacheExpiry: cacheInfo.expiry,
        timestamp: new Date().toISOString()
      }
    };
  }
}

// Express middleware for standardized error handling
export const apiErrorHandler = (err, req, res, next) => {
  console.error('API Error:', err);
  
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  
  res.status(status).json(ApiResponse.error(message, status, err.details));
};

// Async route wrapper to catch errors
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default ApiResponse;
