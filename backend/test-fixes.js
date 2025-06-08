// test-fixes.js
// Test the fixes for TomTom bbox and route matching

import { fetchTomTomTrafficWithStreetNames } from './services/tomtom.js';
import { fetchMapQuestTrafficWithStreetNames } from './services/mapquest.js';
import { findAffectedRoutes } from './utils/improvedRouteMatching.js';
import dotenv from 'dotenv';

dotenv.config();

async function testFixes() {
  console.log('🧪 Testing Go Barry fixes...');
  console.log('========================================');
  
  // Test improved route matching first
  console.log('\n🚌 Testing improved route matching...');
  try {
    // Test with Newcastle coordinates
    const newcastleResult = findAffectedRoutes(
      'Newcastle City Centre',
      { lat: 54.9783, lng: -1.6178 },
      'Traffic near Grainger Street'
    );
    console.log('Newcastle test:', newcastleResult);
    
    // Test with A19 coordinates
    const a19Result = findAffectedRoutes(
      'A19 Road',
      { lat: 55.0400, lng: -1.4400 },
      'A19 traffic incident'
    );
    console.log('A19 test:', a19Result);
    
    // Test with Gateshead coordinates  
    const gatesheadResult = findAffectedRoutes(
      'Gateshead Metrocentre',
      { lat: 54.9627, lng: -1.6039 },
      'Road closure near Metrocentre'
    );
    console.log('Gateshead test:', gatesheadResult);
    
  } catch (error) {
    console.error('❌ Route matching test failed:', error.message);
  }
  
  // Test TomTom with fixed bbox
  console.log('\n🚗 Testing TomTom with fixed bbox...');
  try {
    const tomtomResult = await fetchTomTomTrafficWithStreetNames();
    console.log('TomTom Result:', {
      success: tomtomResult.success,
      dataCount: tomtomResult.data ? tomtomResult.data.length : 0,
      error: tomtomResult.error || null
    });
    if (tomtomResult.success && tomtomResult.data && tomtomResult.data.length > 0) {
      console.log('Sample TomTom Alert:', tomtomResult.data[0]);
    }
  } catch (error) {
    console.error('❌ TomTom test failed:', error.message);
  }
  
  // Test MapQuest with improved route matching
  console.log('\n🗺️ Testing MapQuest with improved route matching...');
  try {
    const mapquestResult = await fetchMapQuestTrafficWithStreetNames();
    console.log('MapQuest Result:', {
      success: mapquestResult.success,
      dataCount: mapquestResult.data ? mapquestResult.data.length : 0,
      error: mapquestResult.error || null
    });
    if (mapquestResult.success && mapquestResult.data && mapquestResult.data.length > 0) {
      console.log('Sample MapQuest Alert with Routes:', {
        id: mapquestResult.data[0].id,
        location: mapquestResult.data[0].location,
        affectsRoutes: mapquestResult.data[0].affectsRoutes,
        routeMatchMethod: mapquestResult.data[0].routeMatchMethod
      });
    }
  } catch (error) {
    console.error('❌ MapQuest test failed:', error.message);
  }
  
  console.log('\n✅ Fix testing complete!');
}

testFixes().catch(error => {
  console.error('❌ Test failed:', error);
});
