#!/usr/bin/env node
// simple-mapquest-test.js
// Simple test for MapQuest API from backend directory

import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables from backend/.env
dotenv.config({ path: '../.env' });

const API_KEY = process.env.MAPQUEST_API_KEY;

console.log('🧪 Simple MapQuest API Test');
console.log('===========================');
console.log(`API Key: ${API_KEY ? API_KEY.substring(0, 8) + '...' : 'NOT FOUND'}`);

if (!API_KEY) {
  console.error('❌ MAPQUEST_API_KEY not found in environment');
  process.exit(1);
}

try {
  console.log('\n📡 Testing MapQuest API...');
  
  const response = await axios.get('https://www.mapquestapi.com/traffic/v2/incidents', {
    params: {
      key: API_KEY,
      boundingBox: '55.05,-2.10,54.75,-1.35', // Go North East area
      filters: 'incidents,construction',
      format: 'json'
    },
    timeout: 15000
  });
  
  console.log(`✅ Response Status: ${response.status}`);
  console.log(`📊 Response Data:`, response.data);
  
  if (response.data?.incidents) {
    console.log(`🚦 Found ${response.data.incidents.length} incidents`);
    console.log('\n🎉 MAPQUEST API IS WORKING!');
  } else {
    console.log('⚠️ API responded but no incidents data found');
    console.log('Response structure:', Object.keys(response.data || {}));
  }
  
} catch (error) {
  console.error('❌ MapQuest API Error:');
  
  if (error.response) {
    console.error(`Status: ${error.response.status}`);
    console.error(`Data:`, error.response.data);
    
    if (error.response.status === 401) {
      console.error('🔑 Authentication failed - check API key');
    } else if (error.response.status === 403) {
      console.error('🚫 Access forbidden - check API permissions');
    }
  } else {
    console.error(`Network error: ${error.message}`);
  }
}
