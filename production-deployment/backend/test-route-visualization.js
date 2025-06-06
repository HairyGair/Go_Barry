// backend/test-route-visualization.js
// Test script for Route Visualization System

import {
  initializeRouteVisualization,
  getRouteVisualization,
  getAvailableRoutes,
  getVisualizationStats
} from './services/routeVisualizationService.js';

async function testRouteVisualization() {
  console.log('🧪 Testing Route Visualization System...\n');
  
  try {
    // Test 1: Initialize the system
    console.log('1️⃣ Testing initialization...');
    const initSuccess = await initializeRouteVisualization();
    console.log(`   ✅ Initialization: ${initSuccess ? 'SUCCESS' : 'FAILED'}\n`);
    
    // Test 2: Get system stats
    console.log('2️⃣ Testing system stats...');
    const stats = getVisualizationStats();
    console.log('   📊 System Stats:');
    console.log(`      Routes loaded: ${stats.routeCount}`);
    console.log(`      Total shapes: ${stats.totalShapes}`);
    console.log(`      Total stops: ${stats.totalStops}`);
    console.log(`      Initialized: ${stats.initialized}\n`);
    
    // Test 3: Get all available routes
    console.log('3️⃣ Testing available routes...');
    const allRoutes = await getAvailableRoutes();
    if (allRoutes.success) {
      console.log(`   ✅ Found ${allRoutes.totalRoutes} routes`);
      console.log(`   📋 Sample routes: ${allRoutes.routes.slice(0, 10).map(r => r.routeNumber).join(', ')}\n`);
    } else {
      console.log('   ❌ Failed to get available routes\n');
    }
    
    // Test 4: Test specific route visualization
    const testRoutes = ['21', '1', 'Q3', 'X21', '10'];
    console.log('4️⃣ Testing specific route visualizations...');
    
    for (const routeNumber of testRoutes) {
      console.log(`   Testing route ${routeNumber}...`);
      const routeViz = await getRouteVisualization(routeNumber);
      
      if (routeViz.success) {
        console.log(`   ✅ Route ${routeNumber}:`);
        console.log(`      Distance: ${routeViz.metadata.distanceKm} km`);
        console.log(`      Journey time: ${routeViz.metadata.estimatedJourneyTime} minutes`);
        console.log(`      Stops: ${routeViz.metadata.stopCount}`);
        console.log(`      Shapes: ${routeViz.shapes.length}`);
        console.log(`      Wheelchair accessible: ${routeViz.metadata.wheelchairAccessible}`);
        
        // Show first and last stop
        if (routeViz.stops.length > 0) {
          console.log(`      First stop: ${routeViz.stops[0].name}`);
          console.log(`      Last stop: ${routeViz.stops[routeViz.stops.length - 1].name}`);
        }
        
        // Show sample coordinates
        if (routeViz.shapes.length > 0 && routeViz.shapes[0].coordinates.length > 0) {
          const firstCoord = routeViz.shapes[0].coordinates[0];
          console.log(`      First coordinate: ${firstCoord[0]}, ${firstCoord[1]}`);
        }
      } else {
        console.log(`   ❌ Route ${routeNumber}: ${routeViz.error}`);
      }
      console.log('');
    }
    
    // Test 5: Test API endpoints format
    console.log('5️⃣ Testing API response formats...');
    const sampleRoute = '21';
    const routeData = await getRouteVisualization(sampleRoute);
    
    if (routeData.success) {
      console.log(`   ✅ Route ${sampleRoute} API format check:`);
      console.log('      ✓ Has shapes array');
      console.log('      ✓ Has stops array');
      console.log('      ✓ Has metadata object');
      console.log('      ✓ Has GeoJSON format');
      console.log('      ✓ Has coordinate arrays');
      
      // Check GeoJSON format
      if (routeData.shapes[0]?.geoJson) {
        console.log('      ✓ GeoJSON format valid');
        console.log(`        Type: ${routeData.shapes[0].geoJson.type}`);
        console.log(`        Coordinates: ${routeData.shapes[0].geoJson.coordinates.length} points`);
      }
    }
    
    console.log('\n🎉 Route Visualization Test Complete!');
    console.log('\n📡 Available API Endpoints:');
    console.log('   GET  /api/routes/initialize');
    console.log('   GET  /api/routes/all');
    console.log('   GET  /api/routes/stats');
    console.log('   GET  /api/routes/:routeNumber/visualization');
    console.log('   GET  /api/routes/:routeNumber/info');
    console.log('   GET  /api/routes/:routeNumber/stops');
    console.log('   GET  /api/routes/search?q=21');
    console.log('   GET  /api/routes/area?north=55.1&south=54.8&east=-1.4&west=-1.8');
    console.log('   POST /api/routes/bulk');
    console.log('\n🔗 Test URLs (when server is running):');
    console.log('   http://localhost:3001/api/routes/stats');
    console.log('   http://localhost:3001/api/routes/21/visualization');
    console.log('   http://localhost:3001/api/routes/all');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testRouteVisualization();
