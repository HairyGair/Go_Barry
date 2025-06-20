// backend/routes/activityLogs.js
// API endpoints for activity logs

import express from 'express';
import supervisorManager from '../services/supervisorManager.js';

const router = express.Router();

// Get activity logs with optional filters
router.get('/api/activity-logs', async (req, res) => {
  try {
    const {
      supervisorId,
      action,
      screenType,
      startDate,
      endDate,
      limit = 100
    } = req.query;

    const options = {
      supervisorId,
      action,
      screenType,
      startDate,
      endDate,
      limit: parseInt(limit)
    };

    const logs = await supervisorManager.getActivityLogs(options);
    
    res.json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    console.error('❌ Error fetching activity logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity logs'
    });
  }
});

// Get activity summary/statistics
router.get('/api/activity-logs/summary', async (req, res) => {
  try {
    const { timeRange = 'today' } = req.query;
    
    // Get logs for the time range
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      default:
        startDate = new Date(0);
    }

    const logs = await supervisorManager.getActivityLogs({
      startDate: startDate.toISOString()
    });

    // Calculate summary statistics
    const summary = {
      totalActivities: logs.length,
      byAction: {},
      bySupervisor: {},
      byScreenType: { supervisor: 0, display: 0 },
      recentActivities: logs.slice(0, 10)
    };

    logs.forEach(log => {
      // By action
      summary.byAction[log.action] = (summary.byAction[log.action] || 0) + 1;
      
      // By supervisor
      if (log.supervisor_id) {
        const key = `${log.supervisor_name} (${log.supervisor_id})`;
        summary.bySupervisor[key] = (summary.bySupervisor[key] || 0) + 1;
      }
      
      // By screen type
      if (log.screen_type) {
        summary.byScreenType[log.screen_type]++;
      }
    });

    res.json({
      success: true,
      timeRange,
      startDate: startDate.toISOString(),
      summary
    });
  } catch (error) {
    console.error('❌ Error fetching activity summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity summary'
    });
  }
});

// Log display screen view (called by display screen)
router.post('/api/activity-logs/display-view', async (req, res) => {
  try {
    const { alertCount } = req.body;
    
    await supervisorManager.logDisplayScreenView(alertCount, req);
    
    res.json({
      success: true,
      message: 'Display screen view logged'
    });
  } catch (error) {
    console.error('❌ Error logging display view:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log display view'
    });
  }
});

// Alias endpoints for frontend compatibility
router.get('/api/activity/logs', async (req, res) => {
  try {
    const {
      supervisorId,
      action,
      screenType,
      startDate,
      endDate,
      limit = 100
    } = req.query;

    const options = {
      supervisorId,
      action,
      screenType,
      startDate,
      endDate,
      limit: parseInt(limit)
    };

    const logs = await supervisorManager.getActivityLogs(options);
    
    res.json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    console.error('❌ Error fetching activity logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity logs'
    });
  }
});

router.post('/api/activity/display-view', async (req, res) => {
  try {
    const { alertCount, criticalCount, viewTime } = req.body;
    
    await supervisorManager.logActivity('display_screen_view', {
      screenType: 'display',
      alertCount,
      criticalCount,
      viewTime: viewTime || new Date().toISOString()
    }, null, req);
    
    res.json({
      success: true,
      message: 'Display screen view logged'
    });
  } catch (error) {
    console.error('❌ Error logging display view:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log display view'
    });
  }
});

export default router;
