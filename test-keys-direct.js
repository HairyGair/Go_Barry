#!/usr/bin/env node

// Quick test of TomTom and National Highways APIs
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

async function testTomTom() {
  console.log('\n🗺️  Testing TomTom API locally...');
  const key = '9rZJqtnfYpOzlqnypI97nFb5oX17SNzp';
  
  try {
    const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${key}&bbox=-1.8,54.85,-1.4,55.05&fields={incidents{type,geometry{type,coordinates}}}`;
    const response = await fetch(url);
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 403) {
      console.log(`${colors.red}❌ TomTom: API key is invalid or blocked${colors.reset}`);
      console.log('   This key might have expired or been revoked');
    } else if (response.status === 429) {
      console.log(`${colors.yellow}⚠️  TomTom: Rate limit exceeded${colors.reset}`);
    } else if (response.ok) {
      const data = await response.json();
      console.log(`${colors.green}✅ TomTom: API key works! (${data.incidents?.length || 0} incidents)${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
  }
}

async function testNationalHighways() {
  console.log('\n🛣️  Testing National Highways API locally...');
  const key = '742ce496dbb8472e8f39760078d3f501';
  
  try {
    const url = 'https://m.highwaysengland.co.uk/feeds/rss/UnplannedEvents.xml';
    const response = await fetch(url, {
      headers: {
        'apikey': key,
        'User-Agent': 'BARRY-TrafficWatch/3.0'
      }
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 401) {
      console.log(`${colors.red}❌ National Highways: API key is invalid${colors.reset}`);
      console.log('   This key might have expired or been revoked');
    } else if (response.ok) {
      console.log(`${colors.green}✅ National Highways: API key works!${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
  }
}

console.log(`${colors.yellow}Testing API keys directly...${colors.reset}`);
console.log('This will tell us if the keys themselves are valid\n');

Promise.all([testTomTom(), testNationalHighways()]).then(() => {
  console.log(`\n${colors.yellow}📋 Results:${colors.reset}`);
  console.log('- If keys work here but not on Render → Keys are wrong on Render');
  console.log('- If keys fail here too → Keys have expired/been revoked');
  console.log('- If rate limited → Need to wait or get new keys\n');
});
