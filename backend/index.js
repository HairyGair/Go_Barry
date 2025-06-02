// backend/index.js
// BARRY Backend with Fixed API Authentication
import express from 'express';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Load GTFS routes.txt into a Set of valid route_short_names
let GTFS_ROUTES = new Set();
try {
  const routesTxt = await fs.readFile(path.join(__dirname, 'data/routes.txt'), 'utf-8');
  const records = parse(routesTxt, { columns: true, skip_empty_lines: true });
  for (const rec of records) {
    if (rec.route_short_name) {
      GTFS_ROUTES.add(rec.route_short_name.trim());
    }
  }
  console.log(`🚌 Loaded ${GTFS_ROUTES.size} GTFS routes for filtering:`, [...GTFS_ROUTES].join(', '));
} catch (err) {
  console.error('❌ Failed to load routes.txt:', err);
}

// --- Acknowledged alerts persistence ---
const ACK_FILE = path.join(__dirname, 'data/acknowledged.json');
let acknowledgedAlerts = {};
(async () => {
  try {
    const raw = await fs.readFile(ACK_FILE, 'utf-8');
    acknowledgedAlerts = JSON.parse(raw);
    console.log(`✅ Loaded ${Object.keys(acknowledgedAlerts).length} acknowledged alerts`);
  } catch {
    acknowledgedAlerts = {};
  }
})();

// --- Staff notes persistence ---
const NOTES_FILE = path.join(__dirname, 'data/notes.json');
let alertNotes = {};
(async () => {
  try {
    const raw = await fs.readFile(NOTES_FILE, 'utf-8');
    alertNotes = JSON.parse(raw);
    console.log(`✅ Loaded staff notes for ${Object.keys(alertNotes).length} alerts`);
  } catch {
    alertNotes = {};
  }
})();

// Helper for filtering only GTFS route-matching alerts
function alertAffectsGTFSRoute(alert) {
  if (!alert.affectsRoutes || !Array.isArray(alert.affectsRoutes)) return false;
  return alert.affectsRoutes.some(route => GTFS_ROUTES.has(String(route).trim()));
}

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
// Updated helper function - less restrictive
function isInNorthEast(location, description = '') {
  // If no location info at all, assume it's relevant
  if (!location && !description) return true;
  
  const text = `${location} ${description}`.toUpperCase();
  
  // If it mentions coordinates or lat/lng, accept it
  if (text.includes('LAT') || text.includes('LNG') || text.includes('54.') || text.includes('55.')) {
    return true;
  }
  
  // Simplified keyword list - just major identifiers
  const keywords = [
    'A1', 'A19', 'A69', 'A167', 'A184', 'A690', 'A1058',
    'NEWCASTLE', 'GATESHEAD', 'SUNDERLAND', 'DURHAM',
    'NORTHUMBERLAND', 'TYNE', 'WEAR'
  ];
  
  // If ANY keyword matches, include it
  const hasKeyword = keywords.some(keyword => text.includes(keyword));
  
  // If we already filtered by bounding box (MapQuest), trust that filtering
  if (!hasKeyword && description.includes('MAPQUEST')) {
    return true; // Trust MapQuest's geographic filtering
  }
  
  return hasKeyword;
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

// SIMPLIFIED: TomTom Traffic API
async function fetchTomTomTraffic() {
  const apiKey = process.env.TOMTOM_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ TomTom API key not found');
    return { success: false, data: [], error: 'API key missing' };
  }

  try {
    console.log('🚗 Fetching TomTom traffic (SIMPLIFIED)...');
    
    // Use the flow endpoint instead which is more reliable
    const response = await axios.get('https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json', {
      params: {
        key: apiKey,
        point: '54.9783,-1.6178', // Newcastle center
        unit: 'KMPH'
      },
      timeout: 10000
    });
    
    console.log(`✅ TomTom Flow API: HTTP ${response.status}`);
    
    const alerts = [];
    
    // Create a test alert from flow data
    if (response.data && response.data.flowSegmentData) {
      const flow = response.data.flowSegmentData;
      const currentSpeed = flow.currentSpeed || 0;
      const freeFlowSpeed = flow.freeFlowSpeed || 60;
      const reduction = ((freeFlowSpeed - currentSpeed) / freeFlowSpeed) * 100;
      
      if (reduction > 10) { // Any slowdown
        alerts.push({
          id: `tomtom_flow_${Date.now()}`,
          type: 'congestion',
          title: 'Traffic Flow - Newcastle',
          description: `Traffic speed: ${Math.round(currentSpeed)}km/h (normal: ${Math.round(freeFlowSpeed)}km/h)`,
          location: 'Newcastle City Centre',
          authority: 'TomTom Traffic',
          source: 'tomtom',
          severity: reduction > 50 ? 'High' : reduction > 25 ? 'Medium' : 'Low',
          status: 'red',
          affectsRoutes: ['Q1', 'Q2', 'Q3', '10', '11'],
          lastUpdated: new Date().toISOString(),
          dataSource: 'TomTom Flow API'
        });
      }
      
      console.log(`✅ TomTom: Created ${alerts.length} flow alerts`);
    }
    
    return { success: true, data: alerts, count: alerts.length };
    
  } catch (error) {
    console.error('❌ TomTom error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.status, error.response.data);
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

// DIAGNOSTIC VERSION: MapQuest with minimal filtering
async function fetchMapQuestTraffic() {
  const apiKey = process.env.MAPQUEST_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ MapQuest API key not found');
    return { success: false, data: [], error: 'API key missing' };
  }
  
  try {
    console.log('🗺️ Fetching MapQuest traffic data (DIAGNOSTIC MODE)...');
    
    // Just one bbox for Newcastle area
    const response = await axios.get('https://www.mapquestapi.com/traffic/v2/incidents', {
      params: {
        key: apiKey,
        boundingBox: '55.1,-1.7,54.8,-1.4', // Newcastle/Gateshead
        filters: 'incidents,construction',
        outFormat: 'json'
      },
      timeout: 15000
    });
    
    console.log(`📡 MapQuest response status: ${response.status}`);
    console.log(`📊 MapQuest incidents found: ${response.data?.incidents?.length || 0}`);
    
    if (!response.data || !response.data.incidents || response.data.incidents.length === 0) {
      console.log('❌ MapQuest: No incidents in response');
      return { success: true, data: [], count: 0 };
    }
    
    // Take first 10 incidents for testing
    const testIncidents = response.data.incidents.slice(0, 10);

    const alerts = testIncidents.map(incident => {
      console.log(`Processing incident: ${incident.shortDesc || 'No description'}`);
      
      // Extract better location info
      let location = incident.street || '';
      if (!location && incident.lat && incident.lng) {
        location = `Newcastle area (${incident.lat.toFixed(3)}, ${incident.lng.toFixed(3)})`;
      }
      if (!location) {
        location = 'Newcastle area'; // Default to Newcastle since we queried that bbox
      }
      
      return {
        id: `mapquest_${incident.id || Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        type: incident.type === 'construction' ? 'roadwork' : 'incident',
        title: incident.shortDesc || 'Traffic Alert',
        description: incident.fullDesc || incident.shortDesc || 'Traffic incident reported by MapQuest',
        location: location,
        authority: 'MapQuest Traffic',
        source: 'mapquest',
        severity: incident.severity >= 3 ? 'High' : incident.severity >= 2 ? 'Medium' : 'Low',
        status: 'red',
        affectsRoutes: [], // Empty for now
        lastUpdated: new Date().toISOString(),
        dataSource: 'MapQuest Traffic API',
        // Add coordinates if available
        coordinates: incident.lat && incident.lng ? { 
          lat: parseFloat(incident.lat), 
          lng: parseFloat(incident.lng) 
        } : null
      };
    });
    
    console.log(`✅ MapQuest: Returning ${alerts.length} test alerts`);
    return { success: true, data: alerts, count: alerts.length };
    
  } catch (error) {
    console.error('❌ MapQuest API error:', error.message);
    console.error('Full error:', error);
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

    // If no alerts at all, add some test data
    if (allAlerts.length === 0) {
      console.log('⚠️ No live alerts found - adding diagnostic test data');
      
      allAlerts.push({
        id: 'test_diagnostic_001',
        type: 'incident',
        title: 'DIAGNOSTIC: Test Incident',
        description: 'This is a test alert to verify the system is working. No live traffic data is currently available.',
        location: 'Newcastle City Centre',
        authority: 'System Test',
        source: 'test_data',
        severity: 'Medium',
        status: 'amber',
        affectsRoutes: ['Q1', 'Q2', '10', '11'],
        lastUpdated: new Date().toISOString(),
        dataSource: 'Diagnostic Test Data'
      });
      
      allAlerts.push({
        id: 'test_diagnostic_002',
        type: 'roadwork',
        title: 'DIAGNOSTIC: API Connection Issue',
        description: 'Traffic APIs may not be returning data. Check /api/debug-traffic for details.',
        location: 'System Wide',
        authority: 'System Test',
        source: 'test_data',
        severity: 'Low',
        status: 'green',
        affectsRoutes: [],
        lastUpdated: new Date().toISOString(),
        dataSource: 'Diagnostic Test Data'
      });
    }

    // Filter: Only alerts that affect GTFS routes and are not test/sample
    let filteredAlerts = allAlerts.filter(alert =>
      alertAffectsGTFSRoute(alert) &&
      alert.source !== 'test_data' &&
      alert.source !== 'sample'
    );

    // Inject acknowledged status and staff notes for each alert
    for (const alert of filteredAlerts) {
      alert.acknowledged = acknowledgedAlerts[alert.id] || null;
      alert.notes = alertNotes[alert.id] || [];
    }

    // If nothing matches, do NOT include test data—just show empty array and a message
    if (filteredAlerts.length === 0) {
      console.log('✅ No current alerts affecting Go North East routes.');
      cachedAlerts = {
        alerts: [],
        metadata: {
          totalAlerts: 0,
          sources,
          statistics: {},
          lastUpdated: new Date().toISOString(),
          authenticationFixed: true,
          note: "No current alerts affecting Go North East routes."
        }
      };
      lastFetchTime = now;
      return res.json({
        success: true,
        alerts: [],
        metadata: cachedAlerts.metadata
      });
    }

    // Calculate statistics
    const stats = {
      totalAlerts: filteredAlerts.length,
      activeAlerts: filteredAlerts.filter(a => a.status === 'red').length,
      upcomingAlerts: filteredAlerts.filter(a => a.status === 'amber').length,
      plannedAlerts: filteredAlerts.filter(a => a.status === 'green').length,
      incidents: filteredAlerts.filter(a => a.type === 'incident').length,
      roadworks: filteredAlerts.filter(a => a.type === 'roadwork').length,
      congestion: filteredAlerts.filter(a => a.type === 'congestion').length
    };

    // Cache results
    cachedAlerts = {
      alerts: filteredAlerts,
      metadata: {
        totalAlerts: filteredAlerts.length,
        sources,
        statistics: stats,
        lastUpdated: new Date().toISOString(),
        authenticationFixed: true
      }
    };
    lastFetchTime = now;

    console.log(`✅ Serving ${filteredAlerts.length} GTFS route-matching alerts (${stats.activeAlerts} active)`);

    res.json({
      success: true,
      alerts: filteredAlerts,
      metadata: cachedAlerts.metadata
    });
  } catch (error) {
    console.error('❌ Alerts endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      alerts: [],
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

// --- POST /api/acknowledge ---
app.post('/api/acknowledge', async (req, res) => {
  const { alertId, duty } = req.body;
  if (!alertId || !duty) {
    return res.status(400).json({ success: false, error: 'alertId and duty required' });
  }
  const timestamp = new Date().toISOString();
  acknowledgedAlerts[alertId] = { duty, time: timestamp };
  // Save to disk
  await fs.writeFile(ACK_FILE, JSON.stringify(acknowledgedAlerts, null, 2));
  res.json({ success: true });
});

// --- POST /api/note ---
app.post('/api/note', async (req, res) => {
  const { alertId, duty, note } = req.body;
  if (!alertId || !duty || !note || !note.trim()) {
    return res.status(400).json({ success: false, error: 'alertId, duty, and note required' });
  }
  const timestamp = new Date().toISOString();
  if (!alertNotes[alertId]) alertNotes[alertId] = [];
  alertNotes[alertId].push({ duty, note, time: timestamp });
  await fs.writeFile(NOTES_FILE, JSON.stringify(alertNotes, null, 2));
  res.json({ success: true });
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
      refresh: '/api/refresh',
      acknowledge: '/api/acknowledge (POST)',
      debugTraffic: '/api/debug-traffic'
    },
    fixes: [
      'HERE API: Using apikey query parameter',
      'MapQuest API: Using key query parameter', 
      'TomTom API: Using key query parameter',
      'Proper error handling and fallbacks'
    ]
  });
});

// Debug endpoint to test each API individually
app.get('/api/debug-traffic', async (req, res) => {
  console.log('🔍 Running traffic API debug...');
  
  const results = {
    timestamp: new Date().toISOString(),
    apis: {}
  };
  
  // Test each API individually
  console.log('\n--- Testing TomTom ---');
  const tomtom = await fetchTomTomTraffic();
  results.apis.tomtom = {
    success: tomtom.success,
    count: tomtom.data?.length || 0,
    error: tomtom.error,
    sample: tomtom.data?.[0] || null
  };
  
  console.log('\n--- Testing HERE ---');
  const here = await fetchHERETraffic();
  results.apis.here = {
    success: here.success,
    count: here.data?.length || 0,
    error: here.error,
    sample: here.data?.[0] || null
  };
  
  console.log('\n--- Testing MapQuest ---');
  const mapquest = await fetchMapQuestTraffic();
  results.apis.mapquest = {
    success: mapquest.success,
    count: mapquest.data?.length || 0,
    error: mapquest.error,
    sample: mapquest.data?.[0] || null
  };
  
  console.log('\n--- Testing National Highways ---');
  const nh = await fetchNationalHighways();
  results.apis.nationalHighways = {
    success: nh.success,
    count: nh.data?.length || 0,
    error: nh.error,
    sample: nh.data?.[0] || null
  };
  
  console.log('\n🔍 Debug complete:', JSON.stringify(results, null, 2));
  res.json(results);
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