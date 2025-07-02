// Quick test for BODS API (Bus Open Data Service)
// This might be an alternative bus API already configured

const API_BASE = 'https://go-barry.onrender.com';

async function testBODS() {
  console.log('🚌 Testing BODS (Bus Open Data Service) API\n');
  
  const bodsEndpoints = [
    '/api/bods',
    '/api/bods/config', 
    '/api/bods/stats',
    '/api/bods/vehicles',
    '/api/bods/test'
  ];
  
  for (const endpoint of bodsEndpoints) {
    try {
      const res = await fetch(API_BASE + endpoint);
      if (res.ok) {
        const data = await res.json();
        console.log(`✅ ${endpoint} - Working`);
        if (endpoint === '/api/bods') {
          console.log('   Response:', JSON.stringify(data).substring(0, 200) + '...');
        }
      } else {
        console.log(`❌ ${endpoint} - Status ${res.status}`);
      }
    } catch (error) {
      console.log(`💥 ${endpoint} - Error: ${error.message}`);
    }
  }
  
  console.log('\n📋 Summary:');
  console.log('BODS might be an alternative bus API already configured.');
  console.log('The /api/bus-locations routes we added are separate.');
}

testBODS();
