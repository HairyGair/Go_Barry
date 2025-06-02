// backend/fixed-gtfs-test.js
// Fixed version of GTFS route matching with proper coordinate parsing

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Haversine distance calculation (in meters)
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

// Load route mapping from routes.txt
async function loadRouteMapping() {
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
    
    console.log(`✅ Loaded ${Object.keys(mapping).length} route mappings`);
    return mapping;
    
  } catch (error) {
    console.error('❌ Error loading route mapping:', error.message);
    return {};
  }
}

// Load trip to route mapping
async function loadTripMapping() {
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
    
    // Convert Sets to Arrays
    const finalMapping = {};
    for (const [shapeId, routeSet] of Object.entries(mapping)) {
      finalMapping[shapeId] = Array.from(routeSet);
    }
    
    console.log(`✅ Loaded ${Object.keys(finalMapping).length} shape-to-route mappings`);
    return finalMapping;
    
  } catch (error) {
    console.error('❌ Error loading trip mapping:', error.message);
    return {};
  }
}

// Find routes near a coordinate
async function findRoutesNearCoordinate(targetLat, targetLon, maxDistanceMeters = 100) {
  console.log(`🔍 Finding GTFS routes near ${targetLat}, ${targetLon} (within ${maxDistanceMeters}m)...`);
  
  const routeMapping = await loadRouteMapping();
  const tripMapping = await loadTripMapping();
  
  const shapesPath = path.join(__dirname, 'data', 'shapes.txt');
  const content = await fs.readFile(shapesPath, 'utf8');
  const lines = content.split('\n');
  
  if (lines.length < 2) {
    console.log('❌ No data in shapes.txt');
    return [];
  }
  
  const headers = lines[0].split(',').map(h => h.trim());
  const shapeIdIndex = headers.indexOf('shape_id');
  const latIndex = headers.indexOf('shape_pt_lat');
  const lonIndex = headers.indexOf('shape_pt_lon');
  
  if (shapeIdIndex === -1 || latIndex === -1 || lonIndex === -1) {
    console.log('❌ Missing required columns in shapes.txt');
    return [];
  }
  
  const nearbyShapes = new Set();
  let processedPoints = 0;
  let matchingPoints = 0;
  
  console.log('📐 Searching through shapes.txt...');
  
  // Process each line
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = lines[i].split(',').map(v => v.trim());
      
      const shapeId = values[shapeIdIndex];
      const lat = parseFloat(values[latIndex]);
      const lon = parseFloat(values[lonIndex]);
      
      if (!isNaN(lat) && !isNaN(lon) && shapeId) {
        processedPoints++;
        
        // Show progress every 50k points
        if (processedPoints % 50000 === 0) {
          console.log(`   Processed ${processedPoints} points, found ${matchingPoints} matches...`);
        }
        
        const distance = calculateDistance(targetLat, targetLon, lat, lon);
        
        if (distance <= maxDistanceMeters) {
          nearbyShapes.add(shapeId);
          matchingPoints++;
          
          if (matchingPoints <= 10) {
            console.log(`   ✅ Match: ${shapeId} at ${lat}, ${lon} (${distance.toFixed(1)}m away)`);
          }
        }
      }
    }
  }
  
  console.log(`📊 Processed ${processedPoints} shape points, found ${matchingPoints} matches within ${maxDistanceMeters}m`);
  
  // Convert shapes to routes
  const foundRoutes = new Set();
  
  for (const shapeId of nearbyShapes) {
    const routeIds = tripMapping[shapeId] || [];
    for (const routeId of routeIds) {
      const routeName = routeMapping[routeId];
      if (routeName) {
        foundRoutes.add(routeName);
      }
    }
  }
  
  const routeArray = Array.from(foundRoutes).sort();
  
  console.log(`🎯 Found ${nearbyShapes.size} nearby shapes mapping to ${routeArray.length} routes:`);
  console.log(`   Routes: ${routeArray.join(', ') || 'None'}`);
  
  return routeArray;
}

// Test function
async function testRouteMatching() {
  console.log('🚌 Fixed GTFS Route Matcher Test\n');
  
  const testLocations = [
    {
      name: 'Coast Road, Tynemouth', 
      lat: 55.02, 
      lon: -1.42,
      expectedRoutes: ['1', '306', '307', '308', '309', '311']
    },
    {
      name: 'Newcastle City Centre (Monument)', 
      lat: 54.9755, 
      lon: -1.6143,
      expectedRoutes: ['Q1', 'Q2', 'Q3', '10', '11', '12']
    },
    {
      name: 'Gateshead Interchange', 
      lat: 54.9633, 
      lon: -1.6007,
      expectedRoutes: ['21', '25', '28', '29', '53']
    },
    {
      name: 'Durham Bus Station', 
      lat: 54.7761, 
      lon: -1.5756,
      expectedRoutes: ['21', '22', 'X21', '6', '7']
    }
  ];
  
  for (const location of testLocations) {
    console.log(`📍 Testing: ${location.name} (${location.lat}, ${location.lon})`);
    
    try {
      const foundRoutes = await findRoutesNearCoordinate(location.lat, location.lon, 150);
      
      console.log(`   Found routes: ${foundRoutes.join(', ') || 'None'}`);
      console.log(`   Expected: ${location.expectedRoutes.join(', ')}`);
      
      // Check accuracy
      const matches = foundRoutes.filter(route => location.expectedRoutes.includes(route));
      const accuracy = foundRoutes.length > 0 ? (matches.length / foundRoutes.length * 100).toFixed(1) : 0;
      
      console.log(`   Accuracy: ${accuracy}% (${matches.length}/${foundRoutes.length} routes correct)`);
      
      if (matches.length > 0) {
        console.log(`   ✅ Matching routes: ${matches.join(', ')}`);
      } else if (foundRoutes.length > 0) {
        console.log(`   ⚠️ No expected routes found, but found: ${foundRoutes.join(', ')}`);
      } else {
        console.log(`   ❌ No routes found at all`);
      }
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
  }
}

// Also test with wider search radius
async function testWiderSearch() {
  console.log('🔍 Testing with wider search radius (500m)...\n');
  
  const location = { name: 'Newcastle City Centre', lat: 54.9755, lon: -1.6143 };
  
  console.log(`📍 Testing: ${location.name} (${location.lat}, ${location.lon})`);
  
  const foundRoutes = await findRoutesNearCoordinate(location.lat, location.lon, 500);
  
  console.log(`🎯 Found ${foundRoutes.length} routes within 500m: ${foundRoutes.join(', ')}`);
}

// Run tests
async function runTests() {
  try {
    await testRouteMatching();
    await testWiderSearch();
    
    console.log('✅ Testing complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

runTests();