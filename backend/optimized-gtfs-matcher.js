// backend/optimized-gtfs-matcher.js
// Production-ready GTFS route matcher with adaptive search and better coordinates

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

// Cache for route mappings
let routeMapping = null;
let tripMapping = null;

// Load route mapping (cached)
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
    console.log(`✅ Loaded ${Object.keys(mapping).length} route mappings`);
    return mapping;
    
  } catch (error) {
    console.error('❌ Error loading route mapping:', error.message);
    return {};
  }
}

// Load trip mapping (cached)
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
    
    // Convert Sets to Arrays
    const finalMapping = {};
    for (const [shapeId, routeSet] of Object.entries(mapping)) {
      finalMapping[shapeId] = Array.from(routeSet);
    }
    
    tripMapping = finalMapping;
    console.log(`✅ Loaded ${Object.keys(finalMapping).length} shape-to-route mappings`);
    return finalMapping;
    
  } catch (error) {
    console.error('❌ Error loading trip mapping:', error.message);
    return {};
  }
}

// Adaptive route finder with multiple search radii
async function findRoutesNearCoordinate(targetLat, targetLon, searchRadii = [100, 250, 500]) {
  console.log(`🔍 Finding routes near ${targetLat}, ${targetLon} with adaptive search...`);
  
  const routeMap = await getRouteMapping();
  const tripMap = await getTripMapping();
  
  // Try each search radius until we find routes
  for (const radius of searchRadii) {
    console.log(`  📐 Trying ${radius}m radius...`);
    
    const routes = await searchWithRadius(targetLat, targetLon, radius, routeMap, tripMap);
    
    if (routes.length > 0) {
      console.log(`  ✅ Found ${routes.length} routes within ${radius}m: ${routes.join(', ')}`);
      return { routes, radius, coordinates: { lat: targetLat, lon: targetLon } };
    }
  }
  
  console.log(`  ❌ No routes found within any search radius`);
  return { routes: [], radius: searchRadii[searchRadii.length - 1], coordinates: { lat: targetLat, lon: targetLon } };
}

// Search with specific radius
async function searchWithRadius(targetLat, targetLon, maxDistanceMeters, routeMap, tripMap) {
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
  let processedPoints = 0;
  
  // Process each line (optimized for speed)
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = lines[i].split(',');
      
      const shapeId = values[shapeIdIndex];
      const lat = parseFloat(values[latIndex]);
      const lon = parseFloat(values[lonIndex]);
      
      if (!isNaN(lat) && !isNaN(lon) && shapeId) {
        processedPoints++;
        
        const distance = calculateDistance(targetLat, targetLon, lat, lon);
        
        if (distance <= maxDistanceMeters) {
          nearbyShapes.add(shapeId);
        }
      }
    }
  }
  
  // Convert shapes to routes
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

// Updated test coordinates (more precise)
const TEST_LOCATIONS = [
  {
    name: 'Coast Road A1058, Tynemouth',
    lat: 55.0174, // More precise Coast Road coordinate
    lon: -1.4234,
    expectedRoutes: ['1', '306', '307', '308', '309', '311'],
    description: 'Major Coast Road junction'
  },
  {
    name: 'Newcastle Monument/Grey Street',
    lat: 54.9754, // Very precise Monument coordinate
    lon: -1.6141,
    expectedRoutes: ['Q1', 'Q2', 'Q3', '10', '11', '12'],
    description: 'City centre transport hub'
  },
  {
    name: 'Gateshead Interchange',
    lat: 54.9630, // More precise Gateshead coordinate
    lon: -1.6020,
    expectedRoutes: ['21', '25', '28', '29', '53', '54', '56'],
    description: 'Major bus interchange'
  },
  {
    name: 'Durham North Road (near Bus Station)',
    lat: 54.7780, // More precise Durham coordinate
    lon: -1.5745,
    expectedRoutes: ['21', '22', 'X21', '6', '7', '13', '14'],
    description: 'Durham transport hub'
  },
  {
    name: 'A19 Tyne Tunnel Approach',
    lat: 54.9890,
    lon: -1.4680,
    expectedRoutes: ['1', '2', '308', '309', '311'],
    description: 'Major tunnel approach route'
  },
  {
    name: 'Sunderland City Centre',
    lat: 54.9069,
    lon: -1.3838,
    expectedRoutes: ['16', '18', '20', '61', '62', '63'],
    description: 'Sunderland transport hub'
  }
];

// Main test function
async function runOptimizedTests() {
  console.log('🚌 Optimized GTFS Route Matcher Test\n');
  console.log('🎯 Using adaptive search radii: 100m → 250m → 500m\n');
  
  const results = [];
  
  for (const location of TEST_LOCATIONS) {
    console.log(`📍 Testing: ${location.name}`);
    console.log(`   Coordinates: ${location.lat}, ${location.lon}`);
    console.log(`   Expected: ${location.expectedRoutes.join(', ')}`);
    
    try {
      const result = await findRoutesNearCoordinate(location.lat, location.lon);
      
      // Calculate accuracy
      const matches = result.routes.filter(route => location.expectedRoutes.includes(route));
      const accuracy = result.routes.length > 0 ? (matches.length / location.expectedRoutes.length * 100).toFixed(1) : 0;
      
      console.log(`   Found: ${result.routes.join(', ') || 'None'} (within ${result.radius}m)`);
      console.log(`   Matches: ${matches.join(', ') || 'None'}`);
      console.log(`   Accuracy: ${accuracy}% (${matches.length}/${location.expectedRoutes.length} expected routes found)`);
      
      results.push({
        location: location.name,
        expected: location.expectedRoutes.length,
        found: result.routes.length,
        matches: matches.length,
        accuracy: parseFloat(accuracy),
        radius: result.radius,
        routes: result.routes
      });
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      results.push({
        location: location.name,
        expected: location.expectedRoutes.length,
        found: 0,
        matches: 0,
        accuracy: 0,
        radius: 0,
        error: error.message
      });
    }
    
    console.log('');
  }
  
  // Summary
  console.log('📊 Test Summary:');
  console.log('================');
  
  const totalExpected = results.reduce((sum, r) => sum + r.expected, 0);
  const totalMatches = results.reduce((sum, r) => sum + r.matches, 0);
  const overallAccuracy = totalExpected > 0 ? (totalMatches / totalExpected * 100).toFixed(1) : 0;
  
  console.log(`Overall Accuracy: ${overallAccuracy}% (${totalMatches}/${totalExpected} expected routes found)`);
  console.log('');
  
  results.forEach(result => {
    const status = result.accuracy >= 50 ? '✅' : result.accuracy > 0 ? '⚠️' : '❌';
    console.log(`${status} ${result.location}: ${result.accuracy}% (${result.matches}/${result.expected})`);
  });
  
  console.log('\n🎯 Best performing locations:');
  const sorted = results.filter(r => r.accuracy > 0).sort((a, b) => b.accuracy - a.accuracy);
  sorted.slice(0, 3).forEach(result => {
    console.log(`   ${result.location}: ${result.accuracy}% - Found routes: ${result.routes.slice(0, 5).join(', ')}${result.routes.length > 5 ? '...' : ''}`);
  });
}

// Export for integration into main backend
export async function matchRoutesToLocation(lat, lon, description = '') {
  try {
    const result = await findRoutesNearCoordinate(lat, lon, [100, 250, 500]);
    return {
      success: true,
      routes: result.routes,
      searchRadius: result.radius,
      location: { lat, lon },
      method: 'GTFS_COORDINATE_MATCHING'
    };
  } catch (error) {
    console.error('Route matching error:', error.message);
    return {
      success: false,
      routes: [],
      error: error.message,
      method: 'GTFS_COORDINATE_MATCHING'
    };
  }
}

// Export for text-based matching (fallback)
export function matchRoutesToText(locationText, description = '') {
  // Fallback text-based matching for when coordinates aren't available
  const text = `${locationText} ${description}`.toLowerCase();
  const routes = new Set();
  
  // Simple pattern matching as fallback
  const patterns = {
    'a1': ['X9', 'X10', '10', '11', '21', 'X21'],
    'a19': ['1', '2', '308', '309', '311'],
    'coast road': ['1', '306', '307', '308', '309', '311'],
    'newcastle': ['Q1', 'Q2', 'Q3', '10', '11', '12'],
    'gateshead': ['21', '25', '28', '29', '53', '54'],
    'durham': ['21', '22', 'X21', '6', '7', '13'],
    'sunderland': ['16', '18', '20', '61', '62', '63']
  };
  
  for (const [pattern, routeList] of Object.entries(patterns)) {
    if (text.includes(pattern)) {
      routeList.forEach(route => routes.add(route));
    }
  }
  
  return {
    success: true,
    routes: Array.from(routes).sort(),
    method: 'TEXT_PATTERN_MATCHING'
  };
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runOptimizedTests();
}