#!/usr/bin/env node

// Test script for fleet database integration

const API_BASE = 'http://localhost:3001/api';

console.log('🧪 Testing Fleet Database Integration...\n');

async function testEndpoint(name, url, options = {}) {
  try {
    console.log(`Testing ${name}...`);
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${name}: Success`);
      console.log(`   Response: ${JSON.stringify(data).substring(0, 100)}...\n`);
    } else {
      console.log(`❌ ${name}: Failed`);
      console.log(`   Error: ${data.error}\n`);
    }
  } catch (error) {
    console.log(`❌ ${name}: Error - ${error.message}\n`);
  }
}

async function runTests() {
  // Test vehicle search
  await testEndpoint(
    'Vehicle Search',
    `${API_BASE}/breakdown-tracker/vehicles/search?q=540`
  );

  // Test vehicle details
  await testEndpoint(
    'Vehicle Details',
    `${API_BASE}/breakdown-tracker/vehicles/5401`
  );

  // Test fleet health
  await testEndpoint(
    'Fleet Health',
    `${API_BASE}/breakdown-analytics/fleet-health`
  );

  // Test fleet composition
  await testEndpoint(
    'Fleet Composition',
    `${API_BASE}/breakdown-analytics/fleet-composition`
  );

  console.log('✅ All tests completed!');
}

// Check if server is running
fetch(`${API_BASE}/health`)
  .then(() => runTests())
  .catch(() => {
    console.error('❌ Server is not running on port 3001');
    console.log('Please start the server first: cd backend && npm run dev');
  });
