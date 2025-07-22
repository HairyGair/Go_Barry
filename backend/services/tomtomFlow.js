// services/tomtomFlow.js
// TomTom Flow API Integration for Real-Time Traffic Speed Monitoring
import axios from 'axios';
import { incrementTomTomUsage } from '../routes/tomtomUsageAPI.js';

// Traffic flow cache to minimize API calls
const flowCache = new Map();
const FLOW_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Speed thresholds for severity calculation
const SPEED_THRESHOLDS = {
  motorway: { // A1, A19
    freeFlow: 70,
    normal: 50,
    slow: 30,
    congested: 15
  },
  aRoad: { // A167, A184, etc
    freeFlow: 50,
    normal: 35,
    slow: 20,
    congested: 10
  },
  urban: { // City centers
    freeFlow: 30,
    normal: 20,
    slow: 10,
    congested: 5
  }
};

// Get road type based on location/road name
function getRoadType(location) {
  const locationLower = location.toLowerCase();
  if (locationLower.includes('a1') || locationLower.includes('a19')) return 'motorway';
  if (/a\d{2,3}/.test(locationLower)) return 'aRoad';
  return 'urban';
}

// Calculate severity based on current speed vs expected
function calculateFlowSeverity(currentSpeed, freeFlowSpeed, roadType) {
  const thresholds = SPEED_THRESHOLDS[roadType];
  const speedRatio = currentSpeed / freeFlowSpeed;
  
  if (currentSpeed <= thresholds.congested) return { severity: 'Critical', trend: 'worsening' };
  if (currentSpeed <= thresholds.slow) return { severity: 'High', trend: 'slow' };
  if (currentSpeed <= thresholds.normal) return { severity: 'Medium', trend: 'normal' };
  return { severity: 'Low', trend: 'improving' };
}

// Fetch traffic flow data for a specific location
async function getTrafficFlow(lat, lng, zoom = 15) {
  if (!process.env.TOMTOM_API_KEY) {
    throw new Error('TomTom API key missing');
  }

  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}-${zoom}`;
  const cached = flowCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < FLOW_CACHE_TTL) {
    console.log(`📦 Using cached flow data for ${cacheKey}`);
    return cached.data;
  }

  try {
    console.log(`🌊 Fetching traffic flow for ${lat}, ${lng}...`);
    
    const response = await axios.get(
      `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/${zoom}/json`,
      {
        params: {
          key: process.env.TOMTOM_API_KEY,
          point: `${lat},${lng}`,
          unit: 'MPH'
        },
        timeout: 5000
      }
    );

    incrementTomTomUsage('flow');

    const flowData = response.data?.flowSegmentData;
    if (!flowData) {
      throw new Error('No flow data returned');
    }

    const result = {
      currentSpeed: flowData.currentSpeed,
      freeFlowSpeed: flowData.freeFlowSpeed,
      currentTravelTime: flowData.currentTravelTime,
      freeFlowTravelTime: flowData.freeFlowTravelTime,
      confidence: flowData.confidence || 0.7,
      roadClosure: flowData.roadClosure || false,
      coordinates: flowData.coordinates?.coordinate || [],
      timestamp: new Date().toISOString()
    };

    // Cache the result
    flowCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    console.log(`✅ Flow data: ${result.currentSpeed}/${result.freeFlowSpeed} MPH`);
    return result;

  } catch (error) {
    console.error(`❌ Flow API error: ${error.message}`);
    return null;
  }
}

// Monitor multiple incidents for traffic flow changes
async function monitorIncidentFlows(incidents) {
  const flowUpdates = [];
  
  // Process in batches to avoid rate limits
  const BATCH_SIZE = 10;
  for (let i = 0; i < incidents.length; i += BATCH_SIZE) {
    const batch = incidents.slice(i, i + BATCH_SIZE);
    
    const batchResults = await Promise.all(
      batch.map(async (incident) => {
        try {
          const flow = await getTrafficFlow(
            incident.coordinates[0],
            incident.coordinates[1]
          );
          
          if (flow) {
            const roadType = getRoadType(incident.location);
            const flowAnalysis = calculateFlowSeverity(
              flow.currentSpeed,
              flow.freeFlowSpeed,
              roadType
            );
            
            return {
              incidentId: incident.id,
              location: incident.location,
              previousSeverity: incident.severity,
              newSeverity: flowAnalysis.severity,
              currentSpeed: flow.currentSpeed,
              freeFlowSpeed: flow.freeFlowSpeed,
              speedRatio: (flow.currentSpeed / flow.freeFlowSpeed * 100).toFixed(0),
              trend: flowAnalysis.trend,
              roadClosure: flow.roadClosure,
              shouldAutoClear: flow.currentSpeed >= flow.freeFlowSpeed * 0.8,
              timestamp: flow.timestamp
            };
          }
        } catch (error) {
          console.warn(`⚠️ Flow monitoring failed for ${incident.id}: ${error.message}`);
        }
        return null;
      })
    );
    
    flowUpdates.push(...batchResults.filter(Boolean));
    
    // Small delay between batches
    if (i + BATCH_SIZE < incidents.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Clean old cache entries
  const now = Date.now();
  for (const [key, value] of flowCache.entries()) {
    if (now - value.timestamp > FLOW_CACHE_TTL) {
      flowCache.delete(key);
    }
  }
  
  return {
    updates: flowUpdates,
    processed: incidents.length,
    successful: flowUpdates.length,
    cacheSize: flowCache.size,
    timestamp: new Date().toISOString()
  };
}

// Get flow trend indicator
function getFlowTrendIndicator(current, previous) {
  if (!previous) return '→';
  const diff = current - previous;
  if (diff > 5) return '↑'; // Improving
  if (diff < -5) return '↓'; // Worsening
  return '→'; // Stable
}

// Export functions
export {
  getTrafficFlow,
  monitorIncidentFlows,
  calculateFlowSeverity,
  getFlowTrendIndicator,
  getRoadType,
  SPEED_THRESHOLDS
};

export default {
  getTrafficFlow,
  monitorIncidentFlows,
  calculateFlowSeverity,
  getFlowTrendIndicator
};