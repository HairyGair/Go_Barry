#!/usr/bin/env node

import fetch from 'node-fetch';

console.log('🔍 Searching for Expo Dev Server...\n');

const ports = [19006, 19000, 19001, 19002, 8081, 3000, 3001];

async function findExpoServer() {
  console.log('Checking common Expo ports:');
  
  for (const port of ports) {
    const urls = [
      `http://localhost:${port}`,
      `http://localhost:${port}/operations-centre`,
      `http://127.0.0.1:${port}`,
    ];
    
    for (const url of urls) {
      try {
        const response = await fetch(url, { 
          timeout: 2000,
          headers: { 'Accept': 'text/html' }
        });
        
        if (response.ok) {
          console.log(`✅ Found server at: ${url}`);
          const text = await response.text();
          if (text.includes('expo') || text.includes('React') || text.includes('operations')) {
            console.log('   → Looks like Expo/React app!');
            return port;
          }
        }
      } catch (error) {
        // Silent fail - just checking
      }
    }
    console.log(`❌ Port ${port} - Not responding`);
  }
  
  console.log('\n🔍 Also check if Expo is showing a different URL in the terminal.');
  console.log('\nWhen you run "npm start" in Go_BARRY, what URL does it show?');
  console.log('Look for lines like:');
  console.log('  - Web is running at http://localhost:XXXX');
  console.log('  - Metro waiting on exp://XXXX');
  console.log('  - Or check the Expo DevTools in your browser\n');
  
  return null;
}

findExpoServer();
