// backend/test-api.js
// Test script to verify BARRY backend is working
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://go-barry.onrender.com' 
  : 'http://localhost:3001';

console.log('🧪 BARRY API Test Suite');
console.log(`🎯 Testing: ${BASE_URL}`);
console.log('=' * 50);

async function testEndpoint(name, url) {
  try {
    console.log(`\n🔍 Testing ${name}...`);
    console.log(`📡 URL: ${url}`);
    
    const startTime = Date.now();
    const response = await axios.get(url, { timeout: 10000 });
    const duration = Date.now() - startTime;
    
    console.log(`✅ ${name}: SUCCESS (${duration}ms)`);
    console.log(`📊 Status: ${response.status}`);
    console.log(`📦 Data type: ${typeof response.data}`);
    
    if (response.data) {
      if (response.data.alerts) {
        console.log(`🚨 Alerts: ${response.data.alerts.length}`);
        if (response.data.alerts.length > 0) {
          const alert = response.data.alerts[0];
          console.log(`📍 Sample alert: ${alert.title}`);
          console.log(`🗺️  Location: ${alert.location}`);
          console.log(`⚠️  Severity: ${alert.severity}`);
          console.log(`🔴 Status: ${alert.status}`);
        }
      }
      
      if (response.data.metadata) {
        console.log(`📊 Sources: ${Object.keys(response.data.metadata.sources || {}).length}`);
        const sources = response.data.metadata.sources || {};
        Object.entries(sources).forEach(([source, info]) => {
          console.log(`   ${source}: ${info.success ? '✅' : '❌'} (${info.count || 0} items)`);
        });
      }
      
      if (response.data.configuration) {
        console.log(`⚙️  Config: ${JSON.stringify(response.data.configuration)}`);
      }
    }
    
    return true;
  } catch (error) {
    console.log(`❌ ${name}: FAILED`);
    console.log(`💥 Error: ${error.message}`);
    if (error.response) {
      console.log(`📡 HTTP Status: ${error.response.status}`);
      console.log(`📦 Response: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

async function testNationalHighwaysAPI() {
  console.log('\n🛣️  Testing National Highways API directly...');
  
  const apiKey = process.env.NATIONAL_HIGHWAYS_API_KEY;
  if (!apiKey) {
    console.log('❌ No National Highways API key found');
    return false;
  }
  
  try {
    const response = await axios.get('https://api.data.nationalhighways.co.uk/roads/v2.0/closures', {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Accept': 'application/json'
      },
      timeout: 15000
    });
    
    console.log(`✅ National Highways API: SUCCESS`);
    console.log(`📊 Total features: ${response.data.features?.length || 0}`);
    
    // Check for North East data
    const northEastFeatures = response.data.features?.filter(feature => {
      const location = feature.properties?.location || '';
      return location.toUpperCase().includes('A1') || 
             location.toUpperCase().includes('A19') || 
             location.toUpperCase().includes('NEWCASTLE') ||
             location.toUpperCase().includes('SUNDERLAND') ||
             location.toUpperCase().includes('DURHAM');
    }) || [];
    
    console.log(`🎯 North East features: ${northEastFeatures.length}`);
    
    if (northEastFeatures.length > 0) {
      const sample = northEastFeatures[0];
      console.log(`📍 Sample: ${sample.properties?.title || sample.properties?.description}`);
      console.log(`🗺️  Location: ${sample.properties?.location}`);
    }
    
    return true;
  } catch (error) {
    console.log(`❌ National Highways API: FAILED`);
    console.log(`💥 Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('\n🚀 Starting API tests...\n');
  
  const tests = [
    { name: 'Root Endpoint', url: `${BASE_URL}/` },
    { name: 'Health Check', url: `${BASE_URL}/api/health` },
    { name: 'Main Alerts', url: `${BASE_URL}/api/alerts` },
    { name: 'Force Refresh', url: `${BASE_URL}/api/refresh` }
  ];
  
  let passedTests = 0;
  
  for (const test of tests) {
    const success = await testEndpoint(test.name, test.url);
    if (success) passedTests++;
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between tests
  }
  
  // Test National Highways API directly
  const nhSuccess = await testNationalHighwaysAPI();
  if (nhSuccess) passedTests++;
  
  console.log('\n' + '='.repeat(50));
  console.log(`🎯 Test Results: ${passedTests}/${tests.length + 1} passed`);
  
  if (passedTests === tests.length + 1) {
    console.log('🎉 All tests passed! Your backend is working correctly.');
    console.log(`\n📱 Try the app now with: ${BASE_URL}/api/alerts`);
  } else {
    console.log('⚠️  Some tests failed. Check the errors above.');
    
    console.log('\n🔧 Troubleshooting Tips:');
    console.log('1. Make sure your .env file has NATIONAL_HIGHWAYS_API_KEY');
    console.log('2. Check if the server is running on the correct port');
    console.log('3. Verify your API key is valid');
    console.log('4. Check network connectivity');
  }
  
  console.log('\n📋 Environment Info:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   PORT: ${process.env.PORT || '3001'}`);
  console.log(`   NH API Key: ${process.env.NATIONAL_HIGHWAYS_API_KEY ? 'Present' : 'Missing'}`);
}

// Run the tests
runTests().catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});