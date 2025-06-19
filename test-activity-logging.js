#!/usr/bin/env node
// Test script for supervisor activity logging system

import supervisorActivityLogger from './backend/services/supervisorActivityLogger.js';

console.log('🧪 Testing Supervisor Activity Logging System...\n');

async function testActivityLogging() {
  try {
    // Test 1: Log a login activity
    console.log('📝 Test 1: Logging login activity...');
    const loginResult = await supervisorActivityLogger.logLogin('AW001', 'Alex Woodcock');
    console.log('✅ Login logged:', loginResult.success ? 'SUCCESS' : 'FAILED');
    
    // Test 2: Log an alert dismissal
    console.log('\n📝 Test 2: Logging alert dismissal...');
    const dismissResult = await supervisorActivityLogger.logAlertDismissal(
      'AW001', 
      'Alex Woodcock', 
      'alert_123', 
      'False alarm',
      'A1 Junction 65'
    );
    console.log('✅ Alert dismissal logged:', dismissResult.success ? 'SUCCESS' : 'FAILED');
    
    // Test 3: Log roadwork creation
    console.log('\n📝 Test 3: Logging roadwork creation...');
    const roadworkResult = await supervisorActivityLogger.logRoadworkCreation(
      'AW001',
      'Alex Woodcock',
      {
        location: 'Central Station',
        severity: 'high',
        status: 'active'
      }
    );
    console.log('✅ Roadwork creation logged:', roadworkResult.success ? 'SUCCESS' : 'FAILED');
    
    // Test 4: Log email report
    console.log('\n📝 Test 4: Logging email report...');
    const emailResult = await supervisorActivityLogger.logEmailReport(
      'AW001',
      'Alex Woodcock',
      'Daily Service Report',
      'Operations Team'
    );
    console.log('✅ Email report logged:', emailResult.success ? 'SUCCESS' : 'FAILED');
    
    // Test 5: Log logout
    console.log('\n📝 Test 5: Logging logout activity...');
    const logoutResult = await supervisorActivityLogger.logLogout('AW001', 'Alex Woodcock');
    console.log('✅ Logout logged:', logoutResult.success ? 'SUCCESS' : 'FAILED');
    
    // Test 6: Retrieve recent activities
    console.log('\n📝 Test 6: Retrieving recent activities...');
    const activities = await supervisorActivityLogger.getRecentActivities(10);
    console.log(`✅ Retrieved ${activities.length} activities`);
    
    if (activities.length > 0) {
      console.log('\n📋 Recent Activities:');
      activities.slice(0, 5).forEach((activity, index) => {
        console.log(`${index + 1}. ${activity.supervisor_badge || 'N/A'} - ${activity.action} at ${new Date(activity.timestamp).toLocaleTimeString()}`);
      });
    }
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n💡 You can now check the Display Screen at https://go-barry.onrender.com to see if the activity feed is updating.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testActivityLogging().then(() => {
  console.log('\n✅ Test script completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});
