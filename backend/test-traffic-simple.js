#!/usr/bin/env node
// test-traffic-simple.js
// Simple test of traffic intelligence

import { trafficIntelligence } from './services/unifiedTrafficIntelligence.js';

async function testTraffic() {
  console.log('🔍 Testing Traffic Intelligence...');
  
  try {
    const result = await trafficIntelligence.getTrafficIntelligence();
    
    console.log('Success:', result.success);
    console.log('Data length:', result.data?.length || 0);
    console.log('Error:', result.error);
    console.log('Sources:', result.metadata?.sources);
    
    if (result.data && result.data.length > 0) {
      console.log('\nFirst alert:', JSON.stringify(result.data[0], null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testTraffic();