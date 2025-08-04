// Test Supabase connection
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import https from 'https';
import fetch from 'node-fetch';

// Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

console.log('🔍 Testing Supabase Connection...\n');

// Check environment variables
console.log('📋 Environment Check:');
console.log('  SUPABASE_URL:', process.env.SUPABASE_URL || '❌ MISSING');
console.log('  SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? `✅ SET (${process.env.SUPABASE_ANON_KEY.substring(0, 10)}...)` : '❌ MISSING');
console.log('');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables!');
  process.exit(1);
}

// Test basic HTTPS connectivity
console.log('🌐 Testing HTTPS connectivity...');
try {
  const testUrl = new URL(process.env.SUPABASE_URL);
  const agent = new https.Agent({
    rejectUnauthorized: false,
    timeout: 10000
  });
  
  const response = await fetch(testUrl.origin, {
    method: 'GET',
    agent,
    timeout: 10000
  });
  
  console.log(`  Status: ${response.status} ${response.statusText}`);
  console.log('  ✅ HTTPS connection successful\n');
} catch (error) {
  console.error('  ❌ HTTPS connection failed:', error.message);
  console.error('  Error type:', error.constructor.name);
  if (error.code) console.error('  Error code:', error.code);
  console.log('');
}

// Test Supabase client initialization
console.log('🔧 Testing Supabase client...');
try {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        fetch: fetch
      }
    }
  );
  
  console.log('  ✅ Supabase client created\n');
  
  // Test a simple query
  console.log('📊 Testing database query...');
  const { data, error, status } = await supabase
    .from('supervisors')
    .select('count')
    .limit(1);
  
  if (error) {
    console.error('  ❌ Query failed:', error.message);
    console.error('  Error code:', error.code);
    console.error('  Error hint:', error.hint);
  } else {
    console.log('  ✅ Query successful!');
    console.log('  Response status:', status);
  }
  
} catch (error) {
  console.error('  ❌ Supabase client error:', error.message);
  console.error('  Full error:', error);
}

console.log('\n✅ Test complete');
