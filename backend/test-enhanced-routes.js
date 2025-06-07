#!/usr/bin/env node
// Test Enhanced GTFS Route Matching - Go BARRY
import dotenv from 'dotenv';
import { initializeEnhancedGTFS, enhancedFindRoutesNearCoordinates, getEnhancedGTFSStats } from './enhanced-gtfs-route-matcher.js';
import { fetchTomTomTrafficWithStreetNames } from './services/tomtom.js';

dotenv.config();

console.log('🧪 Testing Enhanced GTFS Route Matching for Go BARRY');
console.log('==================================================\n');

async function testEnhancedRouteMatching() {
  try {
    // Initialize the enhanced GTFS system
    console.log('🚀 Initializing Enhanced GTFS Route Matcher...');
    const initSuccess = await initializeEnhancedGTFS();
    
    if (!initSuccess) {
      console.error('❌ Failed to initialize Enhanced GTFS system');
      return;
    }
    
    // Get system stats
    const stats = getEnhancedGTFSStats();
    console.log('\n📊 Enhanced GTFS System Stats:');
    console.log(`   Routes: ${stats.routes}`);
    console.log(`   Stops: ${stats.stops}`);
    console.log(`   Shapes: ${stats.shapes}`);
    console.log(`   Trip Mappings: ${stats.tripMappings}`);
    console.log(`   Initialized: ${stats.initialized}\n`);
    
    // Test specific Newcastle coordinates
    console.log('🧪 Testing route matching at key Newcastle locations:\n');
    
    const testLocations = [
      { name: 'Newcastle City Centre', lat: 54.9783, lng: -1.6178 },
      { name: 'Gateshead Interchange', lat: 54.9628, lng: -1.6044 },
      { name: 'Metrocentre', lat: 54.9584, lng: -1.6662 },
      { name: 'North Shields', lat: 55.0081, lng: -1.4480 },
      { name: 'Sunderland Centre', lat: 54.9069, lng: -1.3838 },
      { name: 'Washington Galleries', lat: 54.8993, lng: -1.5340 },
      { name: 'A1 at Birtley', lat: 54.9068, lng: -1.5790 },
      { name: 'A19 Tyne Tunnel', lat: 54.9916, lng: -1.4639 }
    ];
    
    for (const location of testLocations) {
      console.log(`📍 Testing: ${location.name} (${location.lat}, ${location.lng})`);
      
      const routes = enhancedFindRoutesNearCoordinates(location.lat, location.lng, 300);
      
      if (routes.length > 0) {
        console.log(`   ✅ Found ${routes.length} routes: ${routes.slice(0, 8).join(', ')}${routes.length > 8 ? '...' : ''}`);
      } else {
        console.log(`   ⚠️ No routes found within 300m`);
      }
      console.log('');
    }
    
    // Test with live TomTom data
    console.log('🚗 Testing Enhanced Route Matching with Live TomTom Data:\n');
    
    const tomTomResult = await fetchTomTomTrafficWithStreetNames();
    
    if (tomTomResult.success && tomTomResult.data.length > 0) {
      console.log(`📡 TomTom returned ${tomTomResult.data.length} traffic incidents\n`);
      
      // Analyze route matching accuracy
      let totalAlerts = 0;
      let alertsWithRoutes = 0;
      let enhancedGTFSMatches = 0;
      let textPatternMatches = 0;
      let highAccuracyMatches = 0;
      
      tomTomResult.data.forEach((alert, index) => {
        totalAlerts++;
        
        if (alert.affectsRoutes && alert.affectsRoutes.length > 0) {
          alertsWithRoutes++;
          
          if (alert.routeMatchMethod === 'Enhanced GTFS') {
            enhancedGTFSMatches++;
          } else if (alert.routeMatchMethod === 'Text Pattern Fallback') {
            textPatternMatches++;
          }
          
          if (alert.routeAccuracy === 'high') {
            highAccuracyMatches++;
          }
          
          // Show first few examples
          if (index < 3) {
            console.log(`   Alert ${index + 1}: ${alert.title}`);
            console.log(`      Location: ${alert.location}`);
            console.log(`      Routes: ${alert.affectsRoutes.join(', ')}`);
            console.log(`      Method: ${alert.routeMatchMethod}`);
            console.log(`      Accuracy: ${alert.routeAccuracy}`);
            console.log('');
          }
        }
      });
      
      // Calculate improvement metrics
      const routeMatchRate = totalAlerts > 0 ? (alertsWithRoutes / totalAlerts * 100).toFixed(1) : 0;
      const enhancedGTFSRate = alertsWithRoutes > 0 ? (enhancedGTFSMatches / alertsWithRoutes * 100).toFixed(1) : 0;
      const highAccuracyRate = alertsWithRoutes > 0 ? (highAccuracyMatches / alertsWithRoutes * 100).toFixed(1) : 0;
      
      console.log('📈 Enhanced Route Matching Performance:');
      console.log(`   Total Alerts: ${totalAlerts}`);
      console.log(`   Alerts with Routes: ${alertsWithRoutes} (${routeMatchRate}%)`);
      console.log(`   Enhanced GTFS Matches: ${enhancedGTFSMatches} (${enhancedGTFSRate}% of matched)`);
      console.log(`   Text Pattern Fallback: ${textPatternMatches}`);
      console.log(`   High Accuracy Matches: ${highAccuracyMatches} (${highAccuracyRate}% of matched)`);
      
      if (parseFloat(routeMatchRate) > 70) {
        console.log('\n✅ SUCCESS: Enhanced route matching is working well!');
      } else if (parseFloat(routeMatchRate) > 40) {
        console.log('\n⚠️ MODERATE: Route matching is working but could be improved');
      } else {
        console.log('\n❌ NEEDS WORK: Route matching accuracy is low');
      }
      
    } else {
      console.log('❌ No TomTom data available for testing');
      console.log(`   Error: ${tomTomResult.error || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testEnhancedRouteMatching();
}

export { testEnhancedRouteMatching };
