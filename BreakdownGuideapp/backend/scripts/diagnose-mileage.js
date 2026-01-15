#!/usr/bin/env node
/**
 * Diagnostic script to check breakdown route_id population
 * Run on server: node scripts/diagnose-mileage.js
 */

import { query } from '../utils/queryHelpers.js';

async function diagnoseBreakdowns() {
  console.log('🔍 Diagnosing breakdown data for mileage calculation...\n');

  try {
    // 1. Total breakdowns count
    const totalResult = await query('SELECT COUNT(*) as count FROM breakdowns');
    console.log(`📊 Total breakdowns: ${totalResult[0]?.count || 0}`);

    // 2. Breakdowns with route_id
    const withRouteResult = await query(`
      SELECT COUNT(*) as count FROM breakdowns
      WHERE route_id IS NOT NULL AND route_id != ''
    `);
    console.log(`📍 With route_id: ${withRouteResult[0]?.count || 0}`);

    // 3. Breakdowns with mileage calculated
    const withMileageResult = await query(`
      SELECT COUNT(*) as count FROM breakdowns
      WHERE estimated_mileage_lost IS NOT NULL AND estimated_mileage_lost > 0
    `);
    console.log(`📏 With mileage calculated: ${withMileageResult[0]?.count || 0}`);

    // 4. Sample breakdowns with wizard_assessment_data
    console.log('\n📋 Sample breakdowns with wizard data (checking for route info):\n');
    const samples = await query(`
      SELECT
        id,
        breakdown_id,
        route_id,
        estimated_mileage_lost,
        JSON_EXTRACT(wizard_assessment_data, '$.route') as wizard_route,
        JSON_EXTRACT(wizard_assessment_data, '$.routeName') as wizard_route_name,
        created_at
      FROM breakdowns
      ORDER BY created_at DESC
      LIMIT 10
    `);

    samples.forEach((b, i) => {
      console.log(`${i + 1}. ${b.breakdown_id || b.id}`);
      console.log(`   route_id: ${b.route_id || 'NULL'}`);
      console.log(`   wizard_route: ${b.wizard_route || 'NULL'}`);
      console.log(`   wizard_route_name: ${b.wizard_route_name || 'NULL'}`);
      console.log(`   mileage: ${b.estimated_mileage_lost || 'NOT CALCULATED'}`);
      console.log('');
    });

    // 5. Check GTFS routes available
    const routesCount = await query('SELECT COUNT(*) as count FROM gtfs_routes');
    console.log(`🚌 GTFS routes in database: ${routesCount[0]?.count || 0}`);

    // 6. Sample GTFS routes
    const sampleRoutes = await query(`
      SELECT route_id, route_short_name, route_long_name
      FROM gtfs_routes
      LIMIT 5
    `);
    console.log('\n📌 Sample GTFS routes:');
    sampleRoutes.forEach(r => {
      console.log(`   ${r.route_short_name} (${r.route_id}): ${r.route_long_name || 'No name'}`);
    });

    // 7. Check if wizard_assessment_data.route matches any GTFS routes
    console.log('\n🔗 Checking wizard route matches with GTFS...');
    const matchCheck = await query(`
      SELECT
        JSON_UNQUOTE(JSON_EXTRACT(b.wizard_assessment_data, '$.route')) as wizard_route,
        COUNT(*) as breakdown_count,
        (SELECT COUNT(*) FROM gtfs_routes gr WHERE gr.route_short_name = JSON_UNQUOTE(JSON_EXTRACT(b.wizard_assessment_data, '$.route'))) as gtfs_matches
      FROM breakdowns b
      WHERE JSON_EXTRACT(b.wizard_assessment_data, '$.route') IS NOT NULL
      GROUP BY wizard_route
      ORDER BY breakdown_count DESC
      LIMIT 10
    `);

    if (matchCheck.length > 0) {
      console.log('\n   Wizard Route -> Breakdown Count -> GTFS Matches');
      matchCheck.forEach(m => {
        console.log(`   ${m.wizard_route || 'NULL'} -> ${m.breakdown_count} breakdowns -> ${m.gtfs_matches} GTFS matches`);
      });
    } else {
      console.log('   No wizard_assessment_data.route found in any breakdowns');
    }

    console.log('\n✅ Diagnosis complete');

  } catch (error) {
    console.error('❌ Error during diagnosis:', error.message);
  }

  process.exit(0);
}

diagnoseBreakdowns();
