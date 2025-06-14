#!/usr/bin/env node

// Test different National Highways endpoints to find what works
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const apiKey = '742ce496dbb0472e8f39760078d3f501';

async function testEndpoint(name, url, headers = {}) {
  console.log(`\n${colors.blue}Testing ${name}...${colors.reset}`);
  
  try {
    const response = await fetch(url, { headers });
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    const contentType = response.headers.get('content-type');
    console.log(`Content-Type: ${contentType}`);
    
    if (response.ok) {
      const text = await response.text();
      
      // Check if it's JSON
      if (contentType?.includes('json')) {
        try {
          const data = JSON.parse(text);
          console.log(`${colors.green}✅ Valid JSON response${colors.reset}`);
          console.log(`Features/Items: ${data.features?.length || data.items?.length || 0}`);
          
          // Show sample if available
          if (data.features?.[0]) {
            console.log('\nSample feature:', JSON.stringify(data.features[0].properties, null, 2).substring(0, 200) + '...');
          }
        } catch (e) {
          console.log(`${colors.red}❌ Invalid JSON${colors.reset}`);
        }
      } 
      // Check if it's XML/RSS
      else if (contentType?.includes('xml') || text.startsWith('<?xml')) {
        console.log(`${colors.yellow}⚠️  XML/RSS response${colors.reset}`);
        
        // Count items in RSS
        const itemMatches = text.match(/<item>/g);
        console.log(`RSS Items: ${itemMatches ? itemMatches.length : 0}`);
        
        // Show first item title if exists
        const titleMatch = text.match(/<title>([^<]+)<\/title>/);
        if (titleMatch) {
          console.log(`First title: ${titleMatch[1]}`);
        }
      } else {
        console.log(`Unknown content type, first 100 chars:`, text.substring(0, 100));
      }
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
  }
}

async function runTests() {
  console.log(`${colors.yellow}🛣️  National Highways API Endpoint Discovery${colors.reset}`);
  console.log('=' . repeat(50));
  
  // Test 1: Current implementation endpoint
  await testEndpoint(
    'Closures API (JSON)',
    'https://api.data.nationalhighways.co.uk/roads/v2.0/closures',
    {
      'Ocp-Apim-Subscription-Key': apiKey,
      'Accept': 'application/json'
    }
  );
  
  // Test 2: Try incidents endpoint
  await testEndpoint(
    'Incidents API (JSON)',
    'https://api.data.nationalhighways.co.uk/roads/v2.0/incidents',
    {
      'Ocp-Apim-Subscription-Key': apiKey,
      'Accept': 'application/json'
    }
  );
  
  // Test 3: RSS feed approach (no API key needed?)
  await testEndpoint(
    'RSS Feed - Unplanned Events',
    'https://m.highwaysengland.co.uk/feeds/rss/UnplannedEvents.xml',
    {
      'User-Agent': 'BARRY-TrafficWatch/3.0'
    }
  );
  
  // Test 4: RSS feed with API key
  await testEndpoint(
    'RSS Feed - Unplanned Events (with API key)',
    'https://m.highwaysengland.co.uk/feeds/rss/UnplannedEvents.xml',
    {
      'apikey': apiKey,
      'User-Agent': 'BARRY-TrafficWatch/3.0'
    }
  );
  
  // Test 5: Alternative RSS endpoints
  await testEndpoint(
    'RSS Feed - All Events',
    'https://m.highwaysengland.co.uk/feeds/rss/AllEvents.xml',
    {
      'apikey': apiKey,
      'User-Agent': 'BARRY-TrafficWatch/3.0'
    }
  );
  
  // Test 6: DATEX II endpoint
  await testEndpoint(
    'DATEX II Feed',
    'https://www.trafficengland.com/api/network/getJunctionSections',
    {}
  );
  
  console.log(`\n${colors.yellow}📋 Summary${colors.reset}`);
  console.log('Check which endpoints return data and in what format.');
  console.log('We need to update the service to use the working endpoint.');
}

runTests();
