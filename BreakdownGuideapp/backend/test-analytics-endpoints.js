/**
 * Analytics Endpoints Test Script
 *
 * Tests all migrated analytics endpoints to verify MySQL migration
 * Run this after starting the server to verify functionality
 *
 * Usage: node test-analytics-endpoints.js
 */

const BASE_URL = 'http://localhost:3001';

// Test authentication token (replace with real supervisor token)
const AUTH_TOKEN = 'your-supervisor-auth-token-here';

async function testEndpoint(name, url, options = {}) {
  console.log(`\n🔍 Testing: ${name}`);
  console.log(`   URL: ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        ...options.headers
      }
    });

    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();

      if (response.ok) {
        console.log(`   ✅ Status: ${response.status} OK`);
        console.log(`   📦 Data keys: ${Object.keys(data).join(', ')}`);

        if (data.data) {
          console.log(`   📊 Result keys: ${Object.keys(data.data).join(', ')}`);
        }

        return { success: true, data };
      } else {
        console.log(`   ❌ Status: ${response.status}`);
        console.log(`   ⚠️  Error: ${data.error || 'Unknown error'}`);
        return { success: false, error: data.error };
      }
    } else {
      // Non-JSON response (like CSV)
      const text = await response.text();
      console.log(`   ✅ Status: ${response.status} OK`);
      console.log(`   📄 Content-Type: ${contentType}`);
      console.log(`   📏 Response length: ${text.length} bytes`);
      return { success: true, text };
    }
  } catch (error) {
    console.log(`   ❌ Network Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('='.repeat(80));
  console.log('Analytics Endpoints Test Suite');
  console.log('MySQL Migration Verification');
  console.log('='.repeat(80));

  const tests = [
    // KPIs endpoint - different periods
    {
      name: 'KPIs - Today',
      url: `${BASE_URL}/api/analytics/kpis?period=today`
    },
    {
      name: 'KPIs - Week',
      url: `${BASE_URL}/api/analytics/kpis?period=week`
    },
    {
      name: 'KPIs - Month',
      url: `${BASE_URL}/api/analytics/kpis?period=month`
    },

    // Trends endpoint - different periods
    {
      name: 'Trends - Today (Hourly)',
      url: `${BASE_URL}/api/analytics/trends?period=today`
    },
    {
      name: 'Trends - Week (Daily)',
      url: `${BASE_URL}/api/analytics/trends?period=week`
    },
    {
      name: 'Trends - Month (Weekly)',
      url: `${BASE_URL}/api/analytics/trends?period=month`
    },

    // Depot comparison
    {
      name: 'Depot Comparison - Today',
      url: `${BASE_URL}/api/analytics/depot-comparison?period=today`
    },
    {
      name: 'Depot Comparison - Week',
      url: `${BASE_URL}/api/analytics/depot-comparison?period=week`
    },

    // Fleet health
    {
      name: 'Fleet Health Overview',
      url: `${BASE_URL}/api/analytics/fleet-health`
    },

    // Activity feed
    {
      name: 'Activity Feed - All Depots',
      url: `${BASE_URL}/api/analytics/activity/feed?limit=20&offset=0`
    },
    {
      name: 'Activity Feed - Specific Depot',
      url: `${BASE_URL}/api/analytics/activity/feed?limit=10&depot=CLS`
    },

    // Tracerit reports
    {
      name: 'Tracerit Report - Today (JSON)',
      url: `${BASE_URL}/api/reports/tracerit?period=today&format=standard`
    },
    {
      name: 'Tracerit Report - Week (JSON)',
      url: `${BASE_URL}/api/reports/tracerit?period=week&format=standard`
    },
    {
      name: 'Tracerit Report - Today (CSV)',
      url: `${BASE_URL}/api/reports/tracerit?period=today&format=csv`
    },
    {
      name: 'Tracerit Report - Specific Depot',
      url: `${BASE_URL}/api/reports/tracerit?period=today&depot=CLS`
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await testEndpoint(test.name, test.url);
    if (result.success) {
      passed++;
    } else {
      failed++;
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n' + '='.repeat(80));
  console.log('Test Results Summary');
  console.log('='.repeat(80));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total:  ${tests.length}`);
  console.log(`📈 Success Rate: ${Math.round((passed / tests.length) * 100)}%`);
  console.log('='.repeat(80));

  if (failed === 0) {
    console.log('\n🎉 All analytics endpoints are working correctly!');
    console.log('✅ MySQL migration is successful.');
  } else {
    console.log('\n⚠️  Some endpoints failed. Please check the errors above.');
    console.log('💡 Make sure:');
    console.log('   1. Server is running (npm run dev:backend)');
    console.log('   2. MySQL database is accessible');
    console.log('   3. Auth token is valid (update AUTH_TOKEN constant)');
    console.log('   4. Required tables exist (breakdowns, depots, fleet_vehicles)');
  }
}

// Check if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Starting analytics endpoint tests...\n');

  // Check for auth token
  if (AUTH_TOKEN === 'your-supervisor-auth-token-here') {
    console.log('⚠️  WARNING: Using placeholder auth token');
    console.log('💡 Update AUTH_TOKEN in this file with a real supervisor token');
    console.log('   Or test without auth if authentication is disabled\n');
  }

  runTests().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

export { testEndpoint, runTests };
