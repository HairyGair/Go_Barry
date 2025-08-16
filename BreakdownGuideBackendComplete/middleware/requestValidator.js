// backend/middleware/requestValidator.js
// Request validation middleware for Go BARRY communications

/**
 * Simple validation middleware - can be extended with express-validator later
 */
export const validateRequest = (req, res, next) => {
  // For now, just pass through - add validation rules as needed
  next();
};

/**
 * Common validation rules
 */
export const validationRules = {
  // Supervisor validation
  supervisorId: {
    in: ['body', 'query'],
    isString: true,
    notEmpty: {
      errorMessage: 'Supervisor ID is required'
    },
    trim: true
  },
  
  supervisorName: {
    in: ['body'],
    isString: true,
    notEmpty: {
      errorMessage: 'Supervisor name is required'
    },
    trim: true
  },
  
  // Message validation
  message: {
    in: ['body'],
    isString: true,
    notEmpty: {
      errorMessage: 'Message content is required'
    },
    isLength: {
      options: { min: 1, max: 5000 },
      errorMessage: 'Message must be between 1 and 5000 characters'
    }
  },
  
  // Email validation
  email: {
    in: ['body'],
    isEmail: {
      errorMessage: 'Invalid email format'
    },
    normalizeEmail: true
  },
  
  // Phone validation
  phoneNumber: {
    in: ['body'],
    matches: {
      options: /^[\d\s\+\-\(\)]+$/,
      errorMessage: 'Invalid phone number format'
    }
  },
  
  // Priority validation
  priority: {
    in: ['body'],
    isIn: {
      options: [['low', 'medium', 'high', 'critical']],
      errorMessage: 'Priority must be low, medium, high, or critical'
    }
  },
  
  // Status validation
  status: {
    in: ['body'],
    isIn: {
      options: [['pending', 'sent', 'delivered', 'failed', 'cancelled']],
      errorMessage: 'Invalid status value'
    }
  },
  
  // Date validation
  dateTime: {
    in: ['body', 'query'],
    isISO8601: {
      errorMessage: 'Date must be in ISO 8601 format'
    },
    toDate: true
  },
  
  // Pagination
  limit: {
    in: ['query'],
    optional: true,
    isInt: {
      options: { min: 1, max: 100 },
      errorMessage: 'Limit must be between 1 and 100'
    },
    toInt: true
  },
  
  offset: {
    in: ['query'],
    optional: true,
    isInt: {
      options: { min: 0 },
      errorMessage: 'Offset must be 0 or greater'
    },
    toInt: true
  }
};

/**
 * Sanitize input to prevent XSS
 */
export const sanitizeInput = (req, res, next) => {
  // Sanitize body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key]
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
      }
    });
  }
  
  // Sanitize query params
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key]
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
      }
    });
  }
  
  next();
};

/**
 * Validate JSON content type
 */
export const requireJSON = (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'DELETE') {
    if (!req.is('application/json')) {
      return res.status(400).json({
        success: false,
        error: 'Content-Type must be application/json'
      });
    }
  }
  next();
};

export default {
  validateRequest,
  validationRules,
  sanitizeInput,
  requireJSON
};