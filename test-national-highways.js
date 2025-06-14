#!/usr/bin/env node

// Test National Highways API directly
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

async function testNationalHighwaysAPI() {
  console.log(`${colors.blue}🛣️  Testing National Highways API...${colors.reset}\n`);
  
  // Use the correct API key
  const apiKey = '742ce496dbb0472e8f39760078d3f501';
  
  try {
    console.log('Testing closures endpoint...');
    const response = await fetch('https://api.data.nationalhighways.co.uk/roads/v2.0/closures', {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Accept': 'application/json',
        'User-Agent': 'BARRY-TrafficWatch/3.0'
      }
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`${colors.green}✅ API Key is valid and working!${colors.reset}`);
      console.log(`\nResponse structure:`);
      console.log(`- Type: ${data.type || 'unknown'}`);
      console.log(`- Features: ${data.features ? data.features.length : 0}`);
      
      if (data.features && data.features.length > 0) {
        console.log(`\n${colors.yellow}Sample features:${colors.reset}`);
        data.features.slice(0, 3).forEach((feature, i) => {
          console.log(`\n${i + 1}. ${feature.properties?.title || 'No title'}`);
          console.log(`   Location: ${feature.properties?.location || 'Unknown'}`);
          console.log(`   Start: ${feature.properties?.startDate || 'Unknown'}`);
          console.log(`   End: ${feature.properties?.endDate || 'Unknown'}`);
        });
      } else {
        console.log(`\n${colors.yellow}ℹ️  No current road closures from National Highways${colors.reset}`);
        console.log('This is normal - it means no major incidents right now');
      }
      
      // Also test if there are other endpoints we could use
      console.log(`\n${colors.blue}Testing incidents endpoint...${colors.reset}`);
      const incResponse = await fetch('https://api.data.nationalhighways.co.uk/roads/v2.0/incidents', {
        headers: {
          'Ocp-Apim-Subscription-Key': apiKey,
          'Accept': 'application/json'
        }
      });
      
      if (incResponse.ok) {
        const incData = await incResponse.json();
        console.log(`Incidents endpoint: ${incData.features ? incData.features.length : 0} features`);
      } else {
        console.log(`Incidents endpoint: ${incResponse.status} ${incResponse.statusText}`);
      }
      
    } else {
      console.log(`${colors.red}❌ API request failed${colors.reset}`);
      const text = await response.text();
      console.log('Response:', text.substring(0, 200));
    }
    
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
  }
}

testNationalHighwaysAPI();
