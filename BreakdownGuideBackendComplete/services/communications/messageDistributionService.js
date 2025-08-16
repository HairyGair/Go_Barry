/*
 * Go Barry - Message Distribution Service
 * Handles Ticketer and Email message distribution
 */

import { createClient } from '@supabase/supabase-js';
import { circuitBreaker } from '../middleware/errorHandler.js';
import { emailService } from './communications/emailService.js';
import { auditLogger } from './communications/auditLogger.js';

// Initialize Supabase if available
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
  : null;

// Mock Ticketer integration for development
const mockTicketerAPI = {
  sendMessage: async (message, routes, depots, priority) => {
    console.log('📱 Sending Ticketer message:', {
      message: message.substring(0, 50) + '...',
      routes,
      depots,
      priority
    });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Calculate recipient count
    let recipientCount = 0;
    if (routes && routes.length > 0) {
      recipientCount += routes.length * 15; // Assume 15 drivers per route
    }
    if (depots && depots.length > 0) {
      recipientCount += depots.length * 50; // Assume 50 drivers per depot
    }
    if (!routes?.length && !depots?.length) {
      recipientCount = 450; // All drivers
    }
    
    return {
      success: true,
      messageId: `TKT-${Date.now()}`,
      recipientCount,
      deliveryStatus: 'sent',
      timestamp: new Date().toISOString()
    };
  }
};

// Message templates
const defaultTemplates = [
  {
    id: 'disruption-1',
    name: 'Service Disruption',
    category: 'disruption',
    content: 'Service disruption on route {{route}}. {{description}}. Please allow extra time for your journey.',
    variables: ['route', 'description']
  },
  {
    id: 'roadworks-1',
    name: 'Roadworks Alert',
    category: 'roadworks',
    content: 'Roadworks on {{location}} affecting routes {{routes}}. Expected delays of {{duration}}. Use alternative routes where possible.',
    variables: ['location', 'routes', 'duration']
  },
  {
    id: 'weather-1',
    name: 'Weather Advisory',
    category: 'weather',
    content: 'Weather warning: {{condition}}. Services may be delayed or diverted. Drive carefully and allow extra time.',
    variables: ['condition']
  },
  {
    id: 'operational-1',
    name: 'Operational Update',
    category: 'operational',
    content: '{{message}}',
    variables: ['message']
  },
  {
    id: 'emergency-1',
    name: 'Emergency Alert',
    category: 'emergency',
    content: 'URGENT: {{situation}}. {{action}}. Contact control room immediately on 0191 277 5555.',
    variables: ['situation', 'action']
  }
];

class MessageDistributionService {
  constructor() {
    this.name = 'Message Distribution Service';
    this.recentMessages = [];
    this.messageStats = {
      todayCount: 0,
      weekCount: 0,
      monthCount: 0,
      lastReset: new Date().toDateString()
    };
  }

  // Get message templates
  getTemplates = circuitBreaker(
    async (category = null) => {
      console.log('📋 Fetching message templates');
      
      let templates = [...defaultTemplates];
      
      // Filter by category if specified
      if (category) {
        templates = templates.filter(t => t.category === category);
      }
      
      // Add usage stats if available from Supabase
      if (supabase) {
        try {
          const { data: usageData } = await supabase
            .from('template_usage')
            .select('template_id, last_used, use_count')
            .order('last_used', { ascending: false });
          
          if (usageData) {
            templates = templates.map(template => {
              const usage = usageData.find(u => u.template_id === template.id);
              return {
                ...template,
                lastUsed: usage?.last_used,
                useCount: usage?.use_count || 0
              };
            });
          }
        } catch (error) {
          console.error('Error fetching template usage:', error);
        }
      }
      
      return {
        success: true,
        templates,
        count: templates.length
      };
    },
    { serviceName: 'message-templates' }
  );

  // Send Ticketer message
  sendTicketerMessage = circuitBreaker(
    async (messageData) => {
      const { message, priority, category, routes, depots, supervisorId, supervisorName } = messageData;
      
      console.log('📱 Processing Ticketer message');
      
      // Send via Ticketer API
      const result = await mockTicketerAPI.sendMessage(
        message,
        routes,
        depots,
        priority
      );
      
      if (result.success) {
        // Log the message
        const logEntry = {
          id: result.messageId,
          channel: 'ticketer',
          channelName: 'Ticketer (Drivers)',
          message,
          priority,
          category,
          routes,
          depots,
          recipientCount: result.recipientCount,
          supervisorId,
          supervisorName,
          timestamp: new Date().toISOString(),
          status: 'sent'
        };
        
        // Add to recent messages
        this.recentMessages.unshift(logEntry);
        this.recentMessages = this.recentMessages.slice(0, 50); // Keep last 50
        
        // Update stats
        this.updateMessageStats();
        
        // Log to audit
        await auditLogger.logCommunication({
          type: 'ticketer_message',
          action: 'send',
          supervisorId,
          data: logEntry
        });
        
        // Save to Supabase if available
        if (supabase) {
          try {
            await supabase.from('message_log').insert({
              message_id: result.messageId,
              channel: 'ticketer',
              content: message,
              priority,
              category,
              routes,
              depots,
              recipient_count: result.recipientCount,
              supervisor_id: supervisorId,
              supervisor_name: supervisorName,
              status: 'sent'
            });
          } catch (error) {
            console.error('Error logging to Supabase:', error);
          }
        }
      }
      
      return {
        success: result.success,
        messageId: result.messageId,
        recipientCount: result.recipientCount,
        channel: 'ticketer',
        timestamp: result.timestamp
      };
    },
    { serviceName: 'ticketer-send' }
  );

  // Send email message
  sendEmailMessage = circuitBreaker(
    async (messageData) => {
      const { to, subject, message, priority, category, supervisorId, supervisorName, templateId } = messageData;
      
      console.log('📧 Processing email message');
      
      // Queue email for sending
      const result = await emailService.queueEmail({
        to,
        subject,
        body: message,
        priority,
        templateId,
        supervisorId,
        supervisorName
      });
      
      if (result.success) {
        // Log the message
        const logEntry = {
          id: result.messageId,
          channel: 'email',
          channelName: 'Email',
          message,
          subject,
          priority,
          category,
          to,
          recipientCount: to.length,
          supervisorId,
          supervisorName,
          timestamp: new Date().toISOString(),
          status: 'queued'
        };
        
        // Add to recent messages
        this.recentMessages.unshift(logEntry);
        this.recentMessages = this.recentMessages.slice(0, 50);
        
        // Update stats
        this.updateMessageStats();
        
        // Log to audit
        await auditLogger.logCommunication({
          type: 'email_message',
          action: 'send',
          supervisorId,
          data: logEntry
        });
      }
      
      return {
        success: result.success,
        messageId: result.messageId,
        recipientCount: to.length,
        channel: 'email',
        timestamp: new Date().toISOString()
      };
    },
    { serviceName: 'email-send' }
  );

  // Send to multiple channels
  sendMultiChannelMessage = circuitBreaker(
    async (messageData) => {
      console.log('📢 Sending multi-channel message');
      
      const results = {
        ticketer: null,
        email: null,
        success: true,
        totalRecipients: 0
      };
      
      // Send to Ticketer
      if (messageData.routes || messageData.depots || !messageData.to?.length) {
        try {
          const ticketerResult = await this.sendTicketerMessage(messageData);
          results.ticketer = ticketerResult;
          results.totalRecipients += ticketerResult.recipientCount || 0;
        } catch (error) {
          console.error('Ticketer send failed:', error);
          results.success = false;
        }
      }
      
      // Send to Email
      if (messageData.to && messageData.to.length > 0) {
        try {
          const emailResult = await this.sendEmailMessage(messageData);
          results.email = emailResult;
          results.totalRecipients += emailResult.recipientCount || 0;
        } catch (error) {
          console.error('Email send failed:', error);
          results.success = false;
        }
      }
      
      return {
        success: results.success,
        messageId: `MULTI-${Date.now()}`,
        recipientCount: results.totalRecipients,
        channels: results,
        timestamp: new Date().toISOString()
      };
    },
    { serviceName: 'multi-channel-send' }
  );

  // Get recent messages
  getRecentMessages = circuitBreaker(
    async (supervisorId = null, limit = 20) => {
      console.log('📜 Fetching recent messages');
      
      let messages = [...this.recentMessages];
      
      // Filter by supervisor if specified
      if (supervisorId) {
        messages = messages.filter(m => m.supervisorId === supervisorId);
      }
      
      // Limit results
      messages = messages.slice(0, limit);
      
      return {
        success: true,
        messages,
        count: messages.length
      };
    },
    { serviceName: 'recent-messages' }
  );

  // Get message statistics
  getMessageStats = circuitBreaker(
    async (supervisorId = null) => {
      console.log('📊 Fetching message statistics');
      
      // Reset daily stats if needed
      const today = new Date().toDateString();
      if (this.messageStats.lastReset !== today) {
        this.messageStats.todayCount = 0;
        this.messageStats.lastReset = today;
      }
      
      // Calculate stats from recent messages
      const now = new Date();
      const todayStart = new Date(now.setHours(0, 0, 0, 0));
      const weekStart = new Date(now.setDate(now.getDate() - 7));
      const monthStart = new Date(now.setMonth(now.getMonth() - 1));
      
      let messages = this.recentMessages;
      if (supervisorId) {
        messages = messages.filter(m => m.supervisorId === supervisorId);
      }
      
      const stats = {
        todayCount: messages.filter(m => new Date(m.timestamp) >= todayStart).length,
        weekCount: messages.filter(m => new Date(m.timestamp) >= weekStart).length,
        monthCount: messages.filter(m => new Date(m.timestamp) >= monthStart).length,
        byChannel: {
          ticketer: messages.filter(m => m.channel === 'ticketer').length,
          email: messages.filter(m => m.channel === 'email').length
        },
        byPriority: {
          urgent: messages.filter(m => m.priority === 'urgent').length,
          high: messages.filter(m => m.priority === 'high').length,
          normal: messages.filter(m => m.priority === 'normal').length,
          low: messages.filter(m => m.priority === 'low').length
        },
        lastMessage: messages[0]?.timestamp
      };
      
      return {
        success: true,
        ...stats
      };
    },
    { serviceName: 'message-stats' }
  );

  // Update message stats
  updateMessageStats() {
    this.messageStats.todayCount++;
    this.messageStats.weekCount++;
    this.messageStats.monthCount++;
  }

  // Process template variables
  processTemplate(template, variables = {}) {
    let content = template.content;
    
    // Replace variables
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, variables[key]);
    });
    
    return content;
  }

  // Health check
  healthCheck = async () => {
    return {
      service: 'Message Distribution Service',
      status: 'operational',
      timestamp: new Date().toISOString(),
      features: {
        ticketer: true,
        email: true,
        templates: true,
        multiChannel: true
      },
      stats: {
        recentMessages: this.recentMessages.length,
        todayCount: this.messageStats.todayCount
      }
    };
  };
}

// Export singleton instance
export const messageDistributionService = new MessageDistributionService();