#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testWorkingInsert() {
  console.log('🧪 Testing with data structure that matches existing records...\n');

  // Get the structure of an existing record to copy
  const { data: existing, error: existingError } = await supabase
    .from('breakdowns')
    .select('*')
    .limit(1);

  if (existingError || !existing || existing.length === 0) {
    console.error('❌ Could not fetch existing record:', existingError);
    return;
  }

  const template = existing[0];
  console.log('📋 Using existing record as template:', template.breakdown_id);

  // Create a new record based on the existing one but with new data
  const newBreakdown = {
    ...template,
    id: undefined, // Let database generate new ID
    breakdown_id: `TEST-WORKING-${Date.now()}`,

    // Update key fields
    wizard_type: 'oil-leak',
    assessment_type: 'Oil Leak',
    diagnosis: 'Oil leak assessment completed with AMBER decision',
    final_decision: 'AMBER',
    severity: 'AMBER',
    fleet_no: '7001',
    location: 'Test Location for API',
    supervisor_badge: 'AG003',
    supervisor_name: 'Anthony Gair',

    // Update timestamps
    created_at: new Date().toISOString(),
    diagnosed_at: new Date().toISOString(),
    decision_timestamp: new Date().toISOString(),
    last_update_at: new Date().toISOString(),

    // Reset editable fields
    edit_count: 0,
    is_editing: false
  };

  try {
    console.log('📤 Inserting breakdown with template structure...');

    const { data, error } = await supabase
      .from('breakdowns')
      .insert(newBreakdown)
      .select()
      .single();

    if (error) {
      console.error('❌ Insert failed:', error.message);
      return false;
    }

    console.log('✅ Insert successful!');
    console.log(`📋 Created breakdown: ${data.breakdown_id}`);
    console.log(`🆔 Database ID: ${data.id}`);
    console.log(`⚠️  Severity: ${data.severity}`);
    console.log(`🔧 Assessment type: ${data.assessment_type}`);

    // Clean up
    await supabase.from('breakdowns').delete().eq('id', data.id);
    console.log('🧹 Test data cleaned up');

    return true;

  } catch (error) {
    console.error('💥 Test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Testing working insert pattern...\n');

  const success = await testWorkingInsert();

  if (success) {
    console.log('\n🎉 SUCCESS: Found working insert pattern!');
    console.log('✅ This structure should work for the API endpoint');
  } else {
    console.log('\n❌ Still having issues with the insert');
  }
}

main().catch(console.error);