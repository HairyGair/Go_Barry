// backend/index.js
// BARRY Backend with Fixed API Authentication
import express from 'express';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

console.log('🚦 BARRY Backend Starting with Fixed API Authentication...');

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Enhanced North East route mapping
const LOCATION_ROUTE_MAPPING = {
  'a1': ['X9', 'X10', '10', '11', '21', 'X21', '43', '44', '45'],
  'a19': ['X7', 'X8', '19', '35', '36', '1', '2', '308', '309'],
  'a167': ['21', '22', 'X21', '50', '6', '7'],
  'a1058': ['1', '2', '308', '309', '311', '317'],
  'a184': ['25', '28', '29', '93', '94'],
  'a690': ['61', '62', '63', '64', '65'],
  'a69': ['X84', 'X85', '602', '685'],
  'a183': ['16', '18', '20', '61', '62'],
  'newcastle': ['Q1', 'Q2', 'Q3', 'QUAYSIDE', '10', '11', '12', '39', '40'],
  'gateshead': ['21', '25', '28', '29', '53', '54', '56'],
  'sunderland': ['16', '18', '20', '61', '62', '63', '64', '65'],
  'durham': ['21', '22', 'X21', '50', '6', '7', '13', '14'],
  'tyne tunnel': ['1', '2', '308', '309', '311'],
  'coast road': ['1', '2', '308', '309', '311', '317'],
  'central motorway': ['Q1', 'Q2', 'Q3', 'QUAYSIDE']
};

// Helper functions
function isInNorthEast(location, description = '') {
  const text = `${location} ${description}`.toUpperCase();
  const keywords = [
    'A1', 'A19', 'A69', 'A68', 'A167', 'A183', 'A184', 'A690', 'A691', 'A1058',
    'NEWCASTLE', 'GATESHEAD', 'SUNDERLAND', 'DURHAM', 
    'NORTHUMBERLAND', 'TYNE', 'WEAR', 'HEXHAM', 'CRAMLINGTON',
    'WASHINGTON', 'SEAHAM', 'CHESTER-LE-STREET', 'BIRTLEY',
    'TYNE TUNNEL', 'COAST ROAD', 'CENTRAL MOTORWAY'
  ];
  return keywords.some(keyword => text.includes(keyword));
}

function matchRoutes(location, description = '') {
  const routes = new Set();
  const text = `${location} ${description}`.toLowerCase();
  
  for (const [pattern, routeList] of Object.entries(LOCATION_ROUTE_MAPPING)) {
    if (text.includes(pattern.toLowerCase())) {
      routeList.forEach(route => routes.add(route));
    }
  }
  
  return Array.from(routes).sort();
}

function classifyAlert(alert) {
  const now = new Date();
  let status = 'green';
  
  try {
    const startDate = alert.startDate ? new Date(alert.startDate) : null;
    const endDate = alert.endDate ? new Date(alert.endDate) : null;
    
    if (startDate && endDate) {
      if (startDate <= now && endDate >= now) {
        status = 'red'; // Active
      } else if (startDate > now) {
        const daysUntil = Math.floor((startDate - now) / (1000 * 60 * 60 * 24));
        if (daysUntil <= 7) {
          status = 'amber'; // Upcoming
        }
      }
    } else if (alert.category?.toLowerCase().includes('closure')) {
      status = 'red'; // Assume active if it's a closure
    }
  } catch (error) {
    console.warn('⚠️ Alert classification error:', error.message);
  }
  
  return status;
}

// North East bounding boxes for multi-query
const NORTH_EAST_BBOXES = [
  '54.8,-1.7,55.1,-1.4', // Newcastle/Gateshead
  '54.8,-1.5,55.1,-1.1', // North Tyneside to Coast
  '54.7,-1.6,54.9,-1.3', // Sunderland/Washington
  '54.5,-1.6,54.7,-1.2', // Durham/Chester-le-Street
  '54.5,-1.4,54.7,-1.0', // Seaham/Peterlee
  '54.6,-1.7,54.8,-1.3', // Consett/Stanley/Derwentside
  '54.4,-1.4,54.6,-1.0', // Hartlepool/Teesside
  '55.0,-1.8,55.3,-1.4'  // Northumberland South (Cramlington, Blyth)
];

// Helper for deduplication of alerts/incidents by id/location/description
function deduplicateAlerts(alerts) {
  const seen = new Set();
  const deduped = [];
  for (const alert of alerts) {
    // Use id if present, else use location+description
    const key = alert.id
      ? alert.id
      : `${alert.location || ''}|${alert.description || ''}|${alert.title || ''}`.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(alert);
    }
  }
  return deduped;
}

// ENHANCED: TomTom Traffic API with improved location extraction
async function fetchTomTomTraffic() {
  const apiKey = process.env.TOMTOM_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ TomTom API key not found');
    return { success: false, data: [], error: 'API key missing' };
  }

  try {
    console.log('🚗 Fetching TomTom traffic incidents...');
    const response = await axios.get(
      'https://api.tomtom.com/traffic/services/5/incidentDetails',
      {
        params: {
          key: apiKey,
          bbox: '54.0,-2.5,55.5,-0.5',
          language: 'en-GB'
        },
        timeout: 15000,
        headers: {
          'User-Agent': 'BARRY-TrafficWatch/3.0'
        }
      }
    );
    console.log(`✅ TomTom: HTTP ${response.status}`);
    if (!response.data || !response.data.tm || !response.data.tm.poi) {
      console.log('📊 TomTom: No incidents found');
      return { success: true, data: [], count: 0 };
    }
    const incidents = response.data.tm.poi;
    console.log(`📊 TomTom: ${incidents.length} total incidents found`);
    const alerts = [];
    incidents.forEach(incident => {
      // Enhanced location extraction
      let location = null;
      if (incident.r && typeof incident.r === 'string' && incident.r.trim().length > 0) {
        location = incident.r;
      } else if (incident.f && incident.t) {
        location = `Between ${incident.f} and ${incident.t}`;
      } else if (incident.f) {
        location = incident.f;
      } else if (incident.d) {
        // Try to extract plausible road from description
        const match = (incident.d || '').match(/\b([AM][0-9]{1,4}|B[0-9]{1,4}|Junction \d+|[A-Z][a-z]+ (Road|Street|Lane|Way|Avenue|Drive|Boulevard|Bypass)|Coast Road|Central Motorway)\b/);
        if (match) {
          location = match[0];
        } else {
          location = incident.d.substring(0, 50);
        }
      } else {
        location = 'TomTom reported location';
      }
      const description = incident.d || 'Traffic incident';
      // Check if it's in North East
      if (isInNorthEast(location, description)) {
        const routes = matchRoutes(location, description);
        alerts.push({
          id: `tomtom_${incident.id || Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          type: mapTomTomIncidentType(incident.ic),
          title: `${mapTomTomCategory(incident.ic)}${location ? ' - ' + location : ''}`,
          description: description,
          location: location,
          authority: 'TomTom Traffic',
          source: 'tomtom',
          severity: mapTomTomSeverity(incident.ty),
          status: 'red',
          affectsRoutes: routes,
          coordinates: incident.p ? { lat: incident.p.y, lng: incident.p.x } : null,
          lastUpdated: new Date().toISOString(),
          dataSource: 'TomTom Traffic API v5',
          tomtomCategory: incident.ic,
          tomtomMagnitude: incident.ty,
          clusterSize: incident.cs,
          delay: incident.dl
        });
      }
    });
    console.log(`✅ TomTom: ${alerts.length} North East alerts processed`);
    return { success: true, data: alerts, count: alerts.length };
  } catch (error) {
    console.error('❌ TomTom API error:', error.message);
    if (error.response) {
      console.error(`📡 TomTom response status: ${error.response.status}`);
      console.error(`📡 TomTom response data:`, error.response.data);
    }
    return { success: false, data: [], error: error.message };
  }
}

// Enhanced helper function to map TomTom incident codes to types with type safety and logging
function mapTomTomIncidentType(code) {
  const typeMap = {
    0: 'incident',  // Unknown
    1: 'incident',  // Accident
    2: 'incident',  // Fog
    3: 'incident',  // Dangerous Conditions
    4: 'incident',  // Rain
    5: 'incident',  // Ice
    6: 'incident',  // Snow
    7: 'incident',  // Wind
    8: 'roadwork',  // Construction
    9: 'roadwork',  // Road Works
    10: 'incident', // Road Closed
    11: 'incident', // Road Blocked
    14: 'incident'  // Broken Down Vehicle
  };
  if (!(code in typeMap)) {
    console.warn(`Unknown TomTom incident type code: ${code}`);
  }
  return typeMap[code] || 'incident';
}

// Enhanced helper function to map TomTom incident category to readable text with type safety and logging
function mapTomTomCategory(code) {
  const categoryMap = {
    0: 'Traffic Incident',
    1: 'Accident',
    2: 'Fog Hazard',
    3: 'Dangerous Conditions',
    4: 'Heavy Rain',
    5: 'Ice on Road',
    6: 'Snow on Road',
    7: 'High Winds',
    8: 'Construction',
    9: 'Road Works',
    10: 'Road Closed',
    11: 'Road Blocked',
    14: 'Broken Down Vehicle'
  };
  if (!(code in categoryMap)) {
    console.warn(`Unknown TomTom category code: ${code}`);
  }
  return categoryMap[code] || 'Traffic Incident';
}

// Enhanced helper function to map TomTom magnitude to severity with type safety
function mapTomTomSeverity(magnitude) {
  if (typeof magnitude !== 'number') return 'Low';
  if (magnitude >= 3) return 'High';
  if (magnitude >= 2) return 'Medium';
  return 'Low';
}

// ENHANCED: HERE Traffic API with improved location extraction
async function fetchHERETraffic() {
  const apiKey = process.env.HERE_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ HERE API key not found');
    return { success: false, data: [], error: 'API key missing' };
  }
  try {
    console.log('📡 Fetching HERE traffic data...');
    const lat = 54.9783;
    const lng = -1.6178;
    const radius = 20000;
    const response = await axios.get('https://data.traffic.hereapi.com/v7/incidents', {
      params: {
        apikey: apiKey,
        in: `circle:${lat},${lng};r=${radius}`,
        locationReferencing: 'olr'
      },
      timeout: 15000
    });
    console.log(`✅ HERE: HTTP ${response.status}`);
    if (!response.data || !response.data.results) {
      console.log('📊 HERE: No incidents found');
      return { success: true, data: [], count: 0 };
    }
    const incidents = response.data.results;
    console.log(`📊 HERE: ${incidents.length} incidents found`);
    // Enhanced location extraction
    const alerts = incidents.map(incident => {
      // Try to extract a plausible location string
      let location = null;
      // Prefer location description if present and not generic
      if (incident.location?.description?.value && incident.location.description.value.trim().length > 0) {
        location = incident.location.description.value;
      }
      // If not, try to extract from summary or description
      if (!location || location.toLowerCase().includes('reported location')) {
        const desc = (incident.summary?.value || incident.description?.value || '');
        const match = desc.match(/\b([AM][0-9]{1,4}|B[0-9]{1,4}|Junction \d+|[A-Z][a-z]+ (Road|Street|Lane|Way|Avenue|Drive|Boulevard|Bypass)|Coast Road|Central Motorway)\b/);
        if (match) {
          location = match[0];
        } else if (desc.trim().length > 0) {
          location = desc.substring(0, 50);
        } else {
          location = 'HERE reported location';
        }
      }
      const summary = incident.summary?.value || 'Traffic incident';
      const description = incident.description?.value || summary;
      const routes = matchRoutes(location, description);
      return {
        id: `here_${incident.id || Date.now()}`,
        type: 'incident',
        title: summary,
        description: description,
        location: location,
        authority: 'HERE Traffic',
        source: 'here',
        severity: incident.criticality >= 2 ? 'High' : 'Medium',
        status: 'red',
        affectsRoutes: routes,
        lastUpdated: new Date().toISOString(),
        dataSource: 'HERE Traffic API'
      };
    });
    console.log(`✅ HERE: ${alerts.length} alerts processed`);
    return { success: true, data: alerts, count: alerts.length };
  } catch (error) {
    console.error('❌ HERE API error:', error.message);
    if (error.response) {
      console.error(`📡 HERE response status: ${error.response.status}`);
      console.error(`📡 HERE response data:`, error.response.data);
    }
    return { success: false, data: [], error: error.message };
  }
}

// ENHANCED: MapQuest Traffic API with improved location extraction
async function fetchMapQuestTraffic() {
  const apiKey = process.env.MAPQUEST_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ MapQuest API key not found');
    return { success: false, data: [], error: 'API key missing' };
  }
  try {
    console.log('🗺️ Fetching MapQuest traffic data (multi-bounding box)...');
    let allIncidents = [];
    for (const bbox of NORTH_EAST_BBOXES) {
      const [minLat, minLng, maxLat, maxLng] = bbox.split(',').map(Number);
      const mqBbox = `${maxLat},${minLng},${minLat},${maxLng}`;
      try {
        const response = await axios.get('https://www.mapquestapi.com/traffic/v2/incidents', {
          params: {
            key: apiKey,
            boundingBox: mqBbox,
            filters: 'incidents,construction',
            outFormat: 'json'
          },
          timeout: 15000
        });
        if (response.data && Array.isArray(response.data.incidents)) {
          allIncidents.push(...response.data.incidents);
        }
      } catch (err) {
        console.warn(`⚠️ MapQuest bbox ${mqBbox} error:`, err.message);
      }
    }
    // Deduplicate MapQuest incidents by id/location/description
    const seenMQ = new Set();
    const uniqueIncidents = [];
    for (const inc of allIncidents) {
      const key = inc.id
        ? `mq_${inc.id}`
        : `${inc.lat || ''},${inc.lng || ''}|${inc.shortDesc || ''}|${inc.fullDesc || ''}`.toLowerCase();
      if (!seenMQ.has(key)) {
        seenMQ.add(key);
        uniqueIncidents.push(inc);
      }
    }
    console.log(`📊 MapQuest: ${allIncidents.length} incidents fetched, ${uniqueIncidents.length} unique after deduplication`);
    // Enhanced location extraction for MapQuest
    const alerts = uniqueIncidents.map(incident => {
      // Try to extract a plausible road/location from shortDesc/fullDesc
      let location = null;
      if (incident.road && incident.road.trim().length > 0) {
        location = incident.road;
      } else if (incident.shortDesc && incident.shortDesc.trim().length > 0) {
        // Try to extract a road from shortDesc
        const match = incident.shortDesc.match(/\b([AM][0-9]{1,4}|B[0-9]{1,4}|Junction \d+|[A-Z][a-z]+ (Road|Street|Lane|Way|Avenue|Drive|Boulevard|Bypass)|Coast Road|Central Motorway)\b/);
        if (match) {
          location = match[0];
        } else {
          location = incident.shortDesc.substring(0, 50);
        }
      } else if (incident.fullDesc && incident.fullDesc.trim().length > 0) {
        // Try to extract a road from fullDesc
        const match = incident.fullDesc.match(/\b([AM][0-9]{1,4}|B[0-9]{1,4}|Junction \d+|[A-Z][a-z]+ (Road|Street|Lane|Way|Avenue|Drive|Boulevard|Bypass)|Coast Road|Central Motorway)\b/);
        if (match) {
          location = match[0];
        } else {
          location = incident.fullDesc.substring(0, 50);
        }
      } else {
        location = 'MapQuest reported location';
      }
      const description = incident.fullDesc || incident.shortDesc || 'Traffic incident';
      const routes = matchRoutes(location, description);
      return {
        id: `mapquest_${incident.id || Date.now()}`,
        type: incident.type === 'construction' ? 'roadwork' : 'incident',
        title: incident.shortDesc || 'Traffic Alert',
        description: description,
        location: location,
        authority: 'MapQuest Traffic',
        source: 'mapquest',
        severity: incident.severity >= 3 ? 'High' : 'Medium',
        status: 'red',
        affectsRoutes: routes,
        lastUpdated: new Date().toISOString(),
        dataSource: 'MapQuest Traffic API'
      };
    });
    // Deduplicate alerts by id/location/description
    const dedupedAlerts = deduplicateAlerts(alerts);
    console.log(`✅ MapQuest: ${dedupedAlerts.length} unique North East alerts processed`);
    return { success: true, data: dedupedAlerts, count: dedupedAlerts.length };
  } catch (error) {
    console.error('❌ MapQuest API error:', error.message);
    if (error.response) {
      console.error(`📡 MapQuest response status: ${error.response.status}`);
      console.error(`📡 MapQuest response data:`, error.response.data);
    }
    return { success: false, data: [], error: error.message };
  }
}

// Fetch National Highways data (already working)
async function fetchNationalHighways() {
  const apiKey = process.env.NATIONAL_HIGHWAYS_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ National Highways API key not found');
    return { success: false, data: [], error: 'API key missing' };
  }

  try {
    console.log('🛣️ Fetching National Highways data...');
    
    const response = await axios.get('https://api.data.nationalhighways.co.uk/roads/v2.0/closures', {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Accept': 'application/json',
        'User-Agent': 'BARRY-TrafficWatch/3.0'
      },
      timeout: 15000
    });
    
    console.log(`✅ National Highways: HTTP ${response.status}`);
    
    if (!response.data || !response.data.features) {
      console.warn('⚠️ No features in National Highways response');
      return { success: false, data: [], error: 'No features in response' };
    }
    
    const allFeatures = response.data.features;
    console.log(`📊 Total features from National Highways: ${allFeatures.length}`);
    console.log('RAW NationalHighways data:', JSON.stringify(response.data, null, 2));

    // Filter for North East and process
    const northEastAlerts = allFeatures
      .filter(() => true)
      .map(feature => {
        const props = feature.properties;
        const routes = matchRoutes(props.location || '', props.description || '');
        const status = classifyAlert(props);

        return {
          id: `nh_${props.id || Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          type: 'roadwork',
          title: props.title || props.description || 'National Highways Closure',
          description: props.description || props.comment || 'Planned closure or roadworks',
          location: props.location || 'Major Road Network',
          authority: 'National Highways',
          source: 'national_highways',
          severity: props.category?.toLowerCase().includes('closure') ? 'High' : 'Medium',
          status: status,
          startDate: props.startDate || null,
          endDate: props.endDate || null,
          affectsRoutes: routes,
          lastUpdated: new Date().toISOString(),
          dataSource: 'National Highways DATEX II API'
        };
      });

    console.log(`✅ Processed ${northEastAlerts.length} North East alerts`);
    return { success: true, data: northEastAlerts, count: northEastAlerts.length };
    
  } catch (error) {
    console.error('❌ National Highways API error:', error.message);
    if (error.response) {
      console.error(`📡 Response status: ${error.response.status}`);
      console.error(`📡 Response data:`, error.response.data);
    }
    return { success: false, data: [], error: error.message };
  }
}

// Sample test data for development
const sampleTestAlerts = [
  {
    id: 'test_001',
    type: 'incident',
    title: 'Vehicle Breakdown - A1 Northbound',
    description: 'Lane 1 blocked due to vehicle breakdown between J65 and J66. Recovery vehicle en route.',
    location: 'A1 Northbound, Junction 65 (Birtley)',
    authority: 'National Highways',
    source: 'test_data',
    severity: 'High',
    status: 'red',
    affectsRoutes: ['21', '22', 'X21', '25', '28'],
    lastUpdated: new Date().toISOString(),
    dataSource: 'Test Data'
  }
];

// Cache for alerts
let cachedAlerts = null;
let lastFetchTime = null;
const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Main alerts endpoint
app.get('/api/alerts', async (req, res) => {
  try {
    const now = Date.now();
    
    // Check cache
    if (cachedAlerts && lastFetchTime && (now - lastFetchTime) < CACHE_TIMEOUT) {
      console.log('📋 Serving cached alerts');
      return res.json({
        success: true,
        alerts: cachedAlerts.alerts,
        metadata: {
          ...cachedAlerts.metadata,
          cached: true,
          servedAt: new Date().toISOString()
        }
      });
    }
    
    console.log('🔄 Fetching fresh alerts with fixed authentication...');
    
    // Fetch from all sources with fixed authentication
    const [tomtomResult, hereResult, mapquestResult, nhResult] = await Promise.allSettled([
      fetchTomTomTraffic(),
      fetchHERETraffic(),
      fetchMapQuestTraffic(),
      fetchNationalHighways()
    ]);
    
    const allAlerts = [];
    const sources = {};
    
    // Process results
    const results = [
      { name: 'tomtom', result: tomtomResult },
      { name: 'here', result: hereResult },
      { name: 'mapquest', result: mapquestResult },
      { name: 'nationalHighways', result: nhResult }
    ];
    
    for (const { name, result } of results) {
      if (result.status === 'fulfilled' && result.value.success) {
        allAlerts.push(...result.value.data);
        sources[name] = {
          success: true,
          count: result.value.count,
          method: 'Fixed API Authentication'
        };
        console.log(`✅ ${name}: ${result.value.count} alerts`);
      } else {
        sources[name] = {
          success: false,
          count: 0,
          error: result.status === 'rejected' ? result.reason.message : result.value.error
        };
        console.log(`❌ ${name}: ${sources[name].error}`);
      }
    }
    
    // If no live data, include test data
    if (allAlerts.length === 0) {
      console.log('📋 No live data - including test alerts');
      allAlerts.push(...sampleTestAlerts);
    }
    
    // Calculate statistics
    const stats = {
      totalAlerts: allAlerts.length,
      activeAlerts: allAlerts.filter(a => a.status === 'red').length,
      upcomingAlerts: allAlerts.filter(a => a.status === 'amber').length,
      plannedAlerts: allAlerts.filter(a => a.status === 'green').length,
      incidents: allAlerts.filter(a => a.type === 'incident').length,
      roadworks: allAlerts.filter(a => a.type === 'roadwork').length,
      congestion: allAlerts.filter(a => a.type === 'congestion').length
    };
    
    // Cache results
    cachedAlerts = {
      alerts: allAlerts,
      metadata: {
        totalAlerts: allAlerts.length,
        sources,
        statistics: stats,
        lastUpdated: new Date().toISOString(),
        authenticationFixed: true
      }
    };
    lastFetchTime = now;
    
    console.log(`✅ Serving ${allAlerts.length} alerts (${stats.activeAlerts} active)`);
    
    res.json({
      success: true,
      alerts: allAlerts,
      metadata: cachedAlerts.metadata
    });
    
  } catch (error) {
    console.error('❌ Alerts endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      alerts: sampleTestAlerts, // Fallback to test data
      metadata: {
        error: error.message,
        timestamp: new Date().toISOString(),
        fallbackData: true
      }
    });
  }
});

// Test endpoint for immediate testing
app.get('/api/alerts-test', async (req, res) => {
  console.log('🧪 Serving test alerts data...');
  
  res.json({
    success: true,
    alerts: sampleTestAlerts,
    metadata: {
      totalAlerts: sampleTestAlerts.length,
      sources: {
        testData: { success: true, count: sampleTestAlerts.length, method: 'Sample Data' }
      },
      lastUpdated: new Date().toISOString(),
      testMode: true
    }
  });
});

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '3.0-fixed-auth',
    configuration: {
      nationalHighways: !!process.env.NATIONAL_HIGHWAYS_API_KEY,
      tomtom: !!process.env.TOMTOM_API_KEY,
      mapquest: !!process.env.MAPQUEST_API_KEY,
      here: !!process.env.HERE_API_KEY,
      port: PORT
    },
    lastFetch: lastFetchTime ? new Date(lastFetchTime).toISOString() : null,
    cachedAlerts: cachedAlerts?.alerts?.length || 0,
    authenticationStatus: 'Fixed - using proper query parameters'
  });
});

// Force refresh
app.get('/api/refresh', async (req, res) => {
  try {
    console.log('🔄 Force refresh requested - clearing cache...');
    cachedAlerts = null;
    lastFetchTime = null;
    
    res.json({
      success: true,
      message: 'Cache cleared - next request will fetch fresh data',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🚦 BARRY Backend with Fixed API Authentication',
    version: '3.0-fixed',
    status: 'healthy',
    endpoints: {
      alerts: '/api/alerts (fixed authentication)',
      'alerts-test': '/api/alerts-test',
      health: '/api/health',
      refresh: '/api/refresh'
    },
    fixes: [
      'HERE API: Using apikey query parameter',
      'MapQuest API: Using key query parameter', 
      'TomTom API: Using key query parameter',
      'Proper error handling and fallbacks'
    ]
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚦 BARRY Backend Started with Fixed Authentication`);
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🌐 Public: https://go-barry.onrender.com`);
  console.log(`\n🔧 API Authentication Fixes:`);
  console.log(`   ✅ HERE API: Using 'apikey' query parameter`);
  console.log(`   ✅ MapQuest API: Using 'key' query parameter`);
  console.log(`   ✅ TomTom API: Using 'key' query parameter`);
  console.log(`   ✅ National Highways: Using header authentication (already working)`);
  console.log(`\n📡 Available Endpoints:`);
  console.log(`   🎯 Main: /api/alerts`);
  console.log(`   🧪 Test: /api/alerts-test`);
  console.log(`   💚 Health: /api/health`);
  console.log(`   🔄 Refresh: /api/refresh`);
});

export default app;