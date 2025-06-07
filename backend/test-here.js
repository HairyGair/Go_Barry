#!/usr/bin/env node
// Test script for HERE Traffic API integration

import { fetchHERETrafficWithStreetNames } from './services/here.js';

console.log('🧪 Testing HERE Traffic API integration...');
console.log('📅 Current time:', new Date().toISOString());

// Test HERE API key
console.log('🔑 HERE API Key:', process.env.HERE_API_KEY ? 'CONFIGURED' : 'MISSING');

// Test HERE fetch
console.log('\n🗺️ Testing HERE API...');
try {
  const result = await fetchHERETrafficWithStreetNames();
  console.log('✅ HERE Result:', {
    success: result.success,
    dataCount: result.data?.length || 0,
    error: result.error,
    method: result.method,
    coverage: result.coverage
  });
  
  if (result.data && result.data.length > 0) {
    console.log('\n📋 Sample HERE alerts:');
    result.data.slice(0, 3).forEach((alert, index) => {
      console.log(`${index + 1}. ${alert.title}`);
      console.log(`   Location: ${alert.location}`);
      console.log(`   Severity: ${alert.severity} (${alert.criticality})`);
      console.log(`   Routes: ${alert.affectsRoutes?.join(', ') || 'none'}`);
      console.log(`   Method: ${alert.routeMatchMethod}`);
      console.log('');
    });
  }
  
  // Test coverage comparison
  console.log('\n📊 HERE vs TomTom Coverage:');
  console.log('- HERE: 25km radius from Newcastle (wider coverage)');
  console.log('- TomTom: Newcastle area bbox (focused coverage)');
  console.log('- HERE includes all criticality levels (0-3)');
  console.log('- Enhanced route matching with GTFS integration');
  
} catch (error) {
  console.error('❌ HERE test failed:', error.message);
}

console.log('\n🎯 HERE integration test complete!');
