/**
 * Test Script for Supervisors MySQL Migration
 *
 * Verifies all supervisor endpoints are working correctly after migration
 *
 * Usage:
 *   1. Ensure backend server is running (npm run dev)
 *   2. Run: node test-supervisors-migration.js
 */

import fetch from 'node-fetch';

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Colors for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(name, url, expectedStatus = 200) {
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (response.status === expectedStatus && data.success) {
      log(`✓ ${name}: PASSED`, 'green');
      return { success: true, data };
    } else {
      log(`✗ ${name}: FAILED (Status: ${response.status})`, 'red');
      console.log('  Response:', data);
      return { success: false, data };
    }
  } catch (error) {
    log(`✗ ${name}: ERROR - ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function runTests() {
  log('\n=== Supervisors MySQL Migration Tests ===\n', 'blue');

  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  // Test 1: Get all supervisors
  log('Test 1: GET /api/supervisors', 'yellow');
  const test1 = await testEndpoint(
    'List all supervisors',
    `${API_BASE}/supervisors`
  );
  results.total++;
  if (test1.success) {
    results.passed++;
    log(`  Found ${test1.data.count} supervisors`, 'blue');

    // Store first supervisor ID for later tests
    if (test1.data.data && test1.data.data.length > 0) {
      const firstSupervisor = test1.data.data[0];
      global.testSupervisorId = firstSupervisor.id;
      global.testBadgeNumber = firstSupervisor.badge_number;
      global.testDepot = firstSupervisor.depot;
      global.testRole = firstSupervisor.role;

      log(`  Using test data: ID=${firstSupervisor.id}, Badge=${firstSupervisor.badge_number}`, 'blue');

      // Verify password_hash is NOT in response
      if (firstSupervisor.password_hash) {
        log('  WARNING: password_hash found in response!', 'red');
        results.failed++;
      } else {
        log('  ✓ Security check: password_hash not in response', 'green');
      }
    }
  } else {
    results.failed++;
  }

  console.log('');

  // Test 2: Get supervisors with filters
  log('Test 2: GET /api/supervisors with filters', 'yellow');
  const test2 = await testEndpoint(
    'Filter by active status',
    `${API_BASE}/supervisors?include_inactive=false`
  );
  results.total++;
  if (test2.success) results.passed++;
  else results.failed++;

  console.log('');

  // Test 3: Get single supervisor (if we have an ID)
  if (global.testSupervisorId) {
    log('Test 3: GET /api/supervisors/:id', 'yellow');
    const test3 = await testEndpoint(
      'Get single supervisor',
      `${API_BASE}/supervisors/${global.testSupervisorId}`
    );
    results.total++;
    if (test3.success) {
      results.passed++;

      // Verify password_hash is NOT in response
      if (test3.data.data.password_hash) {
        log('  WARNING: password_hash found in response!', 'red');
      } else {
        log('  ✓ Security check: password_hash not in response', 'green');
      }
    } else {
      results.failed++;
    }

    console.log('');
  }

  // Test 4: Get supervisor stats (if we have an ID)
  if (global.testSupervisorId) {
    log('Test 4: GET /api/supervisors/:id/stats', 'yellow');
    const test4 = await testEndpoint(
      'Get supervisor stats (today)',
      `${API_BASE}/supervisors/${global.testSupervisorId}/stats?period=today`
    );
    results.total++;
    if (test4.success) {
      results.passed++;
      log(`  Total breakdowns: ${test4.data.data.performance.totalBreakdowns}`, 'blue');
      log(`  Resolution rate: ${test4.data.data.performance.resolutionRate}%`, 'blue');
    } else {
      results.failed++;
    }

    console.log('');

    // Test 4b: Stats with different periods
    log('Test 4b: Stats with period=week', 'yellow');
    const test4b = await testEndpoint(
      'Get supervisor stats (week)',
      `${API_BASE}/supervisors/${global.testSupervisorId}/stats?period=week`
    );
    results.total++;
    if (test4b.success) results.passed++;
    else results.failed++;

    console.log('');
  }

  // Test 5: Get by badge number (if we have a badge)
  if (global.testBadgeNumber) {
    log('Test 5: GET /api/supervisors/by-badge/:badge', 'yellow');
    const test5 = await testEndpoint(
      'Lookup by badge number',
      `${API_BASE}/supervisors/by-badge/${global.testBadgeNumber}`
    );
    results.total++;
    if (test5.success) results.passed++;
    else results.failed++;

    console.log('');
  }

  // Test 6: Get by depot (if we have a depot)
  if (global.testDepot) {
    log('Test 6: GET /api/supervisors/depot/:depot', 'yellow');
    const test6 = await testEndpoint(
      'Filter by depot',
      `${API_BASE}/supervisors/depot/${global.testDepot}`
    );
    results.total++;
    if (test6.success) {
      results.passed++;
      log(`  Found ${test6.data.count} supervisors in ${global.testDepot}`, 'blue');
    } else {
      results.failed++;
    }

    console.log('');
  }

  // Test 7: Search supervisors
  log('Test 7: GET /api/supervisors/search', 'yellow');
  const test7 = await testEndpoint(
    'Search supervisors',
    `${API_BASE}/supervisors/search?q=test&limit=10`
  );
  results.total++;
  if (test7.success) {
    results.passed++;
    log(`  Found ${test7.data.count} results`, 'blue');
  } else {
    results.failed++;
  }

  console.log('');

  // Test 8: Get by role (if we have a role)
  if (global.testRole) {
    log('Test 8: GET /api/supervisors/role/:role', 'yellow');
    const test8 = await testEndpoint(
      'Filter by role',
      `${API_BASE}/supervisors/role/${global.testRole}`
    );
    results.total++;
    if (test8.success) {
      results.passed++;
      log(`  Found ${test8.data.count} ${global.testRole}s`, 'blue');
    } else {
      results.failed++;
    }

    console.log('');
  }

  // Test 9: Get pending approvals
  log('Test 9: GET /api/supervisors/pending', 'yellow');
  const test9 = await testEndpoint(
    'Get pending approvals',
    `${API_BASE}/supervisors/pending`
  );
  results.total++;
  if (test9.success) {
    results.passed++;
    log(`  Found ${test9.data.count} pending approvals`, 'blue');
  } else {
    results.failed++;
  }

  console.log('');

  // Test 10: Invalid role (should fail)
  log('Test 10: GET /api/supervisors/role/invalid', 'yellow');
  const test10Response = await fetch(`${API_BASE}/supervisors/role/invalid`);
  const test10Data = await test10Response.json();
  results.total++;
  if (test10Response.status === 400 && !test10Data.success) {
    log('✓ Invalid role correctly rejected', 'green');
    results.passed++;
  } else {
    log('✗ Invalid role should return 400 error', 'red');
    results.failed++;
  }

  console.log('');

  // Test 11: Search too short (should fail)
  log('Test 11: GET /api/supervisors/search?q=a', 'yellow');
  const test11Response = await fetch(`${API_BASE}/supervisors/search?q=a`);
  const test11Data = await test11Response.json();
  results.total++;
  if (test11Response.status === 400 && !test11Data.success) {
    log('✓ Short search query correctly rejected', 'green');
    results.passed++;
  } else {
    log('✗ Short search should return 400 error', 'red');
    results.failed++;
  }

  // Print summary
  console.log('');
  log('=== Test Summary ===', 'blue');
  log(`Total Tests: ${results.total}`, 'blue');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`Success Rate: ${Math.round((results.passed / results.total) * 100)}%`,
      results.failed === 0 ? 'green' : 'yellow');

  // Exit with appropriate code
  if (results.failed > 0) {
    log('\n❌ Some tests failed. Please review the errors above.', 'red');
    process.exit(1);
  } else {
    log('\n✅ All tests passed! Migration successful.', 'green');
    process.exit(0);
  }
}

// Check if server is running before starting tests
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/health`);
    if (response.ok) {
      log(`✓ Server is running at ${BASE_URL}`, 'green');
      return true;
    }
  } catch (error) {
    log(`✗ Cannot connect to server at ${BASE_URL}`, 'red');
    log('  Make sure the backend server is running (npm run dev)', 'yellow');
    return false;
  }
}

// Main execution
(async () => {
  log('Checking server connection...', 'blue');
  const serverRunning = await checkServer();

  if (serverRunning) {
    await runTests();
  } else {
    process.exit(1);
  }
})();
