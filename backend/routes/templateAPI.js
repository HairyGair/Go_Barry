// Message Template API endpoints for Go BARRY
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import supervisorManager from '../services/supervisorManager.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory storage for templates (in production, use Convex or database)
let messageTemplates = [];

// Load default templates on startup
async function loadDefaultTemplates() {
  try {
    const templatesPath = path.join(__dirname, '../data/message-templates.json');
    const templatesData = await fs.readFile(templatesPath, 'utf-8');
    const defaultTemplates = JSON.parse(templatesData);
    
    // Convert to API format
    messageTemplates = defaultTemplates.templates?.map((template, index) => ({
      id: `template_${index + 1}`,
      name: template.name,
      category: template.category,
      priority: template.priority,
      template: template.template,
      variables: template.variables || [],
      description: template.description || '',
      autoTrigger: template.autoTrigger || false,
      usageCount: 0,
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      lastUsed: null
    })) || [];
    
    console.log(`📝 Loaded ${messageTemplates.length} default message templates`);
  } catch (error) {
    console.warn('⚠️ Failed to load default templates:', error.message);
    
    // Create basic fallback templates
    messageTemplates = [
      {
        id: 'template_1',
        name: 'Route Delay Alert',
        category: 'delays',
        priority: 'P2',
        template: 'Route {route} experiencing {delayTime} minute delays due to {reason}. Expect disruption until {estimatedEnd}.',
        variables: ['route', 'delayTime', 'reason', 'estimatedEnd'],
        description: 'Standard template for route delay notifications',
        autoTrigger: false,
        usageCount: 0,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        lastUsed: null
      },
      {
        id: 'template_2',
        name: 'Emergency Broadcast',
        category: 'emergency',
        priority: 'P0',
        template: 'EMERGENCY: {message}. All passengers and drivers take immediate action. Contact control room for guidance.',
        variables: ['message'],
        description: 'Emergency broadcast template for critical situations',
        autoTrigger: false,
        usageCount: 0,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        lastUsed: null
      }
    ];
  }
}

// Initialize templates
loadDefaultTemplates();

// GET /api/templates/messages - Get all message templates
router.get('/messages', async (req, res) => {
  try {
    const { category, priority, search } = req.query;
    
    let filteredTemplates = [...messageTemplates];
    
    // Filter by category
    if (category) {
      filteredTemplates = filteredTemplates.filter(t => t.category === category);
    }
    
    // Filter by priority
    if (priority) {
      filteredTemplates = filteredTemplates.filter(t => t.priority === priority);
    }
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredTemplates = filteredTemplates.filter(t => 
        t.name.toLowerCase().includes(searchLower) ||
        t.template.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by usage count (most used first), then by name
    filteredTemplates.sort((a, b) => {
      if (b.usageCount !== a.usageCount) {
        return b.usageCount - a.usageCount;
      }
      return a.name.localeCompare(b.name);
    });
    
    // Get template categories and priorities for UI
    const categories = [...new Set(messageTemplates.map(t => t.category))];
    const priorities = [...new Set(messageTemplates.map(t => t.priority))];
    
    res.json({
      success: true,
      templates: filteredTemplates,
      metadata: {
        total: filteredTemplates.length,
        categories,
        priorities,
        filters: { category, priority, search }
      }
    });
  } catch (error) {
    console.error('❌ Get message templates error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get message templates'
    });
  }
});

// POST /api/templates/create - Create new message template
router.post('/create', async (req, res) => {
  try {
    const { sessionId, name, category, priority, template, variables, description, autoTrigger } = req.body;
    
    if (!sessionId || !name || !template) {
      return res.status(400).json({
        success: false,
        error: 'Session ID, name, and template are required'
      });
    }
    
    // Validate supervisor session
    const sessionValidation = supervisorManager.validateSupervisorSession(sessionId);
    if (!sessionValidation.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid supervisor session'
      });
    }
    
    const supervisor = sessionValidation.supervisor;
    
    // Check for duplicate names
    const existingTemplate = messageTemplates.find(t => t.name.toLowerCase() === name.toLowerCase());
    if (existingTemplate) {
      return res.status(400).json({
        success: false,
        error: 'Template with this name already exists'
      });
    }
    
    // Extract variables from template if not provided
    let templateVariables = variables || [];
    if (templateVariables.length === 0) {
      const variableMatches = template.match(/\\{([^}]+)\\}/g);
      if (variableMatches) {
        templateVariables = variableMatches.map(match => match.slice(1, -1)); // Remove { and }
        templateVariables = [...new Set(templateVariables)]; // Remove duplicates
      }
    }
    
    // Create new template
    const newTemplate = {
      id: `template_${Date.now()}`,
      name: name.trim(),
      category: category || 'general',
      priority: priority || 'P2',
      template: template.trim(),
      variables: templateVariables,
      description: description?.trim() || '',
      autoTrigger: autoTrigger || false,
      usageCount: 0,
      createdBy: supervisor.name,
      createdAt: new Date().toISOString(),
      lastUsed: null
    };
    
    messageTemplates.push(newTemplate);
    
    // Log the action
    await supervisorManager.logSupervisorAction(sessionId, 'create_template', {
      templateId: newTemplate.id,
      templateName: newTemplate.name,
      category: newTemplate.category,
      priority: newTemplate.priority
    });
    
    console.log(`📝 Template created by ${supervisor.name}: ${newTemplate.name}`);
    
    res.json({
      success: true,
      message: 'Template created successfully',
      template: newTemplate
    });
  } catch (error) {
    console.error('❌ Create template error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create template'
    });
  }
});

// PUT /api/templates/customize - Update/customize existing template
router.put('/customize', async (req, res) => {
  try {
    const { sessionId, templateId, name, category, priority, template, variables, description, autoTrigger } = req.body;
    
    if (!sessionId || !templateId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID and template ID are required'
      });
    }
    
    // Validate supervisor session
    const sessionValidation = supervisorManager.validateSupervisorSession(sessionId);
    if (!sessionValidation.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid supervisor session'
      });
    }
    
    const supervisor = sessionValidation.supervisor;
    
    // Find template to update
    const templateIndex = messageTemplates.findIndex(t => t.id === templateId);
    if (templateIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    
    const existingTemplate = messageTemplates[templateIndex];
    
    // Check if name conflicts with another template
    if (name && name !== existingTemplate.name) {
      const nameConflict = messageTemplates.find(t => 
        t.id !== templateId && t.name.toLowerCase() === name.toLowerCase()
      );
      if (nameConflict) {
        return res.status(400).json({
          success: false,
          error: 'Template with this name already exists'
        });
      }
    }
    
    // Extract variables from template if provided
    let templateVariables = variables;
    if (template && (!variables || variables.length === 0)) {
      const variableMatches = template.match(/\\{([^}]+)\\}/g);
      if (variableMatches) {
        templateVariables = variableMatches.map(match => match.slice(1, -1));
        templateVariables = [...new Set(templateVariables)];
      }
    }
    
    // Update template
    const updatedTemplate = {
      ...existingTemplate,
      name: name?.trim() || existingTemplate.name,
      category: category || existingTemplate.category,
      priority: priority || existingTemplate.priority,
      template: template?.trim() || existingTemplate.template,
      variables: templateVariables || existingTemplate.variables,
      description: description?.trim() || existingTemplate.description,
      autoTrigger: autoTrigger !== undefined ? autoTrigger : existingTemplate.autoTrigger,
      lastModified: new Date().toISOString(),
      modifiedBy: supervisor.name
    };
    
    messageTemplates[templateIndex] = updatedTemplate;
    
    // Log the action
    await supervisorManager.logSupervisorAction(sessionId, 'update_template', {
      templateId: updatedTemplate.id,
      templateName: updatedTemplate.name,
      changes: {
        name: name !== existingTemplate.name ? 'updated' : 'unchanged',
        template: template !== existingTemplate.template ? 'updated' : 'unchanged',
        category: category !== existingTemplate.category ? 'updated' : 'unchanged',
        priority: priority !== existingTemplate.priority ? 'updated' : 'unchanged'
      }
    });
    
    console.log(`✏️ Template updated by ${supervisor.name}: ${updatedTemplate.name}`);
    
    res.json({
      success: true,
      message: 'Template updated successfully',
      template: updatedTemplate
    });
  } catch (error) {
    console.error('❌ Update template error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update template'
    });
  }
});

// POST /api/templates/:templateId/use - Use template and log usage
router.post('/:templateId/use', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { sessionId, variables, priority, channels } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }
    
    // Validate supervisor session
    const sessionValidation = supervisorManager.validateSupervisorSession(sessionId);
    if (!sessionValidation.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid supervisor session'
      });
    }
    
    const supervisor = sessionValidation.supervisor;
    
    // Find template
    const template = messageTemplates.find(t => t.id === templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    
    // Process template with variables
    let processedMessage = template.template;
    const providedVariables = variables || {};
    
    // Replace variables in template
    template.variables.forEach(variable => {
      const value = providedVariables[variable] || `{${variable}}`;
      const regex = new RegExp(`\\{${variable}\\}`, 'g');
      processedMessage = processedMessage.replace(regex, value);
    });
    
    // Update usage statistics
    template.usageCount++;
    template.lastUsed = new Date().toISOString();
    template.lastUsedBy = supervisor.name;
    
    // Create message record
    const messageRecord = {
      id: `msg_${Date.now()}`,
      templateId: template.id,
      templateName: template.name,
      originalTemplate: template.template,
      processedMessage,
      variables: providedVariables,
      priority: priority || template.priority,
      channels: channels || ['display'],
      createdBy: supervisor.name,
      createdAt: new Date().toISOString()
    };
    
    // Store message (in production, use Convex)
    if (!global.templateMessages) {
      global.templateMessages = [];
    }
    global.templateMessages.push(messageRecord);
    
    // Log the action
    await supervisorManager.logSupervisorAction(sessionId, 'use_template', {
      templateId: template.id,
      templateName: template.name,
      messageLength: processedMessage.length,
      variableCount: Object.keys(providedVariables).length,
      channels: channels || ['display']
    });
    
    console.log(`📤 Template used by ${supervisor.name}: ${template.name}`);
    
    res.json({
      success: true,
      message: 'Template used successfully',
      processedMessage,
      messageRecord
    });
  } catch (error) {
    console.error('❌ Use template error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to use template'
    });
  }
});

// GET /api/templates/:templateId - Get specific template
router.get('/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    
    const template = messageTemplates.find(t => t.id === templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    
    res.json({
      success: true,
      template
    });
  } catch (error) {
    console.error('❌ Get template error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get template'
    });
  }
});

// DELETE /api/templates/:templateId - Delete template
router.delete('/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }
    
    // Validate supervisor session
    const sessionValidation = supervisorManager.validateSupervisorSession(sessionId);
    if (!sessionValidation.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid supervisor session'
      });
    }
    
    const supervisor = sessionValidation.supervisor;
    
    // Find template
    const templateIndex = messageTemplates.findIndex(t => t.id === templateId);
    if (templateIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    
    const template = messageTemplates[templateIndex];
    
    // Only allow deletion by creator or admin
    if (template.createdBy !== supervisor.name && !supervisor.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Only template creator or admin can delete templates'
      });
    }
    
    // Remove template
    messageTemplates.splice(templateIndex, 1);
    
    // Log the action
    await supervisorManager.logSupervisorAction(sessionId, 'delete_template', {
      templateId: template.id,
      templateName: template.name,
      usageCount: template.usageCount
    });
    
    console.log(`🗑️ Template deleted by ${supervisor.name}: ${template.name}`);
    
    res.json({
      success: true,
      message: 'Template deleted successfully',
      deletedTemplate: template
    });
  } catch (error) {
    console.error('❌ Delete template error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete template'
    });
  }
});

// GET /api/templates/categories - Get available template categories
router.get('/categories', async (req, res) => {
  try {
    const categories = [...new Set(messageTemplates.map(t => t.category))];
    const priorities = [...new Set(messageTemplates.map(t => t.priority))];
    
    const categoryStats = {};
    categories.forEach(category => {
      const templatesInCategory = messageTemplates.filter(t => t.category === category);
      categoryStats[category] = {
        count: templatesInCategory.length,
        totalUsage: templatesInCategory.reduce((sum, t) => sum + t.usageCount, 0)
      };
    });
    
    res.json({
      success: true,
      categories,
      priorities,
      categoryStats,
      totalTemplates: messageTemplates.length
    });
  } catch (error) {
    console.error('❌ Get categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get categories'
    });
  }
});

// GET /api/templates/usage-stats - Get template usage statistics
router.get('/usage-stats', async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    
    // Calculate time range
    const now = Date.now();
    let cutoffTime;
    switch (timeRange) {
      case '1h': cutoffTime = now - 60 * 60 * 1000; break;
      case '24h': cutoffTime = now - 24 * 60 * 60 * 1000; break;
      case '7d': cutoffTime = now - 7 * 24 * 60 * 60 * 1000; break;
      case '30d': cutoffTime = now - 30 * 24 * 60 * 60 * 1000; break;
      default: cutoffTime = now - 24 * 60 * 60 * 1000;
    }
    
    // Get recent template messages
    const recentMessages = (global.templateMessages || [])
      .filter(msg => new Date(msg.createdAt).getTime() > cutoffTime);
    
    // Calculate usage statistics
    const usageByTemplate = {};
    const usageByCategory = {};
    const usageBySupervisor = {};
    
    recentMessages.forEach(msg => {
      // By template
      usageByTemplate[msg.templateName] = (usageByTemplate[msg.templateName] || 0) + 1;
      
      // By supervisor
      usageBySupervisor[msg.createdBy] = (usageBySupervisor[msg.createdBy] || 0) + 1;
      
      // By category (find template to get category)
      const template = messageTemplates.find(t => t.id === msg.templateId);
      if (template) {
        usageByCategory[template.category] = (usageByCategory[template.category] || 0) + 1;
      }
    });
    
    // Sort usage statistics
    const topTemplates = Object.entries(usageByTemplate)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
    
    const topSupervisors = Object.entries(usageBySupervisor)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
    
    res.json({
      success: true,
      usageStats: {
        timeRange,
        period: {
          start: new Date(cutoffTime).toISOString(),
          end: new Date(now).toISOString()
        },
        totalMessages: recentMessages.length,
        uniqueTemplates: Object.keys(usageByTemplate).length,
        uniqueSupervisors: Object.keys(usageBySupervisor).length,
        topTemplates,
        topSupervisors,
        usageByCategory,
        averageMessageLength: recentMessages.length > 0 
          ? Math.round(recentMessages.reduce((sum, msg) => sum + msg.processedMessage.length, 0) / recentMessages.length)
          : 0
      }
    });
  } catch (error) {
    console.error('❌ Get usage stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get usage statistics'
    });
  }
});

export default router;