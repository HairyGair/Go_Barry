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

async function addMissingColumn() {
  console.log('🔧 Attempting to add missing issue_description column...\n');

  try {
    // First, let's try to query the column to see if it exists
    console.log('🔍 Checking if issue_description column exists...');

    const testData = {
      breakdown_id: `TEST-COLUMN-${Date.now()}`,
      fleet_no: '9999',
      supervisor_badge: 'TEST',
      supervisor_name: 'Test',
      location: 'Test Location',
      issue_category: 'test',
      description: 'Test record for column check',
      status: 'test',
      severity: 'test',
      wizard_decision: 'test',
      wizard_type: 'test',
      wizard_assessment_data: {},
      breakdown_source: 'test',
      priority_level: 3,
      engineering_required: false,
      replacement_vehicle_required: false,
      created_at: new Date().toISOString(),
      issue_description: 'Test description' // Try to include this
    };

    const { data, error } = await supabase
      .from('breakdowns')
      .insert(testData)
      .select()
      .single();

    if (error) {
      if (error.message && error.message.includes("Could not find the 'issue_description' column")) {
        console.log('❌ Column does not exist. Attempting to add it...');

        // Use the SQL command to add the column
        const { error: sqlError } = await supabase.rpc('add_issue_description_column');

        if (sqlError) {
          console.error('❌ Could not add column via RPC:', sqlError.message);
          console.log('\n📋 Manual SQL required. Run this in your Supabase SQL editor:');
          console.log('ALTER TABLE breakdowns ADD COLUMN issue_description TEXT;');
          return false;
        } else {
          console.log('✅ Column added successfully!');
          return true;
        }
      } else {
        console.error('❌ Different error occurred:', error.message);
        return false;
      }
    } else {
      console.log('✅ Column already exists and works!');
      // Clean up test data
      await supabase.from('breakdowns').delete().eq('id', data.id);
      return true;
    }

  } catch (err) {
    console.error('❌ Script error:', err.message);
    return false;
  }
}

// Run the script
addMissingColumn()
  .then(success => {
    if (success) {
      console.log('\n🎉 Database schema is ready! Try the wizard button again.');
    } else {
      console.log('\n❌ Manual intervention required. Add the column manually in Supabase.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });