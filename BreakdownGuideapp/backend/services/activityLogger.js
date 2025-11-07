/**
 * Activity Logger Service
 *
 * Centralized service for logging all activities across the Go BARRY system.
 * Provides a unified interface for tracking user actions, system events,
 * and state changes for real-time activity feeds.
 */

import { from, query, insert as dbInsert } from '../utils/queryHelpers.js';

// Activity type constants
export const ACTIVITY_TYPES = {
  // Breakdown-related activities
  BREAKDOWN_REPORTED: 'breakdown_reported',
  BREAKDOWN_UPDATED: 'breakdown_updated',
  BREAKDOWN_RESOLVED: 'breakdown_resolved',

  // Wizard activities
  WIZARD_STARTED: 'wizard_started',
  WIZARD_COMPLETED: 'wizard_completed',
  WIZARD_DECISION: 'wizard_decision',

  // Engineering activities
  ENGINEER_ASSIGNED: 'engineer_assigned',
  ENGINEER_DISPATCHED: 'engineer_dispatched',
  ENGINEER_ON_SITE: 'engineer_on_site',
  ENGINEER_COMPLETED: 'engineer_completed',

  // SDC Operations
  SDC_PRIORITY_CHANGE: 'sdc_priority_change',
  SDC_DECISION: 'sdc_decision',
  SDC_ESCALATION: 'sdc_escalation',

  // System events
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  SYSTEM_ERROR: 'system_error',
  DATA_SYNC: 'data_sync'
};

// Actor types
export const ACTOR_TYPES = {
  SUPERVISOR: 'supervisor',
  ENGINEER: 'engineer',
  ADMIN: 'admin',
  SYSTEM: 'system'
};

// Severity levels
export const SEVERITY_LEVELS = {
  CRITICAL: 'critical',
  WARNING: 'warning',
  NORMAL: 'normal',
  SUCCESS: 'success',
  INFO: 'info'
};

// Entity types
export const ENTITY_TYPES = {
  BREAKDOWN: 'breakdown',
  VEHICLE: 'vehicle',
  ENGINEER: 'engineer',
  REPORT: 'report',
  WIZARD: 'wizard'
};

class ActivityLoggerService {
  constructor() {
    this.isInitialized = false;
    this.pendingActivities = [];
    this.maxBatchSize = 10;
    this.batchTimeout = 5000; // 5 seconds
    this.batchTimer = null;
    this.webSocketHandler = null; // WebSocket handler for real-time broadcasts
    // Auto-initialize with MySQL
    this.init();
  }

  /**
   * Set WebSocket handler for broadcasting activity events
   * Called by server.js after WebSocket initialization
   */
  setWebSocketHandler(wsHandler) {
    this.webSocketHandler = wsHandler;
    console.log('✅ WebSocket handler connected to Activity Logger');
  }

  /**
   * Initialize the service
   */
  async init() {
    try {
      // Test connection to activities table
      const testSql = 'SELECT id FROM activities LIMIT 1';
      await query(testSql).catch(error => {
        // Table might not exist yet, which is okay
        if (!error.message.includes("doesn't exist")) {
          throw error;
        }
      });

      this.isInitialized = true;
      console.log('✅ Activity Logger Service initialized with MySQL');

      // Process any pending activities
      if (this.pendingActivities.length > 0) {
        await this.flushPendingActivities();
      }

      return true;
    } catch (error) {
      console.error('❌ Activity Logger Service initialization failed:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Log a single activity
   */
  async logActivity({
    activityType,
    action,
    actorType,
    actorId = null,
    actorName = null,
    entityType = null,
    entityId = null,
    entityDetails = {},
    depot = null,
    severity = SEVERITY_LEVELS.INFO,
    priority = 5,
    source = null,
    sourceUrl = null,
    metadata = {},
    icon = null,
    message = null
  }) {
    // Validate required fields
    if (!activityType || !action || !actorType) {
      throw new Error('Missing required fields: activityType, action, actorType');
    }

    const activity = {
      activity_type: activityType,
      action,
      actor_type: actorType,
      actor_id: actorId,
      actor_name: actorName,
      entity_type: entityType,
      entity_id: entityId,
      entity_details: entityDetails,
      depot,
      severity,
      priority,
      source,
      source_url: sourceUrl,
      metadata,
      icon: icon || this.getDefaultIcon(activityType, severity),
      message: message || this.generateMessage({
        action,
        actorName: actorName || actorId,
        entityType,
        entityId,
        entityDetails,
        severity
      })
    };

    if (!this.isInitialized) {
      // Queue the activity if service not initialized
      this.pendingActivities.push(activity);
      console.log('📋 Activity queued (service not initialized):', activity.activity_type);
      return null;
    }

    try {
      // Insert into MySQL
      const result = await dbInsert('activities', activity);

      // Fetch the inserted record to return full data
      const selectSql = 'SELECT * FROM activities WHERE id = ? LIMIT 1';
      const rows = await query(selectSql, [result.insertId]);
      const data = rows[0] || null;

      console.log(`📝 Activity logged: ${activityType} by ${actorName || actorId}`);

      // Broadcast activity via WebSocket
      if (this.webSocketHandler && data) {
        this.broadcastActivity(data);
      }

      return data;
    } catch (error) {
      console.error('❌ Failed to log activity:', error);

      // Queue for retry
      this.pendingActivities.push(activity);
      this.scheduleBatchFlush();

      return null;
    }
  }

  /**
   * Log multiple activities in batch
   */
  async logActivities(activities) {
    if (!Array.isArray(activities) || activities.length === 0) {
      return [];
    }

    if (!this.isInitialized) {
      this.pendingActivities.push(...activities);
      return [];
    }

    try {
      // Insert multiple records
      const insertedIds = [];

      for (const activity of activities) {
        const result = await dbInsert('activities', activity);
        insertedIds.push(result.insertId);
      }

      // Fetch all inserted records
      const selectSql = `SELECT * FROM activities WHERE id IN (${insertedIds.map(() => '?').join(', ')})`;
      const data = await query(selectSql, insertedIds);

      console.log(`📝 Batch logged ${activities.length} activities`);

      // Broadcast each activity via WebSocket
      if (this.webSocketHandler && data) {
        data.forEach(activity => this.broadcastActivity(activity));
      }

      return data;
    } catch (error) {
      console.error('❌ Failed to batch log activities:', error);

      // Queue for retry
      this.pendingActivities.push(...activities);
      this.scheduleBatchFlush();

      return [];
    }
  }

  /**
   * Convenience methods for common activity types
   */

  async logBreakdownReported({
    supervisorId,
    supervisorName,
    breakdownId,
    fleetNo,
    issueCategory,
    location,
    severity,
    depot,
    source = 'breakdown_guide'
  }) {
    return await this.logActivity({
      activityType: ACTIVITY_TYPES.BREAKDOWN_REPORTED,
      action: `reported ${issueCategory || 'breakdown'} on ${fleetNo}`,
      actorType: ACTOR_TYPES.SUPERVISOR,
      actorId: supervisorId,
      actorName: supervisorName,
      entityType: ENTITY_TYPES.BREAKDOWN,
      entityId: breakdownId,
      entityDetails: { fleetNo, issueCategory, location },
      depot,
      severity: severity === 'STOP' ? SEVERITY_LEVELS.CRITICAL :
               severity === 'AMBER' ? SEVERITY_LEVELS.WARNING : SEVERITY_LEVELS.NORMAL,
      source,
      metadata: { fleetNo, location, issueCategory },
      icon: severity === 'STOP' ? '🚨' :
            severity === 'AMBER' ? '⚡' : '⚠️'
    });
  }

  async logWizardCompleted({
    supervisorId,
    supervisorName,
    breakdownId,
    fleetNo,
    wizardType,
    decision,
    depot,
    location = null,
    locationCoords = null,
    latitude = null,
    longitude = null,
    assessmentData = {}
  }) {
    return await this.logActivity({
      activityType: ACTIVITY_TYPES.WIZARD_COMPLETED,
      action: `completed ${wizardType} assessment - ${decision}`,
      actorType: ACTOR_TYPES.SUPERVISOR,
      actorId: supervisorId,
      actorName: supervisorName,
      entityType: ENTITY_TYPES.BREAKDOWN,
      entityId: breakdownId,
      entityDetails: {
        fleetNo,
        wizardType,
        decision,
        location: location || assessmentData?.location,
        latitude: latitude || locationCoords?.lat,
        longitude: longitude || locationCoords?.lng
      },
      depot,
      severity: decision === 'STOP' ? SEVERITY_LEVELS.CRITICAL :
               decision === 'AMBER' ? SEVERITY_LEVELS.WARNING : SEVERITY_LEVELS.SUCCESS,
      source: 'breakdown_guide',
      metadata: {
        wizardType,
        decision,
        assessmentData,
        location: location || assessmentData?.location,
        locationCoords: locationCoords,
        latitude: latitude || locationCoords?.lat,
        longitude: longitude || locationCoords?.lng
      },
      icon: decision === 'STOP' ? '📋🚨' :
            decision === 'AMBER' ? '📋⚡' : '📋✅'
    });
  }

  async logEngineerAssigned({
    engineerId,
    engineerName,
    breakdownId,
    fleetNo,
    assignedBy,
    estimatedArrival,
    depot
  }) {
    return await this.logActivity({
      activityType: ACTIVITY_TYPES.ENGINEER_ASSIGNED,
      action: `assigned to ${fleetNo}`,
      actorType: ACTOR_TYPES.ENGINEER,
      actorId: engineerId,
      actorName: engineerName,
      entityType: ENTITY_TYPES.BREAKDOWN,
      entityId: breakdownId,
      entityDetails: { fleetNo, assignedBy, estimatedArrival },
      depot,
      severity: SEVERITY_LEVELS.INFO,
      source: 'engineering_dashboard',
      metadata: { assignedBy, estimatedArrival },
      icon: '👷'
    });
  }

  async logEngineerOnSite({
    engineerId,
    engineerName,
    breakdownId,
    fleetNo,
    arrivalTime,
    depot
  }) {
    return await this.logActivity({
      activityType: ACTIVITY_TYPES.ENGINEER_ON_SITE,
      action: `arrived at ${fleetNo}`,
      actorType: ACTOR_TYPES.ENGINEER,
      actorId: engineerId,
      actorName: engineerName,
      entityType: ENTITY_TYPES.BREAKDOWN,
      entityId: breakdownId,
      entityDetails: { fleetNo, arrivalTime },
      depot,
      severity: SEVERITY_LEVELS.INFO,
      source: 'engineering_dashboard',
      metadata: { arrivalTime },
      icon: '🔧'
    });
  }

  async logSDCDecision({
    supervisorId,
    supervisorName,
    breakdownId,
    fleetNo,
    decision,
    priority,
    notes,
    depot
  }) {
    return await this.logActivity({
      activityType: ACTIVITY_TYPES.SDC_DECISION,
      action: `made decision: ${decision}`,
      actorType: ACTOR_TYPES.SUPERVISOR,
      actorId: supervisorId,
      actorName: supervisorName,
      entityType: ENTITY_TYPES.BREAKDOWN,
      entityId: breakdownId,
      entityDetails: { fleetNo, decision, priority },
      depot,
      severity: priority === 'critical' ? SEVERITY_LEVELS.CRITICAL : SEVERITY_LEVELS.NORMAL,
      source: 'sdc_operations',
      metadata: { decision, priority, notes },
      icon: '📋'
    });
  }

  async logSystemEvent({
    eventType,
    description,
    severity = SEVERITY_LEVELS.INFO,
    metadata = {}
  }) {
    return await this.logActivity({
      activityType: eventType,
      action: description,
      actorType: ACTOR_TYPES.SYSTEM,
      actorId: 'SYSTEM',
      actorName: 'System',
      severity,
      source: 'system',
      metadata,
      icon: '⚙️'
    });
  }

  /**
   * Generate default activity message
   * Creates human-readable messages that match the frontend formatter expectations
   */
  generateMessage({
    action,
    actorName,
    entityType,
    entityId,
    entityDetails,
    severity
  }) {
    const actor = actorName || 'A supervisor';

    // If action already contains the actor name or is a complete sentence, use it as is
    if (action.includes(actor) || action.match(/^[A-Z].*[.!?]$/)) {
      return action;
    }

    // Otherwise, construct the message
    let message = `${actor} ${action}`;

    // Don't duplicate fleet number if it's already in the action
    if (entityType && entityId && entityDetails) {
      if (entityType === ENTITY_TYPES.BREAKDOWN && entityDetails.fleetNo && !action.includes(entityDetails.fleetNo)) {
        // Check if action already describes the vehicle
        if (!action.includes('on') && !action.includes('for')) {
          message += ` on ${entityDetails.fleetNo}`;
        }
      }

      // Add location only if not already in the message
      if (entityDetails.location && !message.includes(entityDetails.location)) {
        message += ` at ${entityDetails.location}`;
      }
    }

    return message;
  }

  /**
   * Get default icon for activity type and severity
   */
  getDefaultIcon(activityType, severity) {
    // Activity type specific icons
    const activityIcons = {
      [ACTIVITY_TYPES.BREAKDOWN_REPORTED]: severity === SEVERITY_LEVELS.CRITICAL ? '🚨' : '⚠️',
      [ACTIVITY_TYPES.WIZARD_COMPLETED]: '📋',
      [ACTIVITY_TYPES.ENGINEER_ASSIGNED]: '👷',
      [ACTIVITY_TYPES.ENGINEER_ON_SITE]: '🔧',
      [ACTIVITY_TYPES.SDC_DECISION]: '📋',
      [ACTIVITY_TYPES.USER_LOGIN]: '🔑',
      [ACTIVITY_TYPES.SYSTEM_ERROR]: '❌'
    };

    return activityIcons[activityType] || '📝';
  }

  /**
   * Schedule batch flush of pending activities
   */
  scheduleBatchFlush() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    this.batchTimer = setTimeout(() => {
      this.flushPendingActivities();
    }, this.batchTimeout);
  }

  /**
   * Flush pending activities
   */
  async flushPendingActivities() {
    if (this.pendingActivities.length === 0) {
      return;
    }

    const activitiesToProcess = this.pendingActivities.splice(0);
    console.log(`📋 Flushing ${activitiesToProcess.length} pending activities`);

    try {
      await this.logActivities(activitiesToProcess);
    } catch (error) {
      console.error('❌ Failed to flush pending activities:', error);
      // Put them back at the beginning of the queue
      this.pendingActivities.unshift(...activitiesToProcess);
    }

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }

  /**
   * Broadcast activity to WebSocket clients
   */
  broadcastActivity(activity) {
    if (!this.webSocketHandler) return;

    try {
      const broadcastData = {
        type: 'activity_created',
        event: 'new_activity',
        activity: {
          id: activity.id,
          activity_type: activity.activity_type,
          action: activity.action,
          actor_type: activity.actor_type,
          actor_id: activity.actor_id,
          actor_name: activity.actor_name,
          entity_type: activity.entity_type,
          entity_id: activity.entity_id,
          entity_details: activity.entity_details,
          depot: activity.depot,
          severity: activity.severity,
          priority: activity.priority,
          source: activity.source,
          metadata: activity.metadata,
          icon: activity.icon,
          message: activity.message,
          timestamp: activity.created_at,
          created_at: activity.created_at
        },
        timestamp: new Date().toISOString()
      };

      // Broadcast to relevant channels
      const broadcastCount = this.webSocketHandler.broadcast('breakdowns', broadcastData);
      console.log(`📡 Activity broadcasted to ${broadcastCount} WebSocket clients`);
    } catch (error) {
      console.error('❌ Error broadcasting activity:', error);
    }
  }

  /**
   * Get recent activities
   */
  async getRecentActivities(limit = 50, offset = 0, filters = {}) {
    try {
      let activitiesQuery = from('activities')
        .select('*')
        .order('created_at', 'DESC')
        .range(offset, offset + limit - 1);

      // Apply filters
      if (filters.depot) {
        activitiesQuery = activitiesQuery.eq('depot', filters.depot);
      }
      if (filters.actorId) {
        activitiesQuery = activitiesQuery.eq('actor_id', filters.actorId);
      }
      if (filters.activityType) {
        activitiesQuery = activitiesQuery.eq('activity_type', filters.activityType);
      }
      if (filters.severity) {
        activitiesQuery = activitiesQuery.eq('severity', filters.severity);
      }
      if (filters.source) {
        activitiesQuery = activitiesQuery.eq('source', filters.source);
      }

      const { data, error } = await activitiesQuery.execute();

      if (error) throw error;

      return {
        success: true,
        activities: data || [],
        count: data?.length || 0
      };
    } catch (error) {
      console.error('❌ Failed to get recent activities:', error);
      return {
        success: false,
        error: error.message,
        activities: [],
        count: 0
      };
    }
  }

  /**
   * Search activities
   */
  async searchActivities(searchTerm, limit = 20, offset = 0) {
    try {
      // MySQL full-text search using LIKE for now
      // For production, consider adding FULLTEXT indexes
      const searchSql = `
        SELECT * FROM activities
        WHERE message LIKE ? OR action LIKE ? OR actor_name LIKE ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;

      const searchPattern = `%${searchTerm}%`;
      const data = await query(searchSql, [
        searchPattern,
        searchPattern,
        searchPattern,
        parseInt(limit),
        parseInt(offset)
      ]);

      return {
        success: true,
        activities: data || [],
        count: data?.length || 0,
        searchTerm
      };
    } catch (error) {
      console.error('❌ Failed to search activities:', error);
      return {
        success: false,
        error: error.message,
        activities: [],
        count: 0,
        searchTerm
      };
    }
  }
}

// Export singleton instance
export const activityLogger = new ActivityLoggerService();

// Activity logger will be initialized from server.js after Supabase client is ready

export default activityLogger;