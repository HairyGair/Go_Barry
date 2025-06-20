// backend/routes/tomtomUsageAPI.js
// TomTom tile usage monitoring API

import express from 'express';

const router = express.Router();

// In-memory usage tracking (in production, use database)
const usageStats = {
  daily: {
    date: new Date().toISOString().split('T')[0],
    totalRequests: 0,
    cachedRequests: 0,
    networkRequests: 0,
    uniqueTiles: new Set(),
    estimatedCost: 0,
    quotaLimit: 75000, // TomTom daily tile limit
    resetTime: new Date().setHours(0, 0, 0, 0) + 24 * 60 * 60 * 1000
  },
  hourly: {},
  byEndpoint: {}
};

// Reset daily stats
setInterval(() => {
  const now = Date.now();
  if (now >= usageStats.daily.resetTime) {
    console.log('🔄 Resetting TomTom daily usage stats');
    usageStats.daily = {
      date: new Date().toISOString().split('T')[0],
      totalRequests: 0,
      cachedRequests: 0,
      networkRequests: 0,
      uniqueTiles: new Set(),
      estimatedCost: 0,
      quotaLimit: 75000,
      resetTime: new Date().setHours(0, 0, 0, 0) + 24 * 60 * 60 * 1000
    };
  }
}, 60000); // Check every minute

// Get usage statistics
router.get('/stats', (req, res) => {
  const remaining = usageStats.daily.quotaLimit - usageStats.daily.networkRequests;
  const percentUsed = (usageStats.daily.networkRequests / usageStats.daily.quotaLimit) * 100;
  
  res.json({
    success: true,
    daily: {
      date: usageStats.daily.date,
      totalRequests: usageStats.daily.totalRequests,
      cachedRequests: usageStats.daily.cachedRequests,
      networkRequests: usageStats.daily.networkRequests,
      uniqueTiles: usageStats.daily.uniqueTiles.size,
      cacheHitRate: usageStats.daily.totalRequests > 0 
        ? Math.round((usageStats.daily.cachedRequests / usageStats.daily.totalRequests) * 100) 
        : 0,
      quotaUsed: percentUsed.toFixed(2) + '%',
      quotaRemaining: remaining,
      estimatedCost: `$${(usageStats.daily.networkRequests * 0.0004).toFixed(2)}`, // Estimate
      hoursUntilReset: Math.ceil((usageStats.daily.resetTime - Date.now()) / (60 * 60 * 1000))
    },
    recommendations: generateRecommendations(percentUsed, remaining)
  });
});

// Track tile request
router.post('/track', (req, res) => {
  const { type, tileUrl, cached } = req.body;
  
  usageStats.daily.totalRequests++;
  
  if (cached) {
    usageStats.daily.cachedRequests++;
  } else {
    usageStats.daily.networkRequests++;
  }
  
  if (tileUrl) {
    // Extract tile coordinates from URL
    const match = tileUrl.match(/\/(\d+)\/(\d+)\/(\d+)\./);
    if (match) {
      const tileKey = `${match[1]}-${match[2]}-${match[3]}`;
      usageStats.daily.uniqueTiles.add(tileKey);
    }
  }
  
  // Track hourly
  const hour = new Date().getHours();
  if (!usageStats.hourly[hour]) {
    usageStats.hourly[hour] = { total: 0, cached: 0, network: 0 };
  }
  usageStats.hourly[hour].total++;
  if (cached) {
    usageStats.hourly[hour].cached++;
  } else {
    usageStats.hourly[hour].network++;
  }
  
  res.json({ success: true });
});

// Get hourly breakdown
router.get('/hourly', (req, res) => {
  const hourlyData = Object.entries(usageStats.hourly)
    .map(([hour, stats]) => ({
      hour: parseInt(hour),
      ...stats,
      cacheHitRate: stats.total > 0 ? Math.round((stats.cached / stats.total) * 100) : 0
    }))
    .sort((a, b) => a.hour - b.hour);
  
  res.json({
    success: true,
    hourly: hourlyData,
    peakHour: hourlyData.reduce((peak, current) => 
      current.network > (peak?.network || 0) ? current : peak, null
    ),
    timestamp: new Date().toISOString()
  });
});

// Generate recommendations based on usage
function generateRecommendations(percentUsed, remaining) {
  const recommendations = [];
  
  if (percentUsed > 80) {
    recommendations.push({
      level: 'critical',
      message: 'Over 80% of daily quota used. Consider reducing map refresh rates.'
    });
  } else if (percentUsed > 60) {
    recommendations.push({
      level: 'warning',
      message: 'Over 60% of daily quota used. Monitor usage closely.'
    });
  }
  
  if (remaining < 10000) {
    recommendations.push({
      level: 'warning',
      message: 'Less than 10,000 tile requests remaining today.'
    });
  }
  
  const cacheHitRate = usageStats.daily.totalRequests > 0 
    ? (usageStats.daily.cachedRequests / usageStats.daily.totalRequests) * 100 
    : 0;
    
  if (cacheHitRate < 50) {
    recommendations.push({
      level: 'info',
      message: `Cache hit rate is ${cacheHitRate.toFixed(0)}%. Consider increasing cache duration.`
    });
  } else if (cacheHitRate > 80) {
    recommendations.push({
      level: 'success',
      message: `Excellent cache hit rate of ${cacheHitRate.toFixed(0)}%!`
    });
  }
  
  return recommendations;
}

export default router;
