// Test script for One.Network scraper
import OneNetworkService from './services/oneNetworkService.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🧪 Testing One.Network scraper...');
console.log('📋 This will:');
console.log('   1. Launch a browser window');
console.log('   2. Log into One.Network');
console.log('   3. Navigate to Go North East regions');
console.log('   4. Click on roadwork markers');
console.log('   5. Extract and save data\n');

// Check environment variables
const hasSupabaseUrl = !!process.env.SUPABASE_URL;
const hasSupabaseKey = !!(process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY);

if (!hasSupabaseUrl || !hasSupabaseKey) {
  console.warn('\n⚠️  Warning: Supabase configuration incomplete!');
  if (!hasSupabaseUrl) console.warn('   Missing: SUPABASE_URL');
  if (!hasSupabaseKey) console.warn('   Missing: SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY');
  console.warn('\n📝 To save data to Supabase, add to your .env file:');
  console.warn('   SUPABASE_SERVICE_KEY=your_service_key');
  console.warn('\n🔄 Continuing in demo mode - data will be scraped but not saved.\n');
} else {
  console.log('✅ Supabase configuration found - data will be saved!');
}

async function test() {
  const service = new OneNetworkService();
  
  try {
    await service.run();
    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

test();
