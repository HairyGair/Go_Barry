#!/usr/bin/env node
// verify-tomtom-fix.js - Verify TomTom integration is working

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying TomTom Maps Integration Fix...\n');

// Check 1: Environment file
console.log('1️⃣ Checking .env file...');
const envPath = path.join(__dirname, 'Go_BARRY', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasTomTomKey = envContent.includes('EXPO_PUBLIC_TOMTOM_API_KEY');
  console.log(`   ✅ .env file exists`);
  console.log(`   ${hasTomTomKey ? '✅' : '❌'} EXPO_PUBLIC_TOMTOM_API_KEY is ${hasTomTomKey ? 'defined' : 'missing'}`);
} else {
  console.log('   ❌ .env file not found');
}

// Check 2: TomTomTrafficMap component
console.log('\n2️⃣ Checking TomTomTrafficMap.jsx...');
const mapPath = path.join(__dirname, 'Go_BARRY', 'components', 'TomTomTrafficMap.jsx');
if (fs.existsSync(mapPath)) {
  const mapContent = fs.readFileSync(mapPath, 'utf8');
  const checks = {
    'Uses getApiUrl': mapContent.includes('getApiUrl'),
    'Has env var fallback': mapContent.includes('process.env.EXPO_PUBLIC_TOMTOM_API_KEY'),
    'Has hardcoded fallback': mapContent.includes('9rZJqtnfYpOzlqnypI97nFb5oX17SNzp'),
    'Has error handling': mapContent.includes('if (!apiKey)'),
    'Has debug logging': mapContent.includes('Environment variables check')
  };
  
  Object.entries(checks).forEach(([check, passed]) => {
    console.log(`   ${passed ? '✅' : '❌'} ${check}`);
  });
} else {
  console.log('   ❌ TomTomTrafficMap.jsx not found');
}

// Check 3: Backend configuration
console.log('\n3️⃣ Checking backend .env...');
const backendEnvPath = path.join(__dirname, 'backend', '.env');
if (fs.existsSync(backendEnvPath)) {
  const backendEnv = fs.readFileSync(backendEnvPath, 'utf8');
  const hasBackendKey = backendEnv.includes('TOMTOM_API_KEY=');
  console.log(`   ✅ Backend .env exists`);
  console.log(`   ${hasBackendKey ? '✅' : '❌'} TOMTOM_API_KEY is ${hasBackendKey ? 'defined' : 'missing'}`);
} else {
  console.log('   ❌ Backend .env not found');
}

// Check 4: API endpoint
console.log('\n4️⃣ Checking API endpoint in backend...');
const indexPath = path.join(__dirname, 'backend', 'index.js');
if (fs.existsSync(indexPath)) {
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  const hasEndpoint = indexContent.includes('/api/config/tomtom-key');
  console.log(`   ${hasEndpoint ? '✅' : '❌'} /api/config/tomtom-key endpoint ${hasEndpoint ? 'exists' : 'missing'}`);
} else {
  console.log('   ❌ backend/index.js not found');
}

console.log('\n📋 Summary:');
console.log('If all checks pass, the TomTom integration should work after:');
console.log('1. Stopping Expo (Ctrl+C)');
console.log('2. Running: npx expo start -c');
console.log('3. Refreshing your browser with cache disabled');

console.log('\nIf issues persist, check the browser console for debug messages.');
