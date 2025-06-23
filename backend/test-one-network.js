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

// Check required environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_KEY');
  process.exit(1);
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
