// backend/routes/emailAPI.js
// Email API endpoints for communications platform
// Supports template management, distribution lists, and email sending

import express from 'express';
import { emailService } from '../services/communications/emailService.js';

const router = express.Router();

// Initialize email service
let emailServiceReady = false;

// Initialize email service on startup
(async () => {
  try {
    await emailService.initialize();
    emailServiceReady = true;
    console.log('📧 Email service initialized successfully');
  } catch (error) {
    console.error('❌ Email service initialization failed:', error);
  }
})();

// Middleware to check if email service is ready
const checkEmailService = (req, res, next) => {
  if (!emailServiceReady) {
    return res.status(503).json({
      error: 'Email service not ready',
      message: 'Email service is still initializing. Please try again in a moment.'
    });
  }
  next();
};

// GET /api/email/templates - Get all email templates
router.get('/templates', checkEmailService, async (req, res) => {
  try {
    const templates = await emailService.getEmailTemplates();
    res.json({
      success: true,
      templates,
      count: templates.length
    });
  } catch (error) {
    console.error('❌ Error fetching email templates:', error);
    res.status(500).json({
      error: 'Failed to fetch email templates',
      message: error.message
    });
  }
});

// GET /api/email/distribution-lists - Get all distribution lists
router.get('/distribution-lists', checkEmailService, async (req, res) => {
  try {
    const lists = await emailService.getDistributionLists();
    res.json({
      success: true,
      lists,
      count: lists.length
    });
  } catch (error) {
    console.error('❌ Error fetching distribution lists:', error);
    res.status(500).json({
      error: 'Failed to fetch distribution lists',
      message: error.message
    });
  }
});

// GET /api/email/stats - Get email statistics
router.get('/stats', checkEmailService, async (req, res) => {
  try {
    const stats = await emailService.getEmailStats();
    res.json({
      success: true,
      stats,
      serviceStatus: emailService.getStatus()
    });
  } catch (error) {
    console.error('❌ Error fetching email stats:', error);
    res.status(500).json({
      error: 'Failed to fetch email stats',
      message: error.message
    });
  }
});

// POST /api/email/send - Send email
router.post('/send', checkEmailService, async (req, res) => {
  try {
    const {
      to = [],
      cc = [],
      bcc = [],
      subject = '',
      body = '',
      template = null,
      distributionList = null,
      priority = 'normal',
      schedule = null,
      sender = 'System'
    } = req.body;

    // Validate required fields
    if (!to.length) {
      return res.status(400).json({
        error: 'Missing recipients',
        message: 'At least one recipient is required'
      });
    }

    if (!subject.trim()) {
      return res.status(400).json({
        error: 'Missing subject',
        message: 'Email subject is required'
      });
    }

    // Validate email addresses
    const allEmails = [...to, ...cc, ...bcc];
    const validation = emailService.validateEmailAddresses(allEmails);
    
    if (validation.invalid.length > 0) {
      return res.status(400).json({
        error: 'Invalid email addresses',
        message: `Invalid email addresses: ${validation.invalid.join(', ')}`,
        invalidEmails: validation.invalid
      });
    }

    // Send email
    const result = await emailService.sendEmail({
      to: validation.valid.filter(email => to.includes(email)),
      cc: validation.valid.filter(email => cc.includes(email)),
      bcc: validation.valid.filter(email => bcc.includes(email)),
      subject,
      body,
      from: sender
    });

    // Log successful send
    console.log('📧 Email sent successfully:', {
      messageId: result.messageId,
      to: to.length,
      cc: cc.length,
      bcc: bcc.length,
      subject,
      sender,
      timestamp: result.timestamp
    });

    res.json({
      success: true,
      messageId: result.messageId,
      status: result.status,
      timestamp: result.timestamp,
      recipients: {
        to: to.length,
        cc: cc.length,
        bcc: bcc.length
      }
    });

  } catch (error) {
    console.error('❌ Error sending email:', error);
    res.status(500).json({
      error: 'Failed to send email',
      message: error.message
    });
  }
});

// POST /api/email/validate - Validate email addresses
router.post('/validate', checkEmailService, async (req, res) => {
  try {
    const { emails = [] } = req.body;

    if (!Array.isArray(emails)) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'emails must be an array'
      });
    }

    const validation = emailService.validateEmailAddresses(emails);
    
    res.json({
      success: true,
      validation,
      summary: {
        total: emails.length,
        valid: validation.valid.length,
        invalid: validation.invalid.length
      }
    });

  } catch (error) {
    console.error('❌ Error validating emails:', error);
    res.status(500).json({
      error: 'Failed to validate emails',
      message: error.message
    });
  }
});

// GET /api/email/status - Get email service status
router.get('/status', async (req, res) => {
  try {
    const status = emailService.getStatus();
    res.json({
      success: true,
      ready: emailServiceReady,
      serviceStatus: status,
      endpoints: {
        templates: '/api/email/templates',
        distributionLists: '/api/email/distribution-lists',
        send: '/api/email/send',
        validate: '/api/email/validate',
        stats: '/api/email/stats'
      }
    });
  } catch (error) {
    console.error('❌ Error getting email service status:', error);
    res.status(500).json({
      error: 'Failed to get service status',
      message: error.message
    });
  }
});

// POST /api/email/template/process - Process template with variables
router.post('/template/process', checkEmailService, async (req, res) => {
  try {
    const { templateId, variables = {} } = req.body;

    if (!templateId) {
      return res.status(400).json({
        error: 'Missing template ID',
        message: 'Template ID is required'
      });
    }

    // Get template
    const templates = await emailService.getEmailTemplates();
    const template = templates.find(t => t.id === templateId);

    if (!template) {
      return res.status(404).json({
        error: 'Template not found',
        message: `Template with ID ${templateId} not found`
      });
    }

    // Process template
    const processed = emailService.processTemplate(template, variables);

    res.json({
      success: true,
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
    });

  } catch (error) {
    console.error('❌ Error processing template:', error);
    res.status(500).json({
      error: 'Failed to process template',
      message: error.message
    });
  }
});

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('❌ Email API error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred in the email service'
  });
});

export default router;
