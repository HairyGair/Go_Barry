// backend/simple-tomtom-test.js
// Simple test to confirm TomTom works for North East

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testOnlyNewcastle() {
  console.log('🧪 Testing ONLY Newcastle area...');
  
  try {
    const response = await axios.get('https://api.tomtom.com/traffic/services/5/incidentDetails', {
      params: {
        key: process.env.TOMTOM_API_KEY,
        bbox: '-1.8,54.8,-1.4,55.1', // Newcastle area
        zoom: 10
      },
      timeout: 15000
    });
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Response size: ${JSON.stringify(response.data).length} bytes`);
    
    if (response.data && response.data.tm && response.data.tm.poi) {
      const incidents = response.data.tm.poi;
      console.log(`🚦 Newcastle incidents found: ${incidents.length}`);
      
      if (incidents.length > 0) {
        console.log(`\n📍 First incident details:`);
        const first = incidents[0];
        console.log(`   Type: ${first.ty}`);
        console.log(`   Road: ${first.rdN || 'N/A'}`);
        console.log(`   Description: ${first.d || 'N/A'}`);
        console.log(`   From: ${first.f || 'N/A'}`);
        console.log(`   To: ${first.t || 'N/A'}`);
        console.log(`   Coordinates: ${first.p ? `${first.p.y}, ${first.p.x}` : 'N/A'}`);
        console.log(`   Category: ${first.ic}`);
      }
      
      return { success: true, incidents: incidents.length, data: incidents };
      
    } else {
      console.log(`⚠️ Unexpected response structure`);
      console.log(`Raw response:`, JSON.stringify(response.data, null, 2));
      return { success: false, incidents: 0 };
    }
    
  } catch (error) {
    console.error(`❌ Newcastle test failed: ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    return { success: false, incidents: 0, error: error.message };
  }
}

testOnlyNewcastle().then(result => {
  if (result.success && result.incidents > 0) {
    console.log(`\n🎉 SUCCESS! TomTom API works for North East`);
    console.log(`📋 Found ${result.incidents} incidents in Newcastle area`);
    console.log(`\n🔧 Ready to implement in backend!`);
  } else if (result.success && result.incidents === 0) {
    console.log(`\n✅ API works but no incidents in Newcastle right now`);
    console.log(`💡 This is normal - there might just be no traffic incidents`);
  } else {
    console.log(`\n❌ Still having issues - need to debug further`);
  }
});// backend/simple-tomtom-test.js
// Simple test to confirm TomTom works for North East

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testOnlyNewcastle() {
  console.log('🧪 Testing ONLY Newcastle area...');
  
  try {
    const response = await axios.get('https://api.tomtom.com/traffic/services/5/incidentDetails', {
      params: {
        key: process.env.TOMTOM_API_KEY,
        bbox: '-1.8,54.8,-1.4,55.1', // Newcastle area
        zoom: 10
      },
      timeout: 15000
    });
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Response size: ${JSON.stringify(response.data).length} bytes`);
    
    if (response.data && response.data.tm && response.data.tm.poi) {
      const incidents = response.data.tm.poi;
      console.log(`🚦 Newcastle incidents found: ${incidents.length}`);
      
      if (incidents.length > 0) {
        console.log(`\n📍 First incident details:`);
        const first = incidents[0];
        console.log(`   Type: ${first.ty}`);
        console.log(`   Road: ${first.rdN || 'N/A'}`);
        console.log(`   Description: ${first.d || 'N/A'}`);
        console.log(`   From: ${first.f || 'N/A'}`);
        console.log(`   To: ${first.t || 'N/A'}`);
        console.log(`   Coordinates: ${first.p ? `${first.p.y}, ${first.p.x}` : 'N/A'}`);
        console.log(`   Category: ${first.ic}`);
      }
      
      return { success: true, incidents: incidents.length, data: incidents };
      
    } else {
      console.log(`⚠️ Unexpected response structure`);
      console.log(`Raw response:`, JSON.stringify(response.data, null, 2));
      return { success: false, incidents: 0 };
    }
    
  } catch (error) {
    console.error(`❌ Newcastle test failed: ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    return { success: false, incidents: 0, error: error.message };
  }
}

testOnlyNewcastle().then(result => {
  if (result.success && result.incidents > 0) {
    console.log(`\n🎉 SUCCESS! TomTom API works for North East`);
    console.log(`📋 Found ${result.incidents} incidents in Newcastle area`);
    console.log(`\n🔧 Ready to implement in backend!`);
  } else if (result.success && result.incidents === 0) {
    console.log(`\n✅ API works but no incidents in Newcastle right now`);
    console.log(`💡 This is normal - there might just be no traffic incidents`);
  } else {
    console.log(`\n❌ Still having issues - need to debug further`);
  }
});