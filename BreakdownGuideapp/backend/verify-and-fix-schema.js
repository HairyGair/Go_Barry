#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test data that matches what the /from-wizard endpoint sends
const testPayload = {
  breakdown_id: `TEST-${Date.now()}`,
  wizard_type: 'oil-leak',
  wizard_decision: 'AMBER',
  wizard_assessment_data: { test: true },
  wizard_started_at: new Date().toISOString(),
  wizard_completed_at: new Date().toISOString(),
  fleet_number: '7001',
  location_description: 'Test Location',
  w3w_location: '///test.words.here',
  reported_by_badge: 'AG003',
  reported_by_name: 'Test Supervisor',
  issue_category: 'Oil Leak Assessment',
  issue_description: 'Test breakdown from wizard',
  severity: 'AMBER',
  status: 'received',
  priority_level: 2,
  breakdown_source: 'wizard',
  engineering_required: false,
  replacement_vehicle_required: false,
  created_at: new Date().toISOString(),
  received_at: new Date().toISOString(),
  last_update_at: new Date().toISOString()
};

async function identifyMissingColumns() {
  console.log('🔍 Identifying missing columns in breakdowns table...\n');

  const missingColumns = [];
  const existingColumns = [];

  // Test each field individually to see which ones fail
  for (const [columnName, value] of Object.entries(testPayload)) {
    try {
      const singleFieldTest = { [columnName]: value };

      // For required fields like breakdown_id, we need to include it
      if (columnName !== 'breakdown_id') {
        singleFieldTest.breakdown_id = `FIELD-TEST-${columnName}-${Date.now()}`;
      }

      const { data, error } = await supabase
        .from('breakdowns')
        .insert(singleFieldTest)
        .select()
        .single();

      if (error) {
        if (error.message.includes(`Could not find the '${columnName}' column`)) {
          missingColumns.push(columnName);
          console.log(`❌ Missing: ${columnName}`);
        } else if (error.message.includes('null value') && error.message.includes('violates not-null constraint')) {
          existingColumns.push(columnName);
          console.log(`✅ Exists but required: ${columnName}`);
        } else {
          existingColumns.push(columnName);
          console.log(`✅ Exists: ${columnName} (${error.message.split('.')[0]})`);
        }
      } else {
        existingColumns.push(columnName);
        console.log(`✅ Exists and inserted: ${columnName}`);

        // Clean up successful test
        await supabase.from('breakdowns').delete().eq('id', data.id);
      }

    } catch (err) {
      console.log(`❓ Error testing ${columnName}: ${err.message}`);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`✅ Existing columns: ${existingColumns.length}`);
  console.log(`❌ Missing columns: ${missingColumns.length}`);

  if (missingColumns.length > 0) {
    console.log('\n🔧 Missing columns that need to be added:');
    missingColumns.forEach(col => console.log(`   - ${col}`));

    console.log('\n📋 SQL to fix the schema:');
    console.log('-- Run this SQL in your Supabase dashboard SQL editor:');
    console.log('');

    const sqlStatements = [
      "ALTER TABLE breakdowns ADD COLUMN issue_category VARCHAR(100);",
      "ALTER TABLE breakdowns ADD COLUMN issue_description TEXT;",
      "ALTER TABLE breakdowns ADD COLUMN wizard_type VARCHAR(50);",
      "ALTER TABLE breakdowns ADD COLUMN wizard_decision VARCHAR(10);",
      "ALTER TABLE breakdowns ADD COLUMN wizard_assessment_data JSONB;",
      "ALTER TABLE breakdowns ADD COLUMN wizard_started_at TIMESTAMP WITH TIME ZONE;",
      "ALTER TABLE breakdowns ADD COLUMN wizard_completed_at TIMESTAMP WITH TIME ZONE;",
      "ALTER TABLE breakdowns ADD COLUMN fleet_number VARCHAR(20);",
      "ALTER TABLE breakdowns ADD COLUMN w3w_location VARCHAR(100);",
      "ALTER TABLE breakdowns ADD COLUMN reported_by_badge VARCHAR(10);",
      "ALTER TABLE breakdowns ADD COLUMN reported_by_name VARCHAR(100);",
      "ALTER TABLE breakdowns ADD COLUMN priority_level INTEGER DEFAULT 3;",
      "ALTER TABLE breakdowns ADD COLUMN breakdown_source VARCHAR(50);",
      "ALTER TABLE breakdowns ADD COLUMN engineering_required BOOLEAN DEFAULT false;",
      "ALTER TABLE breakdowns ADD COLUMN replacement_vehicle_required BOOLEAN DEFAULT false;",
      "ALTER TABLE breakdowns ADD COLUMN last_update_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();"
    ];

    sqlStatements.forEach(sql => console.log(sql));

    console.log('\n🌐 Instructions:');
    console.log('1. Open your Supabase dashboard');
    console.log('2. Go to the SQL Editor');
    console.log('3. Copy and paste the SQL statements above');
    console.log('4. Execute them one by one or all at once');
    console.log('5. Run this script again to verify the fix');
  }

  return missingColumns.length === 0;
}

async function testFullInsert() {
  console.log('\n🧪 Testing full breakdown insert...');

  try {
    const { data, error } = await supabase
      .from('breakdowns')
      .insert(testPayload)
      .select()
      .single();

    if (error) {
      console.error('❌ Full insert failed:', error.message);
      return false;
    }

    console.log('✅ Full insert successful!');
    console.log(`📋 Created breakdown: ${data.breakdown_id}`);

    // Clean up
    await supabase.from('breakdowns').delete().eq('id', data.id);
    console.log('🧹 Test data cleaned up');

    return true;

  } catch (error) {
    console.error('❌ Full insert error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Verifying and fixing breakdowns table schema...\n');

  const schemaValid = await identifyMissingColumns();

  if (schemaValid) {
    console.log('\n🎉 Schema appears to be complete!');
    const insertWorks = await testFullInsert();

    if (insertWorks) {
      console.log('\n✅ SUCCESS: The /api/breakdowns/from-wizard endpoint should now work correctly!');
    } else {
      console.log('\n❌ Schema is complete but insert still fails - check constraints and validation');
    }
  } else {
    console.log('\n❌ Schema needs to be fixed - follow the instructions above');
  }
}

main().catch(console.error);