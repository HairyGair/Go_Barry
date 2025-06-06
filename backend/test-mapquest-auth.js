// test-mapquest-auth.js
// Test script to diagnose and fix MapQuest API authentication
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testMapQuestAuthentication() {
  console.log('🔧 Testing MapQuest API Authentication...\n');
  
  const apiKey = process.env.MAPQUEST_API_KEY;
  if (!apiKey) {
    console.error('❌ MAPQUEST_API_KEY not found in environment variables');
    return false;
  }
  
  console.log(`✅ API Key found: ${apiKey.substring(0, 8)}...${apiKey.slice(-4)}`);
  
  // Test different endpoint variations to find the correct one
  const endpoints = [
    {
      name: 'Traffic API v2 (Current)',
      url: 'https://www.mapquestapi.com/traffic/v2/incidents',
      params: {
        key: apiKey,
        boundingBox: '55.0,-2.0,54.5,-1.0',
        filters: 'incidents,construction'
      }
    },
    {
      name: 'Traffic API v2 (Alternative Format)',
      url: 'https://www.mapquestapi.com/traffic/v2/incidents',
      params: {
        key: apiKey,
        bbox: '54.5,-2.0,55.0,-1.0',
        incidentTypes: 'incidents,construction'
      }
    },
    {
      name: 'Directions API (Auth Test)',
      url: 'https://www.mapquestapi.com/directions/v2/route',
      params: {
        key: apiKey,
        from: 'Newcastle, UK',
        to: 'Gateshead, UK'
      }
    }
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n🧪 Testing: ${endpoint.name}`);
    
    try {
      const response = await axios.get(endpoint.url, {
        params: endpoint.params,
        timeout: 10000,
        headers: {
          'User-Agent': 'BARRY-TrafficWatch/3.0-Test',
          'Accept': 'application/json'
        }
      });
      
      console.log(`✅ Status: ${response.status}`);
      console.log(`📊 Response size: ${JSON.stringify(response.data).length} bytes`);
      
      if (response.data.incidents) {
        console.log(`🚦 Found ${response.data.incidents.length} incidents`);
        if (response.data.incidents.length > 0) {
          const sample = response.data.incidents[0];
          console.log(`📍 Sample: ${sample.shortDesc || 'No description'} at ${sample.lat || 'no coords'}, ${sample.lng || 'no coords'}`);
        }
      } else if (response.data.route) {
        console.log(`🛣️ Route test successful - API key is valid`);
      } else {
        console.log(`📋 Response keys: ${Object.keys(response.data).join(', ')}`);
      }
      
    } catch (error) {
      console.error(`❌ Failed: ${error.message}`);
      if (error.response) {
        console.error(`📊 Status: ${error.response.status}`);
        console.error(`📋 Headers: ${JSON.stringify(error.response.headers, null, 2)}`);
        console.error(`📝 Data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }
  }
  
  // Test with updated North East bounding box
  console.log(`\n🧪 Testing optimized North East England bounding box...`);
  
  try {
    const response = await axios.get('https://www.mapquestapi.com/traffic/v2/incidents', {
      params: {
        key: apiKey,
        boundingBox: '54.8,-1.8,55.2,-1.2', // More focused Newcastle area
        filters: 'incidents,construction',
        format: 'json'
      },
      timeout: 15000,
      headers: {
        'User-Agent': 'BARRY-TrafficWatch/3.0-Optimized',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Optimized request successful!`);
    console.log(`📊 Status: ${response.status}`);
    console.log(`🚦 Incidents found: ${response.data.incidents?.length || 0}`);
    
    return true;
    
  } catch (error) {
    console.error(`❌ Optimized request failed: ${error.message}`);
    return false;
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testMapQuestAuthentication()
    .then(success => {
      console.log(`\n${success ? '✅' : '❌'} MapQuest authentication test ${success ? 'completed successfully' : 'failed'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test crashed:', error);
      process.exit(1);
    });
}

export { testMapQuestAuthentication };
