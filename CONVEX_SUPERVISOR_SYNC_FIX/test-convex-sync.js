// test-convex-sync.js
// Test script to verify Convex supervisor sync is working

import fetch from 'node-fetch';

const CONVEX_URL = 'https://standing-octopus-908.convex.cloud';
const BACKEND_URL = 'https://go-barry.onrender.com';

async function testConvexSync() {
  console.log('🧪 Testing Convex Supervisor Sync...\n');

  // Test 1: Check if Convex is accessible
  console.log('1️⃣ Testing Convex connection...');
  try {
    const response = await fetch(`${CONVEX_URL}/version`);
    console.log(`✅ Convex is accessible: ${response.status}`);
  } catch (error) {
    console.error('❌ Convex connection failed:', error.message);
  }

  // Test 2: Check backend CORS headers
  console.log('\n2️⃣ Testing backend CORS headers...');
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`, {
      headers: {
        'Origin': 'https://www.gobarry.co.uk',
        'Cache-Control': 'no-cache'
      }
    });
    const headers = response.headers;
    console.log('✅ CORS headers:', {
      'Access-Control-Allow-Origin': headers.get('access-control-allow-origin'),
      'Access-Control-Allow-Headers': headers.get('access-control-allow-headers')?.includes('cache-control') ? 'includes cache-control ✅' : 'missing cache-control ❌'
    });
  } catch (error) {
    console.error('❌ Backend test failed:', error.message);
  }

  // Test 3: Test supervisor login and action logging
  console.log('\n3️⃣ Testing supervisor action logging...');
  try {
    // First login
    const loginResponse = await fetch(`${BACKEND_URL}/api/supervisor/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        badge: 'TEST001',
        name: 'Test Supervisor'
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Test login successful:', loginData.supervisor?.name);
      
      // Test dismiss alert action
      const dismissResponse = await fetch(`${BACKEND_URL}/api/supervisor/dismiss-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId: 'test_alert_123',
          reason: 'Test dismissal',
          sessionId: loginData.sessionId,
          alertData: {
            location: 'Test Location',
            title: 'Test Alert'
          }
        })
      });
      
      if (dismissResponse.ok) {
        console.log('✅ Test action logged successfully');
      } else {
        console.log('⚠️ Dismiss action failed:', dismissResponse.status);
      }
      
      // Logout
      await fetch(`${BACKEND_URL}/api/supervisor/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: loginData.sessionId })
      });
      
    } else {
      console.log('⚠️ Test login failed:', loginResponse.status);
    }
  } catch (error) {
    console.error('❌ Action logging test failed:', error.message);
  }

  console.log('\n✅ Test complete! Check:');
  console.log('  1. Convex Dashboard for supervisor sessions');
  console.log('  2. Display Screen for active supervisors');
  console.log('  3. Activity feed for recent actions');
}

// Run the test
testConvexSync().catch(console.error);
