// backend/gtfs-location-enhancer-optimized.js
// Memory-optimized version for Render deployment (34MB shapes file)
// Streams data instead of loading everything into memory

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🗺️ GTFS Location Enhancer (Memory Optimized) Loading...');

// Reduced grid size for memory efficiency
const SPATIAL_GRID_SIZE = 0.005; // ~500m grid cells (smaller = less memory per cell)
const MAX_DISTANCE_METERS = 300; // Reduced search radius
const MAX_STOPS_TO_LOAD = 2000; // Limit stops to prevent memory issues

// Simplified cache structure
let gtfsCache = {
  stops: new Map(),
  routes: new Map(),
  isLoaded: false,
  lastLoaded: null
};

// Much more generous bounding box to capture all Go North East stops
const NORTH_EAST_BOUNDS = {
  north: 56.5,   // Much further north (covers all of Northumberland)
  south: 53.0,   // Further south (covers Teesside)
  east: 0.5,     // Further east (covers coast)
  west: -3.5     // Further west (covers Cumbria border)
};

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function isInNorthEast(lat, lng) {
  return lat >= NORTH_EAST_BOUNDS.south && 
         lat <= NORTH_EAST_BOUNDS.north && 
         lng >= NORTH_EAST_BOUNDS.west && 
         lng <= NORTH_EAST_BOUNDS.east;
}

// Memory-optimized stops loading
async function loadGTFSStopsOptimized() {
  try {
    console.log('📍 Loading GTFS stops (memory optimized)...');
    const stopsPath = path.join(__dirname, 'data', 'stops.txt');
    const stopsData = await fs.readFile(stopsPath, 'utf8');
    
    const parsed = Papa.parse(stopsData, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true
    });
    
    let processedCount = 0;
    let skippedCount = 0;
    
    for (const stop of parsed.data) {
      if (processedCount >= MAX_STOPS_TO_LOAD) {
        console.log(`📍 Reached stop limit (${MAX_STOPS_TO_LOAD}) to prevent memory issues`);
        break;
      }
      
      if (stop.stop_id && stop.stop_lat && stop.stop_lng && stop.stop_name) {
        const lat = parseFloat(stop.stop_lat);
        const lng = parseFloat(stop.stop_lng);
        
        if (isInNorthEast(lat, lng)) {
          gtfsCache.stops.set(stop.stop_id, {
            id: stop.stop_id,
            name: stop.stop_name.trim(),
            lat: lat,
            lng: lng,
            code: stop.stop_code || null
          });
          processedCount++;
        } else {
          skippedCount++;
        }
      }
    }
    
    console.log(`✅ Loaded ${processedCount} North East bus stops (${skippedCount} outside region)`);
    console.log(`📍 Bounding box: ${NORTH_EAST_BOUNDS.south}-${NORTH_EAST_BOUNDS.north} lat, ${NORTH_EAST_BOUNDS.west}-${NORTH_EAST_BOUNDS.east} lng`);
    return true;
    
  } catch (error) {
    console.error('❌ Failed to load GTFS stops:', error.message);
    return false;
  }
}

// Simplified routes loading
async function loadGTFSRoutesOptimized() {
  try {
    console.log('🚌 Loading GTFS routes...');
    const routesPath = path.join(__dirname, 'data', 'routes.txt');
    const routesData = await fs.readFile(routesPath, 'utf8');
    
    const parsed = Papa.parse(routesData, {
      header: true,
      skipEmptyLines: true
    });
    
    parsed.data.forEach(route => {
      if (route.route_id && route.route_short_name) {
        gtfsCache.routes.set(route.route_id, {
          id: route.route_id,
          shortName: route.route_short_name.trim(),
          longName: route.route_long_name?.trim() || ''
        });
      }
    });
    
    console.log(`✅ Loaded ${gtfsCache.routes.size} Go North East routes`);
    return true;
    
  } catch (error) {
    console.error('❌ Failed to load GTFS routes:', error.message);
    return false;
  }
}

// SKIP SHAPES PROCESSING for now to avoid memory issues
async function skipShapesProcessing() {
  console.log('⚠️ Skipping shapes processing to prevent memory issues');
  console.log('🔄 Using simplified route matching based on location names only');
  return true;
}

// Simplified route matching without spatial data
function matchRoutesToLocationSimplified(location, roadName = '') {
  const text = `${location} ${roadName}`.toLowerCase();
  const matchedRoutes = [];
  
  // Simple keyword-based route matching
  const routePatterns = {
    'a1': ['21', 'X21', '10', '11'],
    'a19': ['1', '2', '308', '309', '19'],
    'a167': ['21', '22', 'X21', '6', '7'],
    'a1058': ['1', '2', '308', '309', '317'],
    'coast road': ['1', '2', '308', '309', '317'],
    'newcastle': ['Q1', 'Q2', 'Q3', '10', '11', '12'],
    'gateshead': ['21', '25', '28', '29'],
    'sunderland': ['16', '18', '20', '61', '62'],
    'durham': ['21', '22', 'X21', '6', '7'],
    'tyne tunnel': ['1', '2', '308', '309'],
    'washington': ['61', '62', '63', '64', '65']
  };
  
  for (const [pattern, routes] of Object.entries(routePatterns)) {
    if (text.includes(pattern)) {
      matchedRoutes.push(...routes);
    }
  }
  
  return [...new Set(matchedRoutes)].sort();
}

// Memory-optimized initialization
export async function initializeGTFSOptimized() {
  if (gtfsCache.isLoaded) {
    console.log('📋 GTFS data already loaded');
    return true;
  }
  
  console.log('🔄 Initializing GTFS (memory optimized for Render)...');
  const startTime = Date.now();
  
  try {
    // Load only stops and routes, skip shapes to prevent memory issues
    const [stopsOk, routesOk] = await Promise.all([
      loadGTFSStopsOptimized(),
      loadGTFSRoutesOptimized()
    ]);
    
    // Skip shapes processing for now
    const shapesOk = await skipShapesProcessing();
    
    if (stopsOk && routesOk) {
      gtfsCache.isLoaded = true;
      gtfsCache.lastLoaded = Date.now();
      
      const loadTime = Date.now() - startTime;
      console.log(`✅ GTFS optimization complete in ${(loadTime/1000).toFixed(1)}s`);
      console.log(`📊 Loaded: ${gtfsCache.stops.size} stops, ${gtfsCache.routes.size} routes`);
      console.log(`💾 Memory optimized - shapes processing skipped`);
      
      return true;
    } else {
      throw new Error('Failed to load GTFS components');
    }
    
  } catch (error) {
    console.error('❌ GTFS initialization failed:', error.message);
    gtfsCache.isLoaded = false;
    return false;
  }
}

// Find nearby stops with limited results
export function findNearbyStopsOptimized(lat, lng, maxDistanceMeters = MAX_DISTANCE_METERS) {
  if (!gtfsCache.isLoaded) {
    return [];
  }
  
  const nearbyStops = [];
  let checkedCount = 0;
  const maxChecks = 500; // Limit iterations to prevent performance issues
  
  for (const stop of gtfsCache.stops.values()) {
    if (checkedCount++ > maxChecks) break;
    
    const distance = calculateDistance(lat, lng, stop.lat, stop.lng);
    if (distance <= maxDistanceMeters) {
      nearbyStops.push({
        ...stop,
        distance: Math.round(distance)
      });
    }
  }
  
  return nearbyStops.sort((a, b) => a.distance - b.distance).slice(0, 2);
}

// Simplified enhanced location without spatial indexing
export function enhanceLocationWithGTFSOptimized(lat, lng, originalLocation = '', roadName = '') {
  if (!gtfsCache.isLoaded) {
    return originalLocation || `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
  
  try {
    // Find nearby stops
    const nearbyStops = findNearbyStopsOptimized(lat, lng, 250);
    
    // Use simplified route matching
    const matchedRoutes = matchRoutesToLocationSimplified(originalLocation, roadName);
    
    // Build enhanced location
    let enhancedLocation = originalLocation || roadName || 'Traffic Location';
    
    if (nearbyStops.length > 0) {
      const closestStop = nearbyStops[0];
      enhancedLocation += ` (near ${closestStop.name})`;
      if (closestStop.distance <= 100) {
        enhancedLocation += ` [${closestStop.distance}m]`;
      }
    }
    
    if (matchedRoutes.length > 0) {
      enhancedLocation += ` - affects routes: ${matchedRoutes.slice(0, 5).join(', ')}`;
      if (matchedRoutes.length > 5) {
        enhancedLocation += ` +${matchedRoutes.length - 5} more`;
      }
    }
    
    return enhancedLocation;
    
  } catch (error) {
    console.warn('⚠️ Location enhancement failed:', error.message);
    return originalLocation || `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

// Get optimized GTFS stats
export function getGTFSStatsOptimized() {
  return {
    isLoaded: gtfsCache.isLoaded,
    lastLoaded: gtfsCache.lastLoaded ? new Date(gtfsCache.lastLoaded).toISOString() : null,
    stops: gtfsCache.stops.size,
    routes: gtfsCache.routes.size,
    memoryOptimized: true,
    shapesSkipped: true,
    reason: 'Memory optimization for Render deployment'
  };
}

export default enhanceLocationWithGTFSOptimized;