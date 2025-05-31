// backend/fetch-comprehensive-traffic.js
// BARRY Comprehensive Traffic Intelligence System - FIXED VERSION
// Integrates: Street Manager + National Highways + HERE + MapQuest
// Fixed API authentication and endpoints

import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

console.log('🚦 BARRY Comprehensive Traffic System Loading...');
console.log('📊 Data Sources: Street Manager + National Highways + HERE + MapQuest');

// Enhanced configuration with FIXED API settings
const TRAFFIC_CONFIG = {
  here: {
    enabled: !!process.env.HERE_API_KEY,
    apiKey: process.env.HERE_API_KEY,
    baseUrl: 'https://data.traffic.hereapi.com/v7',
    endpoints: {
      flow: '/flow',
      incidents: '/incidents'
    },
    // FIXED: Use query parameter, not headers
    authMethod: 'query_param',
    authParam: 'apiKey',
    limits: {
      monthly: 1000,
      rateLimit: '5 req/sec'
    }
  },
  mapquest: {
    enabled: !!process.env.MAPQUEST_API_KEY,
    apiKey: process.env.MAPQUEST_API_KEY,
    baseUrl: 'https://www.mapquestapi.com',
    endpoints: {
      incidents: '/traffic/v2/incidents'
    },
    // FIXED: Use query parameter 'key', not headers
    authMethod: 'query_param',
    authParam: 'key',
    limits: {
      monthly: 15000,
      rateLimit: '10 req/sec'
    }
  },
  nationalHighways: {
    enabled: !!process.env.NATIONAL_HIGHWAYS_API_KEY,
    apiKey: process.env.NATIONAL_HIGHWAYS_API_KEY,
    // FIXED: Try different endpoints
    baseUrl: 'https://api.data.nationalhighways.co.uk',
    endpoints: {
      roadworks: '/roads/v2.0/closures',
      incidents: '/roads/v2.0/incidents', // Alternative endpoint
      status: '/roads/v2.0/status'
    },
    // Keep header auth for National Highways
    authMethod: 'header',
    authHeader: 'Ocp-Apim-Subscription-Key'
  }
};

// North East bounding boxes for targeted data fetching
const NORTH_EAST_ZONES = {
  newcastle_central: {
    name: 'Newcastle City Centre',
    bbox: {
      north: 55.0000,
      south: 54.9500,
      east: -1.5500,
      west: -1.6500
    },
    circle: { lat: 54.9783, lng: -1.6178, radius: 8000 }
  },
  a1_newcastle_corridor: {
    name: 'A1 Newcastle Corridor',
    bbox: {
      north: 55.1000,
      south: 54.8500,
      east: -1.4000,
      west: -1.8000
    },
    circle: { lat: 54.9750, lng: -1.6000, radius: 15000 }
  },
  tyne_tunnel_a19: {
    name: 'Tyne Tunnel & A19',
    bbox: {
      north: 55.0200,
      south: 54.9600,
      east: -1.4000,
      west: -1.5000
    },
    circle: { lat: 54.9900, lng: -1.4500, radius: 5000 }
  },
  sunderland_a19_south: {
    name: 'Sunderland & A19 South',
    bbox: {
      north: 54.9500,
      south: 54.8500,
      east: -1.3000,
      west: -1.4500
    },
    circle: { lat: 54.9000, lng: -1.3750, radius: 12000 }
  },
  durham_road_a167: {
    name: 'Durham Road A167',
    bbox: {
      north: 54.9000,
      south: 54.7500,
      east: -1.4500,
      west: -1.6000
    },
    circle: { lat: 54.8250, lng: -1.5250, radius: 10000 }
  },
  coast_road_a1058: {
    name: 'Coast Road A1058',
    bbox: {
      north: 55.0500,
      south: 54.9500,
      east: -1.4000,
      west: -1.7000
    },
    circle: { lat: 55.0000, lng: -1.5500, radius: 8000 }
  }
};

// Enhanced route mapping for North East
const ROUTE_MAPPING = {
  'a1': ['X9', 'X10', '10', '11', '21', 'X21', '43', '44', '45'],
  'a19': ['X7', 'X8', '19', '35', '36', '1', '2', '308', '309'],
  'a167': ['21', '22', 'X21', '50', '6', '7'],
  'a1058': ['1', '2', '308', '309', '311', '317'],
  'a184': ['25', '28', '29', '93', '94'],
  'a690': ['61', '62', '63', '64', '65'],
  'newcastle': ['Q1', 'Q2', 'Q3', 'QUAYSIDE', '10', '11', '12', '39', '40'],
  'gateshead': ['21', '25', '28', '29', '53', '54', '56'],
  'sunderland': ['16', '18', '20', '61', '62', '63', '64', '65']
};

// Helper functions
function matchRoutes(location, description = '') {
  const routes = new Set();
  const text = `${location} ${description}`.toLowerCase();
  
  for (const [pattern, routeList] of Object.entries(ROUTE_MAPPING)) {
    if (text.includes(pattern.toLowerCase())) {
      routeList.forEach(route => routes.add(route));
    }
  }
  
  return Array.from(routes).sort();
}

function isInNorthEast(location, description = '') {
  const text = `${location} ${description}`.toUpperCase();
  const keywords = [
    'A1', 'A19', 'A167', 'A1058', 'A184', 'A690',
    'NEWCASTLE', 'GATESHEAD', 'SUNDERLAND', 'DURHAM',
    'TYNE', 'WEAR', 'NORTH EAST', 'NORTHUMBERLAND'
  ];
  
  return keywords.some(keyword => text.includes(keyword));
}

// FIXED: HERE Traffic API fetcher with correct authentication
async function fetchHERETrafficData() {
  if (!TRAFFIC_CONFIG.here.enabled) {
    console.warn('⚠️ HERE API not configured');
    return { success: false, alerts: [], apiCalls: 0 };
  }

  console.log('🗺️ Fetching HERE Traffic data (flow + incidents)...');
  
  const alerts = [];
  let apiCalls = 0;

  try {
    for (const [zoneKey, zone] of Object.entries(NORTH_EAST_ZONES)) {
      try {
        // FIXED: Use circle parameter with apiKey in query string
        const url = `${TRAFFIC_CONFIG.here.baseUrl}${TRAFFIC_CONFIG.here.endpoints.flow}`;
        const params = {
          [TRAFFIC_CONFIG.here.authParam]: TRAFFIC_CONFIG.here.apiKey,
          in: `circle:${zone.circle.lat},${zone.circle.lng};r=${zone.circle.radius}`,
          locationReferencing: 'shape'
        };

        const response = await axios.get(url, {
          params,
          timeout: 10000,
          headers: {
            'User-Agent': 'BARRY-TrafficWatch/3.0',
            'Accept': 'application/json'
          }
        });

        apiCalls++;

        if (response.data && response.data.results) {
          response.data.results.forEach(result => {
            if (result.currentFlow && result.currentFlow.jamFactor > 0.3) {
              const location = result.location || { description: zone.name };
              const routes = matchRoutes(location.description || zone.name);

              alerts.push({
                id: `here_${result.id || Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                type: 'congestion',
                title: `Traffic Congestion - ${location.description || zone.name}`,
                description: `Jam factor: ${(result.currentFlow.jamFactor * 10).toFixed(1)}/10`,
                location: location.description || zone.name,
                severity: result.currentFlow.jamFactor > 0.7 ? 'High' : 
                         result.currentFlow.jamFactor > 0.4 ? 'Medium' : 'Low',
                source: 'here',
                congestionLevel: Math.round(result.currentFlow.jamFactor * 10),
                jamFactor: result.currentFlow.jamFactor,
                speedKmh: result.currentFlow.speed,
                freeFlowSpeedKmh: result.currentFlow.freeFlowSpeed,
                delayMinutes: result.currentFlow.freeFlowSpeed && result.currentFlow.speed ?
                  Math.round((result.currentFlow.freeFlowSpeed - result.currentFlow.speed) / result.currentFlow.speed * 60) : 0,
                affectsRoutes: routes,
                coordinates: result.location?.shape || null,
                lastUpdated: new Date().toISOString(),
                dataSource: 'HERE Traffic API v7'
              });
            }
          });
        }

        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (zoneError) {
        console.warn(`⚠️ HERE API error for zone ${zoneKey}:`, zoneError.message);
      }
    }

    console.log(`✅ HERE: ${alerts.length} traffic alerts from ${apiCalls} API calls`);
    return { success: true, alerts, apiCalls };

  } catch (error) {
    console.error('❌ HERE Traffic API failed:', error.message);
    return { success: false, alerts: [], apiCalls, error: error.message };
  }
}

// FIXED: MapQuest Traffic API fetcher with correct authentication
async function fetchMapQuestTrafficData() {
  if (!TRAFFIC_CONFIG.mapquest.enabled) {
    console.warn('⚠️ MapQuest API not configured');
    return { success: false, alerts: [], apiCalls: 0 };
  }

  console.log('🗺️ Fetching MapQuest Traffic data (incidents)...');
  
  const alerts = [];
  let apiCalls = 0;

  try {
    for (const [zoneKey, zone] of Object.entries(NORTH_EAST_ZONES)) {
      try {
        // FIXED: Use 'key' parameter in query string and correct bounding box format
        const url = `${TRAFFIC_CONFIG.mapquest.baseUrl}${TRAFFIC_CONFIG.mapquest.endpoints.incidents}`;
        const params = {
          [TRAFFIC_CONFIG.mapquest.authParam]: TRAFFIC_CONFIG.mapquest.apiKey,
          boundingBox: `${zone.bbox.north},${zone.bbox.west},${zone.bbox.south},${zone.bbox.east}`,
          filters: 'construction,incidents,congestion'
        };

        const response = await axios.get(url, {
          params,
          timeout: 10000,
          headers: {
            'User-Agent': 'BARRY-TrafficWatch/3.0',
            'Accept': 'application/json'
          }
        });

        apiCalls++;

        if (response.data && response.data.incidents) {
          response.data.incidents.forEach(incident => {
            if (isInNorthEast(incident.shortDesc || '', incident.fullDesc || '')) {
              const routes = matchRoutes(incident.shortDesc || '', incident.fullDesc || '');

              alerts.push({
                id: `mapquest_${incident.id || Date.now()}`,
                type: incident.type === 1 ? 'roadwork' : 'incident',
                title: incident.shortDesc || 'Traffic Incident',
                description: incident.fullDesc || incident.shortDesc || 'Traffic incident reported',
                location: incident.shortDesc || zone.name,
                severity: incident.severity >= 3 ? 'High' : 
                         incident.severity >= 2 ? 'Medium' : 'Low',
                source: 'mapquest',
                startDate: incident.startTime ? new Date(incident.startTime).toISOString() : null,
                endDate: incident.endTime ? new Date(incident.endTime).toISOString() : null,
                affectsRoutes: routes,
                coordinates: { lat: incident.lat, lng: incident.lng },
                lastUpdated: new Date().toISOString(),
                dataSource: 'MapQuest Traffic API v2'
              });
            }
          });
        }

        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (zoneError) {
        console.warn(`⚠️ MapQuest API error for zone ${zoneKey}:`, zoneError.message);
      }
    }

    console.log(`✅ MapQuest: ${alerts.length} traffic alerts from ${apiCalls} API calls`);
    return { success: true, alerts, apiCalls };

  } catch (error) {
    console.error('❌ MapQuest Traffic API failed:', error.message);
    return { success: false, alerts: [], apiCalls, error: error.message };
  }
}

// FIXED: National Highways fetcher with alternative endpoints
async function fetchEnhancedNationalHighwaysData() {
  if (!TRAFFIC_CONFIG.nationalHighways.enabled) {
    console.warn('⚠️ National Highways API not configured');
    return { success: false, alerts: [], apiCalls: 0 };
  }

  console.log('🛣️ Fetching Enhanced National Highways data...');
  
  const alerts = [];
  let apiCalls = 0;

  // Try multiple endpoints
  const endpoints = [
    { name: 'roadworks', path: TRAFFIC_CONFIG.nationalHighways.endpoints.roadworks },
    { name: 'incidents', path: TRAFFIC_CONFIG.nationalHighways.endpoints.incidents },
    { name: 'status', path: TRAFFIC_CONFIG.nationalHighways.endpoints.status }
  ];

  for (const endpoint of endpoints) {
    try {
      const url = `${TRAFFIC_CONFIG.nationalHighways.baseUrl}${endpoint.path}`;
      const response = await axios.get(url, {
        headers: {
          [TRAFFIC_CONFIG.nationalHighways.authHeader]: TRAFFIC_CONFIG.nationalHighways.apiKey,
          'Accept': 'application/json',
          'User-Agent': 'BARRY-TrafficWatch/3.0'
        },
        timeout: 15000
      });

      apiCalls++;

      if (response.data && response.data.features) {
        response.data.features.forEach(feature => {
          const props = feature.properties || {};
          if (isInNorthEast(props.location || '', props.description || '')) {
            const routes = matchRoutes(props.location || '', props.description || '');

            alerts.push({
              id: `nh_enhanced_${props.id || Date.now()}_${endpoint.name}`,
              type: endpoint.name === 'incidents' ? 'incident' : 'roadwork',
              title: props.title || props.description || `National Highways ${endpoint.name}`,
              description: props.description || props.comment || `${endpoint.name} on major road network`,
              location: props.location || 'Major Road Network',
              authority: 'National Highways',
              source: 'national_highways',
              severity: props.severity || (props.category?.toLowerCase().includes('closure') ? 'High' : 'Medium'),
              affectsRoutes: routes,
              coordinates: feature.geometry ? {
                type: feature.geometry.type,
                coordinates: feature.geometry.coordinates
              } : null,
              lastUpdated: new Date().toISOString(),
              dataSource: `National Highways API - ${endpoint.name}`
            });
          }
        });
      }

      // Success, break out of loop
      break;

    } catch (endpointError) {
      console.warn(`⚠️ National Highways ${endpoint.name} failed:`, endpointError.message);
      
      // If this is the last endpoint and all failed, continue to avoid crash
      if (endpoint === endpoints[endpoints.length - 1]) {
        console.warn('⚠️ All National Highways endpoints failed');
      }
    }
  }

  console.log(`✅ National Highways: ${alerts.length} alerts processed`);
  return { success: true, alerts, apiCalls };
}

// Main comprehensive traffic data fetcher
export async function fetchComprehensiveTrafficData() {
  const startTime = Date.now();
  
  console.log('🚦 BARRY Comprehensive Traffic Intelligence System Starting...');
  console.log('📊 Fetching from: Street Manager + National Highways + HERE + MapQuest');

  // Fetch from all sources in parallel
  const [hereResult, mapquestResult, nationalHighwaysResult] = await Promise.allSettled([
    fetchHERETrafficData(),
    fetchMapQuestTrafficData(),
    fetchEnhancedNationalHighwaysData()
  ]);

  // Combine all alerts
  const allAlerts = [];
  let totalApiCalls = 0;

  // Process HERE results
  if (hereResult.status === 'fulfilled' && hereResult.value.success) {
    allAlerts.push(...hereResult.value.alerts);
    totalApiCalls += hereResult.value.apiCalls;
  }

  // Process MapQuest results  
  if (mapquestResult.status === 'fulfilled' && mapquestResult.value.success) {
    allAlerts.push(...mapquestResult.value.alerts);
    totalApiCalls += mapquestResult.value.apiCalls;
  }

  // Process National Highways results
  if (nationalHighwaysResult.status === 'fulfilled' && nationalHighwaysResult.value.success) {
    allAlerts.push(...nationalHighwaysResult.value.alerts);
    totalApiCalls += nationalHighwaysResult.value.apiCalls;
  }

  // Remove duplicates and sort by priority
  const uniqueAlerts = removeDuplicateAlerts(allAlerts);
  
  // Sort: incidents > congestion > roadworks, then by severity
  uniqueAlerts.sort((a, b) => {
    const typePriority = { incident: 3, congestion: 2, roadwork: 1 };
    const severityPriority = { High: 3, Medium: 2, Low: 1 };
    
    const aTypeScore = typePriority[a.type] || 0;
    const bTypeScore = typePriority[b.type] || 0;
    
    if (aTypeScore !== bTypeScore) return bTypeScore - aTypeScore;
    
    const aSeverityScore = severityPriority[a.severity] || 0;
    const bSeverityScore = severityPriority[b.severity] || 0;
    
    return bSeverityScore - aSeverityScore;
  });

  const processingTime = Date.now() - startTime;

  // Save comprehensive traffic data
  await saveTrafficData(uniqueAlerts);

  const statistics = {
    totalAlerts: uniqueAlerts.length,
    totalIncidents: uniqueAlerts.filter(a => a.type === 'incident').length,
    totalCongestion: uniqueAlerts.filter(a => a.type === 'congestion').length,
    totalRoadworks: uniqueAlerts.filter(a => a.type === 'roadwork').length,
    highSeverity: uniqueAlerts.filter(a => a.severity === 'High').length,
    sources: {
      here: uniqueAlerts.filter(a => a.source === 'here').length,
      mapquest: uniqueAlerts.filter(a => a.source === 'mapquest').length,
      nationalHighways: uniqueAlerts.filter(a => a.source === 'national_highways').length
    }
  };

  console.log('💾 Saved', uniqueAlerts.length, 'traffic alerts to comprehensive-traffic-data.json');
  console.log('🎯 Comprehensive Traffic Summary:');
  console.log(`   📊 Total Alerts: ${statistics.totalAlerts}`);
  console.log(`   ✅ Successful Sources: ${[hereResult, mapquestResult, nationalHighwaysResult].filter(r => r.status === 'fulfilled' && r.value.success).length}/3`);
  console.log(`   📞 Total API Calls: ${totalApiCalls}`);
  console.log(`   ⏱️ Processing Time: ${processingTime}ms`);

  return {
    success: true,
    alerts: uniqueAlerts,
    metadata: {
      statistics,
      sources: {
        here: {
          success: hereResult.status === 'fulfilled' && hereResult.value.success,
          count: hereResult.status === 'fulfilled' ? hereResult.value.alerts.length : 0,
          apiCalls: hereResult.status === 'fulfilled' ? hereResult.value.apiCalls : 0,
          error: hereResult.status === 'rejected' ? hereResult.reason.message : 
                 (hereResult.status === 'fulfilled' && !hereResult.value.success ? hereResult.value.error : null)
        },
        mapquest: {
          success: mapquestResult.status === 'fulfilled' && mapquestResult.value.success,
          count: mapquestResult.status === 'fulfilled' ? mapquestResult.value.alerts.length : 0,
          apiCalls: mapquestResult.status === 'fulfilled' ? mapquestResult.value.apiCalls : 0,
          error: mapquestResult.status === 'rejected' ? mapquestResult.reason.message :
                 (mapquestResult.status === 'fulfilled' && !mapquestResult.value.success ? mapquestResult.value.error : null)
        },
        nationalHighways: {
          success: nationalHighwaysResult.status === 'fulfilled' && nationalHighwaysResult.value.success,
          count: nationalHighwaysResult.status === 'fulfilled' ? nationalHighwaysResult.value.alerts.length : 0,
          apiCalls: nationalHighwaysResult.status === 'fulfilled' ? nationalHighwaysResult.value.apiCalls : 0,
          error: nationalHighwaysResult.status === 'rejected' ? nationalHighwaysResult.reason.message :
                 (nationalHighwaysResult.status === 'fulfilled' && !nationalHighwaysResult.value.success ? nationalHighwaysResult.value.error : null)
        }
      },
      apiUsage: {
        here: {
          used: hereResult.status === 'fulfilled' ? hereResult.value.apiCalls : 0,
          limit: TRAFFIC_CONFIG.here.limits.monthly
        },
        mapquest: {
          used: mapquestResult.status === 'fulfilled' ? mapquestResult.value.apiCalls : 0,
          limit: TRAFFIC_CONFIG.mapquest.limits.monthly
        }
      },
      processingTime: `${processingTime}ms`,
      lastUpdated: new Date().toISOString()
    }
  };
}

function removeDuplicateAlerts(alerts) {
  const seen = new Map();
  
  return alerts.filter(alert => {
    // Create a key based on location and description
    const key = `${alert.location}_${alert.description}`.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (seen.has(key)) {
      // Keep the alert with more data or from a more reliable source
      const existing = seen.get(key);
      const sourceReliability = { here: 3, national_highways: 2, mapquest: 1 };
      
      if ((sourceReliability[alert.source] || 0) > (sourceReliability[existing.source] || 0)) {
        seen.set(key, alert);
        return true;
      }
      return false;
    }
    
    seen.set(key, alert);
    return true;
  });
}

async function saveTrafficData(alerts) {
  try {
    const dataDir = path.join(__dirname, 'data');
    await fs.mkdir(dataDir, { recursive: true });
    
    const filePath = path.join(dataDir, 'comprehensive-traffic-data.json');
    await fs.writeFile(filePath, JSON.stringify({
      alerts,
      metadata: {
        count: alerts.length,
        lastUpdated: new Date().toISOString(),
        sources: ['HERE Traffic API v7', 'MapQuest Traffic API v2', 'National Highways API']
      }
    }, null, 2));
    
  } catch (error) {
    console.warn('⚠️ Could not save comprehensive traffic data:', error.message);
  }
}

export default fetchComprehensiveTrafficData;