#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

console.log('Testing exact webhook record format...');

// Get the existing successful record to copy its structure
const { data: existing, error: fetchError } = await supabase
  .from('roadworks')
  .select('*')
  .eq('source', 'street_manager')
  .limit(1);

if (fetchError || !existing || existing.length === 0) {
  console.log('❌ Could not fetch existing record:', fetchError?.message);
  process.exit(1);
}

console.log('📋 Existing record found - analyzing...');
const existingRecord = existing[0];

// Create a new record with the same structure but different data
const testRecord = {
  ...existingRecord,
  id: 'test_mimic_' + Date.now(),
  title: 'Test Mimic Record',
  description: 'Testing by mimicking existing record structure',
  location: 'Test Location, Newcastle',
  routes_affected: ['99'],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  last_updated: new Date().toISOString(),
  processed_at: new Date().toISOString()
};

console.log('🧪 Attempting insert with mimicked structure...');

try {
  const { data, error } = await supabase
    .from('roadworks')
    .insert(testRecord)
    .select();
  
  if (error) {  
    console.log('❌ Mimic insert failed:', error.message);
    console.log('Error code:', error.code);
    
    // Try without some fields that might be causing issues
    console.log('🔄 Trying with minimal fields...');
    const minimalRecord = {
      id: 'test_minimal_' + Date.now(),
      title: testRecord.title,
      description: testRecord.description,
      location: testRecord.location,
      status: testRecord.status,
      severity: testRecord.severity,
      type: testRecord.type,
      source: testRecord.source,
      created_by_supervisor_id: testRecord.created_by_supervisor_id,
      created_by_name: testRecord.created_by_name,
      routes_affected: testRecord.routes_affected,
      email_sent: testRecord.email_sent,
      all_day: testRecord.all_day
    };
    
    const { data: minData, error: minError } = await supabase
      .from('roadworks')
      .insert(minimalRecord)
      .select();
      
    if (minError) {
      console.log('❌ Minimal insert also failed:', minError.message);
    } else {
      console.log('✅ Minimal insert successful!');
      // Clean up
      await supabase.from('roadworks').delete().eq('id', minimalRecord.id);
      console.log('✅ Cleaned up minimal record');
    }
    
  } else {
    console.log('✅ Mimic insert successful!');
    console.log('Record ID:', data[0].id);
    
    // Clean up
    await supabase.from('roadworks').delete().eq('id', testRecord.id);
    console.log('✅ Cleaned up mimic record');
  }
} catch (e) {
  console.log('❌ Test failed:', e.message);
}