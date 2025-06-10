// Test MapQuest API Authentication
import axios from 'axios';
import dotenv from 'dotenv';
import { getBoundsForAPI } from './backend/config/geographicBounds.js';

dotenv.config({ path: './backend/.env' });

const MAPQUEST_API_KEY = process.env.MAPQUEST_API_KEY;

console.log('🗺️ Testing MapQuest API Authentication...');
console.log(`API Key: ${MAPQUEST_API_KEY ? MAPQUEST_API_KEY.substring(0, 8) + '...' : 'NOT SET'}`);

async function testMapQuestAuth() {
  if (!MAPQUEST_API_KEY) {
    console.error('❌ MapQuest API key not found in environment variables');
    return false;
  }

  try {
    // Get bounding box for Go North East coverage
    const boundingBox = getBoundsForAPI('mapquest');
    console.log(`🌍 Testing with coverage area: ${boundingBox}`);
    
    // Test multiple endpoint configurations
    const testConfigs = [
      {
        name: 'Standard Incidents Endpoint',
        url: 'https://www.mapquestapi.com/traffic/v2/incidents',
        params: {
          key: MAPQUEST_API_KEY,
          boundingBox: boundingBox,
          filters: 'incidents,construction',
          format: 'json'
        }
      },
      {
        name: 'Alternative Incidents Endpoint',
        url: 'https://www.mapquestapi.com/traffic/v2/incidents',
        params: {
          key: MAPQUEST_API_KEY,
          bbox: boundingBox,
          incidentTypes: 'incidents,construction'
        }
      },
      {
        name: 'Basic Validation Endpoint',
        url: 'https://www.mapquestapi.com/traffic/v2/incidents',
        params: {
          key: MAPQUEST_API_KEY,
          boundingBox: '54.3,-2.5,55.5,-1.0' // Simplified bounding box
        }
      }
    ];

    for (const [index, config] of testConfigs.entries()) {
      console.log(`\n🔄 Test ${index + 1}: ${config.name}`);
      console.log(`URL: ${config.url}`);
      console.log(`Params:`, Object.keys(config.params).map(k => `${k}=${k === 'key' ? '***' : config.params[k]}`).join(', '));
      
      try {
        const response = await axios.get(config.url, {
          params: config.params,
          timeout: 15000,
          headers: {
            'User-Agent': 'BARRY-TrafficWatch/3.0-Test',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`✅ Success! Status: ${response.status}`);
        console.log(`📊 Response data type: ${typeof response.data}`);
        
        if (response.data && response.data.incidents) {
          console.log(`🚦 Found ${response.data.incidents.length} incidents`);
          
          if (response.data.incidents.length > 0) {
            const sample = response.data.incidents[0];
            console.log(`📝 Sample incident:`, {
              id: sample.id,
              type: sample.type,
              shortDesc: sample.shortDesc,
              lat: sample.lat,
              lng: sample.lng
            });
          }
        } else {
          console.log(`📝 Response structure:`, Object.keys(response.data || {}));
        }
        
        return true; // Success!
        
      } catch (error) {
        console.error(`❌ Test ${index + 1} failed:`);
        
        if (error.response) {
          console.error(`   Status: ${error.response.status}`);
          console.error(`   Headers:`, error.response.headers);
          console.error(`   Data:`, error.response.data);
          
          // Specific error analysis
          if (error.response.status === 401) {
            console.error('   🔑 AUTHENTICATION FAILED - API key is invalid or expired');
          } else if (error.response.status === 403) {
            console.error('   🚫 ACCESS FORBIDDEN - API key may not have traffic permissions');
          } else if (error.response.status === 429) {
            console.error('   ⏰ RATE LIMITED - too many requests');
          } else if (error.response.status === 400) {
            console.error('   📝 BAD REQUEST - check parameters');
          }
        } else if (error.code === 'ENOTFOUND') {
          console.error('   🌐 DNS ERROR - cannot resolve mapquestapi.com');
        } else if (error.code === 'ECONNREFUSED') {
          console.error('   🔌 CONNECTION REFUSED - service may be down');
        } else {
          console.error(`   ❓ Unknown error: ${error.message}`);
        }
      }
    }
    
    return false; // All tests failed
    
  } catch (error) {
    console.error('❌ Critical error during MapQuest test:', error.message);
    return false;
  }
}

// Test quota/usage endpoint if available
async function testMapQuestQuota() {
  console.log('\n🔍 Testing API quota/usage...');
  
  try {
    // Some APIs have quota endpoints
    const quotaUrl = `https://www.mapquestapi.com/traffic/v2/quota?key=${MAPQUEST_API_KEY}`;
    
    const response = await axios.get(quotaUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'BARRY-TrafficWatch/3.0-Test'
      }
    });
    
    console.log('✅ Quota check successful:', response.data);
    
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('ℹ️ Quota endpoint not available (normal for some APIs)');
    } else {
      console.log('⚠️ Quota check failed:', error.response?.status || error.message);
    }
  }
}

// Run the tests
async function runAllTests() {
  console.log('🚀 Starting MapQuest API authentication tests...\n');
  
  const success = await testMapQuestAuth();
  await testMapQuestQuota();
  
  console.log('\n📊 TEST SUMMARY:');
  if (success) {
    console.log('✅ MapQuest API is working correctly!');
    console.log('🎯 No authentication fix needed');
  } else {
    console.log('❌ MapQuest API authentication failed');
    console.log('🔧 ACTION NEEDED:');
    console.log('   1. Get a new API key from MapQuest Developer Portal');
    console.log('   2. Update MAPQUEST_API_KEY in backend/.env');
    console.log('   3. Verify API plan includes traffic incidents access');
    console.log('   4. Check rate limits and usage quotas');
    console.log('\n🌐 Get new API key at: https://developer.mapquest.com/');
  }
}

runAllTests().catch(console.error);
