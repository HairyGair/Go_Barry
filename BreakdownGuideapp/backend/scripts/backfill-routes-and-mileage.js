#!/usr/bin/env node
/**
 * Backfill route_id from wizard_assessment_data and calculate mileage
 * Run on server: node scripts/backfill-routes-and-mileage.js
 */

import { query } from '../utils/queryHelpers.js';
import { calculateMileageLost } from '../services/mileageCalculationService.js';

async function backfillRoutesAndMileage() {
  console.log('🔄 Starting route backfill and mileage calculation...\n');

  try {
    // Step 1: Backfill route_id from wizard_assessment_data.route
    console.log('📍 Step 1: Backfilling route_id from wizard_assessment_data...\n');

    const backfillResult = await query(`
      UPDATE breakdowns
      SET route_id = JSON_UNQUOTE(JSON_EXTRACT(wizard_assessment_data, '$.route'))
      WHERE route_id IS NULL
        AND JSON_EXTRACT(wizard_assessment_data, '$.route') IS NOT NULL
    `);

    console.log(`   ✅ Updated ${backfillResult.affectedRows || 0} breakdowns with route_id\n`);

    // Step 2: Get breakdowns that now have route_id but no mileage
    console.log('📏 Step 2: Calculating mileage for breakdowns...\n');

    const breakdowns = await query(`
      SELECT
        id,
        breakdown_id,
        route_id,
        location_lat,
        location_lng,
        created_at,
        resolved_at
      FROM breakdowns
      WHERE route_id IS NOT NULL
        AND route_id != ''
        AND (estimated_mileage_lost IS NULL OR estimated_mileage_lost = 0)
      ORDER BY created_at DESC
    `);

    if (!breakdowns || breakdowns.length === 0) {
      console.log('   ℹ️ No breakdowns need mileage calculation');
      process.exit(0);
    }

    console.log(`   📋 Found ${breakdowns.length} breakdowns to process\n`);

    let processed = 0;
    let errors = 0;
    let totalMileage = 0;

    for (const breakdown of breakdowns) {
      try {
        // Calculate downtime
        let downtimeMinutes = 60; // Default 1 hour
        if (breakdown.resolved_at && breakdown.created_at) {
          const createdAt = new Date(breakdown.created_at);
          const resolvedAt = new Date(breakdown.resolved_at);
          downtimeMinutes = Math.ceil((resolvedAt - createdAt) / (1000 * 60));
        }

        // Calculate mileage using route_short_name (wizard stores short names like "21", "Q3")
        const result = await calculateMileageLost({
          routeId: breakdown.route_id, // This is actually the route_short_name
          lat: breakdown.location_lat,
          lng: breakdown.location_lng,
          estimatedDowntimeMinutes: downtimeMinutes,
        });

        if (result.success) {
          // Update breakdown with mileage data
          await query(`
            UPDATE breakdowns
            SET estimated_mileage_lost = ?,
                mileage_calculation_data = ?
            WHERE id = ?
          `, [result.mileageLost.totalMiles, JSON.stringify(result), breakdown.id]);

          processed++;
          totalMileage += result.mileageLost.totalMiles;
          console.log(`   ✅ ${breakdown.breakdown_id}: ${result.mileageLost.totalMiles.toFixed(2)} miles (Route ${breakdown.route_id})`);
        } else {
          errors++;
          console.log(`   ⚠️ ${breakdown.breakdown_id}: ${result.error || 'No GTFS data for route'} (Route ${breakdown.route_id})`);
        }
      } catch (err) {
        errors++;
        console.log(`   ❌ ${breakdown.breakdown_id}: ${err.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`   Total breakdowns processed: ${breakdowns.length}`);
    console.log(`   Successfully calculated: ${processed}`);
    console.log(`   Errors/No GTFS data: ${errors}`);
    console.log(`   Total mileage calculated: ${totalMileage.toFixed(2)} miles`);
    console.log('='.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

backfillRoutesAndMileage();
