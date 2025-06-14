#!/usr/bin/env node

/**
 * Test script for TomTom Enhancement Features
 * Demonstrates all 4 new capabilities
 */

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

const BACKEND_URL = process.env.BACKEND_URL || 'https://go-barry.onrender.com';

// Test 1: Enhanced Location Service
async function testLocationEnhancement() {
  console.log(`\n${colors.blue}🔍 Test 1: Enhanced Location Service${colors.reset}`);
  console.log('Testing: "Monument Metro Station Newcastle"');
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/enhancement/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'Monument Metro Station Newcastle',
        nearLat: 54.978,
        nearLon: -1.618
      })
    });
    
    const data = await response.json();
    
    if (data.success && data.enhanced) {
      console.log(`${colors.green}✅ Location enhanced successfully!${colors.reset}`);
      console.log(`   Original: ${data.original}`);
      console.log(`   Enhanced: ${data.enhanced.enhancedLocation}`);
      console.log(`   Street: ${data.enhanced.streetName || 'N/A'}`);
      console.log(`   Coordinates: ${data.enhanced.coordinates.lat.toFixed(4)}, ${data.enhanced.coordinates.lon.toFixed(4)}`);
      console.log(`   Confidence: ${(data.enhanced.confidence * 100).toFixed(1)}%`);
    } else {
      console.log(`${colors.red}❌ Location enhancement failed${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
  }
}

// Test 2: Reverse Geocoding with Landmarks
async function testReverseGeocoding() {
  console.log(`\n${colors.blue}📍 Test 2: Reverse Geocoding with Landmarks${colors.reset}`);
  console.log('Testing: Coordinates of Eldon Square (54.9764, -1.6155)');
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/enhancement/reverse-geocode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lat: 54.9764,
        lon: -1.6155
      })
    });
    
    const data = await response.json();
    
    if (data.success && data.result) {
      console.log(`${colors.green}✅ Reverse geocoding successful!${colors.reset}`);
      console.log(`   Street: ${data.result.streetName || 'Unknown'}`);
      console.log(`   Area: ${data.result.area}`);
      console.log(`   Full address: ${data.result.fullAddress}`);
      console.log(`   Description: ${data.result.description}`);
      
      if (data.result.nearbyLandmarks && data.result.nearbyLandmarks.length > 0) {
        console.log(`   ${colors.cyan}Nearby landmarks:${colors.reset}`);
        data.result.nearbyLandmarks.forEach(landmark => {
          console.log(`     - ${landmark.name} (${landmark.category}) - ${landmark.distance}m away`);
        });
      }
    } else {
      console.log(`${colors.red}❌ Reverse geocoding failed${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
  }
}

// Test 3: Alternative Route Calculation
async function testAlternativeRoute() {
  console.log(`\n${colors.blue}🗺️  Test 3: Alternative Route Suggester${colors.reset}`);
  console.log('Testing: Route from Newcastle to Gateshead avoiding Tyne Bridge incident');
  
  try {
    // Newcastle Central Station to Gateshead Interchange
    const response = await fetch(`${BACKEND_URL}/api/enhancement/alternative-route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start: { lat: 54.9783, lon: -1.6178 }, // Newcastle Central
        end: { lat: 54.9526, lon: -1.6014 },   // Gateshead Interchange
        avoid: { lat: 54.9686, lon: -1.6076 }  // Tyne Bridge area
      })
    });
    
    const data = await response.json();
    
    if (data.success && data.alternative) {
      const alt = data.alternative;
      console.log(`${colors.green}✅ Alternative route calculated!${colors.reset}`);
      console.log(`\n   ${colors.yellow}Normal route:${colors.reset}`);
      console.log(`     Time: ${alt.normalRoute.time} minutes`);
      console.log(`     Distance: ${alt.normalRoute.distance} km`);
      
      console.log(`\n   ${colors.yellow}Alternative route:${colors.reset}`);
      console.log(`     Time: ${alt.alternativeRoute.time} minutes (+${alt.alternativeRoute.timeDifference} min)`);
      console.log(`     Distance: ${alt.alternativeRoute.distance} km (+${alt.alternativeRoute.distanceDifference} km)`);
      
      console.log(`\n   ${colors.cyan}Recommendation: ${alt.recommendation}${colors.reset}`);
      
      if (alt.alternativeRoute.instructions && alt.alternativeRoute.instructions.length > 0) {
        console.log(`\n   Route instructions:`);
        alt.alternativeRoute.instructions.forEach((instruction, i) => {
          console.log(`     ${i + 1}. ${instruction}`);
        });
      }
    } else {
      console.log(`${colors.red}❌ Alternative route calculation failed${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
  }
}

// Test 4: Enhance an incident with all features
async function testIncidentEnhancement() {
  console.log(`\n${colors.blue}✨ Test 4: Complete Incident Enhancement${colors.reset}`);
  console.log('Testing: Enhance a basic incident with all TomTom features');
  
  const sampleIncident = {
    id: 'test_incident_001',
    title: 'Road closure',
    description: 'Emergency roadworks causing delays',
    location: 'Grey Street Newcastle',
    severity: 'High',
    source: 'manual',
    affectsRoutes: ['Q3', '10', '12']
  };
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/enhancement/enhance-incident`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incident: sampleIncident })
    });
    
    const data = await response.json();
    
    if (data.success && data.enhanced) {
      console.log(`${colors.green}✅ Incident enhanced successfully!${colors.reset}`);
      
      console.log(`\n   ${colors.yellow}Original incident:${colors.reset}`);
      console.log(`     Location: ${data.original.location}`);
      console.log(`     Coordinates: ${data.original.coordinates ? 'Yes' : 'No'}`);
      
      console.log(`\n   ${colors.yellow}Enhanced incident:${colors.reset}`);
      if (data.enhanced.enhancedLocation) {
        console.log(`     Enhanced location: ${data.enhanced.enhancedLocation}`);
      }
      if (data.enhanced.streetName) {
        console.log(`     Street name: ${data.enhanced.streetName}`);
      }
      if (data.enhanced.coordinates) {
        console.log(`     Coordinates: ${data.enhanced.coordinates[0].toFixed(4)}, ${data.enhanced.coordinates[1].toFixed(4)}`);
      }
      if (data.enhanced.nearbyLandmarks) {
        console.log(`     Landmarks: ${data.enhanced.nearbyLandmarks.map(l => l.name).join(', ')}`);
      }
      
      console.log(`\n   ${colors.cyan}Improvements:${colors.reset}`);
      Object.entries(data.improvements).forEach(([key, value]) => {
        if (value) {
          console.log(`     ✅ ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        }
      });
    } else {
      console.log(`${colors.red}❌ Incident enhancement failed${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
  }
}

// Test 5: Check API Quota
async function testQuotaCheck() {
  console.log(`\n${colors.blue}📊 Test 5: API Quota Status${colors.reset}`);
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/enhancement/quota`);
    const data = await response.json();
    
    if (data.success && data.quota) {
      console.log(`${colors.green}✅ Quota check successful!${colors.reset}`);
      
      Object.entries(data.quota).forEach(([api, stats]) => {
        if (typeof stats === 'object' && stats.limit) {
          const percentUsed = ((stats.used / stats.limit) * 100).toFixed(1);
          const color = percentUsed > 80 ? colors.red : percentUsed > 50 ? colors.yellow : colors.green;
          
          console.log(`\n   ${api}:`);
          console.log(`     Used: ${stats.used}/${stats.limit} (${color}${percentUsed}%${colors.reset})`);
          console.log(`     Remaining: ${stats.remaining}`);
        }
      });
      
      if (data.quota.message) {
        console.log(`\n   ${colors.yellow}Note: ${data.quota.message}${colors.reset}`);
      }
    } else {
      console.log(`${colors.red}❌ Quota check failed${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
  }
}

// Main test runner
async function runAllTests() {
  console.log(`${colors.cyan}🚀 TomTom Enhancement Service Test Suite${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}`);
  console.log(`Testing against: ${BACKEND_URL}`);
  console.log(`\nThis demonstrates all 4 new TomTom features:`);
  console.log(`1. Enhanced location geocoding`);
  console.log(`2. Reverse geocoding with landmarks`);
  console.log(`3. Alternative route calculation`);
  console.log(`4. Complete incident enhancement`);
  
  await testLocationEnhancement();
  await testReverseGeocoding();
  await testAlternativeRoute();
  await testIncidentEnhancement();
  await testQuotaCheck();
  
  console.log(`\n${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.green}✅ All tests completed!${colors.reset}`);
  console.log(`\n${colors.yellow}💡 Integration Ideas:${colors.reset}`);
  console.log(`- Auto-enhance all manual incidents with better locations`);
  console.log(`- Add landmarks to make incidents easier to locate`);
  console.log(`- Calculate detours when major routes are blocked`);
  console.log(`- Provide route impact analysis for supervisors`);
  console.log(`\n${colors.cyan}Remember: Each API has 2,500 requests/day on free tier${colors.reset}`);
}

// Run tests
runAllTests().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
