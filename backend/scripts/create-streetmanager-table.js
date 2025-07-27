#!/usr/bin/env node
// Script to create the missing streetmanager_notifications table

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'missing-url',
  process.env.SUPABASE_SERVICE_KEY || 'missing-key'
);

const createTableSQL = `
CREATE TABLE IF NOT EXISTS streetmanager_notifications (
  notification_id TEXT PRIMARY KEY,
  webhook_received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_webhook_data JSONB,
  permit_reference_number TEXT,
  street_name TEXT,
  area TEXT,
  town TEXT,
  activity_type TEXT,
  work_status TEXT,
  traffic_management_type TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  location_description TEXT,
  coordinates JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_streetmanager_webhook_received ON streetmanager_notifications(webhook_received_at DESC);
CREATE INDEX IF NOT EXISTS idx_streetmanager_permit_ref ON streetmanager_notifications(permit_reference_number);
CREATE INDEX IF NOT EXISTS idx_streetmanager_work_status ON streetmanager_notifications(work_status);
CREATE INDEX IF NOT EXISTS idx_streetmanager_dates ON streetmanager_notifications(start_date, end_date);

-- Add RLS policy
ALTER TABLE streetmanager_notifications ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since this is backend-only)
CREATE POLICY IF NOT EXISTS "Allow all operations on streetmanager_notifications" 
ON streetmanager_notifications 
FOR ALL 
USING (true) 
WITH CHECK (true);
`;

async function createTable() {
  console.log('🔧 Creating streetmanager_notifications table...');
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (error) {
      console.error('❌ Error creating table:', error);
      
      // Try alternative method - direct SQL execution
      console.log('🔄 Trying alternative method...');
      const { error: altError } = await supabase
        .from('streetmanager_notifications')
        .select('notification_id')
        .limit(1);
      
      if (altError && altError.code === '42P01') {
        console.log('💡 Please run this SQL manually in Supabase:');
        console.log(createTableSQL);
        process.exit(1);
      } else {
        console.log('✅ Table already exists or was created successfully');
      }
    } else {
      console.log('✅ Table created successfully');
      console.log('Data:', data);
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.log('💡 Please run this SQL manually in Supabase:');
    console.log(createTableSQL);
    process.exit(1);
  }
}

createTable();