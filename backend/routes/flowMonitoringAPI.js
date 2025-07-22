// routes/flowMonitoringAPI.js
import express from 'express';
import flowMonitor from '../services/flowMonitor.js';
import { getTrafficFlow } from '../services/tomtomFlow.js';

const router = express.Router();

// Get flow monitoring overview
router.get('/overview', (req, res) => {
  try {
    const stats = flowMonitor.getStats();
    
    res.json({
      success: true,
      monitoring: {
        isActive: stats.isRunning,
        activeIncidents: stats.activeIncidents,
        checksPerformed: stats.checksPerformed,
        severityUpdates: stats.severityUpdates,
        autoCleared: stats.autoCleared,
        lastCheck: stats.lastCheck
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error getting flow overview:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get flow data for specific incident
router.get('/incident/:incidentId', (req, res) => {
  try {
    const { incidentId } = req.params;
    const flowInfo = flowMonitor.getIncidentFlowInfo(incidentId);
    
    if (!flowInfo) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found in flow monitoring'
      });
    }
    
    res.json({
      success: true,
      flowInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error getting incident flow:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get real-time flow for coordinates (direct TomTom query)
router.post('/check-flow', async (req, res) => {
  try {
    const { lat, lng, zoom = 15 } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude required'
      });
    }
    
    const flowData = await getTrafficFlow(lat, lng, zoom);
    
    if (!flowData) {
      return res.status(404).json({
        success: false,
        error: 'No flow data available for location'
      });
    }
    
    res.json({
      success: true,
      flow: flowData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error checking flow:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start/stop flow monitoring
router.post('/control', (req, res) => {
  try {
    const { action } = req.body;
    
    if (action === 'start') {
      flowMonitor.start();
      res.json({
        success: true,
        message: 'Flow monitoring started',
        status: 'running'
      });
    } else if (action === 'stop') {
      flowMonitor.stop();
      res.json({
        success: true,
        message: 'Flow monitoring stopped',
        status: 'stopped'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid action. Use "start" or "stop"'
      });
    }
  } catch (error) {
    console.error('❌ Error controlling flow monitor:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Manually add incident to monitoring
router.post('/monitor-incident', (req, res) => {
  try {
    const { incident } = req.body;
    
    if (!incident || !incident.id || !incident.coordinates) {
      return res.status(400).json({
        success: false,
        error: 'Valid incident with id and coordinates required'
      });
    }
    
    flowMonitor.addIncident(incident);
    
    res.json({
      success: true,
      message: `Incident ${incident.id} added to flow monitoring`,
      incidentId: incident.id
    });
  } catch (error) {
    console.error('❌ Error adding incident to monitoring:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Remove incident from monitoring
router.delete('/monitor-incident/:incidentId', (req, res) => {
  try {
    const { incidentId } = req.params;
    
    flowMonitor.removeIncident(incidentId);
    
    res.json({
      success: true,
      message: `Incident ${incidentId} removed from flow monitoring`
    });
  } catch (error) {
    console.error('❌ Error removing incident from monitoring:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;