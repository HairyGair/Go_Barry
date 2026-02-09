/**
 * Admin GTFS Data Management Routes
 *
 * Handles uploading and managing GTFS transit data files:
 * - Routes (bus route definitions)
 * - Stops (bus stop locations)
 * - Trips (trip schedules)
 * - Stop Times (departure/arrival times)
 *
 * GTFS data is used for route matching, stop lookup, and navigation features
 *
 * @author Anthony Gair
 * @version 1.0.0
 */

import express from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { query, transaction } from '../config/mysql.js';
import { validate } from '../middleware/validationMiddleware.js';
import { activityLogger, ACTIVITY_TYPES, ACTOR_TYPES, ENTITY_TYPES, SEVERITY_LEVELS } from '../services/activityLogger.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max for large GTFS files
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Accept CSV and TXT files
    if (file.mimetype === 'text/csv' ||
        file.mimetype === 'text/plain' ||
        file.originalname.endsWith('.csv') ||
        file.originalname.endsWith('.txt')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV/TXT files are allowed'), false);
    }
  }
});

/**
 * Parse GTFS CSV file and validate structure
 * @param {Buffer} buffer - File buffer
 * @param {string} fileType - Type of GTFS file (routes, stops, trips, stop_times)
 * @returns {Object} - { valid, data, errors }
 */
function parseGTFSFile(buffer, fileType) {
  try {
    const records = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      bom: true
    });

    // Validate required columns per file type
    const requiredColumns = {
      routes: ['route_id', 'agency_id', 'route_short_name'],
      stops: ['stop_id', 'stop_name', 'stop_lat', 'stop_lon'],
      trips: ['trip_id', 'route_id', 'service_id'],
      stop_times: ['trip_id', 'stop_id', 'stop_sequence', 'arrival_time', 'departure_time'],
      shapes: ['shape_id', 'shape_pt_lat', 'shape_pt_lon', 'shape_pt_sequence']
    };

    if (records.length === 0) {
      return {
        valid: false,
        data: [],
        errors: ['File is empty'],
        recordCount: 0
      };
    }

    const firstRow = records[0];
    const required = requiredColumns[fileType] || [];
    const missingColumns = required.filter(col => !(col in firstRow));

    if (missingColumns.length > 0) {
      return {
        valid: false,
        data: [],
        errors: [`Missing required columns: ${missingColumns.join(', ')}`],
        recordCount: 0
      };
    }

    return {
      valid: true,
      data: records,
      errors: [],
      recordCount: records.length
    };
  } catch (error) {
    return {
      valid: false,
      data: [],
      errors: [error.message],
      recordCount: 0
    };
  }
}

/**
 * POST /api/admin/gtfs/routes
 * Import bus routes from GTFS routes.txt file
 */
router.post('/routes', upload.single('csvFile'), async (req, res) => {
  try {
    console.log('🚀 GTFS Routes import request received');
    console.log('   User:', req.user?.email);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
        message: 'Please upload a routes.txt file'
      });
    }

    console.log('📄 File received:', {
      originalName: req.file.originalname,
      size: req.file.size
    });

    // Parse GTFS routes file
    const parseResult = parseGTFSFile(req.file.buffer, 'routes');

    if (!parseResult.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid GTFS format',
        message: parseResult.errors[0],
        details: 'Ensure file contains: route_id, agency_id, route_short_name'
      });
    }

    console.log(`📊 Parsed ${parseResult.recordCount} routes`);

    // Import routes using transaction
    let successCount = 0;
    let updateCount = 0;
    const importErrors = [];

    try {
      await transaction(async (connection) => {
        for (const row of parseResult.data) {
          try {
            // Check if route exists
            const [existing] = await connection.execute(
              'SELECT route_id FROM gtfs_routes WHERE route_id = ?',
              [row.route_id]
            );

            if (existing.length > 0) {
              // Update existing route
              await connection.execute(
                `UPDATE gtfs_routes SET
                  agency_id = ?,
                  route_short_name = ?,
                  route_long_name = ?,
                  route_desc = ?,
                  route_type = ?,
                  route_url = ?,
                  route_color = ?,
                  route_text_color = ?,
                  updated_at = NOW()
                WHERE route_id = ?`,
                [
                  row.agency_id || null,
                  row.route_short_name || null,
                  row.route_long_name || null,
                  row.route_desc || null,
                  row.route_type || null,
                  row.route_url || null,
                  row.route_color || null,
                  row.route_text_color || null,
                  row.route_id
                ]
              );
              updateCount++;
            } else {
              // Insert new route
              await connection.execute(
                `INSERT INTO gtfs_routes
                (route_id, agency_id, route_short_name, route_long_name, route_desc,
                 route_type, route_url, route_color, route_text_color, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [
                  row.route_id,
                  row.agency_id || null,
                  row.route_short_name || null,
                  row.route_long_name || null,
                  row.route_desc || null,
                  row.route_type || null,
                  row.route_url || null,
                  row.route_color || null,
                  row.route_text_color || null
                ]
              );
              successCount++;
            }
          } catch (insertError) {
            console.error(`❌ Error importing route ${row.route_id}:`, insertError);
            importErrors.push({
              routeId: row.route_id,
              error: insertError.message
            });
          }
        }
      });

      console.log('✅ Routes import completed');
      console.log(`   New records: ${successCount}`);
      console.log(`   Updated records: ${updateCount}`);
      console.log(`   Failed: ${importErrors.length}`);

      // Log activity with WebSocket broadcast
      await activityLogger.logActivity({
        activityType: ACTIVITY_TYPES.GTFS_IMPORTED,
        action: `imported ${successCount} routes, updated ${updateCount}`,
        actorType: ACTOR_TYPES.ADMIN,
        actorId: req.user?.badge_number || 'ADMIN',
        actorName: req.user?.name || 'Admin',
        entityType: ENTITY_TYPES.GTFS,
        entityDetails: {
          file_type: 'routes',
          new_count: successCount,
          updated_count: updateCount,
          failed_count: importErrors.length,
          total_rows: parseResult.recordCount
        },
        severity: SEVERITY_LEVELS.SUCCESS,
        source: 'admin_panel',
        icon: '🗺️'
      });

      return res.json({
        success: true,
        message: 'Routes imported successfully',
        totalRows: parseResult.recordCount,
        successCount,
        updateCount,
        failureCount: importErrors.length,
        errors: importErrors.slice(0, 10) // Return first 10 errors
      });

    } catch (transactionError) {
      console.error('❌ Transaction error:', transactionError);
      return res.status(500).json({
        success: false,
        error: 'Database error',
        message: transactionError.message
      });
    }

  } catch (error) {
    console.error('❌ Routes import error:', error);
    return res.status(500).json({
      success: false,
      error: 'Import failed',
      message: error.message
    });
  }
});

/**
 * POST /api/admin/gtfs/stops
 * Import bus stops from GTFS stops.txt file
 */
router.post('/stops', upload.single('csvFile'), async (req, res) => {
  try {
    console.log('🚀 GTFS Stops import request received');

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
        message: 'Please upload a stops.txt file'
      });
    }

    const parseResult = parseGTFSFile(req.file.buffer, 'stops');

    if (!parseResult.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid GTFS format',
        message: parseResult.errors[0],
        details: 'Ensure file contains: stop_id, stop_name, stop_lat, stop_lon'
      });
    }

    console.log(`📊 Parsed ${parseResult.recordCount} stops`);

    let successCount = 0;
    let updateCount = 0;
    const importErrors = [];

    try {
      await transaction(async (connection) => {
        for (const row of parseResult.data) {
          try {
            const [existing] = await connection.execute(
              'SELECT stop_id FROM gtfs_stops WHERE stop_id = ?',
              [row.stop_id]
            );

            if (existing.length > 0) {
              await connection.execute(
                `UPDATE gtfs_stops SET
                  stop_code = ?,
                  stop_name = ?,
                  stop_lat = ?,
                  stop_lon = ?,
                  stop_desc = ?,
                  zone_id = ?,
                  wheelchair_boarding = ?,
                  updated_at = NOW()
                WHERE stop_id = ?`,
                [
                  row.stop_code || null,
                  row.stop_name || null,
                  parseFloat(row.stop_lat) || null,
                  parseFloat(row.stop_lon) || null,
                  row.stop_desc || null,
                  row.zone_id || null,
                  row.wheelchair_boarding || null,
                  row.stop_id
                ]
              );
              updateCount++;
            } else {
              await connection.execute(
                `INSERT INTO gtfs_stops
                (stop_id, stop_code, stop_name, stop_lat, stop_lon, stop_desc, zone_id, wheelchair_boarding, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [
                  row.stop_id,
                  row.stop_code || null,
                  row.stop_name || null,
                  parseFloat(row.stop_lat) || null,
                  parseFloat(row.stop_lon) || null,
                  row.stop_desc || null,
                  row.zone_id || null,
                  row.wheelchair_boarding || null
                ]
              );
              successCount++;
            }
          } catch (insertError) {
            importErrors.push({
              stopId: row.stop_id,
              error: insertError.message
            });
          }
        }
      });

      console.log('✅ Stops import completed');

      // Log activity with WebSocket broadcast
      await activityLogger.logActivity({
        activityType: ACTIVITY_TYPES.GTFS_IMPORTED,
        action: `imported ${successCount} stops, updated ${updateCount}`,
        actorType: ACTOR_TYPES.ADMIN,
        actorId: req.user?.badge_number || 'ADMIN',
        actorName: req.user?.name || 'Admin',
        entityType: ENTITY_TYPES.GTFS,
        entityDetails: {
          file_type: 'stops',
          new_count: successCount,
          updated_count: updateCount,
          failed_count: importErrors.length,
          total_rows: parseResult.recordCount
        },
        severity: SEVERITY_LEVELS.SUCCESS,
        source: 'admin_panel',
        icon: '📍'
      });

      return res.json({
        success: true,
        message: 'Stops imported successfully',
        totalRows: parseResult.recordCount,
        successCount,
        updateCount,
        failureCount: importErrors.length,
        errors: importErrors.slice(0, 10)
      });

    } catch (transactionError) {
      return res.status(500).json({
        success: false,
        error: 'Database error',
        message: transactionError.message
      });
    }

  } catch (error) {
    console.error('❌ Stops import error:', error);
    return res.status(500).json({
      success: false,
      error: 'Import failed',
      message: error.message
    });
  }
});

/**
 * POST /api/admin/gtfs/trips
 * Import trips from GTFS trips.txt file
 */
router.post('/trips', upload.single('csvFile'), async (req, res) => {
  try {
    console.log('🚀 GTFS Trips import request received');

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
        message: 'Please upload a trips.txt file'
      });
    }

    const parseResult = parseGTFSFile(req.file.buffer, 'trips');

    if (!parseResult.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid GTFS format',
        message: parseResult.errors[0]
      });
    }

    console.log(`📊 Parsed ${parseResult.recordCount} trips`);

    let successCount = 0;
    let updateCount = 0;
    const importErrors = [];

    try {
      await transaction(async (connection) => {
        for (const row of parseResult.data) {
          try {
            const [existing] = await connection.execute(
              'SELECT trip_id FROM gtfs_trips WHERE trip_id = ?',
              [row.trip_id]
            );

            if (existing.length > 0) {
              await connection.execute(
                `UPDATE gtfs_trips SET
                  route_id = ?,
                  service_id = ?,
                  trip_headsign = ?,
                  direction_id = ?,
                  shape_id = ?,
                  block_id = ?,
                  updated_at = NOW()
                WHERE trip_id = ?`,
                [
                  row.route_id || null,
                  row.service_id || null,
                  row.trip_headsign || null,
                  row.direction_id || null,
                  row.shape_id || null,
                  row.block_id || null,
                  row.trip_id
                ]
              );
              updateCount++;
            } else {
              await connection.execute(
                `INSERT INTO gtfs_trips
                (trip_id, route_id, service_id, trip_headsign, direction_id, shape_id, block_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [
                  row.trip_id,
                  row.route_id || null,
                  row.service_id || null,
                  row.trip_headsign || null,
                  row.direction_id || null,
                  row.shape_id || null,
                  row.block_id || null
                ]
              );
              successCount++;
            }
          } catch (insertError) {
            importErrors.push({
              tripId: row.trip_id,
              error: insertError.message
            });
          }
        }
      });

      console.log('✅ Trips import completed');

      // Log activity with WebSocket broadcast
      await activityLogger.logActivity({
        activityType: ACTIVITY_TYPES.GTFS_IMPORTED,
        action: `imported ${successCount} trips, updated ${updateCount}`,
        actorType: ACTOR_TYPES.ADMIN,
        actorId: req.user?.badge_number || 'ADMIN',
        actorName: req.user?.name || 'Admin',
        entityType: ENTITY_TYPES.GTFS,
        entityDetails: {
          file_type: 'trips',
          new_count: successCount,
          updated_count: updateCount,
          failed_count: importErrors.length,
          total_rows: parseResult.recordCount
        },
        severity: SEVERITY_LEVELS.SUCCESS,
        source: 'admin_panel',
        icon: '🚌'
      });

      return res.json({
        success: true,
        message: 'Trips imported successfully',
        totalRows: parseResult.recordCount,
        successCount,
        updateCount,
        failureCount: importErrors.length,
        errors: importErrors.slice(0, 10)
      });

    } catch (transactionError) {
      return res.status(500).json({
        success: false,
        error: 'Database error',
        message: transactionError.message
      });
    }

  } catch (error) {
    console.error('❌ Trips import error:', error);
    return res.status(500).json({
      success: false,
      error: 'Import failed',
      message: error.message
    });
  }
});

/**
 * POST /api/admin/gtfs/stop-times
 * Import stop times from GTFS stop_times.txt file
 * WARNING: This is a large file (46MB+) - import may take several minutes
 */
router.post('/stop-times', upload.single('csvFile'), async (req, res) => {
  try {
    console.log('🚀 GTFS Stop Times import request received');
    console.log('   WARNING: This operation may take several minutes');

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
        message: 'Please upload a stop_times.txt file'
      });
    }

    console.log(`📄 Parsing ${(req.file.size / (1024 * 1024)).toFixed(2)}MB file...`);

    const parseResult = parseGTFSFile(req.file.buffer, 'stop_times');

    if (!parseResult.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid GTFS format',
        message: parseResult.errors[0]
      });
    }

    console.log(`📊 Parsed ${parseResult.recordCount} stop times - Beginning optimized batch import...`);

    let successCount = 0;
    const importErrors = [];
    const batchSize = 5000; // Larger batches for bulk INSERT

    try {
      // Optimized batch insert using INSERT ON DUPLICATE KEY UPDATE
      for (let i = 0; i < parseResult.data.length; i += batchSize) {
        const batch = parseResult.data.slice(i, i + batchSize);

        // Build a single bulk INSERT statement with ON DUPLICATE KEY UPDATE
        // This is MUCH faster than individual SELECTs + INSERTs/UPDATEs
        const values = [];
        const placeholders = [];

        for (const row of batch) {
          placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())');
          values.push(
            row.trip_id,
            row.stop_id,
            row.stop_sequence,
            row.arrival_time || null,
            row.departure_time || null,
            row.stop_headsign || null,
            row.pickup_type || null,
            row.drop_off_type || null
          );
        }

        try {
          await query(
            `INSERT INTO gtfs_stop_times
            (trip_id, stop_id, stop_sequence, arrival_time, departure_time,
             stop_headsign, pickup_type, drop_off_type, created_at, updated_at)
            VALUES ${placeholders.join(',')}
            ON DUPLICATE KEY UPDATE
              arrival_time = VALUES(arrival_time),
              departure_time = VALUES(departure_time),
              stop_headsign = VALUES(stop_headsign),
              pickup_type = VALUES(pickup_type),
              drop_off_type = VALUES(drop_off_type),
              updated_at = NOW()`,
            values
          );

          successCount += batch.length;
        } catch (batchError) {
          // If bulk insert fails, log error but continue
          console.error(`   Error importing batch ${i / batchSize}:`, batchError.message);
          importErrors.push({
            batchNumber: Math.floor(i / batchSize),
            batchSize: batch.length,
            error: batchError.message
          });
        }

        // Log progress every 5 batches
        const progressPercent = Math.round(((i + batchSize) / parseResult.data.length) * 100);
        console.log(`   Progress: ${progressPercent}% (${Math.min(i + batchSize, parseResult.data.length)} / ${parseResult.recordCount})`);
      }

      console.log('✅ Stop times import completed');

      // Log activity with WebSocket broadcast
      await activityLogger.logActivity({
        activityType: ACTIVITY_TYPES.GTFS_IMPORTED,
        action: `imported ${successCount} stop times`,
        actorType: ACTOR_TYPES.ADMIN,
        actorId: req.user?.badge_number || 'ADMIN',
        actorName: req.user?.name || 'Admin',
        entityType: ENTITY_TYPES.GTFS,
        entityDetails: {
          file_type: 'stop_times',
          processed_count: successCount,
          failed_count: importErrors.length,
          total_rows: parseResult.recordCount
        },
        severity: SEVERITY_LEVELS.SUCCESS,
        source: 'admin_panel',
        icon: '⏱️'
      });

      return res.json({
        success: true,
        message: 'Stop times imported successfully',
        totalRows: parseResult.recordCount,
        processedCount: successCount,
        failureCount: importErrors.length,
        errors: importErrors.slice(0, 5),
        note: 'Large stop times imports use optimized batch INSERT ON DUPLICATE KEY UPDATE for performance'
      });

    } catch (batchImportError) {
      console.error('❌ Batch import error:', batchImportError);
      return res.status(500).json({
        success: false,
        error: 'Batch import failed',
        message: batchImportError.message,
        processedCount: successCount
      });
    }

  } catch (error) {
    console.error('❌ Stop times import error:', error);
    return res.status(500).json({
      success: false,
      error: 'Import failed',
      message: error.message
    });
  }
});

/**
 * POST /api/admin/gtfs/shapes
 * Import shape points from GTFS shapes.txt file
 * Uses batch INSERT ON DUPLICATE KEY UPDATE for performance (like stop_times)
 */
router.post('/shapes', upload.single('csvFile'), async (req, res) => {
  try {
    console.log('🚀 GTFS Shapes import request received');

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
        message: 'Please upload a shapes.txt file'
      });
    }

    console.log(`📄 Parsing ${(req.file.size / (1024 * 1024)).toFixed(2)}MB file...`);

    const parseResult = parseGTFSFile(req.file.buffer, 'shapes');

    if (!parseResult.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid GTFS format',
        message: parseResult.errors[0],
        details: 'Ensure file contains: shape_id, shape_pt_lat, shape_pt_lon, shape_pt_sequence'
      });
    }

    console.log(`📊 Parsed ${parseResult.recordCount} shape points - Beginning batch import...`);

    let successCount = 0;
    const importErrors = [];
    const batchSize = 5000;

    try {
      for (let i = 0; i < parseResult.data.length; i += batchSize) {
        const batch = parseResult.data.slice(i, i + batchSize);

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

        try {
          await query(
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

          successCount += batch.length;
        } catch (batchError) {
          console.error(`   Error importing batch ${i / batchSize}:`, batchError.message);
          importErrors.push({
            batchNumber: Math.floor(i / batchSize),
            batchSize: batch.length,
            error: batchError.message
          });
        }

        const progressPercent = Math.round(((i + batchSize) / parseResult.data.length) * 100);
        console.log(`   Progress: ${progressPercent}% (${Math.min(i + batchSize, parseResult.data.length)} / ${parseResult.recordCount})`);
      }

      console.log('✅ Shapes import completed');

      await activityLogger.logActivity({
        activityType: ACTIVITY_TYPES.GTFS_IMPORTED,
        action: `imported ${successCount} shape points`,
        actorType: ACTOR_TYPES.ADMIN,
        actorId: req.user?.badge_number || 'ADMIN',
        actorName: req.user?.name || 'Admin',
        entityType: ENTITY_TYPES.GTFS,
        entityDetails: {
          file_type: 'shapes',
          processed_count: successCount,
          failed_count: importErrors.length,
          total_rows: parseResult.recordCount
        },
        severity: SEVERITY_LEVELS.SUCCESS,
        source: 'admin_panel',
        icon: '📐'
      });

      return res.json({
        success: true,
        message: 'Shapes imported successfully',
        totalRows: parseResult.recordCount,
        processedCount: successCount,
        failureCount: importErrors.length,
        errors: importErrors.slice(0, 5)
      });

    } catch (batchImportError) {
      console.error('❌ Batch import error:', batchImportError);
      return res.status(500).json({
        success: false,
        error: 'Batch import failed',
        message: batchImportError.message,
        processedCount: successCount
      });
    }

  } catch (error) {
    console.error('❌ Shapes import error:', error);
    return res.status(500).json({
      success: false,
      error: 'Import failed',
      message: error.message
    });
  }
});

/**
 * Haversine distance helper (local to this module for compute-distances)
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => deg * (Math.PI / 180);
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371 * c; // km
}

/**
 * POST /api/admin/gtfs/compute-distances
 * Compute route distances from shape data and cache in gtfs_route_distances.
 * Must be run after importing shapes.txt and trips.txt (with shape_id).
 */
router.post('/compute-distances', async (req, res) => {
  try {
    console.log('🚀 Computing route distances from shapes...');

    // Get all routes with their trips and shape_ids
    const routeTrips = await query(`
      SELECT DISTINCT
        r.route_id,
        r.route_short_name,
        t.direction_id,
        t.shape_id,
        t.trip_id
      FROM gtfs_routes r
      INNER JOIN gtfs_trips t ON r.route_id = t.route_id
      WHERE t.shape_id IS NOT NULL
      ORDER BY r.route_id, t.direction_id
    `);

    if (!routeTrips || routeTrips.length === 0) {
      return res.json({
        success: false,
        error: 'No routes with shape_id found. Import trips.txt with shape_id column first.',
        routesProcessed: 0
      });
    }

    // Group by route + direction, pick one shape_id per group
    const routeDirections = {};
    for (const rt of routeTrips) {
      const key = `${rt.route_id}_${rt.direction_id ?? 0}`;
      if (!routeDirections[key]) {
        routeDirections[key] = {
          routeId: rt.route_id,
          directionId: rt.direction_id ?? 0,
          shapeId: rt.shape_id,
          tripId: rt.trip_id
        };
      }
    }

    let processedCount = 0;
    let errorCount = 0;
    const results = [];

    for (const rd of Object.values(routeDirections)) {
      try {
        // Get shape points ordered by sequence
        const shapePoints = await query(`
          SELECT shape_pt_lat, shape_pt_lon, shape_pt_sequence
          FROM gtfs_shapes
          WHERE shape_id = ?
          ORDER BY shape_pt_sequence
        `, [rd.shapeId]);

        if (!shapePoints || shapePoints.length < 2) {
          errorCount++;
          continue;
        }

        // Sum Haversine distances between consecutive shape points
        let totalDistanceKm = 0;
        for (let i = 0; i < shapePoints.length - 1; i++) {
          totalDistanceKm += haversineDistance(
            parseFloat(shapePoints[i].shape_pt_lat),
            parseFloat(shapePoints[i].shape_pt_lon),
            parseFloat(shapePoints[i + 1].shape_pt_lat),
            parseFloat(shapePoints[i + 1].shape_pt_lon)
          );
        }

        // Get stops for this trip to compute cumulative distances
        const tripStops = await query(`
          SELECT s.stop_lat, s.stop_lon, st.stop_sequence
          FROM gtfs_stop_times st
          INNER JOIN gtfs_stops s ON st.stop_id = s.stop_id
          WHERE st.trip_id = ?
          ORDER BY st.stop_sequence
        `, [rd.tripId]);

        // Project each stop onto the shape to get cumulative distance
        const cumulativeDistances = [];
        if (tripStops && tripStops.length > 0) {
          for (const stop of tripStops) {
            // Find the closest shape point to this stop
            let minDist = Infinity;
            let bestShapeIdx = 0;
            for (let j = 0; j < shapePoints.length; j++) {
              const d = haversineDistance(
                parseFloat(stop.stop_lat), parseFloat(stop.stop_lon),
                parseFloat(shapePoints[j].shape_pt_lat), parseFloat(shapePoints[j].shape_pt_lon)
              );
              if (d < minDist) {
                minDist = d;
                bestShapeIdx = j;
              }
            }
            // Cumulative distance along shape up to this shape point
            let cumDist = 0;
            for (let k = 0; k < bestShapeIdx && k < shapePoints.length - 1; k++) {
              cumDist += haversineDistance(
                parseFloat(shapePoints[k].shape_pt_lat),
                parseFloat(shapePoints[k].shape_pt_lon),
                parseFloat(shapePoints[k + 1].shape_pt_lat),
                parseFloat(shapePoints[k + 1].shape_pt_lon)
              );
            }
            cumulativeDistances.push(Math.round(cumDist * 1000) / 1000);
          }
        }

        const distanceMiles = totalDistanceKm * 0.621371;

        // Upsert into gtfs_route_distances
        await query(`
          INSERT INTO gtfs_route_distances
            (route_id, direction_id, distance_km, distance_miles, shape_id, stop_count, cumulative_distances, computed_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
          ON DUPLICATE KEY UPDATE
            distance_km = VALUES(distance_km),
            distance_miles = VALUES(distance_miles),
            shape_id = VALUES(shape_id),
            stop_count = VALUES(stop_count),
            cumulative_distances = VALUES(cumulative_distances),
            computed_at = NOW(),
            updated_at = NOW()
        `, [
          rd.routeId,
          rd.directionId,
          Math.round(totalDistanceKm * 10000) / 10000,
          Math.round(distanceMiles * 10000) / 10000,
          rd.shapeId,
          tripStops ? tripStops.length : 0,
          JSON.stringify(cumulativeDistances)
        ]);

        processedCount++;
        results.push({
          routeId: rd.routeId,
          directionId: rd.directionId,
          distanceKm: Math.round(totalDistanceKm * 100) / 100,
          distanceMiles: Math.round(distanceMiles * 100) / 100,
          shapePoints: shapePoints.length,
          stops: tripStops ? tripStops.length : 0
        });

      } catch (routeError) {
        console.error(`Error computing distance for route ${rd.routeId} dir ${rd.directionId}:`, routeError.message);
        errorCount++;
      }
    }

    console.log(`✅ Route distances computed: ${processedCount} succeeded, ${errorCount} failed`);

    await activityLogger.logActivity({
      activityType: ACTIVITY_TYPES.GTFS_IMPORTED,
      action: `computed ${processedCount} route distances from shapes`,
      actorType: ACTOR_TYPES.ADMIN,
      actorId: req.user?.badge_number || 'ADMIN',
      actorName: req.user?.name || 'Admin',
      entityType: ENTITY_TYPES.GTFS,
      entityDetails: {
        operation: 'compute_distances',
        processed: processedCount,
        errors: errorCount
      },
      severity: SEVERITY_LEVELS.SUCCESS,
      source: 'admin_panel',
      icon: '📏'
    });

    return res.json({
      success: true,
      message: `Computed distances for ${processedCount} route-directions`,
      routesProcessed: processedCount,
      errors: errorCount,
      totalRouteDirections: Object.keys(routeDirections).length,
      sampleResults: results.slice(0, 20)
    });

  } catch (error) {
    console.error('❌ Compute distances error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to compute distances',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/gtfs/stats
 * Get statistics on imported GTFS data
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = {};

    // Count routes
    const [routeCount] = await query('SELECT COUNT(*) as count FROM gtfs_routes');
    stats.routes = routeCount.count;

    // Count stops
    const [stopCount] = await query('SELECT COUNT(*) as count FROM gtfs_stops');
    stats.stops = stopCount.count;

    // Count trips
    const [tripCount] = await query('SELECT COUNT(*) as count FROM gtfs_trips');
    stats.trips = tripCount.count;

    // Count stop times
    const [stopTimeCount] = await query('SELECT COUNT(*) as count FROM gtfs_stop_times');
    stats.stopTimes = stopTimeCount.count;

    // Count shapes (with graceful handling if table doesn't exist yet)
    try {
      const [shapeCount] = await query('SELECT COUNT(*) as count FROM gtfs_shapes');
      stats.shapes = shapeCount.count;
    } catch (e) {
      stats.shapes = 0;
    }

    // Count cached route distances
    try {
      const [distCount] = await query('SELECT COUNT(*) as count FROM gtfs_route_distances');
      stats.routeDistances = distCount.count;
    } catch (e) {
      stats.routeDistances = 0;
    }

    // Last import times
    const [routeUpdate] = await query('SELECT MAX(updated_at) as lastUpdate FROM gtfs_routes');
    stats.routesLastUpdated = routeUpdate.lastUpdate;

    const [stopUpdate] = await query('SELECT MAX(updated_at) as lastUpdate FROM gtfs_stops');
    stats.stopsLastUpdated = stopUpdate.lastUpdate;

    const [tripUpdate] = await query('SELECT MAX(updated_at) as lastUpdate FROM gtfs_trips');
    stats.tripsLastUpdated = tripUpdate.lastUpdate;

    const [stopTimeUpdate] = await query('SELECT MAX(updated_at) as lastUpdate FROM gtfs_stop_times');
    stats.stopTimesLastUpdated = stopTimeUpdate.lastUpdate;

    try {
      const [shapeUpdate] = await query('SELECT MAX(updated_at) as lastUpdate FROM gtfs_shapes');
      stats.shapesLastUpdated = shapeUpdate.lastUpdate;
    } catch (e) {
      stats.shapesLastUpdated = null;
    }

    res.json({
      success: true,
      stats,
      message: 'GTFS data statistics'
    });

  } catch (error) {
    console.error('❌ Error fetching GTFS stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

export default router;
