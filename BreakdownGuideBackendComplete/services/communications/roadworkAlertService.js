// backend/services/communications/roadworkAlertService.js
// Roadwork alert management service for Go BARRY communications

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EmailService } from './emailService.js';
import { EmailGroupService } from './emailGroupService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class RoadworkAlertService {
  constructor() {
    this.dataPath = path.join(__dirname, '../../data/roadworkAlerts.json');
    this.alerts = [];
    this.emailService = new EmailService();
    this.emailGroupService = new EmailGroupService();
    this.loadAlerts();
  }

  async loadAlerts() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf-8');
      this.alerts = JSON.parse(data);
    } catch (error) {
      console.log('🚧 No existing roadwork alerts found, creating new file');
      this.alerts = [];
      await this.saveAlerts();
    }
  }

  async saveAlerts() {
    try {
      await fs.writeFile(this.dataPath, JSON.stringify(this.alerts, null, 2));
    } catch (error) {
      console.error('❌ Error saving roadwork alerts:', error);
      throw error;
    }
  }

  async createAlert(alertData) {
    await this.loadAlerts();
    
    const newAlert = {
      id: this.generateId(),
      ...alertData,
      status: alertData.status || 'reported',
      priority: alertData.priority || 'medium',
      notificationSent: false,
      notifiedGroups: [],
      history: [{
        action: 'created',
        supervisorId: alertData.supervisorId,
        supervisorName: alertData.supervisorName,
        timestamp: new Date().toISOString(),
        notes: 'Alert created'
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.alerts.unshift(newAlert); // Add to beginning
    await this.saveAlerts();
    
    console.log(`🚧 Created roadwork alert: ${newAlert.location}`);
    return newAlert;
  }

  async getAlerts(filters = {}, limit = 50) {
    await this.loadAlerts();
    
    let filtered = this.alerts;
    
    // Apply filters
    if (filters.status) {
      filtered = filtered.filter(a => a.status === filters.status);
    }
    
    if (filters.priority) {
      filtered = filtered.filter(a => a.priority === filters.priority);
    }
    
    if (filters.supervisorId) {
      filtered = filtered.filter(a => a.supervisorId === filters.supervisorId);
    }
    
    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Apply limit
    return filtered.slice(0, limit);
  }

  async getAlert(id) {
    await this.loadAlerts();
    return this.alerts.find(a => a.id === id);
  }

  async updateStatus(id, status, supervisorId, supervisorName, notes) {
    await this.loadAlerts();
    
    const index = this.alerts.findIndex(a => a.id === id);
    if (index === -1) return null;

    const alert = this.alerts[index];
    
    // Add history entry
    alert.history.push({
      action: 'status_changed',
      previousStatus: alert.status,
      newStatus: status,
      supervisorId,
      supervisorName,
      timestamp: new Date().toISOString(),
      notes: notes || `Status changed from ${alert.status} to ${status}`
    });

    // Update alert
    alert.status = status;
    alert.updatedAt = new Date().toISOString();
    
    await this.saveAlerts();
    console.log(`🚧 Updated roadwork alert status: ${alert.location} -> ${status}`);
    return alert;
  }

  async sendNotification(alertId, emailGroups, supervisorId, supervisorName) {
    await this.loadAlerts();
    
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }

    // Get all unique email addresses from selected groups
    const recipients = new Set();
    const groupNames = [];
    
    for (const groupId of emailGroups) {
      const group = await this.emailGroupService.getGroup(groupId);
      if (group && group.isActive) {
        groupNames.push(group.name);
        group.members.forEach(member => recipients.add(member.email));
      }
    }

    if (recipients.size === 0) {
      throw new Error('No valid recipients found in selected groups');
    }

    // Format email content
    const subject = `🚧 Roadwork Alert: ${alert.location} - ${alert.priority.toUpperCase()} Priority`;
    
    const emailContent = `
      <h2>Roadwork Alert Notification</h2>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>${alert.location}</h3>
        <p><strong>Priority:</strong> ${alert.priority.toUpperCase()}</p>
        <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
        <p><strong>Status:</strong> ${alert.status}</p>
        
        <h4>Description:</h4>
        <p>${alert.description}</p>
        
        ${alert.scheduledStart ? `
          <h4>Schedule:</h4>
          <p><strong>Start:</strong> ${new Date(alert.scheduledStart).toLocaleString()}</p>
          <p><strong>End:</strong> ${alert.scheduledEnd ? new Date(alert.scheduledEnd).toLocaleString() : 'TBD'}</p>
        ` : ''}
        
        ${alert.affectedRoutes && alert.affectedRoutes.length > 0 ? `
          <h4>Affected Routes:</h4>
          <ul>
            ${alert.affectedRoutes.map(route => `<li>${route}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
      
      <p style="color: #666; font-size: 12px;">
        This notification was sent by ${supervisorName || 'Go BARRY System'} at ${new Date().toLocaleString()}
      </p>
    `;

    // Send email
    const result = await this.emailService.sendEmail({
      to: Array.from(recipients),
      subject,
      html: emailContent,
      text: this.stripHtml(emailContent)
    });

    // Update alert with notification info
    const alertIndex = this.alerts.findIndex(a => a.id === alertId);
    if (alertIndex !== -1) {
      this.alerts[alertIndex].notificationSent = true;
      this.alerts[alertIndex].notifiedGroups = emailGroups;
      this.alerts[alertIndex].lastNotificationAt = new Date().toISOString();
      
      // Add history entry
      this.alerts[alertIndex].history.push({
        action: 'notification_sent',
        supervisorId: supervisorId || 'system',
        supervisorName: supervisorName || 'System',
        timestamp: new Date().toISOString(),
        notes: `Email sent to ${recipients.size} recipients in groups: ${groupNames.join(', ')}`
      });
      
      await this.saveAlerts();
    }

    console.log(`📧 Sent roadwork alert notification to ${recipients.size} recipients`);
    
    return {
      success: true,
      recipientCount: recipients.size,
      groups: groupNames,
      messageId: result.messageId
    };
  }

  generateId() {
    return 'rwa_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  // Get alerts requiring attention
  async getAlertsRequiringAttention() {
    await this.loadAlerts();
    
    const now = new Date();
    
    return this.alerts.filter(alert => {
      // Active alerts not yet notified
      if (alert.status === 'active' && !alert.notificationSent) return true;
      
      // Scheduled alerts starting soon (within 24 hours)
      if (alert.scheduledStart) {
        const startTime = new Date(alert.scheduledStart);
        const hoursUntilStart = (startTime - now) / (1000 * 60 * 60);
        if (hoursUntilStart > 0 && hoursUntilStart <= 24 && !alert.notificationSent) {
          return true;
        }
      }
      
      // High/critical priority alerts not completed
      if (['high', 'critical'].includes(alert.priority) && 
          !['completed', 'cancelled'].includes(alert.status)) {
        return true;
      }
      
      return false;
    });
  }

  // Get statistics
  async getStatistics() {
    await this.loadAlerts();
    
    const stats = {
      total: this.alerts.length,
      byStatus: {},
      byPriority: {},
      notificationsSent: this.alerts.filter(a => a.notificationSent).length,
      activeAlerts: this.alerts.filter(a => a.status === 'active').length,
      last24Hours: 0,
      last7Days: 0
    };
    
    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    
    this.alerts.forEach(alert => {
      // Status breakdown
      stats.byStatus[alert.status] = (stats.byStatus[alert.status] || 0) + 1;
      
      // Priority breakdown
      stats.byPriority[alert.priority] = (stats.byPriority[alert.priority] || 0) + 1;
      
      // Time-based counts
      const createdAt = new Date(alert.createdAt);
      if (createdAt >= oneDayAgo) stats.last24Hours++;
      if (createdAt >= sevenDaysAgo) stats.last7Days++;
    });
    
    return stats;
  }
}

export default RoadworkAlertService;