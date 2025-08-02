// backend/test-cleanup-functionality.js
// Test script for dismissed alerts cleanup functionality
// Memory optimized for Render.com 2GB RAM constraint

import dotenv from 'dotenv';
import { dismissedAlertsCleanupService } from './services/dismissedAlertsCleanupService.js';
import { cleanupScheduler } from './services/cleanupScheduler.js';

// Load environment variables
dotenv.config();

console.log('🧪 Testing Dismissed Alerts Cleanup Functionality');
console.log('==================================================');

async function testCleanupService() {
  try {
    console.log('\n1️⃣ Testing Cleanup Service Configuration...');
    
    // Test configuration loading
    console.log('📋 Retention Periods:', dismissedAlertsCleanupService.retentionPeriods);
    console.log('⚙️ Batch Size:', dismissedAlertsCleanupService.batchSize);
    console.log('⏱️ Max Operation Time:', dismissedAlertsCleanupService.maxOperationTime, 'ms');
    console.log('🔍 Dry Run Mode:', dismissedAlertsCleanupService.dryRun);
    
    console.log('\n2️⃣ Testing Cleanup Statistics...');
    
    // Get cleanup statistics
    const stats = await dismissedAlertsCleanupService.getCleanupStats();
    if (stats.success) {
      console.log('✅ Successfully retrieved cleanup statistics');
      console.log('📊 Statistics:', JSON.stringify(stats.stats, null, 2));
    } else {
      console.log('❌ Failed to get cleanup statistics:', stats.error);
    }
    
    console.log('\n3️⃣ Testing Eligible Records Detection...');
    
    // Find eligible records
    const eligibleResult = await dismissedAlertsCleanupService.findEligibleRecords();
    if (eligibleResult.success) {
      console.log('✅ Successfully found eligible records');
      console.log('📝 Total eligible:', eligibleResult.total_eligible);
      console.log('🗂️ Breakdown:');
      console.log(`   - Dismissed alerts: ${eligibleResult.eligible_records.dismissed_alerts.length}`);
      console.log(`   - Streetworks: ${eligibleResult.eligible_records.streetworks.length}`);
      console.log(`   - Manual incidents: ${eligibleResult.eligible_records.manual_incidents.length}`);
      
      // Show samples if available
      if (eligibleResult.eligible_records.dismissed_alerts.length > 0) {
        console.log('📋 Sample dismissed alert eligible for cleanup:');
        const sample = eligibleResult.eligible_records.dismissed_alerts[0];
        console.log(`   - ID: ${sample.id}`);
        console.log(`   - Age: ${sample.age_days} days`);
        console.log(`   - Retention period: ${sample.retention_period} days`);
        console.log(`   - Reason: ${sample.reason}`);
      }
    } else {
      console.log('❌ Failed to find eligible records:', eligibleResult.error);
    }
    
    console.log('\n4️⃣ Testing Dry Run Cleanup...');
    
    // Test dry run cleanup
    const originalDryRun = dismissedAlertsCleanupService.dryRun;
    dismissedAlertsCleanupService.dryRun = true; // Force dry run for testing
    
    try {
      const cleanupResult = await dismissedAlertsCleanupService.performCleanup();
      if (cleanupResult.success) {
        console.log('✅ Dry run cleanup completed successfully');
        console.log('🧹 Results:', JSON.stringify(cleanupResult.results, null, 2));
      } else {
        console.log('❌ Dry run cleanup failed:', cleanupResult.error);
      }
    } finally {
      dismissedAlertsCleanupService.dryRun = originalDryRun; // Restore original setting
    }
    
    console.log('\n5️⃣ Testing Cleanup Scheduler...');
    
    // Test scheduler status
    const schedulerStatus = cleanupScheduler.getStatus();
    console.log('📅 Scheduler Status:', JSON.stringify(schedulerStatus, null, 2));
    
    // Test scheduler configuration
    console.log('⚙️ Scheduler Configuration:', JSON.stringify(cleanupScheduler.enabledJobs, null, 2));
    
    return {
      success: true,
      stats: stats.success ? stats : null,
      eligible_records: eligibleResult.success ? eligibleResult : null,
      cleanup_test: cleanupResult?.success || false,
      scheduler_status: schedulerStatus
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function testRetentionPeriodLogic() {
  console.log('\n6️⃣ Testing Retention Period Logic...');
  
  const testReasons = [
    'Data error - duplicate entry',
    'Not affecting any routes',
    'Work completed early',
    'Supervisor override - false alarm',
    'Some other reason',
    null,
    ''
  ];
  
  testReasons.forEach(reason => {
    const retentionPeriod = dismissedAlertsCleanupService.getRetentionPeriod(reason);
    console.log(`📋 Reason: "${reason || 'null/empty'}" → Retention: ${retentionPeriod} days`);
  });
}

async function testMemoryOptimization() {
  console.log('\n7️⃣ Testing Memory Optimization...');
  
  const startMemory = process.memoryUsage();
  console.log('🏁 Starting memory usage:', {
    heapUsed: Math.round(startMemory.heapUsed / 1024 / 1024) + 'MB',
    heapTotal: Math.round(startMemory.heapTotal / 1024 / 1024) + 'MB',
    rss: Math.round(startMemory.rss / 1024 / 1024) + 'MB'
  });
  
  // Perform some operations
  await testCleanupService();
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
    console.log('🗑️ Garbage collection triggered');
  }
  
  const endMemory = process.memoryUsage();
  console.log('🏁 Ending memory usage:', {
    heapUsed: Math.round(endMemory.heapUsed / 1024 / 1024) + 'MB',
    heapTotal: Math.round(endMemory.heapTotal / 1024 / 1024) + 'MB',
    rss: Math.round(endMemory.rss / 1024 / 1024) + 'MB'
  });
  
  const memoryDiff = endMemory.heapUsed - startMemory.heapUsed;
  console.log('📊 Memory difference:', Math.round(memoryDiff / 1024 / 1024) + 'MB');
  
  if (memoryDiff > 50 * 1024 * 1024) { // 50MB threshold
    console.log('⚠️ Memory usage increased significantly - may need optimization');
  } else {
    console.log('✅ Memory usage remained stable');
  }
}

// Run all tests
async function runAllTests() {
  try {
    console.log('🚀 Starting comprehensive cleanup functionality tests...\n');
    
    const results = await testCleanupService();
    await testRetentionPeriodLogic();
    await testMemoryOptimization();
    
    console.log('\n🎯 TEST SUMMARY');
    console.log('===============');
    
    if (results.success) {
      console.log('✅ Overall test status: PASSED');
      console.log('📊 Statistics retrieval:', results.stats ? 'PASSED' : 'FAILED');
      console.log('📝 Eligible records detection:', results.eligible_records ? 'PASSED' : 'FAILED');
      console.log('🧹 Cleanup dry run:', results.cleanup_test ? 'PASSED' : 'FAILED');
      console.log('📅 Scheduler status:', results.scheduler_status?.is_running !== undefined ? 'PASSED' : 'FAILED');
    } else {
      console.log('❌ Overall test status: FAILED');
      console.log('❌ Error:', results.error);
    }
    
    console.log('\n🏆 Dismissed alerts cleanup functionality test completed!');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
    .then(() => {
      console.log('✅ All tests completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

export { testCleanupService, testRetentionPeriodLogic, testMemoryOptimization, runAllTests };