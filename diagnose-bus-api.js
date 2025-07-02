// Test if backend needs restart or if bus API is actually there
const API_BASE = 'https://go-barry.onrender.com';

async function diagnose() {
  console.log('🔍 Diagnosing Bus API Status...\n');
  
  // First, check if the backend is responding
  try {
    const healthRes = await fetch(`${API_BASE}/api/health`);
    const health = await healthRes.json();
    console.log('✅ Backend is running:', health.status || 'operational');
    console.log('   Timestamp:', health.timestamp);
  } catch (error) {
    console.log('❌ Backend is not responding');
    return;
  }
  
  // Check various endpoints
  console.log('\n📋 Checking endpoints:');
  
  const endpoints = [
    '/api/bus-locations',
    '/api/bus-locations/config',
    '/api/bus-locations/stats',
    '/api/bods',  // Alternative bus API
    '/api/operations/stats'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(API_BASE + endpoint);
      if (res.status === 404) {
        const data = await res.json();
        console.log(`❌ ${endpoint} - NOT FOUND (${data.error || 'Endpoint not found'})`);
      } else if (res.ok) {
        console.log(`✅ ${endpoint} - EXISTS (status ${res.status})`);
      } else {
        console.log(`⚠️  ${endpoint} - Error ${res.status}`);
      }
    } catch (error) {
      console.log(`💥 ${endpoint} - Network error`);
    }
  }
  
  // Check if bus data exists in operations stats
  console.log('\n🚌 Checking for bus data in operations/stats...');
  try {
    const opsRes = await fetch(`${API_BASE}/api/operations/stats`);
    if (opsRes.ok) {
      const ops = await opsRes.json();
      if (ops.stats?.buses) {
        console.log('✅ Bus service data found:');
        console.log('   Total vehicles:', ops.stats.buses.totalVehicles || 0);
        console.log('   Data source:', ops.stats.buses.dataSource || 'Unknown');
        console.log('   Last update:', ops.stats.buses.lastUpdate || 'Never');
      } else {
        console.log('⚠️  No bus data in operations stats');
      }
    }
  } catch (error) {
    console.log('❌ Could not check operations stats');
  }
  
  console.log('\n💡 Diagnosis:');
  console.log('The /api/bus-locations endpoints are NOT registered.');
  console.log('This means the backend is running OLD code.');
  console.log('\n✅ Solution:');
  console.log('1. The backend needs to be restarted to load the new routes');
  console.log('2. If using nodemon (dev mode), it should auto-reload');
  console.log('3. If in production mode, manually restart is needed');
  console.log('\n📍 Backend location: /Users/anthony/Go BARRY App/backend');
  console.log('🔄 Restart command: cd backend && npm start');
}

diagnose();
