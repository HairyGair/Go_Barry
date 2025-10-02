/**
 * Test Script for SDC Dashboard Endpoints
 * Tests all 4 new SDC operational endpoints
 */

import fetch from 'node-fetch';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const TEST_BREAKDOWN_ID = process.env.TEST_BREAKDOWN_ID || 'BD-2025-00001';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  console.log(`\n${colors.bright}${colors.cyan}━━━ ${testName} ━━━${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Test 1: Acknowledge Breakdown
async function testAcknowledgeBreakdown() {
  logTest('Test 1: Acknowledge Breakdown');

  try {
    const response = await fetch(`${BASE_URL}/api/sdc/acknowledge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        breakdown_id: TEST_BREAKDOWN_ID,
        acknowledged_by: 'Test SDC Operator',
        supervisor_badge: 'TEST001',
        notes: 'Testing acknowledge endpoint'
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      logSuccess(`Breakdown acknowledged: ${data.breakdown_id}`);
      logInfo(`Acknowledged at: ${data.acknowledged_at}`);
      logInfo(`Response: ${JSON.stringify(data, null, 2)}`);
      return true;
    } else {
      logError(`Failed to acknowledge breakdown: ${data.error || 'Unknown error'}`);
      logInfo(`Response: ${JSON.stringify(data, null, 2)}`);
      return false;
    }
  } catch (error) {
    logError(`Error testing acknowledge endpoint: ${error.message}`);
    return false;
  }
}

// Test 2: Record Decision
async function testRecordDecision() {
  logTest('Test 2: Record SDC Decision');

  try {
    const decisions = ['STOP', 'AMBER', 'CONTINUE'];
    const testDecision = decisions[Math.floor(Math.random() * decisions.length)];

    const response = await fetch(`${BASE_URL}/api/sdc/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        breakdown_id: TEST_BREAKDOWN_ID,
        decision: testDecision,
        decided_by: 'Test SDC Operator',
        supervisor_badge: 'TEST001',
        decision_notes: `Testing decision endpoint with ${testDecision} decision`
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      logSuccess(`Decision recorded: ${data.decision}`);
      logInfo(`Decision at: ${data.decision_at}`);
      logInfo(`Response: ${JSON.stringify(data, null, 2)}`);
      return true;
    } else {
      logError(`Failed to record decision: ${data.error || 'Unknown error'}`);
      logInfo(`Response: ${JSON.stringify(data, null, 2)}`);
      return false;
    }
  } catch (error) {
    logError(`Error testing decision endpoint: ${error.message}`);
    return false;
  }
}

// Test 3: Add Note
async function testAddNote() {
  logTest('Test 3: Add Operational Note');

  try {
    const response = await fetch(`${BASE_URL}/api/sdc/add-note`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        breakdown_id: TEST_BREAKDOWN_ID,
        note: `Test note added at ${new Date().toISOString()}. This is a comprehensive operational note to verify the endpoint functionality.`,
        added_by: 'Test SDC Operator',
        supervisor_badge: 'TEST001',
        note_type: 'operational'
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      logSuccess(`Note added successfully`);
      logInfo(`Total notes: ${data.total_notes}`);
      logInfo(`Note preview: ${data.note.note.substring(0, 50)}...`);
      logInfo(`Response: ${JSON.stringify(data, null, 2)}`);
      return true;
    } else {
      logError(`Failed to add note: ${data.error || 'Unknown error'}`);
      logInfo(`Response: ${JSON.stringify(data, null, 2)}`);
      return false;
    }
  } catch (error) {
    logError(`Error testing add-note endpoint: ${error.message}`);
    return false;
  }
}

// Test 4: Request Engineering
async function testRequestEngineering() {
  logTest('Test 4: Request Engineering Assistance');

  try {
    const response = await fetch(`${BASE_URL}/api/sdc/request-engineering`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        breakdown_id: TEST_BREAKDOWN_ID,
        requested_by: 'Test SDC Operator',
        supervisor_badge: 'TEST001',
        priority: 'high',
        notes: 'Testing engineering request endpoint',
        required_skills: ['electrical', 'diagnostic'],
        estimated_arrival: '30 mins'
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      logSuccess(`Engineering assistance requested`);
      logInfo(`Request ID: ${data.engineering_request.request_id}`);
      logInfo(`Priority: ${data.engineering_request.priority}`);
      logInfo(`Response: ${JSON.stringify(data, null, 2)}`);
      return true;
    } else {
      logError(`Failed to request engineering: ${data.error || 'Unknown error'}`);
      logInfo(`Response: ${JSON.stringify(data, null, 2)}`);
      return false;
    }
  } catch (error) {
    logError(`Error testing request-engineering endpoint: ${error.message}`);
    return false;
  }
}

// Test 5: Validation Tests
async function testValidation() {
  logTest('Test 5: Input Validation');

  let passedTests = 0;
  let totalTests = 0;

  // Test 5.1: Missing breakdown_id
  totalTests++;
  try {
    const response = await fetch(`${BASE_URL}/api/sdc/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: 'Test' })
    });
    const data = await response.json();

    if (response.status === 400 && data.error.includes('breakdown_id')) {
      logSuccess('Validation test 5.1: Missing breakdown_id rejected ✓');
      passedTests++;
    } else {
      logError('Validation test 5.1: Should reject missing breakdown_id ✗');
    }
  } catch (error) {
    logError(`Validation test 5.1 error: ${error.message}`);
  }

  // Test 5.2: Invalid decision value
  totalTests++;
  try {
    const response = await fetch(`${BASE_URL}/api/sdc/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        breakdown_id: TEST_BREAKDOWN_ID,
        decision: 'INVALID'
      })
    });
    const data = await response.json();

    if (response.status === 400 && data.error.includes('Invalid decision')) {
      logSuccess('Validation test 5.2: Invalid decision rejected ✓');
      passedTests++;
    } else {
      logError('Validation test 5.2: Should reject invalid decision ✗');
    }
  } catch (error) {
    logError(`Validation test 5.2 error: ${error.message}`);
  }

  // Test 5.3: Empty note
  totalTests++;
  try {
    const response = await fetch(`${BASE_URL}/api/sdc/add-note`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        breakdown_id: TEST_BREAKDOWN_ID,
        note: ''
      })
    });
    const data = await response.json();

    if (response.status === 400 && data.error.includes('required')) {
      logSuccess('Validation test 5.3: Empty note rejected ✓');
      passedTests++;
    } else {
      logError('Validation test 5.3: Should reject empty note ✗');
    }
  } catch (error) {
    logError(`Validation test 5.3 error: ${error.message}`);
  }

  // Test 5.4: Invalid priority
  totalTests++;
  try {
    const response = await fetch(`${BASE_URL}/api/sdc/request-engineering`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        breakdown_id: TEST_BREAKDOWN_ID,
        priority: 'ultra-mega-critical'
      })
    });
    const data = await response.json();

    if (response.status === 400 && data.error.includes('Invalid priority')) {
      logSuccess('Validation test 5.4: Invalid priority rejected ✓');
      passedTests++;
    } else {
      logError('Validation test 5.4: Should reject invalid priority ✗');
    }
  } catch (error) {
    logError(`Validation test 5.4 error: ${error.message}`);
  }

  logInfo(`Validation tests passed: ${passedTests}/${totalTests}`);
  return passedTests === totalTests;
}

// Run all tests
async function runAllTests() {
  log('\n╔════════════════════════════════════════════════╗', 'bright');
  log('║   SDC Dashboard Endpoints Test Suite          ║', 'bright');
  log('╚════════════════════════════════════════════════╝\n', 'bright');

  logInfo(`Base URL: ${BASE_URL}`);
  logInfo(`Test Breakdown ID: ${TEST_BREAKDOWN_ID}`);

  const results = {
    acknowledge: false,
    decision: false,
    addNote: false,
    requestEngineering: false,
    validation: false
  };

  // Run tests sequentially
  results.acknowledge = await testAcknowledgeBreakdown();
  await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests

  results.decision = await testRecordDecision();
  await new Promise(resolve => setTimeout(resolve, 500));

  results.addNote = await testAddNote();
  await new Promise(resolve => setTimeout(resolve, 500));

  results.requestEngineering = await testRequestEngineering();
  await new Promise(resolve => setTimeout(resolve, 500));

  results.validation = await testValidation();

  // Summary
  log('\n╔════════════════════════════════════════════════╗', 'bright');
  log('║   Test Results Summary                         ║', 'bright');
  log('╚════════════════════════════════════════════════╝\n', 'bright');

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r).length;

  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const color = passed ? 'green' : 'red';
    log(`${status} - ${test}`, color);
  });

  log(`\n${colors.bright}Total: ${passedTests}/${totalTests} tests passed${colors.reset}`);

  if (passedTests === totalTests) {
    log('\n🎉 All tests passed! SDC endpoints are working correctly.\n', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Some tests failed. Please check the errors above.\n', 'yellow');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  logError(`Fatal error running tests: ${error.message}`);
  console.error(error);
  process.exit(1);
});
