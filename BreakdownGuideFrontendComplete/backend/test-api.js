/*
 * API Test Script
 * Tests all major endpoints
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3003';
let testToken = null;
let testBreakdownId = null;

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(name, method, path, body = null) {
  try {
    log(`\n🧪 Testing: ${name}`, 'cyan');
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    if (testToken) {
      options.headers['Authorization'] = `Bearer ${testToken}`;
    }
    
    const response = await fetch(`${BASE_URL}${path}`, options);
    const data = await response.json();
    
    if (response.ok && data.success !== false) {
      log(`✅ ${name}: SUCCESS`, 'green');
      return data;
    } else {
      log(`❌ ${name}: FAILED - ${data.error || 'Unknown error'}`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ ${name}: ERROR - ${error.message}`, 'red');
    return null;
  }
}

async function runTests() {
  log('\n🚀 Starting Breakdown Guide Backend Tests', 'yellow');
  log('=' .repeat(50), 'yellow');
  
  // Test health check
  await testEndpoint('Health Check', 'GET', '/api/health');
  await testEndpoint('Detailed Health', 'GET', '/api/health/detailed');
  
  // Test supervisor login
  const loginResult = await testEndpoint('Supervisor Login', 'POST', '/api/supervisor/login', {
    badge: 'AG003',
    password: 'test123'
  });
  
  if (loginResult && loginResult.session) {
    testToken = loginResult.session.token;
    log(`🔑 Token obtained: ${testToken.substring(0, 20)}...`, 'cyan');
  }
  
  // Test breakdown creation
  const breakdownResult = await testEndpoint('Start Breakdown', 'POST', '/api/breakdowns/start', {
    fleet_number: '6301',
    supervisor_badge: 'AG003',
    supervisor_name: 'Anthony Gair',
    location: 'Newcastle Central Station',
    location_coords: { lat: 54.9684, lng: -1.6176 },
    depot_id: 'Percy Main',
    wizard_type: 'engine_fault'
  });
  
  if (breakdownResult) {
    testBreakdownId = breakdownResult.breakdown_id;
    log(`📋 Breakdown ID: ${testBreakdownId}`, 'cyan');
  }
  
  // Test location update
  if (testBreakdownId) {
    await testEndpoint('Update Location', 'PUT', `/api/breakdowns/location/${testBreakdownId}`, {
      location: 'Gateshead Interchange',
      location_coords: { lat: 54.9613, lng: -1.6027 },
      location_verified: true,
      updated_by: 'AG003'
    });
    
    // Test wizard step
    await testEndpoint('Log Wizard Step', 'POST', '/api/breakdowns/step', {
      breakdown_id: testBreakdownId,
      step_type: 'question_answered',
      step_data: { question: 'Engine running?', answer: 'No' }
    });
    
    // Test diagnosis
    await testEndpoint('Diagnose Breakdown', 'POST', '/api/breakdowns/diagnose', {
      breakdown_id: testBreakdownId,
      diagnosis: 'Engine failure',
      severity: 'STOP'
    });
  }
  
  // Test get live breakdowns
  await testEndpoint('Get Live Breakdowns', 'GET', '/api/breakdowns/live');
  
  // Test analytics
  await testEndpoint('Depot KPIs', 'GET', '/api/breakdown-analytics/depot-kpis?depot=Percy Main');
  await testEndpoint('Breakdown Patterns', 'GET', '/api/breakdown-analytics/patterns');
  await testEndpoint('Fleet Health', 'GET', '/api/breakdown-analytics/fleet-health');
  
  // Test fleet database
  await testEndpoint('Search Fleet', 'GET', '/api/fleet-database/search?q=6301');
  await testEndpoint('Get Vehicle', 'GET', '/api/fleet-database/vehicle/6301');
  
  // Test admin endpoints
  await testEndpoint('Admin Breakdowns', 'GET', '/api/admin-breakdowns?limit=10');
  await testEndpoint('Breakdown Stats', 'GET', '/api/admin-breakdowns/stats');
  
  // Test hotspots
  await testEndpoint('Breakdown Hotspots', 'GET', '/api/breakdowns/hotspots?days=7');
  
  // Clean up - resolve breakdown
  if (testBreakdownId) {
    await testEndpoint('Resolve Breakdown', 'PUT', `/api/breakdowns/${testBreakdownId}/resolve`, {
      resolution_notes: 'Test completed',
      resolving_supervisor: 'AG003',
      returned_to_service: true
    });
  }
  
  // Test logout
  await testEndpoint('Logout', 'POST', '/api/supervisor/logout', {
    token: testToken
  });
  
  log('\n' + '=' .repeat(50), 'yellow');
  log('✨ Tests Complete!', 'yellow');
  log('\nNote: This is using mock data. Connect to Supabase for production.', 'cyan');
}

// Run tests
runTests().catch(error => {
  log(`\n💥 Fatal Error: ${error.message}`, 'red');
  process.exit(1);
});
