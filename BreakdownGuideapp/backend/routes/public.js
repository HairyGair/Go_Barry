import express from 'express';
import { from, query } from '../utils/queryHelpers.js';
import { resolveSeverity } from '../utils/severity.js';
import { sendInterestNotification } from '../services/emailService.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// GET /api/public/breakdowns - Get breakdowns with optional depot filtering (for Engineering Display)
// This endpoint does NOT require authentication - it's for public yard displays
router.get('/breakdowns', async (req, res) => {
  try {
    const { depot } = req.query;
    const demo = req.query.demo === 'true';

    // Query from breakdowns table using MySQL
    let queryBuilder = from('breakdowns').select('*');

    // Demo sessions see only demo data; everyone else excludes it
    queryBuilder = demo
      ? queryBuilder.eq('supervisor_badge', 'DEMO01')
      : queryBuilder.neq('supervisor_badge', 'DEMO01');

    // Apply depot filter if provided
    if (depot) {
      queryBuilder = queryBuilder.eq('depot', depot);
    }

    const { data: allBreakdowns, error } = await queryBuilder
      .order('created_at', 'DESC')
      .execute();

    if (error) throw error;

    console.log(`📊 /public/breakdowns: Found ${allBreakdowns?.length || 0} total breakdowns${depot ? ` for depot ${depot}` : ''}`);

    // Filter out resolved/completed breakdowns
    const breakdowns = allBreakdowns.filter(b =>
      !['resolved', 'deleted', 'cancelled', 'completed'].includes(b.status)
    );

    console.log(`✅ /public/breakdowns: Returning ${breakdowns.length} active breakdowns after filtering`);

    // Format breakdowns for display
    const formattedBreakdowns = breakdowns.map(b => ({
      // Core identifiers
      breakdown_id: b.breakdown_id,
      id: b.breakdown_id,

      // Vehicle information
      fleet_no: b.fleet_no,
      registration: b.registration,
      depot: b.depot,

      // Location and issue information
      location: b.location_description || b.location || 'Location TBC',
      issue_category: b.issue_category,
      description: b.description,

      // Status and severity
      status: b.status,
      severity: resolveSeverity(b.severity, b.wizard_decision),
      wizard_decision: b.wizard_decision,

      // Timing information
      created_at: b.created_at,
      updated_at: b.updated_at,

      // Supervisor information
      supervisor_badge: b.supervisor_badge,
      supervisor_name: b.supervisor_name,

      // Assessment data
      wizard_type: b.wizard_type,
      wizard_assessment_data: b.wizard_assessment_data
    }));

    res.json({
      success: true,
      breakdowns: formattedBreakdowns,
      timestamp: new Date().toISOString(),
      count: formattedBreakdowns.length
    });
  } catch (error) {
    console.error('Error fetching public breakdowns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch breakdowns',
      timestamp: new Date().toISOString(),
      breakdowns: [] // Return empty array for graceful degradation
    });
  }
});

// GET /api/public/breakdowns/live - Get active breakdowns for public displays (Control Room)
// This endpoint does NOT require authentication - it's for public wall displays
router.get('/breakdowns/live', async (req, res) => {
  try {
    // Query from breakdowns table using MySQL
    // Demo sessions see only demo data; everyone else excludes it
    const demo = req.query.demo === 'true';
    let liveQuery = from('breakdowns').select('*');
    liveQuery = demo
      ? liveQuery.eq('supervisor_badge', 'DEMO01')
      : liveQuery.neq('supervisor_badge', 'DEMO01');
    const { data: allBreakdowns, error } = await liveQuery
      .order('created_at', 'DESC')
      .execute();

    if (error) throw error;

    console.log(`📊 /public/breakdowns/live: Found ${allBreakdowns?.length || 0} total breakdowns in database`);
    if (allBreakdowns && allBreakdowns.length > 0) {
      console.log('📋 Breakdown statuses:', allBreakdowns.map(b => `${b.breakdown_id}: ${b.status}`));
    }

    // Filter out resolved/completed breakdowns
    const breakdowns = allBreakdowns.filter(b =>
      !['resolved', 'deleted', 'cancelled', 'completed'].includes(b.status)
    );

    console.log(`✅ /public/breakdowns/live: Returning ${breakdowns.length} active breakdowns after filtering`);

    // Format breakdowns for dashboard display
    const formattedBreakdowns = breakdowns.map(b => {
      // Calculate elapsed time
      const elapsedMinutes = Math.floor((new Date() - new Date(b.created_at)) / (1000 * 60));
      const elapsedHours = Math.floor(elapsedMinutes / 60);
      const remainingMinutes = Math.floor(elapsedMinutes % 60);

      let durationText = '';
      if (elapsedHours > 0) {
        durationText = `${elapsedHours}h ${remainingMinutes}m`;
      } else {
        durationText = `${remainingMinutes}m`;
      }

      // Determine priority level and status color
      // Secured mileage is ALWAYS priority 1 (contractual obligation)
      const priorityLevel = b.priority_level || (
        b.secured_mileage ? 1 :  // Secured mileage must be priority 1 to avoid fines
        b.severity === 'STOP' ? 1 :
        b.severity === 'AMBER' ? 2 : 3
      );

      const statusColor = b.status_color || (
        b.severity === 'STOP' ? 'red' :
        b.severity === 'AMBER' ? 'orange' :
        b.severity === 'CONTINUE' ? 'green' : 'gray'
      );

      const cardTitle = b.card_title ||
        `${b.fleet_no || 'Unknown'} - ${b.issue_category || 'Assessment Required'}`;

      return {
        // Core identifiers
        breakdown_id: b.breakdown_id,
        id: b.breakdown_id,

        // Vehicle information
        fleet_no: b.fleet_no,
        fleet_number: b.fleet_no,
        registration: b.registration,
        depot_id: b.depot,

        // Location and issue information
        location: b.location_description || b.location || 'Location TBC',
        location_lat: b.location_lat ?? b.wizard_assessment_data?.location_coords?.lat ?? null,
        location_lng: b.location_lng ?? b.wizard_assessment_data?.location_coords?.lng ?? null,
        wizard_assessment_data: b.wizard_assessment_data || null,
        issue_type: b.issue_category,
        issue_description: b.description,

        // Status and severity
        status: b.status,
        severity: resolveSeverity(b.severity, b.wizard_decision),
        wizard_decision: b.wizard_decision,
        criticality: b.criticality || b.severity,

        // Timing information
        created_at: b.created_at,
        updated_at: b.updated_at,
        elapsed_minutes: elapsedMinutes,
        duration_text: durationText,

        // Route and priority - extract from wizard_assessment_data if available
        route_id: b.wizard_assessment_data?.route || b.route_id || b.route || null,
        route: b.wizard_assessment_data?.route || b.route || null,
        route_number: b.wizard_assessment_data?.route || b.route || null,
        route_name: b.wizard_assessment_data?.route_name || b.route_name || null,
        service: b.wizard_assessment_data?.route || b.route || null,
        is_priority: priorityLevel <= 2 || b.secured_mileage,
        priority_level: priorityLevel,
        secured_mileage: b.secured_mileage || false,

        // Supervisor information
        supervisor_badge: b.supervisor_badge,
        supervisor_name: b.supervisor_name,

        // Dashboard card information
        card_title: cardTitle,
        status_color: statusColor,
        requires_immediate_action: b.requires_immediate_action || (b.severity === 'STOP') || (priorityLevel <= 2) || b.secured_mileage,

        // Legacy compatibility fields
        driver_name: b.driver_name,
        driver_phone: b.driver_phone,
        passenger_count: b.passenger_count,
        received_at: b.received_at || b.created_at,
        acknowledged_at: b.acknowledged_at,
        decision_at: b.decision_at,
        dispatched_at: b.dispatched_at,
        on_site_at: b.on_site_at,
        cleared_at: b.cleared_at,

        // Engineer ETA countdown fields
        engineer_dispatched_at: b.engineer_dispatched_at || b.dispatched_at || null,
        engineer_eta_minutes: b.engineer_eta_minutes ? parseInt(b.engineer_eta_minutes) : null,
        engineer_name: b.engineer_name || null,
        engineer_on_site_at: b.engineer_on_site_at || b.on_site_at || null,

        // Depot (needed by Control Room)
        depot: b.depot || null
      };
    });

    res.json({
      success: true,
      breakdowns: formattedBreakdowns,
      timestamp: new Date().toISOString(),
      count: formattedBreakdowns.length
    });
  } catch (error) {
    console.error('Error fetching live breakdowns (public):', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch live breakdowns',
      timestamp: new Date().toISOString(),
      breakdowns: [] // Return empty array for graceful degradation
    });
  }
});

// GET /api/public/fleet - Get fleet database
router.get('/fleet', (req, res) => {
  try {
    const fleetDbPath = join(__dirname, '..', 'data', 'fleet-database.json');
    const fleetData = JSON.parse(readFileSync(fleetDbPath, 'utf-8'));

    res.json({
      success: true,
      fleet: fleetData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error loading fleet database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load fleet database',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/public/geocode/reverse - Reverse geocode coordinates to address
// Public endpoint for engineering displays (uses Google Geocoding API)
router.get('/geocode/reverse', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    // Use Google Geocoding API
    const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_KEY;

    if (!GOOGLE_API_KEY) {
      console.error('Google Maps API key not configured');
      return res.status(500).json({
        success: false,
        error: 'Geocoding service not configured'
      });
    }

    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`;
    const response = await fetch(geocodeUrl);
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0];
      const addressComponents = result.address_components;

      // Extract street, city, and postcode
      const street = addressComponents.find(c => c.types.includes('route'))?.long_name || '';
      const streetNumber = addressComponents.find(c => c.types.includes('street_number'))?.long_name || '';
      const city = addressComponents.find(c => c.types.includes('postal_town') || c.types.includes('locality'))?.long_name || '';
      const postcode = addressComponents.find(c => c.types.includes('postal_code'))?.long_name || '';

      // Format: "123 Street Name, City, Postcode"
      const parts = [];
      if (streetNumber && street) {
        parts.push(`${streetNumber} ${street}`);
      } else if (street) {
        parts.push(street);
      }
      if (city) parts.push(city);
      if (postcode) parts.push(postcode);

      const formattedAddress = parts.length > 0 ? parts.join(', ') : result.formatted_address;

      return res.json({
        success: true,
        address: formattedAddress,
        full_address: result.formatted_address,
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      });
    } else {
      return res.json({
        success: false,
        error: 'Address not found',
        address: `${lat}, ${lng}` // Fallback to coordinates
      });
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return res.status(500).json({
      success: false,
      error: 'Geocoding failed',
      address: `${req.query.lat}, ${req.query.lng}` // Fallback to coordinates
    });
  }
});

// GET /api/public/activity/feed - Get activity feed (no auth required)
router.get('/activity/feed', async (req, res) => {
  try {
    const { limit = 25, offset = 0 } = req.query;

    const { data, error } = await from('activities')
      .select('*')
      .neq('actor_id', 'DEMO01')
      .order('created_at', 'DESC')
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .execute();

    if (error) throw error;

    res.json({
      success: true,
      activities: data || [],
      count: data?.length || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching public activity feed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity feed',
      activities: [],
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/public/breakdowns/stats - Get breakdown statistics (no auth required)
router.get('/breakdowns/stats', async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    let startDate;

    switch (period) {
      case 'today':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
    }

    const { data, error } = await from('breakdowns')
      .select('status')
      .neq('supervisor_badge', 'DEMO01')
      .gte('created_at', startDate.toISOString())
      .execute();

    if (error) throw error;

    const stats = {
      total: data.length,
      active: data.filter(b => b.status === 'active').length,
      pending: data.filter(b => b.status === 'pending').length,
      resolved: data.filter(b => b.status === 'resolved').length,
      in_progress: data.filter(b => b.status === 'in_progress').length
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching breakdown stats:', error);
    res.status(500).json({ error: 'Failed to fetch breakdown statistics' });
  }
});

// GET /api/public/route-trips - Get current/upcoming trips on a route for trip picker
// Public endpoint for breakdown creation flow (no auth required)
router.get('/route-trips', async (req, res) => {
  try {
    const { route_id } = req.query;
    const tripLimit = Math.min(Math.max(parseInt(req.query.limit) || 15, 1), 50);
    if (!route_id) {
      return res.json({ success: true, trips: [] });
    }

    // Resolve route_short_name to actual GTFS route_id
    // The frontend passes the short name (e.g. "21") but GTFS uses its own route_id format
    let gtfsRouteId = route_id;
    const routeLookup = await query(
      `SELECT route_id FROM gtfs_routes WHERE route_short_name = ? LIMIT 1`,
      [route_id]
    );
    if (routeLookup?.length > 0) {
      gtfsRouteId = routeLookup[0].route_id;
    }

    // Current time as HH:MM:SS
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    // Also show trips from 30 min ago (driver may have been on a trip that departed recently)
    const thirtyAgo = new Date(now.getTime() - 30 * 60000);
    const fromTime = `${String(thirtyAgo.getHours()).padStart(2, '0')}:${String(thirtyAgo.getMinutes()).padStart(2, '0')}:00`;

    // 3 hour window ahead
    const endHour = now.getHours() + 3;
    const toTime = `${String(Math.min(endHour, 28)).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;

    // Determine day-of-week code for filtering
    // Service_id day-of-week pattern: ...MF... = Mon-Fri, ...SA... = Saturday, ...SU... = Sunday
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    let dayCode;
    if (dayOfWeek === 0) dayCode = 'SU';
    else if (dayOfWeek === 6) dayCode = 'SA';
    else dayCode = 'MF';

    // Count total trips for this route
    const totalTrips = await query(
      `SELECT COUNT(*) as cnt FROM gtfs_trips WHERE route_id = ?`,
      [gtfsRouteId]
    );
    if (!totalTrips?.[0]?.cnt) {
      return res.json({ success: true, trips: [], debug: { gtfsRouteId, totalTrips: 0 } });
    }

    // Get trips for this route in the time window, filtered to today's schedule
    // service_id contains day code (MF/SA/SU) - filter to match today
    const allTripsRaw = await query(
      `SELECT t.trip_id, t.trip_headsign, t.direction_id, t.block_id,
              MIN(st.departure_time) as departure_time,
              MAX(st.departure_time) as arrival_time
       FROM gtfs_trips t
       JOIN gtfs_stop_times st ON st.trip_id = t.trip_id
       WHERE t.route_id = ? AND t.service_id LIKE ?
       GROUP BY t.trip_id, t.trip_headsign, t.direction_id, t.block_id
       HAVING departure_time >= ? AND departure_time <= ?
       ORDER BY departure_time ASC
       LIMIT ${tripLimit}`,
      [gtfsRouteId, `%${dayCode}%`, fromTime, toTime]
    );

    // Batch lookup: origin stop (first) and destination stop (last) for each trip
    const tripIds = (allTripsRaw || []).map(t => t.trip_id);
    const tripEndpoints = {}; // { trip_id: { originStop, destStop } }
    if (tripIds.length > 0) {
      const placeholders = tripIds.map(() => '?').join(',');
      // Get first and last stop for each trip in one query
      const endpointRows = await query(
        `SELECT sub.trip_id, sub.endpoint, s.stop_name
         FROM (
           SELECT st.trip_id, st.stop_id, 'origin' as endpoint
           FROM gtfs_stop_times st
           WHERE st.trip_id IN (${placeholders})
             AND st.stop_sequence = (SELECT MIN(st2.stop_sequence) FROM gtfs_stop_times st2 WHERE st2.trip_id = st.trip_id)
           UNION ALL
           SELECT st.trip_id, st.stop_id, 'dest' as endpoint
           FROM gtfs_stop_times st
           WHERE st.trip_id IN (${placeholders})
             AND st.stop_sequence = (SELECT MAX(st2.stop_sequence) FROM gtfs_stop_times st2 WHERE st2.trip_id = st.trip_id)
         ) sub
         JOIN gtfs_stops s ON sub.stop_id = s.stop_id`,
        [...tripIds, ...tripIds]
      );
      for (const row of (endpointRows || [])) {
        if (!tripEndpoints[row.trip_id]) tripEndpoints[row.trip_id] = {};
        if (row.endpoint === 'origin') tripEndpoints[row.trip_id].originStop = row.stop_name;
        if (row.endpoint === 'dest') tripEndpoints[row.trip_id].destStop = row.stop_name;
      }
    }

    const nowMins = now.getHours() * 60 + now.getMinutes();
    const allTrips = (allTripsRaw || []).map(trip => {
      const depParts = trip.departure_time.split(':').map(Number);
      const depMins = depParts[0] * 60 + depParts[1];
      const ep = tripEndpoints[trip.trip_id] || {};
      return {
        tripId: trip.trip_id,
        headsign: trip.trip_headsign || 'Unknown',
        directionId: trip.direction_id,
        blockId: trip.block_id || null,
        departureTime: trip.departure_time,
        arrivalTime: trip.arrival_time || null,
        originStop: ep.originStop || null,
        destStop: ep.destStop || null,
        minutesFromNow: Math.round(depMins - nowMins),
        isPast: depMins < nowMins,
      };
    });

    return res.json({
      success: true,
      routeId: route_id,
      gtfsRouteId,
      currentTime,
      dayCode,
      timeWindow: { from: fromTime, to: toTime },
      totalTripsOnRoute: totalTrips[0].cnt,
      trips: allTrips,
    });

  } catch (error) {
    console.error('Error in route-trips:', error);
    return res.json({ success: true, trips: [], error: error.message });
  }
});

// GET /api/public/last-bus-check - Check if breakdowns affect last bus services
// Public endpoint for Control Room Display (no auth required)
router.get('/last-bus-check', async (req, res) => {
  try {
    const { route_id, lat, lng } = req.query;
    if (!route_id) {
      return res.json({ success: true, isLastBusAffected: false, affectedLastBuses: [] });
    }

    // Get current time as HH:MM:SS
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    // Find dominant service_id
    const serviceRows = await query(
      `SELECT service_id, COUNT(*) as cnt FROM gtfs_trips WHERE route_id = ? GROUP BY service_id ORDER BY cnt DESC LIMIT 1`,
      [route_id]
    );
    const serviceId = serviceRows?.[0]?.service_id;
    if (!serviceId) {
      return res.json({ success: true, isLastBusAffected: false, affectedLastBuses: [] });
    }

    // Find nearest stop on route (or first stop if no coords)
    let stopId = null;
    if (lat && lng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const stops = await query(
        `SELECT DISTINCT s.stop_id, s.stop_name,
           (POW(s.stop_lat - ?, 2) + POW(s.stop_lon - ?, 2)) as dist_sq
         FROM gtfs_stops s
         JOIN gtfs_stop_times st ON s.stop_id = st.stop_id
         JOIN gtfs_trips t ON st.trip_id = t.trip_id
         WHERE t.route_id = ? AND t.service_id = ?
           AND s.stop_lat BETWEEN ? AND ? AND s.stop_lon BETWEEN ? AND ?
         ORDER BY dist_sq ASC LIMIT 1`,
        [latNum, lngNum, route_id, serviceId,
         latNum - 0.02, latNum + 0.02, lngNum - 0.03, lngNum + 0.03]
      );
      stopId = stops?.[0]?.stop_id;
    }

    if (!stopId) {
      const firstStop = await query(
        `SELECT DISTINCT st.stop_id FROM gtfs_stop_times st
         JOIN gtfs_trips t ON st.trip_id = t.trip_id
         WHERE t.route_id = ? AND t.service_id = ?
         ORDER BY st.stop_sequence ASC LIMIT 1`,
        [route_id, serviceId]
      );
      stopId = firstStop?.[0]?.stop_id;
    }

    if (!stopId) {
      return res.json({ success: true, isLastBusAffected: false, affectedLastBuses: [] });
    }

    // Get last 2 trips per direction at this stop
    const lastTrips = await query(
      `SELECT t.trip_id, t.trip_headsign, t.direction_id, st.departure_time
       FROM gtfs_stop_times st
       JOIN gtfs_trips t ON st.trip_id = t.trip_id
       WHERE t.route_id = ? AND t.service_id = ? AND st.stop_id = ?
       ORDER BY st.departure_time DESC LIMIT 4`,
      [route_id, serviceId, stopId]
    );

    // Get upcoming trips (within 3 hours)
    const endHour = now.getHours() + 3;
    const endTime = `${String(Math.min(endHour, 28)).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;

    const upcomingTrips = await query(
      `SELECT t.trip_id FROM gtfs_stop_times st
       JOIN gtfs_trips t ON st.trip_id = t.trip_id
       WHERE t.route_id = ? AND t.service_id = ? AND st.stop_id = ?
         AND st.departure_time >= ? AND st.departure_time <= ?`,
      [route_id, serviceId, stopId, currentTime, endTime]
    );

    const upcomingIds = new Set((upcomingTrips || []).map(t => t.trip_id));
    const affectedLastBuses = [];

    // Group by direction to find last per direction
    const byDir = {};
    for (const trip of (lastTrips || [])) {
      const dir = trip.direction_id ?? 0;
      if (!byDir[dir]) byDir[dir] = [];
      if (byDir[dir].length < 2) byDir[dir].push(trip);
    }

    for (const [dir, dirTrips] of Object.entries(byDir)) {
      for (let i = 0; i < dirTrips.length; i++) {
        if (upcomingIds.has(dirTrips[i].trip_id)) {
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

    return res.json({
      success: true,
      isLastBusAffected: affectedLastBuses.length > 0,
      affectedLastBuses,
    });

  } catch (error) {
    console.error('Error in last-bus-check:', error);
    return res.json({ success: true, isLastBusAffected: false, affectedLastBuses: [] });
  }
});

// ═══════════════════════════════════════════════════════════════
// GTFS Public Endpoints for Operations Display (no auth required)
// ═══════════════════════════════════════════════════════════════

/** Haversine distance in km */
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function currentTimeGTFS() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
}

function addMinutesToGTFS(timeStr, minutes) {
  const parts = timeStr.split(':').map(Number);
  let totalMinutes = parts[0] * 60 + parts[1] + minutes;
  const h = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const mi = String(totalMinutes % 60).padStart(2, '0');
  const s = String(parts[2] || 0).padStart(2, '0');
  return `${h}:${mi}:${s}`;
}

function minutesBetween(timeA, timeB) {
  const toMin = (t) => { const p = t.split(':').map(Number); return p[0] * 60 + p[1] + (p[2] || 0) / 60; };
  return toMin(timeB) - toMin(timeA);
}

function getTodayDayCode() {
  const d = new Date().getDay();
  return d === 0 ? 'SU' : d === 6 ? 'SA' : 'MF';
}

async function getDominantServiceIdForRoute(routeId) {
  const rows = await query(
    `SELECT service_id, COUNT(*) as cnt FROM gtfs_trips WHERE route_id = ? GROUP BY service_id ORDER BY cnt DESC LIMIT 1`,
    [routeId]
  );
  return rows?.[0]?.service_id || null;
}

// GET /api/public/trips-at-risk - Upcoming trips affected by a breakdown
router.get('/trips-at-risk', async (req, res) => {
  try {
    const { route_id, lat, lng, minutes = 120 } = req.query;
    if (!route_id) return res.json({ success: true, tripsAtRisk: [], summary: { totalTripsAtRisk: 0 } });

    const now = currentTimeGTFS();
    const endTime = addMinutesToGTFS(now, parseInt(minutes));
    const dayCode = getTodayDayCode();

    // Resolve short name to GTFS route_id
    let gtfsRouteId = route_id;
    const routeLookup = await query(
      `SELECT route_id FROM gtfs_routes WHERE route_short_name = ? LIMIT 1`,
      [route_id]
    );
    if (routeLookup?.length > 0) gtfsRouteId = routeLookup[0].route_id;

    const serviceId = await getDominantServiceIdForRoute(gtfsRouteId);
    if (!serviceId) return res.json({ success: true, tripsAtRisk: [], summary: { totalTripsAtRisk: 0 } });

    // Find nearest stop on this route
    let stopId = null;
    let stopName = null;
    if (lat && lng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const stops = await query(
        `SELECT DISTINCT s.stop_id, s.stop_name, s.stop_lat, s.stop_lon
         FROM gtfs_stops s JOIN gtfs_stop_times st ON s.stop_id = st.stop_id
         JOIN gtfs_trips t ON st.trip_id = t.trip_id
         WHERE t.route_id = ? AND t.service_id = ?
           AND s.stop_lat BETWEEN ? AND ? AND s.stop_lon BETWEEN ? AND ?
         LIMIT 50`,
        [gtfsRouteId, serviceId, latNum - 0.02, latNum + 0.02, lngNum - 0.03, lngNum + 0.03]
      );
      let minDist = Infinity;
      for (const s of (stops || [])) {
        const d = haversineKm(latNum, lngNum, parseFloat(s.stop_lat), parseFloat(s.stop_lon));
        if (d < minDist) { minDist = d; stopId = s.stop_id; stopName = s.stop_name; }
      }
    }

    if (!stopId) {
      const first = await query(
        `SELECT DISTINCT s.stop_id, s.stop_name FROM gtfs_stops s
         JOIN gtfs_stop_times st ON s.stop_id = st.stop_id JOIN gtfs_trips t ON st.trip_id = t.trip_id
         WHERE t.route_id = ? AND t.service_id = ? ORDER BY st.stop_sequence ASC LIMIT 1`,
        [gtfsRouteId, serviceId]
      );
      if (first?.length > 0) { stopId = first[0].stop_id; stopName = first[0].stop_name; }
    }

    if (!stopId) return res.json({ success: true, tripsAtRisk: [], summary: { totalTripsAtRisk: 0 } });

    const trips = await query(
      `SELECT t.trip_id, t.trip_headsign, t.direction_id, st.departure_time
       FROM gtfs_stop_times st JOIN gtfs_trips t ON st.trip_id = t.trip_id
       WHERE t.route_id = ? AND t.service_id = ? AND st.stop_id = ?
         AND st.departure_time >= ? AND st.departure_time <= ?
       ORDER BY st.departure_time ASC`,
      [gtfsRouteId, serviceId, stopId, now, endTime]
    );

    const tripsAtRisk = (trips || []).map(t => ({
      tripId: t.trip_id,
      headsign: t.trip_headsign || 'Unknown',
      directionId: t.direction_id,
      departureTime: t.departure_time,
      minutesUntilDeparture: Math.max(0, Math.round(minutesBetween(now, t.departure_time))),
    }));

    return res.json({
      success: true,
      nearestStop: { stopId, stopName },
      tripsAtRisk,
      summary: { totalTripsAtRisk: tripsAtRisk.length, timeWindow: parseInt(minutes) },
    });
  } catch (error) {
    console.error('Error in public trips-at-risk:', error);
    return res.json({ success: true, tripsAtRisk: [], summary: { totalTripsAtRisk: 0 } });
  }
});

// GET /api/public/stop-departures - Departures at a stop (for mini departure boards)
router.get('/stop-departures', async (req, res) => {
  try {
    const { stop_id, lat, lng, limit = 8 } = req.query;
    const userLimit = Math.min(Math.max(parseInt(limit) || 8, 1), 30);
    const now = currentTimeGTFS();
    const dayCode = getTodayDayCode();

    let targetStopId = stop_id;

    // If lat/lng provided instead of stop_id, find nearest stop
    if (!targetStopId && lat && lng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const nearbyStops = await query(
        `SELECT stop_id, stop_name, stop_lat, stop_lon FROM gtfs_stops
         WHERE stop_lat BETWEEN ? AND ? AND stop_lon BETWEEN ? AND ?
         LIMIT 20`,
        [latNum - 0.005, latNum + 0.005, lngNum - 0.008, lngNum + 0.008]
      );
      let minDist = Infinity;
      for (const s of (nearbyStops || [])) {
        const d = haversineKm(latNum, lngNum, parseFloat(s.stop_lat), parseFloat(s.stop_lon));
        if (d < minDist) { minDist = d; targetStopId = s.stop_id; }
      }
    }

    if (!targetStopId) return res.json({ success: true, departures: [], stop: null });

    // Get stop info
    const stopInfo = await query(
      'SELECT stop_id, stop_name, stop_lat, stop_lon FROM gtfs_stops WHERE stop_id = ? LIMIT 1',
      [targetStopId]
    );

    // Get departures filtered by day type
    let departures = await query(
      `SELECT st.departure_time, r.route_short_name, t.trip_headsign
       FROM gtfs_stop_times st
       JOIN gtfs_trips t ON st.trip_id = t.trip_id
       JOIN gtfs_routes r ON t.route_id = r.route_id
       WHERE st.stop_id = ? AND st.departure_time >= ? AND t.service_id LIKE ?
       ORDER BY st.departure_time ASC
       LIMIT ${userLimit * 3}`,
      [targetStopId, now, `%${dayCode}%`]
    );

    // Deduplicate
    const seen = new Set();
    const results = (departures || []).filter(d => {
      const key = `${d.route_short_name}-${d.departure_time}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, userLimit).map(d => ({
      departureTime: d.departure_time,
      minutesUntilDeparture: Math.max(0, Math.round(minutesBetween(now, d.departure_time))),
      routeShortName: d.route_short_name,
      headsign: d.trip_headsign || 'Unknown',
    }));

    const stop = stopInfo?.[0] ? {
      stopId: stopInfo[0].stop_id,
      stopName: stopInfo[0].stop_name,
      lat: parseFloat(stopInfo[0].stop_lat),
      lng: parseFloat(stopInfo[0].stop_lon),
    } : null;

    return res.json({ success: true, stop, departures: results, currentTime: now });
  } catch (error) {
    console.error('Error in public stop-departures:', error);
    return res.json({ success: true, departures: [], stop: null });
  }
});

// GET /api/public/service-gaps - Frequency impact for a route
router.get('/service-gaps', async (req, res) => {
  try {
    const { route_id, lat, lng } = req.query;
    if (!route_id) return res.json({ success: true, normalFrequency: null, currentGap: null });

    const now = currentTimeGTFS();

    // Resolve short name
    let gtfsRouteId = route_id;
    const routeLookup = await query(
      `SELECT route_id FROM gtfs_routes WHERE route_short_name = ? LIMIT 1`,
      [route_id]
    );
    if (routeLookup?.length > 0) gtfsRouteId = routeLookup[0].route_id;

    const serviceId = await getDominantServiceIdForRoute(gtfsRouteId);
    if (!serviceId) return res.json({ success: true, normalFrequency: null, currentGap: null });

    // Find a stop to analyze
    let stopId = null;
    if (lat && lng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const stops = await query(
        `SELECT DISTINCT s.stop_id FROM gtfs_stops s
         JOIN gtfs_stop_times st ON s.stop_id = st.stop_id
         JOIN gtfs_trips t ON st.trip_id = t.trip_id
         WHERE t.route_id = ? AND t.service_id = ?
           AND s.stop_lat BETWEEN ? AND ? AND s.stop_lon BETWEEN ? AND ?
         LIMIT 10`,
        [gtfsRouteId, serviceId, latNum - 0.02, latNum + 0.02, lngNum - 0.03, lngNum + 0.03]
      );
      if (stops?.length > 0) stopId = stops[0].stop_id;
    }

    if (!stopId) {
      const busiest = await query(
        `SELECT st.stop_id, COUNT(*) as cnt FROM gtfs_stop_times st
         JOIN gtfs_trips t ON st.trip_id = t.trip_id
         WHERE t.route_id = ? AND t.service_id = ? GROUP BY st.stop_id ORDER BY cnt DESC LIMIT 1`,
        [gtfsRouteId, serviceId]
      );
      stopId = busiest?.[0]?.stop_id;
    }

    if (!stopId) return res.json({ success: true, normalFrequency: null, currentGap: null });

    // Get departures in a 4-hour window around now
    const windowStart = addMinutesToGTFS(now, -120);
    const windowEnd = addMinutesToGTFS(now, 120);

    const departures = await query(
      `SELECT st.departure_time FROM gtfs_stop_times st
       JOIN gtfs_trips t ON st.trip_id = t.trip_id
       WHERE t.route_id = ? AND t.service_id = ? AND st.stop_id = ?
         AND st.departure_time >= ? AND st.departure_time <= ?
       ORDER BY st.departure_time ASC`,
      [gtfsRouteId, serviceId, stopId, windowStart, windowEnd]
    );

    if (!departures || departures.length < 3) {
      return res.json({ success: true, normalFrequency: null, currentGap: null });
    }

    // Calculate median headway (normal frequency)
    const headways = [];
    for (let i = 1; i < departures.length; i++) {
      headways.push(minutesBetween(departures[i - 1].departure_time, departures[i].departure_time));
    }
    const sorted = [...headways].sort((a, b) => a - b);
    const medianHeadway = sorted[Math.floor(sorted.length / 2)];

    // Find current gap (gap around now)
    let currentGap = null;
    for (let i = 1; i < departures.length; i++) {
      const prevTime = departures[i - 1].departure_time;
      const nextTime = departures[i].departure_time;
      if (prevTime <= now && nextTime >= now) {
        currentGap = Math.round(minutesBetween(prevTime, nextTime));
        break;
      }
    }

    return res.json({
      success: true,
      normalFrequency: Math.round(medianHeadway),
      currentGap,
      routeId: route_id,
    });
  } catch (error) {
    console.error('Error in public service-gaps:', error);
    return res.json({ success: true, normalFrequency: null, currentGap: null });
  }
});

// POST /api/public/interest - Sales enquiry from the public "I am interested" form
// No authentication required (prospective operators are not logged in).
router.post('/interest', async (req, res) => {
  try {
    const {
      name, company, email, phone, role,
      fleetSize, depots, currentProcess, features, message,
      website // honeypot - real users never fill this
    } = req.body || {};

    // Honeypot: silently accept and drop obvious bot submissions
    if (website) {
      return res.json({ success: true, message: 'Thank you for your interest.' });
    }

    // Required fields
    if (!name || !company || !email) {
      return res.status(400).json({
        success: false,
        error: 'Please provide your name, company, and email address.'
      });
    }

    // Basic email sanity check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
    }

    // Clamp field lengths to keep emails tidy and reject abuse
    const clamp = (v, n) => (v == null ? null : String(v).slice(0, n));
    const enquiry = {
      name: clamp(name, 200),
      company: clamp(company, 200),
      email: clamp(email, 200),
      phone: clamp(phone, 50),
      role: clamp(role, 150),
      fleetSize: clamp(fleetSize, 100),
      depots: clamp(depots, 100),
      currentProcess: clamp(currentProcess, 500),
      features: Array.isArray(features) ? features.slice(0, 20).map(f => clamp(f, 100)) : clamp(features, 500),
      message: clamp(message, 4000)
    };

    // Email is the primary delivery; don't fail the request if SMTP hiccups
    const result = await sendInterestNotification(enquiry);
    if (!result.success) {
      console.error('Interest enquiry email failed:', result.error);
    }

    return res.json({
      success: true,
      message: "Thank you for your interest. We'll be in touch shortly."
    });
  } catch (error) {
    console.error('Error handling interest enquiry:', error);
    return res.status(500).json({ success: false, error: 'Something went wrong. Please try again, or email gair@gobarry.co.uk directly.' });
  }
});

export default router;
