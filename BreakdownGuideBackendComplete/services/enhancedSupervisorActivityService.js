// backend/services/enhancedSupervisorActivityService.js
// Comprehensive supervisor activity tracking service for Go BARRY

import { createClient } from '@supabase/supabase-js';
import { logActivity } from './supervisorManager.js';

/**
 * Enhanced Supervisor Activity Service
 * 
 * Provides comprehensive supervisor action logging with:
 * - Unified logging interface
 * - Performance optimization for 2GB RAM constraint
 * - Automatic action categorization
 * - Batch logging capabilities
 * - Analytics and reporting functions
 * - Integration with existing supervisorManager
 */

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

class EnhancedSupervisorActivityService {
  constructor() {
    this.batchBuffer = [];
    this.batchSize = 10;
    this.batchTimeout = 5000; // 5 seconds
    this.batchTimer = null;
    this.initializeBatchProcessing();
  }

  /**
   * Initialize batch processing for performance optimization
   */
  initializeBatchProcessing() {
    // Process batches every 5 seconds or when batch size is reached
    this.batchTimer = setInterval(() => {
      if (this.batchBuffer.length > 0) {
        this.processBatch();
      }
    }, this.batchTimeout);
  }

  /**
   * Process buffered activities in batch
   */
  async processBatch() {
    if (this.batchBuffer.length === 0) return;
    
    const batch = this.batchBuffer.splice(0, this.batchSize);
    
    try {
      // Use existing logActivity function for consistency
      await Promise.all(
        batch.map(activity => 
          logActivity(activity.action, activity.details, activity.supervisorInfo, activity.req)
        )
      );
      
      console.log(`✅ Batch logged ${batch.length} supervisor activities`);
    } catch (error) {
      console.error('❌ Batch logging failed:', error);
      
      // Re-add failed items to buffer for retry (with limit)
      if (this.batchBuffer.length < 50) {
        this.batchBuffer.unshift(...batch);
      }
    }
  }

  /**
   * Enhanced activity logging with categorization and metadata
   */
  async logActivity(supervisorInfo, action, details = {}, req = null, options = {}) {
    const {
      immediate = false,
      category = this.categorizeAction(action),
      priority = this.determinePriority(action, details),
      batchable = true
    } = options;

    const enhancedActivity = {
      action,
      details: {
        ...details,
        category,
        priority,
        timestamp: new Date().toISOString(),
        sessionInfo: this.extractSessionInfo(req),
        requestMetadata: this.extractRequestMetadata(req),
        systemContext: this.getSystemContext()
      },
      supervisorInfo,
      req
    };

    if (immediate || !batchable) {
      // Log immediately for critical actions
      try {
        await logActivity(action, enhancedActivity.details, supervisorInfo, req);
        console.log(`📝 Immediate log: ${supervisorInfo?.name} - ${action}`);
      } catch (error) {
        console.error('❌ Immediate logging failed:', error);
      }
    } else {
      // Add to batch buffer
      this.batchBuffer.push(enhancedActivity);
      
      // Force batch processing if buffer is full
      if (this.batchBuffer.length >= this.batchSize) {
        await this.processBatch();
      }
    }
  }

  /**
   * Categorize actions for better organization and filtering
   */
  categorizeAction(action) {
    const categoryMap = {
      // Authentication & Session
      'supervisor_login': 'authentication',
      'supervisor_logout': 'authentication', 
      'session_validation': 'authentication',
      'session_timeout': 'authentication',

      // Alert Management
      'alert_dismissed': 'alert_management',
      'alert_acknowledged': 'alert_management',
      'alert_restored': 'alert_management',
      'alert_priority_updated': 'alert_management',
      'alert_display_dismissed': 'alert_management',
      'alert_display_locked': 'alert_management',

      // Roadwork Operations
      'roadwork_dismissed': 'roadwork_management',
      'roadwork_acknowledged': 'roadwork_management',
      'roadwork_saved': 'roadwork_management',
      'diversion_plan_created': 'roadwork_management',
      'drivers_notified': 'roadwork_management',

      // Incident Handling
      'incident_created': 'incident_management',
      'incident_updated': 'incident_management',
      'incident_resolved': 'incident_management',

      // Communication
      'email_sent': 'communication',
      'message_broadcasted': 'communication',
      'template_message_sent': 'communication',
      'supervisor_coordination': 'communication',

      // System Administration
      'admin_logout_all': 'administration',
      'admin_supervisor_added': 'administration',
      'admin_supervisor_deleted': 'administration',
      'admin_password_reset': 'administration',

      // Operational Activities
      'duty_logged': 'operations',
      'shift_handover_created': 'operations',
      'handover_acknowledged': 'operations',
      'disruption_created': 'operations',

      // System Navigation
      'display_screen_viewed': 'navigation',
      'data_accessed': 'navigation',
      'settings_updated': 'navigation'
    };

    return categoryMap[action] || 'general';
  }

  /**
   * Determine priority level for logging
   */
  determinePriority(action, details) {
    // Critical actions that always need immediate logging
    const criticalActions = [
      'admin_logout_all',
      'admin_supervisor_deleted', 
      'admin_password_reset',
      'incident_created',
      'emergency_alert_sent'
    ];

    // High priority actions
    const highPriorityActions = [
      'supervisor_login',
      'supervisor_logout',
      'alert_dismissed',
      'roadwork_dismissed',
      'diversion_plan_created',
      'drivers_notified'
    ];

    if (criticalActions.includes(action)) return 'critical';
    if (highPriorityActions.includes(action)) return 'high';
    if (details?.severity === 'high' || details?.priority === 'high') return 'high';
    
    return 'medium';
  }

  /**
   * Extract session information from request
   */
  extractSessionInfo(req) {
    if (!req) return null;

    return {
      sessionId: req.body?.sessionId || req.query?.sessionId || req.headers['x-session-id'],
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.connection?.remoteAddress,
      referer: req.headers.referer,
      method: req.method,
      path: req.path,
      query: Object.keys(req.query || {}).length > 0 ? req.query : null
    };
  }

  /**
   * Extract request metadata for debugging and analysis
   */
  extractRequestMetadata(req) {
    if (!req) return null;

    return {
      contentLength: req.headers['content-length'],
      contentType: req.headers['content-type'],
      acceptLanguage: req.headers['accept-language'],
      connection: req.headers.connection,
      requestId: req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substring(7)}`
    };
  }

  /**
   * Get system context for logging
   */
  getSystemContext() {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
      uptime: Math.round(process.uptime()), // seconds
      pid: process.pid
    };
  }

  /**
   * Specialized logging methods for common supervisor actions
   */

  async logLogin(supervisorInfo, req, loginType = 'standard') {
    return this.logActivity(
      supervisorInfo,
      'supervisor_login',
      {
        loginType,
        badge: supervisorInfo?.badge,
        role: supervisorInfo?.role,
        loginTime: new Date().toISOString()
      },
      req,
      { immediate: true, priority: 'high' }
    );
  }

  async logLogout(supervisorInfo, req, logoutReason = 'manual') {
    return this.logActivity(
      supervisorInfo,
      'supervisor_logout',
      {
        logoutReason,
        badge: supervisorInfo?.badge,
        logoutTime: new Date().toISOString()
      },
      req,
      { immediate: true, priority: 'high' }
    );
  }

  async logAlertAction(supervisorInfo, action, alertData, req) {
    return this.logActivity(
      supervisorInfo,
      action,
      {
        alertId: alertData.alertId || alertData.id,
        alertType: alertData.type,
        reason: alertData.reason,
        notes: alertData.notes,
        location: alertData.location,
        severity: alertData.severity,
        affectedRoutes: alertData.affectedRoutes?.length || 0
      },
      req,
      { priority: 'high' }
    );
  }

  async logRoadworkAction(supervisorInfo, action, roadworkData, req) {
    return this.logActivity(
      supervisorInfo,
      action,
      {
        roadworkId: roadworkData.roadworkId || roadworkData.id,
        reason: roadworkData.reason,
        note: roadworkData.note,
        location: roadworkData.location,
        source: roadworkData.source || 'unknown',
        permitReference: roadworkData.permitReference
      },
      req,
      { priority: 'high' }
    );
  }

  async logIncidentAction(supervisorInfo, action, incidentData, req) {
    return this.logActivity(
      supervisorInfo,
      action,
      {
        incidentId: incidentData.incidentId || incidentData.id,
        incidentType: incidentData.type,
        location: incidentData.location,
        severity: incidentData.severity,
        status: incidentData.status,
        affectedRoutes: incidentData.affectedRoutes?.length || 0,
        description: incidentData.description?.substring(0, 200) // Limit description length
      },
      req,
      { priority: 'high' }
    );
  }

  async logCommunication(supervisorInfo, action, communicationData, req) {
    return this.logActivity(
      supervisorInfo,
      action,
      {
        messageType: communicationData.type,
        recipients: communicationData.recipients?.length || 0,
        channels: communicationData.channels,
        priority: communicationData.priority,
        messageLength: communicationData.message?.length || 0,
        templateId: communicationData.templateId
      },
      req,
      { priority: 'medium' }
    );
  }

  async logAdminAction(supervisorInfo, action, adminData, req) {
    return this.logActivity(
      supervisorInfo,
      action,
      {
        targetSupervisor: adminData.targetSupervisor,
        affectedCount: adminData.affectedCount || 1,
        adminReason: adminData.reason,
        permissions: adminData.permissions
      },
      req,
      { immediate: true, priority: 'critical' }
    );
  }

  /**
   * Analytics and reporting functions
   */

  async getActivityStats(supervisorId = null, timeRange = '24h') {
    try {
      let query = supabase
        .from('activity_logs')
        .select('action, created_at, details')
        .order('created_at', { ascending: false });

      if (supervisorId) {
        query = query.eq('supervisor_id', supervisorId);
      }

      // Apply time range filter
      const now = new Date();
      let startTime;
      switch (timeRange) {
        case '1h':
          startTime = new Date(now - 1 * 60 * 60 * 1000);
          break;
        case '24h':
          startTime = new Date(now - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startTime = new Date(now - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startTime = new Date(now - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startTime = new Date(now - 24 * 60 * 60 * 1000);
      }

      query = query.gte('created_at', startTime.toISOString());

      const { data, error } = await query;
      
      if (error) throw error;

      // Analyze activity patterns
      const stats = {
        totalActivities: data.length,
        activityBreakdown: {},
        categoryBreakdown: {},
        hourlyDistribution: {},
        criticalActions: 0
      };

      data.forEach(activity => {
        // Action breakdown
        stats.activityBreakdown[activity.action] = 
          (stats.activityBreakdown[activity.action] || 0) + 1;

        // Category breakdown
        const category = this.categorizeAction(activity.action);
        stats.categoryBreakdown[category] = 
          (stats.categoryBreakdown[category] || 0) + 1;

        // Hourly distribution
        const hour = new Date(activity.created_at).getHours();
        stats.hourlyDistribution[hour] = 
          (stats.hourlyDistribution[hour] || 0) + 1;

        // Critical actions count
        if (this.determinePriority(activity.action, activity.details) === 'critical') {
          stats.criticalActions++;
        }
      });

      return stats;
    } catch (error) {
      console.error('❌ Failed to get activity stats:', error);
      return null;
    }
  }

  async getRecentActivities(limit = 50, supervisorId = null) {
    try {
      let query = supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (supervisorId) {
        query = query.eq('supervisor_id', supervisorId);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      return data?.map(activity => ({
        ...activity,
        category: this.categorizeAction(activity.action),
        priority: this.determinePriority(activity.action, activity.details)
      })) || [];
    } catch (error) {
      console.error('❌ Failed to get recent activities:', error);
      return [];
    }
  }

  /**
   * Cleanup and maintenance
   */
  async cleanup() {
    // Clear batch timer
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }

    // Process any remaining batched activities
    if (this.batchBuffer.length > 0) {
      await this.processBatch();
    }
  }

  /**
   * Health check for the logging service
   */
  getHealthStatus() {
    return {
      batchBufferSize: this.batchBuffer.length,
      batchTimerActive: !!this.batchTimer,
      memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      uptime: Math.round(process.uptime())
    };
  }
}

// Create singleton instance
const enhancedSupervisorActivityService = new EnhancedSupervisorActivityService();

// Graceful shutdown handling
process.on('SIGTERM', () => {
  enhancedSupervisorActivityService.cleanup();
});

process.on('SIGINT', () => {
  enhancedSupervisorActivityService.cleanup();
});

export default enhancedSupervisorActivityService;