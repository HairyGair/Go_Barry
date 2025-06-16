// test-tomtom-tiles.js
// Test the TomTom tiles system and throttling

import { tileThrottler } from './backend/utils/requestThrottler.js';

async function testTileSystem() {
  console.log('🧪 Testing TomTom Tiles System...');
  console.log('');
  
  // Test throttler status
  console.log('📊 Tile Throttler Status:');
  const status = tileThrottler.getStatus();
  console.log(`   Daily Limit: ${status.dailyLimit} tiles`);
  console.log(`   Daily Used: ${status.dailyCount} tiles`);
  console.log(`   Remaining: ${status.remainingToday} tiles`);
  console.log(`   Business Hours: ${status.businessHours.formatted}`);
  console.log(`   Currently Open: ${status.businessHours.currentlyOpen ? 'YES' : 'NO'}`);
  console.log(`   Requests/Hour: ${Math.round((50000 / status.businessHours.operatingHours) * 100) / 100}`);
  console.log(`   Interval: ${Math.round(status.msPerRequest / 1000)}s between requests`);
  console.log('');
  
  if (status.businessHours.currentlyOpen) {
    console.log('✅ Business hours are open - tile requests will be processed');
    
    // Test queue processing
    console.log('🧪 Testing tile request queue...');
    
    // Mock tile requests
    const testRequests = [];
    for (let i = 0; i < 3; i++) {
      testRequests.push(
        tileThrottler.makeRequest(
          async () => {
            console.log(`📸 Mock tile request ${i + 1} executing...`);
            await new Promise(resolve => setTimeout(resolve, 100));
            return { 
              success: true, 
              data: `mock-tile-${i + 1}`,
              size: 2048,
              contentType: 'image/png'
            };
          },
          `test-tile-${i + 1}`
        )
      );
    }
    
    try {
      const results = await Promise.all(testRequests);
      console.log('✅ All test tile requests completed:');
      results.forEach((result, index) => {
        console.log(`   Tile ${index + 1}:`, result.success ? 'SUCCESS' : 'FAILED');
      });
      
    } catch (error) {
      console.error('❌ Tile request test failed:', error);
    }
    
  } else {
    console.log('🚫 Business hours are closed - requests will be queued until 6:00 AM');
    const nextOpen = new Date(status.businessHours.nextOpenTime);
    console.log(`⏰ Next open: ${nextOpen.toLocaleString()}`);
  }
  
  console.log('');
  console.log('📊 Final Status:');
  const finalStatus = tileThrottler.getStatus();
  console.log(`   Queue Length: ${finalStatus.queueLength}`);
  console.log(`   Processing: ${finalStatus.isProcessing ? 'YES' : 'NO'}`);
  console.log(`   Total Used Today: ${finalStatus.dailyCount}/${finalStatus.dailyLimit}`);
  
  console.log('');
  console.log('🎯 Expected Performance:');
  console.log('   • 50,000 tiles/day spread over 18.25 hours');
  console.log('   • ~2,740 tiles/hour during business hours');
  console.log('   • ~1 tile every 1.3 seconds during peak usage');
  console.log('   • 500 tile memory cache with 30min TTL');
  console.log('   • Load balancing across 4 TomTom servers');
  console.log('   • Zero API limit breaches with queue management');
  
  console.log('');
  console.log('✅ TomTom Tiles System Test Complete!');
}

testTileSystem().catch(console.error);
