#!/usr/bin/env node

// Test script for the incident API endpoints
// This tests all the endpoints that the IncidentManager component needs

const BASE_URL = 'http://localhost:3001';
const endpoints = [
  { path: '/api/incidents', method: 'GET', description: 'Get all incidents' },
  { path: '/api/geocode/Newcastle', method: 'GET', description: 'Test geocoding' },
  { path: '/api/routes/search-stops?query=Newcastle', method: 'GET', description: 'Search stops' },
  { path: '/api/routes/find-near-coordinate?lat=54.9783&lng=-1.6178', method: 'GET', description: 'Find routes near coordinate' },
];

async function testEndpoint(endpoint) {
  try {
    console.log(`🧪 Testing: ${endpoint.description}`);
    console.log(`   ${endpoint.method} ${BASE_URL}${endpoint.path}`);
    
    const response = await fetch(`${BASE_URL}${endpoint.path}`, {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`   ✅ Success: ${response.status}`);
    console.log(`   📊 Response:`, JSON.stringify(data, null, 2).slice(0, 200) + '...\n');
    
    return { success: true, data };
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}\n`);
    return { success: false, error: error.message };
  }
}

async function testCreateIncident() {
  try {
    console.log(`🧪 Testing: Create new incident`);
    console.log(`   POST ${BASE_URL}/api/incidents`);
    
    const testIncident = {
      type: 'incident',
      subtype: 'Road Traffic Accident',
      location: 'A1 Junction 65, Birtley',
      description: 'Test incident created by API test',
      severity: 'Medium',
      createdBy: 'API Test',
      createdByRole: 'Test Script'
    };
    
    const response = await fetch(`${BASE_URL}/api/incidents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testIncident)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`   ✅ Success: ${response.status}`);
    console.log(`   📊 Created incident:`, JSON.stringify(data, null, 2).slice(0, 300) + '...\n');
    
    return { success: true, data };
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}\n`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚦 Testing Go BARRY Incident API Endpoints\n');
  console.log('📋 This tests all endpoints needed by the IncidentManager component\n');
  
  // Check if backend is running
  try {
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    if (!healthResponse.ok) {
      throw new Error('Backend not responding');
    }
    console.log('✅ Backend is running\n');
  } catch (error) {
    console.log('❌ Backend is not running! Please start the backend first:');
    console.log('   cd backend && npm start\n');
    return;
  }
  
  let passedTests = 0;
  const totalTests = endpoints.length + 1; // +1 for create incident test
  
  // Test all GET endpoints
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    if (result.success) passedTests++;
  }
  
  // Test creating an incident
  const createResult = await testCreateIncident();
  if (createResult.success) passedTests++;
  
  // Summary
  console.log('📊 TEST SUMMARY');
  console.log(`   Passed: ${passedTests}/${totalTests}`);
  console.log(`   Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! The IncidentManager should now work.');
    console.log('👉 Try accessing the Incident Manager in the browser interface.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the backend console for errors.');
  }
}

runTests().catch(console.error);
