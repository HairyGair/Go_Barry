#!/usr/bin/env node
// Test script to verify GTFS implementation and route matching accuracy

const API_BASE = process.env.API_BASE || 'https://go-barry.onrender.com';

async function testGTFSImplementation() {
  console.log('🧪 Testing GTFS Implementation and Route Matching...\n');

  try {
    // Step 1: Check GTFS health
    console.log('1️⃣ Checking GTFS service health...');
    const healthResponse = await fetch(`${API_BASE}/api/gtfs/health`);
    const healthResult = await healthResponse.json();
    
    console.log('   🏥 GTFS Health:', {
      ready: healthResult.ready,
      routes: healthResult.data?.routes,
      stops: healthResult.data?.stops,
      shapes: healthResult.data?.shapes
    });

    if (!healthResult.ready) {
      console.error('❌ GTFS service not ready. Cannot continue tests.');
      return;
    }

    // Step 2: Get GTFS statistics
    console.log('\n2️⃣ Getting GTFS statistics...');
    const statsResponse = await fetch(`${API_BASE}/api/gtfs/stats`);
    const statsResult = await statsResponse.json();
    
    console.log('   📊 GTFS Stats:', {
      routes: statsResult.data?.routes,
      stops: statsResult.data?.stops,
      spatialIndexCells: statsResult.data?.spatialIndexCells,
      corridors: statsResult.data?.corridors
    });

    // Step 3: Test coordinate-based route matching
    console.log('\n3️⃣ Testing coordinate-based route matching...');
    
    const testCoordinates = [
      { name: 'Newcastle Central Station', lat: 54.9689, lng: -1.6174 },
      { name: 'Gateshead Interchange', lat: 54.9526, lng: -1.6031 },
      { name: 'Durham Bus Station', lat: 54.7762, lng: -1.5747 },
      { name: 'Metro Centre', lat: 54.9561, lng: -1.6751 }
    ];

    for (const coord of testCoordinates) {
      const coordResponse = await fetch(`${API_BASE}/api/gtfs/match/coordinate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          lat: coord.lat, 
          lng: coord.lng, 
          radius: 300 
        })
      });
      
      const coordResult = await coordResponse.json();
      console.log(`   📍 ${coord.name}:`, {
        routes: coordResult.data?.routes || [],
        count: coordResult.data?.count || 0
      });
    }

    // Step 4: Test location-based route matching
    console.log('\n4️⃣ Testing location-based route matching...');
    
    const testLocations = [
      'Newcastle',
      'Gateshead', 
      'Durham',
      'Sunderland',
      'A1',
      'A19'
    ];

    for (const location of testLocations) {
      const locationResponse = await fetch(`${API_BASE}/api/gtfs/match/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location })
      });
      
      const locationResult = await locationResponse.json();
      console.log(`   🗺️ ${location}:`, {
        routes: locationResult.data?.routes || [],
        count: locationResult.data?.count || 0
      });
    }

    // Step 5: Test enhanced route matching (coordinates + location)
    console.log('\n5️⃣ Testing enhanced route matching...');
    
    const enhancedResponse = await fetch(`${API_BASE}/api/gtfs/match/enhanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        lat: 54.9689, 
        lng: -1.6174, 
        location: 'Newcastle Central Station',
        radius: 300
      })
    });
    
    const enhancedResult = await enhancedResponse.json();
    console.log('   🚀 Enhanced matching (Newcastle Central):', {
      routes: enhancedResult.data?.routes || [],
      count: enhancedResult.data?.count || 0,
      method: enhancedResult.method
    });

    // Step 6: Run accuracy tests
    console.log('\n6️⃣ Running accuracy tests...');
    
    const accuracyResponse = await fetch(`${API_BASE}/api/gtfs/test/accuracy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const accuracyResult = await accuracyResponse.json();
    
    if (accuracyResult.success) {
      console.log('   📈 Accuracy Test Summary:', {
        totalTests: accuracyResult.data?.summary?.totalTests,
        passedTests: accuracyResult.data?.summary?.passedTests,
        overallAccuracy: `${accuracyResult.data?.summary?.overallAccuracy}%`,
        passRate: `${accuracyResult.data?.summary?.passRate}%`
      });
      
      console.log('\n   📋 Individual Test Results:');
      accuracyResult.data?.results?.forEach(result => {
        console.log(`     ${result.passed ? '✅' : '❌'} ${result.name}: ${result.accuracy}% accuracy`);
        console.log(`        Expected: [${result.expectedRoutes.join(', ')}]`);
        console.log(`        Found: [${result.foundRoutes.join(', ')}]`);
        console.log(`        Matches: [${result.matches.join(', ')}]`);
      });
    }

    // Step 7: Test specific route details
    console.log('\n7️⃣ Testing route details lookup...');
    
    const routesToTest = ['21', 'Q3', '10', '1'];
    
    for (const routeName of routesToTest) {
      const routeResponse = await fetch(`${API_BASE}/api/gtfs/route/${routeName}`);
      const routeResult = await routeResponse.json();
      
      if (routeResult.success) {
        console.log(`   🚌 Route ${routeName}:`, {
          longName: routeResult.data?.longName || 'N/A',
          stopCount: routeResult.data?.stopCount || 0,
          color: routeResult.data?.color || 'N/A'
        });
      } else {
        console.log(`   ❌ Route ${routeName}: Not found`);
      }
    }

    // Step 8: Test with real alert scenarios
    console.log('\n8️⃣ Testing with real-world alert scenarios...');
    
    const alertScenarios = [
      {
        name: 'A1 Accident near Angel of the North',
        lat: 54.9144, lng: -1.5886,
        location: 'A1 near Angel of the North'
      },
      {
        name: 'Tyne Bridge closure',
        lat: 54.9686, lng: -1.6033,
        location: 'Tyne Bridge'
      },
      {
        name: 'Durham Road incident',
        lat: 54.9366, lng: -1.5947,
        location: 'Durham Road, Gateshead'
      }
    ];

    for (const scenario of alertScenarios) {
      const scenarioResponse = await fetch(`${API_BASE}/api/gtfs/match/enhanced`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          lat: scenario.lat, 
          lng: scenario.lng, 
          location: scenario.location,
          radius: 400
        })
      });
      
      const scenarioResult = await scenarioResponse.json();
      console.log(`   🚨 ${scenario.name}:`, {
        routes: scenarioResult.data?.routes || [],
        count: scenarioResult.data?.count || 0
      });
    }

    // Summary
    console.log('\n📊 GTFS Implementation Test Summary:');
    console.log(`   ✅ Service Health: ${healthResult.ready ? 'READY' : 'NOT READY'}`);
    console.log(`   ✅ Data Loaded: ${statsResult.data?.routes || 0} routes, ${statsResult.data?.stops || 0} stops`);
    console.log(`   ✅ Coordinate Matching: ${testCoordinates.length} locations tested`);
    console.log(`   ✅ Location Matching: ${testLocations.length} locations tested`);
    console.log(`   ✅ Enhanced Matching: Combined coordinate + location tested`);
    console.log(`   ✅ Accuracy Tests: ${accuracyResult.data?.summary?.passRate || 0}% pass rate`);
    console.log(`   ✅ Route Details: ${routesToTest.length} routes tested`);
    console.log(`   ✅ Alert Scenarios: ${alertScenarios.length} real-world scenarios tested`);
    
    const overallSuccess = healthResult.ready && 
                          (statsResult.data?.routes || 0) > 0 && 
                          (accuracyResult.data?.summary?.passRate || 0) >= 50;
    
    console.log(`\n🎆 Overall GTFS Implementation: ${overallSuccess ? '✅ SUCCESS' : '❌ NEEDS ATTENTION'}`);

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.log('\n🔧 Make sure the backend is running and accessible at:', API_BASE);
  }
}

// Run the test
testGTFSImplementation();