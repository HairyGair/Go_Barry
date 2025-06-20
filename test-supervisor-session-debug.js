// test-supervisor-session-debug.js
// Debug script to test supervisor login and active supervisor retrieval

import fetch from 'node-fetch';

const API_URL = 'https://go-barry.onrender.com';

async function debugSupervisorFlow() {
  console.log('🔍 Starting supervisor session debug...\n');
  
  try {
    // Step 1: Login as a supervisor
    console.log('1️⃣ Logging in as supervisor...');
    const loginResponse = await fetch(`${API_URL}/api/supervisor/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supervisorId: 'supervisor003',
        badge: 'AG003'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (!loginData.success) {
      throw new Error('Login failed: ' + loginData.error);
    }
    
    const sessionId = loginData.sessionId;
    console.log('✅ Login successful! Session ID:', sessionId);
    console.log('Supervisor:', loginData.supervisor?.name);
    
    // Step 2: Check active supervisors immediately
    console.log('\n2️⃣ Checking active supervisors immediately after login...');
    const activeResponse = await fetch(`${API_URL}/api/supervisor/active`);
    const activeData = await activeResponse.json();
    
    console.log('Active supervisors response:', activeData);
    console.log('Count:', activeData.count);
    console.log('Active list:', activeData.activeSupervisors);
    
    // Step 3: Check debug sessions endpoint
    console.log('\n3️⃣ Checking debug sessions endpoint...');
    const debugResponse = await fetch(`${API_URL}/api/supervisor/debug/sessions`);
    const debugData = await debugResponse.json();
    
    console.log('Debug sessions response:');
    console.log('Total sessions:', debugData.totalSessions);
    console.log('Active sessions:', debugData.activeSessions);
    console.log('Sessions:', debugData.sessions);
    
    // Step 4: Validate the session
    console.log('\n4️⃣ Validating the session...');
    const validateResponse = await fetch(`${API_URL}/api/supervisor/auth/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });
    
    const validateData = await validateResponse.json();
    console.log('Session validation:', validateData);
    
    // Step 5: Try supervisor sync status endpoint
    console.log('\n5️⃣ Checking supervisor sync status...');
    const syncResponse = await fetch(`${API_URL}/api/supervisor/sync-status`);
    const syncData = await syncResponse.json();
    
    console.log('Sync status response:');
    console.log('Connected supervisors:', syncData.connectedSupervisors);
    console.log('Active supervisors:', syncData.activeSupervisors);
    
    // Step 6: Create a test session using debug endpoint
    console.log('\n6️⃣ Creating test session using debug endpoint...');
    const testSessionResponse = await fetch(`${API_URL}/api/supervisor/debug/test-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const testSessionData = await testSessionResponse.json();
    console.log('Test session response:', testSessionData);
    
    // Step 7: Check active supervisors again
    console.log('\n7️⃣ Checking active supervisors after test session...');
    const activeResponse2 = await fetch(`${API_URL}/api/supervisor/active`);
    const activeData2 = await activeResponse2.json();
    
    console.log('Active supervisors after test session:', activeData2);
    
    // Step 8: Logout
    console.log('\n8️⃣ Logging out...');
    const logoutResponse = await fetch(`${API_URL}/api/supervisor/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });
    
    const logoutData = await logoutResponse.json();
    console.log('Logout response:', logoutData);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response text:', await error.response.text());
    }
  }
}

// Run the debug script
console.log('🚀 Go BARRY Supervisor Session Debug');
console.log('==================================\n');

debugSupervisorFlow().then(() => {
  console.log('\n✅ Debug script completed');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Debug script failed:', error);
  process.exit(1);
});