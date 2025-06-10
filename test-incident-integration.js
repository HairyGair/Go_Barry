#!/usr/bin/env node

// Comprehensive test for incident integration with dashboard
const BASE_URL = 'http://localhost:3001';

async function testIncidentIntegration() {
  console.log('🚦 Testing Go BARRY Incident Integration with Dashboard\n');
  
  let testsPassed = 0;
  let totalTests = 0;
  
  async function runTest(name, testFn) {
    totalTests++;
    try {
      console.log(`🧪 Test ${totalTests}: ${name}`);
      await testFn();
      console.log(`   ✅ PASSED\n`);
      testsPassed++;
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.message}\n`);
    }
  }
  
  // Test 1: Backend is running
  await runTest('Backend is running', async () => {
    const response = await fetch(`${BASE_URL}/api/health`);
    if (!response.ok) throw new Error('Backend not responding');
  });
  
  // Test 2: Create a test incident
  let testIncidentId;
  await runTest('Create test incident', async () => {
    const testIncident = {
      type: 'incident',
      subtype: 'Road Traffic Accident',
      location: 'A1 Junction 65, Birtley',
      description: 'Integration test incident - multiple vehicle collision',
      severity: 'High',
      createdBy: 'Integration Test',
      createdByRole: 'Test Suite'
    };
    
    const response = await fetch(`${BASE_URL}/api/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testIncident)
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    if (!data.success || !data.incident.id) {
      throw new Error('Failed to create incident');
    }
    
    testIncidentId = data.incident.id;
    console.log(`   📝 Created incident: ${testIncidentId}`);
  });
  
  // Test 3: Verify incident appears in incidents list
  await runTest('Incident appears in incidents list', async () => {
    const response = await fetch(`${BASE_URL}/api/incidents`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    const foundIncident = data.incidents.find(inc => inc.id === testIncidentId);
    
    if (!foundIncident) {
      throw new Error('Incident not found in incidents list');
    }
    
    console.log(`   📋 Found in incidents: ${foundIncident.location}`);
  });
  
  // Test 4: Verify incident appears in enhanced alerts dashboard
  await runTest('Incident appears in enhanced alerts', async () => {
    const response = await fetch(`${BASE_URL}/api/alerts-enhanced`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    const foundAlert = data.alerts.find(alert => alert.id === testIncidentId);
    
    if (!foundAlert) {
      throw new Error('Incident not found in enhanced alerts');
    }
    
    if (foundAlert.source !== 'manual_incident') {
      throw new Error('Incident source not marked correctly');
    }
    
    console.log(`   🚨 Found in alerts: ${foundAlert.title}`);
    console.log(`   📊 Source: ${foundAlert.source}, Status: ${foundAlert.status}`);
  });
  
  // Test 5: Check statistics include manual incidents
  await runTest('Statistics include manual incidents', async () => {
    const response = await fetch(`${BASE_URL}/api/alerts-enhanced`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    
    if (!data.metadata.statistics.manualIncidents && data.metadata.statistics.manualIncidents !== 0) {
      throw new Error('Manual incidents not tracked in statistics');
    }
    
    if (data.metadata.statistics.manualIncidents < 1) {
      throw new Error('Manual incident count is 0 but we created one');
    }
    
    console.log(`   📈 Manual incidents in stats: ${data.metadata.statistics.manualIncidents}`);
    console.log(`   📈 Traffic alerts: ${data.metadata.statistics.trafficAlerts}`);
    console.log(`   📈 Total alerts: ${data.metadata.statistics.totalAlerts}`);
  });
  
  // Test 6: Update the incident
  await runTest('Update incident', async () => {
    const updates = {
      description: 'Updated: Road has been cleared, traffic flowing normally',
      severity: 'Low',
      status: 'monitoring'
    };
    
    const response = await fetch(`${BASE_URL}/api/incidents/${testIncidentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    if (!data.success) throw new Error('Update failed');
    
    console.log(`   ✏️ Updated severity to: ${data.incident.severity}`);
  });
  
  // Test 7: Verify update reflects in dashboard
  await runTest('Update reflects in dashboard', async () => {
    const response = await fetch(`${BASE_URL}/api/alerts-enhanced`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    const foundAlert = data.alerts.find(alert => alert.id === testIncidentId);
    
    if (!foundAlert) {
      throw new Error('Updated incident not found in alerts');
    }
    
    if (foundAlert.severity !== 'Low') {
      throw new Error('Severity update not reflected in dashboard');
    }
    
    console.log(`   🔄 Dashboard shows updated severity: ${foundAlert.severity}`);
  });
  
  // Test 8: Delete the test incident
  await runTest('Delete test incident', async () => {
    const response = await fetch(`${BASE_URL}/api/incidents/${testIncidentId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    if (!data.success) throw new Error('Delete failed');
    
    console.log(`   🗑️ Deleted incident: ${testIncidentId}`);
  });
  
  // Test 9: Verify deletion reflects in dashboard
  await runTest('Deletion reflects in dashboard', async () => {
    const response = await fetch(`${BASE_URL}/api/alerts-enhanced`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    const foundAlert = data.alerts.find(alert => alert.id === testIncidentId);
    
    if (foundAlert) {
      throw new Error('Deleted incident still appears in dashboard');
    }
    
    console.log(`   ✅ Incident successfully removed from dashboard`);
  });
  
  // Summary
  console.log('='.repeat(60));
  console.log(`📊 TEST SUMMARY`);
  console.log(`   Tests Passed: ${testsPassed}/${totalTests}`);
  console.log(`   Success Rate: ${Math.round((testsPassed / totalTests) * 100)}%`);
  
  if (testsPassed === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('\n✅ Incident Manager is now fully integrated with Control Dashboard');
    console.log('\n🌟 Features working:');
    console.log('   • Create incidents in Incident Manager');
    console.log('   • Incidents appear in Control Dashboard');
    console.log('   • Real-time updates between systems');
    console.log('   • Statistics include manual incidents');
    console.log('   • CRUD operations work correctly');
    console.log('\n👉 Try it now:');
    console.log('   1. Open the browser interface');
    console.log('   2. Login as supervisor');
    console.log('   3. Create incident in Incident Manager');
    console.log('   4. Check Control Dashboard to see it appear!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
    console.log('\n🔧 Common issues:');
    console.log('   • Backend not running (cd backend && npm start)');
    console.log('   • Missing dependencies (npm install)');
    console.log('   • Port conflicts (check if 3001 is available)');
  }
}

testIncidentIntegration().catch(console.error);
