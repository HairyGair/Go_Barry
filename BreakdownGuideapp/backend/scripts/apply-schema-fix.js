#!/usr/bin/env node

/**
 * Apply Schema Fixes for Wizard-to-Dashboard Integration
 *
 * This script applies the necessary database schema changes to fix
 * the wizard-to-dashboard integration issues.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function executeSQL(sql, description) {
  console.log(`\n🔧 Executing: ${description}`);

  try {
    const { data, error } = await supabase.rpc('execute_sql', { sql_query: sql });

    if (error) {
      console.error(`❌ Error: ${error.message}`);
      return false;
    }

    console.log(`✅ Success: ${description}`);
    return true;
  } catch (err) {
    console.error(`❌ Exception: ${err.message}`);
    return false;
  }
}

async function addMissingColumns() {
  console.log('\n📋 Adding missing columns to breakdowns table...');

  const columns = [
    { name: 'wizard_decision', type: 'VARCHAR(10)', description: 'Add wizard_decision column' },
    { name: 'wizard_type', type: 'VARCHAR(100)', description: 'Add wizard_type column' },
    { name: 'fleet_no', type: 'VARCHAR(20)', description: 'Add fleet_no column' },
    { name: 'registration', type: 'VARCHAR(20)', description: 'Add registration column' },
    { name: 'depot', type: 'VARCHAR(50)', description: 'Add depot column' },
    { name: 'priority_level', type: 'INTEGER DEFAULT 3', description: 'Add priority_level column' },
    { name: 'supervisor_badge', type: 'VARCHAR(10)', description: 'Add supervisor_badge column' },
    { name: 'supervisor_name', type: 'VARCHAR(100)', description: 'Add supervisor_name column' },
    { name: 'criticality', type: 'VARCHAR(10)', description: 'Add criticality column' },
    { name: 'card_title', type: 'VARCHAR(255)', description: 'Add card_title column' },
    { name: 'status_color', type: 'VARCHAR(20)', description: 'Add status_color column' },
    { name: 'requires_immediate_action', type: 'BOOLEAN DEFAULT false', description: 'Add requires_immediate_action column' }
  ];

  for (const column of columns) {
    const sql = `
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                         WHERE table_name = 'breakdowns' AND column_name = '${column.name}') THEN
              ALTER TABLE breakdowns ADD COLUMN ${column.name} ${column.type};
          END IF;
      END $$;
    `;

    await executeSQL(sql, column.description);
  }
}

async function createDashboardView() {
  console.log('\n🔍 Creating sdc_dashboard_breakdowns view...');

  const dropViewSQL = 'DROP VIEW IF EXISTS sdc_dashboard_breakdowns;';
  await executeSQL(dropViewSQL, 'Drop existing view');

  const createViewSQL = `
    CREATE VIEW sdc_dashboard_breakdowns AS
    SELECT
        -- Core identifiers
        b.id,
        b.breakdown_id,

        -- Vehicle information
        COALESCE(b.fleet_no, v.fleet_number) as fleet_no,
        COALESCE(b.registration, v.registration) as registration,
        COALESCE(b.depot, v.depot) as depot,

        -- Location and issue information
        COALESCE(b.location_description, 'Location TBC') as location,
        b.issue_category,
        b.issue_description,

        -- Status and severity
        b.status,
        b.severity,
        b.wizard_decision,
        COALESCE(b.criticality, b.severity) as criticality,

        -- Timing information
        b.created_at,
        b.updated_at,

        -- Calculate elapsed minutes
        EXTRACT(EPOCH FROM (NOW() - b.created_at)) / 60 as elapsed_minutes,

        -- Priority and supervisor information
        COALESCE(b.priority_level, 3) as priority_level,
        b.supervisor_badge,
        COALESCE(b.supervisor_name, s.name) as supervisor_name,

        -- Dashboard card information
        COALESCE(
            b.card_title,
            CONCAT(
                COALESCE(b.fleet_no, v.fleet_number, 'Unknown'),
                ' - ',
                COALESCE(b.issue_category, 'Assessment Required')
            )
        ) as card_title,

        COALESCE(
            b.status_color,
            CASE
                WHEN b.severity = 'STOP' THEN 'red'
                WHEN b.severity = 'AMBER' THEN 'orange'
                WHEN b.severity = 'CONTINUE' THEN 'green'
                ELSE 'gray'
            END
        ) as status_color,

        COALESCE(
            b.requires_immediate_action,
            CASE
                WHEN b.severity = 'STOP' THEN true
                WHEN b.priority_level <= 2 THEN true
                ELSE false
            END
        ) as requires_immediate_action

    FROM breakdowns b
    LEFT JOIN vehicles v ON b.vehicle_id = v.id
    LEFT JOIN supervisors s ON b.supervisor_id = s.id
    WHERE b.status IN ('active', 'pending', 'in_progress', 'received', 'acknowledged', 'decision', 'dispatched', 'on_site', 'moving')
    ORDER BY
        COALESCE(b.priority_level, 3) ASC,
        b.created_at DESC;
  `;

  await executeSQL(createViewSQL, 'Create sdc_dashboard_breakdowns view');
}

async function updateExistingData() {
  console.log('\n🔄 Updating existing data with default values...');

  const updates = [
    {
      sql: `
        UPDATE breakdowns
        SET priority_level = CASE
            WHEN severity = 'STOP' THEN 1
            WHEN severity = 'AMBER' THEN 2
            WHEN severity = 'CONTINUE' THEN 3
            ELSE 3
        END
        WHERE priority_level IS NULL;
      `,
      description: 'Set default priority levels'
    },
    {
      sql: `
        UPDATE breakdowns
        SET criticality = severity
        WHERE criticality IS NULL AND severity IS NOT NULL;
      `,
      description: 'Set default criticality values'
    },
    {
      sql: `
        UPDATE breakdowns
        SET requires_immediate_action = CASE
            WHEN severity = 'STOP' THEN true
            WHEN priority_level <= 2 THEN true
            ELSE false
        END
        WHERE requires_immediate_action IS NULL;
      `,
      description: 'Set default immediate action flags'
    },
    {
      sql: `
        UPDATE breakdowns
        SET status_color = CASE
            WHEN severity = 'STOP' THEN 'red'
            WHEN severity = 'AMBER' THEN 'orange'
            WHEN severity = 'CONTINUE' THEN 'green'
            ELSE 'gray'
        END
        WHERE status_color IS NULL;
      `,
      description: 'Set default status colors'
    }
  ];

  for (const update of updates) {
    await executeSQL(update.sql, update.description);
  }
}

async function createIndexes() {
  console.log('\n📊 Creating performance indexes...');

  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_breakdowns_priority_level ON breakdowns(priority_level);',
    'CREATE INDEX IF NOT EXISTS idx_breakdowns_wizard_decision ON breakdowns(wizard_decision);',
    'CREATE INDEX IF NOT EXISTS idx_breakdowns_fleet_no ON breakdowns(fleet_no);',
    'CREATE INDEX IF NOT EXISTS idx_breakdowns_supervisor_badge ON breakdowns(supervisor_badge);'
  ];

  for (const index of indexes) {
    await executeSQL(index, `Create index: ${index.split(' ')[5]}`);
  }
}

async function testView() {
  console.log('\n🧪 Testing the sdc_dashboard_breakdowns view...');

  try {
    const { data, error } = await supabase
      .from('sdc_dashboard_breakdowns')
      .select('breakdown_id, fleet_no, location, status, severity')
      .limit(5);

    if (error) {
      console.error('❌ View test failed:', error.message);
      return false;
    }

    console.log('✅ View test successful');
    console.log(`📊 Found ${data.length} records in view`);

    if (data.length > 0) {
      console.log('📋 Sample record:');
      console.log(JSON.stringify(data[0], null, 2));
    }

    return true;
  } catch (err) {
    console.error('❌ View test exception:', err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting database schema fix for wizard-to-dashboard integration');
  console.log(`📍 Supabase URL: ${supabaseUrl}`);

  let success = true;

  // Step 1: Add missing columns
  await addMissingColumns();

  // Step 2: Create the dashboard view
  await createDashboardView();

  // Step 3: Update existing data
  await updateExistingData();

  // Step 4: Create indexes for performance
  await createIndexes();

  // Step 5: Test the view
  const viewTest = await testView();
  if (!viewTest) {
    success = false;
  }

  if (success) {
    console.log('\n🎉 Schema fix completed successfully!');
    console.log('✅ The wizard-to-dashboard integration should now work');
  } else {
    console.log('\n⚠️  Schema fix completed with some errors');
    console.log('🔧 Please check the errors above and fix manually if needed');
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main, testView };