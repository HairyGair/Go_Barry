#!/usr/bin/env node

import fetch from 'node-fetch';

// Get port from command line or use default
const port = process.argv[2] || 19006;

console.log(`🔍 Checking Operations Centre availability on port ${port}...\n`);

const urls = [
  { name: 'Expo Dev Server', url: `http://localhost:${port}` },
  { name: 'Operations Centre', url: `http://localhost:${port}/operations-centre` },
];

async function checkUrls() {
  let allAvailable = true;
  
  for (const { name, url } of urls) {
    try {
      const response = await fetch(url, { 
        timeout: 5000,
        headers: { 'Accept': 'text/html' }
      });
      
      if (response.ok) {
        console.log(`✅ ${name}: Available at ${url}`);
      } else {
        console.log(`❌ ${name}: Status ${response.status} at ${url}`);
        allAvailable = false;
      }
    } catch (error) {
      console.log(`❌ ${name}: Not reachable at ${url}`);
      console.log(`   Error: ${error.message}`);
      allAvailable = false;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (!allAvailable) {
    console.log('⚠️  Some services are not available!');
    console.log(`\nTrying port ${port}...`);
    console.log('\nTo check a different port:');
    console.log(`  node scripts/check-services.js [PORT]`);
    console.log('\nExample:');
    console.log('  node scripts/check-services.js 8081');
    console.log('\nTo find where Expo is running:');
    console.log('  node scripts/find-expo-port.js');
    process.exit(1);
  } else {
    console.log('✅ All services are running! Ready for testing.');
    console.log(`\nUpdate your test scripts to use port ${port} if needed.`);
  }
}

checkUrls();
