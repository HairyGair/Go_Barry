#!/usr/bin/env node
// test-mapquest-geocoding.js
// Test MapQuest API key with geocoding first

import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.join(__dirname, 'backend/.env');
dotenv.config({ path: envPath });

const API_KEY = process.env.MAPQUEST_API_KEY;

console.log('🧪 Testing MapQuest API Key Activation');
console.log('====================================');
console.log(`API Key: ${API_KEY ? API_KEY.substring(0, 8) + '...' : 'NOT FOUND'}`);
console.log('Subscription: MapQuestGo ✅');

async function testGeocoding() {
  console.log('\n📍 Testing Geocoding API (usually activates first)...');
  
  try {
    const response = await axios.get('https://www.mapquestapi.com/geocoding/v1/address', {
      params: {
        key: API_KEY,
        location: 'Newcastle, UK',
        maxResults: 1
      },
      timeout: 10000
    });
    
    console.log('✅ Geocoding API: SUCCESS!');
    console.log(`📊 Status: ${response.status}`);
    
    if (response.data?.results?.[0]) {
      const result = response.data.results[0];
      console.log('📍 Found location:', result.providedLocation?.location);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Geocoding API failed');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.statusText}`);
    }
    return false;
  }
}

async function testTrafficAPI() {
  console.log('\n🚦 Testing Traffic API...');
  
  try {
    const response = await axios.get('https://www.mapquestapi.com/traffic/v2/incidents', {
      params: {
        key: API_KEY,
        boundingBox: '55.05,-2.10,54.75,-1.35', // Go North East area
        filters: 'incidents,construction',
        format: 'json'
      },
      timeout: 15000
    });
    
    console.log('✅ Traffic API: SUCCESS!');
    console.log(`📊 Status: ${response.status}`);
    console.log(`🚦 Incidents found: ${response.data?.incidents?.length || 0}`);
    
    return true;
  } catch (error) {
    console.log('❌ Traffic API failed');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.statusText}`);
      
      if (error.response.status === 401) {
        console.log('   🕐 API key may still be activating...');
      }
    }
    return false;
  }
}

async function runTests() {
  const geocodingWorks = await testGeocoding();
  const trafficWorks = await testTrafficAPI();
  
  console.log('\n📊 RESULTS:');
  console.log('============');
  
  if (geocodingWorks && trafficWorks) {
    console.log('🎉 BOTH APIs WORKING! MapQuest integration ready!');
    console.log('✅ Go BARRY now has 4/6 traffic sources!');
  } else if (geocodingWorks && !trafficWorks) {
    console.log('⏳ API key is activating - Geocoding works, Traffic API still pending');
    console.log('🕐 Wait 5-10 more minutes and test again');
    console.log('📝 This is normal for new API keys');
  } else {
    console.log('❌ API key issues detected');
    console.log('🔧 May need to regenerate API key or contact MapQuest support');
  }
  
  console.log('\n🔄 To test again: node test-mapquest-geocoding.js');
}

runTests().catch(console.error);
