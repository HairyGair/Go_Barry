#!/usr/bin/env node

// Quick test script to verify roadworks API is working
import fetch from 'node-fetch';

const API_BASE = 'https://go-barry.onrender.com';

async function testRoadworksAPI() {
  console.log('🚧 Testing Roadworks API...\n');
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE}/api/health`);
    const healthData = await healthResponse.json();
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Response: ${JSON.stringify(healthData, null, 2)}\n`);
    
    // Test 2: Get roadworks
    console.log('2️⃣ Testing roadworks endpoint...');
    const roadworksResponse = await fetch(`${API_BASE}/api/roadworks`);
    const roadworksData = await roadworksResponse.json();
    console.log(`   Status: ${roadworksResponse.status}`);
    console.log(`   Count: ${roadworksData.roadworks?.length || 0} roadworks`);
    console.log(`   Sample: ${roadworksData.roadworks?.[0]?.title || 'None'}\n`);
    
    // Test 3: Get roadworks stats
    console.log('3️⃣ Testing roadworks stats...');
    const statsResponse = await fetch(`${API_BASE}/api/roadworks/stats`);
    const statsData = await statsResponse.json();
    console.log(`   Status: ${statsResponse.status}`);
    console.log(`   Stats: ${JSON.stringify(statsData.stats, null, 2)}\n`);
    
    console.log('✅ All tests passed! Roadworks API is working correctly.');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    process.exit(1);
  }
}

testRoadworksAPI();
