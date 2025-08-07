#!/usr/bin/env node

// Complete Backend Improvements Test Suite
// Tests all implemented improvements

import axios from 'axios';
import { performance } from 'perf_hooks';

const BASE_URL = 'http://localhost:3001';

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

async function runTests() {
  console.log(`${colors.blue}🧪 Testing Backend Improvements...${colors.reset}\n`);
  
  const results = [];
  
  // Test 1: Compression
  console.log('1️⃣ Testing Response Compression...');
  try {
    const response = await axios.get(`${BASE_URL}/api/roadworks/unified`, {
      headers: { 'Accept-Encoding': 'gzip' }
    });
    const compressed = response.headers['content-encoding'] === 'gzip';
    results.push({ test: 'Compression', passed: compressed });
    console.log(compressed ? `${colors.green}✅ Compression working${colors.reset}` : `${colors.red}❌ Compression not working${colors.reset}`);
  } catch (error) {
    results.push({ test: 'Compression', passed: false, error: error.message });
    console.log(`${colors.red}❌ Compression test failed: ${error.message}${colors.reset}`);
  }
  
  // Test 2: Standardized API Response
  console.log('\n2️⃣ Testing API Response Standardization...');
  try {
    const response = await axios.get(`${BASE_URL}/api/health`);
    const hasStandardFormat = response.data.hasOwnProperty('success') && 
                             response.data.hasOwnProperty('data');
    results.push({ test: 'API Standardization', passed: hasStandardFormat });
    console.log(hasStandardFormat ? `${colors.green}✅ Standard response format${colors.reset}` : `${colors.red}❌ Non-standard response${colors.reset}`);
  } catch (error) {
    results.push({ test: 'API Standardization', passed: false, error: error.message });
    console.log(`${colors.red}❌ API standardization test failed${colors.reset}`);
  }
  
  // Test 3: Caching
  console.log('\n3️⃣ Testing Cache System...');
  try {
    // First request (should miss)
    const start1 = performance.now();
    const response1 = await axios.get(`${BASE_URL}/api/roadworks/unified?test=cache`);
    const time1 = performance.now() - start1;
    const cacheHeader1 = response1.headers['x-cache'];
    
    // Second request (should hit)
    const start2 = performance.now();
    const response2 = await axios.get(`${BASE_URL}/api/roadworks/unified?test=cache`);
    const time2 = performance.now() - start2;
    const cacheHeader2 = response2.headers['x-cache'];
    
    const cacheWorking = cacheHeader2?.includes('HIT') || time2 < time1 / 2;
    results.push({ test: 'Caching', passed: cacheWorking });
    console.log(`First request: ${time1.toFixed(0)}ms (${cacheHeader1 || 'no header'})`);
    console.log(`Second request: ${time2.toFixed(0)}ms (${cacheHeader2 || 'no header'})`);
    console.log(cacheWorking ? `${colors.green}✅ Cache working${colors.reset}` : `${colors.yellow}⚠️ Cache may not be working${colors.reset}`);
  } catch (error) {
    results.push({ test: 'Caching', passed: false, error: error.message });
    console.log(`${colors.red}❌ Cache test failed${colors.reset}`);
  }
  
  // Test 4: Health Check
  console.log('\n4️⃣ Testing Comprehensive Health Check...');
  try {
    const response = await axios.get(`${BASE_URL}/api/health?detailed=true`);
    const hasChecks = response.data.checks && 
                     Object.keys(response.data.checks).length > 3;
    results.push({ test: 'Health Check', passed: hasChecks });
    console.log(`Health checks found: ${Object.keys(response.data.checks || {}).join(', ')}`);
    console.log(hasChecks ? `${colors.green}✅ Comprehensive health check${colors.reset}` : `${colors.red}❌ Limited health check${colors.reset}`);
  } catch (error) {
    results.push({ test: 'Health Check', passed: false, error: error.message });
    console.log(`${colors.red}❌ Health check test failed${colors.reset}`);
  }
  
  // Test 5: Circuit Breakers
  console.log('\n5️⃣ Testing Circuit Breakers...');
  try {
    const response = await axios.get(`${BASE_URL}/api/circuit-breaker/status`);
    const hasBreakers = response.data.circuitBreakers && 
                       Object.keys(response.data.circuitBreakers).length > 0;
    results.push({ test: 'Circuit Breakers', passed: hasBreakers });
    console.log(`Circuit breakers: ${Object.keys(response.data.circuitBreakers || {}).join(', ')}`);
    console.log(hasBreakers ? `${colors.green}✅ Circuit breakers active${colors.reset}` : `${colors.red}❌ No circuit breakers${colors.reset}`);
  } catch (error) {
    results.push({ test: 'Circuit Breakers', passed: false, error: error.message });
    console.log(`${colors.red}❌ Circuit breaker test failed${colors.reset}`);
  }
  
  // Test 6: Monitoring Dashboard
  console.log('\n6️⃣ Testing Monitoring Dashboard...');
  try {
    const response = await axios.get(`${BASE_URL}/api/monitoring/dashboard`);
    const hasDashboard = response.data.success && 
                        response.data.data.health && 
                        response.data.data.cache;
    results.push({ test: 'Monitoring Dashboard', passed: hasDashboard });
    console.log(hasDashboard ? `${colors.green}✅ Monitoring dashboard working${colors.reset}` : `${colors.red}❌ Dashboard incomplete${colors.reset}`);
  } catch (error) {
    results.push({ test: 'Monitoring Dashboard', passed: false, error: error.message });
    console.log(`${colors.yellow}⚠️ Monitoring dashboard not available (route may not be registered)${colors.reset}`);
  }
  
  // Test 7: Request Pool
  console.log('\n7️⃣ Testing Request Pool Management...');
  try {
    // Make multiple concurrent requests
    const promises = Array(5).fill(0).map(() => 
      axios.get(`${BASE_URL}/api/roadworks/unified?test=pool`)
    );
    const start = performance.now();
    await Promise.all(promises);
    const duration = performance.now() - start;
    
    results.push({ test: 'Request Pool', passed: true });
    console.log(`${colors.green}✅ Handled 5 concurrent requests in ${duration.toFixed(0)}ms${colors.reset}`);
  } catch (error) {
    results.push({ test: 'Request Pool', passed: false, error: error.message });
    console.log(`${colors.red}❌ Request pool test failed${colors.reset}`);
  }
  
  // Summary
  console.log(`\n${colors.blue}📊 Test Summary${colors.reset}`);
  console.log('═══════════════════════════════════════');
  
  let passed = 0;
  let failed = 0;
  
  results.forEach(result => {
    if (result.passed) {
      passed++;
      console.log(`${colors.green}✅ ${result.test}${colors.reset}`);
    } else {
      failed++;
      console.log(`${colors.red}❌ ${result.test}${result.error ? `: ${result.error}` : ''}${colors.reset}`);
    }
  });
  
  console.log('═══════════════════════════════════════');
  console.log(`Total: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log(`\n${colors.green}🎉 All improvements working successfully!${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}⚠️ Some improvements need attention${colors.reset}`);
  }
  
  // Performance metrics
  console.log(`\n${colors.blue}📈 Performance Metrics${colors.reset}`);
  try {
    const metricsResponse = await axios.get(`${BASE_URL}/api/monitoring/metrics/performance`);
    const metrics = metricsResponse.data.data;
    console.log(`Average Response Time: ${metrics.avgResponseTime}`);
    console.log(`P95 Response Time: ${metrics.p95ResponseTime}`);
    console.log(`Error Rate: ${metrics.errorRate}`);
    console.log(`Requests/Second: ${metrics.requestsPerSecond}`);
  } catch (error) {
    console.log('Performance metrics not available');
  }
}

// Run tests
console.log(`${colors.blue}Starting Go BARRY Backend Improvements Test Suite${colors.reset}`);
console.log('Make sure the backend is running on port 3001\n');

runTests().then(() => {
  console.log(`\n${colors.blue}Test suite completed${colors.reset}`);
  process.exit(0);
}).catch(error => {
  console.error(`${colors.red}Test suite failed: ${error.message}${colors.reset}`);
  process.exit(1);
});
