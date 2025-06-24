// Quick supervisor login test
import fetch from 'node-fetch';

const API_BASE = 'https://go-barry.onrender.com/api';

async function testSupervisorLogin() {
  console.log('🧪 Testing Supervisor Login Methods\n');
  
  // Test 1: Original method (supervisorId + badge)
  console.log('1️⃣ Testing original login (supervisorId + badge)');
  try {
    const response = await fetch(`${API_BASE}/supervisor/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supervisorId: 'supervisor003',
        badge: 'AG003'
      })
    });
    const result = await response.json();
    console.log('   Result:', result.success ? '✅ SUCCESS' : '❌ FAILED');
    if (result.success) {
      console.log('   Session ID:', result.sessionId);
      console.log('   Supervisor:', result.supervisor.name);
    } else {
      console.log('   Error:', result.error);
    }
  } catch (error) {
    console.log('   Error:', error.message);
  }
  
  console.log('');
  
  // Test 2: Simple method (badge + password) - when deployed
  console.log('2️⃣ Testing simple login (badge + password)');
  try {
    const response = await fetch(`${API_BASE}/supervisor/auth/simple`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        badge: 'AG003',
        password: 'Barry123'
      })
    });
    const result = await response.json();
    console.log('   Result:', result.success ? '✅ SUCCESS' : '❌ FAILED');
    if (result.success) {
      console.log('   Session ID:', result.sessionId);
      console.log('   Supervisor:', result.supervisor.name);
      console.log('   Auth Method:', result.authMethod);
    } else {
      console.log('   Error:', result.error);
    }
  } catch (error) {
    console.log('   Error:', error.message);
  }
  
  console.log('');
  
  // Test 3: List supervisors
  console.log('3️⃣ Testing supervisor list');
  try {
    const response = await fetch(`${API_BASE}/supervisor/list`);
    const result = await response.json();
    console.log('   Result:', result.success ? '✅ SUCCESS' : '❌ FAILED');
    if (result.success) {
      console.log('   Available supervisors:');
      result.supervisors.forEach(s => {
        console.log(`     - ${s.name} (${s.badge}) - ${s.role}`);
      });
    } else {
      console.log('   Error:', result.error);
    }
  } catch (error) {
    console.log('   Error:', error.message);
  }
}

testSupervisorLogin();