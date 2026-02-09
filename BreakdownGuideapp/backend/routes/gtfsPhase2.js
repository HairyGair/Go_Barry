/**
 * GTFS Phase 2 Features API Routes
 * Purpose: Supervisor intelligence - trips at risk, service gaps, last bus alerts,
 *          multi-route impact, timetable viewer, stop finder
 * Created: February 2026
 */

import express from 'express';
import { query } from '../utils/queryHelpers.js';

const router = express.Router();

// ─── Helpers ──────────────────────────────────────────────────

/**
 * Haversine distance in km between two lat/lng points
 */
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Get current time as GTFS-compatible HH:MM:SS string.
 * GTFS allows times > 24:00:00 for post-midnight trips on the same service day.
 */
function currentTimeGTFS() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

/**
 * Add minutes to a GTFS time string, handling >24:00:00
 */
function addMinutesToGTFS(timeStr, minutes) {
  const parts = timeStr.split(':').map(Number);
  let totalMinutes = parts[0] * 60 + parts[1] + minutes;
  const h = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const mi = String(totalMinutes % 60).padStart(2, '0');
  const s = String(parts[2] || 0).padStart(2, '0');
  return `${h}:${mi}:${s}`;
}

/**
 * Compute minutes between two GTFS time strings
 */
function minutesBetween(timeA, timeB) {
  const toMin = (t) => {
    const p = t.split(':').map(Number);
    return p[0] * 60 + p[1] + (p[2] || 0) / 60;
  };
  return toMin(timeB) - toMin(timeA);
}

/**
 * Find the dominant service_id for a route (the one with the most trips)
 */
async function getDominantServiceId(routeId) {
  const rows = await query(
    `SELECT service_id, COUNT(*) as cnt
     FROM gtfs_trips
     WHERE route_id = ?
     GROUP BY service_id
     ORDER BY cnt DESC
     LIMIT 1`,
    [routeId]
  );
  return rows && rows.length > 0 ? rows[0].service_id : null;
}


// ═══════════════════════════════════════════════════════════════
// Feature 1: Trips at Risk
// GET /api/gtfs/trips-at-risk
// ═══════════════════════════════════════════════════════════════

router.get('/trips-at-risk', async (req, res) => {
  try {
    const { route_id, lat, lng, minutes = 120 } = req.query;

    if (!route_id) {
      return res.status(400).json({ success: false, error: 'route_id is required' });
    }

    const now = currentTimeGTFS();
    const endTime = addMinutesToGTFS(now, parseInt(minutes));
    const serviceId = await getDominantServiceId(route_id);

    if (!serviceId) {
      return res.json({
        success: true,
        nearestStop: null,
        tripsAtRisk: [],
        summary: { totalTripsAtRisk: 0, direction0Count: 0, direction1Count: 0, timeWindow: parseInt(minutes) },
      });
    }

    // Find nearest stop to breakdown on this route
    let nearestStop = null;
    if (lat && lng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const latDelta = 0.02; // ~2.2km
      const lngDelta = 0.03;

      const stops = await query(
        `SELECT DISTINCT s.stop_id, s.stop_name, s.stop_lat, s.stop_lon
         FROM gtfs_stops s
         JOIN gtfs_stop_times st ON s.stop_id = st.stop_id
         JOIN gtfs_trips t ON st.trip_id = t.trip_id
         WHERE t.route_id = ?
           AND t.service_id = ?
           AND s.stop_lat BETWEEN ? AND ?
           AND s.stop_lon BETWEEN ? AND ?
         LIMIT 50`,
        [route_id, serviceId,
         latNum - latDelta, latNum + latDelta,
         lngNum - lngDelta, lngNum + lngDelta]
      );

      if (stops && stops.length > 0) {
        let minDist = Infinity;
        for (const stop of stops) {
          const d = haversineKm(latNum, lngNum, parseFloat(stop.stop_lat), parseFloat(stop.stop_lon));
          if (d < minDist) {
            minDist = d;
            nearestStop = {
              stopId: stop.stop_id,
              stopName: stop.stop_name,
              lat: parseFloat(stop.stop_lat),
              lng: parseFloat(stop.stop_lon),
              distanceKm: Math.round(d * 1000) / 1000,
            };
          }
        }
      }
    }

    // If no coordinates or no nearby stop found, use first stop on route
    if (!nearestStop) {
      const firstStop = await query(
        `SELECT DISTINCT s.stop_id, s.stop_name, s.stop_lat, s.stop_lon
         FROM gtfs_stops s
         JOIN gtfs_stop_times st ON s.stop_id = st.stop_id
         JOIN gtfs_trips t ON st.trip_id = t.trip_id
         WHERE t.route_id = ? AND t.service_id = ?
         ORDER BY st.stop_sequence ASC
         LIMIT 1`,
        [route_id, serviceId]
      );
      if (firstStop && firstStop.length > 0) {
        nearestStop = {
          stopId: firstStop[0].stop_id,
          stopName: firstStop[0].stop_name,
          lat: parseFloat(firstStop[0].stop_lat),
          lng: parseFloat(firstStop[0].stop_lon),
          distanceKm: null,
        };
      }
    }

    if (!nearestStop) {
      return res.json({
        success: true,
        nearestStop: null,
        tripsAtRisk: [],
        summary: { totalTripsAtRisk: 0, direction0Count: 0, direction1Count: 0, timeWindow: parseInt(minutes) },
      });
    }

    // Get upcoming trips at this stop within the time window
    const trips = await query(
      `SELECT
         t.trip_id,
         t.trip_headsign,
         t.direction_id,
         st.departure_time
       FROM gtfs_stop_times st
       JOIN gtfs_trips t ON st.trip_id = t.trip_id
       WHERE t.route_id = ?
         AND t.service_id = ?
         AND st.stop_id = ?
         AND st.departure_time >= ?
         AND st.departure_time <= ?
       ORDER BY st.departure_time ASC`,
      [route_id, serviceId, nearestStop.stopId, now, endTime]
    );

    const tripsAtRisk = (trips || []).map(trip => ({
      tripId: trip.trip_id,
      headsign: trip.trip_headsign || 'Unknown',
      directionId: trip.direction_id,
      departureTime: trip.departure_time,
      minutesUntilDeparture: Math.round(minutesBetween(now, trip.departure_time)),
    }));

    // --- Feature 3: Last Bus Detection ---
    const lastBusTrips = await query(
      `SELECT
         t.trip_id,
         t.trip_headsign,
         t.direction_id,
         st.departure_time
       FROM gtfs_stop_times st
       JOIN gtfs_trips t ON st.trip_id = t.trip_id
       WHERE t.route_id = ?
         AND t.service_id = ?
         AND st.stop_id = ?
       ORDER BY st.departure_time DESC
       LIMIT 4`,
      [route_id, serviceId, nearestStop.stopId]
    );

    // Group last trips by direction
    const lastByDir = {};
    for (const trip of (lastBusTrips || [])) {
      const dir = trip.direction_id ?? 0;
      if (!lastByDir[dir]) lastByDir[dir] = [];
      if (lastByDir[dir].length < 2) lastByDir[dir].push(trip);
    }

    const affectedLastBuses = [];
    const atRiskTripIds = new Set(tripsAtRisk.map(t => t.tripId));

    for (const [dir, dirTrips] of Object.entries(lastByDir)) {
      for (let i = 0; i < dirTrips.length; i++) {
        if (atRiskTripIds.has(dirTrips[i].trip_id)) {
          affectedLastBuses.push({
            tripId: dirTrips[i].trip_id,
            headsign: dirTrips[i].trip_headsign || 'Unknown',
            departureTime: dirTrips[i].departure_time,
            isAbsoluteLastBus: i === 0,
            directionId: parseInt(dir),
          });
        }
      }
    }

    const lastBusAlert = {
      isLastBusAffected: affectedLastBuses.length > 0,
      affectedLastBuses,
    };

    const dir0 = tripsAtRisk.filter(t => t.directionId === 0 || t.directionId === '0');
    const dir1 = tripsAtRisk.filter(t => t.directionId === 1 || t.directionId === '1');

    return res.json({
      success: true,
      nearestStop,
      tripsAtRisk,
      lastBusAlert,
      summary: {
        totalTripsAtRisk: tripsAtRisk.length,
        direction0Count: dir0.length,
        direction1Count: dir1.length,
        timeWindow: parseInt(minutes),
      },
    });

  } catch (error) {
    console.error('Error in trips-at-risk:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch trips at risk', details: error.message });
  }
});


// ═══════════════════════════════════════════════════════════════
// Feature 2: Service Gap Detection
// GET /api/gtfs/service-gaps
// ═══════════════════════════════════════════════════════════════

router.get('/service-gaps', async (req, res) => {
  try {
    const { route_id, breakdown_time, direction_id, stop_id } = req.query;

    if (!route_id) {
      return res.status(400).json({ success: false, error: 'route_id is required' });
    }

    const bdTime = breakdown_time || currentTimeGTFS();
    const serviceId = await getDominantServiceId(route_id);

    if (!serviceId) {
      return res.json({ success: true, gaps: [], summary: { hasServiceGap: false, maxGapMinutes: 0 } });
    }

    // Determine which stop to analyze
    let targetStopId = stop_id;
    if (!targetStopId) {
      // Use the most-served stop on this route (busiest interchange)
      const busiest = await query(
        `SELECT st.stop_id, COUNT(*) as cnt
         FROM gtfs_stop_times st
         JOIN gtfs_trips t ON st.trip_id = t.trip_id
         WHERE t.route_id = ? AND t.service_id = ?
         GROUP BY st.stop_id
         ORDER BY cnt DESC
         LIMIT 1`,
        [route_id, serviceId]
      );
      targetStopId = busiest && busiest.length > 0 ? busiest[0].stop_id : null;
    }

    if (!targetStopId) {
      return res.json({ success: true, gaps: [], summary: { hasServiceGap: false, maxGapMinutes: 0 } });
    }

    // Get all departures +/- 2 hours of breakdown time
    const windowStart = addMinutesToGTFS(bdTime, -120);
    const windowEnd = addMinutesToGTFS(bdTime, 120);

    let dirFilter = '';
    const params = [route_id, serviceId, targetStopId, windowStart, windowEnd];
    if (direction_id !== undefined && direction_id !== '') {
      dirFilter = ' AND t.direction_id = ?';
      params.push(parseInt(direction_id));
    }

    const departures = await query(
      `SELECT
         t.trip_id,
         t.trip_headsign,
         t.direction_id,
         st.departure_time
       FROM gtfs_stop_times st
       JOIN gtfs_trips t ON st.trip_id = t.trip_id
       WHERE t.route_id = ?
         AND t.service_id = ?
         AND st.stop_id = ?
         AND st.departure_time >= ?
         AND st.departure_time <= ?
         ${dirFilter}
       ORDER BY t.direction_id, st.departure_time ASC`,
      params
    );

    // Group by direction
    const byDirection = {};
    for (const dep of (departures || [])) {
      const dir = dep.direction_id ?? 0;
      if (!byDirection[dir]) byDirection[dir] = [];
      byDirection[dir].push(dep);
    }

    const gaps = [];

    for (const [dir, dirDeps] of Object.entries(byDirection)) {
      if (dirDeps.length < 3) continue;

      // Calculate headways between consecutive departures
      const headways = [];
      for (let i = 1; i < dirDeps.length; i++) {
        headways.push(minutesBetween(dirDeps[i - 1].departure_time, dirDeps[i].departure_time));
      }

      // Median headway
      const sorted = [...headways].sort((a, b) => a - b);
      const medianHeadway = sorted[Math.floor(sorted.length / 2)];

      // Find the trip closest to breakdown_time
      let closestIdx = 0;
      let closestDiff = Infinity;
      for (let i = 0; i < dirDeps.length; i++) {
        const diff = Math.abs(minutesBetween(bdTime, dirDeps[i].departure_time));
        if (diff < closestDiff) {
          closestDiff = diff;
          closestIdx = i;
        }
      }

      // Simulate removing that trip
      if (closestIdx > 0 && closestIdx < dirDeps.length - 1) {
        const prevDep = dirDeps[closestIdx - 1].departure_time;
        const nextDep = dirDeps[closestIdx + 1].departure_time;
        const gapWithout = minutesBetween(prevDep, nextDep);
        const gapRatio = medianHeadway > 0 ? gapWithout / medianHeadway : 0;

        let severity = 'ok';
        if (gapRatio > 3.0) severity = 'critical';
        else if (gapRatio > 2.0) severity = 'warning';
        else if (gapRatio > 1.5) severity = 'caution';

        gaps.push({
          directionId: parseInt(dir),
          headsign: dirDeps[closestIdx].trip_headsign || 'Unknown',
          affectedTrip: {
            tripId: dirDeps[closestIdx].trip_id,
            departureTime: dirDeps[closestIdx].departure_time,
          },
          previousDeparture: prevDep,
          nextDeparture: nextDep,
          normalHeadwayMinutes: Math.round(medianHeadway * 10) / 10,
          gapWithoutTripMinutes: Math.round(gapWithout * 10) / 10,
          gapRatio: Math.round(gapRatio * 100) / 100,
          severity,
        });
      }
    }

    const maxGap = gaps.length > 0 ? Math.max(...gaps.map(g => g.gapWithoutTripMinutes)) : 0;

    return res.json({
      success: true,
      gaps,
      summary: {
        hasServiceGap: gaps.some(g => g.severity !== 'ok'),
        maxGapMinutes: maxGap,
      },
    });

  } catch (error) {
    console.error('Error in service-gaps:', error);
    return res.status(500).json({ success: false, error: 'Failed to analyze service gaps', details: error.message });
  }
});


// ═══════════════════════════════════════════════════════════════
// Feature 4: Multi-Route Impact Map (Shape-Based Route Matching)
// GET /api/gtfs/shape-route-match
// ═══════════════════════════════════════════════════════════════

router.get('/shape-route-match', async (req, res) => {
  try {
    const { lat, lng, radius_m = 100 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, error: 'lat and lng are required' });
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const radiusM = parseInt(radius_m);
    const radiusKm = radiusM / 1000;

    // Bounding box (approx degrees for the radius)
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos(latNum * Math.PI / 180));

    // Find shape_ids with points near the breakdown
    const shapePoints = await query(
      `SELECT DISTINCT sh.shape_id
       FROM gtfs_shapes sh
       WHERE sh.shape_pt_lat BETWEEN ? AND ?
         AND sh.shape_pt_lon BETWEEN ? AND ?`,
      [latNum - latDelta, latNum + latDelta, lngNum - lngDelta, lngNum + lngDelta]
    );

    // Filter by precise Haversine distance
    const nearbyShapeIds = [];
    if (shapePoints && shapePoints.length > 0) {
      // Get actual points to check precise distance
      const shapeIdList = shapePoints.map(s => s.shape_id);
      const placeholders = shapeIdList.map(() => '?').join(',');

      const precisePoints = await query(
        `SELECT shape_id, shape_pt_lat, shape_pt_lon
         FROM gtfs_shapes
         WHERE shape_id IN (${placeholders})
           AND shape_pt_lat BETWEEN ? AND ?
           AND shape_pt_lon BETWEEN ? AND ?`,
        [...shapeIdList, latNum - latDelta, latNum + latDelta, lngNum - lngDelta, lngNum + lngDelta]
      );

      const matchedIds = new Set();
      for (const pt of (precisePoints || [])) {
        if (matchedIds.has(pt.shape_id)) continue;
        const distM = haversineKm(latNum, lngNum, parseFloat(pt.shape_pt_lat), parseFloat(pt.shape_pt_lon)) * 1000;
        if (distM <= radiusM) {
          matchedIds.add(pt.shape_id);
        }
      }
      nearbyShapeIds.push(...matchedIds);
    }

    // Map shape_ids to routes
    let affectedRoutes = [];
    const shapes = {};

    if (nearbyShapeIds.length > 0) {
      const placeholders = nearbyShapeIds.map(() => '?').join(',');

      const routeRows = await query(
        `SELECT DISTINCT
           r.route_id,
           r.route_short_name,
           r.route_long_name,
           t.direction_id,
           t.trip_headsign,
           t.shape_id
         FROM gtfs_trips t
         JOIN gtfs_routes r ON t.route_id = r.route_id
         WHERE t.shape_id IN (${placeholders})
         ORDER BY r.route_short_name`,
        nearbyShapeIds
      );

      affectedRoutes = (routeRows || []).map(r => ({
        routeId: r.route_id,
        routeShortName: r.route_short_name,
        routeLongName: r.route_long_name,
        directionId: r.direction_id,
        headsign: r.trip_headsign || '',
      }));

      // Deduplicate by route+direction
      const seen = new Set();
      affectedRoutes = affectedRoutes.filter(r => {
        const key = `${r.routeId}-${r.directionId}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Fetch shape polylines for affected routes (downsample large shapes)
      for (const shapeId of nearbyShapeIds) {
        const polyPoints = await query(
          `SELECT shape_pt_lat, shape_pt_lon, shape_pt_sequence
           FROM gtfs_shapes
           WHERE shape_id = ?
           ORDER BY shape_pt_sequence`,
          [shapeId]
        );

        if (polyPoints && polyPoints.length > 0) {
          let points = polyPoints.map(p => [parseFloat(p.shape_pt_lat), parseFloat(p.shape_pt_lon)]);
          // Downsample if >500 points (take every Nth)
          if (points.length > 500) {
            const step = Math.ceil(points.length / 500);
            points = points.filter((_, i) => i % step === 0 || i === points.length - 1);
          }
          shapes[shapeId] = points;
        }
      }
    }

    // Also run stop-proximity match for comparison
    const stopBasedMatches = await query(
      `SELECT DISTINCT r.route_short_name
       FROM gtfs_stops s
       JOIN gtfs_stop_times st ON s.stop_id = st.stop_id
       JOIN gtfs_trips t ON st.trip_id = t.trip_id
       JOIN gtfs_routes r ON t.route_id = r.route_id
       WHERE s.stop_lat BETWEEN ? AND ?
         AND s.stop_lon BETWEEN ? AND ?`,
      [latNum - latDelta, latNum + latDelta, lngNum - lngDelta, lngNum + lngDelta]
    );

    const stopRouteNames = new Set((stopBasedMatches || []).map(r => r.route_short_name));
    const shapeRouteNames = new Set(affectedRoutes.map(r => r.routeShortName));
    const additionalRoutes = [...shapeRouteNames].filter(r => !stopRouteNames.has(r));

    return res.json({
      success: true,
      breakdownLocation: { lat: latNum, lng: lngNum },
      radiusMeters: radiusM,
      affectedRoutes,
      shapes,
      comparison: {
        stopBasedMatches: stopRouteNames.size,
        shapeBasedMatches: shapeRouteNames.size,
        additionalRoutesFound: additionalRoutes.length,
        additionalRoutes,
      },
    });

  } catch (error) {
    console.error('Error in shape-route-match:', error);
    return res.status(500).json({ success: false, error: 'Failed to match routes by shape', details: error.message });
  }
});


// ═══════════════════════════════════════════════════════════════
// Feature 5: Route Timetable Viewer
// GET /api/gtfs/timetable/:routeId
// ═══════════════════════════════════════════════════════════════

router.get('/timetable/:routeId', async (req, res) => {
  try {
    const { routeId } = req.params;
    const { direction_id, service_id, from_time = '04:00:00', to_time = '28:00:00' } = req.query;

    // Get route info
    const routeRows = await query(
      'SELECT route_id, route_short_name, route_long_name FROM gtfs_routes WHERE route_id = ? LIMIT 1',
      [routeId]
    );

    if (!routeRows || routeRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Route not found' });
    }

    const route = routeRows[0];

    // Find available service_ids
    const serviceIds = await query(
      `SELECT service_id, COUNT(*) as cnt
       FROM gtfs_trips
       WHERE route_id = ?
       GROUP BY service_id
       ORDER BY cnt DESC`,
      [routeId]
    );

    const availableServiceIds = (serviceIds || []).map(s => s.service_id);
    const targetServiceId = service_id || (availableServiceIds[0] ?? null);

    if (!targetServiceId) {
      return res.json({
        success: true,
        route: { routeId: route.route_id, routeShortName: route.route_short_name, routeLongName: route.route_long_name },
        serviceId: null,
        availableServiceIds,
        directions: [],
        currentTime: currentTimeGTFS(),
      });
    }

    // Get trips for this route + service_id
    let dirFilter = '';
    const tripParams = [routeId, targetServiceId];
    if (direction_id !== undefined && direction_id !== '') {
      dirFilter = ' AND direction_id = ?';
      tripParams.push(parseInt(direction_id));
    }

    const trips = await query(
      `SELECT trip_id, trip_headsign, direction_id
       FROM gtfs_trips
       WHERE route_id = ? AND service_id = ?${dirFilter}
       ORDER BY direction_id, trip_id`,
      tripParams
    );

    // Group trips by direction
    const tripsByDir = {};
    for (const trip of (trips || [])) {
      const dir = trip.direction_id ?? 0;
      if (!tripsByDir[dir]) tripsByDir[dir] = { headsign: trip.trip_headsign || 'Unknown', trips: [] };
      tripsByDir[dir].trips.push(trip);
    }

    const directions = [];

    for (const [dir, dirData] of Object.entries(tripsByDir)) {
      const tripIds = dirData.trips.map(t => t.trip_id);
      if (tripIds.length === 0) continue;

      // Get stop_times for all trips in this direction (within time window)
      const placeholders = tripIds.map(() => '?').join(',');

      const stopTimes = await query(
        `SELECT st.trip_id, st.stop_id, st.departure_time, st.stop_sequence, s.stop_name
         FROM gtfs_stop_times st
         JOIN gtfs_stops s ON st.stop_id = s.stop_id
         WHERE st.trip_id IN (${placeholders})
           AND st.departure_time >= ?
           AND st.departure_time <= ?
         ORDER BY st.trip_id, st.stop_sequence`,
        [...tripIds, from_time, to_time]
      );

      // Find the trip with the most stops to use as the column header
      const tripStopCounts = {};
      for (const st of (stopTimes || [])) {
        if (!tripStopCounts[st.trip_id]) tripStopCounts[st.trip_id] = [];
        tripStopCounts[st.trip_id].push(st);
      }

      // Get the stop sequence from the trip with the most stops
      let maxStops = 0;
      let referenceTrip = null;
      for (const [tid, stopsArr] of Object.entries(tripStopCounts)) {
        if (stopsArr.length > maxStops) {
          maxStops = stopsArr.length;
          referenceTrip = tid;
        }
      }

      if (!referenceTrip) continue;

      const stopSequence = tripStopCounts[referenceTrip]
        .sort((a, b) => a.stop_sequence - b.stop_sequence)
        .map(s => ({ stopId: s.stop_id, stopName: s.stop_name }));

      // Build timetable rows: each trip = one row of departure times
      const timetableTrips = [];
      const stopIdOrder = stopSequence.map(s => s.stopId);

      for (const [tid, stopsArr] of Object.entries(tripStopCounts)) {
        const timeByStop = {};
        let firstDep = '99:99:99';
        for (const st of stopsArr) {
          timeByStop[st.stop_id] = st.departure_time;
          if (st.departure_time < firstDep) firstDep = st.departure_time;
        }

        // Only include trips that have a departure within the time window
        if (firstDep >= from_time && firstDep <= to_time) {
          timetableTrips.push({
            tripId: tid,
            departureTimes: stopIdOrder.map(sid => timeByStop[sid] || null),
            firstDeparture: firstDep,
          });
        }
      }

      // Sort trips by first departure time
      timetableTrips.sort((a, b) => a.firstDeparture.localeCompare(b.firstDeparture));

      directions.push({
        directionId: parseInt(dir),
        headsign: dirData.headsign,
        stops: stopSequence.map(s => s.stopName),
        trips: timetableTrips.map(t => ({
          tripId: t.tripId,
          departureTimes: t.departureTimes,
        })),
      });
    }

    return res.json({
      success: true,
      route: { routeId: route.route_id, routeShortName: route.route_short_name, routeLongName: route.route_long_name },
      serviceId: targetServiceId,
      availableServiceIds,
      directions,
      currentTime: currentTimeGTFS(),
    });

  } catch (error) {
    console.error('Error in timetable:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch timetable', details: error.message });
  }
});


// ═══════════════════════════════════════════════════════════════
// Feature 6: Stop Finder
// GET /api/gtfs/stops/search
// ═══════════════════════════════════════════════════════════════

router.get('/stops/search', async (req, res) => {
  try {
    const { q, lat, lng, radius_km = 1, limit = 50 } = req.query;

    if (!q && !lat) {
      return res.status(400).json({ success: false, error: 'Provide either q (text) or lat/lng (proximity)' });
    }

    const conditions = [];
    const params = [];

    // Text search
    if (q) {
      conditions.push('s.stop_name LIKE ?');
      params.push(`%${q}%`);
    }

    // Proximity search
    if (lat && lng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const radiusKmNum = parseFloat(radius_km);
      const latDelta = radiusKmNum / 111;
      const lngDelta = radiusKmNum / (111 * Math.cos(latNum * Math.PI / 180));

      conditions.push('s.stop_lat BETWEEN ? AND ?');
      conditions.push('s.stop_lon BETWEEN ? AND ?');
      params.push(latNum - latDelta, latNum + latDelta);
      params.push(lngNum - lngDelta, lngNum + lngDelta);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const stops = await query(
      `SELECT s.stop_id, s.stop_name, s.stop_lat, s.stop_lon, s.stop_code
       FROM gtfs_stops s
       ${whereClause}
       LIMIT ?`,
      [...params, parseInt(limit)]
    );

    // If lat/lng provided, compute distance and sort
    let results = (stops || []).map(s => ({
      stopId: s.stop_id,
      stopName: s.stop_name,
      stopCode: s.stop_code || null,
      lat: parseFloat(s.stop_lat),
      lng: parseFloat(s.stop_lon),
    }));

    if (lat && lng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      results = results.map(s => ({
        ...s,
        distanceKm: Math.round(haversineKm(latNum, lngNum, s.lat, s.lng) * 1000) / 1000,
      }));
      results.sort((a, b) => a.distanceKm - b.distanceKm);
    }

    return res.json({ success: true, stops: results, count: results.length });

  } catch (error) {
    console.error('Error in stops/search:', error);
    return res.status(500).json({ success: false, error: 'Failed to search stops', details: error.message });
  }
});


// ═══════════════════════════════════════════════════════════════
// Feature 6: Stop Departures
// GET /api/gtfs/stops/:stopId/departures
// ═══════════════════════════════════════════════════════════════

router.get('/stops/:stopId/departures', async (req, res) => {
  try {
    const { stopId } = req.params;
    const { from_time, limit = 20 } = req.query;

    const fromTime = from_time || currentTimeGTFS();

    // Get the stop info
    const stopRows = await query(
      'SELECT stop_id, stop_name, stop_lat, stop_lon FROM gtfs_stops WHERE stop_id = ? LIMIT 1',
      [stopId]
    );

    if (!stopRows || stopRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Stop not found' });
    }

    const stop = stopRows[0];

    // Get upcoming departures
    const departures = await query(
      `SELECT
         st.departure_time,
         t.trip_id,
         t.trip_headsign,
         t.direction_id,
         r.route_id,
         r.route_short_name,
         r.route_long_name
       FROM gtfs_stop_times st
       JOIN gtfs_trips t ON st.trip_id = t.trip_id
       JOIN gtfs_routes r ON t.route_id = r.route_id
       WHERE st.stop_id = ?
         AND st.departure_time >= ?
       ORDER BY st.departure_time ASC
       LIMIT ?`,
      [stopId, fromTime, parseInt(limit)]
    );

    const now = currentTimeGTFS();

    const results = (departures || []).map(d => ({
      departureTime: d.departure_time,
      minutesUntilDeparture: Math.max(0, Math.round(minutesBetween(now, d.departure_time))),
      tripId: d.trip_id,
      headsign: d.trip_headsign || 'Unknown',
      directionId: d.direction_id,
      routeId: d.route_id,
      routeShortName: d.route_short_name,
      routeLongName: d.route_long_name,
    }));

    return res.json({
      success: true,
      stop: {
        stopId: stop.stop_id,
        stopName: stop.stop_name,
        lat: parseFloat(stop.stop_lat),
        lng: parseFloat(stop.stop_lon),
      },
      departures: results,
      currentTime: now,
    });

  } catch (error) {
    console.error('Error in stop departures:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch departures', details: error.message });
  }
});


// ═══════════════════════════════════════════════════════════════
// Route list helper (for timetable route picker)
// GET /api/gtfs/routes/list
// ═══════════════════════════════════════════════════════════════

router.get('/routes/list', async (req, res) => {
  try {
    const routes = await query(
      `SELECT route_id, route_short_name, route_long_name
       FROM gtfs_routes
       ORDER BY route_short_name`
    );

    return res.json({
      success: true,
      routes: (routes || []).map(r => ({
        routeId: r.route_id,
        routeShortName: r.route_short_name,
        routeLongName: r.route_long_name,
      })),
    });

  } catch (error) {
    console.error('Error fetching routes list:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch routes', details: error.message });
  }
});


export default router;
