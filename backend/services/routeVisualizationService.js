// backend/services/routeVisualizationService.js
// Route Visualization Service for Go Barry - GTFS Shapes Processing
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache for processed route data
let routeShapesCache = null;
let routeStopsCache = null;
let routeMetadataCache = null;
let isInitialized = false;

/**
 * Initialize route visualization data from GTFS files
 */
export async function initializeRouteVisualization() {
  if (isInitialized) return true;
  
  try {
    console.log('🗺️ Initializing Route Visualization System...');
    
    // Load and process all GTFS data for route visualization
    await Promise.all([
      loadRouteShapes(),
      loadRouteStops(), 
      loadRouteMetadata()
    ]);
    
    isInitialized = true;
    console.log('✅ Route Visualization System Ready');
    console.log(`   📍 ${Object.keys(routeShapesCache || {}).length} route shapes loaded`);
    console.log(`   🚌 ${Object.keys(routeMetadataCache || {}).length} routes with metadata`);
    console.log(`   🛑 Stop mapping completed`);
    
    return true;
  } catch (error) {
    console.error('❌ Route visualization initialization failed:', error.message);
    return false;
  }
}

/**
 * Load route shapes from GTFS shapes.txt and trips.txt
 */
async function loadRouteShapes() {
  try {
    console.log('📐 Loading route shapes from GTFS data...');
    
    // Load shapes.txt
    const shapesPath = path.join(__dirname, '../data/shapes.txt');
    const shapesContent = await fs.readFile(shapesPath, 'utf8');
    const shapesData = parse(shapesContent, { columns: true, skip_empty_lines: true });
    
    // Load trips.txt to map routes to shapes
    const tripsPath = path.join(__dirname, '../data/trips.txt');
    const tripsContent = await fs.readFile(tripsPath, 'utf8');
    const tripsData = parse(tripsContent, { columns: true, skip_empty_lines: true });
    
    // Load routes.txt for route names
    const routesPath = path.join(__dirname, '../data/routes.txt');
    const routesContent = await fs.readFile(routesPath, 'utf8');
    const routesData = parse(routesContent, { columns: true, skip_empty_lines: true });
    
    // Create mapping: route_short_name -> shape_ids
    const routeToShapes = {};
    const routeIdToShortName = {};
    
    // Build route ID to short name mapping
    routesData.forEach(route => {
      if (route.route_id && route.route_short_name) {
        routeIdToShortName[route.route_id] = route.route_short_name;
      }
    });
    
    // Build route to shapes mapping
    tripsData.forEach(trip => {
      if (trip.route_id && trip.shape_id) {
        const routeShortName = routeIdToShortName[trip.route_id];
        if (routeShortName) {
          if (!routeToShapes[routeShortName]) {
            routeToShapes[routeShortName] = new Set();
          }
          routeToShapes[routeShortName].add(trip.shape_id);
        }
      }
    });
    
    // Process shapes data
    const shapePoints = {};
    shapesData.forEach(point => {
      if (point.shape_id && point.shape_pt_lat && point.shape_pt_lon) {
        if (!shapePoints[point.shape_id]) {
          shapePoints[point.shape_id] = [];
        }
        shapePoints[point.shape_id].push({
          lat: parseFloat(point.shape_pt_lat),
          lng: parseFloat(point.shape_pt_lon),
          sequence: parseInt(point.shape_pt_sequence) || 0
        });
      }
    });
    
    // Sort points by sequence and build final route shapes
    routeShapesCache = {};
    
    for (const [routeShortName, shapeIds] of Object.entries(routeToShapes)) {
      routeShapesCache[routeShortName] = [];
      
      for (const shapeId of shapeIds) {
        if (shapePoints[shapeId]) {
          const sortedPoints = shapePoints[shapeId]
            .sort((a, b) => a.sequence - b.sequence)
            .map(point => [point.lat, point.lng]);
          
          if (sortedPoints.length > 0) {
            routeShapesCache[routeShortName].push({
              shapeId: shapeId,
              coordinates: sortedPoints,
              pointCount: sortedPoints.length
            });
          }
        }
      }
    }
    
    console.log(`✅ Loaded ${Object.keys(routeShapesCache).length} route shapes`);
    
  } catch (error) {
    console.error('❌ Failed to load route shapes:', error.message);
    routeShapesCache = {};
  }
}

/**
 * Load stops along each route
 */
async function loadRouteStops() {
  try {
    console.log('🛑 Loading stops for each route...');
    
    const stopsPath = path.join(__dirname, '../data/stops.txt');
    const stopsContent = await fs.readFile(stopsPath, 'utf8');
    const stopsData = parse(stopsContent, { columns: true, skip_empty_lines: true });
    
    const stopTimesPath = path.join(__dirname, '../data/stop_times.txt');
    const stopTimesContent = await fs.readFile(stopTimesPath, 'utf8');
    const stopTimesData = parse(stopTimesContent, { columns: true, skip_empty_lines: true });
    
    const tripsPath = path.join(__dirname, '../data/trips.txt');
    const tripsContent = await fs.readFile(tripsPath, 'utf8');
    const tripsData = parse(tripsContent, { columns: true, skip_empty_lines: true });
    
    const routesPath = path.join(__dirname, '../data/routes.txt');
    const routesContent = await fs.readFile(routesPath, 'utf8');
    const routesData = parse(routesContent, { columns: true, skip_empty_lines: true });
    
    // Build mappings
    const stopInfo = {};
    stopsData.forEach(stop => {
      if (stop.stop_id) {
        stopInfo[stop.stop_id] = {
          id: stop.stop_id,
          name: stop.stop_name,
          lat: parseFloat(stop.stop_lat),
          lng: parseFloat(stop.stop_lon),
          wheelchair: stop.wheelchair_boarding === '1'
        };
      }
    });
    
    const routeIdToShortName = {};
    routesData.forEach(route => {
      if (route.route_id && route.route_short_name) {
        routeIdToShortName[route.route_id] = route.route_short_name;
      }
    });
    
    const tripToRoute = {};
    tripsData.forEach(trip => {
      if (trip.trip_id && trip.route_id) {
        tripToRoute[trip.trip_id] = routeIdToShortName[trip.route_id];
      }
    });
    
    // Build route to stops mapping
    routeStopsCache = {};
    
    // Process stop times (limit to first 50,000 to prevent memory issues)
    const limitedStopTimes = stopTimesData.slice(0, 50000);
    
    limitedStopTimes.forEach(stopTime => {
      if (stopTime.trip_id && stopTime.stop_id) {
        const routeShortName = tripToRoute[stopTime.trip_id];
        if (routeShortName && stopInfo[stopTime.stop_id]) {
          if (!routeStopsCache[routeShortName]) {
            routeStopsCache[routeShortName] = new Map();
          }
          routeStopsCache[routeShortName].set(stopTime.stop_id, {
            ...stopInfo[stopTime.stop_id],
            stopSequence: parseInt(stopTime.stop_sequence) || 0
          });
        }
      }
    });
    
    // Convert Maps to sorted Arrays
    for (const [routeShortName, stopsMap] of Object.entries(routeStopsCache)) {
      routeStopsCache[routeShortName] = Array.from(stopsMap.values())
        .sort((a, b) => a.stopSequence - b.stopSequence);
    }
    
    console.log(`✅ Loaded stops for ${Object.keys(routeStopsCache).length} routes`);
    
  } catch (error) {
    console.error('❌ Failed to load route stops:', error.message);
    routeStopsCache = {};
  }
}

/**
 * Calculate route metadata (distance, estimated journey time)
 */
async function loadRouteMetadata() {
  try {
    console.log('📊 Calculating route metadata...');
    
    routeMetadataCache = {};
    
    if (!routeShapesCache) return;
    
    for (const [routeShortName, shapes] of Object.entries(routeShapesCache)) {
      const stops = routeStopsCache[routeShortName] || [];
      
      let totalDistance = 0;
      let maxPointCount = 0;
      
      // Calculate total distance across all shapes for this route
      shapes.forEach(shape => {
        if (shape.coordinates.length > 1) {
          maxPointCount = Math.max(maxPointCount, shape.pointCount);
          
          for (let i = 1; i < shape.coordinates.length; i++) {
            const distance = calculateDistance(
              shape.coordinates[i-1][0], shape.coordinates[i-1][1],
              shape.coordinates[i][0], shape.coordinates[i][1]
            );
            totalDistance += distance;
          }
        }
      });
      
      // Estimate journey time (assuming average 25 km/h including stops)
      const estimatedJourneyMinutes = Math.round((totalDistance / 1000) * 2.4); // 25 km/h = 2.4 min/km
      
      routeMetadataCache[routeShortName] = {
        totalDistance: Math.round(totalDistance), // meters
        estimatedJourneyTime: estimatedJourneyMinutes, // minutes
        stopCount: stops.length,
        shapeCount: shapes.length,
        wheelchairAccessible: stops.filter(stop => stop.wheelchair).length > 0
      };
    }
    
    console.log(`✅ Generated metadata for ${Object.keys(routeMetadataCache).length} routes`);
    
  } catch (error) {
    console.error('❌ Failed to generate route metadata:', error.message);
    routeMetadataCache = {};
  }
}

/**
 * Get visualization data for a specific route
 */
export async function getRouteVisualization(routeNumber) {
  if (!isInitialized) {
    await initializeRouteVisualization();
  }
  
  const shapes = routeShapesCache[routeNumber] || [];
  const stops = routeStopsCache[routeNumber] || [];
  const metadata = routeMetadataCache[routeNumber] || {};
  
  if (shapes.length === 0) {
    return {
      success: false,
      error: `Route ${routeNumber} not found`,
      availableRoutes: Object.keys(routeShapesCache).slice(0, 10)
    };
  }
  
  return {
    success: true,
    route: routeNumber,
    shapes: shapes.map(shape => ({
      id: shape.shapeId,
      coordinates: shape.coordinates,
      pointCount: shape.pointCount,
      // GeoJSON format for easy mapping integration
      geoJson: {
        type: "LineString",
        coordinates: shape.coordinates.map(coord => [coord[1], coord[0]]) // [lng, lat] for GeoJSON
      }
    })),
    stops: stops.map(stop => ({
      id: stop.id,
      name: stop.name,
      coordinates: [stop.lat, stop.lng],
      wheelchair: stop.wheelchair,
      sequence: stop.stopSequence
    })),
    metadata: {
      distanceKm: (metadata.totalDistance / 1000).toFixed(1),
      distanceMeters: metadata.totalDistance,
      estimatedJourneyTime: metadata.estimatedJourneyTime,
      stopCount: metadata.stopCount,
      wheelchairAccessible: metadata.wheelchairAccessible,
      lastUpdated: new Date().toISOString()
    }
  };
}

/**
 * Get all available routes for visualization
 */
export async function getAvailableRoutes() {
  if (!isInitialized) {
    await initializeRouteVisualization();
  }
  
  const routes = Object.keys(routeShapesCache || {}).map(routeNumber => ({
    routeNumber,
    ...(routeMetadataCache[routeNumber] || {})
  })).sort((a, b) => {
    // Sort numerically where possible, then alphabetically
    const aNum = parseInt(a.routeNumber);
    const bNum = parseInt(b.routeNumber);
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return aNum - bNum;
    }
    return a.routeNumber.localeCompare(b.routeNumber);
  });
  
  return {
    success: true,
    totalRoutes: routes.length,
    routes: routes
  };
}

/**
 * Get routes within a geographic bounding box
 */
export async function getRoutesInArea(north, south, east, west) {
  if (!isInitialized) {
    await initializeRouteVisualization();
  }
  
  const routesInArea = [];
  
  for (const [routeNumber, shapes] of Object.entries(routeShapesCache || {})) {
    let routeInArea = false;
    
    for (const shape of shapes) {
      for (const [lat, lng] of shape.coordinates) {
        if (lat >= south && lat <= north && lng >= west && lng <= east) {
          routeInArea = true;
          break;
        }
      }
      if (routeInArea) break;
    }
    
    if (routeInArea) {
      routesInArea.push({
        routeNumber,
        ...(routeMetadataCache[routeNumber] || {})
      });
    }
  }
  
  return {
    success: true,
    area: { north, south, east, west },
    routeCount: routesInArea.length,
    routes: routesInArea
  };
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

/**
 * Get system statistics
 */
export function getVisualizationStats() {
  return {
    initialized: isInitialized,
    routeCount: Object.keys(routeShapesCache || {}).length,
    totalShapes: Object.values(routeShapesCache || {}).reduce((sum, shapes) => sum + shapes.length, 0),
    totalStops: Object.values(routeStopsCache || {}).reduce((sum, stops) => sum + stops.length, 0),
    memoryUsage: {
      routeShapes: routeShapesCache ? 'loaded' : 'not loaded',
      routeStops: routeStopsCache ? 'loaded' : 'not loaded',
      routeMetadata: routeMetadataCache ? 'loaded' : 'not loaded'
    }
  };
}

export default {
  initializeRouteVisualization,
  getRouteVisualization,
  getAvailableRoutes,
  getRoutesInArea,
  getVisualizationStats
};
