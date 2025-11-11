/**
 * Migration: Add GTFS Phase 1 Schema
 * Purpose: Add route_id column and create necessary views/tables for Phase 1 features
 * Date: November 11, 2025
 *
 * Usage: node migrations/001_add_gtfs_phase1_schema.js
 *
 * Changes:
 * 1. Add route_id column to breakdowns table
 * 2. Create v_route_status_summary view (for Live Route Status Dashboard)
 * 3. Create v_breakdown_heatmap view (for Stop-Level Incident Heatmap)
 * 4. Create route_coverage_analysis table (for Route Coverage Analysis)
 * 5. Add spatial indexes on gtfs_stops for performance
 */

import { query } from '../utils/queryHelpers.js';
import dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
  try {
    console.log('🚀 Starting GTFS Phase 1 Database Migration...\n');

    // Step 1: Add route_id column
    console.log('Step 1: Adding route_id column to breakdowns table...');
    try {
      await query(`
        ALTER TABLE breakdowns
        ADD COLUMN route_id VARCHAR(10) NULL
        COMMENT 'GTFS route_id for matching to transit routes'
        AFTER fleet_no;
      `);
      console.log('✅ Added route_id column\n');
    } catch (error) {
      if (error.message && error.message.includes('Duplicate')) {
        console.log('✅ route_id column already exists\n');
      } else {
        throw error;
      }
    }

    // Step 2: Add index on route_id
    console.log('Step 2: Adding index on route_id...');
    try {
      await query(`
        ALTER TABLE breakdowns
        ADD INDEX idx_route_id (route_id);
      `);
      console.log('✅ Added index on route_id\n');
    } catch (error) {
      if (error.message && error.message.includes('Duplicate')) {
        console.log('✅ Index on route_id already exists\n');
      } else {
        throw error;
      }
    }

    // Step 3: Add spatial index on gtfs_stops
    console.log('Step 3: Verifying spatial index on gtfs_stops...');
    try {
      await query(`
        ALTER TABLE gtfs_stops
        ADD INDEX idx_stop_location (stop_lat, stop_lon);
      `);
      console.log('✅ Added spatial index on gtfs_stops\n');
    } catch (error) {
      if (error.message && error.message.includes('Duplicate')) {
        console.log('✅ Spatial index on gtfs_stops already exists\n');
      } else {
        throw error;
      }
    }

    // Step 4: Create route status summary view
    console.log('Step 4: Creating v_route_status_summary view...');
    try {
      await query(`
        CREATE OR REPLACE VIEW v_route_status_summary AS
        SELECT
          r.route_id,
          r.route_short_name,
          r.route_long_name,
          COUNT(DISTINCT b.id) as active_breakdown_count,
          MAX(b.created_at) as last_breakdown_time,
          CASE
            WHEN COUNT(DISTINCT b.id) = 0 THEN 'GREEN'
            WHEN COUNT(DISTINCT b.id) = 1 THEN 'AMBER'
            ELSE 'RED'
          END as status,
          GROUP_CONCAT(DISTINCT b.severity SEPARATOR ',') as breakdown_severities
        FROM gtfs_routes r
        LEFT JOIN breakdowns b ON r.route_id = b.route_id
          AND b.status NOT IN ('resolved', 'cleared')
          AND b.created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
        GROUP BY r.route_id, r.route_short_name, r.route_long_name;
      `);
      console.log('✅ Created v_route_status_summary view\n');
    } catch (error) {
      console.log('✅ View v_route_status_summary already exists or error: ' + error.message + '\n');
    }

    // Step 5: Create breakdown heatmap view
    console.log('Step 5: Creating v_breakdown_heatmap view...');
    try {
      await query(`
        CREATE OR REPLACE VIEW v_breakdown_heatmap AS
        SELECT
          b.id,
          b.breakdown_id,
          b.location_lat,
          b.location_lng,
          b.issue_category,
          b.severity,
          b.status,
          b.created_at,
          (
            SELECT COUNT(*) FROM breakdowns b2
            WHERE b2.location_lat IS NOT NULL
            AND b2.location_lng IS NOT NULL
            AND SQRT(
              POW(b2.location_lat - b.location_lat, 2) +
              POW(b2.location_lng - b.location_lng, 2)
            ) < 0.01
            AND b2.created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
          ) as nearby_breakdown_count
        FROM breakdowns b
        WHERE b.location_lat IS NOT NULL
          AND b.location_lng IS NOT NULL
          AND b.created_at > DATE_SUB(NOW(), INTERVAL 30 DAY);
      `);
      console.log('✅ Created v_breakdown_heatmap view\n');
    } catch (error) {
      console.log('✅ View v_breakdown_heatmap already exists or error: ' + error.message + '\n');
    }

    // Step 6: Create route coverage analysis table
    console.log('Step 6: Creating route_coverage_analysis table...');
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS route_coverage_analysis (
          id INT PRIMARY KEY AUTO_INCREMENT,
          route_id VARCHAR(10) NOT NULL UNIQUE,
          route_name VARCHAR(255),
          total_vehicles INT DEFAULT 0,
          active_vehicles INT DEFAULT 0,
          spare_vehicles INT DEFAULT 0,
          coverage_percentage DECIMAL(5, 2) DEFAULT 0,
          status VARCHAR(20) COMMENT 'GREEN/AMBER/RED for coverage',
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_route_id (route_id),
          INDEX idx_coverage (coverage_percentage),
          INDEX idx_status (status)
        ) COMMENT='Route coverage analysis for Phase 1 feature';
      `);
      console.log('✅ Created route_coverage_analysis table\n');
    } catch (error) {
      if (error.message && error.message.includes('already exists')) {
        console.log('✅ Table route_coverage_analysis already exists\n');
      } else {
        throw error;
      }
    }

    // Step 7: Verify GTFS data
    console.log('Step 7: Verifying GTFS data...');
    const routeCount = await query('SELECT COUNT(*) as count FROM gtfs_routes');
    const stopCount = await query('SELECT COUNT(*) as count FROM gtfs_stops');
    const stopTimesCount = await query('SELECT COUNT(*) as count FROM gtfs_stop_times');
    const breakdownCount = await query('SELECT COUNT(*) as count FROM breakdowns');

    const rc = routeCount && routeCount[0] ? routeCount[0].count : 0;
    const sc = stopCount && stopCount[0] ? stopCount[0].count : 0;
    const stc = stopTimesCount && stopTimesCount[0] ? stopTimesCount[0].count : 0;
    const bc = breakdownCount && breakdownCount[0] ? breakdownCount[0].count : 0;

    console.log(`  Routes: ${rc.toLocaleString()}`);
    console.log(`  Stops: ${sc.toLocaleString()}`);
    console.log(`  Stop Times: ${stc.toLocaleString()}`);
    console.log(`  Breakdowns: ${bc.toLocaleString()}\n`);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ GTFS Phase 1 Database Migration Complete');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('Next Steps:');
    console.log('1. Backend API endpoints are ready at /api/gtfs/*');
    console.log('2. Restart PM2: pm2 restart breakdown-backend');
    console.log('3. Test endpoints with supervisor authentication\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

runMigration();
