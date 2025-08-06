#!/usr/bin/env node

// Test script for Error Recovery System
// Run: node test-error-recovery.js

import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

async function testCircuitBreaker() {
  console.log('\n🧪 Testing Error Recovery System...\n');
  
  try {
    // 1. Check circuit breaker status
    console.log('1️⃣ Checking circuit breaker status...');
    const statusResponse = await axios.get(`${BASE_URL}/api/circuit-breaker/status`);
    console.log('Circuit Breakers:', JSON.stringify(statusResponse.data.circuitBreakers, null, 2));
    
    // 2. Test force opening a circuit
    console.log('\n2️⃣ Force opening TomTom circuit breaker...');
    const forceOpenResponse = await axios.post(`${BASE_URL}/api/circuit-breaker/force-open/tomtom`);
    console.log('Force open result:', forceOpenResponse.data.message);
    
    // 3. Check status again
    console.log('\n3️⃣ Checking status after force open...');
    const statusAfterOpen = await axios.get(`${BASE_URL}/api/circuit-breaker/status`);
    const tomtomStatus = statusAfterOpen.data.circuitBreakers.tomtom;
    console.log('TomTom status:', {
      state: tomtomStatus.state,
      failureCount: tomtomStatus.failureCount,
      nextRetry: new Date(tomtomStatus.nextAttempt).toLocaleTimeString()
    });
    
    // 4. Test fallback data
    console.log('\n4️⃣ Testing fallback data retrieval...');
    const fallbackResponse = await axios.get(`${BASE_URL}/api/circuit-breaker/fallback/tomtom`);
    console.log('Fallback available:', fallbackResponse.data.hasFallback);
    
    // 5. Reset circuit breaker
    console.log('\n5️⃣ Resetting TomTom circuit breaker...');
    const resetResponse = await axios.post(`${BASE_URL}/api/circuit-breaker/reset/tomtom`);
    console.log('Reset result:', resetResponse.data.message);
    
    // 6. Final status check
    console.log('\n6️⃣ Final status check...');
    const finalStatus = await axios.get(`${BASE_URL}/api/circuit-breaker/status`);
    console.log('TomTom final state:', finalStatus.data.circuitBreakers.tomtom.state);
    
    console.log('\n✅ Error Recovery System test completed successfully!\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the test
testCircuitBreaker().then(() => {
  console.log('🎉 All tests passed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});
