#!/usr/bin/env node
/**
 * Diagnose the exact query path
 */

import { query } from '../utils/queryHelpers.js';

async function diagnose() {
  console.log('🔍 Testing exact query for route "21"...\n');

  try {
    // Step 1: Find the route
    console.log('1️⃣ Finding route with short_name = "21":');
    const routes = await query(`
      SELECT route_id, route_short_name
      FROM gtfs_routes
      WHERE route_short_name = '21'
    `);
    console.log('   Result:', routes);

    if (routes.length === 0) {
      console.log('   ❌ No route found!');
      process.exit(1);
    }

    const gtfsRouteId = routes[0].route_id;
    console.log(`   ✅ Found route_id: ${gtfsRouteId}\n`);

    // Step 2: Find trips for this route
    console.log('2️⃣ Finding trips with route_id = "' + gtfsRouteId + '":');
    const trips = await query(`
      SELECT trip_id, route_id, direction_id
      FROM gtfs_trips
      WHERE route_id = ?
      LIMIT 5
    `, [gtfsRouteId]);
    console.log('   Result:', trips);

    if (trips.length === 0) {
      console.log('   ❌ No trips found!');

      // Check what route_id values exist in trips
      console.log('\n   Checking gtfs_trips route_id format:');
      const sampleTrips = await query(`SELECT DISTINCT route_id FROM gtfs_trips LIMIT 10`);
      console.log('   Sample route_ids in trips:', sampleTrips.map(t => t.route_id));
      process.exit(1);
    }

    console.log(`   ✅ Found ${trips.length} trips\n`);

    // Step 3: Test the actual query from mileageCalculationService
    console.log('3️⃣ Testing the actual service query:');
    const serviceQuery = await query(`
      SELECT t.trip_id, t.direction_id
      FROM gtfs_trips t
      INNER JOIN gtfs_routes r ON t.route_id = r.route_id
      WHERE r.route_id = ? OR r.route_short_name = ?
      ORDER BY t.direction_id, t.trip_id
      LIMIT 2
    `, ['21', '21']);
    console.log('   Result:', serviceQuery);

    if (serviceQuery.length === 0) {
      console.log('   ❌ Service query returned no results!');
    } else {
      console.log(`   ✅ Service query found ${serviceQuery.length} trips`);

      // Step 4: Get stops for these trips
      const tripIds = serviceQuery.map(t => t.trip_id);
      console.log('\n4️⃣ Getting stops for trip:', tripIds[0]);
      const stops = await query(`
        SELECT s.stop_id, s.stop_name, s.stop_lat, s.stop_lon, st.stop_sequence
        FROM gtfs_stop_times st
        INNER JOIN gtfs_stops s ON st.stop_id = s.stop_id
        WHERE st.trip_id = ?
        ORDER BY st.stop_sequence
        LIMIT 10
      `, [tripIds[0]]);
      console.log('   Found', stops.length, 'stops');
      stops.forEach(s => console.log(`   ${s.stop_sequence}: ${s.stop_name}`));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }

  process.exit(0);
}

diagnose();
