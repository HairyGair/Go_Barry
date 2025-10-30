/**
 * Supabase to cPanel Database Migration Script
 *
 * =============================================================================
 * USAGE INSTRUCTIONS
 * =============================================================================
 *
 * This script exports data from Supabase and generates SQL files ready for
 * import into cPanel MySQL/PostgreSQL databases.
 *
 * PREREQUISITES:
 * --------------
 * 1. Node.js 18+ installed
 * 2. Environment variables set in backend/.env:
 *    - SUPABASE_URL
 *    - SUPABASE_ANON_KEY or SUPABASE_SERVICE_KEY (service key recommended)
 *
 * BASIC USAGE:
 * ------------
 * # Export all tables
 * node backend/scripts/migrate-supabase-to-cpanel.js
 *
 * # Export specific tables only
 * node backend/scripts/migrate-supabase-to-cpanel.js --tables=supervisors,breakdowns
 *
 * # Limit records per table (for testing)
 * node backend/scripts/migrate-supabase-to-cpanel.js --limit=100
 *
 * # Skip specific tables
 * node backend/scripts/migrate-supabase-to-cpanel.js --skip=engineers,activities
 *
 * # Generate PostgreSQL-compatible SQL (default is MySQL)
 * node backend/scripts/migrate-supabase-to-cpanel.js --format=postgres
 *
 * # Dry run (show what would be exported without creating files)
 * node backend/scripts/migrate-supabase-to-cpanel.js --dry-run
 *
 * OUTPUT FILES:
 * -------------
 * The script generates three files in backend/scripts/migrations/:
 *
 * 1. migration-data-[timestamp].sql
 *    - SQL INSERT statements ready for import
 *    - Can be imported via phpMyAdmin or command line
 *
 * 2. migration-data-[timestamp].json
 *    - JSON backup of all exported data
 *    - Useful for custom import scripts or verification
 *
 * 3. migration-report-[timestamp].txt
 *    - Detailed report of migration results
 *    - Record counts, errors, and recommendations
 *
 * HOW TO IMPORT INTO CPANEL:
 * --------------------------
 * METHOD 1 - phpMyAdmin (recommended for smaller databases):
 *   1. Log into cPanel
 *   2. Open phpMyAdmin
 *   3. Select your database
 *   4. Click "Import" tab
 *   5. Choose the .sql file
 *   6. Click "Go"
 *
 * METHOD 2 - Command Line (recommended for larger databases):
 *   mysql -u username -p database_name < migration-data-[timestamp].sql
 *
 * METHOD 3 - PostgreSQL Command Line:
 *   psql -U username -d database_name -f migration-data-[timestamp].sql
 *
 * IMPORTANT NOTES:
 * ----------------
 * - Always backup your existing database before importing
 * - Test import on a staging database first
 * - Review the migration report for any warnings or errors
 * - Large databases may need to be split into smaller chunks
 * - Ensure target database has sufficient storage space
 *
 * =============================================================================
 *
 * @author Anthony Gair
 * @version 1.0.0
 * @license Proprietary - Go North East
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

// Configuration
const TABLES_TO_EXPORT = [
  'supervisors',
  'breakdowns',
  'engineers',
  'wizard_progress',
  'fleet_vehicles',
  'user_preferences',
  'notification_preferences',
  'activities'
];

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    tables: null,
    skip: [],
    limit: null,
    format: 'mysql', // mysql or postgres
    dryRun: false
  };

  args.forEach(arg => {
    if (arg.startsWith('--tables=')) {
      options.tables = arg.split('=')[1].split(',');
    } else if (arg.startsWith('--skip=')) {
      options.skip = arg.split('=')[1].split(',');
    } else if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--format=')) {
      options.format = arg.split('=')[1];
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    }
  });

  return options;
}

// Initialize Supabase client
function initializeSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY/SUPABASE_ANON_KEY must be set in .env');
    process.exit(1);
  }

  console.log('✅ Connecting to Supabase...');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Key: ${supabaseKey.substring(0, 20)}...`);

  return createClient(supabaseUrl, supabaseKey);
}

// Escape string values for SQL
function escapeSQLString(value, format = 'mysql') {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value.toString();
  }

  if (typeof value === 'object') {
    // Handle JSON/JSONB columns
    const jsonStr = JSON.stringify(value).replace(/'/g, "''");
    return format === 'postgres' ? `'${jsonStr}'::jsonb` : `'${jsonStr}'`;
  }

  if (value instanceof Date) {
    return `'${value.toISOString()}'`;
  }

  // Escape single quotes and backslashes
  const escaped = value.toString()
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "''");

  return `'${escaped}'`;
}

// Generate INSERT statement
function generateInsertStatement(tableName, rows, format = 'mysql') {
  if (!rows || rows.length === 0) {
    return '';
  }

  const columns = Object.keys(rows[0]);
  const columnList = columns.map(col => `\`${col}\``).join(', ');

  let sql = `-- Insert data for table: ${tableName}\n`;
  sql += `-- Records: ${rows.length}\n`;
  sql += `-- Generated: ${new Date().toISOString()}\n\n`;

  // Add batch inserts (1000 rows per statement for better performance)
  const batchSize = 1000;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);

    sql += `INSERT INTO \`${tableName}\` (${columnList}) VALUES\n`;

    const values = batch.map((row, idx) => {
      const rowValues = columns.map(col => escapeSQLString(row[col], format)).join(', ');
      const comma = idx === batch.length - 1 ? ';' : ',';
      return `  (${rowValues})${comma}`;
    });

    sql += values.join('\n');
    sql += '\n\n';
  }

  return sql;
}

// Export table data
async function exportTable(supabase, tableName, limit = null) {
  console.log(`\n📊 Exporting table: ${tableName}`);

  try {
    let query = supabase
      .from(tableName)
      .select('*');

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`   ❌ Error: ${error.message}`);
      return { tableName, success: false, error: error.message, count: 0, data: [] };
    }

    console.log(`   ✅ Exported ${data.length} records`);

    return { tableName, success: true, count: data.length, data };

  } catch (error) {
    console.error(`   ❌ Exception: ${error.message}`);
    return { tableName, success: false, error: error.message, count: 0, data: [] };
  }
}

// Generate migration report
function generateReport(results, options, outputDir) {
  const timestamp = new Date().toISOString();
  let report = '';

  report += '=============================================================================\n';
  report += 'SUPABASE TO CPANEL MIGRATION REPORT\n';
  report += '=============================================================================\n\n';
  report += `Generated: ${timestamp}\n`;
  report += `Format: ${options.format.toUpperCase()}\n`;
  report += `Limit per table: ${options.limit || 'None (all records)'}\n`;
  report += `Dry run: ${options.dryRun ? 'Yes' : 'No'}\n\n`;

  report += '-----------------------------------------------------------------------------\n';
  report += 'EXPORT SUMMARY\n';
  report += '-----------------------------------------------------------------------------\n\n';

  let totalRecords = 0;
  let successCount = 0;
  let failureCount = 0;

  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    report += `${status} ${result.tableName.padEnd(30)} ${result.count.toString().padStart(8)} records\n`;

    if (!result.success) {
      report += `   Error: ${result.error}\n`;
      failureCount++;
    } else {
      successCount++;
      totalRecords += result.count;
    }
  });

  report += '\n';
  report += `Total tables processed: ${results.length}\n`;
  report += `Successful exports: ${successCount}\n`;
  report += `Failed exports: ${failureCount}\n`;
  report += `Total records exported: ${totalRecords}\n\n`;

  report += '-----------------------------------------------------------------------------\n';
  report += 'NEXT STEPS\n';
  report += '-----------------------------------------------------------------------------\n\n';

  if (!options.dryRun) {
    report += '1. Review the generated SQL file before importing:\n';
    report += `   ${outputDir}/migration-data-*.sql\n\n`;
    report += '2. Backup your existing cPanel database:\n';
    report += '   - Use phpMyAdmin Export or mysqldump\n\n';
    report += '3. Create tables in cPanel database (if not exist):\n';
    report += '   - Use the schema from Supabase or create-schema.sql\n\n';
    report += '4. Import the data:\n';
    report += '   - phpMyAdmin: Import tab → Choose file → Go\n';
    report += '   - MySQL CLI: mysql -u user -p database < migration-data-*.sql\n';
    report += '   - PostgreSQL: psql -U user -d database -f migration-data-*.sql\n\n';
    report += '5. Verify the import:\n';
    report += '   - Check record counts match this report\n';
    report += '   - Test application functionality\n';
    report += '   - Verify foreign key relationships\n\n';
  } else {
    report += 'This was a dry run. No files were created.\n';
    report += 'Remove --dry-run flag to generate migration files.\n\n';
  }

  report += '-----------------------------------------------------------------------------\n';
  report += 'WARNINGS AND RECOMMENDATIONS\n';
  report += '-----------------------------------------------------------------------------\n\n';

  if (options.limit) {
    report += `⚠️  PARTIAL EXPORT: Only ${options.limit} records per table were exported.\n`;
    report += '   Remove --limit flag for full export.\n\n';
  }

  if (failureCount > 0) {
    report += '⚠️  EXPORT FAILURES: Some tables failed to export.\n';
    report += '   Review error messages above and retry.\n\n';
  }

  if (totalRecords > 100000) {
    report += '⚠️  LARGE DATASET: Consider splitting into smaller batches.\n';
    report += '   Import may timeout on shared hosting.\n\n';
  }

  report += '✅ Always test import on staging database first\n';
  report += '✅ Keep JSON backup for reference\n';
  report += '✅ Monitor cPanel disk space during import\n';
  report += '✅ Update application .env with new database credentials\n\n';

  report += '-----------------------------------------------------------------------------\n';
  report += 'SUPPORT\n';
  report += '-----------------------------------------------------------------------------\n\n';
  report += 'For issues or questions:\n';
  report += '- Review MIGRATION_GUIDE.md in the root directory\n';
  report += '- Check cPanel error logs if import fails\n';
  report += '- Contact database administrator\n\n';

  report += '=============================================================================\n';

  return report;
}

// Main migration function
async function migrate() {
  console.log('\n=============================================================================');
  console.log('SUPABASE TO CPANEL DATABASE MIGRATION');
  console.log('=============================================================================\n');

  const options = parseArgs();

  console.log('Configuration:');
  console.log(`  Format: ${options.format.toUpperCase()}`);
  console.log(`  Limit: ${options.limit || 'None (all records)'}`);
  console.log(`  Dry run: ${options.dryRun ? 'Yes' : 'No'}`);

  if (options.tables) {
    console.log(`  Tables: ${options.tables.join(', ')}`);
  }
  if (options.skip.length > 0) {
    console.log(`  Skip: ${options.skip.join(', ')}`);
  }

  // Initialize Supabase
  const supabase = initializeSupabase();

  // Determine tables to export
  let tablesToExport = options.tables || TABLES_TO_EXPORT;
  tablesToExport = tablesToExport.filter(table => !options.skip.includes(table));

  console.log(`\nExporting ${tablesToExport.length} tables...`);

  // Export all tables
  const results = [];
  for (const tableName of tablesToExport) {
    const result = await exportTable(supabase, tableName, options.limit);
    results.push(result);
  }

  // Generate output files
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const outputDir = join(__dirname, 'migrations');

  // Create output directory if it doesn't exist
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  if (!options.dryRun) {
    console.log('\n📝 Generating migration files...');

    // Generate SQL file
    let sqlContent = '';
    sqlContent += '-- =============================================================================\n';
    sqlContent += '-- SUPABASE TO CPANEL DATABASE MIGRATION\n';
    sqlContent += '-- =============================================================================\n';
    sqlContent += `-- Generated: ${new Date().toISOString()}\n`;
    sqlContent += `-- Format: ${options.format.toUpperCase()}\n`;
    sqlContent += `-- Total tables: ${results.length}\n`;
    sqlContent += `-- Total records: ${results.reduce((sum, r) => sum + r.count, 0)}\n`;
    sqlContent += '-- =============================================================================\n\n';

    if (options.format === 'mysql') {
      sqlContent += 'SET FOREIGN_KEY_CHECKS=0;\n';
      sqlContent += 'SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";\n';
      sqlContent += 'SET time_zone = "+00:00";\n\n';
    }

    results.forEach(result => {
      if (result.success && result.data.length > 0) {
        sqlContent += generateInsertStatement(result.tableName, result.data, options.format);
      }
    });

    if (options.format === 'mysql') {
      sqlContent += '\nSET FOREIGN_KEY_CHECKS=1;\n';
    }

    const sqlFile = join(outputDir, `migration-data-${timestamp}.sql`);
    writeFileSync(sqlFile, sqlContent, 'utf8');
    console.log(`   ✅ SQL file: ${sqlFile}`);

    // Generate JSON backup
    const jsonData = {
      metadata: {
        timestamp: new Date().toISOString(),
        format: options.format,
        tables: tablesToExport,
        totalRecords: results.reduce((sum, r) => sum + r.count, 0)
      },
      tables: results.reduce((acc, result) => {
        if (result.success) {
          acc[result.tableName] = result.data;
        }
        return acc;
      }, {})
    };

    const jsonFile = join(outputDir, `migration-data-${timestamp}.json`);
    writeFileSync(jsonFile, JSON.stringify(jsonData, null, 2), 'utf8');
    console.log(`   ✅ JSON backup: ${jsonFile}`);

    // Generate report
    const report = generateReport(results, options, outputDir);
    const reportFile = join(outputDir, `migration-report-${timestamp}.txt`);
    writeFileSync(reportFile, report, 'utf8');
    console.log(`   ✅ Report: ${reportFile}`);
  } else {
    console.log('\n⚠️  DRY RUN - No files created');
  }

  // Display summary
  console.log('\n=============================================================================');
  console.log('MIGRATION SUMMARY');
  console.log('=============================================================================\n');

  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.tableName.padEnd(30)} ${result.count.toString().padStart(8)} records`);
  });

  const totalRecords = results.reduce((sum, r) => sum + r.count, 0);
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;

  console.log('\n-----------------------------------------------------------------------------');
  console.log(`Total tables: ${results.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failureCount}`);
  console.log(`Total records: ${totalRecords}`);
  console.log('-----------------------------------------------------------------------------\n');

  if (!options.dryRun) {
    console.log('✅ Migration files created successfully!');
    console.log(`\n📁 Output directory: ${outputDir}`);
    console.log('\n📖 Next steps:');
    console.log('   1. Review the migration report');
    console.log('   2. Test import on staging database');
    console.log('   3. Import to production cPanel database');
    console.log('   4. Verify data integrity');
    console.log('\n💡 See MIGRATION_GUIDE.md for detailed instructions');
  } else {
    console.log('💡 Remove --dry-run flag to generate migration files');
  }

  console.log('\n=============================================================================\n');
}

// Run migration
migrate().catch(error => {
  console.error('\n❌ Migration failed:', error.message);
  console.error(error.stack);
  process.exit(1);
});
