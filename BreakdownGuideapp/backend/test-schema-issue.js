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
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabaseSchema() {
  console.log('🔍 Checking database schema...\n');

  try {
    // Simple test to see if breakdowns table exists
    const { data: breakdownsTest, error: breakdownsError } = await supabase
      .from('breakdowns')
      .select('id')
      .limit(1);

    if (breakdownsError) {
      console.error('❌ Error accessing breakdowns table:', breakdownsError);
      return false;
    }

    console.log('✅ Breakdowns table is accessible');
    console.log(`📊 Sample records found: ${breakdownsTest?.length || 0}`);

    // Try to run an empty insert to see what fields are expected
    console.log('\n🔍 Testing insert with minimal data to check field validation...');

    const { error: insertError } = await supabase
      .from('breakdowns')
      .insert({})
      .select()
      .single();

    if (insertError) {
      console.log('📋 Insert validation error (expected):', insertError.message);
      // This should show us what fields are required/missing

      // Check for issue_category specifically by looking at the error
      if (insertError.message.includes('issue_category')) {
        console.log('✅ issue_category field is recognized by database');
        return true;
      } else {
        console.log('❌ issue_category field not mentioned in validation error');
        return false;
      }
    }

    return true;

  } catch (error) {
    console.error('❌ Error checking schema:', error);
    return false;
  }
}

async function testBreakdownInsert() {
  console.log('\n🧪 Testing breakdown insert...\n');

  // Test the exact data structure from the /from-wizard endpoint
  const testData = {
    breakdown_id: `TEST-${Date.now()}`,
    wizard_type: 'oil-leak',
    wizard_decision: 'AMBER',
    wizard_assessment_data: { test: true },
    fleet_number: '7001',
    location_description: 'Test Location',
    reported_by_badge: 'AG003',
    reported_by_name: 'Test Supervisor',
    issue_category: 'Oil Leak Assessment',  // This is the problematic field
    issue_description: 'Test breakdown from schema verification',
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

  console.log('📋 Attempting insert with issue_category field...');

  try {
    const { data, error } = await supabase
      .from('breakdowns')
      .insert(testData)
      .select()
      .single();

    if (error) {
      console.error('❌ Insert failed with issue_category:', error);

      // Try the same insert but without issue_category
      console.log('\n🔄 Retrying without issue_category field...');
      const { issue_category, ...dataWithoutIssueCategory } = testData;

      const { data: data2, error: error2 } = await supabase
        .from('breakdowns')
        .insert(dataWithoutIssueCategory)
        .select()
        .single();

      if (error2) {
        console.error('❌ Insert failed without issue_category:', error2);
        return false;
      } else {
        console.log('✅ Insert successful WITHOUT issue_category!');
        console.log('📋 Created breakdown:', data2.breakdown_id);

        // Clean up
        await supabase
          .from('breakdowns')
          .delete()
          .eq('id', data2.id);

        console.log('🧹 Test data cleaned up');
        console.log('\n🔍 DIAGNOSIS: issue_category column does not exist in the database');
        return false; // Return false because the original problem still exists
      }
    }

    console.log('✅ Insert successful WITH issue_category!');
    console.log('📋 Created breakdown:', data.breakdown_id);

    // Clean up test data
    await supabase
      .from('breakdowns')
      .delete()
      .eq('id', data.id);

    console.log('🧹 Test data cleaned up');
    return true;

  } catch (error) {
    console.error('❌ Insert error:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting schema and API test...\n');

  const schemaOk = await checkDatabaseSchema();

  // Always run the insert test to diagnose the issue
  await testBreakdownInsert();

  console.log('\n✅ Test complete');
}

main().catch(console.error);