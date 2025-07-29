// Simple test to check Supabase connection
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

console.log('Testing Supabase connection...');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

try {
  console.log('\n📊 Querying streetworks table...');
  const { data, error, count } = await supabase
    .from('streetworks')
    .select('*', { count: 'exact' })
    .limit(5);
  
  if (error) {
    console.error('❌ Query error:', error);
  } else {
    console.log(`✅ Found ${count} total streetworks records`);
    console.log('\n📋 Sample records:');
    data.forEach((record, i) => {
      console.log(`\n${i + 1}. ${record.sm_promoter_name || 'Unknown'}`);
      console.log(`   Location: ${record.sm_street_name}, ${record.sm_area_name}`);
      console.log(`   Works: ${record.sm_works_description}`);
      console.log(`   Status: ${record.status}`);
    });
  }
} catch (err) {
  console.error('❌ Connection error:', err);
}

process.exit(0);
