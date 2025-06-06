// backend/fetch-traffic-flow.js
// Enhanced traffic data fetcher for BARRY - adds congestion and incident data
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Enhanced route mapping with traffic monitoring points
const TRAFFIC_MONITORING_POINTS = {
  // A1 Corridor (Major Go North East routes)
  'a1_newcastle': {
    lat: 54.9783, lng: -1.6178,
    routes: ['X9', 'X10', '10', '11', '21', 'X21'],
    description: 'A1 Newcastle Central',
    priority: 'critical'
  },
  'a1_gateshead': {
    lat: 54.9500, lng: -1.6000,
    routes: ['21', '25', '28', '29'],
    description: 'A1 Gateshead/Team Valley',
    priority: 'high'
  },
  
  // A19 Corridor
  'a19_tyne_tunnel': {
    lat: 54.9857, lng: -1.4618,
    routes: ['1', '2', '308', '309'],
    description: 'A19 Tyne Tunnel Approach',
    priority: 'critical'
  },
  'a19_sunderland': {
    lat: 54.8340, lng: -1.4200,
    routes: ['16', '18', '20', '61', '62', '63'],
    description: 'A19 Sunderland',
    priority: 'high'
  },
  
  // A167 Durham Road
  'a167_durham_road': {
    lat: 54.8951, lng: -1.5418,
    routes: ['21', '22', 'X21', '50', '6', '7'],
    description: 'A167 Durham Road',
    priority: 'high'
  },
  
  // Key local roads
  'coast_road': {
    lat: 55.0500, lng: -1.4500,
    routes: ['1', '2', '308', '309', '311'],
    description: 'Coast Road (A1058)',
    priority: 'medium'
  },
  'central_motorway': {
    lat: 54.9700, lng: -1.6300,
    routes: ['Q1', 'Q2', 'Q3', 'QUAYSIDE'],
    description: 'Newcastle Central Motorway',
    priority: 'high'
  }
};

// API Configurations
const API_CONFIGS = {
  // National Highways (Free, already configured)
  nationalHighways: {
    baseUrl: 'https://api.data.nationalhighways.co.uk',
    apiKey: process.env.NATIONAL_HIGHWAYS_API_KEY,
    endpoints: {
      closures: '/roads/v2.0/closures',
      traffic: '/roads/v2.0/traffic', // New traffic flow endpoint
      incidents: '/roads/v2.0/incidents' // Enhanced incidents
    }
  },
  
  // TomTom (Free tier: 2,500 requests/day)
  tomtom: {
    baseUrl: 'https://api.tomtom.com',
    apiKey: process.env.TOMTOM_API_KEY,
    endpoints: {
      incidents: '/traffic/services/5/incidentDetails',
      flow: '/traffic/services/4/flowSegmentData/absolute/10/json'
    }
  },
  
  // HERE (Free tier: 1,000 transactions/month)
  here: {
    baseUrl: 'https://traffic.ls.hereapi.com',
    apiKey: process.env.HERE_API_KEY,
    endpoints: {
      flow: '/traffic/6.3/flow.json',
      incidents: '/traffic/6.3/incidents.json'
    }
  }
};

// Enhanced traffic data processing
function processTrafficData(rawData, source) {
  const processedAlerts = [];
  
  switch (source) {
    case 'tomtom':
      processedAlerts.push(...processTomTomData(rawData));
      break;
    case 'here':
      processedAlerts.push(...processHereData(rawData));
      break;
    case 'national_highways':
      processedAlerts.push(...processNationalHighwaysTraffic(rawData));
      break;
  }
  
  return processedAlerts;
}

function processTomTomData(data) {
  const alerts = [];

  if (data.tm && data.tm.poi) {
    data.tm.poi.forEach(incident => {
      // Improved fallback logic for location field
      let locationText = "";
      if (incident.rdN && incident.f) {
        locationText = `${incident.rdN} - ${incident.f}`;
      } else if (incident.rdN) {
        locationText = incident.rdN;
      } else if (incident.f) {
        locationText = incident.f;
      } else if (incident.p && typeof incident.p.y === 'number' && typeof incident.p.x === 'number') {
        // Use coordinates as fallback
        locationText = `(${incident.p.y.toFixed(4)}, ${incident.p.x.toFixed(4)})`;
      } else {
        locationText = "Unknown location";
      }

      const alert = {
        id: `tomtom_${incident.id}`,
        type: getIncidentType(incident.ic),
        title: `${incident.ty} - ${incident.rdN || 'Traffic Incident'}`,
        description: incident.d || 'Traffic incident reported',
        location: locationText,
        coordinates: [incident.p.y, incident.p.x], // [lat, lng]
        severity: mapTomTomSeverity(incident.ic),
        status: 'red', // TomTom incidents are active
        source: 'tomtom',
        incidentType: incident.ty,
        delay: incident.dl || 0, // delay in seconds
        length: incident.l || 0, // length in meters
        startTime: incident.sd ? new Date(incident.sd).toISOString() : null,
        endTime: incident.ed ? new Date(incident.ed).toISOString() : null,
        affectsRoutes: matchRoutesToLocation(incident.rdN, incident.f),
        lastUpdated: new Date().toISOString(),

        // TomTom specific data
        tomtomCategory: incident.ic,
        tomtomMagnitude: incident.ty,
        tomtomDelay: incident.dl
      };

      alerts.push(alert);
    });
  }

  return alerts;
}

function processHereData(data) {
  const alerts = [];
  
  // Process HERE traffic flow data
  if (data.RWS && data.RWS[0] && data.RWS[0].RW) {
    data.RWS[0].RW.forEach(roadway => {
      if (roadway.FIS && roadway.FIS[0] && roadway.FIS[0].FI) {
        roadway.FIS[0].FI.forEach(flowItem => {
          const congestionLevel = calculateCongestionLevel(flowItem);
          
          if (congestionLevel >= 4) { // Only report significant congestion
            const alert = {
              id: `here_flow_${roadway.DE}_${Date.now()}`,
              type: 'congestion',
              title: `Traffic Congestion - ${roadway.DE}`,
              description: `Slow traffic detected. Current speed: ${Math.round(flowItem.SU || 0)}mph, Normal speed: ${Math.round(flowItem.FF || 0)}mph`,
              location: roadway.DE || 'Road location',
              coordinates: flowItem.TMC && flowItem.TMC.PC1 ? 
                [flowItem.TMC.PC1.QD.LAT, flowItem.TMC.PC1.QD.LON] : null,
              severity: mapHereCongestionSeverity(congestionLevel),
              status: congestionLevel >= 7 ? 'red' : 'amber',
              source: 'here',
              
              // Congestion specific data
              congestionLevel: congestionLevel,
              currentSpeed: Math.round(flowItem.SU || 0),
              freeFlowSpeed: Math.round(flowItem.FF || 0),
              delayMinutes: calculateDelayMinutes(flowItem),
              confidence: flowItem.CN || 0.5,
              
              affectsRoutes: matchRoutesToLocation(roadway.DE),
              lastUpdated: new Date().toISOString(),
              
              // HERE specific data
              hereJamFactor: flowItem.JF,
              hereConfidence: flowItem.CN
            };
            
            alerts.push(alert);
          }
        });
      }
    });
  }
  
  return alerts;
}

function processNationalHighwaysTraffic(data) {
  const alerts = [];
  
  // Enhanced processing of National Highways data to include traffic flow
  if (data.features) {
    data.features.forEach(feature => {
      if (feature.properties) {
        const props = feature.properties;
        
        // Check if this is traffic flow data (new)
        if (props.averageSpeed && props.freeFlowSpeed) {
          const speedReduction = ((props.freeFlowSpeed - props.averageSpeed) / props.freeFlowSpeed) * 100;
          
          if (speedReduction > 20) { // Significant slowdown
            const alert = {
              id: `nh_traffic_${props.id || Date.now()}`,
              type: 'congestion',
              title: `Traffic Slowdown - ${props.roadName || 'Major Road'}`,
              description: `Traffic moving slower than normal. Current: ${props.averageSpeed}mph, Normal: ${props.freeFlowSpeed}mph`,
              location: props.location || props.roadName || 'National Highway',
              coordinates: feature.geometry ? 
                [feature.geometry.coordinates[1], feature.geometry.coordinates[0]] : null,
              severity: speedReduction > 50 ? 'High' : speedReduction > 30 ? 'Medium' : 'Low',
              status: speedReduction > 50 ? 'red' : 'amber',
              source: 'national_highways',
              
              // Traffic flow specific data
              currentSpeed: props.averageSpeed,
              freeFlowSpeed: props.freeFlowSpeed,
              speedReduction: Math.round(speedReduction),
              delayMinutes: calculateDelayFromSpeed(props.averageSpeed, props.freeFlowSpeed, props.linkLength),
              
              affectsRoutes: matchRoutesToLocation(props.roadName, props.location),
              lastUpdated: new Date().toISOString(),
              
              // National Highways specific
              linkId: props.linkId,
              linkLength: props.linkLength
            };
            
            alerts.push(alert);
          }
        }
      }
    });
  }
  
  return alerts;
}

// Helper functions
function getIncidentType(tomtomCode) {
  const incidentTypes = {
    0: 'incident', // Unknown
    1: 'incident', // Accident
    2: 'roadwork', // Fog
    3: 'incident', // Dangerous conditions
    4: 'incident', // Rain
    5: 'incident', // Ice
    6: 'incident', // Snow
    7: 'incident', // Wind
    8: 'roadwork', // Construction
    14: 'incident' // Broken down vehicle
  };
  return incidentTypes[tomtomCode] || 'incident';
}

function mapTomTomSeverity(incidentCode) {
  if (incidentCode <= 2) return 'High';
  if (incidentCode <= 5) return 'Medium';
  return 'Low';
}

function calculateCongestionLevel(flowItem) {
  const jamFactor = flowItem.JF || 0;
  const speed = flowItem.SU || 0;
  const freeFlow = flowItem.FF || 60;
  
  // HERE jam factor is 0-10, where 10 is complete standstill
  if (jamFactor > 8) return 10;
  if (jamFactor > 6) return 8;
  if (jamFactor > 4) return 6;
  if (jamFactor > 2) return 4;
  
  // Also consider speed reduction
  const speedReduction = (freeFlow - speed) / freeFlow;
  if (speedReduction > 0.7) return 9;
  if (speedReduction > 0.5) return 7;
  if (speedReduction > 0.3) return 5;
  
  return Math.max(jamFactor, speedReduction * 10);
}

function mapHereCongestionSeverity(congestionLevel) {
  if (congestionLevel >= 8) return 'High';
  if (congestionLevel >= 5) return 'Medium';
  return 'Low';
}

function calculateDelayMinutes(flowItem) {
  const currentSpeed = flowItem.SU || 0;
  const freeFlowSpeed = flowItem.FF || 60;
  const distance = 1; // Assume 1 mile for calculation
  
  if (currentSpeed === 0 || freeFlowSpeed === 0) return 0;
  
  const normalTime = (distance / freeFlowSpeed) * 60; // minutes
  const actualTime = (distance / currentSpeed) * 60; // minutes
  
  return Math.max(0, Math.round(actualTime - normalTime));
}

function calculateDelayFromSpeed(currentSpeed, freeFlowSpeed, linkLength) {
  if (!currentSpeed || !freeFlowSpeed || !linkLength) return 0;
  
  const distanceKm = linkLength / 1000; // Convert to km
  const normalTimeHours = distanceKm / freeFlowSpeed;
  const actualTimeHours = distanceKm / currentSpeed;
  
  return Math.max(0, Math.round((actualTimeHours - normalTimeHours) * 60));
}

function matchRoutesToLocation(roadName = '', location = '') {
  const routes = new Set();
  const searchText = `${roadName} ${location}`.toLowerCase();
  
  // Enhanced route matching for traffic data
  Object.entries(TRAFFIC_MONITORING_POINTS).forEach(([pointId, point]) => {
    if (searchText.includes(pointId.replace('_', ' ')) || 
        searchText.includes(point.description.toLowerCase())) {
      point.routes.forEach(route => routes.add(route));
    }
  });
  
  // Fallback to your existing location matching
  // (Your existing LOCATION_ROUTE_MAPPING logic here)
  
  return Array.from(routes).sort();
}

// Main fetching functions
async function fetchTomTomTraffic() {
  if (!API_CONFIGS.tomtom.apiKey) {
    console.warn('⚠️ TomTom API key not configured');
    return { success: false, data: [], error: 'API key missing' };
  }
  
  try {
    console.log('🚗 Fetching TomTom traffic data...');
    
    // North East England bounding box
    const boundingBox = '54.5,-2.0,55.5,-1.0'; // minLat,minLng,maxLat,maxLng
    
    const response = await axios.get(
      `${API_CONFIGS.tomtom.baseUrl}${API_CONFIGS.tomtom.endpoints.incidents}/s4/${boundingBox}/10/1364226111`,
      {
        params: { key: API_CONFIGS.tomtom.apiKey },
        timeout: 15000
      }
    );
    
    const alerts = processTrafficData(response.data, 'tomtom');
    
    console.log(`✅ TomTom: ${alerts.length} traffic alerts processed`);
    return { success: true, data: alerts, source: 'TomTom Traffic API' };
    
  } catch (error) {
    console.error('❌ TomTom traffic fetch failed:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

async function fetchHereTraffic() {
  if (!API_CONFIGS.here.apiKey) {
    console.warn('⚠️ HERE API key not configured');
    return { success: false, data: [], error: 'API key missing' };
  }
  
  try {
    console.log('🗺️ Fetching HERE traffic data...');
    
    const alerts = [];
    
    // Fetch traffic flow for key monitoring points
    for (const [pointId, point] of Object.entries(TRAFFIC_MONITORING_POINTS)) {
      if (point.priority === 'critical' || point.priority === 'high') {
        try {
          const response = await axios.get(
            `${API_CONFIGS.here.baseUrl}${API_CONFIGS.here.endpoints.flow}`,
            {
              params: {
                apikey: API_CONFIGS.here.apiKey,
                prox: `${point.lat},${point.lng},1000`, // 1km radius
                responseattributes: 'sh,fc'
              },
              timeout: 10000
            }
          );
          
          const pointAlerts = processTrafficData(response.data, 'here');
          alerts.push(...pointAlerts);
          
          // Rate limiting - don't exceed free tier
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (pointError) {
          console.warn(`⚠️ HERE: Failed to fetch data for ${pointId}:`, pointError.message);
        }
      }
    }
    
    console.log(`✅ HERE: ${alerts.length} traffic alerts processed`);
    return { success: true, data: alerts, source: 'HERE Traffic API' };
    
  } catch (error) {
    console.error('❌ HERE traffic fetch failed:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

async function fetchEnhancedNationalHighwaysTraffic() {
  try {
    console.log('🛣️ Fetching enhanced National Highways traffic data...');
    
    // Your existing National Highways fetcher + new traffic endpoints
    const endpoints = [
      API_CONFIGS.nationalHighways.endpoints.closures, // Existing
      API_CONFIGS.nationalHighways.endpoints.traffic,   // New
      API_CONFIGS.nationalHighways.endpoints.incidents  // Enhanced
    ];
    
    const allAlerts = [];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(
          `${API_CONFIGS.nationalHighways.baseUrl}${endpoint}`,
          {
            headers: {
              'Ocp-Apim-Subscription-Key': API_CONFIGS.nationalHighways.apiKey,
              'Accept': 'application/json'
            },
            timeout: 15000
          }
        );
        
        const alerts = processTrafficData(response.data, 'national_highways');
        allAlerts.push(...alerts);
        
      } catch (endpointError) {
        console.warn(`⚠️ National Highways endpoint ${endpoint} failed:`, endpointError.message);
      }
    }
    
    console.log(`✅ National Highways: ${allAlerts.length} traffic alerts processed`);
    return { success: true, data: allAlerts, source: 'National Highways Enhanced API' };
    
  } catch (error) {
    console.error('❌ Enhanced National Highways fetch failed:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

// Unified traffic data fetcher
export async function fetchAllTrafficData() {
  console.log('🚦 Fetching comprehensive traffic data...');
  const startTime = Date.now();
  
  // Fetch from all sources in parallel
  const [tomtomResult, hereResult, nhResult] = await Promise.allSettled([
    fetchTomTomTraffic(),
    fetchHereTraffic(),
    fetchEnhancedNationalHighwaysTraffic()
  ]);
  
  // Combine all successful results
  const allTrafficAlerts = [];
  let successCount = 0;
  
  if (tomtomResult.status === 'fulfilled' && tomtomResult.value.success) {
    allTrafficAlerts.push(...tomtomResult.value.data);
    successCount++;
  }
  
  if (hereResult.status === 'fulfilled' && hereResult.value.success) {
    allTrafficAlerts.push(...hereResult.value.data);
    successCount++;
  }
  
  if (nhResult.status === 'fulfilled' && nhResult.value.success) {
    allTrafficAlerts.push(...nhResult.value.data);
    successCount++;
  }
  
  // Remove duplicates and sort by priority
  const uniqueAlerts = removeDuplicateAlerts(allTrafficAlerts);
  const sortedAlerts = sortAlertsByPriority(uniqueAlerts);
  
  const processingTime = Date.now() - startTime;
  
  // Save to file
  await saveTrafficData(sortedAlerts);
  
  console.log(`🎯 Traffic data summary: ${sortedAlerts.length} alerts from ${successCount}/3 sources`);
  
  return {
    success: successCount > 0,
    alerts: sortedAlerts,
    metadata: {
      totalAlerts: sortedAlerts.length,
      sources: {
        tomtom: tomtomResult.status === 'fulfilled' ? tomtomResult.value : { success: false },
        here: hereResult.status === 'fulfilled' ? hereResult.value : { success: false },
        nationalHighways: nhResult.status === 'fulfilled' ? nhResult.value : { success: false }
      },
      statistics: {
        incidents: sortedAlerts.filter(a => a.type === 'incident').length,
        congestion: sortedAlerts.filter(a => a.type === 'congestion').length,
        roadworks: sortedAlerts.filter(a => a.type === 'roadwork').length,
        highSeverity: sortedAlerts.filter(a => a.severity === 'High').length,
        activeAlerts: sortedAlerts.filter(a => a.status === 'red').length
      },
      processingTime: `${processingTime}ms`,
      lastUpdated: new Date().toISOString()
    }
  };
}

function removeDuplicateAlerts(alerts) {
  const seen = new Set();
  return alerts.filter(alert => {
    // Create a unique key based on location and type
    const key = `${alert.type}_${alert.location}_${alert.severity}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function sortAlertsByPriority(alerts) {
  return alerts.sort((a, b) => {
    // Priority order: incidents > congestion > roadworks
    const typePriority = { incident: 3, congestion: 2, roadwork: 1 };
    const statusPriority = { red: 3, amber: 2, green: 1 };
    const severityPriority = { High: 3, Medium: 2, Low: 1 };
    
    const aTypeScore = typePriority[a.type] || 0;
    const bTypeScore = typePriority[b.type] || 0;
    
    if (aTypeScore !== bTypeScore) return bTypeScore - aTypeScore;
    
    const aStatusScore = statusPriority[a.status] || 0;
    const bStatusScore = statusPriority[b.status] || 0;
    
    if (aStatusScore !== bStatusScore) return bStatusScore - aStatusScore;
    
    const aSeverityScore = severityPriority[a.severity] || 0;
    const bSeverityScore = severityPriority[b.severity] || 0;
    
    return bSeverityScore - aSeverityScore;
  });
}

async function saveTrafficData(alerts) {
  try {
    const dataDir = path.join(__dirname, 'data');
    await fs.mkdir(dataDir, { recursive: true });
    
    const filePath = path.join(dataDir, 'traffic-data.json');
    await fs.writeFile(filePath, JSON.stringify(alerts, null, 2));
    
    console.log(`💾 Saved ${alerts.length} traffic alerts to file`);
  } catch (error) {
    console.warn('⚠️ Could not save traffic data:', error.message);
  }
}


// Export for use in main server
export default fetchAllTrafficData;


// --- Enhanced TomTom + GTFS Integration ---
// This function fetches TomTom traffic incidents and enriches them with GTFS-based route/stop matching.
// Place your GTFS stop/route data in a suitable structure and provide matching logic as needed.

/**
 * Example: Load GTFS stops/routes mapping from file or DB
 * Replace this with your actual GTFS integration.
 */
let GTFS_STOPS = []; // [{ stop_id, stop_name, lat, lon, routes: [...] }]
let GTFS_ROUTES = []; // [{ route_id, route_short_name, stops: [...] }]

// Example loader (replace with actual DB/file/remote fetch as needed)
async function loadGTFSData() {
  if (GTFS_STOPS.length && GTFS_ROUTES.length) return;
  try {
    const stopsPath = path.join(__dirname, 'data', 'gtfs_stops.json');
    const routesPath = path.join(__dirname, 'data', 'gtfs_routes.json');
    const [stopsRaw, routesRaw] = await Promise.all([
      fs.readFile(stopsPath, 'utf-8'),
      fs.readFile(routesPath, 'utf-8')
    ]);
    GTFS_STOPS = JSON.parse(stopsRaw);
    GTFS_ROUTES = JSON.parse(routesRaw);
    console.log(`✅ Loaded GTFS data: ${GTFS_STOPS.length} stops, ${GTFS_ROUTES.length} routes`);
  } catch (err) {
    console.warn('⚠️ Could not load GTFS data:', err.message);
    GTFS_STOPS = [];
    GTFS_ROUTES = [];
  }
}

/**
 * Find GTFS stops within a radius (meters) of a given point.
 */
function findNearbyStops(lat, lon, radiusMeters = 300) {
  if (!GTFS_STOPS.length) return [];
  const toRad = deg => (deg * Math.PI) / 180;
  const EARTH_RADIUS = 6371000; // meters
  return GTFS_STOPS.filter(stop => {
    const dLat = toRad(stop.lat - lat);
    const dLon = toRad(stop.lon - lon);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat)) * Math.cos(toRad(stop.lat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = EARTH_RADIUS * c;
    return d <= radiusMeters;
  });
}

/**
 * Find GTFS routes serving a list of stops.
 */
function findRoutesForStops(stops) {
  if (!GTFS_ROUTES.length || !stops.length) return [];
  const stopIds = new Set(stops.map(s => s.stop_id));
  const routes = new Set();
  for (const route of GTFS_ROUTES) {
    if (route.stops.some(stopId => stopIds.has(stopId))) {
      routes.add(route.route_short_name || route.route_id);
    }
  }
  return Array.from(routes).sort();
}

/**
 * Fetch TomTom traffic incidents and enrich with GTFS stop/route info.
 * Returns array of alerts, each with additional fields: nearbyStops, gtfsRoutes.
 */
export async function fetchTomTomTrafficWithGTFS() {
  await loadGTFSData();
  if (!API_CONFIGS.tomtom.apiKey) {
    console.warn('⚠️ TomTom API key not configured');
    return { success: false, data: [], error: 'API key missing' };
  }
  try {
    console.log('🚦 Fetching TomTom traffic data with GTFS integration...');
    // North East England bounding box
    const boundingBox = '54.5,-2.0,55.5,-1.0';
    const response = await axios.get(
      `${API_CONFIGS.tomtom.baseUrl}${API_CONFIGS.tomtom.endpoints.incidents}/s4/${boundingBox}/10/1364226111`,
      {
        params: { key: API_CONFIGS.tomtom.apiKey },
        timeout: 15000
      }
    );
    const rawAlerts = processTomTomData(response.data);
    // Enrich each alert with GTFS stops/routes
    const enrichedAlerts = rawAlerts.map(alert => {
      let nearbyStops = [];
      let gtfsRoutes = [];
      if (alert.coordinates && Array.isArray(alert.coordinates) && alert.coordinates.length === 2) {
        nearbyStops = findNearbyStops(alert.coordinates[0], alert.coordinates[1]);
        gtfsRoutes = findRoutesForStops(nearbyStops);
      }
      return {
        ...alert,
        nearbyStops: nearbyStops.map(s => ({
          stop_id: s.stop_id,
          stop_name: s.stop_name,
          lat: s.lat,
          lon: s.lon
        })),
        gtfsRoutes
      };
    });
    console.log(`✅ TomTom+GTFS: ${enrichedAlerts.length} traffic alerts processed`);
    return { success: true, data: enrichedAlerts, source: 'TomTom+GTFS' };
  } catch (error) {
    console.error('❌ TomTom+GTFS traffic fetch failed:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

// --- Usage Notes ---
/**
 * Usage:
 *   import fetchAllTrafficData, { fetchTomTomTrafficWithGTFS } from './fetch-traffic-flow.js';
 *
 *   // To get all traffic data from all sources:
 *   const result = await fetchAllTrafficData();
 *
 *   // To get TomTom traffic incidents enriched with GTFS route/stop info:
 *   const tomtomGtfsResult = await fetchTomTomTrafficWithGTFS();
 *
 * GTFS integration expects 'data/gtfs_stops.json' and 'data/gtfs_routes.json' to exist and contain
 * arrays of stops and routes, respectively, with fields as shown above.
 */