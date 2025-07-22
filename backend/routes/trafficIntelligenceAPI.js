// backend/routes/trafficIntelligenceAPI.js
import express from 'express';
import { deduplicateAlerts, generateAlertHash } from '../utils/alertDeduplication.js';
import enhancedDataSourceManager from '../services/enhancedDataSourceManager.js';
import { autoIncidentCreator } from '../services/autoIncidentCreator.js';
import intelligenceEngine from '../services/intelligenceEngine.js';

const router = express.Router();

// Configuration for traffic severity thresholds
const TRAFFIC_THRESHOLDS = {
  minDelayMinutes: 5,        // Only show delays > 5 minutes
  minCongestionLevel: 3,      // Only show congestion level 3+ (out of 5)
  minLengthMeters: 200,       // Only show congestion > 200m
  maxAgeHours: 2,            // Hide alerts older than 2 hours
  intelligenceScoreMin: 40    // Minimum intelligence score
};

// Transform TomTom alert to incident format
function transformToIncident(alert) {
  const isHighPriority = 
    alert.severity === 'High' || 
    (alert.intelligenceScore && alert.intelligenceScore >= 70) ||
    (alert.delayMinutes && alert.delayMinutes >= 15);

  return {
    id: alert.id,
    source: 'TomTom Traffic',
    type: 'Traffic Congestion',
    title: alert.title || `Traffic Congestion - ${alert.location}`,
    description: alert.description || generateDescription(alert),
    location: alert.location,
    coordinates: normalizeCoordinates(alert.coordinates),
    severity: alert.severity || calculateSeverity(alert),
    status: alert.status || 'active',
    priority: isHighPriority ? 'high' : 'medium',
    
    // Traffic-specific fields
    congestionLevel: alert.congestionLevel,
    delayMinutes: alert.delayMinutes,
    lengthMeters: alert.lengthKm ? alert.lengthKm * 1000 : alert.lengthMeters,
    speedKmh: alert.currentSpeed,
    freeFlowSpeedKmh: alert.freeFlowSpeed,
    
    // Route impact
    affectsRoutes: alert.affectsRoutes || [],
    routeImpact: alert.routeImpact,
    intelligenceScore: alert.intelligenceScore || 0,
    
    // Timing
    startTime: alert.startDate || alert.timestamp,
    lastUpdated: alert.lastUpdated || new Date().toISOString(),
    expectedEndTime: calculateExpectedEnd(alert),
    
    // UI flags
    isTrafficIncident: true,
    canAutoResolve: true,
    showOnMap: true,
    requiresAction: isHighPriority,
    
    // Original data
    rawData: alert
  };
}

function normalizeCoordinates(coords) {
  if (!coords) return null;
  
  if (Array.isArray(coords) && coords.length >= 2) {
    return {
      lat: coords[0],
      lng: coords[1]
    };
  }
  
  if (coords.lat !== undefined && coords.lng !== undefined) {
    return coords;
  }
  
  if (coords.latitude !== undefined && coords.longitude !== undefined) {
    return {
      lat: coords.latitude,
      lng: coords.longitude
    };
  }
  
  return null;
}

function generateDescription(alert) {
  const parts = [];
  
  if (alert.delayMinutes) {
    parts.push(`${alert.delayMinutes} minute delay`);
  }
  
  if (alert.lengthKm) {
    parts.push(`${alert.lengthKm.toFixed(1)}km affected`);
  } else if (alert.lengthMeters) {
    parts.push(`${alert.lengthMeters}m affected`);
  }
  
  if (alert.currentSpeed && alert.freeFlowSpeed) {
    const reduction = Math.round((1 - alert.currentSpeed / alert.freeFlowSpeed) * 100);
    parts.push(`${reduction}% speed reduction`);
  }
  
  if (alert.cause) {
    parts.push(alert.cause);
  }
  
  return parts.join(' • ') || 'Traffic congestion detected';
}

function calculateSeverity(alert) {
  if (alert.delayMinutes >= 20 || alert.congestionLevel >= 4) return 'High';
  if (alert.delayMinutes >= 10 || alert.congestionLevel >= 3) return 'Medium';
  return 'Low';
}

function calculateExpectedEnd(alert) {
  // Estimate based on typical congestion patterns
  const now = new Date();
  const delayMinutes = alert.delayMinutes || 30;
  
  // Simple heuristic: congestion typically clears in 2x the current delay
  const expectedDurationMinutes = delayMinutes * 2;
  
  return new Date(now.getTime() + expectedDurationMinutes * 60000).toISOString();
}

// GET /api/traffic-intelligence/live-congestion
router.get('/live-congestion', async (req, res) => {
  const requestId = `TI-${Date.now()}`;
  
  try {
    console.log(`🚦 [${requestId}] Fetching live traffic congestion for Incidents Manager`);
    
    // Get aggregated alerts from all sources
    const aggregatedResult = await enhancedDataSourceManager.aggregateAllSources();
    
    if (!aggregatedResult || !aggregatedResult.incidents) {
      return res.json({
        success: true,
        incidents: [],
        metadata: {
          requestId,
          total: 0,
          sources: {},
          error: 'No data available'
        }
      });
    }
    
    // Filter for traffic congestion only (exclude roadworks)
    let trafficAlerts = aggregatedResult.incidents.filter(alert => {
      // Include if it's congestion or traffic-related
      const isTraffic = 
        alert.type === 'congestion' ||
        alert.type === 'traffic' ||
        alert.source === 'TomTom' ||
        (alert.category && alert.category.toLowerCase().includes('traffic'));
      
      // Exclude roadworks
      const isRoadwork = 
        alert.type === 'roadwork' ||
        alert.type === 'roadworks' ||
        alert.isRoadwork ||
        (alert.title && alert.title.toLowerCase().includes('roadwork'));
      
      return isTraffic && !isRoadwork;
    });
    
    console.log(`📊 [${requestId}] Found ${trafficAlerts.length} traffic alerts from ${aggregatedResult.incidents.length} total`);
    
    // Apply traffic-specific filtering
    trafficAlerts = trafficAlerts.filter(alert => {
      // Age filter
      if (alert.lastUpdated) {
        const age = Date.now() - new Date(alert.lastUpdated).getTime();
        const maxAge = TRAFFIC_THRESHOLDS.maxAgeHours * 60 * 60 * 1000;
        if (age > maxAge) {
          console.log(`🕒 Filtering old alert: ${alert.id} (${Math.round(age / 1000 / 60)}min old)`);
          return false;
        }
      }
      
      // Severity/impact filter
      if (alert.intelligenceScore && alert.intelligenceScore < TRAFFIC_THRESHOLDS.intelligenceScoreMin) {
        return false;
      }
      
      // Delay filter
      if (alert.delayMinutes && alert.delayMinutes < TRAFFIC_THRESHOLDS.minDelayMinutes) {
        return false;
      }
      
      // Congestion level filter
      if (alert.congestionLevel && alert.congestionLevel < TRAFFIC_THRESHOLDS.minCongestionLevel) {
        return false;
      }
      
      // Length filter
      const lengthMeters = alert.lengthKm ? alert.lengthKm * 1000 : alert.lengthMeters;
      if (lengthMeters && lengthMeters < TRAFFIC_THRESHOLDS.minLengthMeters) {
        return false;
      }
      
      return true;
    });
    
    console.log(`✅ [${requestId}] After filtering: ${trafficAlerts.length} significant traffic incidents`);
    
    // Transform to incident format
    const incidents = trafficAlerts.map(transformToIncident);
    
    // Sort by priority/severity
    incidents.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority === 'high' ? -1 : 1;
      }
      return (b.intelligenceScore || 0) - (a.intelligenceScore || 0);
    });
    
    // Prepare metadata
    const sourceBreakdown = {};
    trafficAlerts.forEach(alert => {
      const source = alert.source || 'Unknown';
      sourceBreakdown[source] = (sourceBreakdown[source] || 0) + 1;
    });
    
    res.json({
      success: true,
      incidents,
      metadata: {
        requestId,
        total: incidents.length,
        sources: sourceBreakdown,
        thresholds: TRAFFIC_THRESHOLDS,
        lastUpdated: new Date().toISOString(),
        autoRefreshRecommended: true,
        refreshIntervalSeconds: 120
      }
    });
    
  } catch (error) {
    console.error(`❌ [${requestId}] Error fetching traffic intelligence:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
      incidents: [],
      metadata: {
        requestId,
        error: error.message
      }
    });
  }
});

// GET /api/traffic-intelligence/roadworks
router.get('/roadworks', async (req, res) => {
  try {
    console.log('🚧 Fetching roadworks for Roadworks Manager');
    
    const aggregatedResult = await enhancedDataSourceManager.aggregateAllSources();
    
    if (!aggregatedResult || !aggregatedResult.incidents) {
      return res.json({
        success: true,
        roadworks: [],
        metadata: { total: 0 }
      });
    }
    
    // Filter for roadworks only
    const roadworks = aggregatedResult.incidents.filter(alert => {
      return alert.type === 'roadwork' || 
             alert.type === 'roadworks' || 
             alert.isRoadwork ||
             (alert.category && alert.category.toLowerCase().includes('roadwork'));
    });
    
    res.json({
      success: true,
      roadworks,
      metadata: {
        total: roadworks.length,
        sources: aggregatedResult.sourceStats,
        lastUpdated: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching roadworks:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      roadworks: []
    });
  }
});

// POST /api/traffic-intelligence/auto-create-incidents
router.post('/auto-create-incidents', async (req, res) => {
  try {
    const { thresholds = {} } = req.body;
    
    console.log('🤖 Running auto-incident creation with thresholds:', thresholds);
    
    // Merge custom thresholds
    const mergedThresholds = { ...TRAFFIC_THRESHOLDS, ...thresholds };
    
    // Get high-priority traffic alerts
    const response = await fetch(`http://localhost:${process.env.PORT || 3001}/api/traffic-intelligence/live-congestion`);
    const data = await response.json();
    
    if (!data.success || !data.incidents) {
      return res.json({
        success: false,
        error: 'No traffic data available',
        created: 0
      });
    }
    
    // Filter for auto-creation candidates
    const candidates = data.incidents.filter(incident => {
      return incident.requiresAction && 
             incident.intelligenceScore >= 60 &&
             incident.affectsRoutes.length > 0;
    });
    
    console.log(`🎯 Found ${candidates.length} candidates for auto-creation`);
    
    // Create incidents using the auto-incident creator service
    const results = [];
    for (const candidate of candidates) {
      try {
        const created = await autoIncidentCreator.createFromTrafficAlert(candidate);
        if (created) {
          results.push(created);
        }
      } catch (error) {
        console.error(`❌ Failed to auto-create incident for ${candidate.id}:`, error);
      }
    }
    
    res.json({
      success: true,
      created: results.length,
      incidents: results,
      candidates: candidates.length,
      metadata: {
        thresholds: mergedThresholds,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error in auto-create-incidents:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      created: 0
    });
  }
});

// GET /api/traffic-intelligence/stats
router.get('/stats', async (req, res) => {
  try {
    const aggregatedResult = await enhancedDataSourceManager.aggregateAllSources();
    
    if (!aggregatedResult) {
      return res.json({
        success: true,
        stats: {
          total: 0,
          byType: {},
          bySeverity: {},
          sources: {}
        }
      });
    }
    
    const incidents = aggregatedResult.incidents || [];
    
    // Calculate statistics
    const stats = {
      total: incidents.length,
      traffic: incidents.filter(a => a.type === 'congestion' || a.type === 'traffic').length,
      roadworks: incidents.filter(a => a.type === 'roadwork' || a.isRoadwork).length,
      incidents: incidents.filter(a => a.type === 'incident').length,
      
      bySeverity: {
        high: incidents.filter(a => a.severity === 'High').length,
        medium: incidents.filter(a => a.severity === 'Medium').length,
        low: incidents.filter(a => a.severity === 'Low').length
      },
      
      bySource: aggregatedResult.sourceStats || {},
      
      avgIntelligenceScore: incidents.reduce((sum, a) => sum + (a.intelligenceScore || 0), 0) / (incidents.length || 1),
      
      routesAffected: [...new Set(incidents.flatMap(a => a.affectsRoutes || []))].length,
      
      lastUpdated: new Date().toISOString()
    };
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stats: {}
    });
  }
});

export default router;