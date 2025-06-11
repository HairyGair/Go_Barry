#!/usr/bin/env node

// quick-auth-test.js
// Test the updated API keys immediately

import axios from 'axios';
import 'dotenv/config';

console.log('🚀 Testing Updated API Keys\n');

// Quick test functions
async function testHERE() {
  try {
    const response = await axios.get('https://data.traffic.hereapi.com/v7/incidents', {
      params: {
        apikey: process.env.HERE_API_KEY,
        in: 'circle:54.9783,-1.6178;r=5000'
      },
      timeout: 10000
    });
    console.log(`✅ HERE API: ${response.status} - ${response.data?.results?.length || 0} incidents`);
    return true;
  } catch (error) {
    console.log(`❌ HERE API: ${error.response?.status || 'Error'} - ${error.message}`);
    return false;
  }
}

async function testMapQuest() {
  try {
    const response = await axios.get('https://www.mapquestapi.com/traffic/v2/incidents', {
      params: {
        key: process.env.MAPQUEST_API_KEY,
        boundingBox: '54.5,-2.5,55.5,-1.0'
      },
      timeout: 10000
    });
    console.log(`✅ MapQuest API: ${response.status} - ${response.data?.incidents?.length || 0} incidents`);
    return true;
  } catch (error) {
    console.log(`❌ MapQuest API: ${error.response?.status || 'Error'} - ${error.message}`);
    return false;
  }
}

async function testNationalHighways() {
  try {
    const response = await axios.get('https://api.data.nationalhighways.co.uk/roads/v2.0/closures', {
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.NATIONAL_HIGHWAYS_API_KEY
      },
      timeout: 10000
    });
    console.log(`✅ National Highways API: ${response.status} - ${response.data?.features?.length || 0} features`);
    return true;
  } catch (error) {
    console.log(`❌ National Highways API: ${error.response?.status || 'Error'} - ${error.message}`);
    return false;
  }
}

// Run all tests
async function runTests() {
  const results = await Promise.all([
    testHERE(),
    testMapQuest(), 
    testNationalHighways()
  ]);
  
  const working = results.filter(Boolean).length;
  console.log(`\n📊 Result: ${working}/3 APIs working`);
  
  if (working === 3) {
    console.log('🎉 All authentication issues fixed!');
  } else {
    console.log('⚠️ Some APIs still need attention');
  }
}

runTests().catch(console.error);
