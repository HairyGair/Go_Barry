#!/usr/bin/env node

// test-from-backend.js
// Test authentication from backend directory (has all dependencies)

import axios from 'axios';
import 'dotenv/config';

console.log('🧪 Testing Authentication from Backend Directory');
console.log('===============================================');

console.log('\n🔑 Current API Keys:');
console.log(`   HERE: ${process.env.HERE_API_KEY ? 'SET' : 'MISSING'}`);
console.log(`   MapQuest: ${process.env.MAPQUEST_API_KEY ? 'SET' : 'MISSING'}`);
console.log(`   National Highways: ${process.env.NATIONAL_HIGHWAYS_API_KEY ? 'SET' : 'MISSING'}`);
console.log(`   TomTom: ${process.env.TOMTOM_API_KEY ? 'SET' : 'MISSING'}`);

// Test each API directly
async function testHERE() {
  try {
    const response = await axios.get('https://data.traffic.hereapi.com/v7/incidents', {
      params: {
        apikey: process.env.HERE_API_KEY,
        in: 'circle:54.9783,-1.6178;r=5000'
      },
      timeout: 10000
    });
    console.log(`✅ HERE: HTTP ${response.status} - ${response.data?.results?.length || 0} incidents`);
    return { success: true, count: response.data?.results?.length || 0 };
  } catch (error) {
    console.log(`❌ HERE: HTTP ${error.response?.status || 'Error'} - ${error.message}`);
    return { success: false, error: error.response?.status };
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
    console.log(`✅ MapQuest: HTTP ${response.status} - ${response.data?.incidents?.length || 0} incidents`);
    return { success: true, count: response.data?.incidents?.length || 0 };
  } catch (error) {
    console.log(`❌ MapQuest: HTTP ${error.response?.status || 'Error'} - ${error.message}`);
    return { success: false, error: error.response?.status };
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
    console.log(`✅ National Highways: HTTP ${response.status} - ${response.data?.features?.length || 0} features`);
    return { success: true, count: response.data?.features?.length || 0 };
  } catch (error) {
    console.log(`❌ National Highways: HTTP ${error.response?.status || 'Error'} - ${error.message}`);
    return { success: false, error: error.response?.status };
  }
}

async function testLocal() {
  try {
    const response = await axios.get('http://localhost:3001/api/alerts-enhanced', {
      timeout: 30000
    });
    console.log(`✅ Local BARRY API: HTTP ${response.status} - ${JSON.stringify(response.data).length} bytes`);
    
    // Check what sources are working
    const dataStr = JSON.stringify(response.data);
    const sources = [];
    if (dataStr.includes('tomtom')) sources.push('TomTom');
    if (dataStr.includes('here')) sources.push('HERE');
    if (dataStr.includes('mapquest')) sources.push('MapQuest');
    if (dataStr.includes('national_highways')) sources.push('National Highways');
    
    console.log(`📊 Active sources: ${sources.join(', ') || 'None detected'}`);
    return { success: true, sources };
  } catch (error) {
    console.log(`❌ Local BARRY API: ${error.message}`);
    return { success: false };
  }
}

// Run all tests
console.log('\n🚀 Running Authentication Tests...\n');

const results = {};
results.here = await testHERE();
results.mapquest = await testMapQuest();
results.nationalHighways = await testNationalHighways();

console.log('\n🌐 Testing Local BARRY API...\n');
results.local = await testLocal();

// Summary
console.log('\n📊 AUTHENTICATION TEST SUMMARY');
console.log('==============================');

const apis = ['here', 'mapquest', 'nationalHighways'];
const working = apis.filter(api => results[api].success);

console.log(`✅ Working APIs: ${working.length}/3`);
working.forEach(api => console.log(`   ✅ ${api}`));

const failing = apis.filter(api => !results[api].success);
if (failing.length > 0) {
  console.log(`❌ Failing APIs: ${failing.length}/3`);
  failing.forEach(api => console.log(`   ❌ ${api} (${results[api].error})`));
}

console.log(`\n🎯 Local API: ${results.local.success ? '✅ Working' : '❌ Failed'}`);

if (working.length === 3) {
  console.log('\n🎉 ALL AUTHENTICATION ISSUES FIXED!');
} else if (working.length > 0) {
  console.log('\n⚡ PARTIAL SUCCESS - Some APIs working');
} else {
  console.log('\n⚠️ All APIs still failing - may need different keys');
}
