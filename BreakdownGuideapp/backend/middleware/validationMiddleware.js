/**
 * Input Validation Middleware using Joi
 * Validates request bodies for SDC operational endpoints
 */

import Joi from 'joi';

/**
 * Generic validation middleware factory
 * Creates middleware that validates request body against a Joi schema
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
  validateBody,
  acknowledgeBreakdownSchema,
  recordDecisionSchema,
  addNoteSchema,
  requestEngineeringSchema,
  sanitizeHTML,
  sanitizeNotes
};
