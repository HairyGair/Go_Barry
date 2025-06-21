// test-supervisor-display-sync.js
// Test script to diagnose and fix supervisor display sync issues

import fetch from 'node-fetch';

const API_BASE = 'https://go-barry.onrender.com';
// const API_BASE = 'http://localhost:3001'; // For local testing

async function testSupervisorDisplaySync() {
  console.log('🔍 Testing Supervisor Display Sync...\n');
  
  try {
    // Step 1: Check current sessions
    console.log('1️⃣ Checking current sessions...');
    const debugResponse = await fetch(`${API_BASE}/api/supervisor/debug/sessions`);
    const debugData = await debugResponse.json();
    console.log('Current sessions:', debugData);
    console.log(`- Total sessions: ${debugData.totalSessions}`);
    console.log(`- Active sessions: ${debugData.activeSessions}\n`);
    
    // Step 2: Create a test session
    console.log('2️⃣ Creating test session for Anthony Gair...');
    const loginResponse = await fetch(`${API_BASE}/api/supervisor/login`, {
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
      console.error('❌ Login failed:', loginData.error);
      return;
    }
    
    const sessionId = loginData.sessionId;
    console.log(`✅ Session created: ${sessionId}\n`);
    
    // Step 3: Check active supervisors
    console.log('3️⃣ Checking active supervisors...');
    const activeResponse = await fetch(`${API_BASE}/api/supervisor/active`);
    const activeData = await activeResponse.json();
    console.log('Active supervisors response:', activeData);
    console.log(`- Count: ${activeData.count}`);
    console.log(`- Supervisors:`, activeData.activeSupervisors);
    
    // Step 4: Check sync status
    console.log('\n4️⃣ Checking sync status...');
    const syncResponse = await fetch(`${API_BASE}/api/supervisor/sync-status`);
    const syncData = await syncResponse.json();
    console.log('Sync status:', {
      connectedSupervisors: syncData.connectedSupervisors,
      activeSupervisors: syncData.activeSupervisors?.length || 0
    });
    
    // Step 5: Check activity logs
    console.log('\n5️⃣ Checking activity logs...');
    const activityResponse = await fetch(`${API_BASE}/api/activity/logs?limit=5`);
    const activityData = await activityResponse.json();
    console.log('Recent activities:', activityData);
    
    // Step 6: Check debug sessions again
    console.log('\n6️⃣ Re-checking sessions after login...');
    const debugResponse2 = await fetch(`${API_BASE}/api/supervisor/debug/sessions`);
    const debugData2 = await debugResponse2.json();
    console.log('Sessions after login:', {
      totalSessions: debugData2.totalSessions,
      activeSessions: debugData2.activeSessions,
      sessionDetails: debugData2.sessions?.map(s => ({
        supervisorName: s.supervisorName,
        active: s.active,
        minutesSinceActivity: s.minutesSinceActivity
      }))
    });
    
    // Step 7: Logout
    console.log('\n7️⃣ Logging out...');
    const logoutResponse = await fetch(`${API_BASE}/api/supervisor/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });
    const logoutData = await logoutResponse.json();
    console.log('Logout response:', logoutData);
    
    console.log('\n✅ Test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testSupervisorDisplaySync();
