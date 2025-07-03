// backend/routes/communications/communicationsAPI.js
// API middleware layer for Communications Platform
// Handles routing for email, VoIP, templates, and message queues

import express from 'express';
import { communicationService } from '../../services/communications/communicationService.js';
import { emailService } from '../../services/communications/emailService.js';
import { voipService } from '../../services/communications/voipService.js';

const router = express.Router();

// Middleware for supervisor authentication
const requireSupervisor = (req, res, next) => {
  const supervisorId = req.headers['supervisor-id'];
  const supervisorName = req.headers['supervisor-name'];
  
  if (!supervisorId || !supervisorName) {
    return res.status(401).json({
      success: false,
      error: 'Supervisor authentication required',
      code: 'AUTH_REQUIRED'
    });
  }
  
  req.supervisor = { id: supervisorId, name: supervisorName };
  next();
};

// Middleware for request logging
const logRequest = (req, res, next) => {
  console.log(`📡 Communications API: ${req.method} ${req.path} - Supervisor: ${req.supervisor?.id || 'Unknown'}`);
  next();
};

// Apply middleware to all routes
router.use(requireSupervisor);
router.use(logRequest);

// =======================
// EMAIL ENDPOINTS
// =======================

/**
 * GET /api/communications/email/templates
 * Get all email templates
 */
router.get('/email/templates', async (req, res) => {
  try {
    const { category, activeOnly } = req.query;
    const templates = await emailService.getEmailTemplates();
    
    let filteredTemplates = templates;
    
    if (category) {
      filteredTemplates = templates.filter(t => t.category === category);
    }
    
    if (activeOnly !== 'false') {
      filteredTemplates = filteredTemplates.filter(t => t.isActive);
    }
    
    res.json({
      success: true,
      data: {
        templates: filteredTemplates,
        count: filteredTemplates.length
      }
    });
  } catch (error) {
    console.error('❌ Error fetching email templates:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'EMAIL_TEMPLATES_ERROR'
    });
  }
});

/**
 * GET /api/communications/email/distribution-lists
 * Get all distribution lists
 */
router.get('/email/distribution-lists', async (req, res) => {
  try {
    const lists = await emailService.getDistributionLists();
    
    res.json({
      success: true,
      data: {
        lists,
        count: lists.length
      }
    });
  } catch (error) {
    console.error('❌ Error fetching distribution lists:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'DISTRIBUTION_LISTS_ERROR'
    });
  }
});

/**
 * POST /api/communications/email/send
 * Send an email (queued for processing)
 */
router.post('/email/send', async (req, res) => {
  try {
    const {
      to,
      cc = [],
      bcc = [],
      subject,
      body,
      templateId,
      templateVariables = {},
      priority = 'normal',
      scheduledFor
    } = req.body;

    // Validate required fields
    if (!to || !Array.isArray(to) || to.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Recipients (to) field is required and must be a non-empty array',
        code: 'VALIDATION_ERROR'
      });
    }

    if (!subject || !body) {
      return res.status(400).json({
        success: false,
        error: 'Subject and body are required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Validate email addresses
    const allEmails = [...to, ...cc, ...bcc];
    const validation = emailService.validateEmailAddresses(allEmails);
    
    if (validation.invalid.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email addresses found',
        data: { invalidEmails: validation.invalid },
        code: 'INVALID_EMAILS'
      });
    }

    // Queue the email for processing
    const messageId = await communicationService.queueMessage({
      type: 'email',
      to,
      cc,
      bcc,
      subject,
      body,
      templateId,
      templateVariables,
      priority,
      scheduledFor,
      supervisorId: req.supervisor.id,
      supervisorName: req.supervisor.name,
      maxAttempts: 3
    });

    res.json({
      success: true,
      data: {
        messageId,
        status: 'queued',
        queuedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error sending email:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'EMAIL_SEND_ERROR'
    });
  }
});

/**
 * POST /api/communications/email/validate
 * Validate email addresses
 */
router.post('/email/validate', async (req, res) => {
  try {
    const { emails } = req.body;
    
    if (!emails || !Array.isArray(emails)) {
      return res.status(400).json({
        success: false,
        error: 'Emails array is required',
        code: 'VALIDATION_ERROR'
      });
    }

    const validation = emailService.validateEmailAddresses(emails);
    
    res.json({
      success: true,
      data: validation
    });

  } catch (error) {
    console.error('❌ Error validating emails:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'EMAIL_VALIDATION_ERROR'
    });
  }
});

/**
 * GET /api/communications/email/stats
 * Get email statistics
 */
router.get('/email/stats', async (req, res) => {
  try {
    const stats = await emailService.getEmailStats();
    
    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Error fetching email stats:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'EMAIL_STATS_ERROR'
    });
  }
});

/**
 * POST /api/communications/email/template/process
 * Process template with variables
 */
router.post('/email/template/process', async (req, res) => {
  try {
    const { templateId, variables = {} } = req.body;

    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: 'Template ID is required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Get template
    const templates = await emailService.getEmailTemplates();
    const template = templates.find(t => t.id === templateId);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: `Template with ID ${templateId} not found`,
        code: 'TEMPLATE_NOT_FOUND'
      });
    }

    // Process template
    const processed = emailService.processTemplate(template, variables);

    res.json({
      success: true,
      data: {
        template: {
          id: template.id,
          name: template.name,
          originalSubject: template.subject,
          originalBody: template.body,
          processedSubject: processed.subject,
          processedBody: processed.body,
          variables: template.variables || [],
          providedVariables: variables
        }
      }
    });

  } catch (error) {
    console.error('❌ Error processing template:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'TEMPLATE_PROCESS_ERROR'
    });
  }
});

// =======================
// VOIP ENDPOINTS
// =======================

/**
 * GET /api/communications/voip/quick-dial
 * Get quick dial numbers
 */
router.get('/voip/quick-dial', async (req, res) => {
  try {
    const { depot } = req.query;
    
    let numbers;
    if (depot) {
      numbers = voipService.getQuickDialByDepot(depot);
    } else {
      numbers = voipService.getQuickDialNumbers();
    }
    
    res.json({
      success: true,
      data: {
        numbers,
        count: numbers.length
      }
    });
  } catch (error) {
    console.error('❌ Error fetching quick dial numbers:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'QUICK_DIAL_ERROR'
    });
  }
});

/**
 * GET /api/communications/voip/emergency
 * Get emergency numbers
 */
router.get('/voip/emergency', async (req, res) => {
  try {
    const numbers = voipService.getEmergencyNumbers();
    
    res.json({
      success: true,
      data: {
        numbers,
        count: numbers.length
      }
    });
  } catch (error) {
    console.error('❌ Error fetching emergency numbers:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'EMERGENCY_NUMBERS_ERROR'
    });
  }
});

/**
 * POST /api/communications/voip/call
 * Log a call session
 */
router.post('/voip/call', async (req, res) => {
  try {
    const { to, from, type = 'outbound' } = req.body;
    
    if (!to || !from) {
      return res.status(400).json({
        success: false,
        error: 'To and from fields are required',
        code: 'VALIDATION_ERROR'
      });
    }

    const sessionId = await voipService.logCallSession({
      supervisorId: req.supervisor.id,
      supervisorName: req.supervisor.name,
      to,
      from,
      type
    });

    res.json({
      success: true,
      data: {
        sessionId,
        status: 'initiated',
        startedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error logging call session:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'CALL_LOG_ERROR'
    });
  }
});

/**
 * PUT /api/communications/voip/call/:sessionId
 * Update call session status
 */
router.put('/voip/call/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { status, duration, audioQuality, latency } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status field is required',
        code: 'VALIDATION_ERROR'
      });
    }

    const success = await voipService.updateCallStatus(sessionId, status, {
      duration,
      audioQuality,
      latency
    });

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Call session not found',
        code: 'SESSION_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: {
        sessionId,
        status,
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error updating call session:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'CALL_UPDATE_ERROR'
    });
  }
});

/**
 * GET /api/communications/voip/search
 * Search numbers
 */
router.get('/voip/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required',
        code: 'VALIDATION_ERROR'
      });
    }

    const results = voipService.searchNumbers(query);
    
    res.json({
      success: true,
      data: {
        results,
        count: results.length,
        query
      }
    });

  } catch (error) {
    console.error('❌ Error searching numbers:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'NUMBER_SEARCH_ERROR'
    });
  }
});

/**
 * GET /api/communications/voip/stats
 * Get VoIP statistics
 */
router.get('/voip/stats', async (req, res) => {
  try {
    const stats = voipService.getCallStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Error fetching VoIP stats:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'VOIP_STATS_ERROR'
    });
  }
});

// =======================
// MESSAGE QUEUE ENDPOINTS
// =======================

/**
 * GET /api/communications/queue/status
 * Get queue status and statistics
 */
router.get('/queue/status', async (req, res) => {
  try {
    const status = communicationService.getQueueStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('❌ Error fetching queue status:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'QUEUE_STATUS_ERROR'
    });
  }
});

/**
 * GET /api/communications/history
 * Get communication history for supervisor
 */
router.get('/history', async (req, res) => {
  try {
    const { limit = 50, type } = req.query;
    
    // This would integrate with Convex to get actual history
    // For now, return empty array
    const history = [];
    
    res.json({
      success: true,
      data: {
        history,
        count: history.length,
        supervisorId: req.supervisor.id
      }
    });
  } catch (error) {
    console.error('❌ Error fetching communication history:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'HISTORY_ERROR'
    });
  }
});

// =======================
// HEALTH CHECK ENDPOINT
// =======================

/**
 * GET /api/communications/health
 * Health check for communications services
 */
router.get('/health', async (req, res) => {
  try {
    const emailStatus = emailService.getStatus();
    const voipStatus = voipService.getStatus();
    const queueStatus = communicationService.getQueueStatus();
    
    res.json({
      success: true,
      data: {
        services: {
          email: emailStatus,
          voip: voipStatus,
          queue: queueStatus
        },
        timestamp: new Date().toISOString(),
        supervisor: req.supervisor.id
      }
    });
  } catch (error) {
    console.error('❌ Error in communications health check:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'HEALTH_CHECK_ERROR'
    });
  }
});

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('❌ Communications API Error:', error);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  });
});

export default router;