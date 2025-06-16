// routes/throttleAPI.js
// API for monitoring request throttling status with business hours

import express from 'express';

const router = express.Router();

// GET /api/throttle/status - Check throttling status
router.get('/status', (req, res) => {
  try {
    // Simple test response first, then we'll add the real throttling data
    res.json({
      success: true,
      message: 'Throttling API endpoint working',
      businessHours: {
        operating: '6:00 AM - 12:15 AM',
        totalHours: 18.25,
        currentTime: new Date().toISOString(),
        localTime: new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })
      },
      throttling: {
        dailyLimit: 2500,
        requestsPerHour: Math.round((2500 / 18.25) * 100) / 100,
        intervalSeconds: Math.round((18.25 * 3600) / 2500)
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Throttle status error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;
