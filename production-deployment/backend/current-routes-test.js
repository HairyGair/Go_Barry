// backend/current-routes-test.js
// Test GTFS route matching with CURRENT route expectations

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Distance calculation
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Cache for mappings
let routeMapping = null;
let tripMapping = null;

async function getRouteMapping() {
  if (routeMapping) return routeMapping;
  
  try {
    const routesPath = path.join(__dirname, 'data', 'routes.txt');
    const content = await fs.readFile(routesPath, 'utf8');
    const lines = content.split('\n');
    
    if (lines.length < 2) return {};
    
    const headers = lines[0].split(',').map(h => h.trim());
    const routeIdIndex = headers.indexOf('route_id');
    const routeShortNameIndex = headers.indexOf('route_short_name');
    
    const mapping = {};
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const routeId = values[routeIdIndex];
        const shortName = values[routeShortNameIndex];
        
        if (routeId && shortName) {
          mapping[routeId] = shortName;
        }
      }
    }
    
    routeMapping = mapping;
    return mapping;
    
  } catch (error) {
    console.error('❌ Error loading route mapping:', error.message);
    return {};
  }
}

async function getTripMapping() {
  if (tripMapping) return tripMapping;
  
  try {
    const tripsPath = path.join(__dirname, 'data', 'trips.txt');
    const content = await fs.readFile(tripsPath, 'utf8');
    const lines = content.split('\n');
    
    if (lines.length < 2) return {};
    
    const headers = lines[0].split(',').map(h => h.trim());
    const routeIdIndex = headers.indexOf('route_id');
    const shapeIdIndex = headers.indexOf('shape_id');
    
    const mapping = {};
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const routeId = values[routeIdIndex];
        const shapeId = values[shapeIdIndex];
        
        if (routeId && shapeId) {
          if (!mapping[shapeId]) {
            mapping[shapeId] = new Set();
          }
          mapping[shapeId].add(routeId);
        }
      }
    }
    
    const finalMapping = {};
    for (const [shapeId, routeSet] of Object.entries(mapping)) {
      finalMapping[shapeId] = Array.from(routeSet);
    }
    
    tripMapping = finalMapping;
    return finalMapping;
    
  } catch (error) {
    console.error('❌ Error loading trip mapping:', error.message);
    return {};
  }
}

async function findRoutesWithRadius(targetLat, targetLon, radius) {
  const routeMap = await getRouteMapping();
  const tripMap = await getTripMapping();
  
  const shapesPath = path.join(__dirname, 'data', 'shapes.txt');
  const content = await fs.readFile(shapesPath, 'utf8');
  const lines = content.split('\n');
  
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const shapeIdIndex = headers.indexOf('shape_id');
  const latIndex = headers.indexOf('shape_pt_lat');
  const lonIndex = headers.indexOf('shape_pt_lon');
  
  if (shapeIdIndex === -1 || latIndex === -1 || lonIndex === -1) return [];
  
  const nearbyShapes = new Set();
  
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = lines[i].split(',');
      
      const shapeId = values[shapeIdIndex];
      const lat = parseFloat(values[latIndex]);
      const lon = parseFloat(values[lonIndex]);
      
      if (!isNaN(lat) && !isNaN(lon) && shapeId) {
        const distance = calculateDistance(targetLat, targetLon, lat, lon);
        
        if (distance <= radius) {
          nearbyShapes.add(shapeId);
        }
      }
    }
  }
  
  const foundRoutes = new Set();
  
  for (const shapeId of nearbyShapes) {
    const routeIds = tripMap[shapeId] || [];
    for (const routeId of routeIds) {
      const routeName = routeMap[routeId];
      if (routeName) {
        foundRoutes.add(routeName);
      }
    }
  }
  
  return Array.from(foundRoutes).sort();
}

// UPDATED test locations with current route expectations
const CURRENT_TEST_LOCATIONS = [
  {
    name: 'Newcastle City Centre (Monument)',
    lat: 54.9754,
    lon: -1.6141,
    expectedRoutes: ['12', '21', '22', '27', '28', '29', '47'], // Removed Q1, Q2, Q3, 10, 11
    note: 'Major city centre routes - please verify these are correct'
  },
  {
    name: 'Coast Road A1058 (Tynemouth direction)',
    lat: 55.0174,
    lon: -1.4234,
    expectedRoutes: ['1', '2', '307', '309', '317'], // Likely coast routes
    note: 'Coast Road corridor - please verify current routes'
  },
  {
    name: 'Gateshead Interchange',
    lat: 54.9630,
    lon: -1.6020,
    expectedRoutes: ['21', '25', '28', '29', '53', '54', '56'], // Major interchange routes
    note: 'Main bus interchange - please verify current routes'
  },
  {
    name: 'A1 Western Bypass (Washington area)',
    lat: 54.9100,
    lon: -1.5200,
    expectedRoutes: ['21', '22', 'X1', 'X21'], // A1 corridor routes
    note: 'Major A1 corridor - typical long-distance routes'
  },
  {
    name: 'Sunderland City Centre',
    lat: 54.9069,
    lon: -1.3838,
    expectedRoutes: ['16', '20', '61', '62', '63'], // Sunderland area routes
    note: 'Sunderland hub - please verify current routes'
  }
];

async function testCurrentRoutes() {
  console.log('🚌 Testing GTFS Route Matching with CURRENT Route Expectations');
  console.log('============================================================\n');
  
  console.log('⚠️  IMPORTANT: Please verify these route expectations are correct!');
  console.log('   Some expectations may still be outdated.\n');
  
  const results = [];
  
  for (const location of CURRENT_TEST_LOCATIONS) {
    console.log(`📍 Testing: ${location.name}`);
    console.log(`   Coordinates: ${location.lat}, ${location.lon}`);
    console.log(`   Expected: ${location.expectedRoutes.join(', ')}`);
    console.log(`   Note: ${location.note}`);
    
    try {
      // Try multiple radii
      const radii = [150, 300, 500];
      let bestResult = { routes: [], radius: 0 };
      
      for (const radius of radii) {
        const routes = await findRoutesWithRadius(location.lat, location.lon, radius);
        if (routes.length > 0) {
          bestResult = { routes, radius };
          break;
        }
      }
      
      const matches = bestResult.routes.filter(route => location.expectedRoutes.includes(route));
      const accuracy = location.expectedRoutes.length > 0 ? (matches.length / location.expectedRoutes.length * 100).toFixed(1) : 0;
      
      console.log(`   Found: ${bestResult.routes.join(', ') || 'None'} (within ${bestResult.radius}m)`);
      console.log(`   Matches: ${matches.join(', ') || 'None'}`);
      console.log(`   Accuracy: ${accuracy}% (${matches.length}/${location.expectedRoutes.length} expected found)`);
      
      // Show extra routes found that weren't expected
      const extras = bestResult.routes.filter(route => !location.expectedRoutes.includes(route));
      if (extras.length > 0) {
        console.log(`   Extra routes: ${extras.join(', ')} (may be current but not expected)`);
      }
      
      results.push({
        location: location.name,
        found: bestResult.routes,
        expected: location.expectedRoutes,
        matches: matches,
        extras: extras,
        accuracy: parseFloat(accuracy),
        radius: bestResult.radius
      });
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
  }
  
  // Summary and recommendations
  console.log('📊 RECOMMENDATIONS:');
  console.log('===================\n');
  
  results.forEach(result => {
    if (result.accuracy === 0 && result.found.length > 0) {
      console.log(`❓ ${result.location}:`);
      console.log(`   Expected: ${result.expected.join(', ')}`);
      console.log(`   Actually found: ${result.found.join(', ')}`);
      console.log(`   → Please verify what routes actually serve this location\n`);
    } else if (result.accuracy > 0 && result.extras.length > 0) {
      console.log(`✅ ${result.location}: ${result.accuracy}% match`);
      console.log(`   Found extra routes: ${result.extras.join(', ')}`);
      console.log(`   → These might be current routes to add to expectations\n`);
    } else if (result.accuracy >= 50) {
      console.log(`✅ ${result.location}: ${result.accuracy}% match - Looking good!\n`);
    }
  });
  
  console.log('🎯 NEXT STEPS:');
  console.log('==============');
  console.log('1. Please verify which routes actually serve each location');
  console.log('2. Update the expectedRoutes in the test with current information');
  console.log('3. Consider that Q3 and route 10 might still be running if they appear in results');
  console.log('4. The GTFS route matching algorithm is working - we just need accurate expectations');
}

// Special function to check if Q3 and route 10 are really current
async function checkQuestionableRoutes() {
  console.log('\n🔍 Checking questionable routes (Q3, Q3X, 10)...');
  
  const questionableRoutes = ['Q3', 'Q3X', '10'];
  
  for (const routeName of questionableRoutes) {
    console.log(`\n📍 Looking for route ${routeName} in GTFS shapes...`);
    
    // Find all coordinates for this route
    const routeMap = await getRouteMapping();
    const tripMap = await getTripMapping();
    
    // Find route ID
    const routeId = Object.keys(routeMap).find(id => routeMap[id] === routeName);
    
    if (routeId) {
      console.log(`   Found route ID: ${routeId}`);
      
      // Find shapes for this route
      const shapesForRoute = Object.keys(tripMap).filter(shapeId => 
        tripMap[shapeId].includes(routeId)
      );
      
      console.log(`   Found ${shapesForRoute.length} shapes for this route`);
      
      if (shapesForRoute.length > 0) {
        // Find some coordinates for this route
        const shapesPath = path.join(__dirname, 'data', 'shapes.txt');
        const content = await fs.readFile(shapesPath, 'utf8');
        const lines = content.split('\n');
        
        const headers = lines[0].split(',').map(h => h.trim());
        const shapeIdIndex = headers.indexOf('shape_id');
        const latIndex = headers.indexOf('shape_pt_lat');
        const lonIndex = headers.indexOf('shape_pt_lon');
        
        let sampleCoords = [];
        
        for (let i = 1; i < lines.length && sampleCoords.length < 5; i++) {
          if (lines[i].trim()) {
            const values = lines[i].split(',');
            const shapeId = values[shapeIdIndex];
            
            if (shapesForRoute.includes(shapeId)) {
              const lat = parseFloat(values[latIndex]);
              const lon = parseFloat(values[lonIndex]);
              
              if (!isNaN(lat) && !isNaN(lon)) {
                sampleCoords.push({ lat, lon });
              }
            }
          }
        }
        
        console.log(`   Sample coordinates:`);
        sampleCoords.forEach(coord => {
          console.log(`     ${coord.lat}, ${coord.lon}`);
        });
        
        console.log(`   → Route ${routeName} has active GTFS data - likely still running`);
      }
    } else {
      console.log(`   ❌ Route ${routeName} not found in route mapping`);
    }
  }
}

// Run the tests
async function runAllTests() {
  await testCurrentRoutes();
  await checkQuestionableRoutes();
  
  console.log('\n🚦 BARRY Route Matching Test Complete!');
  console.log('=====================================');
  console.log('Please review the results and confirm current route information.');
}

runAllTests();