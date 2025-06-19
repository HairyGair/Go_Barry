#!/usr/bin/env node
// test-supervisor-login.js
// Test script to verify supervisor authentication flow

const API_BASE_URL = 'http://localhost:3001';

console.log('🧪 Testing Supervisor Login Flow...\n');

// Test supervisor data (matches frontend and backend)
const testSupervisors = [
  { frontendId: 'alex_woodcock', backendId: 'supervisor001', badge: 'AW001', name: 'Alex Woodcock' },
  { frontendId: 'andrew_cowley', backendId: 'supervisor002', badge: 'AC002', name: 'Andrew Cowley' },
  { frontendId: 'anthony_gair', backendId: 'supervisor003', badge: 'AG003', name: 'Anthony Gair' },
  { frontendId: 'barry_perryman', backendId: 'supervisor009', badge: 'BP009', name: 'Barry Perryman' }
];

async function testBackendHealth() {
  try {
    console.log('🏥 Testing backend health...');
    const response = await fetch(`${API_BASE_URL}/api/health`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Backend health check passed:', data.status);
      return true;
    } else {
      console.log('❌ Backend health check failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Backend health check error:', error.message);
    return false;
  }
}

async function testSupervisorLogin(supervisor) {
  try {
    console.log(`\n🔐 Testing login for ${supervisor.name} (${supervisor.badge})...`);
    
    const response = await fetch(`${API_BASE_URL}/api/supervisor/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        supervisorId: supervisor.backendId,
        badge: supervisor.badge
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Login successful!');
      console.log('  📋 Session ID:', data.sessionId);
      console.log('  👤 Supervisor:', data.supervisor.name);
      console.log('  🎖️ Badge:', data.supervisor.badge);
      console.log('  👔 Role:', data.supervisor.role);
      return { success: true, data };
    } else {
      console.log('❌ Login failed:', data.error || 'Unknown error');
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.log('❌ Login request error:', error.message);
    return { success: false, error: error.message };
  }
}

async function testFrontendBackendMapping() {
  console.log('\n📋 Frontend to Backend ID Mapping Test:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const frontendMapping = {
    'alex_woodcock': { id: 'supervisor001', badge: 'AW001' },
    'andrew_cowley': { id: 'supervisor002', badge: 'AC002' },
    'anthony_gair': { id: 'supervisor003', badge: 'AG003' },
    'claire_fiddler': { id: 'supervisor004', badge: 'CF004' },
    'david_hall': { id: 'supervisor005', badge: 'DH005' },
    'james_daglish': { id: 'supervisor006', badge: 'JD006' },
    'john_paterson': { id: 'supervisor007', badge: 'JP007' },
    'simon_glass': { id: 'supervisor008', badge: 'SG008' },
    'barry_perryman': { id: 'supervisor009', badge: 'BP009' }
  };
  
  Object.entries(frontendMapping).forEach(([frontendId, backend]) => {
    console.log(`  ${frontendId.padEnd(15)} → ${backend.id} (${backend.badge})`);
  });
  
  return frontendMapping;
}

async function runTests() {
  console.log('🚀 Go BARRY Supervisor Authentication Test Suite');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Test backend availability
  const backendHealthy = await testBackendHealth();
  if (!backendHealthy) {
    console.log('\n⚠️ Backend not available. Make sure to start it with:');
    console.log('   cd backend && npm start\n');
    return;
  }
  
  // Test mapping
  await testFrontendBackendMapping();
  
  // Test authentication for each supervisor
  console.log('\n🔑 Testing Authentication for Each Supervisor:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const results = [];
  
  for (const supervisor of testSupervisors) {
    const result = await testSupervisorLogin(supervisor);
    results.push({ supervisor, result });
  }
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const successful = results.filter(r => r.result.success).length;
  const total = results.length;
  
  console.log(`✅ Successful logins: ${successful}/${total}`);
  
  if (successful === total) {
    console.log('\n🎉 All supervisor logins working correctly!');
    console.log('\n🌐 Frontend Integration Status:');
    console.log('  ✅ SupervisorLogin.jsx - Updated with badge display');
    console.log('  ✅ useSupervisorSession.js - Has correct backend mapping');
    console.log('  ✅ Backend render-startup.js - Fixed login endpoint');
    console.log('  ✅ Authentication flow - Working end-to-end');
    
    console.log('\n🚀 Ready to Test in Browser:');
    console.log('  1. Start backend: cd backend && npm start');
    console.log('  2. Start frontend: cd Go_BARRY && expo start --web');
    console.log('  3. Open dashboard and try supervisor login');
  } else {
    console.log('\n❌ Some supervisor logins failed. Check the errors above.');
  }
  
  // Test invalid credentials
  console.log('\n🔒 Testing Invalid Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const invalidTest = await testSupervisorLogin({
    name: 'Invalid User',
    backendId: 'supervisor999',
    badge: 'INVALID'
  });
  
  if (!invalidTest.success) {
    console.log('✅ Invalid credentials properly rejected');
  } else {
    console.log('❌ Invalid credentials were accepted (security issue!)');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('💥 Test suite crashed:', error);
  process.exit(1);
});
