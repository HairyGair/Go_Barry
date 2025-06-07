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
import { setupAPIRoutes } from './routes/api.js';
import { fetchTomTomTrafficWithStreetNames } from './services/tomtom.js';
import { fetchMapQuestTrafficWithStreetNames } from './services/mapquest.js';
import { fetchHERETraffic } from './services/here.js';
import { fetchNationalHighways } from './services/nationalHighways.js';
import geocodingService, { 
  geocodeLocation, 
  enhanceAlertWithCoordinates, 
  reverseGeocode, 
  batchGeocode,
  getCacheStats as getGeocodingCacheStats,
  testGeocoding 
} from './services/geocoding.js';
import {
  getLocationNameWithTimeout,
  getRegionFromCoordinates,
  getCoordinateDescription,
  getEnhancedLocationWithFallbacks
} from './utils/location.js';
import enhanceLocationWithNames from './location-enhancer.js';
import healthRoutes from './routes/health.js';
import supervisorAPI from './routes/supervisorAPI.js';
import { processEnhancedAlerts } from './services/enhancedAlertProcessor.js';
import findGTFSRoutesNearCoordinates from './gtfs-route-matcher.js';
import { 
  LOCATION_ROUTE_MAPPING,
  matchRoutes,
  getCurrentRoutesFromCoordinates,
  isInNorthEast,
  matchRoutesToLocation,
  getRoutesFromCoordinates,
  getTomTomRoutesFromCoordinates,
  getCurrentRoutesFromText,
  getRegionalRoutes,
  getRegionalRoutesFromText
} from './utils/routeMatching.js';

// GTFS Route Matching Cache
let gtfsRouteMapping = null;
let gtfsTripMapping = null;


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
import {
  initializeEnhancedGTFS,
  getEnhancedGTFSStats
} from './enhanced-gtfs-route-matcher.js';

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c * 1000; // Distance in meters
  return distance;
}

// Helper function for timing enhancement
function enhanceAlertWithTimesAndLocation(alert, incident) {
  if (incident.startTime) {
    alert.startTime = incident.startTime;
  }
  if (incident.endTime) {
    alert.endTime = incident.endTime;
  }
  if (incident.duration) {
    alert.estimatedDuration = incident.duration;
  }
  return alert;
}


// Enhanced TomTom route matching (CURRENT version only)

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Load GTFS routes.txt into a Set of valid route_short_names
let GTFS_ROUTES = new Set();
const ACK_FILE = path.join(__dirname, 'data/acknowledged.json');
let acknowledgedAlerts = {};
const NOTES_FILE = path.join(__dirname, 'data/notes.json');
let alertNotes = {};
// --- GTFS_ROUTES, acknowledgedAlerts, alertNotes initial loading ---
(async () => {
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
  try {
    const raw = await fs.readFile(ACK_FILE, 'utf-8');
    acknowledgedAlerts = JSON.parse(raw);
    console.log(`✅ Loaded ${Object.keys(acknowledgedAlerts).length} acknowledged alerts`);
  } catch {
    acknowledgedAlerts = {};
  }
  try {
    const raw = await fs.readFile(NOTES_FILE, 'utf-8');
    alertNotes = JSON.parse(raw);
    console.log(`✅ Loaded staff notes for ${Object.keys(alertNotes).length} alerts`);
  } catch {
    alertNotes = {};
  }
})();


const app = express();
const PORT = process.env.PORT || 3001;

console.log('🚦 BARRY Backend Starting with Enhanced Geocoding...');
console.log('🗺️ Initializing Mapbox Geocoding Service...');
try {
  const geocodingStats = getGeocodingCacheStats();
  console.log(`✅ Geocoding Service Ready:`);
  console.log(`   🗺️ Mapbox configured: ${geocodingStats.mapboxConfigured}`);
  console.log(`   💾 Cache initialized`);
  console.log(`   🎯 Coverage: North East England`);
  console.log(`   📋 Intelligent fallbacks enabled`);
} catch (error) {
  console.error('❌ Geocoding initialization error:', error.message);
}
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

// --- Route Visualization Initialization ---
console.log('🗺️ Initializing Route Visualization System...');
import { initializeRouteVisualization } from './services/routeVisualizationService.js';
setTimeout(async () => {
  try {
    console.log('🔄 Loading route visualization data...');
    const vizSuccess = await initializeRouteVisualization();
    if (vizSuccess) {
      console.log('✅ Route Visualization System Ready for Control Room Operations');
    } else {
      console.log('❌ Route visualization initialization failed');
    }
  } catch (error) {
    console.log(`❌ Route visualization error: ${error.message}`);
  }
}, 5000);

console.log(`
🔧 MEMORY OPTIMIZATION APPLIED:
   ✅ Skips 34MB shapes processing
   ✅ Limits stops to prevent memory issues  
   ✅ Uses simplified spatial matching
   ✅ Still enhances locations with nearby stops
   ⚠️ Reduced accuracy but stable deployment
`);


// Middleware
app.use(express.json());

// Additional middleware for AWS SNS webhooks that might send text/plain
app.use('/api/streetmanager/webhook', express.text({ type: 'text/plain' }));
app.use('/api/streetmanager/webhook', express.raw({ type: 'application/octet-stream' }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, Expires');
  
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

// Health endpoint
app.use('/api/health', healthRoutes);

// Supervisor management routes
app.use('/api/supervisor', supervisorAPI);

// Route Management and Visualization API
import routeManagementAPI from './routes/routeManagementAPI.js';
app.use('/api/routes', routeManagementAPI);

// Incident Management API (Phase 2)
import incidentAPI from './routes/incidentAPI.js';
app.use('/api/incidents', incidentAPI);

// Messaging Distribution API (Phase 4) 
import messagingAPI from './routes/messagingAPI.js';
app.use('/api/messaging', messagingAPI);

// Geocoding API endpoints
app.get('/api/geocode/:location', async (req, res) => {
  try {
    const location = decodeURIComponent(req.params.location);
    const result = await geocodeLocation(location);
    
    if (result) {
      res.json({
        success: true,
        location: location,
        coordinates: {
          latitude: result.latitude,
          longitude: result.longitude
        },
        name: result.name,
        confidence: result.confidence,
        source: result.source
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Location not found',
        location: location
      });
    }
  } catch (error) {
    console.error('❌ Geocoding API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Reverse geocoding endpoint
app.get('/api/reverse-geocode/:lat/:lng', async (req, res) => {
  try {
    const lat = parseFloat(req.params.lat);
    const lng = parseFloat(req.params.lng);
    
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates'
      });
    }
    
    const locationName = await reverseGeocode(lat, lng);
    
    res.json({
      success: true,
      coordinates: { latitude: lat, longitude: lng },
      location: locationName
    });
  } catch (error) {
    console.error('❌ Reverse geocoding API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Geocoding cache stats endpoint
app.get('/api/geocoding/stats', (req, res) => {
  try {
    const stats = getGeocodingCacheStats();
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('❌ Geocoding stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test geocoding endpoint
app.get('/api/geocoding/test', async (req, res) => {
  try {
    await testGeocoding();
    const stats = getGeocodingCacheStats();
    res.json({
      success: true,
      message: 'Geocoding test completed',
      stats: stats
    });
  } catch (error) {
    console.error('❌ Geocoding test error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
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
      response.data.tm.poi.forEach(async incident => {
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
        
        // Enhance with geocoding if location name available but coordinates missing precision
        // OK: We can use await here because fetchTomTomTrafficFixed is async
        if (!alert.coordinates || (Array.isArray(alert.coordinates) && alert.coordinates.length < 2)) {
          await enhanceAlertWithCoordinates(alert);
        }
        
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


// Cache for alerts
let cachedAlerts = null;
let lastFetchTime = null;
const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Sample test data removed - using live data only








// Create aliases for the API routes
const fetchTomTomTrafficOptimized = fetchTomTomTrafficWithStreetNames;

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚦 BARRY Backend Started with Enhanced Geocoding`);
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



// === API ROUTES SETUP ===
const globalState = {
  acknowledgedAlerts,
  alertNotes, 
  GTFS_ROUTES,
  NORTH_EAST_BBOXES,
  ACK_FILE,
  NOTES_FILE,
  cachedAlerts: null,
  lastFetchTime: null,
};

  setupAPIRoutes(app, globalState);

  // Initialize enhanced GTFS system on startup
  console.log('🆕 Initializing Enhanced GTFS Route Matcher...');
  initializeEnhancedGTFS().then((success) => {
    if (success) {
      const stats = getEnhancedGTFSStats();
      console.log('✅ Enhanced GTFS Route Matcher ready');
      console.log(`   📊 Coverage: ${stats.routes} routes, ${stats.stops} stops, ${stats.shapes} shapes`);
      console.log(`   🎯 Route matching accuracy: Enhanced`);
    } else {
      console.log('❌ Enhanced GTFS Route Matcher failed to initialize');
    }
  }).catch(error => {
    console.error('❌ Enhanced GTFS initialization error:', error.message);
  });


export { fetchTomTomTrafficWithStreetNames as fetchTomTomTrafficOptimized, initializeGTFS, getGTFSStats };
export default app;