#!/usr/bin/env node
/**
 * Diagnose GTFS route matching
 * Run on server: node scripts/diagnose-gtfs-routes.js
 */

import { query } from '../utils/queryHelpers.js';

async function diagnose() {
  console.log('🔍 Diagnosing GTFS Route Data...\n');

  try {
    // 1. Check GTFS tables exist and have data
    console.log('📊 GTFS Table Counts:');
    const tables = ['gtfs_routes', 'gtfs_trips', 'gtfs_stops', 'gtfs_stop_times'];
    for (const table of tables) {
      try {
        const result = await query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`   ${table}: ${result[0]?.count || 0} rows`);
      } catch (e) {
        console.log(`   ${table}: ERROR - ${e.message}`);
      }
    }

    // 2. Sample GTFS routes
    console.log('\n📌 Sample GTFS Routes (first 20):');
    const routes = await query(`
      SELECT route_id, route_short_name, route_long_name
      FROM gtfs_routes
      ORDER BY route_short_name
      LIMIT 20
    `);
    routes.forEach(r => {
      console.log(`   "${r.route_short_name}" (id: ${r.route_id}) - ${r.route_long_name || 'No name'}`);
    });

    // 3. Breakdown routes
    console.log('\n📋 Routes used in breakdowns:');
    const breakdownRoutes = await query(`
      SELECT DISTINCT route_id as route
      FROM breakdowns
      WHERE route_id IS NOT NULL AND route_id != ''
      ORDER BY route_id
    `);
    console.log(`   Found ${breakdownRoutes.length} unique routes: ${breakdownRoutes.map(r => r.route).join(', ')}`);

    // 4. Check if breakdown routes exist in GTFS
    console.log('\n🔗 Matching breakdown routes to GTFS:');
    for (const br of breakdownRoutes) {
      const match = await query(`
        SELECT route_id, route_short_name, route_long_name
        FROM gtfs_routes
        WHERE route_short_name = ? OR route_id = ?
        LIMIT 1
      `, [br.route, br.route]);

      if (match && match.length > 0) {
        console.log(`   ✅ "${br.route}" -> Found: ${match[0].route_short_name} (${match[0].route_id})`);
      } else {
        console.log(`   ❌ "${br.route}" -> NOT FOUND in GTFS`);
      }
    }

    // 5. Check trips for a sample route
    console.log('\n🚌 Sample trips for route "21":');
    const trips21 = await query(`
      SELECT t.trip_id, t.route_id, t.direction_id, r.route_short_name
      FROM gtfs_trips t
      JOIN gtfs_routes r ON t.route_id = r.route_id
      WHERE r.route_short_name = '21'
      LIMIT 5
    `);
    if (trips21.length > 0) {
      trips21.forEach(t => console.log(`   Trip: ${t.trip_id}, Direction: ${t.direction_id}`));
    } else {
      console.log('   No trips found for route 21');
    }

    // 6. Check stop_times for any trip
    console.log('\n⏱️ Sample stop_times (checking data exists):');
    const sampleStopTimes = await query(`
      SELECT st.trip_id, st.stop_id, st.stop_sequence, s.stop_name
      FROM gtfs_stop_times st
      JOIN gtfs_stops s ON st.stop_id = s.stop_id
      LIMIT 5
    `);
    if (sampleStopTimes.length > 0) {
      sampleStopTimes.forEach(st => console.log(`   ${st.trip_id} -> ${st.stop_name} (seq ${st.stop_sequence})`));
    } else {
      console.log('   No stop_times data found!');
    }

    console.log('\n✅ Diagnosis complete');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  process.exit(0);
}

diagnose();
