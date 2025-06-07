#!/usr/bin/env node
// Quick test script to verify alerts are working

import { fetchTomTomTrafficWithStreetNames } from './services/tomtom.js';

console.log('🧪 Testing Go BARRY alerts system...');
console.log('📅 Current time:', new Date().toISOString());

// Test TomTom API key
console.log('🔑 TomTom API Key:', process.env.TOMTOM_API_KEY ? 'CONFIGURED' : 'MISSING');

// Test TomTom fetch
console.log('\n📡 Testing TomTom API...');
try {
  const result = await fetchTomTomTrafficWithStreetNames();
  console.log('✅ TomTom Result:', {
    success: result.success,
    dataCount: result.data?.length || 0,
    error: result.error,
    method: result.method
  });
  
  if (result.data && result.data.length > 0) {
    console.log('📋 Sample alert:', {
      id: result.data[0].id,
      title: result.data[0].title,
      location: result.data[0].location,
      severity: result.data[0].severity,
      affectsRoutes: result.data[0].affectsRoutes
    });
  }
} catch (error) {
  console.error('❌ TomTom test failed:', error.message);
}

console.log('\n🎯 Test complete!');
