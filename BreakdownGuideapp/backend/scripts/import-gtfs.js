#!/usr/bin/env node

/**
 * GTFS Full Import Script
 *
 * Truncates existing GTFS data, applies schema migrations, and imports
 * all GTFS files from a specified directory. Computes route distances
 * from shape data at the end.
 *
 * Usage: node scripts/import-gtfs.js /path/to/gtfs/directory
 */

import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';
import { resolve, join } from 'path';

dotenv.config({ path: resolve(import.meta.dirname, '../.env') });

const GTFS_DIR = process.argv[2];
if (!GTFS_DIR) {
  console.error('Usage: node scripts/import-gtfs.js /path/to/gtfs/directory');
  process.exit(1);
}

const BATCH_SIZE = 5000;

// Database connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'gobarryco_breakdowns',
  connectionLimit: 5,
  charset: 'utf8mb4',
  multipleStatements: true,
});

async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function rawQuery(sql) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(sql);
    return rows;
  } finally {
    conn.release();
  }
}

function readCSV(filename) {
  const filepath = join(GTFS_DIR, filename);
  try {
    const buffer = readFileSync(filepath);
    return parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      bom: true,
    });
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log(`   Skipping ${filename} (not found)`);
      return null;
    }
    throw err;
  }
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => deg * (Math.PI / 180);
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function applyMigration() {
  console.log('\n=== Step 1: Apply migration (gtfs_shapes, shape_id, gtfs_route_distances) ===');

  // Create gtfs_shapes table
  await rawQuery(`
    CREATE TABLE IF NOT EXISTS gtfs_shapes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      shape_id VARCHAR(100) NOT NULL,
      shape_pt_lat DECIMAL(10, 6) NOT NULL,
      shape_pt_lon DECIMAL(10, 6) NOT NULL,
      shape_pt_sequence INT NOT NULL,
      shape_dist_traveled DECIMAL(10, 4) DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_shape_point (shape_id, shape_pt_sequence),
      INDEX idx_shape_id (shape_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('   gtfs_shapes table: OK');

  // Add shape_id column to gtfs_trips if not exists
  try {
    await rawQuery(`ALTER TABLE gtfs_trips ADD COLUMN shape_id VARCHAR(100) DEFAULT NULL`);
    console.log('   gtfs_trips.shape_id column: ADDED');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('   gtfs_trips.shape_id column: already exists');
    } else {
      throw err;
    }
  }

  // Add index on shape_id if not exists
  try {
    await rawQuery(`ALTER TABLE gtfs_trips ADD INDEX idx_trips_shape_id (shape_id)`);
    console.log('   gtfs_trips.shape_id index: ADDED');
  } catch (err) {
    if (err.code === 'ER_DUP_KEYNAME') {
      console.log('   gtfs_trips.shape_id index: already exists');
    } else {
      throw err;
    }
  }

  // Create gtfs_route_distances cache table
  await rawQuery(`
    CREATE TABLE IF NOT EXISTS gtfs_route_distances (
      id INT AUTO_INCREMENT PRIMARY KEY,
      route_id VARCHAR(100) NOT NULL,
      direction_id TINYINT NOT NULL DEFAULT 0,
      distance_km DECIMAL(10, 4) NOT NULL,
      distance_miles DECIMAL(10, 4) NOT NULL,
      shape_id VARCHAR(100) DEFAULT NULL,
      stop_count INT DEFAULT 0,
      cumulative_distances JSON DEFAULT NULL,
      computed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_route_direction (route_id, direction_id),
      INDEX idx_route_id (route_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('   gtfs_route_distances table: OK');
}

async function truncateTables() {
  console.log('\n=== Step 2: Truncate existing GTFS data ===');

  // Order matters due to potential foreign key references
  const tables = ['gtfs_route_distances', 'gtfs_shapes', 'gtfs_stop_times', 'gtfs_trips', 'gtfs_stops', 'gtfs_routes'];

  for (const table of tables) {
    try {
      await rawQuery(`TRUNCATE TABLE ${table}`);
      console.log(`   ${table}: truncated`);
    } catch (err) {
      console.log(`   ${table}: ${err.message}`);
    }
  }
}

async function importRoutes() {
  console.log('\n=== Step 3a: Import routes ===');
  const records = readCSV('routes.txt');
  if (!records) return;

  let count = 0;
  for (const row of records) {
    await query(
      `INSERT INTO gtfs_routes
        (route_id, agency_id, route_short_name, route_long_name, route_desc,
         route_type, route_url, route_color, route_text_color, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE
         agency_id = VALUES(agency_id),
         route_short_name = VALUES(route_short_name),
         route_long_name = VALUES(route_long_name),
         updated_at = NOW()`,
      [
        row.route_id, row.agency_id || null, row.route_short_name || null,
        row.route_long_name || null, row.route_desc || null,
        row.route_type || null, row.route_url || null,
        row.route_color || null, row.route_text_color || null,
      ]
    );
    count++;
  }
  console.log(`   Imported ${count} routes`);
}

async function importStops() {
  console.log('\n=== Step 3b: Import stops ===');
  const records = readCSV('stops.txt');
  if (!records) return;

  let count = 0;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const values = [];
    const placeholders = [];

    for (const row of batch) {
      placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())');
      values.push(
        row.stop_id, row.stop_code || null, row.stop_name || null,
        parseFloat(row.stop_lat) || null, parseFloat(row.stop_lon) || null,
        row.stop_desc || null, row.zone_id || null, row.wheelchair_boarding || null
      );
    }

    await rawQuery(
      `INSERT INTO gtfs_stops
        (stop_id, stop_code, stop_name, stop_lat, stop_lon, stop_desc, zone_id, wheelchair_boarding, created_at, updated_at)
       VALUES ${placeholders.join(',')}
       ON DUPLICATE KEY UPDATE
         stop_name = VALUES(stop_name),
         stop_lat = VALUES(stop_lat),
         stop_lon = VALUES(stop_lon),
         updated_at = NOW()`.replace(/\?/g, () => {
        const val = values.shift();
        if (val === null) return 'NULL';
        if (typeof val === 'number') return val;
        return pool.pool.config.connectionConfig.pool
          ? `'${String(val).replace(/'/g, "''")}'`
          : `'${String(val).replace(/'/g, "''")}'`;
      })
    );
    count += batch.length;
    process.stdout.write(`\r   Stops: ${count}/${records.length}`);
  }
  console.log(`\n   Imported ${count} stops`);
}

async function importTrips() {
  console.log('\n=== Step 3c: Import trips ===');
  const records = readCSV('trips.txt');
  if (!records) return;

  let count = 0;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const values = [];
    const placeholders = [];

    for (const row of batch) {
      placeholders.push('(?, ?, ?, ?, ?, ?, NOW(), NOW())');
      values.push(
        row.trip_id, row.route_id || null, row.service_id || null,
        row.trip_headsign || null, row.direction_id !== undefined ? row.direction_id : null,
        row.shape_id || null
      );
    }

    const conn = await pool.getConnection();
    try {
      await conn.query(
        `INSERT INTO gtfs_trips
          (trip_id, route_id, service_id, trip_headsign, direction_id, shape_id, created_at, updated_at)
         VALUES ${placeholders.join(',')}
         ON DUPLICATE KEY UPDATE
           route_id = VALUES(route_id),
           service_id = VALUES(service_id),
           trip_headsign = VALUES(trip_headsign),
           direction_id = VALUES(direction_id),
           shape_id = VALUES(shape_id),
           updated_at = NOW()`,
        values.flat ? values : values
      );
    } finally {
      conn.release();
    }

    count += batch.length;
    process.stdout.write(`\r   Trips: ${count}/${records.length}`);
  }
  console.log(`\n   Imported ${count} trips`);
}

async function importStopTimes() {
  console.log('\n=== Step 3d: Import stop_times (largest file - be patient) ===');
  const records = readCSV('stop_times.txt');
  if (!records) return;

  let count = 0;
  let errors = 0;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const values = [];
    const placeholders = [];

    for (const row of batch) {
      placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())');
      values.push(
        row.trip_id, row.stop_id, row.stop_sequence,
        row.arrival_time || null, row.departure_time || null,
        row.stop_headsign || null, row.pickup_type || null, row.drop_off_type || null
      );
    }

    const conn = await pool.getConnection();
    try {
      await conn.query(
        `INSERT INTO gtfs_stop_times
          (trip_id, stop_id, stop_sequence, arrival_time, departure_time,
           stop_headsign, pickup_type, drop_off_type, created_at, updated_at)
         VALUES ${placeholders.join(',')}
         ON DUPLICATE KEY UPDATE
           arrival_time = VALUES(arrival_time),
           departure_time = VALUES(departure_time),
           updated_at = NOW()`,
        values
      );
      count += batch.length;
    } catch (err) {
      errors++;
      console.error(`\n   Batch error at row ${i}: ${err.message}`);
    } finally {
      conn.release();
    }

    if (i % (BATCH_SIZE * 10) === 0 || i + BATCH_SIZE >= records.length) {
      process.stdout.write(`\r   Stop times: ${count}/${records.length} (${Math.round(count/records.length*100)}%)`);
    }
  }
  console.log(`\n   Imported ${count} stop_times (${errors} batch errors)`);
}

async function importShapes() {
  console.log('\n=== Step 3e: Import shapes ===');
  const records = readCSV('shapes.txt');
  if (!records) return;

  let count = 0;
  let errors = 0;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const values = [];
    const placeholders = [];

    for (const row of batch) {
      placeholders.push('(?, ?, ?, ?, ?, NOW(), NOW())');
      values.push(
        row.shape_id,
        parseFloat(row.shape_pt_lat) || 0,
        parseFloat(row.shape_pt_lon) || 0,
        parseInt(row.shape_pt_sequence) || 0,
        row.shape_dist_traveled ? parseFloat(row.shape_dist_traveled) : null
      );
    }

    const conn = await pool.getConnection();
    try {
      await conn.query(
        `INSERT INTO gtfs_shapes
          (shape_id, shape_pt_lat, shape_pt_lon, shape_pt_sequence, shape_dist_traveled, created_at, updated_at)
         VALUES ${placeholders.join(',')}
         ON DUPLICATE KEY UPDATE
           shape_pt_lat = VALUES(shape_pt_lat),
           shape_pt_lon = VALUES(shape_pt_lon),
           shape_dist_traveled = VALUES(shape_dist_traveled),
           updated_at = NOW()`,
        values
      );
      count += batch.length;
    } catch (err) {
      errors++;
      console.error(`\n   Batch error at row ${i}: ${err.message}`);
    } finally {
      conn.release();
    }

    if (i % (BATCH_SIZE * 10) === 0 || i + BATCH_SIZE >= records.length) {
      process.stdout.write(`\r   Shapes: ${count}/${records.length} (${Math.round(count/records.length*100)}%)`);
    }
  }
  console.log(`\n   Imported ${count} shape points (${errors} batch errors)`);
}

async function computeDistances() {
  console.log('\n=== Step 4: Compute route distances from shapes ===');

  // Get all routes with their trips and shape_ids
  const routeTrips = await query(`
    SELECT DISTINCT
      r.route_id, r.route_short_name,
      t.direction_id, t.shape_id, t.trip_id
    FROM gtfs_routes r
    INNER JOIN gtfs_trips t ON r.route_id = t.route_id
    WHERE t.shape_id IS NOT NULL
    ORDER BY r.route_id, t.direction_id
  `);

  if (!routeTrips || routeTrips.length === 0) {
    console.log('   No routes with shape_id found. Skipping.');
    return;
  }

  // Group by route + direction, pick one per group
  const routeDirections = {};
  for (const rt of routeTrips) {
    const key = `${rt.route_id}_${rt.direction_id ?? 0}`;
    if (!routeDirections[key]) {
      routeDirections[key] = {
        routeId: rt.route_id,
        routeShortName: rt.route_short_name,
        directionId: rt.direction_id ?? 0,
        shapeId: rt.shape_id,
        tripId: rt.trip_id,
      };
    }
  }

  const total = Object.keys(routeDirections).length;
  let processed = 0;
  let errors = 0;

  for (const rd of Object.values(routeDirections)) {
    try {
      // Get shape points
      const shapePoints = await query(
        `SELECT shape_pt_lat, shape_pt_lon, shape_pt_sequence
         FROM gtfs_shapes WHERE shape_id = ? ORDER BY shape_pt_sequence`,
        [rd.shapeId]
      );

      if (!shapePoints || shapePoints.length < 2) { errors++; continue; }

      // Sum distances along shape
      let totalDistanceKm = 0;
      for (let i = 0; i < shapePoints.length - 1; i++) {
        totalDistanceKm += haversineDistance(
          parseFloat(shapePoints[i].shape_pt_lat), parseFloat(shapePoints[i].shape_pt_lon),
          parseFloat(shapePoints[i + 1].shape_pt_lat), parseFloat(shapePoints[i + 1].shape_pt_lon)
        );
      }

      // Get stops for this trip
      const tripStops = await query(
        `SELECT s.stop_lat, s.stop_lon, st.stop_sequence
         FROM gtfs_stop_times st
         INNER JOIN gtfs_stops s ON st.stop_id = s.stop_id
         WHERE st.trip_id = ? ORDER BY st.stop_sequence`,
        [rd.tripId]
      );

      // Compute cumulative distances (project each stop onto shape)
      const cumulativeDistances = [];
      if (tripStops && tripStops.length > 0) {
        for (const stop of tripStops) {
          let minDist = Infinity;
          let bestIdx = 0;
          for (let j = 0; j < shapePoints.length; j++) {
            const d = haversineDistance(
              parseFloat(stop.stop_lat), parseFloat(stop.stop_lon),
              parseFloat(shapePoints[j].shape_pt_lat), parseFloat(shapePoints[j].shape_pt_lon)
            );
            if (d < minDist) { minDist = d; bestIdx = j; }
          }
          let cumDist = 0;
          for (let k = 0; k < bestIdx && k < shapePoints.length - 1; k++) {
            cumDist += haversineDistance(
              parseFloat(shapePoints[k].shape_pt_lat), parseFloat(shapePoints[k].shape_pt_lon),
              parseFloat(shapePoints[k + 1].shape_pt_lat), parseFloat(shapePoints[k + 1].shape_pt_lon)
            );
          }
          cumulativeDistances.push(Math.round(cumDist * 1000) / 1000);
        }
      }

      const distanceMiles = totalDistanceKm * 0.621371;

      await query(
        `INSERT INTO gtfs_route_distances
          (route_id, direction_id, distance_km, distance_miles, shape_id, stop_count, cumulative_distances, computed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
           distance_km = VALUES(distance_km),
           distance_miles = VALUES(distance_miles),
           shape_id = VALUES(shape_id),
           stop_count = VALUES(stop_count),
           cumulative_distances = VALUES(cumulative_distances),
           computed_at = NOW(),
           updated_at = NOW()`,
        [
          rd.routeId, rd.directionId,
          Math.round(totalDistanceKm * 10000) / 10000,
          Math.round(distanceMiles * 10000) / 10000,
          rd.shapeId,
          tripStops ? tripStops.length : 0,
          JSON.stringify(cumulativeDistances),
        ]
      );

      processed++;
    } catch (err) {
      errors++;
    }

    if (processed % 20 === 0 || processed + errors === total) {
      process.stdout.write(`\r   Routes: ${processed}/${total} computed (${errors} errors)`);
    }
  }

  console.log(`\n   Computed distances for ${processed} route-directions (${errors} errors)`);
}

async function printSummary() {
  console.log('\n=== Import Summary ===');

  const tables = [
    ['gtfs_routes', 'Routes'],
    ['gtfs_stops', 'Stops'],
    ['gtfs_trips', 'Trips'],
    ['gtfs_stop_times', 'Stop Times'],
    ['gtfs_shapes', 'Shape Points'],
    ['gtfs_route_distances', 'Route Distances'],
  ];

  for (const [table, label] of tables) {
    try {
      const result = await query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`   ${label}: ${result[0].count.toLocaleString()}`);
    } catch (err) {
      console.log(`   ${label}: ERROR - ${err.message}`);
    }
  }

  // Sample distance comparison
  try {
    const sample = await query(`
      SELECT rd.route_id, r.route_short_name, rd.direction_id,
             rd.distance_km, rd.distance_miles, rd.stop_count
      FROM gtfs_route_distances rd
      JOIN gtfs_routes r ON rd.route_id = r.route_id
      ORDER BY rd.distance_km DESC
      LIMIT 5
    `);
    if (sample.length > 0) {
      console.log('\n   Longest routes (by shape distance):');
      for (const row of sample) {
        console.log(`     Route ${row.route_short_name} dir${row.direction_id}: ${parseFloat(row.distance_miles).toFixed(1)} miles (${row.stop_count} stops)`);
      }
    }
  } catch (err) {
    // ignore
  }
}

async function main() {
  console.log('=========================================');
  console.log('  GTFS Full Import Script');
  console.log(`  Source: ${GTFS_DIR}`);
  console.log(`  Database: ${process.env.DB_NAME || 'gobarryco_breakdowns'}`);
  console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log('=========================================');

  const startTime = Date.now();

  try {
    await applyMigration();
    await truncateTables();
    await importRoutes();
    await importStops();
    await importTrips();
    await importStopTimes();
    await importShapes();
    await computeDistances();
    await printSummary();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ Import completed in ${elapsed}s`);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
