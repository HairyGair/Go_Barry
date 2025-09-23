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
    // Check if tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');

    if (tablesError) {
      console.error('❌ Error fetching tables:', tablesError);
      return false;
    }

    console.log('📊 Available tables:');
    tables.forEach(table => console.log(`   - ${table.table_name}`));
    console.log('');

    // Check breakdowns table structure specifically
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'breakdowns')
      .order('ordinal_position');

    if (columnsError) {
      console.error('❌ Error fetching breakdowns table columns:', columnsError);
      return false;
    }

    console.log('🏗️  Breakdowns table structure:');
    columns.forEach(col => {
      console.log(`   ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    console.log('');

    // Check if issue_category column exists
    const hasIssueCategory = columns.some(col => col.column_name === 'issue_category');
    console.log(`🔍 issue_category column exists: ${hasIssueCategory ? '✅ YES' : '❌ NO'}`);

    return hasIssueCategory;

  } catch (error) {
    console.error('❌ Error checking schema:', error);
    return false;
  }
}

async function testBreakdownInsert() {
  console.log('\n🧪 Testing breakdown insert...\n');

  const testData = {
    breakdown_id: `TEST-${Date.now()}`,
    wizard_type: 'oil-leak',
    wizard_decision: 'AMBER',
    wizard_assessment_data: { test: true },
    fleet_number: '7001',
    location_description: 'Test Location',
    reported_by_badge: 'AG003',
    reported_by_name: 'Test Supervisor',
    issue_category: 'Oil Leak Assessment',
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

  try {
    const { data, error } = await supabase
      .from('breakdowns')
      .insert(testData)
      .select()
      .single();

    if (error) {
      console.error('❌ Insert failed:', error);
      return false;
    }

    console.log('✅ Insert successful!');
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
  if (schemaOk) {
    await testBreakdownInsert();
  } else {
    console.log('❌ Schema check failed - skipping insert test');
  }

  console.log('\n✅ Test complete');
}

main().catch(console.error);