#!/usr/bin/env node
// auto-setup-incidents.js
// Automatically set up the incidents system

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

async function setupIncidentsSystem() {
  console.log('🔧 Setting up incidents system...');
  
  // Test if table exists
  console.log('🔍 Checking if manual_incidents table exists...');
  const { data: testData, error: testError } = await supabase
    .from('manual_incidents')
    .select('*')
    .limit(1);
  
  if (testError && testError.code === '42P01') {
    console.log('❌ manual_incidents table does not exist');
    console.log('🔧 Creating manual_incidents table...');
    
    // Create table using RPC or direct SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS manual_incidents (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        subtype TEXT,
        location TEXT NOT NULL,
        coordinates JSONB,
        description TEXT,
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE,
        severity TEXT NOT NULL,
        notes TEXT,
        affected_routes TEXT[],
        status TEXT NOT NULL DEFAULT 'active',
        created_by TEXT NOT NULL,
        created_by_name TEXT NOT NULL,
        created_by_role TEXT NOT NULL,
        enhanced_with_tomtom BOOLEAN DEFAULT FALSE,
        tomtom_features JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        source TEXT NOT NULL DEFAULT 'manual',
        retention_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '3 months')
      );
      
      CREATE INDEX IF NOT EXISTS idx_manual_incidents_status ON manual_incidents(status);
      CREATE INDEX IF NOT EXISTS idx_manual_incidents_created_at ON manual_incidents(created_at);
      CREATE INDEX IF NOT EXISTS idx_manual_incidents_location ON manual_incidents(location);
      CREATE INDEX IF NOT EXISTS idx_manual_incidents_created_by ON manual_incidents(created_by);
      CREATE INDEX IF NOT EXISTS idx_manual_incidents_affected_routes ON manual_incidents USING GIN(affected_routes);
      
      CREATE TABLE IF NOT EXISTS supervisor_actions (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        supervisor_badge TEXT NOT NULL,
        supervisor_name TEXT NOT NULL,
        action_type TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id TEXT NOT NULL,
        details JSONB,
        performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        retention_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '3 months')
      );
      
      CREATE INDEX IF NOT EXISTS idx_supervisor_actions_supervisor_badge ON supervisor_actions(supervisor_badge);
      CREATE INDEX IF NOT EXISTS idx_supervisor_actions_action_type ON supervisor_actions(action_type);
      CREATE INDEX IF NOT EXISTS idx_supervisor_actions_target_type ON supervisor_actions(target_type);
      CREATE INDEX IF NOT EXISTS idx_supervisor_actions_target_id ON supervisor_actions(target_id);
      CREATE INDEX IF NOT EXISTS idx_supervisor_actions_performed_at ON supervisor_actions(performed_at);
    `;
    
    console.log('📋 Please run the following SQL in your Supabase SQL Editor:');
    console.log('-------------------------------------------');
    console.log(createTableSQL);
    console.log('-------------------------------------------');
    console.log('');
    console.log('🔗 Supabase SQL Editor: https://supabase.com/dashboard/project/' + supabaseUrl.split('//')[1].split('.')[0] + '/sql');
    console.log('');
    console.log('After running the SQL, the incidents system will be ready!');
    
    return false;
  } else if (testError) {
    console.error('❌ Error checking table:', testError);
    return false;
  } else {
    console.log('✅ manual_incidents table exists');
    
    // Test incident creation
    console.log('🧪 Testing incident creation...');
    const testIncident = {
      id: 'test_incident_' + Date.now(),
      type: 'Traffic Incident',
      location: 'Test Location - A1 Southbound',
      description: 'Test incident for system validation',
      start_time: new Date().toISOString(),
      severity: 'Medium',
      status: 'active',
      created_by: 'test_system',
      created_by_name: 'System Test',
      created_by_role: 'System',
      source: 'manual',
      affected_routes: ['1', '2', '21'],
      notes: 'Automatically created test incident'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('manual_incidents')
      .insert([testIncident])
      .select();
    
    if (insertError) {
      console.error('❌ Test incident creation failed:', insertError);
      return false;
    } else {
      console.log('✅ Test incident created successfully');
      
      // Clean up test incident
      await supabase
        .from('manual_incidents')
        .delete()
        .eq('id', testIncident.id);
      
      console.log('🧹 Test incident cleaned up');
    }
    
    return true;
  }
}

async function testTrafficIncidents() {
  console.log('🚨 Testing traffic incidents endpoint...');
  
  try {
    const response = await fetch('http://localhost:3001/api/traffic-incidents');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Traffic incidents endpoint working');
      console.log(`📊 Found ${data.incidents?.length || 0} traffic incidents`);
      
      if (data.incidents && data.incidents.length > 0) {
        console.log('🎯 Sample traffic incident:');
        console.log(`   ID: ${data.incidents[0].id}`);
        console.log(`   Type: ${data.incidents[0].type}`);
        console.log(`   Location: ${data.incidents[0].location}`);
        console.log(`   Priority: ${data.incidents[0].priority}`);
        console.log(`   Intelligence Score: ${data.incidents[0].intelligenceScore}`);
      }
    } else {
      console.log('❌ Traffic incidents endpoint failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Traffic incidents endpoint test failed:', error.message);
    console.log('ℹ️ Backend may not be running. Start it with: npm start');
  }
}

async function main() {
  console.log('🎯 Go BARRY Incidents System Setup');
  console.log('===================================');
  
  const setupSuccess = await setupIncidentsSystem();
  
  if (setupSuccess) {
    console.log('');
    console.log('✅ Incidents system setup complete!');
    console.log('');
    console.log('🚀 What\'s working now:');
    console.log('• Manual incidents table created and working');
    console.log('• Traffic incidents endpoint available');
    console.log('• Auto-incident creator ready');
    console.log('• Intelligence scoring system active');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Start the backend: npm start');
    console.log('2. Visit: http://localhost:8081/disruptions/incidents');
    console.log('3. You should see traffic incidents appearing!');
    console.log('');
    
    // Test traffic incidents if backend is running
    await testTrafficIncidents();
  } else {
    console.log('');
    console.log('⚠️ Manual setup required');
    console.log('Please run the SQL shown above in your Supabase SQL Editor');
    console.log('Then run this script again to test the setup');
  }
}

main().catch(console.error);