#!/usr/bin/env node

// fix-auth-issues.js
// Comprehensive API Authentication Testing and Fixes for Go BARRY

import axios from 'axios';
import 'dotenv/config';

console.log('🔧 BARRY Authentication Issue Resolver\n');

// Test configurations for each API
const apiTests = {
  here: {
    name: 'HERE Traffic API',
    keyEnv: 'HERE_API_KEY',
    testEndpoint: 'https://data.traffic.hereapi.com/v7/incidents',
    testParams: {
      apikey: process.env.HERE_API_KEY,
      in: 'circle:54.9783,-1.6178;r=5000',
      locationReferencing: 'olr'
    },
    expectedStatus: 200,
    authMethod: 'URL Parameter'
  },
  
  mapquest: {
    name: 'MapQuest Traffic API',
    keyEnv: 'MAPQUEST_API_KEY', 
    testEndpoint: 'https://www.mapquestapi.com/traffic/v2/incidents',
    testParams: {
      key: process.env.MAPQUEST_API_KEY,
      boundingBox: '54.5,-2.5,55.5,-1.0',
      filters: 'incidents'
    },
    expectedStatus: 200,
    authMethod: 'URL Parameter'
  },
  
  nationalHighways: {
    name: 'National Highways API',
    keyEnv: 'NATIONAL_HIGHWAYS_API_KEY',
    testEndpoint: 'https://api.data.nationalhighways.co.uk/roads/v2.0/closures',
    headers: {
      'Ocp-Apim-Subscription-Key': process.env.NATIONAL_HIGHWAYS_API_KEY,
      'Accept': 'application/json'
    },
    expectedStatus: 200,
    authMethod: 'Header'
  },
  
  tomtom: {
    name: 'TomTom Traffic API',
    keyEnv: 'TOMTOM_API_KEY',
    testEndpoint: `https://api.tomtom.com/traffic/services/5/incidentDetails`,
    testParams: {
      key: process.env.TOMTOM_API_KEY,
      bbox: '54.5,-2.5,55.5,-1.0',
      fields: '{incidents{type,geometry{type,coordinates},properties{id,iconCategory,magnitudeOfDelay,events{description,code,iconCategory},startTime,endTime,roadNumbers,timeValidity,location{country,countrySubdivision,city,street}}}}'
    },
    expectedStatus: 200,
    authMethod: 'URL Parameter'
  }
};

// Test individual API authentication
async function testApiAuth(apiKey, config) {
  console.log(`\n🔍 Testing ${config.name}...`);
  console.log(`   Key configured: ${apiKey ? 'YES' : 'NO'}`);
  console.log(`   Auth method: ${config.authMethod}`);
  
  if (!apiKey) {
    console.log(`   ❌ FAILED: No API key found in ${config.keyEnv}`);
    return { success: false, error: 'No API key configured' };
  }
  
  try {
    const requestConfig = {
      timeout: 10000,
      headers: {
        'User-Agent': 'BARRY-AuthTest/1.0',
        'Accept': 'application/json',
        ...config.headers
      }
    };
    
    if (config.testParams) {
      requestConfig.params = config.testParams;
    }
    
    console.log(`   🚀 Making test request to ${config.testEndpoint}...`);
    
    const response = await axios.get(config.testEndpoint, requestConfig);
    
    if (response.status === config.expectedStatus) {
      console.log(`   ✅ SUCCESS: HTTP ${response.status} - Authentication working`);
      console.log(`   📊 Response size: ${JSON.stringify(response.data).length} bytes`);
      return { success: true, status: response.status, dataSize: JSON.stringify(response.data).length };
    } else {
      console.log(`   ⚠️  UNEXPECTED: HTTP ${response.status} (expected ${config.expectedStatus})`);
      return { success: false, error: `Unexpected status ${response.status}` };
    }
    
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}`);
    
    if (error.response) {
      console.log(`   📡 HTTP Status: ${error.response.status}`);
      console.log(`   📝 Error Data: ${JSON.stringify(error.response.data).substring(0, 200)}...`);
      
      // Specific error analysis
      switch (error.response.status) {
        case 401:
          console.log(`   🔑 DIAGNOSIS: Invalid or expired API key`);
          break;
        case 403:
          console.log(`   🚫 DIAGNOSIS: API key valid but insufficient permissions/quota exceeded`);
          break;
        case 400:
          console.log(`   📝 DIAGNOSIS: Bad request - check API key format or parameters`);
          break;
        case 429:
          console.log(`   ⏰ DIAGNOSIS: Rate limit exceeded`);
          break;
        default:
          console.log(`   ❓ DIAGNOSIS: Server error or API issue`);
      }
    }
    
    return { 
      success: false, 
      error: error.message,
      status: error.response?.status,
      data: error.response?.data 
    };
  }
}

// Generate new API key instructions
function generateKeyInstructions(apiName) {
  const instructions = {
    'HERE Traffic API': {
      url: 'https://developer.here.com/',
      steps: [
        '1. Create HERE developer account',
        '2. Create a new project',
        '3. Generate API key with Traffic API access',
        '4. Update HERE_API_KEY in .env file'
      ]
    },
    'MapQuest Traffic API': {
      url: 'https://developer.mapquest.com/',
      steps: [
        '1. Create MapQuest developer account',
        '2. Create a new application',
        '3. Generate API key with Traffic API access',
        '4. Update MAPQUEST_API_KEY in .env file'
      ]
    },
    'National Highways API': {
      url: 'https://azure.microsoft.com/en-us/services/api-management/',
      steps: [
        '1. Contact National Highways for API access',
        '2. Register for Azure API Management subscription',
        '3. Subscribe to National Highways DATEX II API',
        '4. Update NATIONAL_HIGHWAYS_API_KEY in .env file'
      ]
    },
    'TomTom Traffic API': {
      url: 'https://developer.tomtom.com/',
      steps: [
        '1. Create TomTom developer account',
        '2. Create a new application',
        '3. Generate API key with Traffic API access',
        '4. Update TOMTOM_API_KEY in .env file'
      ]
    }
  };
  
  return instructions[apiName] || { url: 'Contact API provider', steps: ['Check API provider documentation'] };
}

// Main authentication test runner
async function runAuthenticationTests() {
  console.log('📋 Running comprehensive authentication tests...\n');
  
  const results = {};
  
  for (const [key, config] of Object.entries(apiTests)) {
    const apiKey = process.env[config.keyEnv];
    results[key] = await testApiAuth(apiKey, config);
  }
  
  // Summary report
  console.log('\n📊 AUTHENTICATION TEST RESULTS SUMMARY');
  console.log('==========================================');
  
  const working = [];
  const failing = [];
  
  for (const [key, config] of Object.entries(apiTests)) {
    const result = results[key];
    if (result.success) {
      working.push(config.name);
      console.log(`✅ ${config.name}: WORKING`);
    } else {
      failing.push({ name: config.name, error: result.error, status: result.status });
      console.log(`❌ ${config.name}: FAILED (${result.error})`);
    }
  }
  
  console.log(`\n📈 Success Rate: ${working.length}/${Object.keys(apiTests).length} APIs working`);
  
  // Recommendations
  if (failing.length > 0) {
    console.log('\n🔧 RECOMMENDED FIXES:');
    console.log('====================');
    
    for (const failed of failing) {
      console.log(`\n📍 ${failed.name}:`);
      const instructions = generateKeyInstructions(failed.name);
      console.log(`   🌐 Get new key: ${instructions.url}`);
      instructions.steps.forEach(step => console.log(`   ${step}`));
      
      if (failed.status === 401 || failed.status === 403) {
        console.log(`   🚨 URGENT: API key needs immediate replacement`);
      }
    }
  }
  
  // Next steps
  console.log('\n⚡ IMMEDIATE ACTION ITEMS:');
  console.log('=========================');
  
  if (failing.length === 0) {
    console.log('🎉 All APIs working! Check network connectivity or API rate limits if still seeing errors.');
  } else {
    console.log('1. Replace failed API keys using instructions above');
    console.log('2. Update backend/.env with new keys');
    console.log('3. Restart the backend service');
    console.log('4. Test with: npm run test-api-endpoints');
  }
  
  return { working, failing, results };
}

// Run the tests
if (import.meta.url === `file://${process.argv[1]}`) {
  runAuthenticationTests()
    .then(results => {
      process.exit(results.failing.length > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('💥 Test runner failed:', error.message);
      process.exit(1);
    });
}

export { runAuthenticationTests, testApiAuth, generateKeyInstructions };
