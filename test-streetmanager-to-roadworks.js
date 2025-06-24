#!/usr/bin/env node
// Test script to verify StreetManager alerts flow to Roadworks Manager

const API_BASE = process.env.API_BASE || 'https://go-barry.onrender.com';

async function testStreetManagerToRoadworksFlow() {
  console.log('🧪 Testing StreetManager to Roadworks Manager flow...\n');

  try {
    // Step 1: Test StreetManager webhook test endpoint
    console.log('1️⃣ Testing StreetManager webhook test endpoint...');
    const testResponse = await fetch(`${API_BASE}/api/streetmanager/webhook/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const testResult = await testResponse.json();
    console.log('   📥 Webhook test result:', {
      success: testResult.success,
      alertId: testResult.alertId,
      message: testResult.message
    });

    if (!testResult.success) {
      console.error('❌ Webhook test failed:', testResult.error);
      return;
    }

    // Wait a moment for processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 2: Check roadworks database for StreetManager entries
    console.log('\n2️⃣ Checking roadworks database for StreetManager entries...');
    const roadworksResponse = await fetch(`${API_BASE}/api/roadwork-alerts`);
    const roadworksResult = await roadworksResponse.json();
    
    console.log('   📋 Roadworks database result:', {
      success: roadworksResult.success,
      count: roadworksResult.data?.length || 0
    });

    const streetManagerRoadworks = roadworksResult.data?.filter(rw => rw.source === 'streetmanager') || [];
    console.log('   🏗️ StreetManager roadworks found:', streetManagerRoadworks.length);

    if (streetManagerRoadworks.length > 0) {
      console.log('   📄 Latest StreetManager roadwork:', {
        id: streetManagerRoadworks[0].id,
        title: streetManagerRoadworks[0].title,
        location: streetManagerRoadworks[0].location,
        status: streetManagerRoadworks[0].status
      });
    }

    // Step 3: Check roadworks-alerts endpoint (what Roadworks Manager uses)
    console.log('\n3️⃣ Checking roadworks-alerts endpoint (Roadworks Manager source)...');
    const managerResponse = await fetch(`${API_BASE}/api/roadworks-alerts`);
    const managerResult = await managerResponse.json();
    
    console.log('   📊 Roadworks Manager result:', {
      success: managerResult.success,
      total: managerResult.roadworks?.length || 0,
      includesStreetManager: managerResult.metadata?.includesStreetManager || false
    });

    const streetManagerInManager = managerResult.roadworks?.filter(rw => rw.source === 'StreetManager') || [];
    console.log('   🎯 StreetManager alerts in manager:', streetManagerInManager.length);

    if (streetManagerInManager.length > 0) {
      console.log('   📋 Latest StreetManager alert in manager:', {
        id: streetManagerInManager[0].id,
        title: streetManagerInManager[0].title,
        source: streetManagerInManager[0].source,
        dataSource: streetManagerInManager[0].dataSource
      });
    }

    // Step 4: Summary
    console.log('\n📊 Test Summary:');
    console.log(`   ✅ Webhook test: ${testResult.success ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Database storage: ${streetManagerRoadworks.length > 0 ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Manager integration: ${streetManagerInManager.length > 0 ? 'PASS' : 'FAIL'}`);
    
    const allPassed = testResult.success && streetManagerRoadworks.length > 0 && streetManagerInManager.length > 0;
    console.log(`\n🎆 Overall result: ${allPassed ? '✅ SUCCESS - StreetManager alerts are flowing to Roadworks Manager!' : '❌ FAILED - Integration needs attention'}`);

    if (!allPassed) {
      console.log('\n🔧 Troubleshooting:');
      if (!testResult.success) console.log('   - Check StreetManager webhook processing');
      if (streetManagerRoadworks.length === 0) console.log('   - Check database storage in streetManagerEvents.js');
      if (streetManagerInManager.length === 0) console.log('   - Check roadworks-alerts endpoint transformation');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.log('\n🔧 Make sure the backend is running and accessible at:', API_BASE);
  }
}

// Run the test
testStreetManagerToRoadworksFlow();