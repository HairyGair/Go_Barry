#!/usr/bin/env node
// Backend API Test Script - Diagnose Go BARRY data issues
import dotenv from 'dotenv';
import { fetchTomTomTrafficWithStreetNames } from './services/tomtom.js';
import { fetchMapQuestTrafficWithStreetNames } from './services/mapquest.js';
import { fetchHERETraffic } from './services/here.js';
import { fetchNationalHighways } from './services/nationalHighways.js';

dotenv.config();

console.log('🚦 BARRY Backend API Diagnostic Test');
console.log('===================================\n');

// Check environment variables
console.log('🔑 API Keys Configuration:');
console.log(`  TomTom API Key: ${process.env.TOMTOM_API_KEY ? '✅ Configured' : '❌ Missing'}`);
console.log(`  MapQuest API Key: ${process.env.MAPQUEST_API_KEY ? '✅ Configured' : '❌ Missing'}`);
console.log(`  HERE API Key: ${process.env.HERE_API_KEY ? '✅ Configured' : '❌ Missing'}`);
console.log(`  National Highways API Key: ${process.env.NATIONAL_HIGHWAYS_API_KEY ? '✅ Configured' : '❌ Missing'}`);
console.log(`  Mapbox Token: ${process.env.MAPBOX_TOKEN ? '✅ Configured' : '❌ Missing'}\n`);

// Test functions
async function testTomTomAPI() {
  console.log('🚗 Testing TomTom Traffic API...');
  try {
    const result = await fetchTomTomTrafficWithStreetNames();
    console.log(`  Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`  Data Count: ${result.data ? result.data.length : 0} alerts`);
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
    if (result.success && result.data && result.data.length > 0) {
      console.log(`  Sample Alert: ${result.data[0].title || 'No title'}`);
      console.log(`  Sample Location: ${result.data[0].location || 'No location'}`);
    }
    return result;
  } catch (error) {
    console.log(`  Status: ❌ EXCEPTION`);
    console.log(`  Error: ${error.message}`);
    return { success: false, error: error.message, data: [] };
  }
}

async function testMapQuestAPI() {
  console.log('\n🗺️ Testing MapQuest Traffic API...');
  try {
    const result = await fetchMapQuestTrafficWithStreetNames();
    console.log(`  Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`  Data Count: ${result.data ? result.data.length : 0} alerts`);
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
    if (result.success && result.data && result.data.length > 0) {
      console.log(`  Sample Alert: ${result.data[0].title || 'No title'}`);
      console.log(`  Sample Location: ${result.data[0].location || 'No location'}`);
    }
    return result;
  } catch (error) {
    console.log(`  Status: ❌ EXCEPTION`);
    console.log(`  Error: ${error.message}`);
    return { success: false, error: error.message, data: [] };
  }
}

async function testHEREAPI() {
  console.log('\n🌐 Testing HERE Traffic API...');
  try {
    const result = await fetchHERETraffic();
    console.log(`  Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`  Data Count: ${result.data ? result.data.length : 0} alerts`);
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
    if (result.success && result.data && result.data.length > 0) {
      console.log(`  Sample Alert: ${result.data[0].title || 'No title'}`);
      console.log(`  Sample Location: ${result.data[0].location || 'No location'}`);
    }
    return result;
  } catch (error) {
    console.log(`  Status: ❌ EXCEPTION`);
    console.log(`  Error: ${error.message}`);
    return { success: false, error: error.message, data: [] };
  }
}

async function testNationalHighwaysAPI() {
  console.log('\n🛣️ Testing National Highways API...');
  try {
    const result = await fetchNationalHighways();
    console.log(`  Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`  Data Count: ${result.data ? result.data.length : 0} alerts`);
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
    if (result.success && result.data && result.data.length > 0) {
      console.log(`  Sample Alert: ${result.data[0].title || 'No title'}`);
      console.log(`  Sample Location: ${result.data[0].location || 'No location'}`);
    }
    return result;
  } catch (error) {
    console.log(`  Status: ❌ EXCEPTION`);
    console.log(`  Error: ${error.message}`);
    return { success: false, error: error.message, data: [] };
  }
}

// Run all tests
async function runAllTests() {
  const results = {
    tomtom: await testTomTomAPI(),
    mapquest: await testMapQuestAPI(),
    here: await testHEREAPI(),
    nationalHighways: await testNationalHighwaysAPI()
  };

  console.log('\n📊 Test Summary:');
  console.log('================');
  
  let totalAlerts = 0;
  let workingAPIs = 0;
  
  Object.entries(results).forEach(([api, result]) => {
    const status = result.success ? '✅' : '❌';
    const count = result.data ? result.data.length : 0;
    console.log(`  ${api.toUpperCase()}: ${status} (${count} alerts)`);
    
    if (result.success) workingAPIs++;
    totalAlerts += count;
  });
  
  console.log(`\n🎯 Overall Results:`);
  console.log(`  Working APIs: ${workingAPIs}/4`);
  console.log(`  Total Alerts: ${totalAlerts}`);
  console.log(`  Status: ${workingAPIs > 0 ? '✅ At least one API working' : '❌ No APIs working'}`);
  
  if (totalAlerts === 0) {
    console.log('\n⚠️ DIAGNOSIS: No alerts found from any API!');
    console.log('   Possible issues:');
    console.log('   - API keys might be invalid');
    console.log('   - Network connectivity issues');
    console.log('   - API endpoints might be down');
    console.log('   - Region (Newcastle) might have no traffic incidents');
  } else {
    console.log('\n✅ SUCCESS: Traffic data is available!');
    console.log('   The backend APIs are working. Check frontend connection.');
  }
  
  return results;
}

// Export for use in other scripts
export { testTomTomAPI, testMapQuestAPI, testHEREAPI, testNationalHighwaysAPI };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}
