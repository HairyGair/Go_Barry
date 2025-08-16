// routes/displayTrafficAPI.js
// API for display screen traffic overlay and auto-zoom functionality

import express from 'express';
import realTimeCongestionDetector from '../services/realTimeCongestionDetector.js';

const router = express.Router();

// GET /api/display/traffic-overlay - Get traffic overlay data for display screen
router.get('/traffic-overlay', async (req, res) => {
  try {
    console.log('🖥️ Fetching traffic overlay data for display screen...');
    
    // Get real-time congestion data
    const congestionData = await realTimeCongestionDetector.detectCongestion();
    
    if (!congestionData.success) {
      return res.json({
        success: false,
        error: congestionData.error,
        overlay: {
          zones: [],
          autoZoom: null,
          hasRedTraffic: false
        }
      });
    }
    
    // Process congestion alerts for display overlay
    const redZones = [];
    const amberZones = [];
    let worstCongestion = null;
    let worstScore = 0;
    
    for (const alert of congestionData.alerts) {
      const zone = {
        id: alert.id,
        name: alert.location,
        coordinates: alert.coordinates,
        level: alert.congestionLevel,
        speedRatio: alert.speedRatio,
        currentSpeed: alert.currentSpeed,
        freeFlowSpeed: alert.freeFlowSpeed,
        delayMinutes: alert.delayMinutes,
        affectedRoutes: alert.affectsRoutes,
        severity: alert.severity,
        intelligenceScore: alert.intelligenceScore
      };
      
      if (alert.congestionLevel === 'red') {
        redZones.push(zone);
        
        // Track worst congestion for auto-zoom
        if (alert.intelligenceScore > worstScore) {
          worstScore = alert.intelligenceScore;
          worstCongestion = zone;
        }
      } else if (alert.congestionLevel === 'amber') {
        amberZones.push(zone);
        
        // Consider amber zones for auto-zoom if no red zones
        if (!worstCongestion && alert.intelligenceScore > worstScore) {
          worstScore = alert.intelligenceScore;
          worstCongestion = zone;
        }
      }
    }
    
    // Determine auto-zoom target
    let autoZoom = null;
    if (worstCongestion) {
      // Calculate zoom bounds based on congestion severity
      const zoomRadius = worstCongestion.level === 'red' ? 0.008 : 0.012; // Smaller radius for worse congestion
      
      autoZoom = {
        target: worstCongestion.coordinates,
        bounds: {
          north: worstCongestion.coordinates.lat + zoomRadius,
          south: worstCongestion.coordinates.lat - zoomRadius,
          east: worstCongestion.coordinates.lng + zoomRadius,
          west: worstCongestion.coordinates.lng - zoomRadius
        },
        zoomLevel: worstCongestion.level === 'red' ? 15 : 14,
        reason: `Heavy congestion at ${worstCongestion.name}`,
        severity: worstCongestion.level,
        speedReduction: Math.round((1 - worstCongestion.speedRatio) * 100)
      };
    }
    
    // Generate response
    const response = {
      success: true,
      overlay: {
        zones: [...redZones, ...amberZones],
        redZones: redZones,
        amberZones: amberZones,
        autoZoom: autoZoom,
        hasRedTraffic: redZones.length > 0,
        hasAnyTraffic: redZones.length > 0 || amberZones.length > 0,
        summary: {
          totalZones: redZones.length + amberZones.length,
          redCount: redZones.length,
          amberCount: amberZones.length,
          worstLocation: worstCongestion?.name || null,
          worstSpeedReduction: worstCongestion ? Math.round((1 - worstCongestion.speedRatio) * 100) : 0
        }
      },
      metadata: {
        pointsChecked: congestionData.metadata.pointsChecked,
        lastUpdated: congestionData.metadata.lastUpdated,
        refreshInterval: 60000, // Recommend 1 minute refresh
        autoZoomEnabled: !!autoZoom
      }
    };
    
    console.log(`🖥️ Display overlay: ${response.overlay.summary.totalZones} traffic zones (${response.overlay.summary.redCount} red, ${response.overlay.summary.amberCount} amber)`);
    if (autoZoom) {
      console.log(`🎯 Auto-zoom target: ${autoZoom.reason} (${autoZoom.speedReduction}% slower)`);
    }
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Display traffic overlay failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      overlay: {
        zones: [],
        autoZoom: null,
        hasRedTraffic: false
      }
    });
  }
});

// GET /api/display/traffic-status - Quick traffic status for display
router.get('/traffic-status', async (req, res) => {
  try {
    const congestionData = await realTimeCongestionDetector.detectCongestion();
    
    if (!congestionData.success) {
      return res.json({
        success: false,
        status: 'unknown',
        message: 'Unable to check traffic status'
      });
    }
    
    const redCount = congestionData.alerts.filter(a => a.congestionLevel === 'red').length;
    const amberCount = congestionData.alerts.filter(a => a.congestionLevel === 'amber').length;
    
    let status = 'green';
    let message = 'Traffic flowing normally across GNE network';
    
    if (redCount > 0) {
      status = 'red';
      message = `Heavy congestion affecting ${redCount} location${redCount === 1 ? '' : 's'}`;
    } else if (amberCount > 0) {
      status = 'amber';
      message = `Moderate congestion affecting ${amberCount} location${amberCount === 1 ? '' : 's'}`;
    }
    
    res.json({
      success: true,
      status: status,
      message: message,
      counts: {
        red: redCount,
        amber: amberCount,
        total: redCount + amberCount
      },
      lastUpdated: congestionData.metadata.lastUpdated
    });
    
  } catch (error) {
    console.error('❌ Traffic status check failed:', error.message);
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Traffic status check failed'
    });
  }
});

export default router;