// Quick test script to verify TomTom API key endpoint
// Run with: node test-tomtom-api.js

const testTomTomEndpoint = async () => {
  console.log('🧪 Testing TomTom API key endpoint...\n');
  
  const endpoints = [
    'https://go-barry.onrender.com/api/config/tomtom-key',
    'http://localhost:3001/api/config/tomtom-key'
  ];
  
  for (const url of endpoints) {
    console.log(`📡 Testing: ${url}`);
    
    try {
      const response = await fetch(url);
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   Success: ${data.success}`);
        console.log(`   API Key: ${data.apiKey ? data.apiKey.substring(0, 8) + '...' : 'Missing'}`);
      } else {
        console.log(`   ❌ Failed with status ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('✅ Test complete');
};

// Run the test
testTomTomEndpoint().catch(console.error);
