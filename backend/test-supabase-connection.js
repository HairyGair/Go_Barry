#!/usr/bin/env node

/**
 * Simple Supabase Connection Test
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔗 Testing Supabase Connection...\n');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('Environment variables:');
console.log('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('SUPABASE_ANON_KEY:', supabaseKey ? 'Set (length: ' + supabaseKey.length + ')' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

console.log('\n📍 Supabase URL:', supabaseUrl);

try {
  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase client created successfully');
  
  // Test basic connection
  console.log('\n🔍 Testing basic query...');
  const { data, error } = await supabase
    .from('_test_table_that_doesnt_exist')
    .select('*')
    .limit(1);
  
  // We expect this to fail with "does not exist" - that means connection works
  if (error) {
    if (error.message.includes('does not exist') || error.message.includes('relation') || error.message.includes('table')) {
      console.log('✅ Connection successful! (Expected table error)');
      console.log('📝 Error message:', error.message);
      process.exit(0);
    } else {
      console.log('❌ Unexpected error:', error);
      process.exit(1);
    }
  } else {
    console.log('✅ Connection successful!');
    process.exit(0);
  }
  
} catch (err) {
  console.error('❌ Connection failed:', err.message);
  console.error('Full error:', err);
  process.exit(1);
}
