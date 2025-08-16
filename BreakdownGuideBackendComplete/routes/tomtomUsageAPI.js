// routes/tomtomUsageAPI.js
// TomTom API Usage Tracking and Monitoring
import express from 'express';
import { supervisorAuth } from '../middleware/supervisorAuth.js';

const router = express.Router();

// In-memory usage tracking (resets daily)
const usageTracker = {
  traffic: { used: 0, limit: 2500, resetsAt: null },
  search: { used: 0, limit: 2500, resetsAt: null },
  routing: { used: 0, limit: 2500, resetsAt: null },
  reverseGeocode: { used: 0, limit: 2500, resetsAt: null },
  lastReset: null
};

// Reset daily at midnight
function checkAndResetDaily() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (!usageTracker.lastReset || usageTracker.lastReset < today) {
    // Reset all counters
    Object.keys(usageTracker).forEach(key => {
      if (key !== 'lastReset' && usageTracker[key].limit) {
        usageTracker[key].used = 0;
        usageTracker[key].resetsAt = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      }
    });
    usageTracker.lastReset = today;
    console.log('✅ TomTom usage counters reset for new day');
  }
}

// Increment usage counter
export function incrementTomTomUsage(apiType, count = 1) {
  checkAndResetDaily();
  
  if (usageTracker[apiType]) {
    usageTracker[apiType].used += count;
    
    // Log warning if approaching limit
    const percentage = (usageTracker[apiType].used / usageTracker[apiType].limit) * 100;
    if (percentage >= 90) {
      console.error(`🚨 TomTom ${apiType} API: CRITICAL - ${percentage.toFixed(1)}% of daily limit used!`);
    } else if (percentage >= 75) {
      console.warn(`⚠️ TomTom ${apiType} API: WARNING - ${percentage.toFixed(1)}% of daily limit used`);
    }
  }
}

// Get current usage status
router.get('/usage', supervisorAuth(['admin']), (req, res) => {
  try {
    checkAndResetDaily();
    
    const recommendations = [];
    const criticalAPIs = [];
    const warningAPIs = [];
    
    // Analyze usage and generate recommendations
    Object.entries(usageTracker).forEach(([api, data]) => {
      if (api === 'lastReset' || !data.limit) return;
      
      const percentage = (data.used / data.limit) * 100;
      
      if (percentage >= 90) {
        criticalAPIs.push(api);
        recommendations.push(`${api} API is critically low. Consider reducing frequency or implementing fallbacks.`);
      } else if (percentage >= 75) {
        warningAPIs.push(api);
        recommendations.push(`${api} API usage is high. Monitor closely.`);
      }
    });
    
    // General recommendations
    if (criticalAPIs.length > 0) {
      recommendations.push('Enable aggressive caching to reduce API calls');
      recommendations.push('Consider implementing request queuing for non-urgent operations');
    }
    
    res.json({
      success: true,
      apis: usageTracker,
      summary: {
        critical: criticalAPIs,
        warning: warningAPIs,
        healthy: Object.keys(usageTracker)
          .filter(api => api !== 'lastReset' && usageTracker[api].limit)
          .filter(api => !criticalAPIs.includes(api) && !warningAPIs.includes(api))
      },
      recommendations,
      lastReset: usageTracker.lastReset
    });
  } catch (error) {
    console.error('❌ Error fetching TomTom usage:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get usage history (if we implement persistent storage)
router.get('/usage/history', supervisorAuth(['admin']), async (req, res) => {
  try {
    // TODO: Implement Supabase storage for historical data
    res.json({
      success: true,
      message: 'Historical data not yet implemented',
      data: []
    });
  } catch (error) {
    console.error('❌ Error fetching usage history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Manual reset (admin only)
router.post('/usage/reset', supervisorAuth(['admin']), (req, res) => {
  try {
    Object.keys(usageTracker).forEach(key => {
      if (key !== 'lastReset' && usageTracker[key].limit) {
        usageTracker[key].used = 0;
      }
    });
    
    console.log('🔄 TomTom usage counters manually reset by admin');
    
    res.json({
      success: true,
      message: 'Usage counters reset successfully'
    });
  } catch (error) {
    console.error('❌ Error resetting usage:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
