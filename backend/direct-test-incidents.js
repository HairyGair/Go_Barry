#!/usr/bin/env node
// direct-test-incidents.js
// Direct test of the incident fetching

import fetch from 'node-fetch';

async function testIncidents() {
  console.log('🔍 Testing incidents endpoints...');
  
  // Test 1: Manual incidents
  console.log('\n1️⃣ Testing /api/incidents...');
  try {
    const res1 = await fetch('http://localhost:3001/api/incidents');
    const data1 = await res1.json();
    console.log('Manual incidents:', {
      success: data1.success,
      count: data1.incidents?.length || 0
    });
  } catch (error) {
    console.error('Manual incidents error:', error.message);
  }
  
  // Test 2: Traffic incidents  
  console.log('\n2️⃣ Testing /api/traffic-incidents...');
  try {
    const res2 = await fetch('http://localhost:3001/api/traffic-incidents');
    const data2 = await res2.json();
    console.log('Traffic incidents:', {
      success: data2.success,
      count: data2.incidents?.length || 0,
      error: data2.error
    });
    
    if (data2.incidents && data2.incidents.length > 0) {
      console.log('\nFirst incident:', data2.incidents[0]);
    }
  } catch (error) {
    console.error('Traffic incidents error:', error.message);
  }
  
  // Test 3: Test traffic intelligence directly
  console.log('\n3️⃣ Testing traffic intelligence directly...');
  try {
    const { trafficIntelligence } = await import('./services/unifiedTrafficIntelligence.js');
    const result = await trafficIntelligence.getTrafficIntelligence();
    console.log('Direct intelligence test:', {
      success: result.success,
      dataLength: result.data?.length || 0
    });
  } catch (error) {
    console.error('Direct test error:', error.message);
  }
}

testIncidents();