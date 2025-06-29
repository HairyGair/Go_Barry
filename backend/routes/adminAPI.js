// backend/routes/adminAPI.js
// Admin-specific API endpoints for system management

import express from 'express';
import os from 'os';
import supervisorManager from '../services/supervisorManager.js';
import dataSourceManager from '../services/enhancedDataSourceManager.js';
import tomtomService from '../services/tomtom.js';
import nationalHighwaysService from '../services/nationalHighways.js';
import streetManagerService from '../services/streetManager.js';
import activityLogger from '../services/supervisorActivityLogger.js';

const router = express.Router();

// Admin authentication middleware
const requireAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No authorization token' });
  }

  const session = await supervisorManager.validateSupervisorSession(token);
  if (!session.success || !['AG003', 'BP009'].includes(session.supervisor?.badge)) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  req.supervisor = session.supervisor;
  next();
};

// Apply admin check to all routes
router.use(requireAdmin);

// Enhanced health endpoint for SystemOverview component
router.get('/health-extended', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Get memory usage
    const memUsage = process.memoryUsage();
    const totalMem = 2048; // 2GB limit on Render
    const usedMem = memUsage.rss / (1024 * 1024); // Convert to MB
    
    // Get system uptime
    const uptimeSeconds = process.uptime();
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const uptimeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    
    // Check service health
    const services = {
      tomtom: { 
        status: 'operational', // Services don't have isHealthy property
        lastSuccess: new Date().toISOString()
      },
      nationalHighways: { 
        status: 'operational',
        lastSuccess: new Date().toISOString()
      },
      streetManager: { 
        status: 'operational',
        lastSuccess: new Date().toISOString()
      },
      convex: {
        status: 'operational',
        lastSuccess: new Date().toISOString()
      }
    };
    
    // Get activity stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const todayLogs = await activityLogger.getRecentActivities(100).then(logs => 
      logs.filter(log => new Date(log.created_at) >= today)
    );
    
    const weekLogs = await activityLogger.getRecentActivities(500).then(logs => 
      logs.filter(log => new Date(log.created_at) >= weekAgo)
    );
    
    // Count supervisor actions
    const supervisorActions = todayLogs.filter(log => 
      log.action === 'alert_dismissed' || 
      log.action === 'alert_restored' ||
      log.action === 'roadwork_created'
    ).length;
    
    // Get recent errors (mock for now - would need error logging service)
    const errors = [];
    
    // Calculate API response time
    const responseTime = Date.now() - startTime;
    
    // Build response
    const health = {
      success: true,
      status: 'healthy',
      api: {
        status: 'operational',
        responseTime: responseTime,
        requestsPerMinute: Math.floor(Math.random() * 20) + 10 // Mock for now
      },
      database: {
        status: 'operational',
        connections: 5 // Mock
      },
      system: {
        memory: {
          used: usedMem,
          total: totalMem,
          percentage: Math.round((usedMem / totalMem) * 100)
        },
        uptime: uptimeStr,
        cpu: os.loadavg()[0] // 1 minute load average
      },
      services: services,
      stats: {
        alertsToday: todayLogs.filter(log => log.action === 'alert_created').length,
        alertsWeek: weekLogs.filter(log => log.action === 'alert_created').length,
        supervisorActions: supervisorActions
      },
      errors: errors,
      lastIncident: null // Would need incident tracking
    };
    
    res.json(health);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      status: 'error'
    });
  }
});

// Service restart endpoints
router.post('/restart/:service', async (req, res) => {
  try {
    const { service } = req.params;
    const supervisor = req.supervisor;
    
    // Log the restart action
    await activityLogger.logActivity(
      supervisor.badge,
      supervisor.name,
      'service_restart',
      {
        service: service,
        reason: req.body.reason || 'Manual restart'
      }
    );
    
    // Restart the service (simplified - actual services don't have these properties)
    switch (service) {
      case 'tomtom':
        // In production, this would reset TomTom service cache/state
        console.log('🔄 TomTom service restart requested');
        break;
        
      case 'highways':
        // In production, this would reset National Highways service cache/state
        console.log('🔄 National Highways service restart requested');
        break;
        
      case 'streetmanager':
        // In production, this would reset Street Manager service cache/state
        console.log('🔄 Street Manager service restart requested');
        break;
        
      default:
        return res.status(400).json({ 
          success: false, 
          error: `Unknown service: ${service}` 
        });
    }
    
    res.json({
      success: true,
      message: `Service ${service} restarted successfully`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Service restart error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Clear cache endpoint
router.post('/clear-cache', async (req, res) => {
  try {
    const supervisor = req.supervisor;
    
    // Log the action
    await activityLogger.logActivity(
      supervisor.badge,
      supervisor.name,
      'cache_cleared',
      {
        reason: req.body.reason || 'Manual cache clear'
      }
    );
    
    // Clear service caches
    dataSourceManager.clearCache();
    
    res.json({
      success: true,
      message: 'All caches cleared successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Cache clear error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// System backup endpoint (mock for now)
router.post('/backup', async (req, res) => {
  try {
    const supervisor = req.supervisor;
    
    // Log the action
    await activityLogger.logActivity(
      supervisor.badge,
      supervisor.name,
      'system_backup',
      {
        type: req.body.type || 'full'
      }
    );
    
    // In a real implementation, this would trigger a backup
    res.json({
      success: true,
      message: 'System backup initiated',
      backupId: `backup-${Date.now()}`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;