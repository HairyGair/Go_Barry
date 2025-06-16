// test-throttling.js
// Test the request throttling system with business hours

import { geocodingThrottler } from './backend/utils/requestThrottler.js';

async function testThrottling() {
  console.log('🧪 Testing request throttling system with business hours...');
  
  // Check initial status
  const initialStatus = geocodingThrottler.getStatus();
  console.log('📊 Initial status:', {
    ...initialStatus,
    businessHours: initialStatus.businessHours
  });
  
  console.log(`\n🕐 Current time: ${new Date().toLocaleTimeString()}`);
  console.log(`📅 Business hours: ${initialStatus.businessHours.formatted}`);
  console.log(`🟢 Currently open: ${initialStatus.businessHours.currentlyOpen ? 'YES' : 'NO'}`);
  
  if (!initialStatus.businessHours.currentlyOpen) {
    console.log(`⏰ Next open time: ${new Date(initialStatus.businessHours.nextOpenTime).toLocaleString()}`);
  }
  
  // Make several test requests
  const testRequests = [];
  
  for (let i = 1; i <= 3; i++) {
    testRequests.push(
      geocodingThrottler.makeRequest(
        async () => {
          console.log(`📡 Test request ${i} executing...`);
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 100));
          return { success: true, data: `Test result ${i}` };
        },
        `test-request-${i}`
      )
    );
  }
  
  try {
    console.log('\n🚀 Starting test requests...');
    const results = await Promise.all(testRequests);
    console.log('✅ All test requests completed:');
    results.forEach((result, index) => {
      console.log(`   Request ${index + 1}:`, result);
    });
    
    // Check final status
    const finalStatus = geocodingThrottler.getStatus();
    console.log('\n📊 Final status:', {
      dailyCount: finalStatus.dailyCount,
      remainingToday: finalStatus.remainingToday,
      queueLength: finalStatus.queueLength,
      currentlyOpen: finalStatus.businessHours.currentlyOpen
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testThrottling();
