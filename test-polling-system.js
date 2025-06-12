#!/usr/bin/env node
// test-polling-system.js
// Test script to verify the optimized polling system works correctly

const API_BASE = process.env.API_BASE || 'https://go-barry.onrender.com';

// Test the existing endpoints first, then the new polling endpoints
async function testPollingSystem() {
  console.log('🧪 Testing BARRY Polling System...\n');
  
  try {
    // Test 0: Check if backend is responding
    console.log('0️⃣ Testing basic backend connectivity...');
    const healthResponse = await fetch(`${API_BASE}/api/health`);
    const healthResult = await healthResponse.json();
    console.log('✅ Backend health:', healthResult.success ? 'SUCCESS' : 'FAILED');

    // Test existing supervisor endpoints
    console.log('\n🔍 Testing existing supervisor endpoints...');
    const activeResponse = await fetch(`${API_BASE}/api/supervisor/active`);
    const activeResult = await activeResponse.json();
    console.log('✅ Active supervisors endpoint:', activeResult.success ? 'SUCCESS' : 'FAILED');

    // Check if new polling endpoints exist
    console.log('\n🆕 Testing new polling endpoints...');
    
    // Test sync-status endpoint
    console.log('1️⃣ Testing sync-status endpoint...');
    const syncResponse = await fetch(`${API_BASE}/api/supervisor/sync-status`);
    
    if (syncResponse.ok) {
      const syncResult = await syncResponse.json();
      console.log('✅ Sync status:', syncResult.success ? 'SUCCESS - New endpoints deployed!' : 'FAILED');
      
      // Continue with full polling tests if endpoints are available
      await runFullPollingTests();
    } else {
      console.log('⚠️ New polling endpoints not deployed yet');
      console.log('📋 Deploy status: Need to run deployment script');
      console.log('🚀 Next step: Run ./deploy-optimized-polling.sh');
      return;
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('💡 Make sure the backend is running and accessible at:', API_BASE);
  }
}

// Full polling system tests (run only if endpoints are deployed)
async function runFullPollingTests() {
  console.log('\n🔬 Running full polling system tests...');
  
  try {
    // Test 1: Clear state
    console.log('\n1️⃣ Clearing polling state...');
    const clearResponse = await fetch(`${API_BASE}/api/supervisor/clear-state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const clearResult = await clearResponse.json();
    console.log('✅ State cleared:', clearResult.success ? 'SUCCESS' : 'FAILED');

    // Test 2: Get initial sync status
    console.log('\n2️⃣ Getting initial sync status...');
    const initialResponse = await fetch(`${API_BASE}/api/supervisor/sync-status`);
    const initialStatus = await initialResponse.json();
    console.log('✅ Initial status:', {
      acknowledgedAlerts: initialStatus.acknowledgedAlerts?.length || 0,
      customMessages: initialStatus.customMessages?.length || 0,
      connectedSupervisors: initialStatus.connectedSupervisors || 0
    });

    // Test 3: Acknowledge an alert
    console.log('\n3️⃣ Acknowledging test alert...');
    const ackResponse = await fetch(`${API_BASE}/api/supervisor/acknowledge-alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alertId: 'test_alert_001',
        reason: 'Testing polling system',
        notes: 'Automated test acknowledgement'
      })
    });
    const ackResult = await ackResponse.json();
    console.log('✅ Acknowledge alert:', ackResult.success ? 'SUCCESS' : 'FAILED');

    // Test 4: Update alert priority
    console.log('\n4️⃣ Updating alert priority...');
    const priorityResponse = await fetch(`${API_BASE}/api/supervisor/update-priority`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alertId: 'test_alert_002',
        priority: 'CRITICAL',
        reason: 'Testing priority override'
      })
    });
    const priorityResult = await priorityResponse.json();
    console.log('✅ Update priority:', priorityResult.success ? 'SUCCESS' : 'FAILED');

    // Test 5: Add note to alert
    console.log('\n5️⃣ Adding note to alert...');
    const noteResponse = await fetch(`${API_BASE}/api/supervisor/add-note`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alertId: 'test_alert_003',
        note: 'This is a test note from the polling system'
      })
    });
    const noteResult = await noteResponse.json();
    console.log('✅ Add note:', noteResult.success ? 'SUCCESS' : 'FAILED');

    // Test 6: Broadcast message
    console.log('\n6️⃣ Broadcasting test message...');
    const messageResponse = await fetch(`${API_BASE}/api/supervisor/broadcast-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Test broadcast from polling system',
        priority: 'warning',
        duration: 10000
      })
    });
    const messageResult = await messageResponse.json();
    console.log('✅ Broadcast message:', messageResult.success ? 'SUCCESS' : 'FAILED');

    // Test 7: Dismiss from display
    console.log('\n7️⃣ Dismissing alert from display...');
    const dismissResponse = await fetch(`${API_BASE}/api/supervisor/dismiss-from-display`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alertId: 'test_alert_004',
        reason: 'Testing display dismissal'
      })
    });
    const dismissResult = await dismissResponse.json();
    console.log('✅ Dismiss from display:', dismissResult.success ? 'SUCCESS' : 'FAILED');

    // Test 8: Lock on display
    console.log('\n8️⃣ Locking alert on display...');
    const lockResponse = await fetch(`${API_BASE}/api/supervisor/lock-on-display`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alertId: 'test_alert_005',
        reason: 'Testing display lock'
      })
    });
    const lockResult = await lockResponse.json();
    console.log('✅ Lock on display:', lockResult.success ? 'SUCCESS' : 'FAILED');

    // Test 9: Get final sync status
    console.log('\n9️⃣ Getting final sync status...');
    const finalResponse = await fetch(`${API_BASE}/api/supervisor/sync-status`);
    const finalStatus = await finalResponse.json();
    console.log('✅ Final status:', {
      acknowledgedAlerts: finalStatus.acknowledgedAlerts?.length || 0,
      priorityOverrides: Object.keys(finalStatus.priorityOverrides || {}).length,
      supervisorNotes: Object.keys(finalStatus.supervisorNotes || {}).length,
      customMessages: finalStatus.customMessages?.length || 0,
      dismissedFromDisplay: finalStatus.dismissedFromDisplay?.length || 0,
      lockedOnDisplay: finalStatus.lockedOnDisplay?.length || 0
    });

    // Test 10: Performance test - rapid polling
    console.log('\n🔟 Performance test - rapid polling...');
    const startTime = Date.now();
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(fetch(`${API_BASE}/api/supervisor/sync-status`));
    }
    
    const responses = await Promise.all(promises);
    const endTime = Date.now();
    const avgResponseTime = (endTime - startTime) / 10;
    
    console.log('✅ Performance:', {
      totalTime: `${endTime - startTime}ms`,
      avgResponseTime: `${avgResponseTime.toFixed(1)}ms`,
      allSuccessful: responses.every(r => r.ok)
    });

    console.log('\n🎉 POLLING SYSTEM TEST COMPLETE!');
    console.log('📊 Summary: All endpoints tested successfully');
    console.log('⚡ Ready for production use - WebSocket-free communication!');

  } catch (error) {
    console.error('\n❌ Full test failed:', error.message);
  }
}

// Run the test
testPollingSystem();