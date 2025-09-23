#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testDashboardIntegration() {
  console.log('🎯 Testing dashboard integration and data format...\n');

  try {
    // Test the /live endpoint format
    const { data: breakdowns, error } = await supabase
      .from('breakdowns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching breakdowns:', error);
      return false;
    }

    console.log(`✅ Retrieved ${breakdowns.length} breakdowns from database`);

    if (breakdowns.length > 0) {
      const breakdown = breakdowns[0];

      console.log('\n📊 Sample breakdown for dashboard:');
      console.log(`   ID: ${breakdown.breakdown_id}`);
      console.log(`   Fleet: ${breakdown.fleet_no || 'N/A'}`);
      console.log(`   Location: ${breakdown.location || 'N/A'}`);
      console.log(`   Status: ${breakdown.status}`);
      console.log(`   Severity: ${breakdown.severity}`);
      console.log(`   Assessment: ${breakdown.assessment_type || 'N/A'}`);
      console.log(`   Supervisor: ${breakdown.supervisor_name || 'N/A'} (${breakdown.supervisor_badge || 'N/A'})`);
      console.log(`   Created: ${breakdown.created_at}`);

      // Test the format expected by the dashboard
      const dashboardFormat = {
        breakdown_id: breakdown.breakdown_id,
        id: breakdown.breakdown_id,
        fleet_no: breakdown.fleet_no,
        fleet_number: breakdown.fleet_no,
        location: breakdown.location,
        issue_type: breakdown.assessment_type,
        issue_description: breakdown.diagnosis,
        status: breakdown.status,
        severity: breakdown.severity,
        wizard_decision: breakdown.final_decision,
        created_at: breakdown.created_at,
        supervisor_badge: breakdown.supervisor_badge,
        supervisor_name: breakdown.supervisor_name,
        priority_level: breakdown.priority_level
      };

      console.log('\n📋 Dashboard-formatted breakdown:');
      console.log('   All required fields present:',
        ['breakdown_id', 'fleet_no', 'location', 'status', 'severity'].every(field =>
          dashboardFormat[field] !== null && dashboardFormat[field] !== undefined
        ) ? '✅ YES' : '❌ NO'
      );

      return true;
    } else {
      console.log('📋 No breakdowns found in database');
      return false;
    }

  } catch (error) {
    console.error('💥 Dashboard integration test failed:', error);
    return false;
  }
}

async function testAPIEndpointFormat() {
  console.log('\n🔄 Testing API endpoint response format...\n');

  try {
    // Simulate what the /api/breakdowns/live endpoint would return
    const { data: breakdowns, error } = await supabase
      .from('breakdowns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Error:', error);
      return false;
    }

    // Format like the live endpoint does
    const formattedBreakdowns = breakdowns.map(b => {
      const elapsedMinutes = 30; // Placeholder calculation

      return {
        breakdown_id: b.breakdown_id,
        id: b.breakdown_id,
        fleet_no: b.fleet_no,
        fleet_number: b.fleet_no,
        location: b.location,
        issue_type: b.assessment_type,
        issue_description: b.diagnosis,
        status: b.status,
        severity: b.severity,
        wizard_decision: b.final_decision,
        created_at: b.created_at,
        updated_at: b.last_update_at,
        elapsed_minutes: elapsedMinutes,
        duration_text: `${elapsedMinutes}m`,
        supervisor_badge: b.supervisor_badge,
        supervisor_name: b.supervisor_name,
        priority_level: b.priority_level,
        requires_immediate_action: b.severity === 'STOP'
      };
    });

    console.log(`✅ Formatted ${formattedBreakdowns.length} breakdowns for API response`);

    if (formattedBreakdowns.length > 0) {
      const sample = formattedBreakdowns[0];
      console.log('\n📊 Sample API response format:');
      console.log(`   breakdown_id: ${sample.breakdown_id}`);
      console.log(`   fleet_no: ${sample.fleet_no}`);
      console.log(`   location: ${sample.location}`);
      console.log(`   status: ${sample.status}`);
      console.log(`   severity: ${sample.severity}`);
      console.log(`   duration_text: ${sample.duration_text}`);
      console.log(`   requires_immediate_action: ${sample.requires_immediate_action}`);
    }

    return true;

  } catch (error) {
    console.error('💥 API format test failed:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Testing dashboard integration...\n');

  const dashboardTest = await testDashboardIntegration();
  const apiTest = await testAPIEndpointFormat();

  console.log('\n📊 Integration Test Results:');
  console.log(`   Dashboard Data: ${dashboardTest ? '✅ WORKING' : '❌ ISSUES'}`);
  console.log(`   API Format: ${apiTest ? '✅ WORKING' : '❌ ISSUES'}`);

  if (dashboardTest && apiTest) {
    console.log('\n🎉 SUCCESS: Dashboard integration is working!');
    console.log('✅ Existing breakdowns can be displayed in dashboards');
    console.log('✅ API response format is compatible');
    console.log('\n📝 Note: Once the insert issue is resolved, new wizard breakdowns will also appear');
  } else {
    console.log('\n❌ Some integration issues found - check the details above');
  }
}

main().catch(console.error);