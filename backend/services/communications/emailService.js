// backend/services/communications/emailService.js
// Email Service for Microsoft Graph API integration
// Handles email sending, templates, and distribution lists

import { Client } from '@microsoft/microsoft-graph-client';
import { ConfidentialClientApplication } from '@azure/msal-node';

class EmailService {
  constructor() {
    this.graphClient = null;
    this.isAuthenticated = false;
    this.accessToken = null;
    this.tokenExpiry = null;
    
    console.log('📧 Email Service initialized');
  }

  /**
   * Initialize Microsoft Graph client
   */
  async initialize() {
    try {
      // For now, we'll use the web embed approach
      // Full API integration can be added later
      console.log('📧 Email Service using web embed approach');
      this.isAuthenticated = true;
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Email Service:', error);
      return false;
    }
  }

  /**
   * Send email via Microsoft Graph (placeholder for web embed)
   */
  async sendEmail({ to, subject, body, from, cc = [], bcc = [] }) {
    if (!this.isAuthenticated) {
      throw new Error('Email service not authenticated');
    }

    const emailData = {
      message: {
        subject,
        body: {
          contentType: 'HTML',
          content: body
        },
        toRecipients: to.map(email => ({
          emailAddress: {
            address: email
          }
        })),
        ccRecipients: cc.map(email => ({
          emailAddress: {
            address: email
          }
        })),
        bccRecipients: bcc.map(email => ({
          emailAddress: {
            address: email
          }
        }))
      }
    };

    // For web embed approach, we'll log the email data
    // and return success. The actual sending happens through
    // the Outlook Web Access interface
    console.log('📧 Email prepared for sending:', {
      to: to.length,
      subject,
      hasBody: !!body,
      cc: cc.length,
      bcc: bcc.length
    });

    const result = {
      messageId: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'prepared',
      timestamp: new Date().toISOString()
    };
    
    // Update statistics
    await this.updateStatsAfterSend(true, null);
    
    return result;
  }

  /**
   * Get email templates
   */
  async getEmailTemplates() {
    try {
      // Try to load templates from JSON file first
      const { readFileSync } = await import('fs');
      const path = await import('path');
      const __dirname = path.dirname(new URL(import.meta.url).pathname);
      const templatesPath = path.join(__dirname, '../../data/email_templates.json');
      
      try {
        const templatesData = readFileSync(templatesPath, 'utf-8');
        const parsedTemplates = JSON.parse(templatesData);
        if (Array.isArray(parsedTemplates.templates)) {
          return parsedTemplates.templates;
        }
      } catch (fileError) {
        console.log('📧 Using default email templates (no custom templates file found)');
      }
    } catch (importError) {
      console.log('📧 Using default email templates (filesystem access limited)');
    }

    // Default templates if file doesn't exist or can't be read
    const templates = [
      {
        id: 'alert_notification',
        name: 'Alert Notification',
        category: 'alerts',
        subject: 'Go BARRY Alert: {{alertType}}',
        body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
               <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                 <h2 style="color: #dc3545; margin: 0;">🚨 Go BARRY Alert</h2>
               </div>
               <p>Dear {{recipientName}},</p>
               <p>A new <strong>{{alertType}}</strong> alert has been issued:</p>
               <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0;">
                 <p><strong>📍 Location:</strong> {{location}}</p>
                 <p><strong>⚠️ Severity:</strong> {{severity}}</p>
                 <p><strong>📝 Description:</strong> {{description}}</p>
                 <p><strong>🕐 Time:</strong> {{timestamp}}</p>
               </div>
               <p>Please take appropriate action and acknowledge this alert.</p>
               <p>Best regards,<br><strong>Go BARRY System</strong></p>
               </div>`,
        variables: ['alertType', 'recipientName', 'location', 'severity', 'description', 'timestamp'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'roadwork_notification',
        name: 'Roadwork Notification',
        category: 'roadworks',
        subject: 'Roadwork Update: {{location}}',
        body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
               <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                 <h2 style="color: #fd7e14; margin: 0;">🚧 Roadwork Update</h2>
               </div>
               <p>Dear Team,</p>
               <p>Roadwork has been <strong>{{status}}</strong> at {{location}}:</p>
               <div style="background-color: #d1ecf1; padding: 15px; border-radius: 5px; margin: 15px 0;">
                 <p><strong>📍 Location:</strong> {{location}}</p>
                 <p><strong>📅 Start Date:</strong> {{startDate}}</p>
                 <p><strong>📅 End Date:</strong> {{endDate}}</p>
                 <p><strong>🚌 Affected Routes:</strong> {{routes}}</p>
                 <p><strong>⚡ Impact:</strong> {{impact}}</p>
                 <p><strong>🚦 Status:</strong> {{status}}</p>
               </div>
               <p>Please adjust schedules accordingly and inform drivers about potential delays.</p>
               <p>Best regards,<br><strong>{{supervisorName}}</strong></p>
               </div>`,
        variables: ['location', 'status', 'startDate', 'endDate', 'routes', 'impact', 'supervisorName'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'service_disruption',
        name: 'Service Disruption Notice',
        category: 'service',
        subject: 'Service Disruption: {{routeNumber}} - {{location}}',
        body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
               <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                 <h2 style="color: #dc3545; margin: 0;">⚠️ Service Disruption</h2>
               </div>
               <p>Dear {{recipientName}},</p>
               <p>We have identified a service disruption affecting Route {{routeNumber}}:</p>
               <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 15px 0;">
                 <p><strong>🚌 Route:</strong> {{routeNumber}}</p>
                 <p><strong>📍 Location:</strong> {{location}}</p>
                 <p><strong>⏰ Duration:</strong> {{duration}}</p>
                 <p><strong>🔄 Alternative:</strong> {{alternative}}</p>
                 <p><strong>📝 Reason:</strong> {{reason}}</p>
               </div>
               <p>We apologize for any inconvenience and are working to resolve this as quickly as possible.</p>
               <p>Best regards,<br><strong>Go BARRY Operations</strong></p>
               </div>`,
        variables: ['recipientName', 'routeNumber', 'location', 'duration', 'alternative', 'reason'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'daily_summary',
        name: 'Daily Operations Summary',
        category: 'reports',
        subject: 'Daily Summary - {{date}}',
        body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
               <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                 <h2 style="color: #28a745; margin: 0;">📊 Daily Operations Summary</h2>
               </div>
               <p>Dear {{recipientName}},</p>
               <p>Here's your daily operations summary for {{date}}:</p>
               <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 15px 0;">
                 <p><strong>🚌 Total Routes:</strong> {{totalRoutes}}</p>
                 <p><strong>⚠️ Active Alerts:</strong> {{activeAlerts}}</p>
                 <p><strong>🚧 Roadworks:</strong> {{roadworks}}</p>
                 <p><strong>🕐 Average Delay:</strong> {{averageDelay}}</p>
                 <p><strong>✅ On-Time Performance:</strong> {{onTimePerformance}}%</p>
               </div>
               <p>{{additionalNotes}}</p>
               <p>Best regards,<br><strong>Go BARRY System</strong></p>
               </div>`,
        variables: ['recipientName', 'date', 'totalRoutes', 'activeAlerts', 'roadworks', 'averageDelay', 'onTimePerformance', 'additionalNotes'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    return templates;
  }

  /**
   * Get distribution lists
   */
  async getDistributionLists() {
    try {
      // Try to load distribution lists from JSON file first
      const { readFileSync } = await import('fs');
      const path = await import('path');
      const __dirname = path.dirname(new URL(import.meta.url).pathname);
      const listsPath = path.join(__dirname, '../../data/distribution_lists.json');
      
      try {
        const listsData = readFileSync(listsPath, 'utf-8');
        const parsedLists = JSON.parse(listsData);
        if (Array.isArray(parsedLists.lists)) {
          return parsedLists.lists;
        }
      } catch (fileError) {
        console.log('📧 Using default distribution lists (no custom lists file found)');
      }
    } catch (importError) {
      console.log('📧 Using default distribution lists (filesystem access limited)');
    }

    // Default distribution lists if file doesn't exist or can't be read
    const lists = [
      {
        id: 'traffic_control',
        name: 'Traffic Control Team',
        description: 'Main traffic control operators and supervisors',
        category: 'operations',
        members: [
          'traffic.control@gonortheast.co.uk',
          'operations@gonortheast.co.uk'
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'supervisors',
        name: 'All Supervisors',
        description: 'All active supervisors across all depots',
        category: 'management',
        members: [
          'supervisors@gonortheast.co.uk',
          'depot.supervisors@gonortheast.co.uk'
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'drivers',
        name: 'Driver Communications',
        description: 'Driver management team and communications',
        category: 'drivers',
        members: [
          'drivers@gonortheast.co.uk',
          'driver.management@gonortheast.co.uk'
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'emergency_response',
        name: 'Emergency Response Team',
        description: 'Emergency response and incident management',
        category: 'emergency',
        members: [
          'emergency@gonortheast.co.uk',
          'incident.management@gonortheast.co.uk',
          'safety@gonortheast.co.uk'
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'management',
        name: 'Senior Management',
        description: 'Senior management and executives',
        category: 'management',
        members: [
          'management@gonortheast.co.uk',
          'executives@gonortheast.co.uk'
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'maintenance',
        name: 'Maintenance Team',
        description: 'Vehicle maintenance and engineering',
        category: 'maintenance',
        members: [
          'maintenance@gonortheast.co.uk',
          'engineering@gonortheast.co.uk'
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    return lists;
  }

  /**
   * Process email template with variables
   */
  processTemplate(template, variables) {
    let subject = template.subject;
    let body = template.body;

    // Replace variables in subject and body
    Object.keys(variables).forEach(key => {
      const value = variables[key] || '';
      subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), value);
      body = body.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    return { subject, body };
  }

  /**
   * Get email statistics
   */
  async getEmailStats() {
    try {
      // Try to load stats from JSON file first
      const { readFileSync } = await import('fs');
      const path = await import('path');
      const __dirname = path.dirname(new URL(import.meta.url).pathname);
      const statsPath = path.join(__dirname, '../../data/email_stats.json');
      
      try {
        const statsData = readFileSync(statsPath, 'utf-8');
        const parsedStats = JSON.parse(statsData);
        return {
          totalSent: parsedStats.totalSent || 0,
          totalFailed: parsedStats.totalFailed || 0,
          todaySent: parsedStats.todaySent || 0,
          templatesUsed: parsedStats.templatesUsed || 0,
          lastActivity: parsedStats.lastActivity || new Date().toISOString(),
          weeklyStats: parsedStats.weeklyStats || [],
          monthlyStats: parsedStats.monthlyStats || [],
          topTemplates: parsedStats.topTemplates || [],
          topRecipients: parsedStats.topRecipients || []
        };
      } catch (fileError) {
        console.log('📧 Using default email stats (no stats file found)');
      }
    } catch (importError) {
      console.log('📧 Using default email stats (filesystem access limited)');
    }

    // Default stats if file doesn't exist
    const today = new Date().toISOString().split('T')[0];
    return {
      totalSent: 0,
      totalFailed: 0,
      todaySent: 0,
      templatesUsed: 0,
      lastActivity: new Date().toISOString(),
      weeklyStats: [
        { date: today, sent: 0, failed: 0 }
      ],
      monthlyStats: [
        { month: today.substring(0, 7), sent: 0, failed: 0 }
      ],
      topTemplates: [],
      topRecipients: []
    };
  }

  /**
   * Validate email addresses
   */
  validateEmailAddresses(emails) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const results = {
      valid: [],
      invalid: []
    };

    emails.forEach(email => {
      if (emailRegex.test(email)) {
        results.valid.push(email);
      } else {
        results.invalid.push(email);
      }
    });

    return results;
  }

  /**
   * Check authentication status
   */
  isReady() {
    return this.isAuthenticated;
  }

  /**
   * Save email statistics (for tracking)
   */
  async saveEmailStats(stats) {
    try {
      const { writeFileSync } = await import('fs');
      const path = await import('path');
      const __dirname = path.dirname(new URL(import.meta.url).pathname);
      const statsPath = path.join(__dirname, '../../data/email_stats.json');
      
      writeFileSync(statsPath, JSON.stringify(stats, null, 2));
      console.log('📧 Email stats saved successfully');
    } catch (error) {
      console.error('❌ Failed to save email stats:', error);
    }
  }

  /**
   * Update email statistics after sending
   */
  async updateStatsAfterSend(success = true, templateId = null) {
    try {
      const currentStats = await this.getEmailStats();
      const today = new Date().toISOString().split('T')[0];
      
      // Update basic counters
      currentStats.totalSent += success ? 1 : 0;
      currentStats.totalFailed += success ? 0 : 1;
      currentStats.todaySent += success ? 1 : 0;
      currentStats.lastActivity = new Date().toISOString();
      
      // Update template usage
      if (templateId && success) {
        currentStats.templatesUsed += 1;
        
        // Update top templates
        const existingTemplate = currentStats.topTemplates.find(t => t.id === templateId);
        if (existingTemplate) {
          existingTemplate.count += 1;
          existingTemplate.lastUsed = new Date().toISOString();
        } else {
          currentStats.topTemplates.push({
            id: templateId,
            count: 1,
            lastUsed: new Date().toISOString()
          });
        }
        
        // Sort and limit top templates
        currentStats.topTemplates.sort((a, b) => b.count - a.count);
        currentStats.topTemplates = currentStats.topTemplates.slice(0, 10);
      }
      
      // Update daily stats
      const todayStats = currentStats.weeklyStats.find(s => s.date === today);
      if (todayStats) {
        todayStats.sent += success ? 1 : 0;
        todayStats.failed += success ? 0 : 1;
      } else {
        currentStats.weeklyStats.push({
          date: today,
          sent: success ? 1 : 0,
          failed: success ? 0 : 1
        });
      }
      
      // Keep only last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      currentStats.weeklyStats = currentStats.weeklyStats.filter(s => 
        new Date(s.date) >= thirtyDaysAgo
      );
      
      // Update monthly stats
      const currentMonth = today.substring(0, 7);
      const monthStats = currentStats.monthlyStats.find(s => s.month === currentMonth);
      if (monthStats) {
        monthStats.sent += success ? 1 : 0;
        monthStats.failed += success ? 0 : 1;
      } else {
        currentStats.monthlyStats.push({
          month: currentMonth,
          sent: success ? 1 : 0,
          failed: success ? 0 : 1
        });
      }
      
      // Keep only last 12 months
      currentStats.monthlyStats = currentStats.monthlyStats.slice(-12);
      
      // Save updated stats
      await this.saveEmailStats(currentStats);
      
    } catch (error) {
      console.error('❌ Failed to update email stats:', error);
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      service: 'Email Service',
      status: this.isAuthenticated ? 'Ready' : 'Not Authenticated',
      provider: 'Microsoft Graph (Web Embed)',
      lastActivity: new Date().toISOString(),
      version: '1.0.0',
      capabilities: {
        sendEmail: true,
        templates: true,
        distributionLists: true,
        statistics: true,
        validation: true,
        webEmbed: true
      }
    };
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;