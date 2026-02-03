/**
 * Input Validation Middleware using Joi
 * Validates request bodies, query params, and URL params
 * Extended to support auth, breakdown, analytics, and SDC endpoints
 */

import Joi from 'joi';

/**
 * Generic validation middleware factory
 * Creates middleware that validates request body against a Joi schema
 * @deprecated Use validate() instead for comprehensive validation
 */
export const validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors,
        timestamp: new Date().toISOString()
      });
    }

    // Replace request body with validated and sanitized value
    req.body = value;
    next();
  };
};

/**
 * Comprehensive validation middleware factory
 * Validates request body, query params, and URL params
 * @param {Object} schema - Joi schema object with body/query/params keys
 * @returns {Function} Express middleware
 */
export const validate = (schema) => {
  return (req, res, next) => {
    const validationOptions = {
      abortEarly: false, // Return all errors, not just first
      allowUnknown: true, // Allow fields not in schema
      stripUnknown: true // Remove fields not in schema
    };

    // Validate request body
    if (schema.body) {
      const { error, value } = schema.body.validate(req.body, validationOptions);
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
            type: detail.type
          })),
          timestamp: new Date().toISOString()
        });
      }
      req.body = value; // Use validated/sanitized value
    }

    // Validate query parameters
    if (schema.query) {
      const { error, value } = schema.query.validate(req.query, validationOptions);
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          code: 'VALIDATION_ERROR',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
            type: detail.type
          })),
          timestamp: new Date().toISOString()
        });
      }
      req.query = value;
    }

    // Validate URL parameters
    if (schema.params) {
      const { error, value } = schema.params.validate(req.params, validationOptions);
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid URL parameters',
          code: 'VALIDATION_ERROR',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
            type: detail.type
          })),
          timestamp: new Date().toISOString()
        });
      }
      req.params = value;
    }

    next();
  };
};

/**
 * Common validation schemas (reusable across endpoints)
 */
export const commonSchemas = {
  // Email - lowercase, trimmed, valid format
  email: Joi.string().email().lowercase().trim().required(),

  // Password - minimum 8 characters, maximum 128
  password: Joi.string().min(8).max(128).required(),

  // Fleet number - exactly 4 digits (e.g., 6377)
  fleetNumber: Joi.string().pattern(/^\d{4}$/).required(),

  // Badge number - 2 uppercase letters + 3 digits (e.g., AG003)
  badgeNumber: Joi.string().pattern(/^[A-Z]{2}\d{3}$/).required(),

  // UUID - standard UUID format
  uuid: Joi.string().uuid().required(),

  // Date - ISO 8601 format
  date: Joi.date().iso().required(),

  // Status - breakdown workflow states
  status: Joi.string().valid('pending', 'in_progress', 'dispatched', 'completed', 'cancelled'),

  // Depot - the operator depots
  depot: Joi.string().valid('Washington', 'Riverside', 'Consett', 'Deptford', 'Percy Main', 'Hexham'),

  // Severity - breakdown severity levels
  severity: Joi.string().valid('low', 'medium', 'high', 'critical'),

  // Pagination - limit to prevent abuse
  pagination: {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50) // Max 100 to prevent database overload
  }
};

/**
 * Validation schema for POST /api/sdc/acknowledge
 */
export const acknowledgeBreakdownSchema = Joi.object({
  breakdown_id: Joi.string()
    .required()
    .trim()
    .max(50)
    .pattern(/^[A-Z0-9-]+$/)
    .messages({
      'string.empty': 'Breakdown ID is required',
      'string.pattern.base': 'Breakdown ID must contain only uppercase letters, numbers, and hyphens',
      'any.required': 'Breakdown ID is required'
    }),

  acknowledged_by: Joi.string()
    .trim()
    .max(100)
    .default('SDC')
    .messages({
      'string.max': 'Acknowledged by name cannot exceed 100 characters'
    }),

  supervisor_badge: Joi.string()
    .trim()
    .max(20)
    .pattern(/^[A-Z0-9]+$/)
    .messages({
      'string.max': 'Supervisor badge cannot exceed 20 characters',
      'string.pattern.base': 'Supervisor badge must contain only uppercase letters and numbers'
    }),

  notes: Joi.string()
    .trim()
    .max(1000)
    .allow('')
    .messages({
      'string.max': 'Notes cannot exceed 1000 characters'
    })
});

/**
 * Validation schema for POST /api/sdc/decision
 */
export const recordDecisionSchema = Joi.object({
  breakdown_id: Joi.string()
    .required()
    .trim()
    .max(50)
    .pattern(/^[A-Z0-9-]+$/)
    .messages({
      'string.empty': 'Breakdown ID is required',
      'string.pattern.base': 'Breakdown ID must contain only uppercase letters, numbers, and hyphens',
      'any.required': 'Breakdown ID is required'
    }),

  decision: Joi.string()
    .required()
    .uppercase()
    .valid('STOP', 'AMBER', 'CONTINUE', 'CHANGEOVER')
    .messages({
      'string.empty': 'Decision is required',
      'any.only': 'Decision must be one of: STOP, AMBER, CONTINUE, CHANGEOVER',
      'any.required': 'Decision is required'
    }),

  decided_by: Joi.string()
    .trim()
    .max(100)
    .default('SDC')
    .messages({
      'string.max': 'Decided by name cannot exceed 100 characters'
    }),

  supervisor_badge: Joi.string()
    .trim()
    .max(20)
    .pattern(/^[A-Z0-9]+$/)
    .messages({
      'string.max': 'Supervisor badge cannot exceed 20 characters',
      'string.pattern.base': 'Supervisor badge must contain only uppercase letters and numbers'
    }),

  decision_notes: Joi.string()
    .trim()
    .max(1000)
    .allow('')
    .messages({
      'string.max': 'Decision notes cannot exceed 1000 characters'
    })
});

/**
 * Validation schema for POST /api/sdc/add-note
 */
export const addNoteSchema = Joi.object({
  breakdown_id: Joi.string()
    .required()
    .trim()
    .max(50)
    .pattern(/^[A-Z0-9-]+$/)
    .messages({
      'string.empty': 'Breakdown ID is required',
      'string.pattern.base': 'Breakdown ID must contain only uppercase letters, numbers, and hyphens',
      'any.required': 'Breakdown ID is required'
    }),

  note: Joi.string()
    .required()
    .trim()
    .min(1)
    .max(1000)
    .messages({
      'string.empty': 'Note is required',
      'string.min': 'Note cannot be empty',
      'string.max': 'Note cannot exceed 1000 characters',
      'any.required': 'Note is required'
    }),

  added_by: Joi.string()
    .trim()
    .max(100)
    .default('SDC')
    .messages({
      'string.max': 'Added by name cannot exceed 100 characters'
    }),

  supervisor_badge: Joi.string()
    .trim()
    .max(20)
    .pattern(/^[A-Z0-9]+$/)
    .messages({
      'string.max': 'Supervisor badge cannot exceed 20 characters',
      'string.pattern.base': 'Supervisor badge must contain only uppercase letters and numbers'
    }),

  note_type: Joi.string()
    .lowercase()
    .valid('operational', 'engineering', 'communication', 'general')
    .default('operational')
    .messages({
      'any.only': 'Note type must be one of: operational, engineering, communication, general'
    })
});

/**
 * Validation schema for POST /api/sdc/request-engineering
 */
export const requestEngineeringSchema = Joi.object({
  breakdown_id: Joi.string()
    .required()
    .trim()
    .max(50)
    .pattern(/^[A-Z0-9-]+$/)
    .messages({
      'string.empty': 'Breakdown ID is required',
      'string.pattern.base': 'Breakdown ID must contain only uppercase letters, numbers, and hyphens',
      'any.required': 'Breakdown ID is required'
    }),

  requested_by: Joi.string()
    .trim()
    .max(100)
    .default('SDC')
    .messages({
      'string.max': 'Requested by name cannot exceed 100 characters'
    }),

  supervisor_badge: Joi.string()
    .trim()
    .max(20)
    .pattern(/^[A-Z0-9]+$/)
    .messages({
      'string.max': 'Supervisor badge cannot exceed 20 characters',
      'string.pattern.base': 'Supervisor badge must contain only uppercase letters and numbers'
    }),

  priority: Joi.string()
    .lowercase()
    .valid('critical', 'high', 'normal', 'low')
    .default('normal')
    .messages({
      'any.only': 'Priority must be one of: critical, high, normal, low'
    }),

  notes: Joi.string()
    .trim()
    .max(1000)
    .allow('')
    .messages({
      'string.max': 'Notes cannot exceed 1000 characters'
    }),

  required_skills: Joi.array()
    .items(Joi.string().trim().max(50))
    .max(10)
    .default([])
    .messages({
      'array.max': 'Cannot specify more than 10 required skills',
      'string.max': 'Each skill cannot exceed 50 characters'
    }),

  estimated_arrival: Joi.string()
    .trim()
    .max(50)
    .allow('')
    .messages({
      'string.max': 'Estimated arrival cannot exceed 50 characters'
    })
});

/**
 * Sanitize HTML to prevent XSS attacks
 */
export const sanitizeHTML = (text) => {
  if (!text) return text;

  // Remove HTML tags
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .trim();
};

/**
 * Custom sanitization middleware for note fields
 */
export const sanitizeNotes = (req, res, next) => {
  if (req.body.note) {
    req.body.note = sanitizeHTML(req.body.note);
  }
  if (req.body.notes) {
    req.body.notes = sanitizeHTML(req.body.notes);
  }
  if (req.body.decision_notes) {
    req.body.decision_notes = sanitizeHTML(req.body.decision_notes);
  }
  next();
};

export default {
  validate,
  validateBody,
  commonSchemas,
  acknowledgeBreakdownSchema,
  recordDecisionSchema,
  addNoteSchema,
  requestEngineeringSchema,
  sanitizeHTML,
  sanitizeNotes
};
