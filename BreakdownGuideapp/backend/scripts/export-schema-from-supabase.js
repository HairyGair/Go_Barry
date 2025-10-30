/**
 * Export Database Schema from Supabase
 *
 * This script exports table schemas (CREATE TABLE statements) from Supabase
 * so they can be recreated in cPanel before importing data.
 *
 * USAGE:
 * node backend/scripts/export-schema-from-supabase.js
 *
 * OUTPUT:
 * backend/scripts/migrations/schema-export-[timestamp].sql
 *
 * @author Anthony Gair
 * @version 1.0.0
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

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

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Get table schema from Supabase
 */
async function getTableSchema(tableName) {
  console.log(`\n📊 Fetching schema for: ${tableName}`);

  try {
    // Query information_schema to get column details
    const { data, error } = await supabase.rpc('get_table_schema', {
      table_name: tableName
    });

    if (error) {
      // Fallback: Try to infer schema from data
      console.log(`   ⚠️  RPC function not available, inferring from data...`);
      return await inferSchemaFromData(tableName);
    }

    return data;

  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return await inferSchemaFromData(tableName);
  }
}

/**
 * Infer schema from actual data (fallback method)
 */
async function inferSchemaFromData(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) throw error;

    if (!data || data.length === 0) {
      console.log(`   ⚠️  Table is empty, cannot infer schema`);
      return null;
    }

    const row = data[0];
    const columns = Object.keys(row).map(columnName => {
      const value = row[columnName];
      let dataType = 'TEXT';

      if (value === null) {
        dataType = 'TEXT'; // Default to TEXT for NULL values
      } else if (typeof value === 'number') {
        dataType = Number.isInteger(value) ? 'INTEGER' : 'DECIMAL(10,2)';
      } else if (typeof value === 'boolean') {
        dataType = 'BOOLEAN';
      } else if (value instanceof Date || /^\d{4}-\d{2}-\d{2}/.test(value)) {
        dataType = 'TIMESTAMP';
      } else if (typeof value === 'object') {
        dataType = 'JSON';
      } else {
        dataType = 'VARCHAR(255)';
      }

      return {
        column_name: columnName,
        data_type: dataType,
        is_nullable: 'YES',
        column_default: null
      };
    });

    console.log(`   ✅ Inferred schema from ${columns.length} columns`);
    return columns;

  } catch (error) {
    console.error(`   ❌ Failed to infer schema: ${error.message}`);
    return null;
  }
}

/**
 * Map PostgreSQL types to MySQL types
 */
function mapToMySQLType(pgType) {
  const typeMap = {
    'character varying': 'VARCHAR(255)',
    'varchar': 'VARCHAR(255)',
    'text': 'TEXT',
    'integer': 'INT',
    'bigint': 'BIGINT',
    'smallint': 'SMALLINT',
    'boolean': 'BOOLEAN',
    'timestamp': 'TIMESTAMP',
    'timestamp with time zone': 'TIMESTAMP',
    'timestamptz': 'TIMESTAMP',
    'date': 'DATE',
    'time': 'TIME',
    'uuid': 'VARCHAR(36)',
    'json': 'JSON',
    'jsonb': 'JSON',
    'decimal': 'DECIMAL(10,2)',
    'numeric': 'DECIMAL(10,2)',
    'real': 'FLOAT',
    'double precision': 'DOUBLE'
  };

  return typeMap[pgType.toLowerCase()] || 'TEXT';
}

/**
 * Generate CREATE TABLE statement
 */
function generateCreateTableSQL(tableName, columns, format = 'mysql') {
  if (!columns || columns.length === 0) {
    return `-- Unable to generate schema for ${tableName}\n\n`;
  }

  let sql = `-- Table: ${tableName}\n`;
  sql += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
  sql += `CREATE TABLE \`${tableName}\` (\n`;

  const columnDefs = columns.map((col, idx) => {
    const dataType = format === 'mysql'
      ? mapToMySQLType(col.data_type)
      : col.data_type;

    let def = `  \`${col.column_name}\` ${dataType}`;

    // Add NOT NULL if specified
    if (col.is_nullable === 'NO') {
      def += ' NOT NULL';
    }

    // Add DEFAULT if specified
    if (col.column_default && !col.column_default.includes('nextval')) {
      def += ` DEFAULT ${col.column_default}`;
    }

    // Add AUTO_INCREMENT for id columns
    if (col.column_name === 'id' && dataType.includes('INT')) {
      def += ' AUTO_INCREMENT';
    }

    return def;
  });

  sql += columnDefs.join(',\n');

  // Add primary key
  if (columns.some(col => col.column_name === 'id')) {
    sql += ',\n  PRIMARY KEY (`id`)';
  }

  sql += '\n)';

  if (format === 'mysql') {
    sql += ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';
  }

  sql += ';\n\n';

  return sql;
}

/**
 * Generate indexes
 */
function generateIndexes(tableName) {
  const indexes = {
    'breakdowns': [
      'CREATE INDEX idx_breakdowns_supervisor ON breakdowns(supervisor_id);',
      'CREATE INDEX idx_breakdowns_status ON breakdowns(status);',
      'CREATE INDEX idx_breakdowns_fleet_no ON breakdowns(fleet_no);',
      'CREATE INDEX idx_breakdowns_created ON breakdowns(created_at);'
    ],
    'wizard_progress': [
      'CREATE INDEX idx_wizard_supervisor ON wizard_progress(supervisor_id);',
      'CREATE INDEX idx_wizard_type ON wizard_progress(wizard_type);'
    ],
    'activities': [
      'CREATE INDEX idx_activities_supervisor ON activities(supervisor_id);',
      'CREATE INDEX idx_activities_type ON activities(activity_type);',
      'CREATE INDEX idx_activities_created ON activities(created_at);'
    ],
    'fleet_vehicles': [
      'CREATE INDEX idx_fleet_fleet_no ON fleet_vehicles(fleet_no);',
      'CREATE INDEX idx_fleet_depot ON fleet_vehicles(depot);'
    ]
  };

  if (!indexes[tableName]) {
    return '';
  }

  let sql = `-- Indexes for ${tableName}\n`;
  sql += indexes[tableName].join('\n');
  sql += '\n\n';

  return sql;
}

/**
 * Main export function
 */
async function exportSchema() {
  console.log('\n=============================================================================');
  console.log('EXPORT DATABASE SCHEMA FROM SUPABASE');
  console.log('=============================================================================\n');

  console.log('✅ Connected to Supabase');
  console.log(`   URL: ${supabaseUrl}`);

  let sqlContent = '';
  sqlContent += '-- =============================================================================\n';
  sqlContent += '-- SUPABASE DATABASE SCHEMA EXPORT\n';
  sqlContent += '-- =============================================================================\n';
  sqlContent += `-- Generated: ${new Date().toISOString()}\n`;
  sqlContent += `-- Target: MySQL/MariaDB\n`;
  sqlContent += `-- Tables: ${TABLES_TO_EXPORT.length}\n`;
  sqlContent += '-- =============================================================================\n\n';

  sqlContent += 'SET FOREIGN_KEY_CHECKS=0;\n';
  sqlContent += 'SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";\n';
  sqlContent += 'SET time_zone = "+00:00";\n\n';

  // Export each table
  for (const tableName of TABLES_TO_EXPORT) {
    const columns = await inferSchemaFromData(tableName);

    if (columns) {
      sqlContent += generateCreateTableSQL(tableName, columns, 'mysql');
      sqlContent += generateIndexes(tableName);
    }
  }

  // Add foreign keys
  sqlContent += '-- Foreign Key Constraints\n';
  sqlContent += 'ALTER TABLE breakdowns\n';
  sqlContent += '  ADD CONSTRAINT fk_breakdown_supervisor\n';
  sqlContent += '  FOREIGN KEY (supervisor_id) REFERENCES supervisors(id)\n';
  sqlContent += '  ON DELETE CASCADE ON UPDATE CASCADE;\n\n';

  sqlContent += 'ALTER TABLE wizard_progress\n';
  sqlContent += '  ADD CONSTRAINT fk_wizard_supervisor\n';
  sqlContent += '  FOREIGN KEY (supervisor_id) REFERENCES supervisors(id)\n';
  sqlContent += '  ON DELETE CASCADE ON UPDATE CASCADE;\n\n';

  sqlContent += 'ALTER TABLE user_preferences\n';
  sqlContent += '  ADD CONSTRAINT fk_preferences_supervisor\n';
  sqlContent += '  FOREIGN KEY (supervisor_id) REFERENCES supervisors(id)\n';
  sqlContent += '  ON DELETE CASCADE ON UPDATE CASCADE;\n\n';

  sqlContent += 'ALTER TABLE notification_preferences\n';
  sqlContent += '  ADD CONSTRAINT fk_notifications_supervisor\n';
  sqlContent += '  FOREIGN KEY (supervisor_id) REFERENCES supervisors(id)\n';
  sqlContent += '  ON DELETE CASCADE ON UPDATE CASCADE;\n\n';

  sqlContent += 'ALTER TABLE activities\n';
  sqlContent += '  ADD CONSTRAINT fk_activity_supervisor\n';
  sqlContent += '  FOREIGN KEY (supervisor_id) REFERENCES supervisors(id)\n';
  sqlContent += '  ON DELETE SET NULL ON UPDATE CASCADE;\n\n';

  sqlContent += 'SET FOREIGN_KEY_CHECKS=1;\n\n';

  sqlContent += '-- =============================================================================\n';
  sqlContent += '-- END OF SCHEMA EXPORT\n';
  sqlContent += '-- =============================================================================\n';

  // Save to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const outputDir = join(__dirname, 'migrations');

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const outputFile = join(outputDir, `schema-export-${timestamp}.sql`);
  writeFileSync(outputFile, sqlContent, 'utf8');

  console.log('\n✅ Schema export complete!');
  console.log(`\n📁 Output file: ${outputFile}`);
  console.log('\n📖 Next steps:');
  console.log('   1. Review the generated SQL file');
  console.log('   2. Import into cPanel database:');
  console.log('      mysql -u username -p database_name < schema-export-*.sql');
  console.log('   3. Then run data migration script:');
  console.log('      node backend/scripts/migrate-supabase-to-cpanel.js\n');

  console.log('=============================================================================\n');
}

// Run export
exportSchema().catch(error => {
  console.error('\n❌ Schema export failed:', error.message);
  console.error(error.stack);
  process.exit(1);
});
