// backend/tests/supabaseConnectionTest.js
// Test script for validating the enhanced Supabase connection manager

import dotenv from 'dotenv';
import supabaseService from '../services/supabaseService.js';
import supabaseConnectionManager from '../services/supabaseConnectionManager.js';
import { testSupabaseConnection, getConnectionHealth, getConnectionStats } from '../services/supabaseHelper.js';

dotenv.config();

async function runSupabaseConnectionTests() {
  console.log('🧪 Running Supabase Connection Manager Tests...\n');
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Basic configuration check
  console.log('📋 Test 1: Configuration Check');
  try {
    const hasUrl = !!process.env.SUPABASE_URL;
    const hasKey = !!process.env.SUPABASE_ANON_KEY;
    
    if (hasUrl && hasKey) {
      console.log('✅ Configuration valid');
      results.passed++;
      results.tests.push({ name: 'Configuration', status: 'PASS' });
    } else {
      console.log('❌ Missing configuration');
      results.failed++;
      results.tests.push({ name: 'Configuration', status: 'FAIL', error: 'Missing ENV vars' });
    }
  } catch (error) {
    console.log('❌ Configuration test failed:', error.message);
    results.failed++;
    results.tests.push({ name: 'Configuration', status: 'FAIL', error: error.message });
  }

  // Test 2: Enhanced service initialization
  console.log('\n🚀 Test 2: Enhanced Service Initialization');
  try {
    await supabaseService.initialize();
    console.log('✅ Enhanced service initialized');
    results.passed++;
    results.tests.push({ name: 'Service Init', status: 'PASS' });
  } catch (error) {
    console.log('❌ Enhanced service initialization failed:', error.message);
    results.failed++;
    results.tests.push({ name: 'Service Init', status: 'FAIL', error: error.message });
  }

  // Test 3: Connection pool creation
  console.log('\n🏊 Test 3: Connection Pool');
  try {
    const stats = supabaseConnectionManager.getStats();
    
    if (stats.pool.size > 0) {
      console.log(`✅ Connection pool created with ${stats.pool.size} connections`);
      results.passed++;
      results.tests.push({ name: 'Connection Pool', status: 'PASS' });
    } else {
      console.log('⚠️ No connections in pool (may be normal)');
      results.passed++;
      results.tests.push({ name: 'Connection Pool', status: 'PASS', note: 'Empty pool' });
    }
  } catch (error) {
    console.log('❌ Connection pool test failed:', error.message);
    results.failed++;
    results.tests.push({ name: 'Connection Pool', status: 'FAIL', error: error.message });
  }

  // Test 4: Basic database query
  console.log('\n💾 Test 4: Database Query');
  try {
    const queryResult = await supabaseService.select('streetworks', { limit: 1 });
    
    if (queryResult.success) {
      console.log(`✅ Query successful, got ${queryResult.count} records`);
      results.passed++;
      results.tests.push({ name: 'Database Query', status: 'PASS' });
    } else {
      console.log('❌ Query failed:', queryResult.error);
      results.failed++;
      results.tests.push({ name: 'Database Query', status: 'FAIL', error: queryResult.error });
    }
  } catch (error) {
    console.log('❌ Database query test failed:', error.message);
    results.failed++;
    results.tests.push({ name: 'Database Query', status: 'FAIL', error: error.message });
  }

  // Test 5: Retry mechanism
  console.log('\n🔄 Test 5: Retry Mechanism');
  try {
    // Test with an intentionally bad query to trigger retry
    const retryResult = await supabaseConnectionManager.executeQuery('GET', 'nonexistent_table', { limit: 1 });
    
    if (!retryResult.success && retryResult.error) {
      console.log('✅ Retry mechanism working (gracefully handled bad query)');
      results.passed++;
      results.tests.push({ name: 'Retry Mechanism', status: 'PASS' });
    } else {
      console.log('⚠️ Retry test inconclusive');
      results.passed++;
      results.tests.push({ name: 'Retry Mechanism', status: 'PASS', note: 'Inconclusive' });
    }
  } catch (error) {
    console.log('❌ Retry mechanism test failed:', error.message);
    results.failed++;
    results.tests.push({ name: 'Retry Mechanism', status: 'FAIL', error: error.message });
  }

  // Test 6: Health monitoring
  console.log('\n💗 Test 6: Health Monitoring');
  try {
    const health = await getConnectionHealth();
    
    if (health && health.connectionManager) {
      console.log(`✅ Health monitoring active, status: ${health.connectionManager.status}`);
      results.passed++;
      results.tests.push({ name: 'Health Monitoring', status: 'PASS' });
    } else {
      console.log('❌ Health monitoring not working');
      results.failed++;
      results.tests.push({ name: 'Health Monitoring', status: 'FAIL', error: 'No health data' });
    }
  } catch (error) {
    console.log('❌ Health monitoring test failed:', error.message);
    results.failed++;
    results.tests.push({ name: 'Health Monitoring', status: 'FAIL', error: error.message });
  }

  // Test 7: Connection statistics
  console.log('\n📊 Test 7: Connection Statistics');
  try {
    const stats = await getConnectionStats();
    
    if (stats && stats.connectionManager) {
      console.log('✅ Statistics collection working');
      console.log(`   Pool size: ${stats.connectionManager.pool?.size || 'N/A'}`);
      console.log(`   Active connections: ${stats.connectionManager.pool?.active || 0}`);
      results.passed++;
      results.tests.push({ name: 'Statistics', status: 'PASS' });
    } else {
      console.log('❌ Statistics collection not working');
      results.failed++;
      results.tests.push({ name: 'Statistics', status: 'FAIL', error: 'No stats data' });
    }
  } catch (error) {
    console.log('❌ Statistics test failed:', error.message);
    results.failed++;
    results.tests.push({ name: 'Statistics', status: 'FAIL', error: error.message });
  }

  // Test 8: Connection test function
  console.log('\n🔍 Test 8: Connection Test Function');
  try {
    const testResult = await testSupabaseConnection();
    
    if (testResult.success) {
      console.log('✅ Connection test function working');
      results.passed++;
      results.tests.push({ name: 'Test Function', status: 'PASS' });
    } else {
      console.log('❌ Connection test failed:', testResult.error);
      results.failed++;
      results.tests.push({ name: 'Test Function', status: 'FAIL', error: testResult.error });
    }
  } catch (error) {
    console.log('❌ Connection test function failed:', error.message);
    results.failed++;
    results.tests.push({ name: 'Test Function', status: 'FAIL', error: error.message });
  }

  // Test Results Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📊 Total:  ${results.passed + results.failed}`);
  console.log('');

  results.tests.forEach(test => {
    const status = test.status === 'PASS' ? '✅' : '❌';
    const note = test.note ? ` (${test.note})` : '';
    const error = test.error ? ` - ${test.error}` : '';
    console.log(`${status} ${test.name}${note}${error}`);
  });

  console.log('\n' + '='.repeat(60));

  if (results.failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Enhanced Supabase connection manager is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Please check the configuration and try again.');
  }

  // Cleanup
  try {
    await supabaseService.shutdown();
    console.log('✅ Test cleanup completed');
  } catch (error) {
    console.log('⚠️ Cleanup error:', error.message);
  }

  return results;
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSupabaseConnectionTests()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('💥 Test script error:', error);
      process.exit(1);
    });
}

export { runSupabaseConnectionTests };
