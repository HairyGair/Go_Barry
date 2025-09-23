#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkStatusValues() {
  console.log('🔍 Checking valid status values...\n');

  try {
    // Get unique status values from existing data
    const { data: breakdowns, error } = await supabase
      .from('breakdowns')
      .select('status, severity, final_decision')
      .limit(10);

    if (error) {
      console.error('❌ Error fetching breakdowns:', error);
      return;
    }

    console.log('📊 Sample status values from existing breakdowns:');
    const uniqueStatuses = [...new Set(breakdowns.map(b => b.status))];
    const uniqueSeverities = [...new Set(breakdowns.map(b => b.severity))];
    const uniqueDecisions = [...new Set(breakdowns.map(b => b.final_decision))];

    console.log('   Status values:', uniqueStatuses);
    console.log('   Severity values:', uniqueSeverities);
    console.log('   Final decision values:', uniqueDecisions);

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

async function testValidStatusValues() {
  console.log('\n🧪 Testing different status values...\n');

  const statusesToTest = [
    'received', 'active', 'pending', 'in_progress', 'resolved', 'cleared', 'closed'
  ];

  for (const status of statusesToTest) {
    try {
      const testData = {
        breakdown_id: `STATUS-TEST-${status}-${Date.now()}`,
        status: status,
        severity: 'AMBER',
        fleet_no: '7001',
        location: 'Test Location',
        supervisor_badge: 'AG003',
        supervisor_name: 'Test User',
        assessment_type: 'Test',
        diagnosis: 'Test diagnosis',
        final_decision: 'AMBER',
        priority_level: 2,
        breakdown_source: 'wizard',
        engineering_required: false,
        replacement_vehicle_required: false,
        created_at: new Date().toISOString(),
        diagnosed_at: new Date().toISOString(),
        decision_timestamp: new Date().toISOString(),
        last_update_at: new Date().toISOString(),
        depot_id: 'SDC',
        dvsa_reportable: false,
        safety_critical: false,
        service_disruption: true,
        passengers_affected: 0,
        estimated_cost: 0,
        edit_count: 0,
        is_editing: false,
        wizard_progress: 100,
        step_data: '{}',
        wizard_responses: {}
      };

      const { data, error } = await supabase
        .from('breakdowns')
        .insert(testData)
        .select()
        .single();

      if (error) {
        console.log(`❌ Status '${status}': ${error.message}`);
      } else {
        console.log(`✅ Status '${status}': Valid`);
        // Clean up
        await supabase.from('breakdowns').delete().eq('id', data.id);
      }

    } catch (err) {
      console.log(`💥 Status '${status}': ${err.message}`);
    }
  }
}

async function main() {
  await checkStatusValues();
  await testValidStatusValues();
}

main().catch(console.error);