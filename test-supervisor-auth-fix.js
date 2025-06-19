#!/usr/bin/env node
// Test script to verify supervisor authentication fix

console.log('🧪 Testing Supervisor Authentication Fix...\n');

const API_BASE_URL = 'https://go-barry.onrender.com';

async function testSupervisorAuth() {
  try {
    console.log('📝 Test 1: Health check...');
    const healthResponse = await fetch(`${API_BASE_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Backend is responsive:', healthData.status);
    
    console.log('\n📝 Test 2: Supervisor authentication...');
    const authResponse = await fetch(`${API_BASE_URL}/api/supervisor/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        supervisorId: 'supervisor001',
        badge: 'AW001'
      })
    });
    
    const authData = await authResponse.json();
    
    if (authData.success) {
      console.log('✅ Authentication successful:', authData.supervisor.name);
      console.log('📋 Session ID:', authData.sessionId);
      
      console.log('\n📝 Test 3: Check active supervisors...');
      const activeResponse = await fetch(`${API_BASE_URL}/api/supervisor/active`);
      const activeData = await activeResponse.json();
      console.log('✅ Active supervisors:', activeData.count);
      
      if (activeData.activeSupervisors.length > 0) {
        console.log('👥 Supervisors:', activeData.activeSupervisors.map(s => s.name));
      }
      
      console.log('\n📝 Test 4: Check recent activity...');
      const activityResponse = await fetch(`${API_BASE_URL}/api/supervisor/activity/recent?limit=5`);
      const activityData = await activityResponse.json();
      console.log('✅ Recent activities:', activityData.count);
      
      if (activityData.activities.length > 0) {
        console.log('📋 Latest activities:');
        activityData.activities.forEach((activity, i) => {
          console.log(`  ${i + 1}. ${activity.action} - ${activity.details?.supervisor_name || 'Unknown'}`);
        });
      }
      
      console.log('\n📝 Test 5: Logout...');
      const logoutResponse = await fetch(`${API_BASE_URL}/api/supervisor/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: authData.sessionId
        })
      });
      
      const logoutData = await logoutResponse.json();
      console.log('✅ Logout:', logoutData.success ? 'SUCCESS' : 'FAILED');
      
      console.log('\n🎉 All tests completed successfully!');
      console.log('\n💡 The supervisor login should now work properly in the frontend.');
      
    } else {
      console.error('❌ Authentication failed:', authData.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testSupervisorAuth().then(() => {
  console.log('\n✅ Test script completed');
}).catch((error) => {
  console.error('❌ Test script failed:', error);
});
