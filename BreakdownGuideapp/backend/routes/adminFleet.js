/**
 * Admin Fleet Management Routes
 *
 * CSV Import endpoint for bulk fleet vehicle data management
 * Admin-only access with comprehensive validation and error reporting
 *
 * @author Anthony Gair
 * @version 1.0.0
 */

import express from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { authenticateAdmin } from '../middleware/authMiddleware.js';
import { query, transaction } from '../config/mysql.js';
import { validate } from '../middleware/validationMiddleware.js';
import Joi from 'joi';
import { activityLogger, ACTIVITY_TYPES, ACTOR_TYPES, ENTITY_TYPES, SEVERITY_LEVELS } from '../services/activityLogger.js';

const router = express.Router();

// Configure multer for CSV file uploads
// Memory storage for direct processing (no disk writes)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 1 // Single file only
  },
  fileFilter: (req, file, cb) => {
    // Validate file extension
    if (file.mimetype === 'text/csv' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Validation schema for CSV import endpoint
const csvImportSchema = {
  // No body validation needed - file upload handled by multer
  // File presence validated in route handler
};

/**
 * Validate a single fleet vehicle row
 * @param {Object} row - CSV row data
 * @param {number} rowNumber - Row number for error reporting
 * @returns {Object} - { valid: boolean, errors: string[], data: Object }
 */
function validateFleetRow(row, rowNumber) {
  const errors = [];
  const data = {};

  // Required: FleetNo (must be unique)
  const fleetNo = row.FleetNo?.toString().trim();
  if (!fleetNo) {
    errors.push(`Row ${rowNumber}: FleetNo is required`);
  } else if (fleetNo.length > 50) {
    errors.push(`Row ${rowNumber}: FleetNo exceeds 50 characters`);
  } else {
    data.fleet_no = fleetNo;
  }

  // Optional: RegNumber
  const regNumber = row.RegNumber?.toString().trim();
  if (regNumber) {
    if (regNumber.length > 50) {
      errors.push(`Row ${rowNumber}: RegNumber exceeds 50 characters`);
    } else {
      data.registration = regNumber;
    }
  } else {
    data.registration = null;
  }

  // Optional: OperatingDepotCode
  const depotCode = row.OperatingDepotCode?.toString().trim();
  if (depotCode) {
    if (depotCode.length > 100) {
      errors.push(`Row ${rowNumber}: OperatingDepotCode exceeds 100 characters`);
    } else {
      data.depot = depotCode;
    }
  } else {
    data.depot = null;
  }

  // Optional: VehicleType Equinox
  const vehicleType = row['VehicleType Equinox']?.toString().trim();
  if (vehicleType) {
    if (vehicleType.length > 100) {
      errors.push(`Row ${rowNumber}: VehicleType Equinox exceeds 100 characters`);
    } else {
      data.vehicle_type = vehicleType;
    }
  } else {
    data.vehicle_type = null;
  }

  return {
    valid: errors.length === 0,
    errors,
    data
  };
}

/**
 * POST /api/admin/fleet/import-csv
 *
 * Import fleet vehicles from CSV file
 *
 * Required CSV columns:
 * - FleetNo (required, unique)
 * - RegNumber (optional)
 * - OperatingDepotCode (optional)
 * - VehicleType Equinox (optional)
 *
 * Returns:
 * - totalRows: Total rows in CSV (excluding header)
 * - successCount: Successfully imported
 * - failureCount: Failed imports
 * - errors: Array of error details
 * - warnings: Array of warnings (duplicates, etc.)
 */
router.post(
  '/import-csv',
  authenticateAdmin,
  upload.single('csvFile'),
  async (req, res) => {
    try {
      console.log('🚀 Fleet CSV import request received');
      console.log('   User:', req.user?.email);
      console.log('   Role:', req.user?.role);

      // Validate file upload
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No CSV file provided',
          message: 'Please upload a CSV file'
        });
      }

      console.log('📄 File received:', {
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });

      // Parse CSV data
      let records;
      try {
        records = parse(req.file.buffer, {
          columns: true, // Use first row as column names
          skip_empty_lines: true,
          trim: true,
          relax_column_count: true, // Allow inconsistent column counts
          bom: true // Handle UTF-8 BOM
        });
      } catch (parseError) {
        console.error('❌ CSV parsing error:', parseError);
        return res.status(400).json({
          success: false,
          error: 'Failed to parse CSV file',
          message: parseError.message,
          details: 'Please ensure the file is a valid CSV format'
        });
      }

      console.log(`📊 Parsed ${records.length} rows from CSV`);

      // Validate CSV has required columns
      if (records.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'CSV file is empty',
          message: 'The CSV file contains no data rows'
        });
      }

      const firstRow = records[0];
      const hasFleetNo = 'FleetNo' in firstRow;

      if (!hasFleetNo) {
        return res.status(400).json({
          success: false,
          error: 'Invalid CSV structure',
          message: 'CSV must contain a "FleetNo" column',
          receivedColumns: Object.keys(firstRow)
        });
      }

      // Validate and prepare data
      const validRows = [];
      const failedRows = [];
      const warnings = [];

      for (let i = 0; i < records.length; i++) {
        const rowNumber = i + 2; // +2 because header is row 1, data starts at row 2
        const validation = validateFleetRow(records[i], rowNumber);

        if (validation.valid) {
          validRows.push({
            rowNumber,
            data: validation.data
          });
        } else {
          failedRows.push({
            rowNumber,
            originalData: records[i],
            errors: validation.errors
          });
        }
      }

      console.log(`✅ Valid rows: ${validRows.length}`);
      console.log(`❌ Failed rows: ${failedRows.length}`);

      // Check for duplicate FleetNo within CSV
      const fleetNumbers = validRows.map(r => r.data.fleet_no);
      const duplicatesInCSV = fleetNumbers.filter((item, index) =>
        fleetNumbers.indexOf(item) !== index
      );

      if (duplicatesInCSV.length > 0) {
        warnings.push({
          type: 'duplicate_in_csv',
          message: `Found ${duplicatesInCSV.length} duplicate FleetNo values in CSV`,
          fleetNumbers: [...new Set(duplicatesInCSV)]
        });
      }

      // If no valid rows, return early
      if (validRows.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid rows to import',
          message: 'All rows in the CSV failed validation',
          totalRows: records.length,
          successCount: 0,
          failureCount: failedRows.length,
          errors: failedRows,
          warnings
        });
      }

      // Import valid rows using transaction
      let successCount = 0;
      let duplicateCount = 0;
      const importErrors = [];

      try {
        await transaction(async (connection) => {
          for (const row of validRows) {
            try {
              // Check if fleet_no already exists
              const [existing] = await connection.execute(
                'SELECT fleet_no FROM fleet_vehicles WHERE fleet_no = ?',
                [row.data.fleet_no]
              );

              if (existing.length > 0) {
                // Fleet number exists - update instead of insert
                const updateFields = [];
                const updateValues = [];

                if (row.data.registration !== undefined) {
                  updateFields.push('registration = ?');
                  updateValues.push(row.data.registration);
                }
                if (row.data.depot !== undefined) {
                  updateFields.push('depot = ?');
                  updateValues.push(row.data.depot);
                }
                if (row.data.vehicle_type !== undefined) {
                  updateFields.push('vehicle_type = ?');
                  updateValues.push(row.data.vehicle_type);
                }

                updateFields.push('updated_at = NOW()');

                if (updateFields.length > 0) {
                  const updateSql = `
                    UPDATE fleet_vehicles
                    SET ${updateFields.join(', ')}
                    WHERE fleet_no = ?
                  `;

                  updateValues.push(row.data.fleet_no);
                  await connection.execute(updateSql, updateValues);
                }

                duplicateCount++;
                warnings.push({
                  type: 'duplicate_updated',
                  fleetNo: row.data.fleet_no,
                  rowNumber: row.rowNumber,
                  message: `Fleet ${row.data.fleet_no} already exists - updated existing record`
                });
              } else {
                // Insert new fleet vehicle
                const insertSql = `
                  INSERT INTO fleet_vehicles
                  (fleet_no, registration, depot, vehicle_type, created_at, updated_at)
                  VALUES (?, ?, ?, ?, NOW(), NOW())
                `;

                await connection.execute(insertSql, [
                  row.data.fleet_no,
                  row.data.registration,
                  row.data.depot,
                  row.data.vehicle_type
                ]);

                successCount++;
              }
            } catch (insertError) {
              console.error(`❌ Error importing row ${row.rowNumber}:`, insertError);
              importErrors.push({
                rowNumber: row.rowNumber,
                fleetNo: row.data.fleet_no,
                error: insertError.message
              });
            }
          }
        });

        console.log('✅ Import completed successfully');
        console.log(`   New records: ${successCount}`);
        console.log(`   Updated records: ${duplicateCount}`);
        console.log(`   Failed: ${failedRows.length + importErrors.length}`);

        // Log activity with WebSocket broadcast
        try {
          await activityLogger.logActivity({
            activityType: ACTIVITY_TYPES.FLEET_IMPORTED,
            action: `imported ${successCount} new vehicles, updated ${duplicateCount} existing`,
            actorType: ACTOR_TYPES.ADMIN,
            actorId: req.user.badge_number,
            actorName: req.user.name,
            entityType: ENTITY_TYPES.FLEET,
            entityDetails: {
              new_count: successCount,
              updated_count: duplicateCount,
              failed_count: failedRows.length + importErrors.length,
              total_rows: records.length,
              filename: req.file?.originalname
            },
            severity: SEVERITY_LEVELS.SUCCESS,
            source: 'admin_panel',
            icon: '📦'
          });
        } catch (activityError) {
          console.error('Failed to log activity:', activityError);
        }

        // Return results
        return res.json({
          success: true,
          message: `Successfully processed ${validRows.length} rows`,
          totalRows: records.length,
          successCount: successCount,
          updatedCount: duplicateCount,
          failureCount: failedRows.length + importErrors.length,
          errors: [...failedRows, ...importErrors],
          warnings
        });

      } catch (transactionError) {
        console.error('❌ Transaction failed:', transactionError);
        return res.status(500).json({
          success: false,
          error: 'Database transaction failed',
          message: transactionError.message,
          details: 'Import was rolled back. No changes were made to the database.'
        });
      }

    } catch (error) {
      console.error('❌ Fleet CSV import error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to import fleet CSV',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

/**
 * GET /api/admin/fleet/import-template
 *
 * Download CSV template file for fleet imports
 */
router.get('/import-template', authenticateAdmin, (req, res) => {
  const template = `FleetNo,RegNumber,OperatingDepotCode,VehicleType Equinox
6377,NK19ABC,Washington,Streetlite
6378,NK19ABD,Washington,Streetlite
6379,NK19ABE,Riverside,Streetdeck
6380,NK19ABF,Consett,Versa`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="fleet_import_template.csv"');
  res.send(template);
});

export default router;
