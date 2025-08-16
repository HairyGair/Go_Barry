// backend/routes/dataRetentionAPI.js
// Data retention management API endpoints

import express from 'express';
import { validateSupervisorSession } from '../services/supervisorManager.js';
import dataRetentionService from '../services/dataRetentionService.js';
import startupService from '../services/startupService.js';

const router = express.Router();

// GET /api/data-retention/status - Get retention status for all tables
router.get('/status', async (req, res) => {
  try {
    const status = await dataRetentionService.getRetentionStatus();
    
    if (status.error) {
      return res.status(500).json({
        success: false,
        error: status.error
      });
    }

    res.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to get retention status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get retention status'
    });
  }
});

// GET /api/data-retention/config - Get retention configuration
router.get('/config', async (req, res) => {
  try {
    res.json({
      success: true,
      config: dataRetentionService.RETENTION_CONFIG,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to get retention config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get retention configuration'
    });
  }
});

// POST /api/data-retention/cleanup - Trigger manual cleanup (admin only)
router.post('/cleanup', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID required'
      });
    }

    // Validate supervisor session
    const sessionValidation = validateSupervisorSession(sessionId);
    if (!sessionValidation.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid supervisor session'
      });
    }

    const supervisor = sessionValidation.supervisor;

    // Check admin privileges
    if (!supervisor.permissions.includes('admin') && supervisor.badge !== 'AG003' && supervisor.badge !== 'BP009') {
      return res.status(403).json({
        success: false,
        error: 'Admin privileges required for manual cleanup'
      });
    }

    console.log(`🧹 Manual cleanup triggered by ${supervisor.name} (${supervisor.badge})`);

    const results = await dataRetentionService.runDataRetentionCleanup();

    console.log(`✅ Manual cleanup completed by ${supervisor.name}: ${results.totalDeleted} records deleted`);

    res.json({
      success: true,
      results,
      triggeredBy: {
        name: supervisor.name,
        badge: supervisor.badge
      },
      message: 'Manual cleanup completed successfully'
    });

  } catch (error) {
    console.error('Failed to run manual cleanup:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run manual cleanup'
    });
  }
});

// POST /api/data-retention/extend - Extend retention for specific record (admin only)
router.post('/extend', async (req, res) => {
  try {
    const { sessionId, tableName, recordId, additionalMonths = 3 } = req.body;

    if (!sessionId || !tableName || !recordId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID, table name, and record ID are required'
      });
    }

    // Validate supervisor session
    const sessionValidation = validateSupervisorSession(sessionId);
    if (!sessionValidation.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid supervisor session'
      });
    }

    const supervisor = sessionValidation.supervisor;

    // Check admin privileges
    if (!supervisor.permissions.includes('admin') && supervisor.badge !== 'AG003' && supervisor.badge !== 'BP009') {
      return res.status(403).json({
        success: false,
        error: 'Admin privileges required for retention extension'
      });
    }

    console.log(`⏳ Retention extension triggered by ${supervisor.name}: ${tableName}/${recordId} +${additionalMonths} months`);

    const result = await dataRetentionService.extendRetention(tableName, recordId, additionalMonths);

    if (result.success) {
      console.log(`✅ Retention extended successfully by ${supervisor.name}`);
      
      res.json({
        success: true,
        result,
        extendedBy: {
          name: supervisor.name,
          badge: supervisor.badge,
          additionalMonths
        },
        message: `Retention extended by ${additionalMonths} months`
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to extend retention'
      });
    }

  } catch (error) {
    console.error('Failed to extend retention:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to extend retention'
    });
  }
});

// GET /api/data-retention/test - Test retention system (admin only)
router.get('/test', async (req, res) => {
  try {
    const { sessionId } = req.query;

    if (sessionId) {
      // Validate supervisor session if provided
      const sessionValidation = validateSupervisorSession(sessionId);
      if (!sessionValidation.success) {
        return res.status(401).json({
          success: false,
          error: 'Invalid supervisor session'
        });
      }

      const supervisor = sessionValidation.supervisor;

      // Check admin privileges
      if (!supervisor.permissions.includes('admin') && supervisor.badge !== 'AG003' && supervisor.badge !== 'BP009') {
        return res.status(403).json({
          success: false,
          error: 'Admin privileges required for retention testing'
        });
      }

      console.log(`🧪 Retention test triggered by ${supervisor.name} (${supervisor.badge})`);
    }

    const testResults = await dataRetentionService.testRetentionSystem();

    res.json({
      success: true,
      testResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to test retention system:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test retention system'
    });
  }
});

// GET /api/data-retention/system-health - Get overall system health including retention
router.get('/system-health', async (req, res) => {
  try {
    const health = await startupService.getSystemHealth();

    res.json({
      success: true,
      health,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to get system health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system health'
    });
  }
});

export default router;
