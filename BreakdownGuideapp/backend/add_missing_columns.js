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

async function addMissingColumns() {
  console.log('🔧 Adding missing columns to breakdowns table...\n');

  // SQL to add the missing columns
  const sqlStatements = [
    "ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS issue_description TEXT;",
    "ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();"
  ];

  for (const sql of sqlStatements) {
    try {
      console.log(`📝 Executing: ${sql}`);
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

      if (error) {
        console.error(`❌ Error: ${error.message}`);
      } else {
        console.log(`✅ Success`);
      }
    } catch (err) {
      console.error(`❌ Exception: ${err.message}`);
    }
  }

  console.log('\n🧪 Testing insert after schema fix...');

  // Test data
  const testData = {
    breakdown_id: `TEST-${Date.now()}`,
    fleet_number: '5801',
    location_description: 'Test Location',
    issue_description: 'Test breakdown after schema fix',
    description: 'Test breakdown after schema fix',
    status: 'received',
    severity: 'CONTINUE',
    supervisor_badge: 'AG003',
    supervisor_name: 'Anthony Gair',
    issue_category: 'test',
    priority_level: 3,
    engineering_required: false,
    replacement_vehicle_required: false,
    breakdown_source: 'wizard',
    wizard_type: 'Test',
    wizard_decision: 'CONTINUE',
    wizard_assessment_data: { test: true },
    created_at: new Date().toISOString(),
    received_at: new Date().toISOString(),
    last_update_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('breakdowns')
      .insert(testData)
      .select()
      .single();

    if (error) {
      console.error('❌ Test insert failed:', error.message);
      console.error('Error details:', error);
      return false;
    }

    console.log('✅ Test insert successful!');
    console.log(`📋 Created breakdown: ${data.breakdown_id}`);

    // Clean up
    await supabase.from('breakdowns').delete().eq('id', data.id);
    console.log('🧹 Test data cleaned up');

    return true;

  } catch (error) {
    console.error('❌ Test insert error:', error.message);
    return false;
  }
}

// Main execution
addMissingColumns()
  .then(success => {
    if (success) {
      console.log('\n🎉 SUCCESS: Missing columns added and tested successfully!');
      console.log('✅ The /api/breakdowns/from-wizard endpoint should now work correctly!');
    } else {
      console.log('\n❌ FAILED: Schema fix attempt failed - manual intervention required');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Script error:', error.message);
    process.exit(1);
  });