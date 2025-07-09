#!/usr/bin/env node
// create-manual-incidents-table.js
// Create the manual_incidents table by inserting a sample record and handling the error

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

async function createManualIncidentsTable() {
  console.log('🔧 Attempting to create manual_incidents table...');
  
  // Since we can't create tables directly through the API,
  // we'll need to provide instructions for manual creation
  
  console.log(`
📋 MANUAL INSTRUCTIONS:
  
Please run the following SQL in your Supabase SQL Editor:

--------------------------------------------------
-- Create manual_incidents table
--------------------------------------------------

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
  
  -- Supervisor tracking
  created_by TEXT NOT NULL,
  created_by_name TEXT NOT NULL,
  created_by_role TEXT NOT NULL,
  
  -- Enhancement data
  enhanced_with_tomtom BOOLEAN DEFAULT FALSE,
  tomtom_features JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Source tracking
  source TEXT NOT NULL DEFAULT 'manual',
  
  -- Cleanup tracking
  retention_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '3 months')
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_manual_incidents_status ON manual_incidents(status);
CREATE INDEX IF NOT EXISTS idx_manual_incidents_created_at ON manual_incidents(created_at);
CREATE INDEX IF NOT EXISTS idx_manual_incidents_retention_date ON manual_incidents(retention_date);
CREATE INDEX IF NOT EXISTS idx_manual_incidents_location ON manual_incidents(location);
CREATE INDEX IF NOT EXISTS idx_manual_incidents_created_by ON manual_incidents(created_by);
CREATE INDEX IF NOT EXISTS idx_manual_incidents_affected_routes ON manual_incidents USING GIN(affected_routes);

-- supervisor_actions table (for audit trail)
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

-- Indexes for supervisor actions
CREATE INDEX IF NOT EXISTS idx_supervisor_actions_supervisor_badge ON supervisor_actions(supervisor_badge);
CREATE INDEX IF NOT EXISTS idx_supervisor_actions_action_type ON supervisor_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_supervisor_actions_target_type ON supervisor_actions(target_type);
CREATE INDEX IF NOT EXISTS idx_supervisor_actions_target_id ON supervisor_actions(target_id);
CREATE INDEX IF NOT EXISTS idx_supervisor_actions_performed_at ON supervisor_actions(performed_at);

--------------------------------------------------

After running the above SQL, please run this script again to test the table.
  `);
  
  // Test if the table exists
  console.log('🔍 Testing if manual_incidents table exists...');
  
  const { data, error } = await supabase
    .from('manual_incidents')
    .select('*')
    .limit(1);
  
  if (error) {
    console.log('❌ Table does not exist yet. Please run the SQL above in Supabase SQL Editor.');
    console.log('🔗 Go to: https://supabase.com/dashboard/project/' + supabaseUrl.split('//')[1].split('.')[0] + '/sql');
    return false;
  } else {
    console.log('✅ manual_incidents table exists and is accessible!');
    
    // Test inserting a sample incident
    console.log('🧪 Testing incident insertion...');
    
    const testIncident = {
      id: 'test_incident_' + Date.now(),
      type: 'Traffic Incident',
      location: 'Test Location - A1 Southbound',
      description: 'Test incident for table validation',
      start_time: new Date().toISOString(),
      severity: 'Medium',
      status: 'active',
      created_by: 'test_system',
      created_by_name: 'Test System',
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
      console.error('❌ Test insertion failed:', insertError);
      return false;
    } else {
      console.log('✅ Test incident inserted successfully');
      console.log('📋 Incident ID:', insertData[0].id);
      
      // Clean up test incident
      const { error: deleteError } = await supabase
        .from('manual_incidents')
        .delete()
        .eq('id', testIncident.id);
      
      if (deleteError) {
        console.warn('⚠️ Could not clean up test incident:', deleteError.message);
      } else {
        console.log('🧹 Test incident cleaned up successfully');
      }
    }
    
    console.log('🎉 Database setup completed successfully!');
    console.log('');
    console.log('✅ The manual_incidents table is now ready for use.');
    console.log('✅ Auto-incident creation system can now store incidents.');
    console.log('✅ Incident Manager will now show stored incidents.');
    
    return true;
  }
}

// Run the script
createManualIncidentsTable().catch(console.error);