// backend/services/communications/auditLogger.js
// Communication Audit Logging System for Go BARRY
// Comprehensive logging of all communication activities for compliance and analysis

import EventEmitter from 'events';
import { communicationsErrorHandler } from './errorHandler.js';

class CommunicationAuditLogger extends EventEmitter {
  constructor() {
    super();
    this.logBuffer = []; // In-memory buffer for recent logs
    this.maxBufferSize = 1000;
    this.flushInterval = 30000; // 30 seconds
    this.isRunning = false;
    this.flushTimer = null;
    
    // Audit categories
    this.auditCategories = {
      AUTHENTICATION: 'supervisor_auth',
      EMAIL: 'email_activity',
      VOIP: 'voip_activity', 
      SMS: 'sms_activity',
      TICKETER: 'ticketer_activity',
      TEMPLATE: 'template_usage',
      DISTRIBUTION: 'distribution_list',
      QUEUE: 'message_queue',
      ERROR: 'error_tracking',
      SYSTEM: 'system_activity'
    };
    
    console.log('📋 Communication Audit Logger initialized');
  }

  /**
   * Start the audit logger
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ Audit Logger already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting Communication Audit Logger...');
    
    // Start periodic flush
    this.flushTimer = setInterval(() => {
      this.flushLogBuffer();
    }, this.flushInterval);

    this.emit('started');
    console.log('✅ Communication Audit Logger started');
  }

  /**
   * Stop the audit logger
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Audit Logger not running');
      return;
    }

    this.isRunning = false;
    console.log('🛑 Stopping Communication Audit Logger...');

    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Flush remaining logs
    this.flushLogBuffer();

    this.emit('stopped');
    console.log('✅ Communication Audit Logger stopped');
  }

  /**
   * Log supervisor authentication activity
   */
  logAuthentication(action, supervisorData, context = {}) {
    const auditEntry = this.createAuditEntry({
      category: this.auditCategories.AUTHENTICATION,
      action,
      supervisorId: supervisorData.supervisorId,
      supervisorName: supervisorData.supervisorName,
      data: {
        badge: supervisorData.badge,
        role: supervisorData.role,
        isAdmin: supervisorData.isAdmin,
        sessionId: context.sessionId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        success: context.success !== false
      },
      metadata: {
        loginMethod: context.loginMethod || 'badge',
        previousSession: context.previousSession,
        sessionDuration: context.sessionDuration
      }
    });

    this.addToBuffer(auditEntry);
    
    console.log(`👤 Auth: ${action} - ${supervisorData.supervisorName} (${supervisorData.badge})`);
    this.emit('authenticationLogged', auditEntry);
  }

  /**
   * Log email activity
   */
  logEmailActivity(action, emailData, supervisorData, context = {}) {
    const auditEntry = this.createAuditEntry({
      category: this.auditCategories.EMAIL,
      action,
      supervisorId: supervisorData.supervisorId,
      supervisorName: supervisorData.supervisorName,
      data: {
        messageId: emailData.messageId,
        to: emailData.to,
        cc: emailData.cc || [],
        bcc: emailData.bcc || [],
        subject: emailData.subject,
        templateId: emailData.templateId,
        templateVariables: emailData.templateVariables,
        priority: emailData.priority || 'normal',
        success: context.success !== false,
        errorMessage: context.errorMessage
      },
      metadata: {
        recipientCount: (emailData.to?.length || 0) + (emailData.cc?.length || 0) + (emailData.bcc?.length || 0),
        bodyLength: emailData.body?.length || 0,
        attachmentCount: emailData.attachments?.length || 0,
        scheduledFor: emailData.scheduledFor,
        deliveredAt: context.deliveredAt,
        processingTime: context.processingTime
      }
    });

    this.addToBuffer(auditEntry);
    
    console.log(`📧 Email: ${action} - ${emailData.subject} (${auditEntry.metadata.recipientCount} recipients)`);
    this.emit('emailLogged', auditEntry);
  }

  /**
   * Log VoIP activity
   */
  logVoIPActivity(action, callData, supervisorData, context = {}) {
    const auditEntry = this.createAuditEntry({
      category: this.auditCategories.VOIP,
      action,
      supervisorId: supervisorData.supervisorId,
      supervisorName: supervisorData.supervisorName,
      data: {
        sessionId: callData.sessionId,
        callId: callData.callId,
        from: callData.from,
        to: callData.to,
        type: callData.type, // outbound, inbound, conference
        status: callData.status,
        duration: callData.duration || 0,
        isEmergency: callData.isEmergency || false,
        emergencyType: callData.emergencyType,
        success: context.success !== false,
        errorMessage: context.errorMessage
      },
      metadata: {
        audioQuality: callData.audioQuality,
        latency: callData.latency,
        startedAt: callData.startedAt,
        connectedAt: callData.connectedAt,
        endedAt: callData.endedAt,
        callQualityRating: context.callQualityRating,
        disconnectReason: context.disconnectReason
      }
    });

    this.addToBuffer(auditEntry);
    
    const emergencyFlag = callData.isEmergency ? '🚨 EMERGENCY' : '';
    console.log(`📞 VoIP: ${action} - ${callData.from} → ${callData.to} ${emergencyFlag}`);
    this.emit('voipLogged', auditEntry);
  }

  /**
   * Log SMS activity
   */
  logSMSActivity(action, smsData, supervisorData, context = {}) {
    const auditEntry = this.createAuditEntry({
      category: this.auditCategories.SMS,
      action,
      supervisorId: supervisorData.supervisorId,
      supervisorName: supervisorData.supervisorName,
      data: {
        messageId: smsData.messageId,
        to: smsData.to,
        message: smsData.message,
        priority: smsData.priority || 'normal',
        success: context.success !== false,
        errorMessage: context.errorMessage
      },
      metadata: {
        recipientCount: smsData.to?.length || 0,
        messageLength: smsData.message?.length || 0,
        cost: context.cost,
        deliveredAt: context.deliveredAt,
        deliveryStatus: context.deliveryStatus
      }
    });

    this.addToBuffer(auditEntry);
    
    console.log(`📱 SMS: ${action} - ${auditEntry.metadata.recipientCount} recipients`);
    this.emit('smsLogged', auditEntry);
  }

  /**
   * Log Ticketer activity
   */
  logTicketerActivity(action, ticketerData, supervisorData, context = {}) {
    const auditEntry = this.createAuditEntry({
      category: this.auditCategories.TICKETER,
      action,
      supervisorId: supervisorData.supervisorId,
      supervisorName: supervisorData.supervisorName,
      data: {
        messageId: ticketerData.messageId,
        routes: ticketerData.routes || ticketerData.to,
        message: ticketerData.message || ticketerData.content,
        priority: ticketerData.priority || 'normal',
        success: context.success !== false,
        errorMessage: context.errorMessage
      },
      metadata: {
        routeCount: (ticketerData.routes || ticketerData.to)?.length || 0,
        messageLength: (ticketerData.message || ticketerData.content)?.length || 0,
        driverCount: context.driverCount,
        deliveredAt: context.deliveredAt,
        acknowledgmentRate: context.acknowledgmentRate
      }
    });

    this.addToBuffer(auditEntry);
    
    console.log(`🚌 Ticketer: ${action} - ${auditEntry.metadata.routeCount} routes`);
    this.emit('ticketerLogged', auditEntry);
  }

  /**
   * Log template usage
   */
  logTemplateUsage(action, templateData, supervisorData, context = {}) {
    const auditEntry = this.createAuditEntry({
      category: this.auditCategories.TEMPLATE,
      action,
      supervisorId: supervisorData.supervisorId,
      supervisorName: supervisorData.supervisorName,
      data: {
        templateId: templateData.templateId,
        templateName: templateData.name,
        category: templateData.category,
        variables: templateData.variables,
        success: context.success !== false,
        errorMessage: context.errorMessage
      },
      metadata: {
        variableCount: templateData.variables?.length || 0,
        templateLength: templateData.body?.length || 0,
        usageCount: context.usageCount,
        processingTime: context.processingTime
      }
    });

    this.addToBuffer(auditEntry);
    
    console.log(`📄 Template: ${action} - ${templateData.name}`);
    this.emit('templateLogged', auditEntry);
  }

  /**
   * Log distribution list activity
   */
  logDistributionActivity(action, listData, supervisorData, context = {}) {
    const auditEntry = this.createAuditEntry({
      category: this.auditCategories.DISTRIBUTION,
      action,
      supervisorId: supervisorData.supervisorId,
      supervisorName: supervisorData.supervisorName,
      data: {
        listId: listData.listId,
        listName: listData.name,
        members: listData.members?.map(m => ({ email: m.email, name: m.name, role: m.role })) || [],
        type: listData.type,
        success: context.success !== false,
        errorMessage: context.errorMessage
      },
      metadata: {
        memberCount: listData.members?.length || 0,
        activeMembers: listData.members?.filter(m => m.isActive)?.length || 0,
        lastSyncAt: listData.lastSyncAt,
        syncDuration: context.syncDuration
      }
    });

    this.addToBuffer(auditEntry);
    
    console.log(`📋 Distribution: ${action} - ${listData.name} (${auditEntry.metadata.memberCount} members)`);
    this.emit('distributionLogged', auditEntry);
  }

  /**
   * Log message queue activity
   */
  logQueueActivity(action, queueData, supervisorData, context = {}) {
    const auditEntry = this.createAuditEntry({
      category: this.auditCategories.QUEUE,
      action,
      supervisorId: supervisorData.supervisorId,
      supervisorName: supervisorData.supervisorName,
      data: {
        messageId: queueData.messageId,
        queueId: queueData.queueId,
        type: queueData.type,
        priority: queueData.priority,
        status: queueData.status,
        retryCount: queueData.retryCount || 0,
        success: context.success !== false,
        errorMessage: context.errorMessage
      },
      metadata: {
        queuedAt: queueData.createdAt,
        processedAt: queueData.processedAt,
        sentAt: queueData.sentAt,
        processingTime: context.processingTime,
        queuePosition: context.queuePosition
      }
    });

    this.addToBuffer(auditEntry);
    
    console.log(`📨 Queue: ${action} - ${queueData.type} message (${queueData.status})`);
    this.emit('queueLogged', auditEntry);
  }

  /**
   * Log error occurrences
   */
  logError(errorData, supervisorData, context = {}) {
    const auditEntry = this.createAuditEntry({
      category: this.auditCategories.ERROR,
      action: 'ERROR_OCCURRED',
      supervisorId: supervisorData?.supervisorId || 'system',
      supervisorName: supervisorData?.supervisorName || 'System',
      data: {
        errorId: errorData.id,
        errorMessage: errorData.message,
        errorCategory: errorData.category,
        severity: errorData.severity,
        service: errorData.service,
        operation: errorData.operation,
        retryable: errorData.retryable,
        stackTrace: errorData.stack
      },
      metadata: {
        errorCount: context.errorCount,
        lastOccurrence: context.lastOccurrence,
        circuitBreakerState: context.circuitBreakerState,
        recoveryStrategy: context.recoveryStrategy
      }
    });

    this.addToBuffer(auditEntry);
    
    console.log(`🚨 Error: ${errorData.category} - ${errorData.message}`);
    this.emit('errorLogged', auditEntry);
  }

  /**
   * Log system activity
   */
  logSystemActivity(action, systemData, context = {}) {
    const auditEntry = this.createAuditEntry({
      category: this.auditCategories.SYSTEM,
      action,
      supervisorId: 'system',
      supervisorName: 'System',
      data: {
        component: systemData.component,
        operation: systemData.operation,
        status: systemData.status,
        details: systemData.details,
        success: context.success !== false,
        errorMessage: context.errorMessage
      },
      metadata: {
        version: systemData.version,
        uptime: context.uptime,
        memoryUsage: context.memoryUsage,
        performanceMetrics: context.performanceMetrics
      }
    });

    this.addToBuffer(auditEntry);
    
    console.log(`⚙️ System: ${action} - ${systemData.component}`);
    this.emit('systemLogged', auditEntry);
  }

  /**
   * Create standardized audit entry
   */
  createAuditEntry(entryData) {
    return {
      id: this.generateAuditId(),
      timestamp: Date.now(),
      timestampISO: new Date().toISOString(),
      category: entryData.category,
      action: entryData.action,
      supervisorId: entryData.supervisorId,
      supervisorName: entryData.supervisorName,
      data: entryData.data,
      metadata: entryData.metadata || {},
      sessionInfo: {
        userAgent: entryData.userAgent,
        ipAddress: entryData.ipAddress,
        sessionId: entryData.sessionId
      }
    };
  }

  /**
   * Add entry to buffer
   */
  addToBuffer(auditEntry) {
    this.logBuffer.push(auditEntry);
    
    // Trim buffer if it's too large
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer = this.logBuffer.slice(-this.maxBufferSize);
    }

    this.emit('entryAdded', auditEntry);
  }

  /**
   * Flush log buffer to storage
   */
  async flushLogBuffer() {
    if (this.logBuffer.length === 0) {
      return;
    }

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    try {
      // This would integrate with Convex or other storage
      await this.persistLogs(logsToFlush);
      
      console.log(`📋 Flushed ${logsToFlush.length} audit entries to storage`);
      this.emit('logsFlushed', { count: logsToFlush.length });
      
    } catch (error) {
      console.error('❌ Error flushing audit logs:', error);
      
      // Put logs back in buffer
      this.logBuffer.unshift(...logsToFlush);
      
      // Handle error through error handler
      communicationsErrorHandler.handleError(error, {
        service: 'audit',
        operation: 'flush_logs',
        supervisorId: 'system'
      });
    }
  }

  /**
   * Persist logs to storage (integrates with Convex)
   */
  async persistLogs(logs) {
    // This would integrate with Convex to store logs
    // For now, just simulate storage
    console.log(`💾 Persisting ${logs.length} audit logs...`);
  }

  /**
   * Generate unique audit ID
   */
  generateAuditId() {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get audit statistics
   */
  getAuditStats() {
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    const lastHour = now - (60 * 60 * 1000);

    const recent24h = this.logBuffer.filter(log => log.timestamp > last24Hours);
    const recent1h = this.logBuffer.filter(log => log.timestamp > lastHour);

    const stats = {
      total: this.logBuffer.length,
      last24Hours: recent24h.length,
      lastHour: recent1h.length,
      byCategory: {},
      byAction: {},
      bySupervisor: {}
    };

    // Count by category, action, and supervisor
    this.logBuffer.forEach(log => {
      stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
      stats.bySupervisor[log.supervisorId] = (stats.bySupervisor[log.supervisorId] || 0) + 1;
    });

    return stats;
  }

  /**
   * Get recent audit entries
   */
  getRecentEntries(limit = 50, category = null) {
    let entries = [...this.logBuffer];
    
    if (category) {
      entries = entries.filter(entry => entry.category === category);
    }
    
    return entries
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Search audit logs
   */
  searchLogs(criteria) {
    return this.logBuffer.filter(log => {
      if (criteria.supervisorId && log.supervisorId !== criteria.supervisorId) {
        return false;
      }
      
      if (criteria.category && log.category !== criteria.category) {
        return false;
      }
      
      if (criteria.action && log.action !== criteria.action) {
        return false;
      }
      
      if (criteria.timeFrom && log.timestamp < criteria.timeFrom) {
        return false;
      }
      
      if (criteria.timeTo && log.timestamp > criteria.timeTo) {
        return false;
      }
      
      if (criteria.searchText) {
        const searchText = criteria.searchText.toLowerCase();
        const logText = JSON.stringify(log).toLowerCase();
        if (!logText.includes(searchText)) {
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * Export audit report
   */
  exportAuditReport(criteria = {}) {
    const logs = this.searchLogs(criteria);
    const stats = this.getAuditStats();
    
    return {
      reportId: this.generateAuditId(),
      generatedAt: new Date().toISOString(),
      criteria,
      summary: {
        totalEntries: logs.length,
        timeRange: {
          from: logs.length > 0 ? new Date(Math.min(...logs.map(l => l.timestamp))).toISOString() : null,
          to: logs.length > 0 ? new Date(Math.max(...logs.map(l => l.timestamp))).toISOString() : null
        }
      },
      statistics: stats,
      entries: logs
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('🔄 Shutting down Communication Audit Logger...');
    
    this.stop();
    
    // Final flush
    await this.flushLogBuffer();
    
    console.log('✅ Communication Audit Logger shutdown complete');
    this.emit('shutdown');
  }
}

// Export singleton instance
export const communicationAuditLogger = new CommunicationAuditLogger();
export default communicationAuditLogger;