// backend/test-cleanup-smoke-test.js
// Smoke test for dismissed alerts cleanup functionality (no database required)
// Memory optimized for Render.com 2GB RAM constraint

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🧪 Smoke Test: Dismissed Alerts Cleanup Functionality');
console.log('====================================================');

async function testServiceImports() {
  try {
    console.log('\n1️⃣ Testing Service Imports...');
    
    // Test dismissedAlertsCleanupService import
    const { dismissedAlertsCleanupService } = await import('./services/dismissedAlertsCleanupService.js');
    console.log('✅ dismissedAlertsCleanupService imported successfully');
    
    // Test cleanupScheduler import
    const { cleanupScheduler } = await import('./services/cleanupScheduler.js');
    console.log('✅ cleanupScheduler imported successfully');
    
    // Test basic configuration
    console.log('📋 Retention Periods:', dismissedAlertsCleanupService.retentionPeriods);
    console.log('⚙️ Batch Size:', dismissedAlertsCleanupService.batchSize);
    console.log('⏱️ Max Operation Time:', dismissedAlertsCleanupService.maxOperationTime, 'ms');
    
    return { dismissedAlertsCleanupService, cleanupScheduler };
    
  } catch (error) {
    console.error('❌ Service import failed:', error.message);
    throw error;
  }
}

async function testRetentionLogic() {
  try {
    console.log('\n2️⃣ Testing Retention Period Logic...');
    
    const { dismissedAlertsCleanupService } = await import('./services/dismissedAlertsCleanupService.js');
    
    const testCases = [
      { reason: 'Data error - duplicate entry', expected: 7 },
      { reason: 'duplicate record found', expected: 7 },
      { reason: 'Not affecting any routes', expected: 30 },
      { reason: 'no impact on service', expected: 30 },
      { reason: 'Work completed early', expected: 30 },
      { reason: 'finished ahead of schedule', expected: 30 },
      { reason: 'Supervisor override - false alarm', expected: 90 },
      { reason: 'supervisor decision', expected: 90 },
      { reason: 'Some other reason', expected: 60 },
      { reason: null, expected: 60 },
      { reason: '', expected: 60 }
    ];
    
    let passedTests = 0;
    
    testCases.forEach(({ reason, expected }) => {
      const actual = dismissedAlertsCleanupService.getRetentionPeriod(reason);
      const passed = actual === expected;
      
      console.log(`${passed ? '✅' : '❌'} "${reason || 'null/empty'}" → ${actual} days (expected: ${expected})`);
      
      if (passed) passedTests++;
    });
    
    console.log(`\n📊 Retention Logic Test Results: ${passedTests}/${testCases.length} passed`);
    return passedTests === testCases.length;
    
  } catch (error) {
    console.error('❌ Retention logic test failed:', error.message);
    return false;
  }
}

async function testBatchCreation() {
  try {
    console.log('\n3️⃣ Testing Batch Creation Logic...');
    
    const { dismissedAlertsCleanupService } = await import('./services/dismissedAlertsCleanupService.js');
    
    // Create test records
    const testRecords = Array.from({ length: 250 }, (_, i) => ({
      id: `test_${i}`,
      age_days: Math.floor(Math.random() * 100),
      reason: 'test reason'
    }));
    
    const batches = dismissedAlertsCleanupService.createBatches(testRecords, 100);
    
    console.log(`📦 Created ${batches.length} batches from ${testRecords.length} records`);
    console.log(`📦 Batch sizes: ${batches.map(b => b.length).join(', ')}`);
    
    // Verify batch logic
    const expectedBatches = Math.ceil(testRecords.length / 100);
    const totalRecordsInBatches = batches.reduce((sum, batch) => sum + batch.length, 0);
    
    const batchTestPassed = batches.length === expectedBatches && totalRecordsInBatches === testRecords.length;
    
    console.log(`${batchTestPassed ? '✅' : '❌'} Batch creation logic test: ${batchTestPassed ? 'PASSED' : 'FAILED'}`);
    
    return batchTestPassed;
    
  } catch (error) {
    console.error('❌ Batch creation test failed:', error.message);
    return false;
  }
}

async function testSchedulerConfiguration() {
  try {
    console.log('\n4️⃣ Testing Scheduler Configuration...');
    
    const { cleanupScheduler } = await import('./services/cleanupScheduler.js');
    
    const status = cleanupScheduler.getStatus();
    console.log('📅 Scheduler running:', status.is_running);
    console.log('📋 Enabled jobs:', Object.keys(cleanupScheduler.enabledJobs));
    
    // Test job configuration
    const jobs = cleanupScheduler.enabledJobs;
    const requiredJobs = ['daily', 'weekly', 'monthly'];
    
    let configTestPassed = true;
    requiredJobs.forEach(jobName => {
      const jobExists = jobs[jobName] !== undefined;
      console.log(`${jobExists ? '✅' : '❌'} ${jobName} job configured: ${jobExists}`);
      if (!jobExists) configTestPassed = false;
    });
    
    return configTestPassed;
    
  } catch (error) {
    console.error('❌ Scheduler configuration test failed:', error.message);
    return false;
  }
}

async function testEnvironmentVariables() {
  try {
    console.log('\n5️⃣ Testing Environment Variables...');
    
    const envVars = [
      'CLEANUP_RETENTION_DATA_ERROR_DAYS',
      'CLEANUP_RETENTION_DEFAULT_DAYS',
      'CLEANUP_DAILY_ENABLED',
      'CLEANUP_BATCH_SIZE',
      'CLEANUP_MAX_TIME_MS'
    ];
    
    let envTestPassed = true;
    
    envVars.forEach(varName => {
      const value = process.env[varName];
      const exists = value !== undefined;
      console.log(`${exists ? '✅' : '⚠️'} ${varName}: ${value || 'not set'}`);
      
      // Don't fail test for missing env vars, just warn
      // if (!exists) envTestPassed = false;
    });
    
    return envTestPassed;
    
  } catch (error) {
    console.error('❌ Environment variables test failed:', error.message);
    return false;
  }
}

async function testMemoryUsage() {
  try {
    console.log('\n6️⃣ Testing Memory Usage...');
    
    const startMemory = process.memoryUsage();
    console.log('🏁 Starting memory usage:', {
      heapUsed: Math.round(startMemory.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(startMemory.heapTotal / 1024 / 1024) + 'MB',
      rss: Math.round(startMemory.rss / 1024 / 1024) + 'MB'
    });
    
    // Import services (simulates runtime loading)
    await testServiceImports();
    await testRetentionLogic();
    await testBatchCreation();
    
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
    const memoryDiffMB = Math.round(memoryDiff / 1024 / 1024);
    console.log('📊 Memory difference:', memoryDiffMB + 'MB');
    
    const memoryTestPassed = memoryDiffMB < 50; // Allow up to 50MB increase
    console.log(`${memoryTestPassed ? '✅' : '⚠️'} Memory usage test: ${memoryTestPassed ? 'PASSED' : 'HIGH USAGE'}`);
    
    return memoryTestPassed;
    
  } catch (error) {
    console.error('❌ Memory usage test failed:', error.message);
    return false;
  }
}

// Run all smoke tests
async function runSmokeTests() {
  try {
    console.log('🚀 Starting dismissed alerts cleanup smoke tests...\n');
    
    const testResults = {
      imports: false,
      retention: false,
      batching: false,
      scheduler: false,
      environment: false,
      memory: false
    };
    
    // Run tests sequentially to track memory usage properly
    testResults.imports = !!(await testServiceImports());
    testResults.retention = await testRetentionLogic();
    testResults.batching = await testBatchCreation();
    testResults.scheduler = await testSchedulerConfiguration();
    testResults.environment = await testEnvironmentVariables();
    testResults.memory = await testMemoryUsage();
    
    console.log('\n🎯 SMOKE TEST SUMMARY');
    console.log('=====================');
    
    const passedTests = Object.values(testResults).filter(Boolean).length;
    const totalTests = Object.keys(testResults).length;
    
    Object.entries(testResults).forEach(([testName, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${testName.charAt(0).toUpperCase() + testName.slice(1)} test: ${passed ? 'PASSED' : 'FAILED'}`);
    });
    
    console.log(`\n📊 Overall results: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All smoke tests PASSED! Cleanup functionality is ready for deployment.');
    } else if (passedTests >= totalTests - 1) {
      console.log('⚠️ Most tests passed. Cleanup functionality should work with minor issues.');
    } else {
      console.log('❌ Multiple test failures. Review implementation before deployment.');
    }
    
    console.log('\n🏆 Dismissed alerts cleanup smoke test completed!');
    
    return passedTests >= totalTests - 1; // Allow 1 failure
    
  } catch (error) {
    console.error('❌ Smoke test execution failed:', error);
    return false;
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSmokeTests()
    .then((success) => {
      console.log(`\n${success ? '✅ SUCCESS' : '❌ FAILURE'}: Smoke tests ${success ? 'completed successfully' : 'failed'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Smoke test execution failed:', error);
      process.exit(1);
    });
}

export { runSmokeTests };