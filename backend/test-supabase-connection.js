#!/usr/bin/env node
// test-supabase-connection.js
// Test Supabase connection and check if manual_incidents table exists

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');
    console.log('URL:', supabaseUrl);
    
    // Test basic connection
    const { data, error } = await supabase.auth.getSession();
    console.log('✅ Basic connection successful');
    
    // Check if manual_incidents table exists
    console.log('🔍 Checking if manual_incidents table exists...');
    const { data: incidentsData, error: incidentsError } = await supabase
      .from('manual_incidents')
      .select('*')
      .limit(1);
    
    if (incidentsError) {
      console.log('❌ manual_incidents table does not exist:', incidentsError.message);
      
      // Check what tables do exist
      console.log('🔍 Checking existing tables...');
      const { data: tablesData, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
      
      if (tablesError) {
        console.log('❌ Could not list tables:', tablesError.message);
      } else {
        console.log('📋 Available tables:');
        tablesData.forEach(table => console.log('  -', table.table_name));
      }
    } else {
      console.log('✅ manual_incidents table exists');
      console.log('📊 Records in table:', incidentsData.length);
    }
    
    // Test other existing tables
    console.log('🔍 Testing other tables...');
    const { data: supervisorData, error: supervisorError } = await supabase
      .from('supervisors')
      .select('*')
      .limit(1);
    
    if (supervisorError) {
      console.log('❌ supervisors table issue:', supervisorError.message);
    } else {
      console.log('✅ supervisors table accessible');
    }
    
    const { data: alertsData, error: alertsError } = await supabase
      .from('alerts')
      .select('*')
      .limit(1);
    
    if (alertsError) {
      console.log('❌ alerts table issue:', alertsError.message);
    } else {
      console.log('✅ alerts table accessible');
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
}

// Run the test
testSupabaseConnection().catch(console.error);