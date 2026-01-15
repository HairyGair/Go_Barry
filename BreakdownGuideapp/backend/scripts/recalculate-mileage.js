#!/usr/bin/env node
/**
 * One-time script to recalculate mileage for all breakdowns
 * Run on server: node scripts/recalculate-mileage.js
 */

import { query } from '../utils/queryHelpers.js';
import {
  calculateMileageLost,
} from '../services/mileageCalculationService.js';

async function recalculateAllMileage() {
  console.log('🔄 Starting mileage recalculation...\n');

  try {
    // Get breakdowns without mileage data that have a route_id
    const breakdowns = await query(`
      SELECT id, breakdown_id, route_id, location_lat, location_lng, created_at, resolved_at
      FROM breakdowns
      WHERE route_id IS NOT NULL
      AND (estimated_mileage_lost IS NULL OR estimated_mileage_lost = 0)
      ORDER BY created_at DESC
      LIMIT 200
    `);

    if (!breakdowns || breakdowns.length === 0) {
      console.log('✅ No breakdowns require mileage calculation');
      process.exit(0);
    }

    console.log(`📋 Found ${breakdowns.length} breakdowns to process\n`);

    let processed = 0;
    let errors = 0;
    let totalMileage = 0;

    for (const breakdown of breakdowns) {
      try {
        // Calculate downtime
        let downtimeMinutes = 60;
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
          // Update breakdown
          await query(`
            UPDATE breakdowns
            SET estimated_mileage_lost = ?, mileage_calculation_data = ?
            WHERE id = ?
          `, [result.mileageLost.totalMiles, JSON.stringify(result), breakdown.id]);

          processed++;
          totalMileage += result.mileageLost.totalMiles;
          console.log(`  ✅ ${breakdown.breakdown_id}: ${result.mileageLost.totalMiles.toFixed(2)} miles (Route ${breakdown.route_id})`);
        } else {
          errors++;
          console.log(`  ❌ ${breakdown.breakdown_id}: ${result.error}`);
        }
      } catch (err) {
        errors++;
        console.log(`  ❌ ${breakdown.breakdown_id}: ${err.message}`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 SUMMARY');
    console.log('='.repeat(50));
    console.log(`  Total breakdowns: ${breakdowns.length}`);
    console.log(`  Successfully processed: ${processed}`);
    console.log(`  Errors: ${errors}`);
    console.log(`  Total mileage calculated: ${totalMileage.toFixed(2)} miles`);
    console.log('='.repeat(50));

    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

recalculateAllMileage();
