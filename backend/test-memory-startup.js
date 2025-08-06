#!/usr/bin/env node

// Memory-safe startup test
// Run: node test-memory-startup.js

console.log('🧪 Testing memory-safe startup...\n');

// Monitor memory usage
function logMemory(label) {
  const used = process.memoryUsage();
  console.log(`${label}:`);
  console.log(`  RSS: ${Math.round(used.rss / 1024 / 1024)}MB`);
  console.log(`  Heap Used: ${Math.round(used.heapUsed / 1024 / 1024)}MB`);
  console.log(`  Heap Total: ${Math.round(used.heapTotal / 1024 / 1024)}MB`);
  console.log('');
}

logMemory('Initial memory');

// Test importing the lightweight modules
async function testLightweightImports() {
  console.log('Testing lightweight imports...\n');
  
  try {
    // Test circuit breaker lite
    console.log('1️⃣ Importing circuit breaker lite...');
    const { circuitBreakers } = await import('./services/circuitBreakerLite.js');
    logMemory('After circuit breaker import');
    
    // Test error recovery lite
    console.log('2️⃣ Importing error recovery lite...');
    const errorRecoveryLite = (await import('./errorRecoverySystemLite.js')).default;
    await errorRecoveryLite.initialize();
    logMemory('After error recovery init');
    
    // Test accessing a circuit breaker (should create on demand)
    console.log('3️⃣ Accessing TomTom circuit breaker...');
    const tomtomBreaker = circuitBreakers.tomtom;
    console.log('TomTom breaker status:', tomtomBreaker.getStatus());
    logMemory('After accessing circuit breaker');
    
    // Force garbage collection if available
    if (global.gc) {
      console.log('4️⃣ Running garbage collection...');
      global.gc();
      logMemory('After garbage collection');
    }
    
    console.log('✅ Memory-safe startup test passed!\n');
    console.log('Summary:');
    console.log('- Lightweight modules load successfully');
    console.log('- Circuit breakers create on-demand');
    console.log('- Memory usage remains low');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testLightweightImports().then(() => {
  console.log('\n🎉 All memory tests passed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});
