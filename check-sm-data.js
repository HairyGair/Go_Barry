#!/usr/bin/env node
// Quick Street Manager data check for Go Barry

// Using built-in fetch (Node.js 18+)

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

async function checkSMData() {
  console.log('🔍 Checking Street Manager Data in Go Barry...\n');
  
  try {
    // 1. Check current status
    console.log('📊 Checking StreetManager Status...');
    const statusRes = await fetch(`${BASE_URL}/api/streetmanager/status`);
    const status = await statusRes.json();
    console.log('Status:', {
      configured: status.status?.configured,
      activities: status.status?.storage?.activities,
      permits: status.status?.storage?.permits,
      method: status.status?.method
    });
    console.log('');
    
    // 2. Check activities
    console.log('🚧 Checking Activities...');
    const activitiesRes = await fetch(`${BASE_URL}/api/streetmanager/activities`);
    const activities = await activitiesRes.json();
    console.log(`Activities found: ${activities.activities?.length || 0}`);
    if (activities.activities?.length > 0) {
      console.log('Latest activity:', activities.activities[0]);
    }
    console.log('');
    
    // 3. Check permits  
    console.log('📋 Checking Permits...');
    const permitsRes = await fetch(`${BASE_URL}/api/streetmanager/permits`);
    const permits = await permitsRes.json();
    console.log(`Permits found: ${permits.permits?.length || 0}`);
    if (permits.permits?.length > 0) {
      console.log('Latest permit:', permits.permits[0]);
    }
    console.log('');
    
    // 4. Add test data and re-check
    console.log('🧪 Adding test data...');
    const testRes = await fetch(`${BASE_URL}/api/streetmanager/test`, {
      method: 'POST'
    });
    const testResult = await testRes.json();
    console.log('Test result:', testResult);
    
    // Re-check activities after test
    const activitiesRes2 = await fetch(`${BASE_URL}/api/streetmanager/activities`);
    const activities2 = await activitiesRes2.json();
    console.log(`Activities after test: ${activities2.activities?.length || 0}`);
    console.log('');
    
    // 5. Summary
    console.log('📋 SUMMARY:');
    console.log(`- Webhook system: ${status.status?.configured ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`- Real data: ${(activities.activities?.length > 0 || permits.permits?.length > 0) ? '✅ Found' : '❌ None'}`);
    console.log(`- Test system: ${testRes.ok ? '✅ Working' : '❌ Failed'}`);
    
    return {
      hasRealData: (activities.activities?.length > 0 || permits.permits?.length > 0),
      testSystemWorks: testRes.ok,
      totalItems: (activities.activities?.length || 0) + (permits.permits?.length || 0)
    };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure your Go Barry backend is running on port 3001');
    console.log('Start with: cd backend && npm start');
    return { error: error.message };
  }
}

checkSMData().then(result => {
  console.log('\n🎯 Result:', result);
});
