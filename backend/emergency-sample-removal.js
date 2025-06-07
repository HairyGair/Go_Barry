#!/usr/bin/env node
// EMERGENCY: Force clear all sample data and verify live alerts only

import { fetchTomTomTrafficWithStreetNames } from './services/tomtom.js';
import { fetchHERETrafficWithStreetNames } from './services/here.js';
import { fetchMapQuestTrafficWithStreetNames } from './services/mapquest.js';

console.log('🚨 EMERGENCY SAMPLE DATA REMOVAL');
console.log('=================================');

// Test each service individually
console.log('\n🧪 Testing individual services for sample data...');

console.log('\n1. Testing TomTom...');
try {
  const tomtomResult = await fetchTomTomTrafficWithStreetNames();
  console.log('TomTom Result:', {
    success: tomtomResult.success,
    count: tomtomResult.data?.length || 0,
    firstAlert: tomtomResult.data?.[0] ? {
      id: tomtomResult.data[0].id,
      source: tomtomResult.data[0].source,
      location: tomtomResult.data[0].location
    } : null
  });
  
  // Check for sample patterns
  if (tomtomResult.data?.some(alert => 
    alert.id?.includes('barry_v3') || 
    alert.source === 'go_barry_v3' ||
    alert.description?.includes('Junction 65')
  )) {
    console.log('🚨 SAMPLE DATA DETECTED in TomTom service!');
  }
} catch (error) {
  console.log('TomTom Error:', error.message);
}

console.log('\n2. Testing HERE...');
try {
  const hereResult = await fetchHERETrafficWithStreetNames();
  console.log('HERE Result:', {
    success: hereResult.success,
    count: hereResult.data?.length || 0,
    firstAlert: hereResult.data?.[0] ? {
      id: hereResult.data[0].id,
      source: hereResult.data[0].source,
      location: hereResult.data[0].location
    } : null
  });
  
  // Check for sample patterns
  if (hereResult.data?.some(alert => 
    alert.id?.includes('barry_v3') || 
    alert.source === 'go_barry_v3'
  )) {
    console.log('🚨 SAMPLE DATA DETECTED in HERE service!');
  }
} catch (error) {
  console.log('HERE Error:', error.message);
}

console.log('\n3. Testing MapQuest...');
try {
  const mapquestResult = await fetchMapQuestTrafficWithStreetNames();
  console.log('MapQuest Result:', {
    success: mapquestResult.success,
    count: mapquestResult.data?.length || 0,
    firstAlert: mapquestResult.data?.[0] ? {
      id: mapquestResult.data[0].id,
      source: mapquestResult.data[0].source,
      location: mapquestResult.data[0].location
    } : null
  });
  
  // Check for sample patterns
  if (mapquestResult.data?.some(alert => 
    alert.id?.includes('barry_v3') || 
    alert.source === 'go_barry_v3'
  )) {
    console.log('🚨 SAMPLE DATA DETECTED in MapQuest service!');
  }
} catch (error) {
  console.log('MapQuest Error:', error.message);
}

console.log('\n📋 SUMMARY:');
console.log('- If sample data was detected above, it means there\'s a fallback somewhere');
console.log('- If all services show 0 alerts, then sample data is coming from frontend or old deployment');
console.log('- Check Render deployment logs for old cached responses');

console.log('\n🚀 SOLUTION: Force deployment with explicit sample data removal');
