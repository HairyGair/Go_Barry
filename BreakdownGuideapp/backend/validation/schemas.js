/**
 * Joi Validation Schemas for all endpoints
 * Organized by route file (auth, breakdowns, analytics, fleet, wizards)
 *
 * Usage:
 *   import { validate } from '../middleware/validationMiddleware.js';
 *   import { authSchemas } from '../validation/schemas.js';
 *   router.post('/login', validate(authSchemas.login), async (req, res) => { ... });
 */

import Joi from 'joi';
import { commonSchemas } from '../middleware/validationMiddleware.js';

// ============================================
// AUTH ENDPOINTS (/api/auth, /api/supervisor)
// ============================================

export const authSchemas = {
  // POST /api/supervisor/login
  login: {
    body: Joi.object({
      email: commonSchemas.email,
      password: commonSchemas.password,
      duty: Joi.string().valid('100', '200', '400', '500').optional()
    })
  },

  // POST /api/supervisor/signup
  signup: {
    body: Joi.object({
      email: commonSchemas.email,
      password: commonSchemas.password,
      fullName: Joi.string().min(2).max(100).required()
        .messages({
          'string.min': 'Full name must be at least 2 characters',
          'string.max': 'Full name cannot exceed 100 characters',
          'any.required': 'Full name is required'
        }),
      badgeNumber: commonSchemas.badgeNumber,
      depot: commonSchemas.depot.optional(),
      role: Joi.string().valid('supervisor', 'manager', 'admin').default('supervisor')
        .messages({
          'any.only': 'Role must be supervisor, manager, or admin'
        })
    })
  },

  // POST /api/supervisor/change-password
  changePassword: {
    body: Joi.object({
      email: commonSchemas.email,
      currentPassword: commonSchemas.password.messages({
        'any.required': 'Current password is required'
      }),
      newPassword: commonSchemas.password.messages({
        'any.required': 'New password is required',
        'string.min': 'New password must be at least 8 characters'
      })
    })
  },

  // POST /api/auth/set-duty
  setDuty: {
    body: Joi.object({
      duty: Joi.string().valid('100', '200', '400', '500').required()
        .messages({
          'any.only': 'Duty must be 100, 200, 400, or 500',
          'any.required': 'Duty selection is required'
        })
    })
  },

  // POST /api/supervisor/logout
  logout: {
    // No validation needed for logout
  }
};

// ============================================
// BREAKDOWN ENDPOINTS (/api/breakdowns)
// ============================================

export const breakdownSchemas = {
  // POST /api/breakdowns - Create new breakdown
  create: {
    body: Joi.object({
      fleet_no: commonSchemas.fleetNumber.messages({
        'string.pattern.base': 'Fleet number must be exactly 4 digits (e.g., 6377)',
        'any.required': 'Fleet number is required'
      }),
      location_description: Joi.string().min(3).max(500).required()
        .messages({
          'string.min': 'Location description must be at least 3 characters',
          'string.max': 'Location description cannot exceed 500 characters',
          'any.required': 'Location description is required'
        }),
      location_lat: Joi.number().min(-90).max(90).optional()
        .messages({
          'number.min': 'Latitude must be between -90 and 90',
          'number.max': 'Latitude must be between -90 and 90'
        }),
      location_lng: Joi.number().min(-180).max(180).optional()
        .messages({
          'number.min': 'Longitude must be between -180 and 180',
          'number.max': 'Longitude must be between -180 and 180'
        }),
      issue_category: Joi.string().min(3).max(100).required()
        .messages({
          'string.min': 'Issue category must be at least 3 characters',
          'string.max': 'Issue category cannot exceed 100 characters',
          'any.required': 'Issue category is required'
        }),
      severity: commonSchemas.severity.required()
        .messages({
          'any.only': 'Severity must be low, medium, high, or critical',
          'any.required': 'Severity is required'
        }),
      depot: commonSchemas.depot.required()
        .messages({
          'any.only': 'Depot must be Washington, Riverside, Consett, Deptford, Percy Main, or Hexham',
          'any.required': 'Depot is required'
        }),
      wizard_type: Joi.string().max(50).optional()
        .messages({
          'string.max': 'Wizard type cannot exceed 50 characters'
        }),
      wizard_decision: Joi.string().valid('STOP', 'AMBER', 'CONTINUE').optional()
        .messages({
          'any.only': 'Wizard decision must be STOP, AMBER, or CONTINUE'
        }),
      wizard_assessment_data: Joi.object().optional(),
      photo_url: Joi.string().uri().optional()
        .messages({
          'string.uri': 'Photo URL must be a valid URL'
        }),
      notes: Joi.string().max(1000).optional()
        .messages({
          'string.max': 'Notes cannot exceed 1000 characters'
        })
    })
  },

  // PUT /api/breakdowns/:id - Update breakdown
  update: {
    params: Joi.object({
      id: Joi.alternatives().try(
        commonSchemas.uuid,
        Joi.string().pattern(/^BRK-\d{8}-\d{3}$/)
      ).required()
        .messages({
          'string.pattern.base': 'Breakdown ID must be a UUID or format BRK-YYYYMMDD-NNN',
          'any.required': 'Breakdown ID is required'
        })
    }),
    body: Joi.object({
      status: commonSchemas.status.optional()
        .messages({
          'any.only': 'Status must be pending, in_progress, dispatched, completed, or cancelled'
        }),
      severity: commonSchemas.severity.optional()
        .messages({
          'any.only': 'Severity must be low, medium, high, or critical'
        }),
      resolution_notes: Joi.string().max(1000).optional()
        .messages({
          'string.max': 'Resolution notes cannot exceed 1000 characters'
        }),
      engineer_name: Joi.string().max(100).optional()
        .messages({
          'string.max': 'Engineer name cannot exceed 100 characters'
        }),
      engineer_badge: commonSchemas.badgeNumber.optional()
        .messages({
          'string.pattern.base': 'Engineer badge must be 2 uppercase letters + 3 digits (e.g., AG003)'
        }),
      location_description: Joi.string().max(500).optional()
        .messages({
          'string.max': 'Location description cannot exceed 500 characters'
        }),
      location_lat: Joi.number().min(-90).max(90).optional(),
      location_lng: Joi.number().min(-180).max(180).optional(),
      resolved_at: Joi.date().iso().optional()
        .messages({
          'date.format': 'Resolved date must be in ISO 8601 format'
        })
    }).min(1)
      .messages({
        'object.min': 'At least one field must be provided for update'
      })
  },

  // GET /api/breakdowns - List breakdowns with filters
  list: {
    query: Joi.object({
      page: commonSchemas.pagination.page,
      limit: commonSchemas.pagination.limit,
      status: commonSchemas.status.optional(),
      depot: commonSchemas.depot.optional(),
      severity: commonSchemas.severity.optional(),
      startDate: Joi.date().iso().optional()
        .messages({
          'date.format': 'Start date must be in ISO 8601 format'
        }),
      endDate: Joi.date().iso().min(Joi.ref('startDate')).optional()
        .messages({
          'date.format': 'End date must be in ISO 8601 format',
          'date.min': 'End date must be after start date'
        }),
      search: Joi.string().max(100).optional()
        .messages({
          'string.max': 'Search term cannot exceed 100 characters'
        })
    })
  },

  // GET /api/breakdowns/:id - Get breakdown by ID
  getById: {
    params: Joi.object({
      id: Joi.alternatives().try(
        commonSchemas.uuid,
        Joi.string().pattern(/^BRK-\d{8}-\d{3}$/)
      ).required()
        .messages({
          'string.pattern.base': 'Breakdown ID must be a UUID or format BRK-YYYYMMDD-NNN',
          'any.required': 'Breakdown ID is required'
        })
    })
  },

  // GET /api/breakdowns/live - Live breakdowns (no params needed)
  live: {},

  // GET /api/breakdowns/stats - Statistics
  stats: {
    query: Joi.object({
      depot: commonSchemas.depot.optional(),
      startDate: Joi.date().iso().optional(),
      endDate: Joi.date().iso().min(Joi.ref('startDate')).optional()
    })
  }
};

// ============================================
// ANALYTICS ENDPOINTS (/api/analytics)
// ============================================

export const analyticsSchemas = {
  // GET /api/analytics/summary
  summary: {
    query: Joi.object({
      period: Joi.string().valid('today', 'week', 'month', 'quarter', 'year').default('today')
        .messages({
          'any.only': 'Period must be today, week, month, quarter, or year'
        }),
      depot: commonSchemas.depot.optional()
    })
  },

  // GET /api/analytics/date-range
  dateRange: {
    query: Joi.object({
      startDate: Joi.date().iso().required()
        .messages({
          'date.format': 'Start date must be in ISO 8601 format',
          'any.required': 'Start date is required'
        }),
      endDate: Joi.date().iso().min(Joi.ref('startDate')).required()
        .messages({
          'date.format': 'End date must be in ISO 8601 format',
          'date.min': 'End date must be after start date',
          'any.required': 'End date is required'
        }),
      depot: commonSchemas.depot.optional()
    })
  },

  // GET /api/analytics/kpis
  kpis: {
    query: Joi.object({
      period: Joi.string().valid('today', 'week', 'month', 'quarter', 'year').default('today')
        .messages({
          'any.only': 'Period must be today, week, month, quarter, or year'
        }),
      depot: commonSchemas.depot.optional()
    })
  },

  // GET /api/analytics/trends
  trends: {
    query: Joi.object({
      metric: Joi.string().valid('breakdowns', 'response_time', 'resolution_time').required()
        .messages({
          'any.only': 'Metric must be breakdowns, response_time, or resolution_time',
          'any.required': 'Metric is required'
        }),
      period: Joi.string().valid('week', 'month', 'year').default('month'),
      depot: commonSchemas.depot.optional()
    })
  }
};

// ============================================
// FLEET ENDPOINTS (/api/fleet)
// ============================================

export const fleetSchemas = {
  // GET /api/fleet/search/:term
  search: {
    params: Joi.object({
      term: Joi.string().min(1).max(50).required()
        .messages({
          'string.min': 'Search term must be at least 1 character',
          'string.max': 'Search term cannot exceed 50 characters',
          'any.required': 'Search term is required'
        })
    })
  },

  // PUT /api/fleet/:fleetNumber/status
  updateStatus: {
    params: Joi.object({
      fleetNumber: commonSchemas.fleetNumber
        .messages({
          'string.pattern.base': 'Fleet number must be exactly 4 digits (e.g., 6377)'
        })
    }),
    body: Joi.object({
      status: Joi.string().valid('active', 'maintenance', 'breakdown', 'retired').required()
        .messages({
          'any.only': 'Status must be active, maintenance, breakdown, or retired',
          'any.required': 'Status is required'
        })
    })
  }
};

// ============================================
// WIZARD ENDPOINTS (/api/wizards)
// ============================================

export const wizardSchemas = {
  // POST /api/wizards/progress
  logProgress: {
    body: Joi.object({
      breakdownId: Joi.string().required()
        .messages({
          'any.required': 'Breakdown ID is required'
        }),
      wizardType: Joi.string().required()
        .messages({
          'any.required': 'Wizard type is required'
        }),
      currentStep: Joi.number().integer().min(1).required()
        .messages({
          'number.min': 'Current step must be at least 1',
          'any.required': 'Current step is required'
        }),
      totalSteps: Joi.number().integer().min(1).required()
        .messages({
          'number.min': 'Total steps must be at least 1',
          'any.required': 'Total steps is required'
        }),
      progressData: Joi.object().required()
        .messages({
          'any.required': 'Progress data is required'
        })
    })
  },

  // GET /api/wizards/progress/:breakdownId
  getProgress: {
    params: Joi.object({
      breakdownId: Joi.string().required()
        .messages({
          'any.required': 'Breakdown ID is required'
        })
    })
  }
};

// ============================================
// ACTIVITY ENDPOINTS (/api/activity)
// ============================================

export const activitySchemas = {
  // GET /api/activity - List activities with filters
  list: {
    query: Joi.object({
      page: commonSchemas.pagination.page,
      limit: commonSchemas.pagination.limit,
      depot: commonSchemas.depot.optional(),
      supervisor_badge: commonSchemas.badgeNumber.optional(),
      activity_type: Joi.string().max(50).optional()
        .messages({
          'string.max': 'Activity type cannot exceed 50 characters'
        }),
      severity: commonSchemas.severity.optional(),
      startDate: Joi.date().iso().optional(),
      endDate: Joi.date().iso().min(Joi.ref('startDate')).optional()
    })
  }
};

// Export all schemas
export default {
  authSchemas,
  breakdownSchemas,
  analyticsSchemas,
  fleetSchemas,
  wizardSchemas,
  activitySchemas
};
