// Test script to check actual bus data being sent to Convex
import busLocationService from './services/busLocationService.js';

async function testBusData() {
  console.log('🚌 Testing actual bus data transformation...');
  
  try {
    // Fetch real bus data
    console.log('📍 Fetching bus locations...');
    const buses = await busLocationService.fetchBusLocations();
    console.log(`Found ${buses.length} buses`);
    
    if (buses.length === 0) {
      console.log('❌ No buses available to test');
      return;
    }
    
    // Filter for GNE buses like the sync service does
    const gneBuses = buses.filter(bus => {
      const ref = bus.operatorRef || '';
      return ref === 'GNEL';
    }).slice(0, 3); // Just take first 3 for testing
    
    console.log(`Found ${gneBuses.length} GNE buses for testing`);
    
    if (gneBuses.length === 0) {
      console.log('❌ No GNE buses available');
      return;
    }
    
    // Transform like the sync service does
    const convexBuses = gneBuses.map(bus => ({
      id: bus.id,
      vehicleRef: bus.id,
      operatorRef: bus.operatorRef,
      routeName: bus.lineName,
      lineRef: bus.lineRef,
      coordinates: [bus.location.lat, bus.location.lon],
      bearing: bus.bearing,
      delay: bus.delay,
      status: bus.status,
      destination: bus.destinationName,
      occupancy: bus.occupancy,
      lastUpdate: Date.now()
    }));
    
    console.log('📊 Sample transformed bus data:');
    console.log(JSON.stringify(convexBuses[0], null, 2));
    
    // Check for missing required fields
    const issues = [];
    convexBuses.forEach((bus, index) => {
      if (!bus.operatorRef) issues.push(`Bus ${index}: missing operatorRef`);
      if (!bus.routeName) issues.push(`Bus ${index}: missing routeName`);
      if (!bus.lineRef) issues.push(`Bus ${index}: missing lineRef`);
      if (!bus.coordinates || bus.coordinates.length !== 2) {
        issues.push(`Bus ${index}: invalid coordinates`);
      } else {
        if (typeof bus.coordinates[0] !== 'number' || typeof bus.coordinates[1] !== 'number') {
          issues.push(`Bus ${index}: non-numeric coordinates`);
        }
      }
      if (typeof bus.bearing !== 'number') issues.push(`Bus ${index}: invalid bearing`);
      if (typeof bus.delay !== 'number') issues.push(`Bus ${index}: invalid delay`);
      if (!bus.status) issues.push(`Bus ${index}: missing status`);
      if (!bus.destination) issues.push(`Bus ${index}: missing destination`);
      if (typeof bus.lastUpdate !== 'number') issues.push(`Bus ${index}: invalid lastUpdate`);
    });
    
    if (issues.length > 0) {
      console.log('❌ Data validation issues found:');
      issues.forEach(issue => console.log(`  - ${issue}`));
    } else {
      console.log('✅ All bus data looks valid for Convex schema');
    }
    
  } catch (error) {
    console.error('❌ Bus data test failed:', error.message);
    console.error('Full error:', error);
  }
}

testBusData().then(() => {
  console.log('🏁 Bus data test complete');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});