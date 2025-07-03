/*
 * Go Barry - Message Distribution API Routes
 * Handles Ticketer and Email message distribution endpoints
 */

import express from 'express';
import { messageDistributionService } from '../services/communications/messageDistributionService.js';
import { authenticateSupervisor } from '../middleware/communicationsAuth.js';
import { validateRequest } from '../middleware/requestValidator.js';

const router = express.Router();

// Get message templates
router.get('/templates',
  authenticateSupervisor,
  async (req, res, next) => {
    try {
      const { category } = req.query;
      const result = await messageDistributionService.getTemplates(category);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

// Send Ticketer message
router.post('/ticketer/send',
  authenticateSupervisor,
  validateRequest({
    body: {
      message: { type: 'string', required: true, minLength: 1, maxLength: 1000 },
      priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
      category: { type: 'string', enum: ['general', 'disruption', 'roadworks', 'weather', 'emergency', 'operational'], default: 'general' },
      routes: { type: 'array', items: 'string' },
      depots: { type: 'array', items: 'string' }
    }
  }),
  async (req, res, next) => {
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
      next(error);
    }
  }
);

// Send Email message (uses existing email service)
router.post('/email/send',
  authenticateSupervisor,
  validateRequest({
    body: {
      to: { type: 'array', required: true, items: 'string', minLength: 1 },
      subject: { type: 'string', required: true, minLength: 1 },
      message: { type: 'string', required: true, minLength: 1, maxLength: 5000 },
      priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
      category: { type: 'string', enum: ['general', 'disruption', 'roadworks', 'weather', 'emergency', 'operational'], default: 'general' },
      templateId: { type: 'string' }
    }
  }),
  async (req, res, next) => {
    try {
      const messageData = {
        ...req.body,
        supervisorId: req.supervisor.id,
        supervisorName: req.supervisor.name
      };
      
      const result = await messageDistributionService.sendEmailMessage(messageData);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

// Send multi-channel message
router.post('/multi/send',
  authenticateSupervisor,
  validateRequest({
    body: {
      message: { type: 'string', required: true, minLength: 1, maxLength: 1000 },
      subject: { type: 'string' },
      priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
      category: { type: 'string', enum: ['general', 'disruption', 'roadworks', 'weather', 'emergency', 'operational'], default: 'general' },
      // Ticketer targeting
      routes: { type: 'array', items: 'string' },
      depots: { type: 'array', items: 'string' },
      // Email targeting
      to: { type: 'array', items: 'string' }
    }
  }),
  async (req, res, next) => {
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
      next(error);
    }
  }
);

// Get recent messages
router.get('/messages/recent',
  authenticateSupervisor,
  async (req, res, next) => {
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
      next(error);
    }
  }
);

// Get message statistics
router.get('/messages/stats',
  authenticateSupervisor,
  async (req, res, next) => {
    try {
      const { supervisorOnly = false } = req.query;
      const supervisorId = supervisorOnly === 'true' ? req.supervisor.id : null;
      
      const result = await messageDistributionService.getMessageStats(supervisorId);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

// Process template
router.post('/templates/process',
  authenticateSupervisor,
  validateRequest({
    body: {
      templateId: { type: 'string', required: true },
      variables: { type: 'object' }
    }
  }),
  async (req, res, next) => {
    try {
      const { templateId, variables = {} } = req.body;
      
      // Get template
      const templatesResult = await messageDistributionService.getTemplates();
      const template = templatesResult.templates.find(t => t.id === templateId);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found',
          code: 'TEMPLATE_NOT_FOUND'
        });
      }
      
      // Process template
      const processedContent = messageDistributionService.processTemplate(template, variables);
      
      res.json({
        success: true,
        data: {
          templateId,
          originalContent: template.content,
          processedContent,
          variables: template.variables || []
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Health check
router.get('/health',
  async (req, res, next) => {
    try {
      const health = await messageDistributionService.healthCheck();
      res.json({
        success: true,
        ...health
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;