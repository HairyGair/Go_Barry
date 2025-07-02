// Check currently available endpoints
const API_BASE = 'https://go-barry.onrender.com';

async function checkAvailableEndpoints() {
  console.log('🔍 Checking what endpoints are currently available\n');
  
  const endpoints = [
    { path: '/api/health', desc: 'Basic health check' },
    { path: '/api/health-extended', desc: 'Extended health info' },
    { path: '/api/alerts-enhanced', desc: 'Enhanced alerts' },
    { path: '/api/operations/stats', desc: 'Operations statistics' },
    { path: '/api/bus-locations', desc: 'Bus locations (NEW)' },
    { path: '/api/bus-locations/config', desc: 'Bus config (NEW)' },
    { path: '/api/bods', desc: 'BODS API (if exists)' },
    { path: '/api/roadworks', desc: 'Roadworks' },
    { path: '/api/supervisor/active', desc: 'Active supervisors' },
    { path: '/api/gtfs/stats', desc: 'GTFS statistics' }
  ];
  
  console.log('Testing endpoints...\n');
  
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(API_BASE + endpoint.path);
      const status = res.status;
      
      if (status === 200) {
        console.log(`✅ ${endpoint.path} - ${endpoint.desc} (${status})`);
      } else if (status === 404) {
        console.log(`❌ ${endpoint.path} - NOT FOUND (${status})`);
      } else {
        console.log(`⚠️  ${endpoint.path} - Status ${status}`);
      }
    } catch (error) {
      console.log(`💥 ${endpoint.path} - Error: ${error.message}`);
    }
  }
  
  // Special check for operations/stats to see if bus data is there
  console.log('\n📊 Checking operations/stats for bus data...');
  try {
    const res = await fetch(API_BASE + '/api/operations/stats');
    if (res.ok) {
      const data = await res.json();
      if (data.stats?.buses) {
        console.log('✅ Bus statistics found in operations/stats:');
        console.log(JSON.stringify(data.stats.buses, null, 2));
      } else {
        console.log('⚠️  No bus data in operations/stats');
      }
    }
  } catch (error) {
    console.log('❌ Could not check operations/stats');
  }
  
  console.log('\n💡 Diagnosis:');
  console.log('If bus-locations endpoints show as NOT FOUND, the backend needs to be:');
  console.log('1. Restarted to load the new routes');
  console.log('2. Or redeployed with the latest code');
  console.log('\nThe code is configured correctly, but the running backend doesn\'t have it yet.');
}

checkAvailableEndpoints();
