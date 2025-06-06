// backend/debug-tomtom.js
// Debug TomTom API to see what's happening

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

console.log('🚗 TomTom API Debugging...');
console.log(`🔑 API Key: ${process.env.TOMTOM_API_KEY ? 'Present' : 'MISSING'}`);

async function debugTomTomAPI() {
  if (!process.env.TOMTOM_API_KEY) {
    console.error('❌ TomTom API key not found in environment variables');
    return;
  }
  
  // Test different bounding boxes and endpoints
  const testCases = [
    {
      name: 'North East England (Current)',
      bbox: '54.0,-2.5,55.5,-0.5',
      description: 'Current bounding box'
    },
    {
      name: 'Newcastle City Center',
      bbox: '54.9,-1.65,55.0,-1.5',
      description: 'Small test area around Newcastle'
    },
    {
      name: 'Larger North East',
      bbox: '53.5,-3.0,56.0,0.0',
      description: 'Much larger area'
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log(`📍 Bounding box: ${testCase.bbox}`);
    console.log(`📋 ${testCase.description}`);
    
    try {
      // Test the exact API endpoint we're using
      const url = `https://api.tomtom.com/traffic/services/5/incidentDetails/s4/${testCase.bbox}/10/1364226111`;
      
      console.log(`📡 URL: ${url}`);
      
      const response = await axios.get(url, {
        params: { 
          key: process.env.TOMTOM_API_KEY 
        },
        timeout: 15000,
        headers: {
          'User-Agent': 'BARRY-TrafficWatch/3.0-Debug',
          'Accept': 'application/json'
        }
      });
      
      console.log(`✅ HTTP Status: ${response.status}`);
      console.log(`📊 Response size: ${JSON.stringify(response.data).length} bytes`);
      
      // Check the structure
      if (response.data) {
        console.log(`🔍 Response structure:`);
        console.log(`   - Has 'tm' property: ${response.data.tm ? 'Yes' : 'No'}`);
        
        if (response.data.tm) {
          console.log(`   - Has 'poi' array: ${response.data.tm.poi ? 'Yes' : 'No'}`);
          
          if (response.data.tm.poi) {
            console.log(`   - Incidents found: ${response.data.tm.poi.length}`);
            
            if (response.data.tm.poi.length > 0) {
              console.log(`\n📝 Sample incident:`);
              const sample = response.data.tm.poi[0];
              console.log(`   ID: ${sample.id}`);
              console.log(`   Type: ${sample.ty}`);
              console.log(`   Road: ${sample.rdN || 'N/A'}`);
              console.log(`   Description: ${sample.d || 'N/A'}`);
              console.log(`   From: ${sample.f || 'N/A'}`);
              console.log(`   To: ${sample.t || 'N/A'}`);
              console.log(`   Coordinates: ${sample.p ? `${sample.p.y}, ${sample.p.x}` : 'N/A'}`);
              console.log(`   Category: ${sample.ic}`);
            }
          }
        }
        
        // Show raw response if small
        if (JSON.stringify(response.data).length < 1000) {
          console.log(`\n📄 Raw response:`, JSON.stringify(response.data, null, 2));
        }
      }
      
    } catch (error) {
      console.error(`❌ Error for ${testCase.name}:`);
      console.error(`   Message: ${error.message}`);
      
      if (error.response) {
        console.error(`   HTTP Status: ${error.response.status}`);
        console.error(`   Status Text: ${error.response.statusText}`);
        console.error(`   Headers:`, error.response.headers);
        
        if (error.response.data) {
          console.error(`   Response body:`, error.response.data);
        }
      }
    }
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Test API key validity with a simple endpoint
  console.log(`\n🔑 Testing API key validity...`);
  
  try {
    const testResponse = await axios.get('https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json', {
      params: {
        key: process.env.TOMTOM_API_KEY,
        point: '54.9783,-1.6178' // Newcastle coordinates
      },
      timeout: 10000
    });
    
    console.log(`✅ API key is valid (flow endpoint responded with ${testResponse.status})`);
    
  } catch (keyError) {
    console.error(`❌ API key test failed:`, keyError.message);
    if (keyError.response) {
      console.error(`   Status: ${keyError.response.status}`);
      console.error(`   Response:`, keyError.response.data);
    }
  }
}

// Also test the current production endpoint structure
async function testCurrentImplementation() {
  console.log(`\n🔧 Testing current backend implementation...`);
  
  try {
    // This matches your current implementation
    const boundingBox = '54.0,-2.5,55.5,-0.5';
    const response = await axios.get(
      `https://api.tomtom.com/traffic/services/5/incidentDetails/s4/${boundingBox}/10/1364226111`,
      {
        params: { key: process.env.TOMTOM_API_KEY },
        timeout: 15000,
        headers: {
          'User-Agent': 'BARRY-TrafficWatch/3.0-Optimized',
          'Accept': 'application/json'
        }
      }
    );
    
    console.log(`✅ Current implementation works: ${response.status}`);
    console.log(`📊 Incidents found: ${response.data?.tm?.poi?.length || 0}`);
    
  } catch (error) {
    console.error(`❌ Current implementation failed:`, error.message);
  }
}

// Run all tests
async function runAllTests() {
  await debugTomTomAPI();
  await testCurrentImplementation();
  
  console.log(`\n🎯 Debug complete!`);
  console.log(`💡 If no incidents found, try:`);
  console.log(`   1. Check if there are actual traffic incidents in the North East right now`);
  console.log(`   2. Try a larger bounding box`);
  console.log(`   3. Test with known incident areas (like London)`);
  console.log(`   4. Verify API key has incident access permissions`);
}

runAllTests().catch(console.error);