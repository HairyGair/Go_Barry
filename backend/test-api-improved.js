// test-api-improved.js
// Simple test script to check if the improved APIs are working

import { fetchTomTomTrafficWithStreetNames } from './services/tomtom.js';
import { fetchMapQuestTrafficWithStreetNames } from './services/mapquest.js';
import { fetchHERETrafficWithStreetNames } from './services/here.js';
import dotenv from 'dotenv';

dotenv.config();

async function testAPIs() {
  console.log('🧪 Testing Go Barry APIs with improved logging...');
  console.log('==========================================');
  
  // Check API keys
  console.log('\n🔑 API Key Status:');
  console.log(`TomTom: ${process.env.TOMTOM_API_KEY ? 'CONFIGURED' : 'MISSING'}`);
  console.log(`MapQuest: ${process.env.MAPQUEST_API_KEY ? 'CONFIGURED' : 'MISSING'}`);
  console.log(`HERE: ${process.env.HERE_API_KEY ? 'CONFIGURED' : 'MISSING'}`);
  
  const results = {};
  
  // Test TomTom
  console.log('\n🚗 Testing TomTom API...');
  try {
    const startTime = Date.now();
    const tomtomResult = await fetchTomTomTrafficWithStreetNames();
    const duration = Date.now() - startTime;
    
    results.tomtom = {
      success: tomtomResult.success,
      dataCount: tomtomResult.data ? tomtomResult.data.length : 0,
      duration: `${duration}ms`,
      error: tomtomResult.error || null
    };
    
    console.log(`✅ TomTom Result: ${tomtomResult.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Data: ${tomtomResult.data ? tomtomResult.data.length : 0} alerts`);
    console.log(`   Duration: ${duration}ms`);
    if (tomtomResult.error) {
      console.log(`   Error: ${tomtomResult.error}`);
    }
    if (tomtomResult.data && tomtomResult.data.length > 0) {
      console.log(`   Sample Alert:`, JSON.stringify(tomtomResult.data[0], null, 2));
    }
  } catch (error) {
    results.tomtom = { success: false, error: error.message, dataCount: 0 };
    console.log(`❌ TomTom Error: ${error.message}`);
  }
  
  // Test HERE
  console.log('\n🗺️ Testing HERE API...');
  try {
    const startTime = Date.now();
    const hereResult = await fetchHERETrafficWithStreetNames();
    const duration = Date.now() - startTime;
    
    results.here = {
      success: hereResult.success,
      dataCount: hereResult.data ? hereResult.data.length : 0,
      duration: `${duration}ms`,
      error: hereResult.error || null
    };
    
    console.log(`✅ HERE Result: ${hereResult.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Data: ${hereResult.data ? hereResult.data.length : 0} alerts`);
    console.log(`   Duration: ${duration}ms`);
    if (hereResult.error) {
      console.log(`   Error: ${hereResult.error}`);
    }
    if (hereResult.data && hereResult.data.length > 0) {
      console.log(`   Sample Alert:`, JSON.stringify(hereResult.data[0], null, 2));
    }
  } catch (error) {
    results.here = { success: false, error: error.message, dataCount: 0 };
    console.log(`❌ HERE Error: ${error.message}`);
  }
  
  // Test MapQuest
  console.log('\n🗺️ Testing MapQuest API...');
  try {
    const startTime = Date.now();
    const mapquestResult = await fetchMapQuestTrafficWithStreetNames();
    const duration = Date.now() - startTime;
    
    results.mapquest = {
      success: mapquestResult.success,
      dataCount: mapquestResult.data ? mapquestResult.data.length : 0,
      duration: `${duration}ms`,
      error: mapquestResult.error || null
    };
    
    console.log(`✅ MapQuest Result: ${mapquestResult.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Data: ${mapquestResult.data ? mapquestResult.data.length : 0} alerts`);
    console.log(`   Duration: ${duration}ms`);
    if (mapquestResult.error) {
      console.log(`   Error: ${mapquestResult.error}`);
    }
    if (mapquestResult.data && mapquestResult.data.length > 0) {
      console.log(`   Sample Alert:`, JSON.stringify(mapquestResult.data[0], null, 2));
    }
  } catch (error) {
    results.mapquest = { success: false, error: error.message, dataCount: 0 };
    console.log(`❌ MapQuest Error: ${error.message}`);
  }
  
  // Summary
  console.log('\n📊 SUMMARY:');
  console.log('==========================================');
  const workingAPIs = Object.values(results).filter(r => r.success).length;
  const totalAlerts = Object.values(results).reduce((sum, r) => sum + (r.dataCount || 0), 0);
  
  console.log(`Working APIs: ${workingAPIs}/3`);
  console.log(`Total Alerts: ${totalAlerts}`);
  
  Object.entries(results).forEach(([api, result]) => {
    console.log(`${api.toUpperCase()}: ${result.success ? '✅ WORKING' : '❌ FAILED'} (${result.dataCount || 0} alerts)`);
  });
  
  if (totalAlerts === 0) {
    console.log('\n🚨 NO ALERTS FOUND - This explains why the dashboard is empty!');
    console.log('   Possible causes:');
    console.log('   - API keys are invalid or expired');
    console.log('   - APIs are returning empty responses');
    console.log('   - Network/authentication issues');
    console.log('   - Geographic coverage doesn\'t include current area');
  } else {
    console.log(`\n✅ SUCCESS: Found ${totalAlerts} alerts from ${workingAPIs} working APIs`);
  }
  
  return results;
}

// Run the test
testAPIs().catch(error => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});
