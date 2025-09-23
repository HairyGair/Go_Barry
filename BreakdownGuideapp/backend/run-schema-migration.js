#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runSchemaMigration() {
  console.log('🚀 Starting schema migration...\n');

  // Individual column additions (safer than running full SQL)
  const migrations = [
    { column: 'issue_category', type: 'VARCHAR(100)', description: 'Issue category from SDC Guide' },
    { column: 'issue_description', type: 'TEXT', description: 'Detailed issue description' },
    { column: 'wizard_type', type: 'VARCHAR(50)', description: 'Type of wizard used' },
    { column: 'wizard_decision', type: 'VARCHAR(10)', description: 'Wizard assessment decision' },
    { column: 'wizard_assessment_data', type: 'JSONB', description: 'Wizard assessment data' },
    { column: 'wizard_started_at', type: 'TIMESTAMP WITH TIME ZONE', description: 'Wizard start time' },
    { column: 'wizard_completed_at', type: 'TIMESTAMP WITH TIME ZONE', description: 'Wizard completion time' },
    { column: 'fleet_number', type: 'VARCHAR(20)', description: 'Vehicle fleet number' },
    { column: 'w3w_location', type: 'VARCHAR(100)', description: 'What3Words location' },
    { column: 'reported_by_badge', type: 'VARCHAR(10)', description: 'Reporting supervisor badge' },
    { column: 'reported_by_name', type: 'VARCHAR(100)', description: 'Reporting supervisor name' },
    { column: 'priority_level', type: 'INTEGER DEFAULT 3', description: 'Priority level (1-5)' },
    { column: 'breakdown_source', type: 'VARCHAR(50)', description: 'Source of breakdown report' },
    { column: 'engineering_required', type: 'BOOLEAN DEFAULT false', description: 'Engineering assistance required' },
    { column: 'replacement_vehicle_required', type: 'BOOLEAN DEFAULT false', description: 'Replacement vehicle required' },
    { column: 'last_update_at', type: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()', description: 'Last update timestamp' }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const migration of migrations) {
    try {
      console.log(`🔧 Adding column: ${migration.column} (${migration.type})`);
      console.log(`   Description: ${migration.description}`);

      // Try to add the column - this will fail if it already exists, which is fine
      const { data, error } = await supabase.rpc('execute_sql', {
        sql: `ALTER TABLE breakdowns ADD COLUMN ${migration.column} ${migration.type};`
      });

      if (error) {
        if (error.message.includes('already exists')) {
          console.log(`   ✅ Column already exists - skipping`);
        } else {
          console.log(`   ❌ Error: ${error.message}`);
          errorCount++;
        }
      } else {
        console.log(`   ✅ Successfully added`);
        successCount++;
      }

    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`);
      errorCount++;
    }

    console.log(''); // Empty line for readability
  }

  console.log(`\n📊 Migration Summary:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📋 Total: ${migrations.length}`);

  // Test the schema fix
  console.log('\n🧪 Testing schema fix...');
  return await testSchemaFix();
}

async function testSchemaFix() {
  console.log('🔍 Testing breakdown insert with issue_category...');

  const testData = {
    breakdown_id: `MIGRATION-TEST-${Date.now()}`,
    issue_category: 'Test Category',
    issue_description: 'Test description after migration',
    fleet_number: '7001',
    severity: 'AMBER',
    status: 'received',
    created_at: new Date().toISOString(),
    received_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('breakdowns')
      .insert(testData)
      .select()
      .single();

    if (error) {
      console.error('❌ Post-migration test failed:', error);
      return false;
    }

    console.log('✅ Post-migration test successful!');
    console.log(`📋 Created breakdown: ${data.breakdown_id}`);

    // Clean up
    await supabase
      .from('breakdowns')
      .delete()
      .eq('id', data.id);

    console.log('🧹 Test data cleaned up');
    return true;

  } catch (error) {
    console.error('❌ Post-migration test error:', error);
    return false;
  }
}

async function main() {
  try {
    const success = await runSchemaMigration();
    if (success) {
      console.log('\n🎉 Schema migration completed successfully!');
      console.log('✅ The /api/breakdowns/from-wizard endpoint should now work');
    } else {
      console.log('\n❌ Schema migration completed with issues');
      console.log('🔍 Please check the errors above and resolve manually');
    }
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

main();