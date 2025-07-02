import busLocationService from '../services/busLocationService.js';
import dotenv from 'dotenv';

dotenv.config();

async function testBusService() {
  console.log('🧪 Testing Bus Location Service...\n');
  
  try {
    // First fetch
    console.log('📡 Fetching buses (first call)...');
    const buses1 = await busLocationService.fetchBusLocations();
    console.log(`✅ Got ${buses1.length} buses`);
    
    if (buses1.length > 0) {
      console.log('\n🚌 First 3 buses:');
      buses1.slice(0, 3).forEach((bus, index) => {
        console.log(`\nBus ${index + 1}:`);
        console.log('- ID:', bus.id);
        console.log('- Line:', bus.lineName, `(${bus.lineRef})`);
        console.log('- Destination:', bus.destinationName);
        console.log('- Status:', bus.status);
        console.log('- Delay:', bus.delay, 'minutes');
        console.log('- Location:', `${bus.location.lat}, ${bus.location.lon}`);
        console.log('- Bearing:', bus.bearing, '°');
        console.log('- Operator:', bus.operatorRef);
      });
      
      // Show status breakdown
      const statusCounts = buses1.reduce((acc, bus) => {
        acc[bus.status] = (acc[bus.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📊 Status Breakdown:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`- ${status}: ${count} buses`);
      });
    }
    
    // Test caching
    console.log('\n📡 Fetching buses again (should use cache)...');
    const start = Date.now();
    const buses2 = await busLocationService.fetchBusLocations();
    const duration = Date.now() - start;
    console.log(`✅ Got ${buses2.length} buses in ${duration}ms (cached: ${duration < 100})`);
    
    // Wait for cache to expire
    console.log('\n⏳ Waiting 11 seconds for cache to expire...');
    await new Promise(resolve => setTimeout(resolve, 11000));
    
    // Fetch again after cache expiry
    console.log('\n📡 Fetching buses (cache expired)...');
    const start2 = Date.now();
    const buses3 = await busLocationService.fetchBusLocations();
    const duration2 = Date.now() - start2;
    console.log(`✅ Got ${buses3.length} buses in ${duration2}ms (fresh fetch)`);
    
    // Check health
    console.log('\n💓 Service Health:');
    console.log(JSON.stringify(busLocationService.getHealth(), null, 2));
    
    // Show some route statistics
    const routeCounts = buses3.reduce((acc, bus) => {
      acc[bus.lineRef] = (acc[bus.lineRef] || 0) + 1;
      return acc;
    }, {});
    
    const topRoutes = Object.entries(routeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    
    console.log('\n🏆 Top 10 Routes by Bus Count:');
    topRoutes.forEach(([route, count]) => {
      console.log(`- Route ${route}: ${count} buses`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
  }
}

// Run test
console.log('Starting Bus Location Service test...\n');
testBusService();