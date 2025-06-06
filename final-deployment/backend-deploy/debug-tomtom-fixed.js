// backend/debug-tomtom-fixed.js
// Test correct TomTom API formats

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔧 Testing CORRECT TomTom API formats...');

async function testCorrectFormats() {
  const apiKey = process.env.TOMTOM_API_KEY;
  
  // Test different correct API formats
  const testFormats = [
    {
      name: 'Format 1: Query Parameters',
      url: 'https://api.tomtom.com/traffic/services/4/incidentDetails',
      params: {
        key: apiKey,
        bbox: '-2.5,54.0,-0.5,55.5', // minLng,minLat,maxLng,maxLat
        zoom: 10,
        language: 'en-GB'
      }
    },
    {
      name: 'Format 2: Alternative Parameter Style',
      url: 'https://api.tomtom.com/traffic/services/4/incidentDetails',
      params: {
        key: apiKey,
        boundingBox: '-2.5,54.0,-0.5,55.5',
        zoom: 10
      }
    },
    {
      name: 'Format 3: Version 5 with Query Params',
      url: 'https://api.tomtom.com/traffic/services/5/incidentDetails',
      params: {
        key: apiKey,
        bbox: '-2.5,54.0,-0.5,55.5',
        zoom: 10
      }
    },
    {
      name: 'Format 4: Incidents API v1',
      url: 'https://api.tomtom.com/traffic/services/1/incidents',
      params: {
        key: apiKey,
        bbox: '-2.5,54.0,-0.5,55.5',
        zoom: 10,
        format: 'json'
      }
    }
  ];
  
  for (const format of testFormats) {
    console.log(`\n🧪 Testing: ${format.name}`);
    console.log(`📡 URL: ${format.url}`);
    console.log(`📋 Params:`, format.params);
    
    try {
      const response = await axios.get(format.url, {
        params: format.params,
        timeout: 15000,
        headers: {
          'User-Agent': 'BARRY-TrafficWatch/3.0-Fixed',
          'Accept': 'application/json'
        }
      });
      
      console.log(`✅ SUCCESS! Status: ${response.status}`);
      console.log(`📊 Response size: ${JSON.stringify(response.data).length} bytes`);
      
      // Check structure
      if (response.data) {
        const data = response.data;
        console.log(`🔍 Response structure:`);
        
        // Check different possible response structures
        if (data.tm && data.tm.poi) {
          console.log(`   - TomTom format: ${data.tm.poi.length} incidents`);
          if (data.tm.poi.length > 0) {
            const sample = data.tm.poi[0];
            console.log(`   - Sample: ${sample.ty} on ${sample.rdN || 'unknown road'}`);
          }
        } else if (data.incidents) {
          console.log(`   - Incidents array: ${data.incidents.length} incidents`);
        } else if (Array.isArray(data)) {
          console.log(`   - Direct array: ${data.length} incidents`);
        } else {
          console.log(`   - Unknown format. Keys:`, Object.keys(data));
        }
        
        // Show sample if small response
        if (JSON.stringify(data).length < 2000) {
          console.log(`📄 Sample response:`, JSON.stringify(data, null, 2));
        }
      }
      
      // If this works, we found the right format!
      if (response.status === 200) {
        console.log(`🎉 FOUND WORKING FORMAT!`);
        return format;
      }
      
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        if (error.response.data) {
          console.log(`   Error:`, error.response.data);
        }
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return null;
}

// Test with London to make sure we get incidents
async function testWithLondon() {
  console.log(`\n🏙️ Testing with London (known busy area)...`);
  
  const formats = [
    {
      url: 'https://api.tomtom.com/traffic/services/4/incidentDetails',
      params: {
        key: process.env.TOMTOM_API_KEY,
        bbox: '-0.5,51.3,0.2,51.7', // London bounding box
        zoom: 10
      }
    }
  ];
  
  for (const format of formats) {
    try {
      const response = await axios.get(format.url, {
        params: format.params,
        timeout: 15000
      });
      
      console.log(`✅ London test: ${response.status}`);
      
      if (response.data && response.data.tm && response.data.tm.poi) {
        console.log(`🚦 London incidents found: ${response.data.tm.poi.length}`);
        if (response.data.tm.poi.length > 0) {
          const sample = response.data.tm.poi[0];
          console.log(`📍 Sample London incident: ${sample.ty} - ${sample.rdN}`);
        }
      }
      
    } catch (error) {
      console.log(`❌ London test failed: ${error.message}`);
    }
  }
}

async function runFixedTests() {
  const workingFormat = await testCorrectFormats();
  await testWithLondon();
  
  if (workingFormat) {
    console.log(`\n🔧 USE THIS FORMAT IN YOUR CODE:`);
    console.log(`URL: ${workingFormat.url}`);
    console.log(`Params:`, workingFormat.params);
  } else {
    console.log(`\n❌ No working format found. Check TomTom API documentation.`);
  }
}

runFixedTests().catch(console.error);