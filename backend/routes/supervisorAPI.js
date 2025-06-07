// backend/routes/supervisorAPI.js
// Enhanced API Routes for Supervisor Management and Alert Dismissal

import express from 'express';
import supervisorManager from '../services/supervisorManager.js';
import { processEnhancedAlerts } from '../services/enhancedAlertProcessor.js';

const router = express.Router();

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
    
    const result = supervisorManager.authenticateSupervisor(supervisorId, badge);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Authentication successful',
        sessionId: result.sessionId,
        supervisor: result.supervisor
      });
    } else {
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

export default router;
