// backend/test-tomtom-clean.js
// Clean test for TomTom API

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

console.log('🧪 Testing TomTom API for Newcastle...');

const apiKey = process.env.TOMTOM_API_KEY;
console.log(`🔑 API Key: ${apiKey ? 'Present' : 'MISSING'}`);

if (!apiKey) {
  console.error('❌ No TomTom API key found');
  process.exit(1);
}

try {
  const response = await axios.get('https://api.tomtom.com/traffic/services/5/incidentDetails', {
    params: {
      key: apiKey,
      bbox: '-1.8,54.8,-1.4,55.1', // Newcastle area
      zoom: 10
    },
    timeout: 15000
  });
  
  console.log(`✅ Status: ${response.status}`);
  
  if (response.data && response.data.tm && response.data.tm.poi) {
    const incidents = response.data.tm.poi;
    console.log(`🚦 Incidents found: ${incidents.length}`);
    
    if (incidents.length > 0) {
      console.log(`\n📍 First incident:`);
      const first = incidents[0];
      console.log(`   Type: ${first.ty}`);
      console.log(`   Road: ${first.rdN || 'N/A'}`);
      console.log(`   Description: ${first.d || 'N/A'}`);
      console.log(`   Coordinates: ${first.p ? `${first.p.y}, ${first.p.x}` : 'N/A'}`);
      
      console.log(`\n🎉 SUCCESS! TomTom API is working for North East`);
    } else {
      console.log(`✅ API works but no incidents in Newcastle right now`);
      console.log(`💡 This is normal - might be no traffic incidents currently`);
    }
  } else {
    console.log(`⚠️ Unexpected response format:`, response.data);
  }
  
} catch (error) {
  console.error(`❌ Test failed: ${error.message}`);
  if (error.response) {
    console.error(`   Status: ${error.response.status}`);
    console.error(`   Data:`, error.response.data);
  }
}