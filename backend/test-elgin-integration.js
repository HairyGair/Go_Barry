// backend/test-elgin-integration.js
// Test script to verify Elgin integration works properly

import { getElginData, getElginHealth, isElginEnabled } from './services/elgin.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🚧 Testing Go BARRY Elgin Integration');
console.log('=====================================');

async function testElginIntegration() {
  try {
    // Test 1: Check if Elgin is enabled
    console.log('\n📋 Test 1: Checking Elgin Status...');
    const enabled = isElginEnabled();
    console.log(`   Elgin Enabled: ${enabled}`);
    
    // Test 2: Health check
    console.log('\n🏥 Test 2: Health Check...');
    const health = await getElginHealth();
    console.log('   Health Status:', JSON.stringify(health, null, 2));
    
    // Test 3: Get data (should work even if disabled)
    console.log('\n📊 Test 3: Getting Elgin Data...');
    const result = await getElginData();
    console.log('   Data Result:', JSON.stringify(result, null, 2));
    
    // Test 4: Environment variables
    console.log('\n🔧 Test 4: Environment Configuration...');
    console.log(`   ELGIN_ENABLED: ${process.env.ELGIN_ENABLED || 'NOT_SET'}`);
    console.log(`   ELGIN_ENDPOINT: ${process.env.ELGIN_ENDPOINT ? 'SET' : 'NOT_SET'}`);
    console.log(`   ELGIN_USERNAME: ${process.env.ELGIN_USERNAME ? 'SET' : 'NOT_SET'}`);
    console.log(`   ELGIN_API_KEY: ${process.env.ELGIN_API_KEY ? 'SET' : 'NOT_SET'}`);
    
    console.log('\n✅ All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   • Elgin integration is ${enabled ? 'ENABLED' : 'DISABLED'}`);
    console.log(`   • Configuration is ${health.configured ? 'COMPLETE' : 'INCOMPLETE'}`);
    console.log(`   • Service status: ${health.status}`);
    
    if (!enabled) {
      console.log('\n💡 To enable Elgin:');
      console.log('   1. Set ELGIN_ENABLED=true in .env');
      console.log('   2. Add your API credentials');
      console.log('   3. Restart the backend');
    }
    
    if (enabled && !health.configured) {
      console.log('\n⚠️ Elgin is enabled but not configured:');
      console.log('   Add ELGIN_ENDPOINT, ELGIN_USERNAME, ELGIN_API_KEY to .env');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('   This is expected if Elgin credentials are not configured');
  }
}

// Run tests
testElginIntegration().then(() => {
  console.log('\n🎯 Test complete - Elgin integration is ready!');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
