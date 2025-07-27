// backend/middleware/supervisorLoggingMiddleware.js
// Enhanced supervisor activity logging middleware for comprehensive action tracking

import { logActivity } from '../services/supervisorManager.js';

/**
 * Comprehensive Supervisor Action Logging Middleware
 * 
 * This middleware automatically logs ALL supervisor actions across the Go BARRY system.
 * It captures authentication, navigation, operational decisions, and system interactions.
 * 
 * Key Features:
 * - Automatic action detection based on endpoint patterns
 * - Performance optimized with async logging
 * - Consistent data format across all logged actions
 * - Session context extraction and validation
 * - Request metadata capture (IP, User-Agent, timing)
 * - Memory-efficient with 2GB RAM constraint in mind
 */

// Action type mapping based on endpoint patterns
const ACTION_MAPPINGS = {
  // Authentication & Session Management
  'POST /api/supervisor/login': 'supervisor_login',
  'POST /api/supervisor/auth/login': 'supervisor_login', 
  'POST /api/supervisor/auth/simple': 'supervisor_login_mobile',
  'POST /api/supervisor/login/secure': 'supervisor_login_secure',
  'POST /api/supervisor/auth/logout': 'supervisor_logout',
  'POST /api/supervisor/auth/validate': 'session_validation',
  
  // Alert & Incident Management
  'POST /api/supervisor/alerts/dismiss': 'alert_dismissed',
  'POST /api/supervisor/alerts/restore': 'alert_restored',
  'POST /api/supervisor/acknowledge-alert': 'alert_acknowledged',
  'POST /api/supervisor/dismiss-from-display': 'alert_display_dismissed',
  'POST /api/supervisor/lock-on-display': 'alert_display_locked',
  'POST /api/supervisor/unlock-from-display': 'alert_display_unlocked',
  'POST /api/incidents': 'incident_created',
  'PUT /api/incidents/:id': 'incident_updated',
  'DELETE /api/incidents/:id': 'incident_deleted',
  
  // Roadwork Management
  'POST /api/roadworks/:id/dismiss': 'roadwork_dismissed',
  'POST /api/roadworks/:id/acknowledge': 'roadwork_acknowledged', 
  'POST /api/roadworks/:id/save': 'roadwork_saved',
  'POST /api/streetmanager/actions/:id/dismiss': 'streetmanager_dismissed',
  'POST /api/streetmanager/actions/:id/acknowledge': 'streetmanager_acknowledged',
  
  // System Interactions & Navigation
  'POST /api/supervisor/update-priority': 'alert_priority_updated',
  'POST /api/supervisor/add-note': 'supervisor_note_added',
  'POST /api/supervisor/broadcast-message': 'message_broadcasted',
  'GET /api/supervisor/active': 'display_screen_viewed',
  'GET /api/supervisor/sync-status': 'supervisor_sync_checked',
  
  // Communication & Coordination
  'POST /api/supervisor/coordinate': 'supervisor_coordination',
  'POST /api/supervisor/handover': 'shift_handover_created',
  'POST /api/supervisor/handover/:id/acknowledge': 'handover_acknowledged',
  'POST /api/supervisor/templates/:id/send': 'template_message_sent',
  'POST /api/email/send': 'email_sent',
  'POST /api/communications/send': 'communication_sent',
  
  // Admin Actions
  'POST /api/supervisor/admin/logout-all': 'admin_logout_all',
  'POST /api/supervisor/admin/add-supervisor': 'admin_supervisor_added',
  'DELETE /api/supervisor/admin/delete-supervisor/:id': 'admin_supervisor_deleted',
  'POST /api/supervisor/admin/reset-password': 'admin_password_reset',
  
  // Operational Activities
  'POST /api/supervisor/log-duty': 'duty_logged',
  'POST /api/disruptions': 'disruption_created',
  'POST /api/analytics/report': 'report_generated',
  'POST /api/vix/upload': 'vix_data_uploaded',
  'POST /api/settings/update': 'settings_updated'
};

// Extract session information from request
function extractSessionInfo(req) {
  // Try multiple sources for session identification
  const sessionId = req.body?.sessionId || 
                   req.query?.sessionId || 
                   req.headers['x-session-id'];
  
  const supervisorToken = req.body?.supervisorToken || 
                         req.headers['x-supervisor-token'];
  
  return { sessionId, supervisorToken };
}

// Determine action type from request
function determineActionType(req) {
  const method = req.method;
  const path = req.route?.path || req.path;
  const fullPath = `${method} ${path}`;
  
  // Direct mapping first
  if (ACTION_MAPPINGS[fullPath]) {
    return ACTION_MAPPINGS[fullPath];
  }
  
  // Pattern matching for parameterized routes
  for (const [pattern, action] of Object.entries(ACTION_MAPPINGS)) {
    const regex = new RegExp('^' + pattern.replace(/:\w+/g, '[^/]+') + '$');
    if (regex.test(fullPath)) {
      return action;
    }
  }
  
  // Fallback: derive from endpoint
  if (path.includes('/dismiss')) return 'item_dismissed';
  if (path.includes('/acknowledge')) return 'item_acknowledged';
  if (path.includes('/create') || method === 'POST') return 'item_created';
  if (path.includes('/update') || method === 'PUT' || method === 'PATCH') return 'item_updated';
  if (path.includes('/delete') || method === 'DELETE') return 'item_deleted';
  if (method === 'GET' && path.includes('/admin')) return 'admin_view_accessed';
  if (method === 'GET') return 'data_accessed';
  
  return 'unknown_action';
}

// Extract relevant details from request/response
function extractActionDetails(req, res, actionType) {
  const details = {
    endpoint: `${req.method} ${req.path}`,
    sessionId: extractSessionInfo(req).sessionId,
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip || req.connection?.remoteAddress,
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substring(7)}`
  };
  
  // Add specific details based on action type
  switch (actionType) {
    case 'alert_dismissed':
    case 'alert_acknowledged':
      details.alertId = req.body?.alertId || req.params?.id;
      details.reason = req.body?.reason;
      details.notes = req.body?.notes;
      break;
      
    case 'roadwork_dismissed':
    case 'roadwork_acknowledged':
      details.roadworkId = req.params?.id;
      details.reason = req.body?.reason;
      details.note = req.body?.note;
      break;
      
    case 'incident_created':
      details.incidentType = req.body?.type;
      details.location = req.body?.location;
      details.severity = req.body?.severity;
      details.affectedRoutes = req.body?.affectedRoutes?.length || 0;
      break;
      
    case 'message_broadcasted':
      details.messageLength = req.body?.message?.length || 0;
      details.priority = req.body?.priority;
      details.duration = req.body?.duration;
      break;
      
    case 'supervisor_coordination':
      details.targetSupervisor = req.body?.targetSupervisor;
      details.messageLength = req.body?.message?.length || 0;
      details.priority = req.body?.priority;
      break;
      
    case 'email_sent':
      details.recipientCount = req.body?.recipients?.length || 0;
      details.emailType = req.body?.type;
      details.subject = req.body?.subject;
      break;
      
    case 'template_message_sent':
      details.templateId = req.params?.templateId;
      details.channels = req.body?.channels;
      details.recipients = req.body?.recipients;
      break;
      
    case 'admin_supervisor_added':
      details.newSupervisorName = req.body?.name;
      details.newSupervisorBadge = req.body?.badge;
      details.newSupervisorRole = req.body?.role;
      break;
      
    case 'admin_supervisor_deleted':
      details.deletedSupervisorId = req.params?.supervisorId;
      break;
      
    case 'duty_logged':
      details.dutyNumber = req.body?.dutyNumber;
      details.dutyName = req.body?.dutyName;
      break;
  }
  
  // Add response information if available
  if (res && res.locals) {
    details.responseStatus = res.statusCode;
    if (res.locals.responseTime) {
      details.responseTime = res.locals.responseTime;
    }
  }
  
  return details;
}

// Performance-optimized async logging function
async function logSupervisorAction(actionType, details, supervisorInfo, req) {
  // Skip logging for certain low-value actions to reduce noise
  const skipActions = ['session_validation', 'data_accessed', 'supervisor_sync_checked'];
  if (skipActions.includes(actionType)) {
    return;
  }
  
  try {
    // Use existing logActivity function from supervisorManager
    await logActivity(actionType, details, supervisorInfo, req);
  } catch (error) {
    // Never let logging errors break the main request flow
    console.warn('⚠️ Supervisor action logging failed:', error.message);
    
    // Optional: Store failed logs for retry
    if (!global.failedSupervisorLogs) {
      global.failedSupervisorLogs = [];
    }
    
    // Keep only last 50 failed logs to prevent memory issues
    if (global.failedSupervisorLogs.length >= 50) {
      global.failedSupervisorLogs = global.failedSupervisorLogs.slice(-25);
    }
    
    global.failedSupervisorLogs.push({
      actionType,
      details,
      supervisorInfo,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Main middleware function
export default function supervisorLoggingMiddleware(options = {}) {
  const {
    enablePerformanceTracking = true,
    skipPaths = ['/health', '/metrics', '/api/health'],
    maxLogLevel = 'info'
  } = options;
  
  return async (req, res, next) => {
    const startTime = Date.now();
    
    // Skip logging for certain paths
    if (skipPaths.some(path => req.path.startsWith(path))) {
      return next();
    }
    
    // Only log supervisor-related endpoints
    if (!req.path.includes('/supervisor') && 
        !req.path.includes('/roadworks') && 
        !req.path.includes('/incidents') && 
        !req.path.includes('/alerts') &&
        !req.path.includes('/email') &&
        !req.path.includes('/communications') &&
        !req.path.includes('/admin')) {
      return next();
    }
    
    const actionType = determineActionType(req);
    const { sessionId } = extractSessionInfo(req);
    
    // Enhanced response tracking
    const originalSend = res.send;
    res.send = function(body) {
      if (enablePerformanceTracking) {
        res.locals.responseTime = Date.now() - startTime;
      }
      
      // Extract supervisor info and log action asynchronously
      if (sessionId && actionType !== 'unknown_action') {
        // Don't await this to avoid blocking the response
        (async () => {
          try {
            // Validate session to get supervisor info
            const supervisorManager = await import('../services/supervisorManager.js');
            const sessionResult = await supervisorManager.default.validateSupervisorSession(sessionId);
            
            if (sessionResult.success) {
              const supervisorInfo = {
                id: sessionResult.supervisor.id,
                name: sessionResult.supervisor.name,
                badge: sessionResult.supervisor.badge
              };
              
              const details = extractActionDetails(req, res, actionType);
              await logSupervisorAction(actionType, details, supervisorInfo, req);
            }
          } catch (error) {
            // Silent fail for logging - don't impact main request
            console.warn('⚠️ Async supervisor logging failed:', error.message);
          }
        })();
      }
      
      return originalSend.call(this, body);
    };
    
    next();
  };
}

// Export utility functions for manual logging
export {
  logSupervisorAction,
  extractActionDetails,
  determineActionType,
  ACTION_MAPPINGS
};