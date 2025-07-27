#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

console.log('Checking for existing tables with similar names...');

// Check various possible table names
const possibleNames = [
  'streetmanager_notifications',
  'street_manager_notifications', 
  'streetmanager',
  'roadworks',
  'alerts'
];

for (const tableName of possibleNames) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (!error) {
      console.log('✅ Found table:', tableName, '- Records:', data?.length || 0);
    } else if (!error.message.includes('does not exist')) {
      console.log('⚠️ Table', tableName, 'access issue:', error.message);
    }
  } catch (e) {
    // Table doesn't exist, skip
  }
}

console.log('\nChecking existing alerts table structure...');
try {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .limit(1);
  
  if (!error && data && data[0]) {
    console.log('✅ Alerts table exists');
    console.log('Sample structure:', Object.keys(data[0]).join(', '));
  }
} catch (e) {
  console.log('❌ Could not access alerts table');
}