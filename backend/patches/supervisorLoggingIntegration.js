// backend/patches/supervisorLoggingIntegration.js
// Integration patch to add comprehensive supervisor logging to existing endpoints

import {
  logSupervisorLogin,
  logSupervisorLogout,
  logAlertDismissal,
  logRoadworkAction,
  logIncidentCreation,
  logCommunicationSent,
  logAdminAction,
  logSystemAction,
  enhancedLogActivity
} from '../services/enhancedSupervisorLogging.js';

/**
 * Supervisor Logging Integration Patch
 * 
 * This patch provides enhanced logging capabilities that can be easily integrated
 * into existing API endpoints without breaking functionality. It wraps common
 * supervisor actions with comprehensive logging.
 * 
 * Usage:
 * 1. Import the patch functions into your API routes
 * 2. Call the appropriate logging function after successful operations
 * 3. Existing functionality remains unchanged
 */

// Enhanced supervisor authentication wrapper
export async function enhancedSupervisorAuth(originalAuthFunction, supervisorId, badge, req, options = {}) {
  try {
    const result = await originalAuthFunction(supervisorId, badge);
    
    if (result.success) {
      // Log successful login
      await logSupervisorLogin(
        result.supervisor,
        req,
        options.loginType || 'standard'
      );
      
      console.log(`✅ Enhanced login logged for ${result.supervisor.name}`);
    }
    
    return result;
  } catch (error) {
    // Log failed login attempt
    await enhancedLogActivity(
      'supervisor_login_failed',
      {
        supervisorId,
        badge,
        error: error.message,
        loginType: options.loginType || 'standard',
        screenType: 'login'
      },
      null,
      req,
      { immediate: true, priority: 'high' }
    );
    
    throw error;
  }
}

// Enhanced supervisor logout wrapper
export async function enhancedSupervisorLogout(originalLogoutFunction, sessionId, req, options = {}) {
  try {
    const result = await originalLogoutFunction(sessionId, req);
    
    if (result.success && result.supervisor) {
      // Log successful logout
      await logSupervisorLogout(
        result.supervisor,
        req,
        options.logoutReason || 'manual'
      );
      
      console.log(`✅ Enhanced logout logged for ${result.supervisor.name}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Enhanced logout logging failed:', error);
    throw error;
  }
}

// Enhanced alert dismissal wrapper
export async function enhancedAlertDismissal(originalDismissFunction, alertId, sessionId, reason, notes, req) {
  try {
    const result = await originalDismissFunction(alertId, sessionId, reason, notes, req);
    
    if (result.success) {
      // Extract supervisor info from session validation
      const supervisorManager = await import('../services/supervisorManager.js');
      const sessionResult = await supervisorManager.default.validateSupervisorSession(sessionId);
      
      if (sessionResult.success) {
        await logAlertDismissal(
          sessionResult.supervisor,
          {
            alertId,
            reason,
            notes,
            dismissal: result.dismissal
          },
          req
        );
        
        console.log(`✅ Enhanced alert dismissal logged: ${alertId}`);
      }
    }
    
    return result;
  } catch (error) {
    console.error('❌ Enhanced alert dismissal logging failed:', error);
    throw error;
  }
}

// Enhanced roadwork action wrapper
export async function enhancedRoadworkAction(originalActionFunction, action, roadworkId, sessionId, actionData, req) {
  try {
    const result = await originalActionFunction(roadworkId, sessionId, actionData, req);
    
    if (result.success) {
      // Extract supervisor info from session validation
      const supervisorManager = await import('../services/supervisorManager.js');
      const sessionResult = await supervisorManager.default.validateSupervisorSession(sessionId);
      
      if (sessionResult.success) {
        await logRoadworkAction(
          sessionResult.supervisor,
          action,
          {
            roadworkId,
            ...actionData,
            result: result.data
          },
          req
        );
        
        console.log(`✅ Enhanced roadwork action logged: ${action} - ${roadworkId}`);
      }
    }
    
    return result;
  } catch (error) {
    console.error('❌ Enhanced roadwork action logging failed:', error);
    throw error;
  }
}

// Enhanced incident creation wrapper
export async function enhancedIncidentCreation(originalCreateFunction, incidentData, req) {
  try {
    const result = await originalCreateFunction(incidentData, req);
    
    if (result.success || result.incident) {
      // Extract supervisor info if available
      let supervisorInfo = null;
      if (incidentData.createdBy) {
        const supervisorManager = await import('../services/supervisorManager.js');
        const allSupervisors = await supervisorManager.default.getAllSupervisors();
        supervisorInfo = allSupervisors.find(s => s.id === incidentData.createdBy || s.name === incidentData.createdBy);
      }
      
      await logIncidentCreation(
        supervisorInfo,
        result.incident || incidentData,
        req
      );
      
      console.log(`✅ Enhanced incident creation logged: ${result.incident?.id}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Enhanced incident creation logging failed:', error);
    throw error;
  }
}

// Enhanced communication logging wrapper
export async function enhancedCommunicationLogging(supervisorInfo, communicationType, communicationData, req) {
  try {
    await logCommunicationSent(
      supervisorInfo,
      {
        type: communicationType,
        ...communicationData
      },
      req
    );
    
    console.log(`✅ Enhanced communication logged: ${communicationType}`);
  } catch (error) {
    console.error('❌ Enhanced communication logging failed:', error);
  }
}

// Enhanced admin action wrapper
export async function enhancedAdminAction(originalAdminFunction, adminAction, sessionId, adminData, req) {
  try {
    const result = await originalAdminFunction(sessionId, adminData, req);
    
    if (result.success) {
      await logAdminAction(
        result.adminSupervisor,
        adminAction,
        {
          ...adminData,
          result: result
        },
        req
      );
      
      console.log(`✅ Enhanced admin action logged: ${adminAction}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Enhanced admin action logging failed:', error);
    throw error;
  }
}

// Enhanced system navigation logging
export async function logScreenNavigation(supervisorInfo, screenType, additionalData = {}, req = null) {
  try {
    await enhancedLogActivity(
      'screen_navigation',
      {
        screenType,
        previousScreen: additionalData.previousScreen,
        navigationTime: new Date().toISOString(),
        ...additionalData
      },
      supervisorInfo,
      req,
      { priority: 'low' }
    );
  } catch (error) {
    console.error('❌ Screen navigation logging failed:', error);
  }
}

// Enhanced settings update logging
export async function logSettingsUpdate(supervisorInfo, settingType, oldValue, newValue, req = null) {
  try {
    await enhancedLogActivity(
      'settings_updated',
      {
        settingType,
        oldValue: typeof oldValue === 'string' ? oldValue : JSON.stringify(oldValue),
        newValue: typeof newValue === 'string' ? newValue : JSON.stringify(newValue),
        screenType: 'settings'
      },
      supervisorInfo,
      req,
      { priority: 'medium' }
    );
  } catch (error) {
    console.error('❌ Settings update logging failed:', error);
  }
}

// Enhanced data access logging (for sensitive operations)
export async function logDataAccess(supervisorInfo, dataType, accessType, filters = {}, req = null) {
  try {
    await enhancedLogActivity(
      'data_accessed',
      {
        dataType,
        accessType, // 'view', 'export', 'download'
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        recordCount: filters.recordCount || 'unknown',
        screenType: 'data'
      },
      supervisorInfo,
      req,
      { priority: 'medium' }
    );
  } catch (error) {
    console.error('❌ Data access logging failed:', error);
  }
}

// Enhanced coordination logging
export async function logSupervisorCoordination(supervisorInfo, coordinationType, coordinationData, req = null) {
  try {
    await enhancedLogActivity(
      'supervisor_coordination',
      {
        coordinationType, // 'message', 'handover', 'escalation'
        targetSupervisor: coordinationData.targetSupervisor,
        message: coordinationData.message?.substring(0, 200), // Limit message length
        priority: coordinationData.priority,
        urgent: coordinationData.urgent || false,
        screenType: 'coordination'
      },
      supervisorInfo,
      req,
      { priority: 'medium' }
    );
  } catch (error) {
    console.error('❌ Supervisor coordination logging failed:', error);
  }
}

// Enhanced error logging for supervisor actions
export async function logSupervisorError(supervisorInfo, errorType, errorData, req = null) {
  try {
    await enhancedLogActivity(
      'supervisor_error',
      {
        errorType,
        errorMessage: errorData.message,
        errorCode: errorData.code,
        stackTrace: errorData.stack?.substring(0, 500), // Limit stack trace
        endpoint: req?.path,
        method: req?.method,
        screenType: 'error'
      },
      supervisorInfo,
      req,
      { immediate: true, priority: 'high' }
    );
  } catch (error) {
    console.error('❌ Supervisor error logging failed:', error);
  }
}

// Batch logging helper for multiple actions
export async function batchLogSupervisorActions(actions) {
  try {
    for (const action of actions) {
      await enhancedLogActivity(
        action.actionType,
        action.details,
        action.supervisorInfo,
        action.req,
        { skipBatch: false }
      );
    }
    
    console.log(`✅ Batch logged ${actions.length} supervisor actions`);
  } catch (error) {
    console.error('❌ Batch supervisor action logging failed:', error);
  }
}

// Helper function to extract supervisor info from session
export async function getSupervisorFromSession(sessionId) {
  try {
    const supervisorManager = await import('../services/supervisorManager.js');
    const sessionResult = await supervisorManager.default.validateSupervisorSession(sessionId);
    
    if (sessionResult.success) {
      return sessionResult.supervisor;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Failed to get supervisor from session:', error);
    return null;
  }
}

// Integration helper for existing middleware
export function createLoggingMiddleware(actionType, options = {}) {
  return async (req, res, next) => {
    const startTime = Date.now();
    
    // Store original send method
    const originalSend = res.send;
    
    // Override send method to capture response
    res.send = function(body) {
      const responseTime = Date.now() - startTime;
      
      // Log action asynchronously after response
      setImmediate(async () => {
        try {
          const supervisorInfo = await getSupervisorFromSession(
            req.body?.sessionId || req.query?.sessionId
          );
          
          if (supervisorInfo) {
            await enhancedLogActivity(
              actionType,
              {
                endpoint: `${req.method} ${req.path}`,
                responseTime,
                statusCode: res.statusCode,
                success: res.statusCode < 400,
                ...options.additionalDetails
              },
              supervisorInfo,
              req,
              options
            );
          }
        } catch (error) {
          console.warn('⚠️ Middleware logging failed:', error);
        }
      });
      
      return originalSend.call(this, body);
    };
    
    next();
  };
}

export default {
  enhancedSupervisorAuth,
  enhancedSupervisorLogout,
  enhancedAlertDismissal,
  enhancedRoadworkAction,
  enhancedIncidentCreation,
  enhancedCommunicationLogging,
  enhancedAdminAction,
  logScreenNavigation,
  logSettingsUpdate,
  logDataAccess,
  logSupervisorCoordination,
  logSupervisorError,
  batchLogSupervisorActions,
  getSupervisorFromSession,
  createLoggingMiddleware
};