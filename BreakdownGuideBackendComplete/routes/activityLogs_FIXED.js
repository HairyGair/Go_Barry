// backend/routes/activityLogs_FIXED.js
// FIXED API endpoints for activity logs - simplified for debugging

import express from 'express';

const router = express.Router();

// TEST ENDPOINT
router.get('/api/activity-test', (req, res) => {
  res.json({
    success: true,
    message: 'Activity logs route is registered!',
    timestamp: new Date().toISOString()
  });
});

// Get activity logs with optional filters
router.get('/api/activity-logs', async (req, res) => {
  try {
    console.log('📊 Activity logs endpoint hit!');
    
    // For now, return mock data to prove the route works
    const mockLogs = [
      {
        id: 1,
        action: 'supervisor_login',
        supervisor_id: 'TEST001',
        supervisor_name: 'Test Supervisor',
        created_at: new Date().toISOString(),
        details: { test: true }
      }
    ];
    
    res.json({
      success: true,
      count: mockLogs.length,
      logs: mockLogs,
      debug: 'Route is working but supervisorManager might be failing'
    });
  } catch (error) {
    console.error('❌ Error in activity logs:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// Alias endpoint
router.get('/api/activity/logs', async (req, res) => {
  try {
    console.log('📊 Activity logs alias endpoint hit!');
    
    res.json({
      success: true,
      count: 0,
      logs: [],
      debug: 'Alias route is working'
    });
  } catch (error) {
    console.error('❌ Error in activity logs alias:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Log display screen view
router.post('/api/activity/display-view', async (req, res) => {
  try {
    console.log('👁️ Display view logged:', req.body);
    
    res.json({
      success: true,
      message: 'Display screen view logged (mock)',
      body: req.body
    });
  } catch (error) {
    console.error('❌ Error logging display view:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

console.log('✅ Activity logs routes loaded!');

export default router;
