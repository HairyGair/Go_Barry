/**
 * Audit Log Service
 * Comprehensive logging system for supervisor actions and system events
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Log a supervisor action
 * @param {string} supervisorBadge - Supervisor badge (e.g., AG003)
 * @param {string} actionType - Type of action performed
 * @param {Object} details - Action details and context
 * @param {Object} metadata - Additional metadata (IP, session, etc.)
 * @returns {Object} Log result
 */
export async function logSupervisorAction(supervisorBadge, actionType, details = {}, metadata = {}) {
  try {
    const logEntry = {
      id: crypto.randomUUID(),
      supervisor_badge: supervisorBadge,
      action_type: actionType,
      action_category: categorizeAction(actionType),
      target_type: details.targetType || inferTargetType(actionType),
      target_id: details.targetId || details.roadworkId || details.diversionId,
      action_details: sanitizeDetails(details),
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        user_agent: metadata.userAgent || 'Go BARRY Web App',
        ip_address: metadata.ipAddress || 'unknown',
        session_id: metadata.sessionId || 'unknown'
      },
      severity: determineSeverity(actionType, details),
      created_at: new Date().toISOString()
    };

    // Store in audit log table
    const { data, error } = await supabase
      .from('supervisor_audit_log')
      .insert(logEntry)
      .select()
      .single();

    if (error) throw error;

    // Log critical actions to separate high-priority table
    if (logEntry.severity === 'critical') {
      await logCriticalAction(logEntry);
    }

    // Update supervisor session with last action
    await updateSupervisorSession(supervisorBadge, actionType);

    console.log(`📝 Logged supervisor action: ${supervisorBadge} - ${actionType}`);

    return {
      success: true,
      logId: data.id,
      logEntry: data
    };

  } catch (error) {
    console.error('Error logging supervisor action:', error);
    
    // Fallback to local file logging if database fails
    await fallbackFileLogging(supervisorBadge, actionType, details, error.message);
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Log system events (non-supervisor actions)
 * @param {string} eventType - Type of system event
 * @param {Object} details - Event details
 * @param {string} source - Source of the event
 * @returns {Object} Log result
 */
export async function logSystemEvent(eventType, details = {}, source = 'system') {
  try {
    const logEntry = {
      id: crypto.randomUUID(),
      event_type: eventType,
      event_category: categorizeSystemEvent(eventType),
      source,
      event_details: sanitizeDetails(details),
      severity: determineSystemEventSeverity(eventType, details),
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('system_event_log')
      .insert(logEntry)
      .select()
      .single();

    if (error) throw error;

    console.log(`🔧 Logged system event: ${eventType} from ${source}`);

    return {
      success: true,
      logId: data.id
    };

  } catch (error) {
    console.error('Error logging system event:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Log data access for compliance
 * @param {string} userId - User accessing data
 * @param {string} dataType - Type of data accessed
 * @param {Object} accessDetails - Details of what was accessed
 * @returns {Object} Log result
 */
export async function logDataAccess(userId, dataType, accessDetails = {}) {
  try {
    const logEntry = {
      id: crypto.randomUUID(),
      user_id: userId,
      data_type: dataType,
      access_type: accessDetails.accessType || 'read',
      resource_id: accessDetails.resourceId,
      access_details: sanitizeDetails(accessDetails),
      ip_address: accessDetails.ipAddress || 'unknown',
      user_agent: accessDetails.userAgent || 'unknown',
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('data_access_log')
      .insert(logEntry)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      logId: data.id
    };

  } catch (error) {
    console.error('Error logging data access:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get audit log entries with filtering
 * @param {Object} filters - Filter criteria
 * @param {Object} pagination - Pagination options
 * @returns {Object} Audit log entries
 */
export async function getAuditLog(filters = {}, pagination = {}) {
  try {
    const {
      supervisorBadge,
      actionType,
      startDate,
      endDate,
      severity,
      targetType
    } = filters;

    const {
      page = 1,
      limit = 50,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = pagination;

    let query = supabase
      .from('supervisor_audit_log')
      .select('*');

    // Apply filters
    if (supervisorBadge) {
      query = query.eq('supervisor_badge', supervisorBadge);
    }

    if (actionType) {
      query = query.eq('action_type', actionType);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    if (severity) {
      query = query.eq('severity', severity);
    }

    if (targetType) {
      query = query.eq('target_type', targetType);
    }

    // Apply pagination and sorting
    const offset = (page - 1) * limit;
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      success: true,
      entries: data || [],
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };

  } catch (error) {
    console.error('Error retrieving audit log:', error);
    return {
      success: false,
      error: error.message,
      entries: []
    };
  }
}

/**
 * Get audit statistics
 * @param {Object} timeframe - Time period for statistics
 * @returns {Object} Audit statistics
 */
export async function getAuditStatistics(timeframe = {}) {
  try {
    const { startDate, endDate } = timeframe;
    const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const defaultEndDate = new Date();

    const start = startDate ? new Date(startDate) : defaultStartDate;
    const end = endDate ? new Date(endDate) : defaultEndDate;

    // Get supervisor action statistics
    const { data: supervisorActions, error: supervisorError } = await supabase
      .from('supervisor_audit_log')
      .select('supervisor_badge, action_type, action_category, severity, created_at')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    if (supervisorError) throw supervisorError;

    // Get system event statistics
    const { data: systemEvents, error: systemError } = await supabase
      .from('system_event_log')
      .select('event_type, event_category, severity, created_at')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    if (systemError) throw systemError;

    // Calculate statistics
    const stats = calculateAuditStatistics(supervisorActions || [], systemEvents || []);

    return {
      success: true,
      timeframe: { start: start.toISOString(), end: end.toISOString() },
      statistics: stats
    };

  } catch (error) {
    console.error('Error getting audit statistics:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Search audit logs
 * @param {string} searchQuery - Search query
 * @param {Object} options - Search options
 * @returns {Object} Search results
 */
export async function searchAuditLogs(searchQuery, options = {}) {
  try {
    const { limit = 100, timeframe = 7 } = options;
    const startDate = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000);

    // Search in supervisor actions
    const { data: supervisorResults, error: supervisorError } = await supabase
      .from('supervisor_audit_log')
      .select('*')
      .or(`action_type.ilike.%${searchQuery}%,supervisor_badge.ilike.%${searchQuery}%,action_details->>location.ilike.%${searchQuery}%`)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (supervisorError) throw supervisorError;

    // Search in system events
    const { data: systemResults, error: systemError } = await supabase
      .from('system_event_log')
      .select('*')
      .or(`event_type.ilike.%${searchQuery}%,source.ilike.%${searchQuery}%`)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (systemError) throw systemError;

    return {
      success: true,
      query: searchQuery,
      results: {
        supervisorActions: supervisorResults || [],
        systemEvents: systemResults || [],
        total: (supervisorResults?.length || 0) + (systemResults?.length || 0)
      }
    };

  } catch (error) {
    console.error('Error searching audit logs:', error);
    return {
      success: false,
      error: error.message,
      results: { supervisorActions: [], systemEvents: [], total: 0 }
    };
  }
}

// Helper functions

function categorizeAction(actionType) {
  const categories = {
    'CREATE_ROADWORK': 'data_management',
    'UPDATE_ROADWORK': 'data_management',
    'DELETE_ROADWORK': 'data_management',
    'REVIEW_ROADWORK': 'workflow',
    'APPROVE_ROADWORK': 'workflow',
    'DISMISS_ROADWORK': 'workflow',
    'CREATE_DIVERSION': 'operations',
    'UPDATE_DIVERSION': 'operations',
    'PUSH_TO_DISPLAY': 'operations',
    'REMOVE_FROM_DISPLAY': 'operations',
    'LOGIN': 'authentication',
    'LOGOUT': 'authentication',
    'VIEW_ANALYTICS': 'reporting',
    'GENERATE_REPORT': 'reporting'
  };
  
  return categories[actionType] || 'other';
}

function categorizeSystemEvent(eventType) {
  const categories = {
    'WEBHOOK_RECEIVED': 'integration',
    'DATA_SYNC': 'data',
    'REPORT_GENERATED': 'reporting',
    'EMAIL_SENT': 'notification',
    'ERROR_OCCURRED': 'error',
    'PERFORMANCE_ALERT': 'monitoring'
  };
  
  return categories[eventType] || 'system';
}

function inferTargetType(actionType) {
  if (actionType.includes('ROADWORK')) return 'roadwork';
  if (actionType.includes('DIVERSION')) return 'diversion';
  if (actionType.includes('DISPLAY')) return 'display';
  if (actionType.includes('REPORT')) return 'report';
  return 'unknown';
}

function determineSeverity(actionType, details) {
  const criticalActions = [
    'DELETE_ROADWORK',
    'PUSH_TO_DISPLAY',
    'REMOVE_FROM_DISPLAY'
  ];
  
  const highSeverityActions = [
    'CREATE_ROADWORK',
    'APPROVE_ROADWORK',
    'CREATE_DIVERSION'
  ];
  
  if (criticalActions.includes(actionType)) return 'critical';
  if (highSeverityActions.includes(actionType)) return 'high';
  if (details.severity === 'critical') return 'high';
  return 'medium';
}

function determineSystemEventSeverity(eventType, details) {
  if (eventType.includes('ERROR')) return 'high';
  if (eventType.includes('ALERT')) return 'medium';
  return 'low';
}

function sanitizeDetails(details) {
  // Remove sensitive information
  const sanitized = { ...details };
  
  // Remove potential sensitive fields
  delete sanitized.password;
  delete sanitized.token;
  delete sanitized.sessionId;
  delete sanitized.apiKey;
  
  // Truncate large text fields
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string' && sanitized[key].length > 1000) {
      sanitized[key] = sanitized[key].substring(0, 1000) + '... [truncated]';
    }
  });
  
  return sanitized;
}

async function logCriticalAction(logEntry) {
  try {
    await supabase
      .from('critical_actions_log')
      .insert({
        ...logEntry,
        requires_review: true,
        escalated_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to log critical action:', error);
  }
}

async function updateSupervisorSession(supervisorBadge, actionType) {
  try {
    await supabase
      .from('supervisor_sessions')
      .update({
        last_action: actionType,
        last_activity: new Date().toISOString()
      })
      .eq('supervisor_badge', supervisorBadge);
  } catch (error) {
    console.warn('Failed to update supervisor session:', error);
  }
}

async function fallbackFileLogging(supervisorBadge, actionType, details, errorMessage) {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logFile = path.join(logDir, `audit-fallback-${new Date().toISOString().split('T')[0]}.log`);
    const logLine = `${new Date().toISOString()} | ${supervisorBadge} | ${actionType} | ${JSON.stringify(details)} | ERROR: ${errorMessage}\n`;
    
    fs.appendFileSync(logFile, logLine);
    console.log('📁 Logged to fallback file:', logFile);
  } catch (fileError) {
    console.error('Fallback file logging failed:', fileError);
  }
}

function calculateAuditStatistics(supervisorActions, systemEvents) {
  // Supervisor action statistics
  const supervisorStats = {
    totalActions: supervisorActions.length,
    actionsByType: {},
    actionsByCategory: {},
    actionsBySeverity: {},
    actionsBySupervisor: {},
    dailyActivity: {}
  };

  supervisorActions.forEach(action => {
    // By type
    supervisorStats.actionsByType[action.action_type] = 
      (supervisorStats.actionsByType[action.action_type] || 0) + 1;

    // By category
    supervisorStats.actionsByCategory[action.action_category] = 
      (supervisorStats.actionsByCategory[action.action_category] || 0) + 1;

    // By severity
    supervisorStats.actionsBySeverity[action.severity] = 
      (supervisorStats.actionsBySeverity[action.severity] || 0) + 1;

    // By supervisor
    supervisorStats.actionsBySupervisor[action.supervisor_badge] = 
      (supervisorStats.actionsBySupervisor[action.supervisor_badge] || 0) + 1;

    // Daily activity
    const date = action.created_at.split('T')[0];
    supervisorStats.dailyActivity[date] = 
      (supervisorStats.dailyActivity[date] || 0) + 1;
  });

  // System event statistics
  const systemStats = {
    totalEvents: systemEvents.length,
    eventsByType: {},
    eventsByCategory: {},
    eventsBySeverity: {}
  };

  systemEvents.forEach(event => {
    // By type
    systemStats.eventsByType[event.event_type] = 
      (systemStats.eventsByType[event.event_type] || 0) + 1;

    // By category
    systemStats.eventsByCategory[event.event_category] = 
      (systemStats.eventsByCategory[event.event_category] || 0) + 1;

    // By severity
    systemStats.eventsBySeverity[event.severity] = 
      (systemStats.eventsBySeverity[event.severity] || 0) + 1;
  });

  // Most active supervisors
  const topSupervisors = Object.entries(supervisorStats.actionsBySupervisor)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([badge, count]) => ({ badge, count }));

  return {
    supervisor: supervisorStats,
    system: systemStats,
    summary: {
      totalActions: supervisorActions.length,
      totalEvents: systemEvents.length,
      criticalActions: supervisorActions.filter(a => a.severity === 'critical').length,
      topSupervisors
    }
  };
}

export default {
  logSupervisorAction,
  logSystemEvent,
  logDataAccess,
  getAuditLog,
  getAuditStatistics,
  searchAuditLogs
};