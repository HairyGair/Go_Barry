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
 * GET /api/communications/voip/history
 * Get call history for supervisor
 */
router.get('/voip/history', async (req, res) => {
  try {
    const result = await voipService.getCallHistory(req.supervisor.id);
    res.json(result);
  } catch (error) {
    console.error('❌ Error fetching call history:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'CALL_HISTORY_ERROR'
    });
  }
});

/**
 * GET /api/communications/voip/contacts
 * Get contacts for supervisor
 */
router.get('/voip/contacts', async (req, res) => {
  try {
    const result = await voipService.getContacts(req.supervisor.id);
    res.json(result);
  } catch (error) {
    console.error('❌ Error fetching contacts:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'CONTACTS_ERROR'
    });
  }
});

/**
 * GET /api/communications/voip/contacts/search
 * Search contacts
 */
router.get('/voip/contacts/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters',
        code: 'VALIDATION_ERROR'
      });
    }
    
    const result = await voipService.searchContacts(query);
    res.json(result);
  } catch (error) {
    console.error('❌ Error searching contacts:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'CONTACT_SEARCH_ERROR'
    });
  }
});

/**
 * POST /api/communications/voip/contacts
 * Add new contact
 */
router.post('/voip/contacts', async (req, res) => {
  try {
    const { name, number, department, email } = req.body;
    
    if (!name || !number) {
      return res.status(400).json({
        success: false,
        error: 'Name and number are required',
        code: 'VALIDATION_ERROR'
      });
    }
    
    const result = await voipService.addContact(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('❌ Error adding contact:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'ADD_CONTACT_ERROR'
    });
  }
});

/**
 * POST /api/communications/voip/call
 * Make a call
 */
router.post('/voip/call', async (req, res) => {
  try {
    const { to, from } = req.body;
    
    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'To field is required',
        code: 'VALIDATION_ERROR'
      });
    }

    const callData = {
      to,
      from: from || req.supervisor.phoneNumber || '+441912775000',
      supervisorId: req.supervisor.id
    };
    
    const result = await voipService.makeCall(callData);
    res.json(result);

  } catch (error) {
    console.error('❌ Error making call:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'MAKE_CALL_ERROR'
    });
  }
});

/**
 * POST /api/communications/voip/call/:sessionId/end
 * End a call
 */
router.post('/voip/call/:sessionId/end', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await voipService.endCall(sessionId);
    res.json(result);
  } catch (error) {
    console.error('❌ Error ending call:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'END_CALL_ERROR'
    });
  }
});

/**
 * PUT /api/communications/voip/call/:sessionId/status
 * Update call status
 */
router.put('/voip/call/:sessionId/status', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status field is required',
        code: 'VALIDATION_ERROR'
      });
    }

    const validStatuses = ['initiating', 'ringing', 'connected', 'on-hold', 'ended'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        code: 'VALIDATION_ERROR'
      });
    }

    const result = await voipService.updateCallStatus(sessionId, status);
    res.json(result);

  } catch (error) {
    console.error('❌ Error updating call status:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'UPDATE_STATUS_ERROR'
    });
  }
});

/**
 * GET /api/communications/voip/call/active
 * Get active call for supervisor
 */
router.get('/voip/call/active', async (req, res) => {
  try {
    const result = await voipService.getActiveCall(req.supervisor.id);
    res.json(result);
  } catch (error) {
    console.error('❌ Error fetching active call:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'ACTIVE_CALL_ERROR'
    });
  }
});

/**
 * GET /api/communications/voip/statistics
 * Get call statistics
 */
router.get('/voip/statistics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateRange = {
      start: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      end: endDate || new Date().toISOString()
    };
    
    const result = await voipService.getCallStatistics(req.supervisor.id, dateRange);
    res.json(result);
  } catch (error) {
    console.error('❌ Error fetching call statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'CALL_STATS_ERROR'
    });
  }
});

/**
 * GET /api/communications/voip/health
 * Health check for VoIP service
 */
router.get('/voip/health', async (req, res) => {
  try {
    const health = await voipService.healthCheck();
    res.json({
      success: true,
      ...health
    });
  } catch (error) {
    console.error('❌ Error in VoIP health check:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'VOIP_HEALTH_ERROR'
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
// MESSAGE DISTRIBUTION ENDPOINTS
// =======================

/**
 * GET /api/communications/templates
 * Get message templates
 */
router.get('/templates', async (req, res) => {
  try {
    const { category } = req.query;
    const result = await messageDistributionService.getTemplates(category);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ Error fetching templates:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'TEMPLATES_ERROR'
    });
  }
});

/**
 * POST /api/communications/ticketer/send
 * Send Ticketer message
 */
router.post('/ticketer/send', async (req, res) => {
  try {
    const messageData = {
      ...req.body,
      supervisorId: req.supervisor.id,
      supervisorName: req.supervisor.name
    };
    
    const result = await messageDistributionService.sendTicketerMessage(messageData);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ Error sending Ticketer message:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'TICKETER_SEND_ERROR'
    });
  }
});

/**
 * POST /api/communications/multi/send
 * Send multi-channel message
 */
router.post('/multi/send', async (req, res) => {
  try {
    const messageData = {
      ...req.body,
      supervisorId: req.supervisor.id,
      supervisorName: req.supervisor.name
    };
    
    // Validate at least one channel is targeted
    const hasTicketerTargets = (messageData.routes && messageData.routes.length > 0) || 
                              (messageData.depots && messageData.depots.length > 0) ||
                              (!messageData.to || messageData.to.length === 0);
    const hasEmailTargets = messageData.to && messageData.to.length > 0;
    
    if (!hasTicketerTargets && !hasEmailTargets) {
      return res.status(400).json({
        success: false,
        error: 'No recipients specified. Please specify routes, depots, or email addresses.',
        code: 'NO_RECIPIENTS'
      });
    }
    
    const result = await messageDistributionService.sendMultiChannelMessage(messageData);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ Error sending multi-channel message:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'MULTI_SEND_ERROR'
    });
  }
});

/**
 * GET /api/communications/messages/recent
 * Get recent messages
 */
router.get('/messages/recent', async (req, res) => {
  try {
    const { limit = 20, supervisorOnly = false } = req.query;
    const supervisorId = supervisorOnly === 'true' ? req.supervisor.id : null;
    
    const result = await messageDistributionService.getRecentMessages(
      supervisorId,
      parseInt(limit)
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ Error fetching recent messages:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'RECENT_MESSAGES_ERROR'
    });
  }
});

/**
 * GET /api/communications/messages/stats
 * Get message statistics
 */
router.get('/messages/stats', async (req, res) => {
  try {
    const { supervisorOnly = false } = req.query;
    const supervisorId = supervisorOnly === 'true' ? req.supervisor.id : null;
    
    const result = await messageDistributionService.getMessageStats(supervisorId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ Error fetching message stats:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'MESSAGE_STATS_ERROR'
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
    const messageDistStatus = await messageDistributionService.healthCheck();
    
    res.json({
      success: true,
      data: {
        services: {
          email: emailStatus,
          voip: voipStatus,
          queue: queueStatus,
          messageDistribution: messageDistStatus
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