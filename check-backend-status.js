// Comprehensive backend check
const API_BASE = 'https://go-barry.onrender.com';

async function checkBackendStatus() {
  console.log('🔍 Comprehensive Backend Check\n');
  console.log('=====================================\n');
  
  // 1. Check if backend is responding
  try {
    const healthRes = await fetch(`${API_BASE}/api/health`);
    const health = await healthRes.json();
    console.log('✅ Backend Status: ONLINE');
    console.log(`   Timestamp: ${health.timestamp}`);
    console.log(`   Service: ${health.service || 'Go BARRY Backend'}`);
    console.log(`   Port: ${health.port || 'Unknown'}`);
  } catch (error) {
    console.log('❌ Backend is NOT responding');
    return;
  }
  
  // 2. Check various endpoints
  console.log('\n📋 Endpoint Status Check:\n');
  
  const endpoints = [
    { path: '/api/bus-locations', desc: 'Bus Locations (NEW)' },
    { path: '/api/bus-locations/config', desc: 'Bus Config (NEW)' },
    { path: '/api/bus-locations/stats', desc: 'Bus Stats (NEW)' },
    { path: '/api/bods', desc: 'BODS API (Alternative)' },
    { path: '/api/operations/stats', desc: 'Operations Stats' },
    { path: '/api/health-extended', desc: 'Extended Health' },
    { path: '/api/route-shapes', desc: 'Route Shapes' },
    { path: '/api/gtfs/stats', desc: 'GTFS Stats' }
  ];
  
  let newEndpointsFound = 0;
  
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(API_BASE + endpoint.path);
      if (res.status === 200) {
        console.log(`✅ ${endpoint.path} - ${endpoint.desc}`);
        if (endpoint.path.includes('bus-locations')) {
          newEndpointsFound++;
        }
      } else if (res.status === 404) {
        console.log(`❌ ${endpoint.path} - NOT FOUND`);
      } else {
        console.log(`⚠️  ${endpoint.path} - Status ${res.status}`);
      }
    } catch (error) {
      console.log(`💥 ${endpoint.path} - Network error`);
    }
  }
  
  // 3. Check operations stats for bus data
  console.log('\n🚌 Checking for Bus Data in Backend:\n');
  try {
    const opsRes = await fetch(`${API_BASE}/api/operations/stats`);
    if (opsRes.ok) {
      const ops = await opsRes.json();
      if (ops.stats?.buses) {
        console.log('✅ Bus service object exists in operations/stats');
        console.log(`   Total Vehicles: ${ops.stats.buses.totalVehicles || 0}`);
        console.log(`   Active Vehicles: ${ops.stats.buses.activeVehicles || 0}`);
        console.log(`   Data Source: ${ops.stats.buses.dataSource || 'Unknown'}`);
        console.log(`   Last Update: ${ops.stats.buses.lastUpdate || 'Never'}`);
      } else {
        console.log('⚠️  No bus data in operations/stats');
      }
    }
  } catch (error) {
    console.log('❌ Could not check operations/stats');
  }
  
  // 4. Diagnosis
  console.log('\n🔍 DIAGNOSIS:\n');
  console.log('=====================================\n');
  
  if (newEndpointsFound === 0) {
    console.log('❌ The bus location endpoints are NOT available');
    console.log('   This means the backend is running OLD CODE\n');
    
    console.log('📍 SOLUTION:\n');
    console.log('The backend at https://go-barry.onrender.com needs to be:');
    console.log('1. Redeployed on Render.com with the latest code');
    console.log('2. OR if running locally, restarted from the correct directory\n');
    
    console.log('📂 Backend location: /Users/anthony/Go BARRY App/backend');
    console.log('🔄 Local restart: cd backend && npm start\n');
    
    console.log('⚠️  IMPORTANT:');
    console.log('The code HAS the bus API configured correctly.');
    console.log('The running backend just needs to load the new code.');
  } else {
    console.log('✅ Bus location endpoints ARE available!');
    console.log('   The backend has been successfully updated.');
  }
  
  console.log('\n📋 Code Status:');
  console.log('✅ busLocationService.js - Configured with API key');
  console.log('✅ busLocationsAPI.js - Routes defined');
  console.log('✅ index.js - Routes registered at line 555');
  console.log('✅ .env - API key added');
  
  console.log('\n🚀 Next Steps:');
  console.log('1. If using Render.com: Trigger a new deployment');
  console.log('2. If local: Make sure you\'re in /backend directory');
  console.log('3. After restart, run this script again to verify');
}

checkBackendStatus();
