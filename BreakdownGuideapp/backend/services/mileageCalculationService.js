/**
 * Mileage Calculation Service
 *
 * Calculates estimated mileage lost when a breakdown occurs using GTFS data.
 * Uses stop-to-stop distances along a route to calculate total route length.
 *
 * BSOG Accuracy Fixes (February 2026):
 * - Fix 1: Direction bug - per-direction trips with real direction_id
 * - Fix 4: Time-aware frequency - counts actual scheduled departures in window
 * - Fix 5d: Shape-based distances - uses gtfs_route_distances cache when available
 * - Fix 6: Distance-based percentage - uses cumulative distances instead of stop-count ratio
 *
 * Created: December 2025
 * Updated: February 2026
 */

import { query } from '../utils/queryHelpers.js';

// Earth's radius in km for Haversine formula
const EARTH_RADIUS_KM = 6371;

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => deg * (Math.PI / 180);

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Convert kilometers to miles
 * @param {number} km - Distance in kilometers
 * @returns {number} Distance in miles
 */
function kmToMiles(km) {
  return km * 0.621371;
}

/**
 * Convert a Date to GTFS time format "HH:MM:SS"
 * @param {Date} date - Date object
 * @returns {string} Time string in "HH:MM:SS" format
 */
function formatTimeForGTFS(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Get stops for a route in sequence order, per direction.
 * Fix 1: Fetches a representative trip per direction using real direction_id.
 *
 * @param {string} routeId - The GTFS route_id or route_short_name
 * @param {number|null} directionId - Optional: 0 or 1 to get a single direction
 * @returns {Promise<Array>} Array of stops with lat/lon in sequence order
 */
async function getRouteStops(routeId, directionId = null) {
  try {
    // Find one representative trip per direction for this route
    // Pick the trip with the most stops in each direction for best coverage
    const tripQuery = directionId !== null
      ? `
        SELECT t.trip_id, t.direction_id, COUNT(st.stop_id) as stop_count
        FROM gtfs_trips t
        INNER JOIN gtfs_routes r ON t.route_id = r.route_id
        INNER JOIN gtfs_stop_times st ON t.trip_id = st.trip_id
        WHERE (r.route_id = ? OR r.route_short_name = ?)
          AND t.direction_id = ?
        GROUP BY t.trip_id, t.direction_id
        ORDER BY stop_count DESC
        LIMIT 1
      `
      : `
        SELECT t.trip_id, t.direction_id, COUNT(st.stop_id) as stop_count
        FROM gtfs_trips t
        INNER JOIN gtfs_routes r ON t.route_id = r.route_id
        INNER JOIN gtfs_stop_times st ON t.trip_id = st.trip_id
        WHERE (r.route_id = ? OR r.route_short_name = ?)
        GROUP BY t.trip_id, t.direction_id
        ORDER BY t.direction_id ASC, stop_count DESC
      `;

    const tripParams = directionId !== null
      ? [routeId, routeId, directionId]
      : [routeId, routeId];

    const allTrips = await query(tripQuery, tripParams);

    if (!allTrips || allTrips.length === 0) {
      console.warn(`No trips found for route ${routeId}`);
      return [];
    }

    // Pick the best trip per direction (most stops)
    const bestTripPerDirection = {};
    for (const trip of allTrips) {
      const dir = trip.direction_id ?? 0;
      if (!bestTripPerDirection[dir] || trip.stop_count > bestTripPerDirection[dir].stop_count) {
        bestTripPerDirection[dir] = trip;
      }
    }

    // Fetch stops for each representative trip
    const allStops = [];
    for (const [dir, trip] of Object.entries(bestTripPerDirection)) {
      const stops = await query(`
        SELECT
          s.stop_id,
          s.stop_name,
          s.stop_lat,
          s.stop_lon,
          st.stop_sequence,
          ? as direction_id
        FROM gtfs_stop_times st
        INNER JOIN gtfs_stops s ON st.stop_id = s.stop_id
        WHERE st.trip_id = ?
        ORDER BY st.stop_sequence
      `, [parseInt(dir), trip.trip_id]);

      if (stops && stops.length > 0) {
        allStops.push(...stops);
      }
    }

    return allStops;
  } catch (error) {
    console.error('Error fetching route stops:', error);
    return [];
  }
}

/**
 * Calculate total route distance from GTFS data.
 * Fix 5d: First checks gtfs_route_distances cache for shape-based distances.
 * Falls back to stop-to-stop Haversine if no cached data.
 *
 * @param {string} routeId - The route identifier
 * @returns {Promise<Object>} Route distance info in both directions
 */
async function calculateRouteDistance(routeId) {
  try {
    // Fix 5d: Try shape-based cached distances first
    try {
      const cached = await query(`
        SELECT route_id, direction_id, distance_km, distance_miles, shape_id, stop_count
        FROM gtfs_route_distances
        WHERE route_id = ? OR route_id IN (
          SELECT route_id FROM gtfs_routes WHERE route_short_name = ?
        )
        ORDER BY direction_id
      `, [routeId, routeId]);

      if (cached && cached.length > 0) {
        const dir0 = cached.find(c => c.direction_id === 0);
        const dir1 = cached.find(c => c.direction_id === 1);

        const distanceKm0 = dir0 ? parseFloat(dir0.distance_km) : 0;
        const distanceKm1 = dir1 ? parseFloat(dir1.distance_km) : 0;

        const avgDistanceKm = (distanceKm0 > 0 && distanceKm1 > 0)
          ? (distanceKm0 + distanceKm1) / 2
          : (distanceKm0 || distanceKm1);

        return {
          routeId,
          distanceKm: avgDistanceKm,
          distanceMiles: kmToMiles(avgDistanceKm),
          source: 'shape_cache',
          direction0: {
            distanceKm: distanceKm0,
            distanceMiles: kmToMiles(distanceKm0),
            stopCount: dir0 ? dir0.stop_count : 0,
          },
          direction1: {
            distanceKm: distanceKm1,
            distanceMiles: kmToMiles(distanceKm1),
            stopCount: dir1 ? dir1.stop_count : 0,
          },
          totalStops: (dir0 ? dir0.stop_count : 0) + (dir1 ? dir1.stop_count : 0),
        };
      }
    } catch (cacheError) {
      // gtfs_route_distances table may not exist yet - fall through to Haversine
    }

    // Haversine fallback: calculate from stops
    const stops = await getRouteStops(routeId);

    if (!stops || stops.length < 2) {
      console.warn(`No stops found for route ${routeId}`);
      return null;
    }

    // Group stops by direction
    const direction0 = stops.filter(s => s.direction_id === 0 || s.direction_id === null);
    const direction1 = stops.filter(s => s.direction_id === 1);

    // Calculate distance for each direction
    const calculateDirectionDistance = (dirStops) => {
      let totalDistance = 0;
      for (let i = 0; i < dirStops.length - 1; i++) {
        const dist = haversineDistance(
          dirStops[i].stop_lat,
          dirStops[i].stop_lon,
          dirStops[i + 1].stop_lat,
          dirStops[i + 1].stop_lon
        );
        totalDistance += dist;
      }
      return totalDistance;
    };

    const distanceKm0 = direction0.length > 1 ? calculateDirectionDistance(direction0) : 0;
    const distanceKm1 = direction1.length > 1 ? calculateDirectionDistance(direction1) : 0;

    // Use average if both directions exist, otherwise use whichever is available
    const avgDistanceKm = distanceKm1 > 0
      ? (distanceKm0 + distanceKm1) / 2
      : distanceKm0;

    return {
      routeId,
      distanceKm: avgDistanceKm,
      distanceMiles: kmToMiles(avgDistanceKm),
      source: 'haversine_fallback',
      direction0: {
        distanceKm: distanceKm0,
        distanceMiles: kmToMiles(distanceKm0),
        stopCount: direction0.length,
      },
      direction1: {
        distanceKm: distanceKm1,
        distanceMiles: kmToMiles(distanceKm1),
        stopCount: direction1.length,
      },
      totalStops: stops.length,
    };
  } catch (error) {
    console.error('Error calculating route distance:', error);
    return null;
  }
}

/**
 * Find the nearest stop to a given location.
 * Fix 6: Uses cumulative_distances from gtfs_route_distances cache for
 * distance-based percentage instead of stop-count ratio.
 *
 * @param {string} routeId - The route identifier
 * @param {number} lat - Breakdown latitude
 * @param {number} lng - Breakdown longitude
 * @returns {Promise<Object>} Nearest stop info with position in route
 */
async function findNearestStop(routeId, lat, lng) {
  try {
    const stops = await getRouteStops(routeId);

    if (!stops || stops.length === 0) {
      return null;
    }

    let nearestStop = null;
    let minDistance = Infinity;
    let stopIndex = 0;

    for (let i = 0; i < stops.length; i++) {
      const dist = haversineDistance(lat, lng, stops[i].stop_lat, stops[i].stop_lon);
      if (dist < minDistance) {
        minDistance = dist;
        nearestStop = stops[i];
        stopIndex = i;
      }
    }

    // Fix 6: Try distance-based percentage from cached cumulative distances
    let percentageComplete;
    let percentageSource = 'stop_count_fallback';

    try {
      const cacheRows = await query(`
        SELECT cumulative_distances, distance_km
        FROM gtfs_route_distances
        WHERE (route_id = ? OR route_id IN (
          SELECT route_id FROM gtfs_routes WHERE route_short_name = ?
        ))
        AND direction_id = ?
        LIMIT 1
      `, [routeId, routeId, nearestStop.direction_id ?? 0]);

      if (cacheRows && cacheRows.length > 0 && cacheRows[0].cumulative_distances) {
        const cumDist = JSON.parse(cacheRows[0].cumulative_distances);
        const totalDist = parseFloat(cacheRows[0].distance_km);

        if (Array.isArray(cumDist) && totalDist > 0 && stopIndex < cumDist.length) {
          percentageComplete = ((cumDist[stopIndex] / totalDist) * 100).toFixed(1);
          percentageSource = 'distance_based';
        }
      }
    } catch (cacheError) {
      // gtfs_route_distances table may not exist yet - fall through
    }

    // Fall back to stop-count ratio if no distance data
    if (!percentageComplete) {
      percentageComplete = ((stopIndex / stops.length) * 100).toFixed(1);
    }

    return {
      stop: nearestStop,
      distanceToStop: minDistance,
      distanceToStopMiles: kmToMiles(minDistance),
      stopIndex,
      totalStops: stops.length,
      percentageComplete,
      percentageSource,
    };
  } catch (error) {
    console.error('Error finding nearest stop:', error);
    return null;
  }
}

/**
 * Get service frequency for a route.
 * Fix 4: When startTime/endTime are provided, counts actual scheduled departures
 * in that window instead of dividing total trips by 16 hours flat.
 *
 * @param {string} routeId - The route identifier
 * @param {Object} options - Optional time window
 * @param {Date|null} options.startTime - Start of breakdown window
 * @param {Date|null} options.endTime - End of breakdown window (startTime + downtime)
 * @returns {Promise<Object>} Frequency information
 */
async function getRouteFrequency(routeId, { startTime = null, endTime = null } = {}) {
  try {
    // Fix 4: If we have a time window, count actual departures in that window
    if (startTime && endTime) {
      const startGTFS = formatTimeForGTFS(startTime);
      const endGTFS = formatTimeForGTFS(endTime);
      const windowHours = (endTime - startTime) / (1000 * 60 * 60);

      // Count trips that depart from their FIRST stop within the time window
      // gtfs_stop_times.departure_time is VARCHAR(8) "HH:MM:SS"
      const result = await query(`
        SELECT COUNT(DISTINCT t.trip_id) as trip_count
        FROM gtfs_routes r
        INNER JOIN gtfs_trips t ON r.route_id = t.route_id
        INNER JOIN gtfs_stop_times st ON t.trip_id = st.trip_id
        WHERE (r.route_id = ? OR r.route_short_name = ?)
          AND st.stop_sequence = (
            SELECT MIN(st2.stop_sequence)
            FROM gtfs_stop_times st2
            WHERE st2.trip_id = t.trip_id
          )
          AND st.departure_time >= ?
          AND st.departure_time <= ?
      `, [routeId, routeId, startGTFS, endGTFS]);

      const tripCount = result?.[0]?.trip_count || 0;
      const tripsPerHour = windowHours > 0 ? tripCount / windowHours : 0;

      return {
        totalTrips: tripCount,
        tripsPerHour: Math.round(tripsPerHour * 10) / 10,
        operationalHours: Math.round(windowHours * 10) / 10,
        timeWindow: { start: startGTFS, end: endGTFS },
        source: 'time_window',
      };
    }

    // Original behaviour: count all trips, divide by 16h operational day
    const result = await query(`
      SELECT COUNT(DISTINCT t.trip_id) as trip_count
      FROM gtfs_routes r
      INNER JOIN gtfs_trips t ON r.route_id = t.route_id
      WHERE r.route_id = ? OR r.route_short_name = ?
    `, [routeId, routeId]);

    const tripCount = result?.[0]?.trip_count || 0;

    // Assume 16-hour operational day (06:00 - 22:00)
    const operationalHours = 16;
    const tripsPerHour = tripCount / operationalHours;

    return {
      totalTrips: tripCount,
      tripsPerHour: Math.round(tripsPerHour * 10) / 10,
      operationalHours,
      source: 'all_day_average',
    };
  } catch (error) {
    console.error('Error getting route frequency:', error);
    return { totalTrips: 0, tripsPerHour: 0, operationalHours: 16, source: 'error_fallback' };
  }
}

/**
 * Calculate mileage lost for a breakdown
 *
 * @param {Object} params - Breakdown parameters
 * @param {string} params.routeId - Route ID or short name
 * @param {number} params.lat - Breakdown latitude (optional)
 * @param {number} params.lng - Breakdown longitude (optional)
 * @param {number} params.estimatedDowntimeMinutes - Expected time until service resumes
 * @param {boolean} params.isFullRouteAffected - True if entire route is affected (default: false)
 * @param {Date|null} params.breakdownStartTime - When the breakdown started (for time-aware frequency)
 * @returns {Promise<Object>} Mileage lost calculation
 */
async function calculateMileageLost(params) {
  const {
    routeId,
    lat,
    lng,
    estimatedDowntimeMinutes = 60, // Default 1 hour
    isFullRouteAffected = false,
    breakdownStartTime = null,
  } = params;

  // Cap downtime at 4 hours (240 minutes) - reasonable for a single breakdown
  // Prevents runaway calculations for unresolved breakdowns that are days/weeks old
  const MAX_DOWNTIME_MINUTES = 240;
  const cappedDowntimeMinutes = Math.min(estimatedDowntimeMinutes, MAX_DOWNTIME_MINUTES);

  // Maximum mileage per breakdown (sanity check)
  const MAX_MILEAGE_PER_BREAKDOWN = 500;

  try {
    // Get route distance
    const routeInfo = await calculateRouteDistance(routeId);

    if (!routeInfo) {
      return {
        success: false,
        error: 'Route not found or no GTFS data available',
        routeId,
      };
    }

    // Fix 4: Build time window for frequency calculation
    let frequencyOptions = {};
    if (breakdownStartTime) {
      const startTime = new Date(breakdownStartTime);
      const endTime = new Date(startTime.getTime() + cappedDowntimeMinutes * 60 * 1000);
      frequencyOptions = { startTime, endTime };
    }

    // Get route frequency (time-aware if breakdownStartTime provided)
    const frequency = await getRouteFrequency(routeId, frequencyOptions);

    // Calculate trips affected during downtime (using capped value)
    const downtimeHours = cappedDowntimeMinutes / 60;
    const tripsAffected = Math.ceil(frequency.tripsPerHour * downtimeHours);

    let remainingDistanceMiles = 0;
    let nearestStopInfo = null;

    // If we have breakdown location, calculate remaining route distance
    if (lat && lng && !isFullRouteAffected) {
      nearestStopInfo = await findNearestStop(routeId, lat, lng);

      if (nearestStopInfo) {
        // Calculate remaining percentage of route
        const remainingPercentage = (100 - parseFloat(nearestStopInfo.percentageComplete)) / 100;
        remainingDistanceMiles = routeInfo.distanceMiles * remainingPercentage;
      }
    } else {
      // Full route is affected
      remainingDistanceMiles = routeInfo.distanceMiles;
    }

    // Calculate total mileage lost
    // Formula: Remaining trip distance + (Full route distance x Number of missed trips)
    const currentTripMilesLost = remainingDistanceMiles;
    const missedTripsMilesLost = routeInfo.distanceMiles * Math.max(0, tripsAffected - 1);
    let totalMilesLost = currentTripMilesLost + missedTripsMilesLost;

    // Apply maximum cap to prevent unrealistic values
    const wasCapped = totalMilesLost > MAX_MILEAGE_PER_BREAKDOWN;
    totalMilesLost = Math.min(totalMilesLost, MAX_MILEAGE_PER_BREAKDOWN);

    return {
      success: true,
      routeId,
      routeInfo: {
        distanceMiles: Math.round(routeInfo.distanceMiles * 100) / 100,
        distanceKm: Math.round(routeInfo.distanceKm * 100) / 100,
        totalStops: routeInfo.totalStops,
        distanceSource: routeInfo.source,
      },
      breakdownLocation: nearestStopInfo ? {
        nearestStop: nearestStopInfo.stop?.stop_name,
        percentageComplete: nearestStopInfo.percentageComplete,
        percentageSource: nearestStopInfo.percentageSource,
        remainingStops: nearestStopInfo.totalStops - nearestStopInfo.stopIndex,
      } : null,
      serviceImpact: {
        estimatedDowntimeMinutes: cappedDowntimeMinutes,
        originalDowntimeMinutes: estimatedDowntimeMinutes,
        downtimeWasCapped: estimatedDowntimeMinutes > MAX_DOWNTIME_MINUTES,
        tripsPerHour: frequency.tripsPerHour,
        tripsAffected,
        frequencySource: frequency.source,
      },
      mileageLost: {
        currentTripMiles: Math.round(currentTripMilesLost * 100) / 100,
        missedTripsMiles: Math.round(missedTripsMilesLost * 100) / 100,
        totalMiles: Math.round(totalMilesLost * 100) / 100,
        totalKm: Math.round(totalMilesLost / 0.621371 * 100) / 100,
        wasCapped,
      },
      calculation: {
        formula: 'Remaining trip distance + (Route distance x Missed trips)',
        breakdown: `${currentTripMilesLost.toFixed(2)} + (${routeInfo.distanceMiles.toFixed(2)} x ${Math.max(0, tripsAffected - 1)}) = ${totalMilesLost.toFixed(2)} miles${wasCapped ? ' (capped)' : ''}`,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error calculating mileage lost:', error);
    return {
      success: false,
      error: error.message,
      routeId,
    };
  }
}

/**
 * Get mileage lost summary for a time period
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} Summary of mileage lost
 */
async function getMileageLostSummary(startDate, endDate) {
  try {
    const results = await query(`
      SELECT
        b.route_id,
        r.route_short_name,
        r.route_long_name,
        COUNT(*) as breakdown_count,
        SUM(COALESCE(b.estimated_mileage_lost, 0)) as total_mileage_lost,
        AVG(COALESCE(b.estimated_mileage_lost, 0)) as avg_mileage_lost,
        b.depot
      FROM breakdowns b
      LEFT JOIN gtfs_routes r ON b.route_id = r.route_id OR b.route_id = r.route_short_name
      WHERE b.created_at BETWEEN ? AND ?
      AND b.route_id IS NOT NULL
      GROUP BY b.route_id, r.route_short_name, r.route_long_name, b.depot
      ORDER BY total_mileage_lost DESC
    `, [startDate, endDate]);

    const totalMileageLost = (results || []).reduce((sum, r) => sum + (r.total_mileage_lost || 0), 0);
    const totalBreakdowns = (results || []).reduce((sum, r) => sum + r.breakdown_count, 0);

    return {
      success: true,
      period: { startDate, endDate },
      summary: {
        totalBreakdowns,
        totalMileageLost: Math.round(totalMileageLost * 100) / 100,
        avgMileageLostPerBreakdown: totalBreakdowns > 0
          ? Math.round((totalMileageLost / totalBreakdowns) * 100) / 100
          : 0,
      },
      byRoute: results || [],
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error getting mileage summary:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export {
  calculateMileageLost,
  calculateRouteDistance,
  findNearestStop,
  getRouteFrequency,
  getMileageLostSummary,
  haversineDistance,
  kmToMiles,
};
