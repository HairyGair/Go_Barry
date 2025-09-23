#!/usr/bin/env node

/**
 * Test Wizard-to-Dashboard Integration
 *
 * This script tests the wizard-to-dashboard integration by:
 * 1. Creating a test breakdown via the wizard endpoint
 * 2. Retrieving it via the dashboard endpoint
 * 3. Verifying all fields are present and correct
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test data for creating a breakdown
const testBreakdownData = {
  wizard_type: 'steering_system',
  wizard_decision: 'AMBER',
  wizard_assessment_data: {
    step1: { question: 'Can you turn the steering wheel?', answer: 'Yes, but with difficulty' },
    step2: { question: 'Any unusual noises?', answer: 'Grinding noise when turning' },
    step3: { question: 'Vehicle stability?', answer: 'Some vibration' }
  },
  fleet_number: '7001',
  location: 'Newcastle Central Station',
  location_coords: { lat: 54.9783, lng: -1.6178 },
  w3w_location: 'index.home.raft',
  supervisor_badge: 'AG003',
  supervisor_name: 'Anthony Gair',
  issue_category: 'Steering System',
  issue_description: 'Grinding noise when turning steering wheel, some vibration felt through vehicle',
  severity: 'AMBER',
  priority_level: 2,
  engineering_required: true,
  replacement_vehicle_required: false
};

async function checkDatabaseStructure() {
  console.log('\n🔍 Checking database structure...');

  try {
    // Check if sdc_dashboard_breakdowns view exists
    const { data, error } = await supabase
      .from('sdc_dashboard_breakdowns')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ sdc_dashboard_breakdowns view missing or inaccessible:', error.message);
      return false;
    }

    console.log('✅ sdc_dashboard_breakdowns view exists and accessible');
    return true;
  } catch (err) {
    console.error('❌ Database structure check failed:', err.message);
    return false;
  }
}

async function testWizardEndpoint() {
  console.log('\n🧙 Testing wizard endpoint...');

  try {
    const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3001'}/api/breakdowns/from-wizard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testBreakdownData)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Wizard endpoint failed:', result.error || result.message);
      console.error('Details:', result.details);
      return null;
    }

    console.log('✅ Wizard endpoint successful');
    console.log(`📋 Created breakdown: ${result.breakdown_id}`);
    return result.breakdown_id;

  } catch (err) {
    console.error('❌ Wizard endpoint test failed:', err.message);
    return null;
  }
}

async function testDashboardEndpoint() {
  console.log('\n📊 Testing dashboard endpoint...');

  try {
    const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3001'}/api/breakdowns/live`);
    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Dashboard endpoint failed:', result.error || result.message);
      return null;
    }

    console.log('✅ Dashboard endpoint successful');
    console.log(`📊 Found ${result.count} breakdowns`);

    if (result.breakdowns && result.breakdowns.length > 0) {
      console.log('📋 Sample breakdown from dashboard:');
      const sample = result.breakdowns[0];
      console.log(`   ID: ${sample.breakdown_id}`);
      console.log(`   Fleet: ${sample.fleet_no || sample.fleet_number}`);
      console.log(`   Location: ${sample.location}`);
      console.log(`   Issue: ${sample.issue_type} - ${sample.issue_description}`);
      console.log(`   Status: ${sample.status} (${sample.severity})`);
      console.log(`   Duration: ${sample.duration_text}`);
    }

    return result.breakdowns;

  } catch (err) {
    console.error('❌ Dashboard endpoint test failed:', err.message);
    return null;
  }
}

async function verifyBreakdownFields(breakdownId) {
  console.log(`\n🔍 Verifying breakdown fields for: ${breakdownId}`);

  try {
    // Check via direct database query
    const { data, error } = await supabase
      .from('sdc_dashboard_breakdowns')
      .select('*')
      .eq('breakdown_id', breakdownId)
      .single();

    if (error) {
      console.error('❌ Failed to retrieve breakdown from view:', error.message);
      return false;
    }

    console.log('✅ Breakdown found in dashboard view');

    // Check required fields
    const requiredFields = [
      'breakdown_id', 'fleet_no', 'location', 'issue_category',
      'issue_description', 'status', 'severity', 'priority_level',
      'supervisor_badge', 'supervisor_name', 'card_title', 'status_color'
    ];

    const missingFields = [];
    const presentFields = [];

    requiredFields.forEach(field => {
      if (data[field] !== null && data[field] !== undefined) {
        presentFields.push(field);
      } else {
        missingFields.push(field);
      }
    });

    console.log(`✅ Present fields (${presentFields.length}): ${presentFields.join(', ')}`);

    if (missingFields.length > 0) {
      console.log(`⚠️  Missing fields (${missingFields.length}): ${missingFields.join(', ')}`);
    }

    console.log('\n📋 Complete breakdown record:');
    console.log(JSON.stringify(data, null, 2));

    return missingFields.length === 0;

  } catch (err) {
    console.error('❌ Field verification failed:', err.message);
    return false;
  }
}

async function cleanupTestData(breakdownId) {
  console.log(`\n🧹 Cleaning up test data: ${breakdownId}`);

  try {
    const { error } = await supabase
      .from('breakdowns')
      .delete()
      .eq('breakdown_id', breakdownId);

    if (error) {
      console.error('❌ Failed to cleanup test data:', error.message);
      return false;
    }

    console.log('✅ Test data cleaned up successfully');
    return true;

  } catch (err) {
    console.error('❌ Cleanup failed:', err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting wizard-to-dashboard integration test');
  console.log(`📍 API Base URL: ${process.env.API_BASE_URL || 'http://localhost:3001'}`);

  let testsPassed = 0;
  let totalTests = 5;

  // Test 1: Check database structure
  const structureOK = await checkDatabaseStructure();
  if (structureOK) testsPassed++;

  // Test 2: Test wizard endpoint
  const breakdownId = await testWizardEndpoint();
  if (breakdownId) testsPassed++;

  // Test 3: Test dashboard endpoint
  const dashboardData = await testDashboardEndpoint();
  if (dashboardData) testsPassed++;

  // Test 4: Verify breakdown fields (if we created one)
  let fieldsOK = false;
  if (breakdownId) {
    fieldsOK = await verifyBreakdownFields(breakdownId);
    if (fieldsOK) testsPassed++;
  }

  // Test 5: Cleanup test data
  let cleanupOK = false;
  if (breakdownId) {
    cleanupOK = await cleanupTestData(breakdownId);
    if (cleanupOK) testsPassed++;
  }

  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Tests passed: ${testsPassed}/${totalTests}`);
  console.log(`❌ Tests failed: ${totalTests - testsPassed}/${totalTests}`);

  if (testsPassed === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ Wizard-to-dashboard integration is working correctly');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED');
    console.log('🔧 Please review the errors above and fix the issues');

    if (!structureOK) {
      console.log('   → Run the schema fix script first');
    }
    if (!breakdownId) {
      console.log('   → Check wizard endpoint and database columns');
    }
    if (!fieldsOK) {
      console.log('   → Verify all required fields are in the view');
    }
  }

  process.exit(testsPassed === totalTests ? 0 : 1);
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main, checkDatabaseStructure, testWizardEndpoint, testDashboardEndpoint };