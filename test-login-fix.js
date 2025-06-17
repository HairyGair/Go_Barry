#!/usr/bin/env node
// Quick test to verify supervisor login endpoint

const API_BASE_URL = 'https://go-barry.onrender.com';

async function testLogin() {
  console.log('🧪 Testing Go BARRY login endpoint...');
  console.log('📡 API Base URL:', API_BASE_URL);

  try {
    // Test 1: Health check
    console.log('\n1️⃣ Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET'
    });
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health check passed:', healthData);
    } else {
      console.log('❌ Health check failed:', healthResponse.status);
    }

    // Test 2: Supervisor login
    console.log('\n2️⃣ Testing supervisor login...');
    const loginResponse = await fetch(`${API_BASE_URL}/api/supervisor/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        supervisorId: 'supervisor003',
        badge: 'AG003'
      })
    });

    console.log('📊 Login response status:', loginResponse.status);
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login test passed:', loginData);
    } else {
      const errorText = await loginResponse.text();
      console.log('❌ Login test failed:', loginResponse.status, errorText);
    }

    // Test 3: Check if supervisor manager endpoint exists
    console.log('\n3️⃣ Testing active supervisors endpoint...');
    const activeResponse = await fetch(`${API_BASE_URL}/api/supervisor/active`, {
      method: 'GET'
    });

    if (activeResponse.ok) {
      const activeData = await activeResponse.json();
      console.log('✅ Active supervisors check passed:', activeData);
    } else {
      console.log('❌ Active supervisors check failed:', activeResponse.status);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.error('🔍 Full error:', error);
  }
}

// Run the test
testLogin().then(() => {
  console.log('\n🏁 Test completed');
}).catch((error) => {
  console.error('💥 Test crashed:', error);
});
