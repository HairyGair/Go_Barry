// backend/services/messageTemplateManager.js
// Automated Messaging Templates for Go BARRY Supervisors - Supabase version

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env from backend root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

class MessageTemplateManager {
  constructor() {
    this.templates = [];
    this.categories = [];
    this.initializeConnection();
  }

  async initializeConnection() {
    try {
      // Test connection and load data
      const { error } = await supabase
        .from('message_templates')
        .select('count', { count: 'exact' })
        .limit(1);
        
      if (error) {
        console.error('❌ MessageTemplateManager: Supabase connection failed:', error);
        return;
      }

      await this.loadTemplates();
      console.log('✅ MessageTemplateManager: Connected to Supabase');
    } catch (error) {
      console.error('❌ MessageTemplateManager: Failed to initialize:', error);
    }
  }

  async loadTemplates() {
    try {
      // Load templates
      const { data: templates, error: templatesError } = await supabase
        .from('message_templates')
        .select('*')
        .order('category, title');

      if (templatesError) {
        console.error('❌ Failed to load templates:', templatesError);
        this.templates = [];
      } else {
        this.templates = templates || [];
      }

      // Load categories
      const { data: categories, error: categoriesError } = await supabase
        .from('template_categories')
        .select('*')
        .order('name');

      if (categoriesError) {
        console.error('❌ Failed to load categories:', categoriesError);
        this.categories = [];
      } else {
        this.categories = categories || [];
      }

      console.log(`✅ Message templates loaded: ${this.templates.length} templates, ${this.categories.length} categories`);
    } catch (error) {
      console.error('❌ Failed to load templates from Supabase:', error);
      this.templates = [];
      this.categories = [];
    }
  }

  // Get all templates with optional filtering
  async getTemplates(filters = {}) {
    try {
      let query = supabase
        .from('message_templates')
        .select('*');

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters.autoTrigger !== undefined) {
        // For JSONB column, we need to use the ->> operator
        if (filters.autoTrigger) {
          query = query.eq('auto_trigger->>enabled', 'true');
        } else {
          query = query.or('auto_trigger->>enabled.is.null,auto_trigger->>enabled.eq.false');
        }
      }

      const { data: templates, error } = await query.order('category, title');

      if (error) {
        console.error('❌ Error getting templates:', error);
        return {
          success: false,
          error: error.message,
          templates: [],
          categories: this.categories,
          total: 0
        };
      }

      return {
        success: true,
        templates: templates || [],
        categories: this.categories,
        total: templates ? templates.length : 0
      };
    } catch (error) {
      console.error('❌ Error getting templates:', error);
      return {
        success: false,
        error: error.message,
        templates: [],
        categories: this.categories,
        total: 0
      };
    }
  }

  // Get a specific template by ID
  async getTemplate(templateId) {
    try {
      const { data: template, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error || !template) {
        return {
          success: false,
          error: 'Template not found'
        };
      }

      return {
        success: true,
        template
      };
    } catch (error) {
      console.error('❌ Error getting template:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Process template with variables
  async processTemplate(templateId, variables = {}) {
    const templateResult = await this.getTemplate(templateId);
    
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
    const processedResult = await this.processTemplate(templateId, variables);
    
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

    try {
      // Create message object (you might want to store this in a separate table)
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
      await supabase
        .from('message_templates')
        .update({
          usage_count: processedResult.template.usage_count + 1,
          last_used: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId);

      console.log(`✅ Sent template message: ${templateId} by ${supervisorInfo.supervisorName}`);

      return {
        success: true,
        message,
        messageId,
        processedContent: processedResult.processedMessage
      };
    } catch (error) {
      console.error('❌ Error sending template message:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create custom template
  async createTemplate(templateData, supervisorInfo) {
    try {
      const templateId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newTemplate = {
        id: templateId,
        category: templateData.category || 'custom',
        title: templateData.title,
        message: templateData.message,
        priority: templateData.priority || 'info',
        variables: templateData.variables || [],
        channels: templateData.channels || ['display', 'web'],
        auto_trigger: {
          enabled: false
        },
        usage_count: 0,
        last_used: null,
        created_by: supervisorInfo.supervisorId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('message_templates')
        .insert(newTemplate)
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating template:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log(`✅ Created custom template: ${templateId} by ${supervisorInfo.supervisorId}`);

      return {
        success: true,
        template: data,
        templateId
      };
    } catch (error) {
      console.error('❌ Error creating template:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get template usage statistics
  async getTemplateStats() {
    try {
      const { data: templates, error } = await supabase
        .from('message_templates')
        .select('*');

      if (error) {
        console.error('❌ Error getting template stats:', error);
        return {
          success: false,
          error: error.message
        };
      }

      const stats = {
        totalTemplates: templates.length,
        templatesByCategory: {},
        templatesByPriority: {},
        mostUsedTemplates: [],
        recentlyUsedTemplates: []
      };

      // Group by category
      this.categories.forEach(cat => {
        stats.templatesByCategory[cat.id] = {
          name: cat.name,
          count: templates.filter(t => t.category === cat.id).length,
          color: cat.color
        };
      });

      // Group by priority
      const priorities = ['critical', 'warning', 'info'];
      priorities.forEach(priority => {
        stats.templatesByPriority[priority] = templates.filter(t => t.priority === priority).length;
      });

      // Most used templates
      stats.mostUsedTemplates = templates
        .filter(t => t.usage_count > 0)
        .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
        .slice(0, 5)
        .map(t => ({
          id: t.id,
          title: t.title,
          usage_count: t.usage_count,
          category: t.category
        }));

      // Recently used templates
      stats.recentlyUsedTemplates = templates
        .filter(t => t.last_used)
        .sort((a, b) => new Date(b.last_used) - new Date(a.last_used))
        .slice(0, 5)
        .map(t => ({
          id: t.id,
          title: t.title,
          last_used: t.last_used,
          category: t.category
        }));

      return {
        success: true,
        statistics: stats
      };
    } catch (error) {
      console.error('❌ Error getting template stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Auto-suggest templates based on alert content
  async suggestTemplates(alertData) {
    try {
      if (!alertData) {
        return { success: true, suggestions: [] };
      }

      const alertText = (alertData.title + ' ' + alertData.description + ' ' + alertData.location).toLowerCase();
      const suggestionIds = [];

      // Rule-based suggestions
      if (alertText.includes('delay') && !alertText.includes('severe')) {
        suggestionIds.push('route_delay_minor');
      }

      if (alertText.includes('closed') || alertText.includes('blocked') || alertText.includes('suspension')) {
        suggestionIds.push('route_suspension');
      }

      if (alertText.includes('weather') || alertText.includes('snow') || alertText.includes('ice') || alertText.includes('rain')) {
        suggestionIds.push('weather_advisory');
      }

      if (alertText.includes('cleared') || alertText.includes('resolved') || alertText.includes('reopened')) {
        suggestionIds.push('incident_resolved');
      }

      if (alertText.includes('emergency') || alertText.includes('diversion') || alertText.includes('urgent')) {
        suggestionIds.push('emergency_diversion');
      }

      // Get suggested templates from database
      const { data: suggestions, error } = await supabase
        .from('message_templates')
        .select('*')
        .in('id', suggestionIds);

      if (error) {
        console.error('❌ Error getting template suggestions:', error);
        return { success: true, suggestions: [] };
      }

      return {
        success: true,
        suggestions: suggestions || [],
        alertData: {
          title: alertData.title,
          location: alertData.location,
          routes: alertData.affectsRoutes || []
        }
      };
    } catch (error) {
      console.error('❌ Error suggesting templates:', error);
      return { success: true, suggestions: [] };
    }
  }

  // Update template
  async updateTemplate(templateId, updates, supervisorInfo) {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('message_templates')
        .update(updateData)
        .eq('id', templateId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating template:', error);
        return {
          success: false,
          error: error.message
        };
      }

      if (!data) {
        return {
          success: false,
          error: 'Template not found'
        };
      }

      console.log(`✅ Updated template: ${templateId} by ${supervisorInfo?.supervisorId}`);

      return {
        success: true,
        template: data
      };
    } catch (error) {
      console.error('❌ Error updating template:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Delete template
  async deleteTemplate(templateId, supervisorInfo) {
    try {
      const { data, error } = await supabase
        .from('message_templates')
        .delete()
        .eq('id', templateId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error deleting template:', error);
        return {
          success: false,
          error: error.message
        };
      }

      if (!data) {
        return {
          success: false,
          error: 'Template not found'
        };
      }

      console.log(`✅ Deleted template: ${templateId} by ${supervisorInfo?.supervisorId}`);

      return {
        success: true,
        template: data
      };
    } catch (error) {
      console.error('❌ Error deleting template:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
const messageTemplateManager = new MessageTemplateManager();
export default messageTemplateManager;
