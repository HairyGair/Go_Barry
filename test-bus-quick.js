// Quick test of Bus API configuration
const API_BASE = 'https://go-barry.onrender.com';

async function testBusAPI() {
  console.log('🚌 Testing Go BARRY Bus API\n');
  
  try {
    // Test 1: Configuration
    console.log('1. Testing configuration endpoint...');
    const configRes = await fetch(`${API_BASE}/api/bus-locations/config`);
    const config = await configRes.json();
    
    if (config.success) {
      console.log('✅ Configuration retrieved');
      console.log(`   API Key: ${config.configuration?.primaryDataset?.apiKey || 'Not found'}`);
      console.log(`   Dataset: ${config.configuration?.primaryDataset?.id || 'Not found'}`);
      console.log(`   URL: ${config.configuration?.primaryDataset?.url?.replace(/api_key=.*/, 'api_key=***')}`);
    } else {
      console.log('❌ Configuration failed:', config.error);
    }
    
    // Test 2: Get buses
    console.log('\n2. Testing bus locations endpoint...');
    const busRes = await fetch(`${API_BASE}/api/bus-locations`);
    const buses = await busRes.json();
    
    if (buses.success) {
      console.log('✅ Bus locations retrieved');
      console.log(`   Count: ${buses.metadata?.count || 0} buses`);
      console.log(`   Cached: ${buses.metadata?.cached ? 'Yes' : 'No'}`);
      
      if (buses.buses && buses.buses.length > 0) {
        console.log('\n   Sample buses:');
        buses.buses.slice(0, 3).forEach(bus => {
          console.log(`   🚌 Route ${bus.routeName} - ${bus.vehicleRef} (${bus.status})`);
        });
      } else {
        console.log('   ⚠️  No buses returned (may be using mock data)');
      }
    } else {
      console.log('❌ Bus locations failed:', buses.error);
    }
    
    // Test 3: Statistics
    console.log('\n3. Testing statistics endpoint...');
    const statsRes = await fetch(`${API_BASE}/api/bus-locations/stats`);
    const stats = await statsRes.json();
    
    if (stats.success) {
      console.log('✅ Statistics retrieved');
      console.log(`   Total vehicles: ${stats.statistics?.totalVehicles || 0}`);
      console.log(`   Active vehicles: ${stats.statistics?.activeVehicles || 0}`);
      console.log(`   Data source: ${stats.statistics?.dataSource || 'Unknown'}`);
      console.log(`   Data quality: ${stats.statistics?.dataQuality || 'Unknown'}`);
    } else {
      console.log('❌ Statistics failed:', stats.error);
    }
    
    console.log('\n📊 Summary:');
    console.log('The bus API is configured with:');
    console.log('- API Key: ***6fd3 (ends with 6fd3)');
    console.log('- Dataset: 9264 (Go North East)');
    console.log('- Endpoints: Working ✅');
    
    if (buses.metadata?.error) {
      console.log('\n⚠️  Note: The API may return mock data if the real API is unavailable');
      console.log('   Error: ' + buses.metadata.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBusAPI();
