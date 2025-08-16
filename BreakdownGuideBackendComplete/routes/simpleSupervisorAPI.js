// Simple supervisor API routes using file-based tracking
import express from 'express';
import simpleSupervisorTracker from '../services/simpleSupervisorTracker.js';

const router = express.Router();

// Login
router.post('/simple/login', async (req, res) => {
  try {
    const { supervisorId, badge } = req.body;
    
    if (!supervisorId || !badge) {
      return res.status(400).json({
        success: false,
        error: 'Supervisor ID and badge are required'
      });
    }
    
    const result = await simpleSupervisorTracker.loginSupervisor(supervisorId, badge);
    
    if (result.success) {
      console.log(`✅ Simple login successful for ${result.supervisor.name}`);
      res.json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    console.error('❌ Simple login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// Get active supervisors
router.get('/simple/active', async (req, res) => {
  try {
    const activeSupervisors = await simpleSupervisorTracker.getActiveSupervisors();
    
    res.json({
      success: true,
      activeSupervisors,
      count: activeSupervisors.length,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Get active error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get active supervisors',
      activeSupervisors: [],
      count: 0
    });
  }
});

// Sync status (used by polling)
router.get('/simple/sync-status', async (req, res) => {
  try {
    const activeSupervisors = await simpleSupervisorTracker.getActiveSupervisors();
    
    res.json({
      success: true,
      connectedSupervisors: activeSupervisors.length,
      activeSupervisors,
      lastUpdated: Date.now()
    });
  } catch (error) {
    console.error('❌ Sync status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sync status'
    });
  }
});

// Logout
router.post('/simple/logout', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }
    
    const result = await simpleSupervisorTracker.logoutSupervisor(sessionId);
    res.json(result);
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

// Validate session
router.post('/simple/validate', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }
    
    const result = await simpleSupervisorTracker.validateSession(sessionId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    console.error('❌ Validate error:', error);
    res.status(500).json({
      success: false,
      error: 'Validation failed'
    });
  }
});

export default router;
