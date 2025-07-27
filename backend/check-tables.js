// check-tables.js
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

console.log('🔍 Checking available tables...');

const possibleTables = [
  'streetmanager_notifications',
  'streetworks', 
  'roadworks',
  'alerts',
  'street_manager_notifications',
  'streetmanager',
  'street_manager'
];

for (const tableName of possibleTables) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (!error && data) {
      console.log('✅ Found table:', tableName, 'with', Object.keys(data[0] || {}).length, 'columns');
      if (data[0]) {
        console.log('   Columns:', Object.keys(data[0]));
      }
    }
  } catch (e) {
    // Table doesn't exist, continue
  }
}

console.log('✅ Table check complete');