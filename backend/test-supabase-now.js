#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

console.log('Testing Supabase connection...\n');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl);
console.log('Key (first 20 chars):', supabaseKey?.substring(0, 20) + '...');

try {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Try to select from supervisors table
  const { data, error } = await supabase
    .from('supervisors')
    .select('count')
    .limit(1);
  
  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('✅ Connection successful!');
    console.log('Result:', data);
  }
  
} catch (err) {
  console.error('❌ Failed:', err.message);
}

process.exit(0);
