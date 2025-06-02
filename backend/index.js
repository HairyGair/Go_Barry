// backend/index.js
// BARRY Backend with Fixed API Authentication
import express from 'express';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { parse } from 'csv-parse/sync';

import fetchTomTomTrafficGeoJSON from './tomtom-fixed-implementation.js';
import enhanceLocationWithNames from './location-enhancer.js';

import {
  initializeGTFSOptimized as initializeGTFS,
  getGTFSStatsOptimized as getGTFSStats,
  enhanceLocationWithGTFSOptimized
} from './gtfs-location-enhancer-optimized.js';

// --- BEGIN fetchTomTomTrafficSimple ---
// Simple working TomTom fetcher (roadworks only, no filtering)
async function fetchTomTomTrafficSimple() {
  if (!process.env.TOMTOM_API_KEY) {
    return { success: false, data: [], error: 'API key missing' };
  }
  
  try {
    console.log('🚗 Fetching TomTom traffic (simple working version)...');
    const response = await axios.get('https://api.tomtom.com/traffic/services/5/incidentDetails', {
      params: {
        key: process.env.TOMTOM_API_KEY,
        bbox: '-1.8,54.8,-1.4,55.1',
        zoom: 10
      },
      timeout: 15000
    });
    console.log(`✅ TomTom simple: ${response.status}, incidents: ${response.data?.incidents?.length || 0}`);
    const alerts = [];
    if (response.data?.incidents) {
      response.data.incidents.slice(0, 10).forEach((feature, index) => {
        const props = feature.properties || {};
        if (props.iconCategory === 6 || props.iconCategory === 7) {
          let lat = null, lng = null;
          if (feature.geometry?.coordinates) {
            if (feature.geometry.type === 'Point') {
              [lng, lat] = feature.geometry.coordinates;
            } else if (feature.geometry.type === 'LineString') {
              [lng, lat] = feature.geometry.coordinates[0];
            }
          }
          if (lat && lng) {
            alerts.push({
              id: `tomtom_simple_${index}`,
              type: 'roadwork',
              title: props.iconCategory === 6 ? 'Road Closure' : 'Road Works',
              description: 'TomTom reported roadwork',
              location: `Newcastle Area (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
              coordinates: [lat, lng],
              severity: 'Medium',
              status: 'red',
              source: 'tomtom',
              affectsRoutes: [],
              lastUpdated: new Date().toISOString(),
              dataSource: 'TomTom Simple Working Version'
            });
          }
        }
      });
    }
    console.log(`✅ TomTom simple: ${alerts.length} roadworks processed`);
    return { success: true, data: alerts };
  } catch (error) {
    console.error('❌ TomTom simple failed:', error.message);
    return { success: false, data: [], error: error.message };
  }
}
// --- END fetchTomTomTrafficSimple ---

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
// --- GTFS Location Enhancement Initialization ---
console.log('🗺️ Initializing GTFS location enhancement...');
setTimeout(async () => {
  try {
    console.log('🔄 Loading optimized GTFS data...');
    const gtfsSuccess = await initializeGTFS();
    if (gtfsSuccess) {
      const stats = getGTFSStats();
      console.log('✅ Optimized GTFS Enhancement Ready:');
      console.log(`   📍 ${stats.stops} bus stops loaded`);
      console.log(`   🚌 ${stats.routes} routes mapped`);
      console.log(`   💾 Memory optimized for Render`);
      console.log(`   ⚠️ Shapes processing skipped to prevent memory issues`);
    } else {
      console.log('❌ GTFS initialization failed - using basic processing');
    }
  } catch (error) {
    console.log(`❌ GTFS error: ${error.message}`);
  }
}, 3000);

console.log(`
🔧 MEMORY OPTIMIZATION APPLIED:
   ✅ Skips 34MB shapes processing
   ✅ Limits stops to prevent memory issues  
   ✅ Uses simplified spatial matching
   ✅ Still enhances locations with nearby stops
   ⚠️ Reduced accuracy but stable deployment
`);
// --- Enhanced Alerts Endpoint with GTFS Location Accuracy ---
app.get('/api/alerts-enhanced', async (req, res) => {
  try {
    console.log('🚀 Fetching enhanced alerts with GTFS location accuracy...');
    const tomtomResult = await fetchTomTomTrafficOptimized();
    const allAlerts = [];
    const sources = {};
    if (tomtomResult.success) {
      allAlerts.push(...tomtomResult.data);
      sources.tomtom = {
        success: true,
        count: tomtomResult.data.length,
        method: 'Enhanced with GTFS',
        enhancement: tomtomResult.enhancement
      };
    } else {
      sources.tomtom = {
        success: false,
        count: 0,
        error: tomtomResult.error
      };
    }
    const stats = {
      totalAlerts: allAlerts.length,
      activeAlerts: allAlerts.filter(a => a.status === 'red').length,
      enhancedAlerts: allAlerts.filter(a => a.locationAccuracy === 'high').length,
      alertsWithRoutes: allAlerts.filter(a => a.affectsRoutes && a.affectsRoutes.length > 0).length,
      averageRoutesPerAlert: allAlerts.length > 0 ?
        (allAlerts.reduce((sum, a) => sum + (a.affectsRoutes?.length || 0), 0) / allAlerts.length).toFixed(1) : 0
    };
    res.json({
      success: true,
      alerts: allAlerts,
      metadata: {
        totalAlerts: allAlerts.length,
        sources,
        statistics: stats,
        gtfsStats: getGTFSStats(),
        lastUpdated: new Date().toISOString(),
        enhancement: 'GTFS location accuracy enabled'
      }
    });
  } catch (error) {
    console.error('❌ Enhanced alerts endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      alerts: [],
      metadata: {
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// --- GTFS Status Endpoint ---
app.get('/api/gtfs-status', (req, res) => {
  const stats = getGTFSStats();
  res.json({
    status: stats.isLoaded ? 'loaded' : 'not_loaded',
    ...stats,
    enhancement_ready: stats.isLoaded,
    last_load_hours_ago: stats.lastLoaded ?
      Math.round((Date.now() - new Date(stats.lastLoaded)) / (1000 * 60 * 60)) : null
  });
});

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

// --- BEGIN getLocationName helper ---
// Reverse geocode coordinates to a human-friendly location name using OpenStreetMap
async function getLocationName(lat, lng) {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        lat: lat,
        lon: lng,
        format: 'json',
        addressdetails: 1
      },
      headers: {
        'User-Agent': 'BARRY-TrafficWatch/3.0'
      },
      timeout: 5000
    });

    if (response.data && response.data.display_name) {
      const addr = response.data.address || {};
      // Build a nice location description
      let location = '';
      if (addr.road) {
        location = addr.road;
      } else if (addr.pedestrian) {
        location = addr.pedestrian;
      } else if (addr.neighbourhood) {
        location = addr.neighbourhood;
      }
      if (addr.suburb || addr.town || addr.city) {
        location += `, ${addr.suburb || addr.town || addr.city}`;
      }
      return location || response.data.display_name.split(',')[0];
    }
    return null;
  } catch (error) {
    console.warn('⚠️ Reverse geocoding failed:', error.message);
    return null;
  }
}
// --- END getLocationName helper ---

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

// Fixed TomTom function for your backend
async function fetchTomTomTrafficFixed() {
  if (!process.env.TOMTOM_API_KEY) {
    return { success: false, data: [], error: 'API key missing' };
  }
  
  try {
    console.log('🚗 Fetching TomTom traffic (FIXED API format)...');
    
    // Small Newcastle area (under 10,000km² limit)
    const response = await axios.get('https://api.tomtom.com/traffic/services/5/incidentDetails', {
      params: {
        key: process.env.TOMTOM_API_KEY,
        bbox: '-1.8,54.8,-1.4,55.1', // Newcastle area bbox
        zoom: 10
      },
      timeout: 15000,
      headers: {
        'User-Agent': 'BARRY-TrafficWatch/3.0-Fixed',
        'Accept': 'application/json'
      }
    });
    
    console.log(`📡 TomTom Fixed API: ${response.status}, incidents: ${response.data?.tm?.poi?.length || 0}`);
    
    const alerts = [];
    
    if (response.data?.tm?.poi) {
      response.data.tm.poi.forEach(incident => {
        // Process incidents into your alert format
        const lat = incident.p?.y;
        const lng = incident.p?.x;
        
        if (!lat || !lng) return;
        
        // Enhanced location with GTFS if available
        const basicLocation = incident.rdN || incident.f || 'Traffic Location';
        const enhancedLocation = enhanceLocationWithGTFSOptimized 
          ? enhanceLocationWithGTFSOptimized(lat, lng, basicLocation, incident.rdN)
          : basicLocation;
        
        const alert = {
          id: `tomtom_fixed_${incident.id}`,
          type: incident.ic === 8 ? 'roadwork' : 'incident',
          title: `${incident.ty || 'Traffic Incident'} - ${incident.rdN || 'Road Network'}`,
          description: incident.d || 'Traffic incident reported',
          location: enhancedLocation,
          coordinates: [lat, lng],
          severity: incident.ic <= 2 ? 'High' : incident.ic <= 5 ? 'Medium' : 'Low',
          status: 'red',
          source: 'tomtom',
          incidentType: incident.ty,
          delay: incident.dl || 0,
          lastUpdated: new Date().toISOString(),
          dataSource: 'TomTom Traffic API v5 (Fixed Format)'
        };
        
        alerts.push(alert);
      });
    }
    
    console.log(`✅ TomTom Fixed: ${alerts.length} alerts processed`);
    return { success: true, data: alerts };
    
  } catch (error) {
    console.error('❌ TomTom Fixed API failed:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

// --- BEGIN fetchTomTomTrafficWorking and helpers ---
async function fetchTomTomTrafficWorking() {
  if (!process.env.TOMTOM_API_KEY) {
    console.warn('⚠️ TomTom API key not configured');
    return { success: false, data: [], error: 'API key missing' };
  }
  
  try {
    console.log('🚗 Fetching TomTom traffic (working GeoJSON format)...');
    
    const response = await axios.get('https://api.tomtom.com/traffic/services/5/incidentDetails', {
      params: {
        key: process.env.TOMTOM_API_KEY,
        bbox: '-1.8,54.8,-1.4,55.1', // Newcastle area
        zoom: 10
      },
      timeout: 15000,
      headers: {
        'User-Agent': 'BARRY-TrafficWatch/3.0-Working',
        'Accept': 'application/json'
      }
    });
    
    console.log(`📡 TomTom Working API: ${response.status}, incidents: ${response.data?.incidents?.length || 0}`);
    
    const alerts = [];
    
    if (response.data?.incidents) {
      response.data.incidents.forEach((feature, index) => {
        try {
          // Extract coordinates
          let lat = null, lng = null;
          if (feature.geometry?.coordinates) {
            if (feature.geometry.type === 'Point') {
              [lng, lat] = feature.geometry.coordinates;
            } else if (feature.geometry.type === 'LineString' && feature.geometry.coordinates.length > 0) {
              [lng, lat] = feature.geometry.coordinates[0];
            }
          }
          
          if (!lat || !lng) return;
          
          const props = feature.properties || {};
          
          // Enhanced location using GTFS if available
          let location = `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          if (typeof enhanceLocationWithGTFSOptimized === 'function') {
            location = enhanceLocationWithGTFSOptimized(lat, lng, '', '');
          }
          
          // Route matching based on coordinates and location
          const affectedRoutes = matchRoutesToLocation(location, lat, lng);
          
          // Map incident categories
          const getIncidentInfo = (iconCategory) => {
            const categoryMap = {
              1: { type: 'incident', severity: 'High', desc: 'Accident' },
              2: { type: 'incident', severity: 'Medium', desc: 'Dangerous Conditions' },
              3: { type: 'incident', severity: 'Low', desc: 'Weather' },
              4: { type: 'incident', severity: 'Medium', desc: 'Road Hazard' },
              5: { type: 'incident', severity: 'Low', desc: 'Vehicle Breakdown' },
              6: { type: 'roadwork', severity: 'Medium', desc: 'Road Closure' },
              7: { type: 'roadwork', severity: 'High', desc: 'Road Works' },
              8: { type: 'incident', severity: 'Low', desc: 'Mass Transit' },
              9: { type: 'incident', severity: 'Medium', desc: 'Traffic Incident' },
              14: { type: 'incident', severity: 'Medium', desc: 'Broken Down Vehicle' }
            };
            return categoryMap[iconCategory] || { type: 'incident', severity: 'Low', desc: 'Traffic Incident' };
          };
          
          const incidentInfo = getIncidentInfo(props.iconCategory);
          
          const alert = {
            id: `tomtom_working_${Date.now()}_${index}`,
            type: incidentInfo.type,
            title: `${incidentInfo.desc} - Newcastle Area`,
            description: incidentInfo.desc,
            location: location, // Enhanced with GTFS
            coordinates: [lat, lng],
            severity: incidentInfo.severity,
            status: 'red',
            source: 'tomtom',
            affectsRoutes: affectedRoutes,
            iconCategory: props.iconCategory,
            lastUpdated: new Date().toISOString(),
            dataSource: 'TomTom Traffic API v5 (Working Implementation)'
          };
          
          alerts.push(alert);
          
        } catch (error) {
          console.warn(`⚠️ Error processing TomTom incident ${index}:`, error.message);
        }
      });
    }
    
    console.log(`✅ TomTom Working: ${alerts.length} alerts processed from Newcastle`);
    return { success: true, data: alerts, source: 'TomTom Working API' };
    
  } catch (error) {
    console.error('❌ TomTom Working API failed:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

// Enhanced route matching function
function matchRoutesToLocation(location, lat, lng) {
  const routes = new Set();
  
  // Check if coordinates fall within specific route corridors
  if (lat && lng) {
    // A1 corridor (major north-south route)
    if (lng >= -1.7 && lng <= -1.5 && lat >= 54.8 && lat <= 55.2) {
      routes.add('21'); routes.add('X21'); routes.add('10'); routes.add('11');
    }
    
    // A19 corridor (through Tyne Tunnel)
    if (lng >= -1.5 && lng <= -1.3 && lat >= 54.9 && lat <= 55.1) {
      routes.add('1'); routes.add('2'); routes.add('308'); routes.add('309');
    }
    
    // Newcastle city center
    if (lng >= -1.65 && lng <= -1.55 && lat >= 54.95 && lat <= 55.0) {
      routes.add('Q1'); routes.add('Q2'); routes.add('Q3'); routes.add('10'); routes.add('11');
    }
    
    // Coast Road area
    if (lng >= -1.5 && lng <= -1.3 && lat >= 55.0 && lat <= 55.1) {
      routes.add('1'); routes.add('2'); routes.add('308'); routes.add('309'); routes.add('317');
    }
  }
  
  // Text-based matching as fallback
  const text = location.toLowerCase();
  const routePatterns = {
    'a1': ['21', 'X21', '10', '11'],
    'a19': ['1', '2', '308', '309'],
    'newcastle': ['Q1', 'Q2', 'Q3', '10', '11', '12'],
    'coast': ['1', '2', '308', '309', '317'],
    'tyne tunnel': ['1', '2', '308', '309']
  };
  
  for (const [pattern, routeList] of Object.entries(routePatterns)) {
    if (text.includes(pattern)) {
      routeList.forEach(route => routes.add(route));
    }
  }
  
  return Array.from(routes).sort();
}
// --- END fetchTomTomTrafficWorking and helpers ---

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

// Enhanced MapQuest with street names
async function fetchMapQuestTraffic() {
  try {
    console.log('🗺️ Fetching MapQuest traffic with street name enhancement...');
    
    const response = await axios.get('https://www.mapquestapi.com/traffic/v2/incidents', {
      params: {
        key: process.env.MAPQUEST_API_KEY,
        boundingBox: `55.0,-2.0,54.5,-1.0`,
        filters: 'incidents,construction'
      },
      timeout: 20000,
      headers: {
        'User-Agent': 'BARRY-TrafficWatch/3.0',
        'Accept': 'application/json'
      }
    });
    
    console.log(`📡 MapQuest: ${response.status}, incidents: ${response.data?.incidents?.length || 0}`);
    
    const alerts = [];
    
    if (response.data?.incidents) {
      // Process first 8 incidents to avoid too many geocoding calls
      const incidentsToProcess = response.data.incidents.slice(0, 8);
      
      for (const [index, incident] of incidentsToProcess.entries()) {
        const lat = incident.lat;
        const lng = incident.lng;
        
        if (!lat || !lng) continue;
        
        // ENHANCED: Get real street name
        console.log(`🗺️ Enhancing location ${index + 1}/${incidentsToProcess.length}...`);
        const enhancedLocation = await enhanceLocationWithNames(
          lat, 
          lng, 
          incident.street || `Traffic incident`
        );
        
        // Enhanced route matching based on coordinates
        const affectedRoutes = getRoutesFromCoordinates(lat, lng);
        
        const alert = {
          id: `mapquest_enhanced_${incident.id || Date.now()}_${index}`,
          type: incident.type === 1 ? 'roadwork' : 'incident',
          title: incident.shortDesc || 'Traffic Incident',
          description: incident.fullDesc || incident.shortDesc || 'Traffic incident reported',
          location: enhancedLocation, // ← REAL STREET NAMES!
          authority: 'MapQuest Traffic',
          source: 'mapquest',
          severity: incident.severity >= 3 ? 'High' : incident.severity >= 2 ? 'Medium' : 'Low',
          status: 'red',
          affectsRoutes: affectedRoutes,
          coordinates: { lat, lng },
          lastUpdated: new Date().toISOString(),
          dataSource: 'MapQuest Traffic API + OpenStreetMap Street Names'
        };
        
        alerts.push(alert);
        
        console.log(`✨ Enhanced: "${incident.street || 'coordinates'}" → "${enhancedLocation}"`);
      }
    }
    
    console.log(`✅ MapQuest enhanced: ${alerts.length} alerts with real street names`);
    return { success: true, data: alerts, method: 'Enhanced with Street Names' };
    
  } catch (error) {
    console.error('❌ Enhanced MapQuest fetch failed:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

// Enhanced route matching function
function getRoutesFromCoordinates(lat, lng) {
  const routes = [];
  
  // A1 corridor (major north-south route)
  if (lng >= -1.7 && lng <= -1.5 && lat >= 54.8 && lat <= 55.2) {
    routes.push('21', 'X21', '10', '11');
  }
  
  // A19 corridor (Tyne Tunnel area)
  if (lng >= -1.5 && lng <= -1.3 && lat >= 54.9 && lat <= 55.1) {
    routes.push('1', '2', '308', '309');
  }
  
  // Newcastle city center
  if (lng >= -1.65 && lng <= -1.55 && lat >= 54.95 && lat <= 55.0) {
    routes.push('Q1', 'Q2', 'Q3', '10', '11', '12');
  }
  
  // Coast Road area
  if (lng >= -1.5 && lng <= -1.3 && lat >= 55.0 && lat <= 55.1) {
    routes.push('1', '2', '308', '309', '317');
  }
  
  // A167 Durham Road corridor
  if (lng >= -1.65 && lng <= -1.45 && lat >= 54.85 && lat <= 54.95) {
    routes.push('21', '22', 'X21', '6', '7');
  }
  
  return [...new Set(routes)].sort();
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

    // --- TOMTOM SIMPLE LOGIC ---
    const allAlerts = [];
    const sources = {};
    // Fetch TomTom data with simple working version
    const tomtomResult = await fetchTomTomTrafficSimple();

    if (tomtomResult.success) {
      allAlerts.push(...tomtomResult.data);
      sources.tomtom = {
        success: true,
        count: tomtomResult.data.length,
        method: 'Filtered GTFS API',
        area: 'Newcastle'
      };
    } else {
      sources.tomtom = {
        success: false,
        count: 0,
        error: tomtomResult.error
      };
    }

    // --- Enhanced parallel fetch with improved MapQuest street names ---
    const [hereResult, nhResult] = await Promise.allSettled([
      fetchHERETraffic(),
      fetchNationalHighways()
    ]);
    const mapquestResult = await fetchMapQuestTrafficWithStreetNames();

    // HERE
    if (hereResult.status === 'fulfilled' && hereResult.value.success) {
      allAlerts.push(...hereResult.value.data);
      sources.here = {
        success: true,
        count: hereResult.value.count,
        method: 'Fixed API Authentication'
      };
      console.log(`✅ here: ${hereResult.value.count} alerts`);
    } else {
      sources.here = {
        success: false,
        count: 0,
        error: hereResult.status === 'rejected' ? hereResult.reason.message : hereResult.value.error
      };
      console.log(`❌ here: ${sources.here.error}`);
    }
    // MapQuest (Enhanced with OpenStreetMap Street Names)
    if (mapquestResult.success) {
      allAlerts.push(...mapquestResult.data);
      sources.mapquest = {
        success: true,
        count: mapquestResult.data.length,
        method: 'Enhanced with OpenStreetMap Street Names'
      };
      console.log(`✅ mapquest: ${mapquestResult.data.length} alerts`);
    } else {
      sources.mapquest = {
        success: false,
        count: 0,
        error: mapquestResult.error
      };
      console.log(`❌ mapquest: ${sources.mapquest.error}`);
    }
    // National Highways
    if (nhResult.status === 'fulfilled' && nhResult.value.success) {
      allAlerts.push(...nhResult.value.data);
      sources.nationalHighways = {
        success: true,
        count: nhResult.value.count,
        method: 'Fixed API Authentication'
      };
      console.log(`✅ nationalHighways: ${nhResult.value.count} alerts`);
    } else {
      sources.nationalHighways = {
        success: false,
        count: 0,
        error: nhResult.status === 'rejected' ? nhResult.reason.message : nhResult.value.error
      };
      console.log(`❌ nationalHighways: ${sources.nationalHighways.error}`);
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
  const tomtom = await fetchTomTomTrafficFixed();
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

export { fetchTomTomTrafficSimple as fetchTomTomTrafficOptimized, initializeGTFS, getGTFSStats };
export default app;

// --- Enhanced MapQuest fetcher with OpenStreetMap street names ---
async function fetchMapQuestTrafficWithStreetNames() {
  try {
    console.log('🗺️ Fetching MapQuest traffic with OpenStreetMap street names...');
    const response = await axios.get('https://www.mapquestapi.com/traffic/v2/incidents', {
      params: {
        key: process.env.MAPQUEST_API_KEY,
        boundingBox: `55.0,-2.0,54.5,-1.0`,
        filters: 'incidents,construction'
      },
      timeout: 20000,
      headers: {
        'User-Agent': 'BARRY-TrafficWatch/3.0',
        'Accept': 'application/json'
      }
    });
    console.log(`📡 MapQuest: ${response.status}, incidents: ${response.data?.incidents?.length || 0}`);
    const alerts = [];
    if (response.data?.incidents) {
      // Limit to 10 to avoid too many API calls
      for (const [index, incident] of response.data.incidents.entries()) {
        if (index >= 10) break;
        const lat = incident.lat;
        const lng = incident.lng;
        if (!lat || !lng) continue;
        // ENHANCED: Get real street name instead of coordinates
        const enhancedLocation = await enhanceLocationWithNames(
          lat,
          lng,
          incident.street || `Newcastle area (${lat.toFixed(3)}, ${lng.toFixed(3)})`
        );
        // Enhanced route matching
        const affectedRoutes = getRoutesFromCoordinates(lat, lng);
        const alert = {
          id: `mapquest_enhanced_${incident.id || Date.now()}_${index}`,
          type: incident.type === 1 ? 'roadwork' : 'incident',
          title: incident.shortDesc || 'Traffic Incident',
          description: incident.fullDesc || incident.shortDesc || 'Traffic incident reported',
          location: enhancedLocation,
          authority: 'MapQuest Traffic',
          source: 'mapquest',
          severity: incident.severity >= 3 ? 'High' : incident.severity >= 2 ? 'Medium' : 'Low',
          status: 'red',
          affectsRoutes: affectedRoutes,
          lastUpdated: new Date().toISOString(),
          dataSource: 'MapQuest Traffic API + OpenStreetMap Geocoding',
          coordinates: { lat, lng }
        };
        alerts.push(alert);
        console.log(`✨ Enhanced: ${incident.street || 'coordinates'} → ${enhancedLocation}`);
      }
    }
    console.log(`✅ MapQuest enhanced: ${alerts.length} alerts with street names`);
    return { success: true, data: alerts };
  } catch (error) {
    console.error('❌ Enhanced MapQuest fetch failed:', error.message);
    return { success: false, data: [], error: error.message };
  }
}