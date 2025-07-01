#!/usr/bin/env node

import fetch from 'node-fetch';

console.log('🔍 Checking Operations Centre availability...\n');

const urls = [
  { name: 'Expo Dev Server', url: 'http://localhost:8081' },
  { name: 'Operations Centre', url: 'http://localhost:8081/operations-centre' },
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
    console.log('\nTo start the development server:');
    console.log('1. cd Go_BARRY');
    console.log('2. npm start');
    console.log('3. Press "w" to open in web browser');
    console.log('\nThen run the tests again.');
    process.exit(1);
  } else {
    console.log('✅ All services are running! Ready for testing.');
  }
}

checkUrls();
