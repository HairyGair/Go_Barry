import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

async function testMissingEndpoints() {
  console.log('🔍 Testing previously missing API endpoints...\n');
  
  const endpoints = [
    '/api/config/tomtom-key',
    '/api/weather/current', 
    '/api/roadworks',
    '/api/incident-alerts'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`📡 Testing ${endpoint}...`);
      const response = await axios.get(`${BASE_URL}${endpoint}`, {
        timeout: 5000
      });
      
      console.log(`✅ ${endpoint} - Status: ${response.status}`);
      console.log(`📊 Response keys: ${Object.keys(response.data).join(', ')}`);
      
      if (response.data.success !== undefined) {
        console.log(`🎯 Success: ${response.data.success}`);
      }
      
      if (response.data.count !== undefined) {
        console.log(`📈 Count: ${response.data.count}`);
      }
      
      console.log(''); // Empty line for readability
      
    } catch (error) {
      console.error(`❌ ${endpoint} - Error: ${error.message}`);
      if (error.response) {
        console.error(`📊 Status: ${error.response.status}`);
        console.error(`📊 Response: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      console.log(''); // Empty line for readability
    }
  }
}

testMissingEndpoints();