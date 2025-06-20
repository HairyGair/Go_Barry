// backend/routes/supervisorAPI.js
// Enhanced API Routes for Supervisor Management and Alert Dismissal

import express from 'express';
import supervisorManager from '../services/supervisorManager.js';
import messageTemplateManager from '../services/messageTemplateManager.js';
import { processEnhancedAlerts } from '../services/enhancedAlertProcessor.js';
import supervisorActivityLogger from '../services/supervisorActivityLogger.js';

const router = express.Router();

// Middleware to update session activity on API calls
router.use((req, res, next) => {
  // Update activity for requests with sessionId in body or query
  const sessionId = req.body?.sessionId || req.query?.sessionId;
  if (sessionId) {
    const updated = supervisorManager.updateSessionActivity(sessionId);
    if (updated) {
      console.log(`🔄 Activity updated for session: ${sessionId}`);
    }
  }
  next();
});

// Supervisor authentication (both paths for compatibility)
router.post('/login', async (req, res) => {
  try {
    const { supervisorId, badge } = req.body;
    
    if (!supervisorId || !badge) {
      return res.status(400).json({
        success: false,
        error: 'Supervisor ID and badge are required'
      });
    }
    
    console.log(`🔐 Auth attempt: ${supervisorId} with badge ${badge}`);
    
    const result = await supervisorManager.authenticateSupervisor(supervisorId, badge);
    
    if (result.success) {
      // Force session into polling state for immediate sync
      const sessionInfo = {
        supervisorId: result.supervisor.id,
        supervisorName: result.supervisor.name,
        startTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        active: true
      };
      
      // Add to polling state for display sync
      console.log(`✅ Adding supervisor to active list: ${result.supervisor.name}`);
      console.log(`📤 Sending response:`, {
        success: true,
        sessionId: result.sessionId,
        supervisorName: result.supervisor?.name,
        supervisorRole: result.supervisor?.role
      });
      
      // Log supervisor login activity
      await supervisorActivityLogger.logLogin(result.supervisor.badge, result.supervisor.name);
      
      res.json({
        success: true,
        message: 'Authentication successful',
        sessionId: result.sessionId,
        supervisor: result.supervisor
      });
    } else {
      console.log(`❌ Auth failed: ${result.error}`);
      res.status(401).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Supervisor auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
});

// Supervisor authentication
router.post('/auth/login', async (req, res) => {
  try {
    const { supervisorId, badge } = req.body;
    
    if (!supervisorId || !badge) {
      return res.status(400).json({
        success: false,
        error: 'Supervisor ID and badge are required'
      });
    }
    
    console.log(`🔐 Auth attempt: ${supervisorId} with badge ${badge}`);
    
    const result = await supervisorManager.authenticateSupervisor(supervisorId, badge);
    
    if (result.success) {
      // Force session into polling state for immediate sync
      const sessionInfo = {
        supervisorId: result.supervisor.id,
        supervisorName: result.supervisor.name,
        startTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        active: true
      };
      
      // Add to polling state for display sync
      console.log(`✅ Adding supervisor to active list: ${result.supervisor.name}`);
      
      // Log supervisor login activity
      await supervisorActivityLogger.logLogin(result.supervisor.badge, result.supervisor.name);
      
      res.json({
        success: true,
        message: 'Authentication successful',
        sessionId: result.sessionId,
        supervisor: result.supervisor
      });
    } else {
      console.log(`❌ Auth failed: ${result.error}`);
      res.status(401).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Supervisor auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
});

// Validate supervisor session
router.post('/auth/validate', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }
    
    const result = await supervisorManager.validateSupervisorSession(sessionId);
    
    if (result.success) {
      res.json({
        success: true,
        supervisor: result.supervisor
      });
    } else {
      res.status(401).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Session validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Session validation failed'
    });
  }
});

// Supervisor logout
router.post('/auth/logout', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }
    
    const result = await supervisorManager.signOutSupervisor(sessionId);
    
    // Log supervisor logout activity if successful
    if (result.success && result.supervisor) {
      await supervisorActivityLogger.logLogout(result.supervisor.badge, result.supervisor.name);
    }
    
    res.json({
      success: result.success,
      message: result.success ? 'Logged out successfully' : 'Logout failed'
    });
  } catch (error) {
    console.error('❌ Supervisor logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

// Dismiss alert
router.post('/alerts/dismiss', async (req, res) => {
  try {
    const { alertId, sessionId, reason, notes } = req.body;
    
    if (!alertId || !sessionId || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Alert ID, session ID, and reason are required'
      });
    }
    
    const result = await supervisorManager.dismissAlert(alertId, sessionId, reason, notes);
    
    if (result.success) {
      // Log alert dismissal activity
      const sessionValidation = await supervisorManager.validateSupervisorSession(sessionId);
      if (sessionValidation.success) {
        await supervisorActivityLogger.logAlertDismissal(
          sessionValidation.supervisor.badge,
          sessionValidation.supervisor.name,
          alertId,
          reason,
          result.dismissal?.location
        );
      }
      
      res.json({
        success: true,
        message: 'Alert dismissed successfully',
        dismissal: result.dismissal
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Alert dismissal error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to dismiss alert'
    });
  }
});

// Restore dismissed alert
router.post('/alerts/restore', async (req, res) => {
  try {
    const { alertId, sessionId, reason } = req.body;
    
    if (!alertId || !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Alert ID and session ID are required'
      });
    }
    
    const result = await supervisorManager.restoreAlert(alertId, sessionId, reason);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Alert restored successfully',
        restoration: result.restoration
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Alert restoration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to restore alert'
    });
  }
});

// Get all supervisors (for admin)
router.get('/supervisors', async (req, res) => {
  try {
    const supervisors = await supervisorManager.getAllSupervisors();
    res.json({
      success: true,
      supervisors
    });
  } catch (error) {
    console.error('❌ Get supervisors error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supervisors'
    });
  }
});

// Get active supervisors (for display screen)
router.get('/active', async (req, res) => {
  try {
    console.log('🔍 Active supervisors endpoint called');
    
    // Now async - await the result
    const activeSupervisors = await supervisorManager.getActiveSupervisors();
    
    res.json({
      success: true,
      activeSupervisors,
      count: activeSupervisors.length,
      lastUpdated: new Date().toISOString(),
      source: 'supabase-backed'
    });
  } catch (error) {
    console.error('❌ Get active supervisors error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active supervisors',
      activeSupervisors: [],
      count: 0
    });
  }
});

// Get supervisor activity log
router.get('/supervisors/:supervisorId/activity', async (req, res) => {
  try {
    const { supervisorId } = req.params;
    const { limit = 50 } = req.query;
    
    const activity = await supervisorManager.getSupervisorActivity(supervisorId, parseInt(limit));
    
    res.json({
      success: true,
      supervisorId,
      activity
    });
  } catch (error) {
    console.error('❌ Get supervisor activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supervisor activity'
    });
  }
});

// Get dismissal statistics
router.get('/statistics/dismissals', async (req, res) => {
  try {
    const { timeRange = 'today' } = req.query;
    
    const stats = await supervisorManager.getDismissalStatistics(timeRange);
    
    res.json({
      success: true,
      timeRange,
      statistics: stats
    });
  } catch (error) {
    console.error('❌ Get dismissal statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dismissal statistics'
    });
  }
});

// Test endpoint to verify session storage
router.get('/test/session-storage', async (req, res) => {
  try {
    console.log('🧪 Testing session storage...');
    
    // Create a test session directly
    const testSessionId = `test_session_${Date.now()}`;
    supervisorManager.supervisorSessions[testSessionId] = {
      supervisorId: 'test_supervisor',
      supervisorName: 'Test Supervisor',
      supervisorBadge: 'TEST001',
      startTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      active: true
    };
    
    console.log('💾 After adding test session:');
    console.log('- Session keys:', Object.keys(supervisorManager.supervisorSessions));
    console.log('- Test session exists?', testSessionId in supervisorManager.supervisorSessions);
    
    // Now check active supervisors
    const active = supervisorManager.getActiveSupervisors();
    console.log('👥 Active supervisors:', active);
    
    res.json({
      success: true,
      testSessionId,
      sessionExists: testSessionId in supervisorManager.supervisorSessions,
      totalSessions: Object.keys(supervisorManager.supervisorSessions).length,
      sessionKeys: Object.keys(supervisorManager.supervisorSessions),
      activeSupervisors: active,
      testSession: supervisorManager.supervisorSessions[testSessionId]
    });
  } catch (error) {
    console.error('❌ Test error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== SUPERVISOR ACTIVITY LOGGING =====

// Get recent supervisor activities (for Display Screen)
router.get('/activity/recent', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const activities = await supervisorActivityLogger.getRecentActivities(parseInt(limit));
    
    res.json({
      success: true,
      activities,
      count: activities.length,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Get recent activities error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent activities',
      activities: []
    });
  }
});

// Log supervisor activity (internal use)
router.post('/activity/log', async (req, res) => {
  try {
    const { supervisorBadge, action, details } = req.body;
    
    if (!supervisorBadge || !action) {
      return res.status(400).json({
        success: false,
        error: 'Supervisor badge and action are required'
      });
    }
    
    const result = await supervisorActivityLogger.logActivity(supervisorBadge, action, details);
    
    res.json({
      success: result.success,
      message: result.success ? 'Activity logged successfully' : 'Failed to log activity',
      activity: result.activity || null,
      error: result.error || null
    });
  } catch (error) {
    console.error('❌ Log activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log activity'
    });
  }
});

// ===== ADMIN ENDPOINTS =====

// Log out all supervisors (admin only)
router.post('/admin/logout-all', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }
    
    const result = await supervisorManager.logoutAllSupervisors(sessionId);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        loggedOutCount: result.loggedOutCount,
        adminSupervisor: result.adminSupervisor,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(403).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Admin logout all error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to logout all supervisors'
    });
  }
});

// Add new supervisor (admin only)
router.post('/admin/add-supervisor', async (req, res) => {
  try {
    const { sessionId, name, role, badge, shift, permissions } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }
    
    if (!name || !role || !badge) {
      return res.status(400).json({
        success: false,
        error: 'Name, role, and badge are required'
      });
    }
    
    const supervisorData = {
      name,
      role,
      badge,
      shift: shift || 'Day',
      permissions: permissions || ['view-alerts', 'dismiss-alerts']
    };
    
    const result = await supervisorManager.addSupervisor(sessionId, supervisorData);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        supervisor: result.supervisor,
        adminSupervisor: result.adminSupervisor,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Add supervisor error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add supervisor'
    });
  }
});

// Delete supervisor (admin only)
router.delete('/admin/delete-supervisor/:supervisorId', async (req, res) => {
  try {
    const { supervisorId: supervisorIdToDelete } = req.params;
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }
    
    if (!supervisorIdToDelete) {
      return res.status(400).json({
        success: false,
        error: 'Supervisor ID is required'
      });
    }
    
    const result = await supervisorManager.deleteSupervisor(sessionId, supervisorIdToDelete);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        deletedSupervisor: result.deletedSupervisor,
        adminSupervisor: result.adminSupervisor,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Delete supervisor error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete supervisor'
    });
  }
});

// Check admin permissions (for frontend to show/hide admin features)
router.get('/admin/check-permissions', async (req, res) => {
  try {
    const { sessionId } = req.query;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }
    
    // Validate session
    const sessionValidation = await supervisorManager.validateSupervisorSession(sessionId);
    if (!sessionValidation.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid session'
      });
    }
    
    const hasAdmin = await supervisorManager.hasAdminPermissions(sessionValidation.supervisor.id);
    
    res.json({
      success: true,
      hasAdminPermissions: hasAdmin,
      supervisor: sessionValidation.supervisor,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Check admin permissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check permissions'
    });
  }
});

// Get session timeout configuration and status
router.get('/timeout-info', async (req, res) => {
  try {
    const timeoutInfo = supervisorManager.getSessionTimeoutInfo();
    
    res.json({
      success: true,
      ...timeoutInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Get timeout info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get timeout info'
    });
  }
});

// Manual cleanup trigger (for testing)
router.post('/cleanup-sessions', async (req, res) => {
  try {
    const beforeCount = Object.values(supervisorManager.supervisorSessions).filter(s => s.active).length;
    
    supervisorManager.cleanupInactiveSessions();
    
    const afterCount = Object.values(supervisorManager.supervisorSessions).filter(s => s.active).length;
    const cleanedCount = beforeCount - afterCount;
    
    res.json({
      success: true,
      message: 'Session cleanup completed',
      sessionsBeforeCleanup: beforeCount,
      sessionsAfterCleanup: afterCount,
      sessionsCleaned: cleanedCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Manual cleanup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform cleanup'
    });
  }
});

// Debug endpoint to check active sessions
router.get('/debug/sessions', async (req, res) => {
  try {
    // Get all session IDs and their status
    const sessions = Object.entries(supervisorManager.supervisorSessions || {}).map(([id, session]) => {
      const now = Date.now();
      const lastActivity = new Date(session.lastActivity).getTime();
      const timeSinceActivity = now - lastActivity;
      
      return {
        sessionId: id,
        supervisorId: session.supervisorId,
        supervisorName: session.supervisorName,
        active: session.active,
        startTime: session.startTime,
        lastActivity: session.lastActivity,
        minutesSinceActivity: Math.round(timeSinceActivity / 1000 / 60),
        willTimeoutAt: new Date(lastActivity + supervisorManager.getSessionTimeoutInfo().timeoutMs).toISOString(),
        endTime: session.endTime,
        timeoutReason: session.timeoutReason,
        signoutReason: session.signoutReason
      };
    });
    
    res.json({
      success: true,
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.active).length,
      sessions: sessions,
      timeoutConfig: supervisorManager.getSessionTimeoutInfo(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Debug sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sessions debug info'
    });
  }
});

// Test endpoint to create a test session
router.post('/debug/test-session', async (req, res) => {
  try {
    // Create a test session for Alex Woodcock
    const result = await supervisorManager.authenticateSupervisor('supervisor001', 'AW001');
    
    if (result.success) {
      // Validate the session immediately
      const validation = await supervisorManager.validateSupervisorSession(result.sessionId);
      
      res.json({
        success: true,
        message: 'Test session created and validated',
        sessionId: result.sessionId,
        supervisor: result.supervisor,
        validationResult: validation,
        activeSessions: Object.keys(supervisorManager.supervisorSessions).length
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Test session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create test session'
    });
  }
});

// Get enhanced alerts (filtered by dismissed alerts)
router.get('/alerts/enhanced', async (req, res) => {
  try {
    // This would integrate with your existing alert fetching logic
    // For now, return a placeholder response
    const sampleAlerts = [
      {
        id: 'enhanced_001',
        type: 'incident',
        title: 'Vehicle Breakdown - A1 Northbound',
        description: 'Lane 1 blocked due to vehicle breakdown between J65 and J66',
        location: 'A1 Northbound, Birtley Junction 65',
        coordinates: { lat: 54.9158, lng: -1.5721 },
        severity: 'High',
        status: 'red',
        affectsRoutes: ['21', 'X21', '25', '28'],
        source: 'national_highways',
        lastUpdated: new Date().toISOString()
      }
    ];
    
    const enhancedAlerts = await processEnhancedAlerts(sampleAlerts);
    
    res.json({
      success: true,
      alerts: enhancedAlerts,
      metadata: {
        totalAlerts: enhancedAlerts.length,
        enhancedCount: enhancedAlerts.filter(a => a.processed?.locationEnhanced).length,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Enhanced alerts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch enhanced alerts'
    });
  }
});

// ===== MESSAGE TEMPLATE ROUTES =====

// Get all message templates
router.get('/templates', async (req, res) => {
  try {
    const { category, priority, autoTrigger } = req.query;
    
    const filters = {};
    if (category) filters.category = category;
    if (priority) filters.priority = priority;
    if (autoTrigger !== undefined) filters.autoTrigger = autoTrigger === 'true';
    
    const result = messageTemplateManager.getTemplates(filters);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('❌ Get templates error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch templates'
    });
  }
});

// Send message using template
router.post('/templates/:templateId/send', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { variables, sessionId, channels, recipients } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }
    
    // Validate supervisor session
    const sessionResult = await supervisorManager.validateSupervisorSession(sessionId);
    if (!sessionResult.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid session'
      });
    }
    
    const supervisorInfo = {
      supervisorId: sessionResult.supervisor.id,
      supervisorName: sessionResult.supervisor.name,
      sessionId
    };
    
    const options = {
      channels: channels || ['display', 'web'],
      recipients: recipients || 'all_displays',
      autoGenerated: false
    };
    
    const result = await messageTemplateManager.sendTemplateMessage(
      templateId,
      variables,
      supervisorInfo,
      options
    );
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Template message sent successfully',
        messageId: result.messageId,
        content: result.processedContent
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Send template message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send template message'
    });
  }
});

// Get template suggestions for alert
router.post('/templates/suggest', async (req, res) => {
  try {
    const { alertData } = req.body;
    
    const result = messageTemplateManager.suggestTemplates(alertData);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('❌ Get template suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get template suggestions'
    });
  }
});

// ===== POLLING-BASED SYNC ENDPOINTS =====

// In-memory storage for polling-based supervisor sync
let pollingState = {
  acknowledgedAlerts: new Set(),
  priorityOverrides: new Map(),
  supervisorNotes: new Map(),
  customMessages: [],
  dismissedFromDisplay: new Set(),
  lockedOnDisplay: new Set(),
  lastUpdated: Date.now()
};

// Get current sync status for polling
router.get('/sync-status', async (req, res) => {
  try {
    const activeSupervisors = await supervisorManager.getActiveSupervisors();
    
    // Debug logging
    console.log('🔍 Sync Status Debug:');
    console.log('📊 Active supervisors from manager:', activeSupervisors.length);
    console.log('👥 Supervisor details:', activeSupervisors.map(s => ({ name: s.name, sessionStart: s.sessionStart })));
    
    res.json({
      success: true,
      acknowledgedAlerts: Array.from(pollingState.acknowledgedAlerts),
      priorityOverrides: Object.fromEntries(pollingState.priorityOverrides),
      supervisorNotes: Object.fromEntries(pollingState.supervisorNotes),
      customMessages: pollingState.customMessages,
      dismissedFromDisplay: Array.from(pollingState.dismissedFromDisplay),
      lockedOnDisplay: Array.from(pollingState.lockedOnDisplay),
      connectedSupervisors: activeSupervisors.length,
      activeSupervisors: activeSupervisors,
      lastUpdated: pollingState.lastUpdated
    });
  } catch (error) {
    console.error('❌ Sync status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sync status'
    });
  }
});

// Acknowledge alert
router.post('/acknowledge-alert', async (req, res) => {
  try {
    const { alertId, sessionId, reason, notes, timestamp } = req.body;

    if (!alertId || !sessionId || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Alert ID, session ID, and reason are required'
      });
    }

    // Validate supervisor session
    const sessionResult = await supervisorManager.validateSupervisorSession(sessionId);
    if (!sessionResult.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid session'
      });
    }

    // Add to acknowledged alerts
    pollingState.acknowledgedAlerts.add(alertId);
    pollingState.lastUpdated = Date.now();

    // Log system action
    await supervisorActivityLogger.logSystemAction(
      sessionResult.supervisor.badge,
      sessionResult.supervisor.name,
      'acknowledge-alert',
      {
        alert_id: alertId,
        reason,
        notes,
        timestamp: timestamp || pollingState.lastUpdated
      }
    );

    console.log(`✅ Alert ${alertId} acknowledged: ${reason}`);

    res.json({
      success: true,
      message: 'Alert acknowledged successfully',
      alertId,
      timestamp: pollingState.lastUpdated
    });
  } catch (error) {
    console.error('❌ Acknowledge alert error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to acknowledge alert'
    });
  }
});

// Update alert priority
router.post('/update-priority', async (req, res) => {
  try {
    const { alertId, sessionId, priority, reason, timestamp } = req.body;

    if (!alertId || !sessionId || !priority || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Alert ID, session ID, priority, and reason are required'
      });
    }

    // Validate supervisor session
    const sessionResult = await supervisorManager.validateSupervisorSession(sessionId);
    if (!sessionResult.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid session'
      });
    }

    // Update priority override
    pollingState.priorityOverrides.set(alertId, {
      priority: priority.toUpperCase(),
      reason,
      timestamp: timestamp || Date.now()
    });
    pollingState.lastUpdated = Date.now();

    // Log system action
    await supervisorActivityLogger.logSystemAction(
      sessionResult.supervisor.badge,
      sessionResult.supervisor.name,
      'update-priority',
      {
        alert_id: alertId,
        priority: priority,
        reason,
        timestamp: timestamp || pollingState.lastUpdated
      }
    );

    console.log(`🎯 Alert ${alertId} priority updated to ${priority}: ${reason}`);

    res.json({
      success: true,
      message: 'Priority updated successfully',
      alertId,
      priority,
      timestamp: pollingState.lastUpdated
    });
  } catch (error) {
    console.error('❌ Update priority error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update priority'
    });
  }
});

// Add note to alert
router.post('/add-note', async (req, res) => {
  try {
    const { alertId, sessionId, note, timestamp } = req.body;

    if (!alertId || !sessionId || !note) {
      return res.status(400).json({
        success: false,
        error: 'Alert ID, session ID, and note are required'
      });
    }

    // Validate supervisor session
    const sessionResult = await supervisorManager.validateSupervisorSession(sessionId);
    if (!sessionResult.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid session'
      });
    }

    // Add supervisor note
    pollingState.supervisorNotes.set(alertId, {
      note,
      timestamp: timestamp || Date.now()
    });
    pollingState.lastUpdated = Date.now();

    // Log system action
    await supervisorActivityLogger.logSystemAction(
      sessionResult.supervisor.badge,
      sessionResult.supervisor.name,
      'add-note',
      {
        alert_id: alertId,
        note,
        timestamp: timestamp || pollingState.lastUpdated
      }
    );

    console.log(`📝 Note added to alert ${alertId}: ${note}`);

    res.json({
      success: true,
      message: 'Note added successfully',
      alertId,
      note,
      timestamp: pollingState.lastUpdated
    });
  } catch (error) {
    console.error('❌ Add note error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add note'
    });
  }
});

// Broadcast message
router.post('/broadcast-message', async (req, res) => {
  try {
    const { message, sessionId, priority, duration, timestamp } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Message and session ID are required'
      });
    }

    // Validate supervisor session
    const sessionResult = await supervisorManager.validateSupervisorSession(sessionId);
    if (!sessionResult.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid session'
      });
    }

    // Add custom message
    const messageObj = {
      id: `msg_${Date.now()}`,
      message,
      priority: priority || 'info',
      duration: duration || 30000,
      timestamp: timestamp || Date.now()
    };

    pollingState.customMessages.push(messageObj);
    pollingState.lastUpdated = Date.now();

    // Log system action
    await supervisorActivityLogger.logSystemAction(
      sessionResult.supervisor.badge,
      sessionResult.supervisor.name,
      'broadcast-message',
      {
        message,
        priority: priority || 'info',
        duration: duration || 30000,
        timestamp: timestamp || pollingState.lastUpdated
      }
    );

    // Auto-remove message after duration
    setTimeout(() => {
      pollingState.customMessages = pollingState.customMessages.filter(m => m.id !== messageObj.id);
      pollingState.lastUpdated = Date.now();
    }, messageObj.duration);

    console.log(`📢 Message broadcast: ${message} (${priority})`);

    res.json({
      success: true,
      message: 'Message broadcast successfully',
      messageId: messageObj.id,
      timestamp: pollingState.lastUpdated
    });
  } catch (error) {
    console.error('❌ Broadcast message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to broadcast message'
    });
  }
});

// Dismiss alert from display
router.post('/dismiss-from-display', async (req, res) => {
  try {
    const { alertId, sessionId, reason, timestamp } = req.body;

    if (!alertId || !sessionId || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Alert ID, session ID, and reason are required'
      });
    }

    // Validate supervisor session
    const sessionResult = await supervisorManager.validateSupervisorSession(sessionId);
    if (!sessionResult.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid session'
      });
    }

    // Add to dismissed from display
    pollingState.dismissedFromDisplay.add(alertId);
    pollingState.lastUpdated = Date.now();

    // Log system action
    await supervisorActivityLogger.logSystemAction(
      sessionResult.supervisor.badge,
      sessionResult.supervisor.name,
      'dismiss-from-display',
      {
        alert_id: alertId,
        reason,
        timestamp: timestamp || pollingState.lastUpdated
      }
    );

    console.log(`👁️‍🗨️ Alert ${alertId} dismissed from display: ${reason}`);

    res.json({
      success: true,
      message: 'Alert dismissed from display successfully',
      alertId,
      timestamp: pollingState.lastUpdated
    });
  } catch (error) {
    console.error('❌ Dismiss from display error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to dismiss from display'
    });
  }
});

// Lock alert on display
router.post('/lock-on-display', async (req, res) => {
  try {
    const { alertId, sessionId, reason, timestamp } = req.body;

    if (!alertId || !sessionId || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Alert ID, session ID, and reason are required'
      });
    }

    // Validate supervisor session
    const sessionResult = await supervisorManager.validateSupervisorSession(sessionId);
    if (!sessionResult.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid session'
      });
    }

    // Add to locked on display
    pollingState.lockedOnDisplay.add(alertId);
    pollingState.lastUpdated = Date.now();

    // Log system action
    await supervisorActivityLogger.logSystemAction(
      sessionResult.supervisor.badge,
      sessionResult.supervisor.name,
      'lock-on-display',
      {
        alert_id: alertId,
        reason,
        timestamp: timestamp || pollingState.lastUpdated
      }
    );

    console.log(`🔒 Alert ${alertId} locked on display: ${reason}`);

    res.json({
      success: true,
      message: 'Alert locked on display successfully',
      alertId,
      timestamp: pollingState.lastUpdated
    });
  } catch (error) {
    console.error('❌ Lock on display error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to lock on display'
    });
  }
});

// Unlock alert from display
router.post('/unlock-from-display', async (req, res) => {
  try {
    const { alertId, sessionId, reason, timestamp } = req.body;

    if (!alertId || !sessionId || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Alert ID, session ID, and reason are required'
      });
    }

    // Validate supervisor session
    const sessionResult = await supervisorManager.validateSupervisorSession(sessionId);
    if (!sessionResult.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid session'
      });
    }

    // Remove from locked on display
    pollingState.lockedOnDisplay.delete(alertId);
    pollingState.lastUpdated = Date.now();

    // Log system action
    await supervisorActivityLogger.logSystemAction(
      sessionResult.supervisor.badge,
      sessionResult.supervisor.name,
      'unlock-from-display',
      {
        alert_id: alertId,
        reason,
        timestamp: timestamp || pollingState.lastUpdated
      }
    );

    console.log(`🔓 Alert ${alertId} unlocked from display: ${reason}`);

    res.json({
      success: true,
      message: 'Alert unlocked from display successfully',
      alertId,
      timestamp: pollingState.lastUpdated
    });
  } catch (error) {
    console.error('❌ Unlock from display error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unlock from display'
    });
  }
});

// Clear all polling state (for testing)
router.post('/clear-state', async (req, res) => {
  try {
    pollingState = {
      acknowledgedAlerts: new Set(),
      priorityOverrides: new Map(),
      supervisorNotes: new Map(),
      customMessages: [],
      dismissedFromDisplay: new Set(),
      lockedOnDisplay: new Set(),
      lastUpdated: Date.now()
    };
    
    console.log('🧹 Polling state cleared');
    
    res.json({
      success: true,
      message: 'Polling state cleared successfully',
      timestamp: pollingState.lastUpdated
    });
  } catch (error) {
    console.error('❌ Clear state error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear state'
    });
  }
});

// Validate supervisor by ID (for roadwork creation)
router.post('/validate', async (req, res) => {
  try {
    const { id } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Supervisor ID is required'
      });
    }
    
    const result = await supervisorManager.validateSupervisorById(id);
    
    if (result.success) {
      res.json({
        success: true,
        supervisor: result.supervisor
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Supervisor validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Validation failed'
    });
  }
});

// Log duty start
router.post('/log-duty', async (req, res) => {
  try {
    const { sessionId, dutyNumber, dutyName } = req.body;
    
    if (!sessionId || !dutyNumber) {
      return res.status(400).json({
        success: false,
        error: 'Session ID and duty number are required'
      });
    }
    
    // Validate supervisor session
    const sessionResult = await supervisorManager.validateSupervisorSession(sessionId);
    if (!sessionResult.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid session'
      });
    }
    
    // Log duty start activity
    await supervisorActivityLogger.logDutyStart(
      sessionResult.supervisor.badge,
      sessionResult.supervisor.name,
      dutyNumber
    );
    
    console.log(`🚀 Duty ${dutyNumber} started by ${sessionResult.supervisor.name}`);
    
    res.json({
      success: true,
      message: 'Duty logged successfully',
      supervisor: sessionResult.supervisor.name,
      duty: dutyName || dutyNumber
    });
  } catch (error) {
    console.error('❌ Log duty error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log duty'
    });
  }
});

export default router;