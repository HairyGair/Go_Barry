import fetch from 'node-fetch';

// Test different BODS API endpoint patterns
async function testBODSEndpoints() {
  const apiKey = '1b7862548843de84e3ee3602c9b9b2488b736fd3';
  const feedId = '9264';
  
  const endpoints = [
    // Pattern 1: As shown on BODS website
    `https://data.bus-data.dft.gov.uk/api/v1/datafeed/${feedId}/?api_key=${apiKey}`,
    
    // Pattern 2: Without trailing slash
    `https://data.bus-data.dft.gov.uk/api/v1/datafeed/${feedId}?api_key=${apiKey}`,
    
    // Pattern 3: With SIRI-VM suffix
    `https://data.bus-data.dft.gov.uk/api/v1/datafeed/${feedId}/siri-vm?api_key=${apiKey}`,
    
    // Pattern 4: Direct SIRI endpoint
    `https://data.bus-data.dft.gov.uk/api/v1/siri/${feedId}?api_key=${apiKey}`,
    
    // Pattern 5: GTFS-RT format (might work)
    `https://data.bus-data.dft.gov.uk/api/v1/gtfsrtdatafeed/${feedId}/?api_key=${apiKey}`
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n🧪 Testing: ${endpoint.replace(apiKey, '***')}`);
    
    try {
      const response = await fetch(endpoint);
      console.log(`  Status: ${response.status} ${response.statusText}`);
      console.log(`  Content-Type: ${response.headers.get('content-type')}`);
      
      if (response.ok) {
        const content = await response.text();
        console.log(`  ✅ Success! Content length: ${content.length} chars`);
        console.log(`  First 200 chars: ${content.substring(0, 200)}`);
        
        // Save successful response
        if (content.length > 0) {
          console.log(`\n✅ WORKING ENDPOINT FOUND: ${endpoint.replace(apiKey, '***')}`);
          return { endpoint, content };
        }
      } else {
        const error = await response.text();
        console.log(`  ❌ Error: ${error.substring(0, 100)}`);
      }
    } catch (error) {
      console.log(`  ❌ Failed: ${error.message}`);
    }
  }
  
  console.log('\n❌ No working endpoints found');
  return null;
}

// Run test
testBODSEndpoints().then(result => {
  if (result) {
    console.log('\n📊 Analyzing successful response...');
    const { content } = result;
    
    // Check if it's XML
    if (content.includes('<?xml') || content.includes('<Siri')) {
      console.log('✅ Response is XML (likely SIRI-VM)');
    }
    
    // Check if it's JSON
    try {
      const json = JSON.parse(content);
      console.log('✅ Response is JSON');
      console.log('Keys:', Object.keys(json));
    } catch (e) {
      // Not JSON
    }
  }
});