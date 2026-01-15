#!/usr/bin/env node
/**
 * Reset and recalculate mileage with fixed algorithm
 * Run on server: node scripts/reset-and-recalculate-mileage.js
 */

import { query } from '../utils/queryHelpers.js';
import { calculateMileageLost } from '../services/mileageCalculationService.js';

async function resetAndRecalculate() {
  console.log('🔄 Resetting and recalculating mileage with fixed algorithm...\n');

  try {
    // Step 1: Clear all existing mileage data
    console.log('🗑️  Step 1: Clearing old (incorrect) mileage data...\n');

    const clearResult = await query(`
      UPDATE breakdowns
      SET estimated_mileage_lost = NULL,
          mileage_calculation_data = NULL
      WHERE estimated_mileage_lost IS NOT NULL
    `);

    console.log(`   ✅ Cleared mileage from ${clearResult.affectedRows || 0} breakdowns\n`);

    // Step 2: Get breakdowns with route_id
    console.log('📏 Step 2: Recalculating mileage with fixed algorithm...\n');
    console.log('   📌 Using: Max 4 hours downtime, max 500 miles per breakdown\n');
    console.log('   📌 Using: Single representative trip per direction (not all trips)\n');

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
      ORDER BY created_at DESC
    `);

    if (!breakdowns || breakdowns.length === 0) {
      console.log('   ℹ️ No breakdowns with route_id to process');
      process.exit(0);
    }

    console.log(`   📋 Found ${breakdowns.length} breakdowns to process\n`);

    let processed = 0;
    let errors = 0;
    let totalMileage = 0;

    for (const breakdown of breakdowns) {
      try {
        // Calculate downtime (capped at 4 hours by the service)
        let downtimeMinutes = 60; // Default 1 hour
        if (breakdown.resolved_at && breakdown.created_at) {
          const createdAt = new Date(breakdown.created_at);
          const resolvedAt = new Date(breakdown.resolved_at);
          downtimeMinutes = Math.ceil((resolvedAt - createdAt) / (1000 * 60));
        }

        // Calculate mileage
        const result = await calculateMileageLost({
          routeId: breakdown.route_id,
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

          const cappedNote = result.mileageLost.wasCapped ? ' (capped)' : '';
          console.log(`   ✅ ${breakdown.breakdown_id}: ${result.mileageLost.totalMiles.toFixed(2)} mi${cappedNote} (Route ${breakdown.route_id}, ${result.routeInfo.distanceMiles.toFixed(1)} mi route)`);
        } else {
          errors++;
          console.log(`   ⚠️ ${breakdown.breakdown_id}: ${result.error || 'No GTFS data'} (Route ${breakdown.route_id})`);
        }
      } catch (err) {
        errors++;
        console.log(`   ❌ ${breakdown.breakdown_id}: ${err.message}`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('📊 SUMMARY');
    console.log('='.repeat(70));
    console.log(`   Total breakdowns processed: ${breakdowns.length}`);
    console.log(`   Successfully calculated: ${processed}`);
    console.log(`   Errors/No GTFS data: ${errors}`);
    console.log(`   Total mileage calculated: ${totalMileage.toFixed(2)} miles`);
    console.log(`   Average per breakdown: ${processed > 0 ? (totalMileage / processed).toFixed(2) : 0} miles`);
    console.log('='.repeat(70));

    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

resetAndRecalculate();
