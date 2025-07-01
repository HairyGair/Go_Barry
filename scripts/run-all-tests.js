#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Operations Centre - Complete Test Suite');
console.log('==========================================\n');

const tests = [
  {
    name: 'Service Check',
    command: 'node scripts/check-services.js',
    emoji: '🔍',
    required: true
  },
  // Unit tests commented out until Jest is properly configured
  // {
  //   name: 'Unit Tests',
  //   command: 'cd Go_BARRY && npm test -- --testMatch="**/operations/**/*.test.js"',
  //   emoji: '🧩'
  // },
  {
    name: 'Integration Tests',
    command: 'node scripts/integration-test.js',
    emoji: '🔗'
  },
  {
    name: 'Performance Tests',
    command: 'node scripts/performance-test.js',
    emoji: '🚀'
  },
  {
    name: 'Accessibility Tests',
    command: 'node scripts/accessibility-test.js',
    emoji: '♿'
  }
];

const results = [];
let allPassed = true;

// Check if running in CI environment
const isCI = process.env.CI === 'true';

// Create test results directory
const resultsDir = path.join(__dirname, '..', 'test-results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir);
}

// Run each test suite
for (const test of tests) {
  console.log(`\n${test.emoji} Running ${test.name}...`);
  console.log('-'.repeat(40));
  
  const startTime = Date.now();
  let passed = false;
  let output = '';
  
  try {
    output = execSync(test.command, { 
      encoding: 'utf8',
      stdio: isCI ? 'pipe' : 'inherit'
    });
    passed = true;
    console.log(`✅ ${test.name} passed!`);
  } catch (error) {
    passed = false;
    allPassed = false;
    output = error.stdout || error.message;
    console.error(`❌ ${test.name} failed!`);
    
    if (!isCI) {
      console.error('Error:', error.message);
    }
    
    // If this is a required test, stop execution
    if (test.required) {
      console.error('\n🚫 This is a required test. Cannot continue.');
      process.exit(1);
    }
  }
  
  const duration = Date.now() - startTime;
  
  results.push({
    name: test.name,
    passed,
    duration,
    output: isCI ? output : 'See console output'
  });
  
  console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);
}

// Generate summary report
console.log('\n\n📊 TEST SUMMARY');
console.log('==========================================');

const passedCount = results.filter(r => r.passed).length;
const failedCount = results.filter(r => !r.passed).length;

console.log(`Total: ${results.length} test suites`);
console.log(`✅ Passed: ${passedCount}`);
console.log(`❌ Failed: ${failedCount}`);
console.log(`⏱️  Total Duration: ${(results.reduce((sum, r) => sum + r.duration, 0) / 1000).toFixed(2)}s`);

console.log('\nDetailed Results:');
results.forEach(result => {
  const status = result.passed ? '✅' : '❌';
  console.log(`${status} ${result.name}: ${(result.duration / 1000).toFixed(2)}s`);
});

// Save summary report
const summaryReport = {
  timestamp: new Date().toISOString(),
  environment: isCI ? 'CI' : 'Local',
  summary: {
    total: results.length,
    passed: passedCount,
    failed: failedCount,
    duration: results.reduce((sum, r) => sum + r.duration, 0)
  },
  results: results
};

const reportPath = path.join(resultsDir, `test-summary-${Date.now()}.json`);
fs.writeFileSync(reportPath, JSON.stringify(summaryReport, null, 2));

console.log(`\n📄 Test report saved to: ${reportPath}`);

// Exit with appropriate code
if (allPassed) {
  console.log('\n🎉 All tests passed! Operations Centre is ready!');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed. Please fix issues before deployment.');
  process.exit(1);
}
