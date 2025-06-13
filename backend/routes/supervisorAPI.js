// backend/routes/supervisorAPI.js
// Enhanced API Routes for Supervisor Management and Alert Dismissal

import express from 'express';
import supervisorManager from '../services/supervisorManager.js';
import messageTemplateManager from '../services/messageTemplateManager.js';
import { processEnhancedAlerts } from '../services/enhancedAlertProcessor.js';

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
    
    const result = supervisorManager.authenticateSupervisor(supervisorId, badge);
    
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
    
    const result = supervisorManager.validateSupervisorSession(sessionId);
    
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
    
    const result = supervisorManager.signOutSupervisor(sessionId);
    
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
    const supervisors = supervisorManager.getAllSupervisors();
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
    const activeSupervisors = supervisorManager.getActiveSupervisors();
    res.json({
      success: true,
      activeSupervisors,
      count: activeSupervisors.length,
      lastUpdated: new Date().toISOString()
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
    
    const activity = supervisorManager.getSupervisorActivity(supervisorId, parseInt(limit));
    
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
    
    const stats = supervisorManager.getDismissalStatistics(timeRange);
    
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
    const result = supervisorManager.authenticateSupervisor('supervisor001', 'AW001');
    
    if (result.success) {
      // Validate the session immediately
      const validation = supervisorManager.validateSupervisorSession(result.sessionId);
      
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
    const sessionResult = supervisorManager.validateSupervisorSession(sessionId);
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
    const activeSupervisors = supervisorManager.getActiveSupervisors();
    
    // Debug logging
    console.log('🔍 Sync Status Debug:');
    console.log('📊 Active supervisors from manager:', activeSupervisors.length);
    console.log('👥 Supervisor details:', activeSupervisors.map(s => ({ name: s.name, sessionStart: s.sessionStart })));
    console.log('💾 Session count:', Object.keys(supervisorManager.supervisorSessions || {}).length);
    console.log('🗂️ Actual sessions:', Object.keys(supervisorManager.supervisorSessions || {}));
    console.log('📋 Sessions object:', supervisorManager.supervisorSessions);
    
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
    const { alertId, reason, notes, timestamp } = req.body;
    
    if (!alertId || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Alert ID and reason are required'
      });
    }
    
    // Add to acknowledged alerts
    pollingState.acknowledgedAlerts.add(alertId);
    pollingState.lastUpdated = Date.now();
    
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
    const { alertId, priority, reason, timestamp } = req.body;
    
    if (!alertId || !priority || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Alert ID, priority, and reason are required'
      });
    }
    
    // Update priority override
    pollingState.priorityOverrides.set(alertId, {
      priority: priority.toUpperCase(),
      reason,
      timestamp: timestamp || Date.now()
    });
    pollingState.lastUpdated = Date.now();
    
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
    const { alertId, note, timestamp } = req.body;
    
    if (!alertId || !note) {
      return res.status(400).json({
        success: false,
        error: 'Alert ID and note are required'
      });
    }
    
    // Add supervisor note
    pollingState.supervisorNotes.set(alertId, {
      note,
      timestamp: timestamp || Date.now()
    });
    pollingState.lastUpdated = Date.now();
    
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
    const { message, priority, duration, timestamp } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
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
    const { alertId, reason, timestamp } = req.body;
    
    if (!alertId || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Alert ID and reason are required'
      });
    }
    
    // Add to dismissed from display
    pollingState.dismissedFromDisplay.add(alertId);
    pollingState.lastUpdated = Date.now();
    
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
    const { alertId, reason, timestamp } = req.body;
    
    if (!alertId || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Alert ID and reason are required'
      });
    }
    
    // Add to locked on display
    pollingState.lockedOnDisplay.add(alertId);
    pollingState.lastUpdated = Date.now();
    
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
    const { alertId, reason, timestamp } = req.body;
    
    if (!alertId || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Alert ID and reason are required'
      });
    }
    
    // Remove from locked on display
    pollingState.lockedOnDisplay.delete(alertId);
    pollingState.lastUpdated = Date.now();
    
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

export default router;
