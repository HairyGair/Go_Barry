// backend/debug-tomtom-final.js
// Test with smaller bounding boxes (under 10,000km²)

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔧 Testing TomTom with smaller bounding boxes...');

async function testSmallerBoundingBoxes() {
  const apiKey = process.env.TOMTOM_API_KEY;
  
  // Test smaller areas within North East (under 10,000km²)
  const testAreas = [
    {
      name: 'Newcastle Area',
      bbox: '-1.8,54.8,-1.4,55.1', // ~40km x 33km ≈ 1,320km²
      description: 'Newcastle and surrounding areas'
    },
    {
      name: 'Sunderland Area', 
      bbox: '-1.6,54.7,-1.2,55.0', // ~40km x 33km ≈ 1,320km²
      description: 'Sunderland and surrounding areas'
    },
    {
      name: 'Durham Area',
      bbox: '-1.8,54.5,-1.4,54.8', // ~40km x 33km ≈ 1,320km²
      description: 'Durham and surrounding areas'
    },
    {
      name: 'A1 Corridor North',
      bbox: '-1.8,54.9,-1.5,55.2', // ~30km x 33km ≈ 990km²
      description: 'A1 Newcastle to Cramlington'
    },
    {
      name: 'A19 Corridor',
      bbox: '-1.6,54.8,-1.3,55.1', // ~30km x 33km ≈ 990km²
      description: 'A19 through Tyne Tunnel area'
    }
  ];
  
  let workingAreas = [];
  
  for (const area of testAreas) {
    console.log(`\n🧪 Testing: ${area.name}`);
    console.log(`📍 Bounding box: ${area.bbox}`);
    console.log(`📋 ${area.description}`);
    
    try {
      const response = await axios.get('https://api.tomtom.com/traffic/services/5/incidentDetails', {
        params: {
          key: apiKey,
          bbox: area.bbox,
          zoom: 10
        },
        timeout: 15000,
        headers: {
          'User-Agent': 'BARRY-TrafficWatch/3.0-Fixed',
          'Accept': 'application/json'
        }
      });
      
      console.log(`✅ SUCCESS! Status: ${response.status}`);
      
      if (response.data && response.data.tm && response.data.tm.poi) {
        const incidents = response.data.tm.poi;
        console.log(`🚦 Incidents found: ${incidents.length}`);
        
        if (incidents.length > 0) {
          console.log(`📍 Sample incidents:`);
          incidents.slice(0, 3).forEach((incident, i) => {
            console.log(`   ${i+1}. ${incident.ty || 'Incident'} on ${incident.rdN || 'unknown'}`);
            console.log(`      ${incident.d || 'No description'}`);
            console.log(`      Coords: ${incident.p ? `${incident.p.y}, ${incident.p.x}` : 'N/A'}`);
          });
        }
        
        workingAreas.push({
          ...area,
          incidents: incidents.length,
          success: true
        });
        
      } else {
        console.log(`⚠️ Unexpected response format`);
        console.log(`Response:`, JSON.stringify(response.data, null, 2));
      }
      
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      if (error.response && error.response.data) {
        console.log(`   Error details:`, error.response.data);
      }
      
      workingAreas.push({
        ...area,
        incidents: 0,
        success: false,
        error: error.message
      });
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log(`\n📊 SUMMARY:`);
  console.log(`✅ Working areas: ${workingAreas.filter(a => a.success).length}`);
  console.log(`❌ Failed areas: ${workingAreas.filter(a => !a.success).length}`);
  console.log(`🚦 Total incidents found: ${workingAreas.reduce((sum, a) => sum + a.incidents, 0)}`);
  
  const bestAreas = workingAreas.filter(a => a.success && a.incidents > 0);
  if (bestAreas.length > 0) {
    console.log(`\n🎯 BEST AREAS WITH INCIDENTS:`);
    bestAreas.forEach(area => {
      console.log(`   ${area.name}: ${area.incidents} incidents (bbox: ${area.bbox})`);
    });
  }
  
  return workingAreas;
}

// Test with known busy area (London) to confirm API works
async function testLondonSmall() {
  console.log(`\n🏙️ Testing small London area (known busy)...`);
  
  try {
    const response = await axios.get('https://api.tomtom.com/traffic/services/5/incidentDetails', {
      params: {
        key: process.env.TOMTOM_API_KEY,
        bbox: '-0.2,51.4,0.1,51.6', // Small central London area
        zoom: 10
      },
      timeout: 15000
    });
    
    console.log(`✅ London small area: ${response.status}`);
    
    if (response.data && response.data.tm && response.data.tm.poi) {
      console.log(`🚦 London incidents: ${response.data.tm.poi.length}`);
      if (response.data.tm.poi.length > 0) {
        const sample = response.data.tm.poi[0];
        console.log(`📍 Sample: ${sample.ty} on ${sample.rdN || 'unknown road'}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ London test failed: ${error.message}`);
  }
}

async function runFinalTest() {
  const results = await testSmallerBoundingBoxes();
  await testLondonSmall();
  
  console.log(`\n🔧 IMPLEMENTATION RECOMMENDATION:`);
  console.log(`📡 API Endpoint: https://api.tomtom.com/traffic/services/5/incidentDetails`);
  console.log(`📋 Method: Query parameters with bbox under 10,000km²`);
  console.log(`💡 Strategy: Use multiple smaller bounding boxes or focus on key areas`);
}

runFinalTest().catch(console.error);