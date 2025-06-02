// backend/gtfs-location-enhancer.js
// GTFS-based location enhancement for TomTom traffic alerts
// Handles large GTFS files (shapes.txt: 34MB) with spatial indexing

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
// Note: You'll need to install papaparse first: npm install papaparse
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🗺️ GTFS Location Enhancer Loading...');

// Spatial grid configuration for fast coordinate lookups
const SPATIAL_GRID_SIZE = 0.01; // ~1km grid cells
const MAX_DISTANCE_METERS = 500; // Maximum distance to consider for matching

// Cache for processed GTFS data
let gtfsCache = {
  stops: new Map(),
  routes: new Map(),
  spatialGrid: new Map(),
  routeSegments: new Map(),
  isLoaded: false,
  lastLoaded: null
};

// Haversine distance calculation (accurate for short distances)
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Convert coordinates to spatial grid key
function getGridKey(lat, lng) {
  const gridLat = Math.floor(lat / SPATIAL_GRID_SIZE);
  const gridLng = Math.floor(lng / SPATIAL_GRID_SIZE);
  return `${gridLat},${gridLng}`;
}

// Get neighboring grid cells for broader search
function getNeighboringGridKeys(lat, lng) {
  const keys = [];
  const baseLat = Math.floor(lat / SPATIAL_GRID_SIZE);
  const baseLng = Math.floor(lng / SPATIAL_GRID_SIZE);
  
  for (let latOffset = -1; latOffset <= 1; latOffset++) {
    for (let lngOffset = -1; lngOffset <= 1; lngOffset++) {
      keys.push(`${baseLat + latOffset},${baseLng + lngOffset}`);
    }
  }
  return keys;
}

// Load and parse GTFS stops
async function loadGTFSStops() {
  try {
    console.log('📍 Loading GTFS stops...');
    const stopsPath = path.join(__dirname, 'data', 'stops.txt');
    const stopsData = await fs.readFile(stopsPath, 'utf8');
    
    const parsed = Papa.parse(stopsData, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true
    });
    
    if (parsed.errors.length > 0) {
      console.warn('⚠️ GTFS stops parsing warnings:', parsed.errors.slice(0, 3));
    }
    
    let processedCount = 0;
    
    parsed.data.forEach(stop => {
      if (stop.stop_id && stop.stop_lat && stop.stop_lng && stop.stop_name) {
        // Only include stops in North East (rough bounding box)
        if (stop.stop_lat >= 54.0 && stop.stop_lat <= 55.5 && 
            stop.stop_lng >= -2.5 && stop.stop_lng <= -0.5) {
          
          gtfsCache.stops.set(stop.stop_id, {
            id: stop.stop_id,
            name: stop.stop_name.trim(),
            lat: parseFloat(stop.stop_lat),
            lng: parseFloat(stop.stop_lng),
            code: stop.stop_code || null,
            desc: stop.stop_desc || null
          });
          processedCount++;
        }
      }
    });
    
    console.log(`✅ Loaded ${processedCount} North East bus stops`);
    return true;
    
  } catch (error) {
    console.error('❌ Failed to load GTFS stops:', error.message);
    return false;
  }
}

// Load and parse GTFS routes
async function loadGTFSRoutes() {
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
          longName: route.route_long_name?.trim() || '',
          type: route.route_type,
          color: route.route_color || 'FFFFFF',
          textColor: route.route_text_color || '000000'
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

// Load and process GTFS shapes (the big 34MB file) with spatial indexing
async function loadGTFSShapes() {
  try {
    console.log('🗺️ Loading GTFS shapes (34MB file)...');
    const shapesPath = path.join(__dirname, 'data', 'shapes.txt');
    const tripsPath = path.join(__dirname, 'data', 'trips.txt');
    
    // First load trips to map shapes to routes
    console.log('🔄 Loading trips for shape-to-route mapping...');
    const tripsData = await fs.readFile(tripsPath, 'utf8');
    const tripsParsed = Papa.parse(tripsData, {
      header: true,
      skipEmptyLines: true
    });
    
    // Create shape_id to route_id mapping
    const shapeToRoutes = new Map();
    tripsParsed.data.forEach(trip => {
      if (trip.shape_id && trip.route_id) {
        if (!shapeToRoutes.has(trip.shape_id)) {
          shapeToRoutes.set(trip.shape_id, new Set());
        }
        shapeToRoutes.get(trip.shape_id).add(trip.route_id);
      }
    });
    
    console.log(`🔗 Mapped ${shapeToRoutes.size} shapes to routes`);
    
    // Now process the large shapes file in chunks
    console.log('📐 Processing shapes file with spatial indexing...');
    const shapesData = await fs.readFile(shapesPath, 'utf8');
    
    const parsed = Papa.parse(shapesData, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      chunk: (results) => {
        // Process chunks to avoid memory issues with 34MB file
        results.data.forEach(point => {
          if (point.shape_id && point.shape_pt_lat && point.shape_pt_lng) {
            const lat = parseFloat(point.shape_pt_lat);
            const lng = parseFloat(point.shape_pt_lng);
            
            // Only process points in North East
            if (lat >= 54.0 && lat <= 55.5 && lng >= -2.5 && lng <= -0.5) {
              const gridKey = getGridKey(lat, lng);
              
              if (!gtfsCache.spatialGrid.has(gridKey)) {
                gtfsCache.spatialGrid.set(gridKey, []);
              }
              
              // Get associated routes for this shape
              const associatedRoutes = shapeToRoutes.get(point.shape_id) || new Set();
              
              gtfsCache.spatialGrid.get(gridKey).push({
                shapeId: point.shape_id,
                lat: lat,
                lng: lng,
                sequence: point.shape_pt_sequence || 0,
                routes: Array.from(associatedRoutes)
              });
            }
          }
        });
      }
    });
    
    console.log(`✅ Created spatial grid with ${gtfsCache.spatialGrid.size} cells`);
    
    // Build route segments for more precise location descriptions
    buildRouteSegments(shapeToRoutes);
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to load GTFS shapes:', error.message);
    return false;
  }
}

// Build route segments for better location descriptions
function buildRouteSegments(shapeToRoutes) {
  console.log('🧩 Building route segments...');
  
  let segmentCount = 0;
  
  for (const [gridKey, points] of gtfsCache.spatialGrid.entries()) {
    // Group points by shape and create segments
    const shapeGroups = new Map();
    
    points.forEach(point => {
      if (!shapeGroups.has(point.shapeId)) {
        shapeGroups.set(point.shapeId, []);
      }
      shapeGroups.get(point.shapeId).push(point);
    });
    
    // Create segments for each shape
    shapeGroups.forEach((shapePoints, shapeId) => {
      if (shapePoints.length >= 2) {
        // Sort by sequence and create segments between consecutive points
        shapePoints.sort((a, b) => a.sequence - b.sequence);
        
        for (let i = 0; i < shapePoints.length - 1; i++) {
          const startPoint = shapePoints[i];
          const endPoint = shapePoints[i + 1];
          
          const segmentId = `${shapeId}_${startPoint.sequence}_${endPoint.sequence}`;
          const routes = startPoint.routes;
          
          if (routes.length > 0) {
            gtfsCache.routeSegments.set(segmentId, {
              shapeId: shapeId,
              startLat: startPoint.lat,
              startLng: startPoint.lng,
              endLat: endPoint.lat,
              endLng: endPoint.lng,
              centerLat: (startPoint.lat + endPoint.lat) / 2,
              centerLng: (startPoint.lng + endPoint.lng) / 2,
              routes: routes,
              routeNames: routes.map(routeId => {
                const route = gtfsCache.routes.get(routeId);
                return route ? route.shortName : routeId;
              }).filter(name => name)
            });
            segmentCount++;
          }
        }
      }
    });
  }
  
  console.log(`✅ Created ${segmentCount} route segments`);
}

// Initialize GTFS data (call once on startup)
export async function initializeGTFS() {
  if (gtfsCache.isLoaded && gtfsCache.lastLoaded) {
    const hoursSinceLoad = (Date.now() - gtfsCache.lastLoaded) / (1000 * 60 * 60);
    if (hoursSinceLoad < 24) {
      console.log('📋 GTFS data already loaded and fresh');
      return true;
    }
  }
  
  console.log('🔄 Initializing GTFS location enhancer...');
  const startTime = Date.now();
  
  // Clear existing cache
  gtfsCache.stops.clear();
  gtfsCache.routes.clear();
  gtfsCache.spatialGrid.clear();
  gtfsCache.routeSegments.clear();
  
  try {
    // Load all GTFS components
    const [stopsOk, routesOk, shapesOk] = await Promise.all([
      loadGTFSStops(),
      loadGTFSRoutes(),
      loadGTFSShapes()
    ]);
    
    if (stopsOk && routesOk && shapesOk) {
      gtfsCache.isLoaded = true;
      gtfsCache.lastLoaded = Date.now();
      
      const loadTime = Date.now() - startTime;
      console.log(`✅ GTFS initialization complete in ${(loadTime/1000).toFixed(1)}s`);
      console.log(`📊 Loaded: ${gtfsCache.stops.size} stops, ${gtfsCache.routes.size} routes, ${gtfsCache.spatialGrid.size} grid cells`);
      
      return true;
    } else {
      throw new Error('Failed to load one or more GTFS components');
    }
    
  } catch (error) {
    console.error('❌ GTFS initialization failed:', error.message);
    gtfsCache.isLoaded = false;
    return false;
  }
}

// Find nearby bus stops for landmark references
export function findNearbyStops(lat, lng, maxDistanceMeters = MAX_DISTANCE_METERS) {
  if (!gtfsCache.isLoaded) {
    console.warn('⚠️ GTFS not loaded - cannot find nearby stops');
    return [];
  }
  
  const nearbyStops = [];
  
  gtfsCache.stops.forEach(stop => {
    const distance = calculateDistance(lat, lng, stop.lat, stop.lng);
    if (distance <= maxDistanceMeters) {
      nearbyStops.push({
        ...stop,
        distance: Math.round(distance)
      });
    }
  });
  
  // Sort by distance, closest first
  nearbyStops.sort((a, b) => a.distance - b.distance);
  
  return nearbyStops.slice(0, 3); // Return up to 3 closest stops
}

// Find route segments that intersect with incident location
export function findIntersectingRoutes(lat, lng, toleranceMeters = 100) {
  if (!gtfsCache.isLoaded) {
    console.warn('⚠️ GTFS not loaded - cannot find intersecting routes');
    return [];
  }
  
  const gridKeys = getNeighboringGridKeys(lat, lng);
  const intersectingRoutes = new Set();
  const routeDetails = [];
  
  gridKeys.forEach(gridKey => {
    const gridPoints = gtfsCache.spatialGrid.get(gridKey) || [];
    
    gridPoints.forEach(point => {
      const distance = calculateDistance(lat, lng, point.lat, point.lng);
      if (distance <= toleranceMeters) {
        point.routes.forEach(routeId => {
          if (!intersectingRoutes.has(routeId)) {
            intersectingRoutes.add(routeId);
            const route = gtfsCache.routes.get(routeId);
            if (route) {
              routeDetails.push({
                routeId: routeId,
                shortName: route.shortName,
                longName: route.longName,
                distance: Math.round(distance)
              });
            }
          }
        });
      }
    });
  });
  
  // Sort by route number/name
  routeDetails.sort((a, b) => {
    const aNum = parseInt(a.shortName) || 999;
    const bNum = parseInt(b.shortName) || 999;
    return aNum - bNum;
  });
  
  return routeDetails;
}

// Enhanced location description using GTFS data
export function enhanceLocationWithGTFS(lat, lng, originalLocation = '', roadName = '') {
  if (!gtfsCache.isLoaded) {
    console.warn('⚠️ GTFS not loaded - using original location');
    return originalLocation || `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
  
  try {
    // Find nearby stops for landmark reference
    const nearbyStops = findNearbyStops(lat, lng, 300);
    
    // Find intersecting routes
    const intersectingRoutes = findIntersectingRoutes(lat, lng, 150);
    
    // Build enhanced location description
    let enhancedLocation = originalLocation || roadName || 'Traffic Location';
    
    // Add nearest stop reference
    if (nearbyStops.length > 0) {
      const closestStop = nearbyStops[0];
      enhancedLocation += ` (near ${closestStop.name})`;
      
      if (closestStop.distance <= 50) {
        enhancedLocation += ` [${closestStop.distance}m]`;
      }
    }
    
    // Add affected routes
    if (intersectingRoutes.length > 0) {
      const routeNames = intersectingRoutes.slice(0, 6).map(r => r.shortName);
      enhancedLocation += ` - affects routes: ${routeNames.join(', ')}`;
      
      if (intersectingRoutes.length > 6) {
        enhancedLocation += ` +${intersectingRoutes.length - 6} more`;
      }
    }
    
    return enhancedLocation;
    
  } catch (error) {
    console.warn('⚠️ GTFS location enhancement failed:', error.message);
    return originalLocation || `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

// Get GTFS statistics for monitoring
export function getGTFSStats() {
  return {
    isLoaded: gtfsCache.isLoaded,
    lastLoaded: gtfsCache.lastLoaded ? new Date(gtfsCache.lastLoaded).toISOString() : null,
    stops: gtfsCache.stops.size,
    routes: gtfsCache.routes.size,
    spatialGridCells: gtfsCache.spatialGrid.size,
    routeSegments: gtfsCache.routeSegments.size
  };
}

// Export the main enhancement function for use in traffic fetchers
export default enhanceLocationWithGTFS;