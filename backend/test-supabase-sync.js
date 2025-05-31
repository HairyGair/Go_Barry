// backend/test-supabase-sync.js
// Simplified test script to debug SupaBase connection

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Testing SupaBase connection...');

// Check environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

console.log('Environment check:');
console.log('SUPABASE_URL:', SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_SERVICE_KEY:', SUPABASE_SERVICE_KEY ? '✅ Set' : '❌ Missing');

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SupaBase configuration!');
  console.log('\nPlease add to your .env file:');
  console.log('SUPABASE_URL=https://your-project-id.supabase.co');
  console.log('SUPABASE_SERVICE_KEY=your-service-role-key-here');
  process.exit(1);
}

// Create SupaBase client
console.log('🔗 Creating SupaBase client...');
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test connection
async function testConnection() {
  try {
    console.log('📊 Testing database connection...');
    
    const { data, error, count } = await supabase
      .from('traffic_alerts')
      .select('*', { count: 'exact' })
      .limit(5);

    if (error) {
      console.error('❌ Database error:', error.message);
      return false;
    }

    console.log(`✅ Connected! Found ${count} alerts in database`);
    console.log('Sample alerts:');
    data.forEach((alert, index) => {
      console.log(`  ${index + 1}. ${alert.title} (${alert.type}, ${alert.status})`);
    });

    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

// Test insert
async function testInsert() {
  try {
    console.log('📝 Testing insert capability...');
    
    const testAlert = {
      external_id: `test_${Date.now()}`,
      title: 'Test Alert - Can be deleted',
      description: 'This is a test alert created by the sync script test',
      location: 'Test Location, Newcastle',
      authority: 'Test Authority',
      type: 'roadwork',
      severity: 'Low',
      status: 'green',
      source: 'manual',
      affects_routes: ['TEST'],
      last_updated: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('traffic_alerts')
      .insert(testAlert)
      .select()
      .single();

    if (error) {
      console.error('❌ Insert test failed:', error.message);
      return false;
    }

    console.log('✅ Insert test successful:', data.title);
    
    // Clean up test alert
    await supabase
      .from('traffic_alerts')
      .delete()
      .eq('id', data.id);
    
    console.log('🧹 Test alert cleaned up');
    return true;
  } catch (error) {
    console.error('❌ Insert test failed:', error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting SupaBase tests...\n');
  
  const connectionOk = await testConnection();
  if (!connectionOk) {
    console.log('\n❌ Connection test failed. Please check:');
    console.log('1. SupaBase URL is correct');
    console.log('2. Service role key is correct');
    console.log('3. traffic_alerts table exists');
    console.log('4. Internet connection is working');
    process.exit(1);
  }

  console.log('');
  const insertOk = await testInsert();
  if (!insertOk) {
    console.log('\n❌ Insert test failed. Please check:');
    console.log('1. Service role key has write permissions');
    console.log('2. Row Level Security policies allow service role');
    console.log('3. Table schema is correct');
    process.exit(1);
  }

  console.log('\n✅ All tests passed! SupaBase is ready for sync.');
  console.log('You can now run: node supabase-sync.js sync');
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test script error:', error);
  process.exit(1);
});