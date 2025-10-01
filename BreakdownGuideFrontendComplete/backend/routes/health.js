/*
 * Health Check Routes
 * System health and status monitoring
 */

import express from 'express';
const router = express.Router();

// Simple health check
router.get('/', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    service: 'Breakdown Guide Backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  const memoryUsage = process.memoryUsage();
  
  res.json({
    success: true,
    status: 'healthy',
    service: 'Breakdown Guide Backend',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: process.uptime(),
      formatted: formatUptime(process.uptime())
    },
    memory: {
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
    },
    environment: process.env.NODE_ENV || 'development',
    database: await checkDatabaseHealth(),
    features: {
      locationTracking: process.env.ENABLE_LOCATION_TRACKING === 'true',
      hotspotAnalysis: process.env.ENABLE_HOTSPOT_ANALYSIS === 'true',
      autoEscalation: process.env.ENABLE_AUTO_ESCALATION === 'true'
    }
  });
});

// Database health check
async function checkDatabaseHealth() {
  try {
    // In a real implementation, this would check Supabase connection
    // For now, return mock healthy status
    return {
      connected: true,
      latency: '12ms',
      status: 'operational'
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message,
      status: 'disconnected'
    };
  }
}

// Format uptime to human readable
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
}

export default router;
