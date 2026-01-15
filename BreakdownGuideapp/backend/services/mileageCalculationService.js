/**
 * Mileage Calculation Service
 *
 * Calculates estimated mileage lost when a breakdown occurs using GTFS data.
 * Uses stop-to-stop distances along a route to calculate total route length.
 *
 * Created: December 2025
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
 * Get all stops for a route in sequence order using a SINGLE representative trip
 * This avoids the bug where stops were duplicated across all trips
 * @param {string} routeId - The GTFS route_id or route_short_name
 * @returns {Promise<Array>} Array of stops with lat/lon in sequence order
 */
async function getRouteStops(routeId) {
  try {
    // Find one representative trip for this route (the one with most stops)
    // Using subquery to be compatible with ONLY_FULL_GROUP_BY mode
    const representativeTrips = await query(`
      SELECT t.trip_id, t.direction_id
      FROM gtfs_trips t
      INNER JOIN gtfs_routes r ON t.route_id = r.route_id
      WHERE r.route_id = ? OR r.route_short_name = ?
      ORDER BY t.direction_id, t.trip_id
      LIMIT 2
    `, [routeId, routeId]);

    if (!representativeTrips || representativeTrips.length === 0) {
      console.warn(`No trips found for route ${routeId}`);
      return [];
    }

    // Get the first trip ID (simplest approach - just use one trip)
    const tripId = representativeTrips[0].trip_id;

    // Now get stops from this representative trip
    const stops = await query(`
      SELECT
        s.stop_id,
        s.stop_name,
        s.stop_lat,
        s.stop_lon,
        st.stop_sequence,
        0 as direction_id
      FROM gtfs_stop_times st
      INNER JOIN gtfs_stops s ON st.stop_id = s.stop_id
      WHERE st.trip_id = ?
      ORDER BY st.stop_sequence
    `, [tripId]);

    return stops || [];
  } catch (error) {
    console.error('Error fetching route stops:', error);
    return [];
  }
}

/**
 * Calculate total route distance from GTFS stop data
 * @param {string} routeId - The route identifier
 * @returns {Promise<Object>} Route distance info in both directions
 */
async function calculateRouteDistance(routeId) {
  try {
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
 * Find the nearest stop to a given location
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

    return {
      stop: nearestStop,
      distanceToStop: minDistance,
      distanceToStopMiles: kmToMiles(minDistance),
      stopIndex,
      totalStops: stops.length,
      percentageComplete: ((stopIndex / stops.length) * 100).toFixed(1),
    };
  } catch (error) {
    console.error('Error finding nearest stop:', error);
    return null;
  }
}

/**
 * Get service frequency for a route (trips per hour during operational hours)
 * @param {string} routeId - The route identifier
 * @returns {Promise<number>} Average trips per hour
 */
async function getRouteFrequency(routeId) {
  try {
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
    };
  } catch (error) {
    console.error('Error getting route frequency:', error);
    return { totalTrips: 0, tripsPerHour: 0, operationalHours: 16 };
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
 * @returns {Promise<Object>} Mileage lost calculation
 */
async function calculateMileageLost(params) {
  const {
    routeId,
    lat,
    lng,
    estimatedDowntimeMinutes = 60, // Default 1 hour
    isFullRouteAffected = false,
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

    // Get route frequency
    const frequency = await getRouteFrequency(routeId);

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
    // Formula: Remaining trip distance + (Full route distance × Number of missed trips)
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
      },
      breakdownLocation: nearestStopInfo ? {
        nearestStop: nearestStopInfo.stop?.stop_name,
        percentageComplete: nearestStopInfo.percentageComplete,
        remainingStops: nearestStopInfo.totalStops - nearestStopInfo.stopIndex,
      } : null,
      serviceImpact: {
        estimatedDowntimeMinutes: cappedDowntimeMinutes,
        originalDowntimeMinutes: estimatedDowntimeMinutes,
        downtimeWasCapped: estimatedDowntimeMinutes > MAX_DOWNTIME_MINUTES,
        tripsPerHour: frequency.tripsPerHour,
        tripsAffected,
      },
      mileageLost: {
        currentTripMiles: Math.round(currentTripMilesLost * 100) / 100,
        missedTripsMiles: Math.round(missedTripsMilesLost * 100) / 100,
        totalMiles: Math.round(totalMilesLost * 100) / 100,
        totalKm: Math.round(totalMilesLost / 0.621371 * 100) / 100,
        wasCapped,
      },
      calculation: {
        formula: 'Remaining trip distance + (Route distance × Missed trips)',
        breakdown: `${currentTripMilesLost.toFixed(2)} + (${routeInfo.distanceMiles.toFixed(2)} × ${Math.max(0, tripsAffected - 1)}) = ${totalMilesLost.toFixed(2)} miles${wasCapped ? ' (capped)' : ''}`,
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
