// Debug script to test route registration
import fetch from 'node-fetch';

const baseUrl = 'https://go-barry.onrender.com';

const endpoints = [
  '/api/health',
  '/api/alerts-enhanced', 
  '/api/config/tomtom-key',
  '/api/weather/current',
  '/api/roadworks',
  '/api/incident-alerts',
  '/api/supervisor',
  '/api/admin'
];

console.log('🔍 Testing API endpoints...\n');

for (const endpoint of endpoints) {
  try {
    console.log(`Testing ${endpoint}...`);
    const response = await fetch(`${baseUrl}${endpoint}`);
    const status = response.status;
    
    if (status === 200) {
      console.log(`✅ ${endpoint} - Status: ${status} (Working)`);
    } else if (status === 404) {
      console.log(`❌ ${endpoint} - Status: ${status} (Not Found)`);
    } else {
      console.log(`⚠️  ${endpoint} - Status: ${status} (Other)`);
    }
  } catch (error) {
    console.log(`💥 ${endpoint} - Error: ${error.message}`);
  }
}

console.log('\n🏁 Route testing complete');