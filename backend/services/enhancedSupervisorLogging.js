// backend/services/enhancedSupervisorLogging.js
// Enhanced logging functions to augment existing supervisorManager functionality

// Initialize Supabase with lazy loading and error handling
let supabase = null;

async function getSupabaseClient() {
  if (supabase) return supabase;
  
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.warn('⚠️ Supabase environment variables not available for enhanced supervisor logging');
      return null;
    }
    
    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    console.log('✅ Supabase client initialized for enhanced supervisor logging');
    return supabase;
  } catch (error) {
    console.error('❌ Failed to initialize Supabase for enhanced supervisor logging:', error.message);
    return null;
  }
}

/**
 * Enhanced Activity Logging with Performance Optimization
 * 
 * This module enhances the existing logActivity function from supervisorManager.js
 * while maintaining full backward compatibility. It adds:
 * - Batch processing for performance
 * - Enhanced metadata capture
 * - Consistent data formatting
 * - Error handling and retry logic
 * - Memory optimization for 2GB constraint
 */

// Batch processing state
let logBatch = [];
let batchTimer = null;
const BATCH_SIZE = 10;
const BATCH_TIMEOUT = 3000; // 3 seconds

// Enhanced activity logging function
async function enhancedLogActivity(action, details, supervisorInfo = null, req = null, options = {}) {
  const {
    immediate = false,
    skipBatch = false,
    category = categorizeAction(action),
    priority = determinePriority(action, details)
  } = options;

  try {
    // Enhanced activity log structure
    const activityLog = {
      action,
      details: {
        ...details,
        // Enhanced metadata
        category,
        priority,
        timestamp: new Date().toISOString(),
        requestId: req?.headers?.['x-request-id'] || generateRequestId(),
        
        // System context
        systemContext: {
          nodeVersion: process.version,
          platform: process.platform,
          memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
          uptime: Math.round(process.uptime()) // seconds
        },
        
        // Request metadata if available
        ...(req && {
          requestMetadata: {
            method: req.method,
            path: req.path,
            query: Object.keys(req.query || {}).length > 0 ? req.query : undefined,
            contentType: req.headers['content-type'],
            contentLength: req.headers['content-length'],
            referer: req.headers.referer
          }
        })
      },
      supervisor_id: supervisorInfo?.id || null,
      supervisor_name: supervisorInfo?.name || null,
      supervisor_badge: supervisorInfo?.badge || null,
      supervisor_role: supervisorInfo?.role || null,
      screen_type: details?.screenType || 'supervisor',
      ip_address: req?.ip || req?.connection?.remoteAddress || null,
      user_agent: req?.headers?.['user-agent'] || null,
      created_at: new Date().toISOString()
    };

    if (immediate || skipBatch || priority === 'critical') {
      // Log immediately for critical actions
      await insertActivityLog(activityLog);
      console.log(`📝 [IMMEDIATE] Activity logged: ${supervisorInfo?.name || 'System'} - ${action}`);
    } else {
      // Add to batch for performance optimization
      addToBatch(activityLog);
    }

    return { success: true, activityLog };
  } catch (error) {
    console.error('❌ Enhanced activity logging failed:', error);
    
    // Fallback to basic logging
    try {
      await insertActivityLog({
        action,
        details: { ...details, error: 'Enhanced logging failed, using fallback' },
        supervisor_id: supervisorInfo?.id || null,
        supervisor_name: supervisorInfo?.name || null,
        created_at: new Date().toISOString()
      });
    } catch (fallbackError) {
      console.error('❌ Fallback logging also failed:', fallbackError);
    }
    
    return { success: false, error: error.message };
  }
}

// Insert activity log to database
async function insertActivityLog(activityLog) {
  const supabaseClient = await getSupabaseClient();
  
  if (!supabaseClient) {
    console.warn('⚠️ Supabase not available, skipping activity log insert');
    return;
  }
  
  const { error } = await supabaseClient
    .from('activity_logs')
    .insert(activityLog);

  if (error) {
    throw error;
  }
}

// Add activity to batch
function addToBatch(activityLog) {
  logBatch.push(activityLog);
  
  // Process batch if it reaches the size limit
  if (logBatch.length >= BATCH_SIZE) {
    processBatch();
  } else if (!batchTimer) {
    // Start timer for batch processing
    batchTimer = setTimeout(processBatch, BATCH_TIMEOUT);
  }
}

// Process batch of activities
async function processBatch() {
  if (logBatch.length === 0) return;
  
  const batch = logBatch.splice(0, BATCH_SIZE);
  
  // Clear timer
  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }
  
  try {
    const supabaseClient = await getSupabaseClient();
    
    if (!supabaseClient) {
      console.warn('⚠️ Supabase not available, skipping batch activity log insert');
      return;
    }
    
    const { error } = await supabaseClient
      .from('activity_logs')
      .insert(batch);

    if (error) {
      console.error('❌ Batch logging failed:', error);
      
      // Retry failed items individually
      for (const item of batch) {
        try {
          await insertActivityLog(item);
        } catch (retryError) {
          console.error('❌ Individual retry failed:', retryError);
        }
      }
    } else {
      console.log(`✅ Batch logged ${batch.length} supervisor activities`);
    }
  } catch (error) {
    console.error('❌ Batch processing error:', error);
  }
  
  // Process remaining items if any
  if (logBatch.length > 0) {
    batchTimer = setTimeout(processBatch, BATCH_TIMEOUT);
  }
}

// Categorize actions for better organization
function categorizeAction(action) {
  const categoryMap = {
    // Authentication & Session
    'supervisor_login': 'authentication',
    'supervisor_logout': 'authentication',
    'session_validation': 'authentication',
    'session_timeout': 'authentication',
    'password_reset': 'authentication',

    // Alert Management
    'alert_dismissed': 'alert_management',
    'alert_acknowledged': 'alert_management',
    'alert_restored': 'alert_management',
    'alert_priority_updated': 'alert_management',

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
    'supervisor_added': 'administration',
    'supervisor_deleted': 'administration',

    // Operations
    'duty_started': 'operations',
    'duty_ended': 'operations',
    'shift_handover': 'operations',
    'disruption_created': 'operations',

    // Navigation
    'display_screen_view': 'navigation',
    'data_access': 'navigation',
    'settings_updated': 'navigation'
  };

  return categoryMap[action] || 'general';
}

// Determine priority level
function determinePriority(action, details) {
  const criticalActions = [
    'admin_logout_all',
    'supervisor_deleted',
    'password_reset',
    'security_breach'
  ];

  const highPriorityActions = [
    'supervisor_login',
    'supervisor_logout',
    'alert_dismissed',
    'roadwork_dismissed',
    'incident_created',
    'drivers_notified'
  ];

  if (criticalActions.includes(action)) return 'critical';
  if (highPriorityActions.includes(action)) return 'high';
  if (details?.severity === 'high' || details?.priority === 'high') return 'high';
  
  return 'medium';
}

// Generate unique request ID
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

// Specialized logging functions for common supervisor actions

async function logSupervisorLogin(supervisorInfo, req, loginType = 'standard') {
  return enhancedLogActivity(
    'supervisor_login',
    {
      loginType,
      badge: supervisorInfo?.badge,
      role: supervisorInfo?.role,
      loginTime: new Date().toISOString(),
      screenType: 'login'
    },
    supervisorInfo,
    req,
    { immediate: true, priority: 'high' }
  );
}

async function logSupervisorLogout(supervisorInfo, req, logoutReason = 'manual') {
  return enhancedLogActivity(
    'supervisor_logout',
    {
      logoutReason,
      badge: supervisorInfo?.badge,
      sessionDuration: calculateSessionDuration(supervisorInfo),
      logoutTime: new Date().toISOString(),
      screenType: 'logout'
    },
    supervisorInfo,
    req,
    { immediate: true, priority: 'high' }
  );
}

async function logAlertDismissal(supervisorInfo, alertData, req) {
  return enhancedLogActivity(
    'alert_dismissed',
    {
      alertId: alertData.alertId || alertData.id,
      alertType: alertData.type,
      reason: alertData.reason,
      notes: alertData.notes,
      location: alertData.location,
      severity: alertData.severity,
      affectedRoutes: alertData.affectedRoutes?.length || 0,
      screenType: 'alerts'
    },
    supervisorInfo,
    req,
    { priority: 'high' }
  );
}

async function logRoadworkAction(supervisorInfo, action, roadworkData, req) {
  return enhancedLogActivity(
    action,
    {
      roadworkId: roadworkData.roadworkId || roadworkData.id,
      reason: roadworkData.reason,
      note: roadworkData.note,
      location: roadworkData.location,
      source: roadworkData.source || 'unknown',
      permitReference: roadworkData.permitReference,
      affectedRoutes: roadworkData.affectedRoutes?.length || 0,
      screenType: 'roadworks'
    },
    supervisorInfo,
    req,
    { priority: 'high' }
  );
}

async function logIncidentCreation(supervisorInfo, incidentData, req) {
  return enhancedLogActivity(
    'incident_created',
    {
      incidentId: incidentData.id,
      incidentType: incidentData.type,
      subtype: incidentData.subtype,
      location: incidentData.location,
      severity: incidentData.severity,
      affectedRoutes: incidentData.affectsRoutes?.length || 0,
      coordinates: incidentData.coordinates ? 'present' : 'missing',
      description: incidentData.description?.substring(0, 200),
      screenType: 'incidents'
    },
    supervisorInfo,
    req,
    { priority: 'high' }
  );
}

async function logCommunicationSent(supervisorInfo, communicationData, req) {
  return enhancedLogActivity(
    communicationData.type === 'email' ? 'email_sent' : 'message_sent',
    {
      messageType: communicationData.type,
      recipients: communicationData.recipients?.length || 0,
      channels: communicationData.channels,
      priority: communicationData.priority,
      messageLength: communicationData.message?.length || 0,
      templateId: communicationData.templateId,
      subject: communicationData.subject,
      screenType: 'communications'
    },
    supervisorInfo,
    req,
    { priority: 'medium' }
  );
}

async function logAdminAction(supervisorInfo, action, adminData, req) {
  return enhancedLogActivity(
    action,
    {
      targetSupervisor: adminData.targetSupervisor,
      targetSupervisorId: adminData.targetSupervisorId,
      affectedCount: adminData.affectedCount || 1,
      adminReason: adminData.reason,
      permissions: adminData.permissions,
      screenType: 'admin'
    },
    supervisorInfo,
    req,
    { immediate: true, priority: 'critical' }
  );
}

async function logSystemAction(supervisorInfo, action, details, req) {
  return enhancedLogActivity(
    action,
    {
      ...details,
      systemAction: true,
      screenType: details.screenType || 'system'
    },
    supervisorInfo,
    req,
    { priority: 'medium' }
  );
}

// Utility functions

function calculateSessionDuration(supervisorInfo) {
  // This would need to be implemented based on session start time
  // For now, return null
  return null;
}

// Analytics functions

async function getSupervisorActivityStats(supervisorId, timeRange = '24h') {
  try {
    const supabaseClient = await getSupabaseClient();
    
    if (!supabaseClient) {
      console.warn('⚠️ Supabase not available, returning empty stats');
      return { success: false, error: 'Database not available' };
    }
    
    let query = supabaseClient
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
      priorityBreakdown: {},
      hourlyDistribution: {}
    };

    data.forEach(activity => {
      // Action breakdown
      stats.activityBreakdown[activity.action] = 
        (stats.activityBreakdown[activity.action] || 0) + 1;

      // Category breakdown
      const category = categorizeAction(activity.action);
      stats.categoryBreakdown[category] = 
        (stats.categoryBreakdown[category] || 0) + 1;

      // Priority breakdown
      const priority = determinePriority(activity.action, activity.details);
      stats.priorityBreakdown[priority] = 
        (stats.priorityBreakdown[priority] || 0) + 1;

      // Hourly distribution
      const hour = new Date(activity.created_at).getHours();
      stats.hourlyDistribution[hour] = 
        (stats.hourlyDistribution[hour] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('❌ Failed to get activity stats:', error);
    return null;
  }
}

// Cleanup function for graceful shutdown
function cleanup() {
  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }
  
  // Process any remaining batch items
  if (logBatch.length > 0) {
    processBatch();
  }
}

// Graceful shutdown handling
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

export {
  enhancedLogActivity,
  logSupervisorLogin,
  logSupervisorLogout,
  logAlertDismissal,
  logRoadworkAction,
  logIncidentCreation,
  logCommunicationSent,
  logAdminAction,
  logSystemAction,
  getSupervisorActivityStats,
  categorizeAction,
  determinePriority,
  cleanup
};