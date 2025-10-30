/**
 * Validation Middleware
 * Input validation and sanitization for authentication routes
 */
import { body, validationResult } from 'express-validator';
import logger from '../services/logger.js';

/**
 * Sanitize string input to prevent XSS and injection attacks
 * @param {string} str Input string
 * @returns {string} Sanitized string
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return '';

  return str
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/['"]/g, '') // Remove quotes
    .substring(0, 255); // Limit length
}

/**
 * Validate badge format: 2 uppercase letters + 3 digits (e.g., AG003)
 */
const badgeFormat = /^[A-Z]{2}\d{3}$/;

/**
 * Login validation rules
 */
export const validateLogin = [
  body('badge')
    .exists().withMessage('Badge is required')
    .isString().withMessage('Badge must be a string')
    .trim()
    .toUpperCase()
    .matches(badgeFormat).withMessage('Badge must be 2 letters followed by 3 digits (e.g., AG003)')
    .customSanitizer(sanitizeString),

  body('password')
    .exists().withMessage('Password is required')
    .isString().withMessage('Password must be a string')
    .isLength({ min: 8, max: 128 }).withMessage('Password must be between 8 and 128 characters')
    .customSanitizer(sanitizeString),

  // Middleware to check validation results
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      logger.security('VALIDATION_FAILED', {
        errors: errors.array(),
        badge: req.body.badge,
      }, req);

      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        code: 'VALIDATION_ERROR',
        details: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }

    next();
  }
];

/**
 * Password change validation rules
 */
export const validatePasswordChange = [
  body('currentPassword')
    .exists().withMessage('Current password is required')
    .isString().withMessage('Current password must be a string')
    .isLength({ min: 8, max: 128 }).withMessage('Current password must be between 8 and 128 characters')
    .customSanitizer(sanitizeString),

  body('newPassword')
    .exists().withMessage('New password is required')
    .isString().withMessage('New password must be a string')
    .isLength({ min: 8, max: 128 }).withMessage('New password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
    .customSanitizer(sanitizeString),

  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      logger.security('PASSWORD_CHANGE_VALIDATION_FAILED', {
        errors: errors.array(),
      }, req);

      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        code: 'VALIDATION_ERROR',
        details: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }

    // Check if new password is different from current password
    if (req.body.currentPassword === req.body.newPassword) {
      return res.status(400).json({
        success: false,
        error: 'New password must be different from current password',
        code: 'VALIDATION_ERROR'
      });
    }

    next();
  }
];

/**
 * Token validation for Authorization header
 */
export const validateAuthHeader = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    logger.security('MISSING_AUTH_HEADER', {}, req);
    return res.status(401).json({
      success: false,
      error: 'No authorization header',
      code: 'NO_AUTH_HEADER'
    });
  }

  if (!authHeader.startsWith('Bearer ')) {
    logger.security('INVALID_AUTH_HEADER_FORMAT', {
      format: authHeader.substring(0, 10)
    }, req);
    return res.status(401).json({
      success: false,
      error: 'Invalid authorization header format',
      code: 'INVALID_AUTH_FORMAT'
    });
  }

  const token = authHeader.substring(7);

  if (!token || token.length < 10) {
    logger.security('INVALID_TOKEN_LENGTH', {}, req);
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }

  // Attach token to request for downstream middleware
  req.token = token;
  next();
};

/**
 * Request body size validation
 */
export const validateBodySize = (maxSize = 10 * 1024) => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('content-length') || '0', 10);

    if (contentLength > maxSize) {
      logger.security('REQUEST_TOO_LARGE', {
        contentLength,
        maxSize,
      }, req);

      return res.status(413).json({
        success: false,
        error: 'Request body too large',
        code: 'PAYLOAD_TOO_LARGE',
        maxSize
      });
    }

    next();
  };
};

/**
 * Content-Type validation
 */
export const validateContentType = (req, res, next) => {
  const contentType = req.get('content-type');

  if (!contentType || !contentType.includes('application/json')) {
    logger.security('INVALID_CONTENT_TYPE', {
      contentType,
    }, req);

    return res.status(415).json({
      success: false,
      error: 'Content-Type must be application/json',
      code: 'INVALID_CONTENT_TYPE'
    });
  }

  next();
};

/**
 * General sanitization middleware
 */
export const sanitizeInputs = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        // Don't sanitize password fields - they need special characters
        if (!key.toLowerCase().includes('password')) {
          req.body[key] = sanitizeString(req.body[key]);
        }
      }
    }
  }

  if (req.query && typeof req.query === 'object') {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key]);
      }
    }
  }

  next();
};

export default {
  validateLogin,
  validatePasswordChange,
  validateAuthHeader,
  validateBodySize,
  validateContentType,
  sanitizeInputs,
  sanitizeString
};
