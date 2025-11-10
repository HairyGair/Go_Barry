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
      stop_times: ['trip_id', 'stop_id', 'stop_sequence', 'arrival_time', 'departure_time']
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
                  updated_at = NOW()
                WHERE trip_id = ?`,
                [
                  row.route_id || null,
                  row.service_id || null,
                  row.trip_headsign || null,
                  row.direction_id || null,
                  row.trip_id
                ]
              );
              updateCount++;
            } else {
              await connection.execute(
                `INSERT INTO gtfs_trips
                (trip_id, route_id, service_id, trip_headsign, direction_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
                [
                  row.trip_id,
                  row.route_id || null,
                  row.service_id || null,
                  row.trip_headsign || null,
                  row.direction_id || null
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

    console.log(`📊 Parsed ${parseResult.recordCount} stop times - Beginning import...`);

    let successCount = 0;
    let updateCount = 0;
    const importErrors = [];
    const batchSize = 1000;

    try {
      // Batch insert for performance
      for (let i = 0; i < parseResult.data.length; i += batchSize) {
        const batch = parseResult.data.slice(i, i + batchSize);

        await transaction(async (connection) => {
          for (const row of batch) {
            try {
              const [existing] = await connection.execute(
                'SELECT trip_id FROM gtfs_stop_times WHERE trip_id = ? AND stop_id = ? AND stop_sequence = ?',
                [row.trip_id, row.stop_id, row.stop_sequence]
              );

              if (existing.length > 0) {
                await connection.execute(
                  `UPDATE gtfs_stop_times SET
                    arrival_time = ?,
                    departure_time = ?,
                    stop_headsign = ?,
                    pickup_type = ?,
                    drop_off_type = ?,
                    updated_at = NOW()
                  WHERE trip_id = ? AND stop_id = ? AND stop_sequence = ?`,
                  [
                    row.arrival_time || null,
                    row.departure_time || null,
                    row.stop_headsign || null,
                    row.pickup_type || null,
                    row.drop_off_type || null,
                    row.trip_id,
                    row.stop_id,
                    row.stop_sequence
                  ]
                );
                updateCount++;
              } else {
                await connection.execute(
                  `INSERT INTO gtfs_stop_times
                  (trip_id, stop_id, stop_sequence, arrival_time, departure_time,
                   stop_headsign, pickup_type, drop_off_type, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                  [
                    row.trip_id,
                    row.stop_id,
                    row.stop_sequence,
                    row.arrival_time || null,
                    row.departure_time || null,
                    row.stop_headsign || null,
                    row.pickup_type || null,
                    row.drop_off_type || null
                  ]
                );
                successCount++;
              }
            } catch (insertError) {
              importErrors.push({
                tripId: row.trip_id,
                stopId: row.stop_id,
                error: insertError.message
              });
            }
          }
        });

        // Log progress every 10 batches
        if ((i / batchSize) % 10 === 0) {
          console.log(`   Progress: ${Math.min(i + batchSize, parseResult.data.length)} / ${parseResult.recordCount}`);
        }
      }

      console.log('✅ Stop times import completed');
      return res.json({
        success: true,
        message: 'Stop times imported successfully',
        totalRows: parseResult.recordCount,
        successCount,
        updateCount,
        failureCount: importErrors.length,
        errors: importErrors.slice(0, 10),
        note: 'Large stop times imports may take several minutes to complete'
      });

    } catch (transactionError) {
      return res.status(500).json({
        success: false,
        error: 'Database error',
        message: transactionError.message
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
 * GET /api/admin/gtfs/stats
 * Get statistics on imported GTFS data
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = {};

    // Count routes
    const [routeCount] = await query('SELECT COUNT(*) as count FROM gtfs_routes');
    stats.routes = routeCount[0].count;

    // Count stops
    const [stopCount] = await query('SELECT COUNT(*) as count FROM gtfs_stops');
    stats.stops = stopCount[0].count;

    // Count trips
    const [tripCount] = await query('SELECT COUNT(*) as count FROM gtfs_trips');
    stats.trips = tripCount[0].count;

    // Count stop times
    const [stopTimeCount] = await query('SELECT COUNT(*) as count FROM gtfs_stop_times');
    stats.stopTimes = stopTimeCount[0].count;

    // Last import times
    const [routeUpdate] = await query('SELECT MAX(updated_at) as lastUpdate FROM gtfs_routes');
    stats.routesLastUpdated = routeUpdate[0].lastUpdate;

    const [stopUpdate] = await query('SELECT MAX(updated_at) as lastUpdate FROM gtfs_stops');
    stats.stopsLastUpdated = stopUpdate[0].lastUpdate;

    const [tripUpdate] = await query('SELECT MAX(updated_at) as lastUpdate FROM gtfs_trips');
    stats.tripsLastUpdated = tripUpdate[0].lastUpdate;

    const [stopTimeUpdate] = await query('SELECT MAX(updated_at) as lastUpdate FROM gtfs_stop_times');
    stats.stopTimesLastUpdated = stopTimeUpdate[0].lastUpdate;

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
