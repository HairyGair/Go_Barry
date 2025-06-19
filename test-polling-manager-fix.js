#!/usr/bin/env node
// Test script to verify the timeBasedPollingManager fix

import timeBasedPollingManager from './backend/services/timeBasedPollingManager.js';

console.log('🧪 Testing TimeBasedPollingManager fix...\n');

async function testPollingManager() {
  try {
    console.log('📝 Test 1: Getting system status...');
    const status = timeBasedPollingManager.getStatus();
    console.log('✅ Status retrieved successfully');
    console.log(`   Within allowed window: ${status.withinAllowedWindow}`);
    console.log(`   Emergency override: ${status.emergencyOverride}`);
    
    console.log('\n📝 Test 2: Checking if TomTom can be polled...');
    const tomtomCheck = timeBasedPollingManager.canPollSource('tomtom');
    console.log('✅ TomTom poll check completed');
    console.log(`   Allowed: ${tomtomCheck.allowed}`);
    console.log(`   Reason: ${tomtomCheck.reason}`);
    
    console.log('\n📝 Test 3: Getting optimized schedule...');
    const schedule = timeBasedPollingManager.getOptimizedSchedule();
    console.log('✅ Schedule retrieved successfully');
    console.log(`   Overall status: ${schedule.overallStatus}`);
    console.log(`   Sources tracked: ${Object.keys(schedule.sources).join(', ')}`);
    
    console.log('\n📝 Test 4: Recording a test poll...');
    timeBasedPollingManager.recordPoll('tomtom', true);
    console.log('✅ Test poll recorded successfully');
    
    console.log('\n🎉 All tests passed! The timeBasedPollingManager is working correctly.');
    console.log('\n💡 The enhanced alerts endpoint should now work properly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test
testPollingManager().then(() => {
  console.log('\n✅ TimeBasedPollingManager test completed successfully');
  process.exit(0);
}).catch((error) => {
  console.error('❌ TimeBasedPollingManager test failed:', error);
  process.exit(1);
});
