// backend/gtfs-route-matcher.js
// On-demand GTFS route matching using actual Go North East route shapes

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🗺️ GTFS Route Matcher Loading (On-Demand Processing)...');

// Cache for route lookups to avoid re-processing
const routeMatchCache = new Map();
const CACHE_EXPIRE_TIME = 60 * 60 * 1000; // 1 hour

// Distance threshold for route matching (meters)
const ROUTE_MATCH_DISTANCE = 100; // 100 meters

// Calculate distance between two points (Haversine formula)
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

// Load route ID to route name mapping
let routeMapping = new Map();
let routeMappingLoaded = false;

async function loadRouteMapping() {
  if (routeMappingLoaded) return;
  
  try {
    console.log('🚌 Loading GTFS route mapping...');
    const routesPath = path.join(__dirname, 'data', 'routes.txt');
    const routesData = await fs.readFile(routesPath, 'utf8');
    
    const parsed = Papa.parse(routesData, {
      header: true,
      skipEmptyLines: true
    });
    
    parsed.data.forEach(route => {
      if (route.route_id && route.route_short_name) {
        routeMapping.set(route.route_id, route.route_short_name.trim());
      }
    });
    
    console.log(`✅ Loaded ${routeMapping.size} route mappings`);
    routeMappingLoaded = true;
    
  } catch (error) {
    console.error('❌ Failed to load route mapping:', error.message);
  }
}

// Load trip to route mapping
let tripToRouteMapping = new Map();
let tripMappingLoaded = false;

async function loadTripMapping() {
  if (tripMappingLoaded) return;
  
  try {
    console.log('🔄 Loading GTFS trip mapping...');
    const tripsPath = path.join(__dirname, 'data', 'trips.txt');
    const tripsData = await fs.readFile(tripsPath, 'utf8');
    
    const parsed = Papa.parse(tripsData, {
      header: true,
      skipEmptyLines: true
    });
    
    parsed.data.forEach(trip => {
      if (trip.shape_id && trip.route_id) {
        if (!tripToRouteMapping.has(trip.shape_id)) {
          tripToRouteMapping.set(trip.shape_id, new Set());
        }
        tripToRouteMapping.get(trip.shape_id).add(trip.route_id);
      }
    });
    
    console.log(`✅ Loaded ${tripToRouteMapping.size} shape-to-route mappings`);
    tripMappingLoaded = true;
    
  } catch (error) {
    console.error('❌ Failed to load trip mapping:', error.message);
  }
}

// Main function: Find routes near coordinates using GTFS shapes
export async function findGTFSRoutesNearCoordinates(lat, lng, maxDistanceMeters = ROUTE_MATCH_DISTANCE) {
  try {
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    
    // Check cache first
    if (routeMatchCache.has(cacheKey)) {
      const cached = routeMatchCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_EXPIRE_TIME) {
        console.log(`📋 Using cached GTFS routes for ${cacheKey}: ${cached.routes.join(', ')}`);
        return cached.routes;
      } else {
        routeMatchCache.delete(cacheKey); // Expired
      }
    }
    
    console.log(`🔍 Finding GTFS routes near ${lat}, ${lng} (within ${maxDistanceMeters}m)...`);
    
    // Ensure mappings are loaded
    await loadRouteMapping();
    await loadTripMapping();
    
    if (routeMapping.size === 0) {
      console.warn('⚠️ No route mapping available');
      return [];
    }
    
    // Stream through shapes.txt looking for nearby points
    const shapesPath = path.join(__dirname, 'data', 'shapes.txt');
    const shapesData = await fs.readFile(shapesPath, 'utf8');
    
    console.log('📐 Streaming through shapes.txt for coordinate matching...');
    
    const nearbyShapes = new Set();
    let processedPoints = 0;
    let matchedPoints = 0;
    
    // Parse shapes in chunks to manage memory
    const parsed = Papa.parse(shapesData, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      step: (row) => {
        processedPoints++;
        
        if (row.data.shape_id && row.data.shape_pt_lat && row.data.shape_pt_lng) {
          const shapeLat = parseFloat(row.data.shape_pt_lat);
          const shapeLng = parseFloat(row.data.shape_pt_lng);
          
          // Only check points roughly in North East to speed up processing
          if (shapeLat >= 54.0 && shapeLat <= 56.0 && shapeLng >= -3.0 && shapeLng <= 0.0) {
            const distance = calculateDistance(lat, lng, shapeLat, shapeLng);
            
            if (distance <= maxDistanceMeters) {
              nearbyShapes.add(row.data.shape_id);
              matchedPoints++;
              
              // Log first few matches for debugging
              if (matchedPoints <= 3) {
                console.log(`✅ Shape match: ${row.data.shape_id} at ${distance.toFixed(1)}m`);
              }
            }
          }
        }
        
        // Progress indicator for large file
        if (processedPoints % 50000 === 0) {
          console.log(`   Processed ${processedPoints} shape points...`);
        }
      },
      complete: () => {
        console.log(`📊 Processed ${processedPoints} shape points, found ${matchedPoints} matches`);
      }
    });
    
    // Convert shapes to routes
    const matchedRoutes = new Set();
    
    for (const shapeId of nearbyShapes) {
      if (tripToRouteMapping.has(shapeId)) {
        const routeIds = tripToRouteMapping.get(shapeId);
        for (const routeId of routeIds) {
          if (routeMapping.has(routeId)) {
            const routeName = routeMapping.get(routeId);
            matchedRoutes.add(routeName);
          }
        }
      }
    }
    
    const finalRoutes = Array.from(matchedRoutes).sort((a, b) => {
      // Sort numerically where possible
      const aNum = parseInt(a) || 999;
      const bNum = parseInt(b) || 999;
      return aNum - bNum;
    });
    
    // Cache the result
    routeMatchCache.set(cacheKey, {
      routes: finalRoutes,
      timestamp: Date.now()
    });
    
    console.log(`🎯 Found ${finalRoutes.length} GTFS routes: ${finalRoutes.join(', ')}`);
    
    return finalRoutes;
    
  } catch (error) {
    console.error(`❌ GTFS route matching failed for ${lat}, ${lng}:`, error.message);
    return [];
  }
}

// Get cache statistics
export function getGTFSRouteMatcherStats() {
  return {
    cacheSize: routeMatchCache.size,
    routeMappingSize: routeMapping.size,
    tripMappingSize: tripToRouteMapping.size,
    sampleCachedLocations: Array.from(routeMatchCache.keys()).slice(0, 5)
  };
}

export default findGTFSRoutesNearCoordinates;