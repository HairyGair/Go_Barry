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
// --- Enhanced Location & Timing Functions (START) ---

// Enhanced location fallback with multiple strategies
async function getEnhancedLocationWithFallbacks(lat, lng, originalLocation = '', context = '') {
  if (originalLocation && originalLocation.trim() && 
      !originalLocation.includes('coordinate') && 
      !originalLocation.includes('54.') && 
      !originalLocation.includes('55.') &&
      originalLocation.length > 5) {
    console.log(`🎯 Using original location: ${originalLocation}`);
    return originalLocation;
  }
  if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
    try {
      console.log(`🗺️ Attempting enhanced geocoding for ${lat}, ${lng}...`);
      const enhancedLocation = await getLocationNameWithTimeout(lat, lng, 3000);
      if (enhancedLocation && enhancedLocation.length > 3) {
        console.log(`✅ Enhanced location: ${enhancedLocation}`);
        return enhancedLocation;
      }
    } catch (error) {
      console.warn(`⚠️ Geocoding failed: ${error.message}`);
    }
    const regionLocation = getRegionFromCoordinates(lat, lng);
    if (regionLocation) {
      console.log(`📍 Using region detection: ${regionLocation}`);
      return regionLocation;
    }
    const coordLocation = getCoordinateDescription(lat, lng);
    console.log(`📐 Using coordinate description: ${coordLocation}`);
    return coordLocation;
  }
  if (context && context.trim() && context.length > 3) {
    console.log(`📄 Using context: ${context}`);
    return context;
  }
  console.log(`⚠️ Using generic fallback location`);
  return 'North East England - Location being determined';
}

// OpenStreetMap with timeout control
async function getLocationNameWithTimeout(lat, lng, timeout = 3000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
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
      timeout: timeout,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (response.data && response.data.address) {
      const addr = response.data.address;
      console.log(`📍 OSM response for ${lat}, ${lng}:`, {
        road: addr.road,
        neighbourhood: addr.neighbourhood,
        suburb: addr.suburb,
        town: addr.town,
        city: addr.city
      });
      let location = '';
      if (addr.road) {
        location = addr.road;
      } else if (addr.pedestrian) {
        location = addr.pedestrian;
      } else if (addr.neighbourhood) {
        location = addr.neighbourhood;
      }
      if (addr.suburb) {
        location += location ? `, ${addr.suburb}` : addr.suburb;
      } else if (addr.neighbourhood && !location.includes(addr.neighbourhood)) {
        location += location ? `, ${addr.neighbourhood}` : addr.neighbourhood;
      }
      if (addr.town) {
        location += location ? `, ${addr.town}` : addr.town;
      } else if (addr.city) {
        location += location ? `, ${addr.city}` : addr.city;
      }
      return location || response.data.display_name?.split(',')[0] || null;
    }
    return null;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn(`⚠️ Geocoding timeout after ${timeout}ms`);
    } else {
      console.warn(`⚠️ Geocoding error: ${error.message}`);
    }
    return null;
  }
}

// Geographic region detection from coordinates
function getRegionFromCoordinates(lat, lng) {
  if (lat >= 54.9 && lat <= 55.1 && lng >= -1.7 && lng <= -1.4) {
    if (lat >= 54.95 && lng >= -1.65 && lng <= -1.55) {
      return 'Newcastle City Centre';
    } else if (lng >= -1.5 && lng <= -1.3 && lat >= 55.0) {
      return 'Newcastle Coast Road Area';
    } else if (lat <= 54.97 && lng >= -1.65) {
      return 'Gateshead Area';
    }
    return 'Newcastle upon Tyne Area';
  }
  if (lat >= 54.85 && lat <= 54.95 && lng >= -1.5 && lng <= -1.2) {
    return 'Sunderland Area';
  }
  if (lat >= 54.7 && lat <= 54.85 && lng >= -1.7 && lng <= -1.4) {
    return 'Durham Area';
  }
  if (lat >= 55.1 && lat <= 55.5 && lng >= -2.0 && lng <= -1.0) {
    return 'Northumberland';
  }
  if (lat >= 54.5 && lat <= 55.5 && lng >= -2.5 && lng <= -1.0) {
    return 'North East England';
  }
  return null;
}

// Coordinate description with road detection
function getCoordinateDescription(lat, lng) {
  const region = getRegionFromCoordinates(lat, lng) || 'North East England';
  let roadHint = '';
  if (lng >= -1.7 && lng <= -1.5 && lat >= 54.8 && lat <= 55.2) {
    roadHint = ' (A1 Corridor)';
  }
  else if (lng >= -1.5 && lng <= -1.3 && lat >= 54.9 && lat <= 55.1) {
    roadHint = ' (A19 Corridor)';
  }
  else if (lng >= -1.65 && lng <= -1.45 && lat >= 54.8 && lat <= 54.95) {
    roadHint = ' (A167 Corridor)';
  }
  return `${region}${roadHint} (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
}

// Enhanced start time generation
function generateStartTime(alert, incidentData = {}) {
  const now = new Date();
  if (alert.startDate || incidentData.startDate || incidentData.startTime) {
    return alert.startDate || incidentData.startDate || incidentData.startTime;
  }
  if (alert.status === 'red' || alert.severity === 'High') {
    const startTime = new Date(now.getTime() - (Math.random() * 2 * 60 * 60 * 1000));
    return startTime.toISOString();
  }
  if (alert.type === 'roadwork') {
    const startTime = new Date(now);
    startTime.setHours(6, 0, 0, 0);
    return startTime.toISOString();
  }
  const startTime = new Date(now.getTime() - (30 * 60 * 1000));
  return startTime.toISOString();
}

// Enhanced end time generation
function generateEndTime(alert, incidentData = {}) {
  const now = new Date();
  const startTime = new Date(alert.startDate || now);
  if (alert.endDate || incidentData.endDate || incidentData.endTime) {
    return alert.endDate || incidentData.endDate || incidentData.endTime;
  }
  if (alert.type === 'incident') {
    let durationMinutes = 60;
    if (alert.severity === 'High') {
      durationMinutes = 120;
    } else if (alert.severity === 'Low') {
      durationMinutes = 30;
    }
    const endTime = new Date(startTime.getTime() + (durationMinutes * 60 * 1000));
    return endTime.toISOString();
  }
  if (alert.type === 'roadwork') {
    const endTime = new Date(startTime);
    endTime.setDate(endTime.getDate() + 3);
    endTime.setHours(18, 0, 0, 0);
    return endTime.toISOString();
  }
  const endTime = new Date(startTime.getTime() + (2 * 60 * 60 * 1000));
  return endTime.toISOString();
}

// Enhanced alert processing function
function enhanceAlertWithTimesAndLocation(alert, originalData = {}) {
  if (!alert.startDate) {
    alert.startDate = generateStartTime(alert, originalData);
  }
  if (!alert.endDate) {
    alert.endDate = generateEndTime(alert, originalData);
  }
  alert.estimatedTimes = !originalData.startDate && !originalData.endDate;
  alert.lastUpdated = new Date().toISOString();
  return alert;
}

// --- Enhanced Location & Timing Functions (END) ---
import findGTFSRoutesNearCoordinates from './gtfs-route-matcher.js';

// GTFS Route Matching Cache
let gtfsRouteMapping = null;
let gtfsTripMapping = null;

// Haversine distance calculation (in meters)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Load GTFS route mapping (cached)
async function loadGtfsRouteMapping() {
  if (gtfsRouteMapping) return gtfsRouteMapping;
  try {
    const routesPath = path.join(__dirname, 'data', 'routes.txt');
    const content = await fs.readFile(routesPath, 'utf8');
    const lines = content.split('\n');
    if (lines.length < 2) return {};
    const headers = lines[0].split(',').map(h => h.trim());
    const routeIdIndex = headers.indexOf('route_id');
    const routeShortNameIndex = headers.indexOf('route_short_name');
    const mapping = {};
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const routeId = values[routeIdIndex];
        const shortName = values[routeShortNameIndex];
        if (routeId && shortName) {
          mapping[routeId] = shortName;
        }
      }
    }
    gtfsRouteMapping = mapping;
    console.log(`✅ Loaded ${Object.keys(mapping).length} GTFS route mappings`);
    return mapping;
  } catch (error) {
    console.warn('⚠️ Could not load GTFS route mapping:', error.message);
    return {};
  }
}

// Load GTFS trip mapping (cached)
async function loadGtfsTripMapping() {
  if (gtfsTripMapping) return gtfsTripMapping;
  try {
    const tripsPath = path.join(__dirname, 'data', 'trips.txt');
    const content = await fs.readFile(tripsPath, 'utf8');
    const lines = content.split('\n');
    if (lines.length < 2) return {};
    const headers = lines[0].split(',').map(h => h.trim());
    const routeIdIndex = headers.indexOf('route_id');
    const shapeIdIndex = headers.indexOf('shape_id');
    const mapping = {};
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const routeId = values[routeIdIndex];
        const shapeId = values[shapeIdIndex];
        if (routeId && shapeId) {
          if (!mapping[shapeId]) {
            mapping[shapeId] = new Set();
          }
          mapping[shapeId].add(routeId);
        }
      }
    }
    // Convert Sets to Arrays
    const finalMapping = {};
    for (const [shapeId, routeSet] of Object.entries(mapping)) {
      finalMapping[shapeId] = Array.from(routeSet);
    }
    gtfsTripMapping = finalMapping;
    console.log(`✅ Loaded ${Object.keys(finalMapping).length} GTFS shape-to-route mappings`);
    return finalMapping;
  } catch (error) {
    console.warn('⚠️ Could not load GTFS trip mapping:', error.message);
    return {};
  }
}

// GTFS coordinate-based route matching
async function findRoutesNearCoordinate(lat, lon, maxDistanceMeters = 250) {
  try {
    const routeMap = await loadGtfsRouteMapping();
    const tripMap = await loadGtfsTripMapping();
    if (Object.keys(routeMap).length === 0 || Object.keys(tripMap).length === 0) {
      console.warn('⚠️ GTFS data not available, falling back to text matching');
      return [];
    }
    const shapesPath = path.join(__dirname, 'data', 'shapes.txt');
    const content = await fs.readFile(shapesPath, 'utf8');
    const lines = content.split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    const shapeIdIndex = headers.indexOf('shape_id');
    const latIndex = headers.indexOf('shape_pt_lat');
    const lonIndex = headers.indexOf('shape_pt_lon');
    if (shapeIdIndex === -1 || latIndex === -1 || lonIndex === -1) return [];
    const nearbyShapes = new Set();
    let processedPoints = 0;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',');
        const shapeId = values[shapeIdIndex];
        const shapeLat = parseFloat(values[latIndex]);
        const shapeLon = parseFloat(values[lonIndex]);
        if (!isNaN(shapeLat) && !isNaN(shapeLon) && shapeId) {
          processedPoints++;
          const distance = calculateDistance(lat, lon, shapeLat, shapeLon);
          if (distance <= maxDistanceMeters) {
            nearbyShapes.add(shapeId);
          }
        }
      }
    }
    // Convert shapes to routes
    const foundRoutes = new Set();
    for (const shapeId of nearbyShapes) {
      const routeIds = tripMap[shapeId] || [];
      for (const routeId of routeIds) {
        const routeName = routeMap[routeId];
        if (routeName) {
          foundRoutes.add(routeName);
        }
      }
    }
    const routes = Array.from(foundRoutes).sort();
    if (routes.length > 0) {
      console.log(`🎯 GTFS: Found ${routes.length} routes near ${lat}, ${lon}: ${routes.slice(0, 10).join(', ')}${routes.length > 10 ? '...' : ''}`);
    }
    return routes;
  } catch (error) {
    console.warn('⚠️ GTFS route matching error:', error.message);
    return [];
  }
}

import {
  initializeGTFSOptimized as initializeGTFS,
  getGTFSStatsOptimized as getGTFSStats,
  enhanceLocationWithGTFSOptimized
} from './gtfs-location-enhancer-optimized.js';

// --- BEGIN fetchTomTomTrafficWithStreetNames ---
// Enhanced TomTom traffic fetcher with improved location handling and timing
async function fetchTomTomTrafficWithStreetNames() {
  if (!process.env.TOMTOM_API_KEY) {
    return { success: false, data: [], error: 'API key missing' };
  }
  
  try {
    console.log('🚗 Fetching TomTom traffic with enhanced location processing...');
    
    const response = await axios.get('https://api.tomtom.com/traffic/services/5/incidentDetails', {
      params: {
        key: process.env.TOMTOM_API_KEY,
        bbox: '-1.8,54.8,-1.4,55.1', // Newcastle area
        zoom: 10
      },
      timeout: 15000,
      headers: {
        'User-Agent': 'BARRY-TrafficWatch/3.0-Enhanced',
        'Accept': 'application/json'
      }
    });
    
    console.log(`📡 TomTom: ${response.status}, incidents: ${response.data?.incidents?.length || 0}`);
    
    const alerts = [];
    
    if (response.data?.incidents) {
      // Process incidents with enhanced locations
      const realTrafficIncidents = response.data.incidents.filter(feature => {
        const props = feature.properties || {};
        // Include more incident types for better coverage
        return props.iconCategory >= 1 && props.iconCategory <= 14;
      });
      
      console.log(`🔍 Processing ${realTrafficIncidents.length} traffic incidents (filtered from ${response.data.incidents.length})`);
      
      for (const [index, feature] of realTrafficIncidents.entries()) {
        if (index >= 12) break; // Increased limit to 12 for better coverage
        
        const props = feature.properties || {};
        
        // Extract coordinates with better error handling
        let lat = null, lng = null;
        try {
          if (feature.geometry?.coordinates) {
            if (feature.geometry.type === 'Point') {
              [lng, lat] = feature.geometry.coordinates;
            } else if (feature.geometry.type === 'LineString' && feature.geometry.coordinates.length > 0) {
              [lng, lat] = feature.geometry.coordinates[0];
            }
          }
        } catch (coordError) {
          console.warn(`⚠️ Error extracting coordinates for incident ${index}:`, coordError.message);
        }

        // ENHANCED: Get location with multiple fallback strategies
        console.log(`🗺️ Processing location for incident ${index + 1}/${realTrafficIncidents.length}...`);
        
        let enhancedLocation;
        try {
          enhancedLocation = await getEnhancedLocationWithFallbacks(
            lat, 
            lng, 
            props.roadName || props.description || '',
            `TomTom incident ${props.iconCategory}`
          );
        } catch (locationError) {
          console.warn(`⚠️ Location enhancement failed for incident ${index}:`, locationError.message);
          enhancedLocation = getCoordinateDescription(lat, lng);
        }
        
        // Enhanced GTFS route matching with error handling
        let affectedRoutes = [];
        try {
          if (lat && lng) {
            console.log(`🗺️ Finding GTFS routes for incident at ${lat}, ${lng}...`);
            affectedRoutes = await findRoutesNearCoordinate(lat, lng, 150);
          }
        } catch (routeError) {
          console.warn(`⚠️ GTFS route matching failed for incident ${index}:`, routeError.message);
          // Fallback to text-based route matching
          affectedRoutes = matchRoutes(enhancedLocation, props.description || '');
        }
        
        // Map incident types with better categorization
        const getIncidentInfo = (iconCategory) => {
          const categoryMap = {
            1: { type: 'incident', severity: 'High', desc: 'Accident' },
            2: { type: 'incident', severity: 'Medium', desc: 'Dangerous Conditions' },
            3: { type: 'incident', severity: 'Low', desc: 'Weather Conditions' },
            4: { type: 'incident', severity: 'Medium', desc: 'Road Hazard' },
            5: { type: 'incident', severity: 'Low', desc: 'Vehicle Breakdown' },
            6: { type: 'roadwork', severity: 'Medium', desc: 'Road Closure' },
            7: { type: 'roadwork', severity: 'High', desc: 'Road Works' },
            8: { type: 'incident', severity: 'Low', desc: 'Mass Transit Issue' },
            9: { type: 'incident', severity: 'Medium', desc: 'Traffic Incident' },
            10: { type: 'roadwork', severity: 'High', desc: 'Road Blocked' },
            11: { type: 'roadwork', severity: 'High', desc: 'Road Blocked' },
            14: { type: 'incident', severity: 'Medium', desc: 'Broken Down Vehicle' }
          };
          return categoryMap[iconCategory] || { type: 'incident', severity: 'Medium', desc: 'Traffic Incident' };
        };
        
        const incidentInfo = getIncidentInfo(props.iconCategory);
        
        // Create base alert
        let alert = {
          id: `tomtom_enhanced_${Date.now()}_${index}`,
          type: incidentInfo.type,
          title: `${incidentInfo.desc} - ${enhancedLocation}`,
          description: props.description || incidentInfo.desc,
          location: enhancedLocation,
          coordinates: lat && lng ? [lat, lng] : null,
          severity: incidentInfo.severity,
          status: 'red',
          source: 'tomtom',
          affectsRoutes: affectedRoutes,
          routeMatchMethod: affectedRoutes.length > 0 ? 'GTFS Shapes' : 'Text Pattern',
          iconCategory: props.iconCategory,
          lastUpdated: new Date().toISOString(),
          dataSource: 'TomTom Traffic API v5 + Enhanced Location Processing'
        };

        // ENHANCED: Add start and end times
        alert = enhanceAlertWithTimesAndLocation(alert, props);
        
        alerts.push(alert);
        
        console.log(`✨ Enhanced incident: "${props.roadName || 'coordinates'}" → "${enhancedLocation}" (${affectedRoutes.length} routes)`);
      }
    }
    
    console.log(`✅ TomTom enhanced: ${alerts.length} alerts with locations and timing`);
    return { success: true, data: alerts, method: 'Enhanced with Location Fallbacks' };
    
  } catch (error) {
    console.error('❌ Enhanced TomTom fetch failed:', error.message);
    return { success: false, data: [], error: error.message };
  }
}
// --- END fetchTomTomTrafficWithStreetNames ---

// Enhanced TomTom route matching (CURRENT version only)

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

// --- Go North East Regions & Route Mapping (UPDATED) ---
const GO_NORTH_EAST_REGIONS = [
  {
    name: 'Newcastle/Gateshead Core',
    bbox: '-1.8,54.8,-1.4,55.1',
    center: { lat: 54.9783, lng: -1.6178 },
    routes: ['Q3', 'Q3X', '10', '10A', '10B', '12', '21', '22', '28', '28B', '29', '47', '53', '54', '56', '57', '58', '27']
  },
  {
    name: 'North Tyneside/Coast',
    bbox: '-1.6,54.9,-1.1,55.3',
    center: { lat: 55.0174, lng: -1.4234 },
    routes: ['1', '2', '307', '309', '317', '327', '352', '354', '355', '356']
  },
  {
    name: 'Sunderland/Washington',
    bbox: '-1.6,54.7,-1.2,55.0',
    center: { lat: 54.9069, lng: -1.3838 },
    routes: ['16', '20', '24', '35', '36', '56', '61', '62', '63', '700', '701', '9']
  },
  {
    name: 'Durham/Chester-le-Street',
    bbox: '-1.8,54.5,-1.2,54.9',
    center: { lat: 54.7761, lng: -1.5756 },
    routes: ['21', '22', 'X21', '6', '50']
  },
  {
    name: 'Northumberland/Cramlington',
    bbox: '-1.9,55.0,-1.3,55.4',
    center: { lat: 55.1500, lng: -1.6000 },
    routes: ['43', '44', '45', '52', '57', '58']
  },
  {
    name: 'West Newcastle/Consett',
    bbox: '-2.1,54.6,-1.5,55.0',
    center: { lat: 54.8500, lng: -1.8000 },
    routes: ['X30', 'X31', 'X70', 'X71', 'X71A', '74', '84', '85']
  },
  {
    name: 'Hexham/West Northumberland',
    bbox: '-2.3,54.8,-1.8,55.2',
    center: { lat: 54.9722, lng: -2.1000 },
    routes: ['X85', '684']
  },
  {
    name: 'Extended Network',
    bbox: '-1.8,54.3,-1.0,54.7',
    center: { lat: 54.5000, lng: -1.4000 },
    routes: ['X1', 'X1A', 'X10', 'X39', 'X45', 'X72', 'X73', 'X75']
  }
];

const LOCATION_ROUTE_MAPPING = {
  'a1': ['21', 'X21', '43', '44', '45'], // Current A1 routes - removed outdated X9, X10, 11
  'a19': ['1', '2', '35', '36', '307', '309'], // Current A19 routes - removed outdated X7, X8, 19
  'a167': ['21', '22', 'X21', '50', '6'], // Current A167 routes - removed 7
  'a1058': ['1', '2', '307', '309', '317'], // Current Coast Road routes - removed 308, 311
  'a184': ['25', '28', '29'], // Current A184 routes - removed 93, 94
  'a690': ['61', '62', '63'], // Current A690 routes - removed 64, 65
  'a69': ['X85', '684'], // Current A69 routes - removed X84, 602, 685
  'a183': ['16', '20', '61', '62'], // Current A183 routes - removed 18
  'newcastle': ['Q3', 'Q3X', '10', '10A', '10B', '12', '21', '22', '27', '28', '29', '47'], // CURRENT Newcastle routes only
  'gateshead': ['21', '27', '28', '29', '51', '52', '53', '54', '56', '57', '58'], // CURRENT Gateshead routes
  'sunderland': ['16', '20', '24', '35', '36', '56', '61', '62', '63', '700', '701', '9'], // CURRENT Sunderland routes
  'durham': ['21', '22', 'X21', '50', '6'], // CURRENT Durham routes - removed 13, 14
  'tyne tunnel': ['1', '2', '307', '309'], // CURRENT tunnel routes - removed 308, 311
  'coast road': ['1', '2', '307', '309', '317'], // CURRENT coast routes - removed 308, 311
  'central motorway': ['Q3', 'Q3X', '10', '12', '21', '22'] // CURRENT city routes - removed Q1, Q2, QUAYSIDE
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

// Updated route-matching using LOCATION_ROUTE_MAPPING (only one version should exist)
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

// Enhanced route matching function (ONLY CURRENT VERSION BELOW)
function matchRoutesToLocation(location, lat, lng) {
  const routes = new Set();

  // Check if coordinates fall within specific route corridors
  if (lat && lng) {
    const coordRoutes = getCurrentRoutesFromCoordinates(lat, lng);
    coordRoutes.forEach(route => routes.add(route));
  }

  // Text-based matching as fallback using current routes
  const text = location.toLowerCase();
  const routePatterns = {
    'a1': ['21', 'X21', '43', '44', '45'],
    'a19': ['1', '2', '307', '309'],
    'newcastle': ['Q3', 'Q3X', '10', '10A', '10B', '12'],
    'coast': ['1', '2', '307', '309', '317'],
    'tyne tunnel': ['1', '2', '307', '309'],
    'sunderland': ['16', '20', '24', '35', '36', '61', '62', '63'],
    'durham': ['21', '22', 'X21', '6'],
    'gateshead': ['21', '27', '28', '29', '53', '54', '56']
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

// --- Updated coordinate-based route matching (Go North East) ---
function getCurrentRoutesFromCoordinates(lat, lng) {
  const routes = [];
  if (lng >= -1.7 && lng <= -1.5 && lat >= 54.8 && lat <= 55.2) {
    routes.push('21', 'X21', '43', '44', '45');
  }
  if (lng >= -1.5 && lng <= -1.3 && lat >= 54.9 && lat <= 55.1) {
    routes.push('1', '2', '307', '309');
  }
  if (lng >= -1.65 && lng <= -1.55 && lat >= 54.95 && lat <= 55.0) {
    routes.push('Q3', 'Q3X', '10', '10A', '10B', '12');
  }
  if (lng >= -1.5 && lng <= -1.3 && lat >= 55.0 && lat <= 55.1) {
    routes.push('1', '2', '307', '309', '317');
  }
  if (lng >= -1.65 && lng <= -1.45 && lat >= 54.85 && lat <= 54.95) {
    routes.push('21', '22', 'X21', '6');
  }
  if (lng >= -1.5 && lng <= -1.2 && lat >= 54.85 && lat <= 54.95) {
    routes.push('16', '20', '24', '35', '36', '61', '62', '63');
  }
  if (lng >= -2.0 && lng <= -1.6 && lat >= 54.8 && lat <= 55.1) {
    routes.push('X30', 'X31', 'X70', 'X71', 'X85');
  }
  return [...new Set(routes)].sort();
}

function getRegionalRoutes(lat, lng, region) {
  // Try coordinate-based matching first with current routes
  const coordRoutes = getCurrentRoutesFromCoordinates(lat, lng);
  if (coordRoutes.length > 0) {
    return coordRoutes;
  }
  
  // Fallback to regional routes (current only)
  return region?.routes?.slice(0, 3) || [];
}

function getCurrentRoutesFromText(text, region) {
  const routes = new Set();
  const lowerText = text.toLowerCase();
  for (const [pattern, routeList] of Object.entries(CURRENT_LOCATION_ROUTE_MAPPING || {})) {
    if (lowerText.includes(pattern.toLowerCase())) {
      routeList.forEach(route => routes.add(route));
    }
  }
  if (routes.size === 0 && region?.routes) {
    region.routes.slice(0, 2).forEach(route => routes.add(route));
  }
  return Array.from(routes).sort();
}

function getRegionalRoutesFromText(text, region) {
  const routes = getCurrentRoutesFromText(text, region);
  if (routes.length > 0) {
    return routes;
  }
  
  // Fallback to regional routes
  return region?.routes?.slice(0, 2) || [];
}

function getTomTomRoutesFromCoordinates(lat, lng) {
  return getCurrentRoutesFromCoordinates(lat, lng);
}

function getRoutesFromCoordinates(lat, lng) {
  return getCurrentRoutesFromCoordinates(lat, lng);
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

    // Enhanced TomTom with street names
    const allAlerts = [];
    const sources = {};
    const tomtomResult = await fetchTomTomTrafficWithStreetNames();

    if (tomtomResult.success) {
      allAlerts.push(...tomtomResult.data);
      sources.tomtom = {
        success: true,
        count: tomtomResult.data.length,
        method: 'Enhanced with OpenStreetMap Street Names'
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

export { fetchTomTomTrafficWithStreetNames as fetchTomTomTrafficOptimized, initializeGTFS, getGTFSStats };
export default app;

// Enhanced MapQuest traffic fetcher with improved location handling and timing
async function fetchMapQuestTrafficWithStreetNames() {
  try {
    console.log('🗺️ Fetching MapQuest traffic with enhanced location processing...');
    
    const response = await axios.get('https://www.mapquestapi.com/traffic/v2/incidents', {
      params: {
        key: process.env.MAPQUEST_API_KEY,
        boundingBox: `55.0,-2.0,54.5,-1.0`, // North East bounding box
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
      // Process incidents with enhanced location handling
      const incidentsToProcess = response.data.incidents.slice(0, 12); // Increased to 12
      
      for (const [index, incident] of incidentsToProcess.entries()) {
        const lat = incident.lat;
        const lng = incident.lng;
        
        // ENHANCED: Process even incidents without coordinates
        console.log(`🗺️ Processing MapQuest incident ${index + 1}/${incidentsToProcess.length}...`);
        
        let enhancedLocation;
        try {
          // Use enhanced location processing with multiple fallbacks
          enhancedLocation = await getEnhancedLocationWithFallbacks(
            lat,
            lng,
            incident.street || incident.shortDesc || '',
            `MapQuest ${incident.type === 1 ? 'roadwork' : 'incident'}`
          );
        } catch (locationError) {
          console.warn(`⚠️ Location enhancement failed for MapQuest incident ${index}:`, locationError.message);
          // Fallback to available data
          enhancedLocation = incident.street || incident.shortDesc || 'North East England - Location being determined';
        }
        
        // Enhanced GTFS route matching
        let affectedRoutes = [];
        try {
          if (lat && lng) {
            console.log(`🗺️ Finding GTFS routes for MapQuest incident at ${lat}, ${lng}...`);
            affectedRoutes = await findRoutesNearCoordinate(lat, lng, 150);
          }
          
          // Fallback to text-based matching if coordinate matching failed
          if (affectedRoutes.length === 0) {
            affectedRoutes = matchRoutes(enhancedLocation, incident.fullDesc || incident.shortDesc || '');
          }
        } catch (routeError) {
          console.warn(`⚠️ Route matching failed for MapQuest incident ${index}:`, routeError.message);
          affectedRoutes = [];
        }
        
        // Create base alert
        let alert = {
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
          routeMatchMethod: affectedRoutes.length > 0 ? 'GTFS Shapes' : 'Text Pattern',
          coordinates: lat && lng ? { lat, lng } : null,
          lastUpdated: new Date().toISOString(),
          dataSource: 'MapQuest Traffic API + Enhanced Location Processing'
        };

        // ENHANCED: Add start and end times
        alert = enhanceAlertWithTimesAndLocation(alert, incident);
        
        alerts.push(alert);
        
        console.log(`✨ Enhanced MapQuest: "${incident.street || 'no location'}" → "${enhancedLocation}" (${affectedRoutes.length} routes)`);
      }
    }
    
    console.log(`✅ MapQuest enhanced: ${alerts.length} alerts with locations and timing`);
    return { success: true, data: alerts, method: 'Enhanced with Location Fallbacks' };
    
  } catch (error) {
    console.error('❌ Enhanced MapQuest fetch failed:', error.message);
    return { success: false, data: [], error: error.message };
  }
}