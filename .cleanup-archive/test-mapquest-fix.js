#!/usr/bin/env node
// test-mapquest-fix.js
// Run this in the backend directory to test MapQuest API

import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'backend/.env') });

const MAPQUEST_API_KEY = process.env.MAPQUEST_API_KEY;

console.log('🗺️ MapQuest API Authentication Test');
console.log('=====================================');
console.log(`API Key: ${MAPQUEST_API_KEY ? MAPQUEST_API_KEY.substring(0, 8) + '...' : 'NOT SET'}`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

async function testMapQuestAPI() {
  if (!MAPQUEST_API_KEY) {
    console.error('❌ MAPQUEST_API_KEY not found in backend/.env');
    console.log('📝 Add this line to backend/.env:');
    console.log('   MAPQUEST_API_KEY=your_new_api_key_here');
    return false;
  }

  // Test different MapQuest endpoints
  const tests = [
    {
      name: 'Traffic Incidents API',
      url: 'https://www.mapquestapi.com/traffic/v2/incidents',
      params: {
        key: MAPQUEST_API_KEY,
        boundingBox: '55.05,-2.10,54.75,-1.35', // Go North East area
        filters: 'incidents,construction',
        format: 'json'
      }
    },
    {
      name: 'Simple API Key Validation',
      url: 'https://www.mapquestapi.com/geocoding/v1/address',
      params: {
        key: MAPQUEST_API_KEY,
        location: 'Newcastle, UK',
        maxResults: 1
      }
    }
  ];

  let anySuccess = false;

  for (const [index, test] of tests.entries()) {
    console.log(`\n🔄 Test ${index + 1}: ${test.name}`);
    console.log(`   URL: ${test.url}`);
    
    try {
      const response = await axios.get(test.url, {
        params: test.params,
        timeout: 15000,
        headers: {
          'User-Agent': 'BARRY-TrafficWatch/3.0',
          'Accept': 'application/json'
        }
      });

      console.log(`   ✅ Success! Status: ${response.status}`);
      
      if (test.name.includes('Incidents')) {
        if (response.data?.incidents) {
          console.log(`   🚦 Found ${response.data.incidents.length} traffic incidents`);
          anySuccess = true;
        } else {
          console.log(`   📝 Response keys: ${Object.keys(response.data || {}).join(', ')}`);
        }
      } else if (test.name.includes('Geocoding')) {
        if (response.data?.results) {
          console.log(`   📍 Geocoding working, found ${response.data.results.length} results`);
          anySuccess = true;
        }
      }

    } catch (error) {
      console.error(`   ❌ Failed: ${error.response?.status || error.code || error.message}`);
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        console.error(`   📝 Error details:`, data);
        
        if (status === 401) {
          console.error('   🔑 Authentication failed - API key invalid or expired');
        } else if (status === 403) {
          console.error('   🚫 Access forbidden - check API permissions');
        } else if (status === 429) {
          console.error('   ⏰ Rate limited - too many requests');
        } else if (status === 400) {
          console.error('   📝 Bad request - check parameters');
        }
      }
    }
  }

  return anySuccess;
}

async function getNewAPIKeyInstructions() {
  console.log('\n🔧 HOW TO GET A NEW MAPQUEST API KEY:');
  console.log('=====================================');
  console.log('1. 🌐 Go to: https://developer.mapquest.com/');
  console.log('2. 🔐 Sign up or log in to your account');
  console.log('3. 📱 Create a new application');
  console.log('4. 🗺️ Select these APIs:');
  console.log('   • Traffic API (for incidents)');
  console.log('   • Geocoding API (for location names)');
  console.log('5. 🔑 Copy your Consumer Key');
  console.log('6. 📝 Update backend/.env:');
  console.log('   MAPQUEST_API_KEY=your_new_consumer_key_here');
  console.log('\n💡 Free tier usually includes:');
  console.log('   • 15,000 requests/month');
  console.log('   • Traffic incidents access');
  console.log('   • Geocoding services');
}

async function fixMapQuestAuth() {
  console.log('🚀 Starting MapQuest API authentication fix...\n');
  
  const success = await testMapQuestAPI();
  
  console.log('\n📊 DIAGNOSIS:');
  console.log('=============');
  
  if (success) {
    console.log('✅ MapQuest API is working correctly!');
    console.log('🎯 Authentication issue resolved');
    console.log('📝 Update Go BARRY status: MapQuest integration ✅ WORKING');
  } else {
    console.log('❌ MapQuest API authentication failed');
    console.log('🔧 Current API key is invalid or expired');
    
    await getNewAPIKeyInstructions();
    
    console.log('\n🛠️ NEXT STEPS:');
    console.log('1. Get new API key (instructions above)');
    console.log('2. Update backend/.env with new key');
    console.log('3. Run this test again: node test-mapquest-fix.js');
    console.log('4. Restart backend server');
    console.log('5. Test Go BARRY traffic alerts');
  }
  
  return success;
}

// Run the fix
fixMapQuestAuth().catch(console.error);
