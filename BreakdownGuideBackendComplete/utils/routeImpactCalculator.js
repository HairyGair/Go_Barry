import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as turf from '@turf/turf';
import { parse } from 'csv-parse';
import { Readable } from 'stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache for route geometries to avoid reprocessing
let routeGeometriesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache

/**
 * Parse GTFS data and build route geometries with direction info
 */
async function loadRouteGeometries() {
  // Check cache first
  if (routeGeometriesCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    return routeGeometriesCache;
  }

  console.log('[RouteImpact] Loading GTFS data...');
  
  const dataDir = path.join(__dirname, '..', 'data');
  const routeGeometries = new Map();

  try {
    // Step 1: Load routes data
    const routes = await parseCSV(path.join(dataDir, 'routes.txt'));
    const routesMap = new Map();
    routes.forEach(route => {
      routesMap.set(route.route_id, {
        routeNumber: route.route_short_name,
        routeName: route.route_long_name || route.route_short_name
      });
    });

    // Step 2: Load trips to get shape-route-direction mappings
    const trips = await parseCSV(path.join(dataDir, 'trips.txt'));
    const shapeToRouteMap = new Map();
    
    trips.forEach(trip => {
      const routeInfo = routesMap.get(trip.route_id);
      if (!routeInfo) return;

      if (!shapeToRouteMap.has(trip.shape_id)) {
        shapeToRouteMap.set(trip.shape_id, {
          routeId: trip.route_id,
          routeNumber: routeInfo.routeNumber,
          direction: trip.direction_id === '1' ? 'outbound' : 'inbound',
          headsign: trip.trip_headsign || 'Unknown destination'
        });
      }
    });

    // Step 3: Load shapes and build geometries
    const shapes = await parseCSV(path.join(dataDir, 'shapes.txt'));
    const shapePoints = new Map();

    // Group points by shape_id
    shapes.forEach(point => {
      if (!shapePoints.has(point.shape_id)) {
        shapePoints.set(point.shape_id, []);
      }
      shapePoints.get(point.shape_id).push({
        lat: parseFloat(point.shape_pt_lat),
        lng: parseFloat(point.shape_pt_lon),
        sequence: parseInt(point.shape_pt_sequence)
      });
    });

    // Build geometries
    shapePoints.forEach((points, shapeId) => {
      const routeInfo = shapeToRouteMap.get(shapeId);
      if (!routeInfo) return;

      // Sort by sequence
      points.sort((a, b) => a.sequence - b.sequence);

      // Create LineString
      const coordinates = points.map(p => [p.lng, p.lat]);
      if (coordinates.length < 2) return; // Need at least 2 points

      const lineString = turf.lineString(coordinates);
      const key = `${routeInfo.routeNumber}_${routeInfo.direction}`;

      routeGeometries.set(key, {
        routeNumber: routeInfo.routeNumber,
        direction: routeInfo.direction,
        headsign: routeInfo.headsign,
        geometry: lineString,
        shapeId: shapeId
      });
    });

    console.log(`[RouteImpact] Loaded ${routeGeometries.size} route geometries`);
    
    // Update cache
    routeGeometriesCache = routeGeometries;
    cacheTimestamp = Date.now();
    
    return routeGeometries;

  } catch (error) {
    console.error('[RouteImpact] Error loading route geometries:', error);
    throw error;
  }
}

/**
 * Parse CSV file helper
 */
function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    fs.createReadStream(filePath)
      .pipe(parser)
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

/**
 * Calculate which routes are affected by roadworks
 * @param {Object} roadwork - Roadwork object with coordinates or LINESTRING
 * @param {number} bufferDistance - Buffer distance in meters (default 25m)
 */
export async function calculateAffectedRoutes(roadwork, bufferDistance = 25) {
  try {
    const routeGeometries = await loadRouteGeometries();
    const affectedRoutes = [];

    // Create geometry from roadwork
    let roadworkGeometry;
    
    // Handle LINESTRING from Street Manager
    if (roadwork.works_location_coordinates) {
      const coords = parseLineString(roadwork.works_location_coordinates);
      if (coords && coords.length >= 2) {
        roadworkGeometry = turf.lineString(coords);
      }
    }
    
    // Fallback to point coordinates
    if (!roadworkGeometry && roadwork.coordinates && roadwork.coordinates.length === 2) {
      const [lat, lng] = roadwork.coordinates;
      roadworkGeometry = turf.point([lng, lat]);
    }

    if (!roadworkGeometry) {
      console.warn('[RouteImpact] No valid geometry for roadwork:', roadwork.sm_permit_ref);
      return [];
    }

    // Create buffered area around roadwork
    const bufferedRoadwork = turf.buffer(roadworkGeometry, bufferDistance, { units: 'meters' });

    // Check each route for intersection
    routeGeometries.forEach((route, key) => {
      try {
        // Check if route intersects with buffered roadwork area
        const intersects = turf.booleanIntersects(route.geometry, bufferedRoadwork);
        
        if (intersects) {
          // Calculate intersection details
          let intersectionLength = 0;
          try {
            const intersection = turf.lineIntersect(route.geometry, bufferedRoadwork);
            if (intersection.features.length > 0) {
              // If multiple intersection points, calculate affected length
              if (intersection.features.length > 1) {
                const intersectionPoints = intersection.features.map(f => f.geometry.coordinates);
                for (let i = 1; i < intersectionPoints.length; i++) {
                  intersectionLength += turf.distance(
                    turf.point(intersectionPoints[i-1]), 
                    turf.point(intersectionPoints[i]), 
                    { units: 'meters' }
                  );
                }
              }
            }
          } catch (e) {
            // Some geometry operations might fail, continue anyway
          }

          affectedRoutes.push({
            routeNumber: route.routeNumber,
            direction: route.direction,
            headsign: route.headsign,
            impact: {
              severity: intersectionLength > 100 ? 'high' : 'medium',
              intersectionLength: Math.round(intersectionLength),
              bufferDistance
            }
          });
        }
      } catch (error) {
        console.error(`[RouteImpact] Error checking route ${key}:`, error.message);
      }
    });

    // Sort by route number and direction
    affectedRoutes.sort((a, b) => {
      const numA = parseInt(a.routeNumber) || 999;
      const numB = parseInt(b.routeNumber) || 999;
      if (numA !== numB) return numA - numB;
      return a.direction.localeCompare(b.direction);
    });

    return affectedRoutes;

  } catch (error) {
    console.error('[RouteImpact] Error calculating affected routes:', error);
    return [];
  }
}

/**
 * Parse LINESTRING WKT format
 */
function parseLineString(wkt) {
  try {
    // Extract coordinates from LINESTRING(x1 y1, x2 y2, ...)
    const match = wkt.match(/LINESTRING\s*\(\s*(.+)\s*\)/);
    if (!match) return null;

    const coordPairs = match[1].split(',');
    return coordPairs.map(pair => {
      const [x, y] = pair.trim().split(/\s+/).map(parseFloat);
      return [x, y]; // [lng, lat] for GeoJSON
    });
  } catch (error) {
    console.error('[RouteImpact] Error parsing LINESTRING:', error);
    return null;
  }
}

/**
 * Get a summary of affected routes for display
 */
export function formatAffectedRoutesSummary(affectedRoutes) {
  if (!affectedRoutes || affectedRoutes.length === 0) {
    return 'No routes affected';
  }

  // Group by route number
  const routeGroups = {};
  affectedRoutes.forEach(route => {
    if (!routeGroups[route.routeNumber]) {
      routeGroups[route.routeNumber] = [];
    }
    routeGroups[route.routeNumber].push(route.direction);
  });

  // Format summary
  const summaryParts = [];
  Object.entries(routeGroups).forEach(([routeNumber, directions]) => {
    if (directions.length === 2) {
      summaryParts.push(`${routeNumber} (both directions)`);
    } else {
      summaryParts.push(`${routeNumber} (${directions[0]})`);
    }
  });

  return summaryParts.join(', ');
}

// Pre-load cache on module load
loadRouteGeometries().catch(console.error);
