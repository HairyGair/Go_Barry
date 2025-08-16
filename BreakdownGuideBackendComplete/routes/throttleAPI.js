// routes/throttleAPI.js
// API for monitoring request throttling status with business hours

import express from 'express';
import { geocodingThrottler, tileThrottler } from '../utils/requestThrottler.js';

const router = express.Router();

// GET /api/throttle/status - Check throttling status
router.get('/status', (req, res) => {
  try {
    const geocodingStatus = geocodingThrottler.getStatus();
    const tileStatus = tileThrottler.getStatus();
    const currentTime = new Date();
    
    res.json({
      success: true,
      geocoding: {
        ...geocodingStatus,
        message: `Using ${geocodingStatus.dailyCount}/${geocodingStatus.dailyLimit} geocoding requests today`
      },
      tiles: {
        ...tileStatus,
        message: `Using ${tileStatus.dailyCount}/${tileStatus.dailyLimit} tile requests today`,
        efficiency: {
          utilizationPercentage: Math.round((tileStatus.dailyCount / 50000) * 100),
          requestsRemaining: tileStatus.remainingToday,
          averageInterval: `${Math.round(tileStatus.msPerRequest / 1000)}s between requests`,
          requestsPerHour: Math.round((50000 / tileStatus.businessHours.operatingHours) * 100) / 100
        }
      },
      currentTime: currentTime.toISOString(),
      localTime: currentTime.toLocaleString('en-GB', { timeZone: 'Europe/London' }),
      businessStatus: {
        currentlyOpen: geocodingStatus.businessHours.currentlyOpen,
        operatingHours: geocodingStatus.businessHours.formatted,
        nextOpenTime: geocodingStatus.businessHours.nextOpenTime,
        totalOperatingHours: geocodingStatus.businessHours.operatingHours
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
