// backend/services/messageTemplateManager.js
// Automated Messaging Templates for Go BARRY Supervisors
// Provides quick responses for common traffic situations

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MessageTemplateManager {
  constructor() {
    this.templatesPath = path.join(__dirname, '../data/message-templates.json');
    this.sentMessagesPath = path.join(__dirname, '../data/sent-messages.json');
    this.templates = [];
    this.categories = [];
    this.sentMessages = [];
    this.loadTemplates();
  }

  async loadTemplates() {
    try {
      const data = await fs.readFile(this.templatesPath, 'utf8');
      const templateData = JSON.parse(data);
      this.templates = templateData.templates || [];
      this.categories = templateData.categories || [];
      console.log('✅ Message templates loaded:', this.templates.length);
    } catch (error) {
      console.error('❌ Failed to load message templates:', error);
      this.templates = [];
      this.categories = [];
    }
  }

  async saveTemplates() {
    try {
      const templateData = {
        templates: this.templates,
        categories: this.categories,
        metadata: {
          lastUpdated: new Date().toISOString(),
          version: '1.0.0',
          totalTemplates: this.templates.length
        }
      };
      await fs.writeFile(this.templatesPath, JSON.stringify(templateData, null, 2));
      console.log('✅ Message templates saved');
      return true;
    } catch (error) {
      console.error('❌ Failed to save message templates:', error);
      return false;
    }
  }

  // Get all templates with optional filtering
  getTemplates(filters = {}) {
    let filteredTemplates = [...this.templates];

    if (filters.category) {
      filteredTemplates = filteredTemplates.filter(t => t.category === filters.category);
    }

    if (filters.priority) {
      filteredTemplates = filteredTemplates.filter(t => t.priority === filters.priority);
    }

    if (filters.autoTrigger !== undefined) {
      filteredTemplates = filteredTemplates.filter(t => t.autoTrigger?.enabled === filters.autoTrigger);
    }

    return {
      success: true,
      templates: filteredTemplates,
      categories: this.categories,
      total: filteredTemplates.length
    };
  }

  // Get a specific template by ID
  getTemplate(templateId) {
    const template = this.templates.find(t => t.id === templateId);
    
    if (!template) {
      return {
        success: false,
        error: 'Template not found'
      };
    }

    return {
      success: true,
      template
    };
  }

  // Process template with variables
  processTemplate(templateId, variables = {}) {
    const templateResult = this.getTemplate(templateId);
    
    if (!templateResult.success) {
      return templateResult;
    }

    const template = templateResult.template;
    let processedMessage = template.message;

    // Replace variables in the message
    if (template.variables && template.variables.length > 0) {
      template.variables.forEach(variable => {
        const value = variables[variable] || `{${variable}}`;
        const regex = new RegExp(`\\{${variable}\\}`, 'g');
        processedMessage = processedMessage.replace(regex, value);
      });
    }

    // Check for unresolved variables
    const unresolvedVariables = (processedMessage.match(/\{[^}]+\}/g) || [])
      .map(match => match.slice(1, -1));

    return {
      success: true,
      template,
      processedMessage,
      unresolvedVariables,
      variables: template.variables || [],
      priority: template.priority,
      channels: template.channels || ['display', 'web']
    };
  }

  // Send message using template
  async sendTemplateMessage(templateId, variables = {}, supervisorInfo = {}, options = {}) {
    const processedResult = this.processTemplate(templateId, variables);
    
    if (!processedResult.success) {
      return processedResult;
    }

    // Validate all required variables are provided
    if (processedResult.unresolvedVariables.length > 0) {
      return {
        success: false,
        error: 'Missing required variables',
        missingVariables: processedResult.unresolvedVariables
      };
    }

    // Create message object
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const message = {
      id: messageId,
      templateId,
      title: processedResult.template.title,
      content: processedResult.processedMessage,
      priority: processedResult.priority,
      channels: options.channels || processedResult.channels,
      variables,
      supervisor: {
        id: supervisorInfo.supervisorId,
        name: supervisorInfo.supervisorName,
        sessionId: supervisorInfo.sessionId
      },
      timestamp: new Date().toISOString(),
      status: 'sent',
      recipients: options.recipients || 'all_displays',
      autoGenerated: options.autoGenerated || false
    };

    // Update template usage stats
    const template = this.templates.find(t => t.id === templateId);
    if (template) {
      template.usageCount = (template.usageCount || 0) + 1;
      template.lastUsed = new Date().toISOString();
      await this.saveTemplates();
    }

    // Save sent message for audit trail
    await this.saveSentMessage(message);

    return {
      success: true,
      message,
      messageId,
      processedContent: processedResult.processedMessage
    };
  }

  // Save sent message to audit trail
  async saveSentMessage(message) {
    try {
      // Load existing sent messages
      let sentMessages = [];
      try {
        const data = await fs.readFile(this.sentMessagesPath, 'utf8');
        sentMessages = JSON.parse(data);
      } catch (error) {
        // File doesn't exist yet, start with empty array
      }

      // Add new message
      sentMessages.unshift(message);

      // Keep only last 1000 messages
      if (sentMessages.length > 1000) {
        sentMessages = sentMessages.slice(0, 1000);
      }

      // Save back to file
      await fs.writeFile(this.sentMessagesPath, JSON.stringify(sentMessages, null, 2));
      return true;
    } catch (error) {
      console.error('❌ Failed to save sent message:', error);
      return false;
    }
  }

  // Get sent messages history
  async getSentMessages(filters = {}) {
    try {
      const data = await fs.readFile(this.sentMessagesPath, 'utf8');
      let sentMessages = JSON.parse(data);

      // Apply filters
      if (filters.supervisorId) {
        sentMessages = sentMessages.filter(m => m.supervisor?.id === filters.supervisorId);
      }

      if (filters.templateId) {
        sentMessages = sentMessages.filter(m => m.templateId === filters.templateId);
      }

      if (filters.priority) {
        sentMessages = sentMessages.filter(m => m.priority === filters.priority);
      }

      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        sentMessages = sentMessages.filter(m => new Date(m.timestamp) >= fromDate);
      }

      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        sentMessages = sentMessages.filter(m => new Date(m.timestamp) <= toDate);
      }

      // Limit results
      const limit = parseInt(filters.limit) || 50;
      if (sentMessages.length > limit) {
        sentMessages = sentMessages.slice(0, limit);
      }

      return {
        success: true,
        messages: sentMessages,
        total: sentMessages.length
      };
    } catch (error) {
      console.error('❌ Failed to get sent messages:', error);
      return {
        success: false,
        error: 'Failed to retrieve message history',
        messages: []
      };
    }
  }

  // Create custom template
  async createTemplate(templateData, supervisorInfo) {
    const templateId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newTemplate = {
      id: templateId,
      category: templateData.category || 'custom',
      title: templateData.title,
      message: templateData.message,
      priority: templateData.priority || 'info',
      variables: templateData.variables || [],
      channels: templateData.channels || ['display', 'web'],
      autoTrigger: {
        enabled: false
      },
      usageCount: 0,
      lastUsed: null,
      createdBy: supervisorInfo.supervisorId,
      createdAt: new Date().toISOString()
    };

    this.templates.push(newTemplate);
    const saved = await this.saveTemplates();

    if (saved) {
      return {
        success: true,
        template: newTemplate,
        templateId
      };
    } else {
      return {
        success: false,
        error: 'Failed to save template'
      };
    }
  }

  // Get template usage statistics
  getTemplateStats() {
    const stats = {
      totalTemplates: this.templates.length,
      templatesByCategory: {},
      templatesByPriority: {},
      mostUsedTemplates: [],
      recentlyUsedTemplates: []
    };

    // Group by category
    this.categories.forEach(cat => {
      stats.templatesByCategory[cat.id] = {
        name: cat.name,
        count: this.templates.filter(t => t.category === cat.id).length,
        color: cat.color
      };
    });

    // Group by priority
    const priorities = ['critical', 'warning', 'info'];
    priorities.forEach(priority => {
      stats.templatesByPriority[priority] = this.templates.filter(t => t.priority === priority).length;
    });

    // Most used templates
    stats.mostUsedTemplates = this.templates
      .filter(t => t.usageCount > 0)
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        title: t.title,
        usageCount: t.usageCount,
        category: t.category
      }));

    // Recently used templates
    stats.recentlyUsedTemplates = this.templates
      .filter(t => t.lastUsed)
      .sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed))
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        title: t.title,
        lastUsed: t.lastUsed,
        category: t.category
      }));

    return {
      success: true,
      statistics: stats
    };
  }

  // Auto-suggest templates based on alert content
  suggestTemplates(alertData) {
    const suggestions = [];

    if (!alertData) {
      return { success: true, suggestions: [] };
    }

    const alertText = (alertData.title + ' ' + alertData.description + ' ' + alertData.location).toLowerCase();

    // Rule-based suggestions
    if (alertText.includes('delay') && !alertText.includes('severe')) {
      suggestions.push(this.templates.find(t => t.id === 'route_delay_minor'));
    }

    if (alertText.includes('closed') || alertText.includes('blocked') || alertText.includes('suspension')) {
      suggestions.push(this.templates.find(t => t.id === 'route_suspension'));
    }

    if (alertText.includes('weather') || alertText.includes('snow') || alertText.includes('ice') || alertText.includes('rain')) {
      suggestions.push(this.templates.find(t => t.id === 'weather_advisory'));
    }

    if (alertText.includes('cleared') || alertText.includes('resolved') || alertText.includes('reopened')) {
      suggestions.push(this.templates.find(t => t.id === 'incident_resolved'));
    }

    if (alertText.includes('emergency') || alertText.includes('diversion') || alertText.includes('urgent')) {
      suggestions.push(this.templates.find(t => t.id === 'emergency_diversion'));
    }

    // Filter out undefined templates and duplicates
    const validSuggestions = suggestions
      .filter(Boolean)
      .filter((template, index, self) => 
        index === self.findIndex(t => t.id === template.id)
      );

    return {
      success: true,
      suggestions: validSuggestions,
      alertData: {
        title: alertData.title,
        location: alertData.location,
        routes: alertData.affectsRoutes || []
      }
    };
  }
}

// Export singleton instance
const messageTemplateManager = new MessageTemplateManager();
export default messageTemplateManager;
