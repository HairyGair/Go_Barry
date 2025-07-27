#!/usr/bin/env node
// backend/scripts/testSupervisorLogging.js
// Test script to validate comprehensive supervisor logging implementation

import { createClient } from '@supabase/supabase-js';
import {
  enhancedLogActivity,
  logSupervisorLogin,
  logSupervisorLogout,
  logAlertDismissal,
  logRoadworkAction,
  getSupervisorActivityStats
} from '../services/enhancedSupervisorLogging.js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Comprehensive Test Suite for Supervisor Logging
 * 
 * Tests all aspects of the enhanced supervisor logging system:
 * 1. Database connectivity
 * 2. Individual logging functions
 * 3. Batch processing
 * 4. Analytics functions
 * 5. Performance metrics
 */

const TEST_SUPERVISOR = {
  id: 'supervisor001',
  name: 'Alex Woodcock',
  badge: 'AW001',
  role: 'Supervisor'
};

const TEST_REQUEST = {
  method: 'POST',
  path: '/api/test',
  ip: '127.0.0.1',
  headers: {
    'user-agent': 'Go-BARRY-Test/1.0',
    'content-type': 'application/json'
  },
  body: { sessionId: 'test_session_123' },
  query: {}
};

class SupervisorLoggingTester {
  constructor() {
    this.testResults = [];
    this.startTime = Date.now();
  }

  // Test result tracking
  addTestResult(testName, success, details = {}) {
    this.testResults.push({
      testName,
      success,
      details,
      timestamp: new Date().toISOString()
    });
    
    const status = success ? '✅' : '❌';
    console.log(`${status} ${testName}: ${details.message || (success ? 'PASSED' : 'FAILED')}`);
  }

  // Test database connectivity
  async testDatabaseConnectivity() {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('id')
        .limit(1);

      if (error) throw error;

      this.addTestResult('Database Connectivity', true, {
        message: 'Successfully connected to Supabase activity_logs table'
      });
      return true;
    } catch (error) {
      this.addTestResult('Database Connectivity', false, {
        message: `Database connection failed: ${error.message}`,
        error: error.code
      });
      return false;
    }
  }

  // Test basic activity logging
  async testBasicActivityLogging() {
    try {
      const result = await enhancedLogActivity(
        'test_action',
        {
          testType: 'basic_logging',
          timestamp: new Date().toISOString()
        },
        TEST_SUPERVISOR,
        TEST_REQUEST,
        { immediate: true }
      );

      if (result.success) {
        this.addTestResult('Basic Activity Logging', true, {
          message: 'Successfully logged test activity'
        });
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.addTestResult('Basic Activity Logging', false, {
        message: `Basic logging failed: ${error.message}`
      });
      return false;
    }
  }

  // Test supervisor login logging
  async testSupervisorLoginLogging() {
    try {
      const result = await logSupervisorLogin(
        TEST_SUPERVISOR,
        TEST_REQUEST,
        'test_login'
      );

      if (result.success) {
        this.addTestResult('Supervisor Login Logging', true, {
          message: 'Successfully logged supervisor login'
        });
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.addTestResult('Supervisor Login Logging', false, {
        message: `Login logging failed: ${error.message}`
      });
      return false;
    }
  }

  // Test supervisor logout logging
  async testSupervisorLogoutLogging() {
    try {
      const result = await logSupervisorLogout(
        TEST_SUPERVISOR,
        TEST_REQUEST,
        'test_logout'
      );

      if (result.success) {
        this.addTestResult('Supervisor Logout Logging', true, {
          message: 'Successfully logged supervisor logout'
        });
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.addTestResult('Supervisor Logout Logging', false, {
        message: `Logout logging failed: ${error.message}`
      });
      return false;
    }
  }

  // Test alert dismissal logging
  async testAlertDismissalLogging() {
    try {
      const result = await logAlertDismissal(
        TEST_SUPERVISOR,
        {
          alertId: 'test_alert_123',
          type: 'roadwork',
          reason: 'Test dismissal',
          notes: 'Testing alert dismissal logging',
          location: 'Test Location',
          severity: 'medium'
        },
        TEST_REQUEST
      );

      if (result.success) {
        this.addTestResult('Alert Dismissal Logging', true, {
          message: 'Successfully logged alert dismissal'
        });
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.addTestResult('Alert Dismissal Logging', false, {
        message: `Alert dismissal logging failed: ${error.message}`
      });
      return false;
    }
  }

  // Test roadwork action logging
  async testRoadworkActionLogging() {
    try {
      const result = await logRoadworkAction(
        TEST_SUPERVISOR,
        'roadwork_acknowledged',
        {
          roadworkId: 'test_roadwork_456',
          reason: 'Test acknowledgment',
          location: 'Test Road',
          source: 'test'
        },
        TEST_REQUEST
      );

      if (result.success) {
        this.addTestResult('Roadwork Action Logging', true, {
          message: 'Successfully logged roadwork action'
        });
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.addTestResult('Roadwork Action Logging', false, {
        message: `Roadwork action logging failed: ${error.message}`
      });
      return false;
    }
  }

  // Test batch processing
  async testBatchProcessing() {
    try {
      // Add multiple activities to batch
      const batchPromises = [];
      
      for (let i = 0; i < 5; i++) {
        batchPromises.push(
          enhancedLogActivity(
            'test_batch_action',
            {
              batchItem: i + 1,
              testType: 'batch_processing'
            },
            TEST_SUPERVISOR,
            TEST_REQUEST,
            { immediate: false } // Use batch processing
          )
        );
      }

      const results = await Promise.all(batchPromises);
      const allSuccessful = results.every(r => r.success);

      if (allSuccessful) {
        this.addTestResult('Batch Processing', true, {
          message: `Successfully queued ${results.length} activities for batch processing`
        });
        
        // Wait for batch processing
        await new Promise(resolve => setTimeout(resolve, 4000));
        
        return true;
      } else {
        throw new Error('Some batch items failed');
      }
    } catch (error) {
      this.addTestResult('Batch Processing', false, {
        message: `Batch processing failed: ${error.message}`
      });
      return false;
    }
  }

  // Test analytics functions
  async testAnalyticsFunctions() {
    try {
      const stats = await getSupervisorActivityStats(TEST_SUPERVISOR.id, '1h');

      if (stats && typeof stats === 'object') {
        this.addTestResult('Analytics Functions', true, {
          message: `Successfully retrieved activity stats: ${stats.totalActivities} activities`,
          stats: {
            totalActivities: stats.totalActivities,
            categories: Object.keys(stats.categoryBreakdown).length,
            priorities: Object.keys(stats.priorityBreakdown).length
          }
        });
        return true;
      } else {
        throw new Error('Invalid stats response');
      }
    } catch (error) {
      this.addTestResult('Analytics Functions', false, {
        message: `Analytics functions failed: ${error.message}`
      });
      return false;
    }
  }

  // Test data retrieval
  async testDataRetrieval() {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('supervisor_id', TEST_SUPERVISOR.id)
        .gte('created_at', new Date(Date.now() - 3600000).toISOString()) // Last hour
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      this.addTestResult('Data Retrieval', true, {
        message: `Successfully retrieved ${data.length} test activities from database`,
        recentActivities: data.slice(0, 3).map(a => ({
          action: a.action,
          created_at: a.created_at
        }))
      });
      return true;
    } catch (error) {
      this.addTestResult('Data Retrieval', false, {
        message: `Data retrieval failed: ${error.message}`
      });
      return false;
    }
  }

  // Test performance under load
  async testPerformanceLoad() {
    try {
      const startTime = Date.now();
      const promises = [];

      // Create 20 concurrent logging operations
      for (let i = 0; i < 20; i++) {
        promises.push(
          enhancedLogActivity(
            'performance_test',
            {
              loadTestItem: i + 1,
              testType: 'performance_load'
            },
            TEST_SUPERVISOR,
            TEST_REQUEST,
            { immediate: false }
          )
        );
      }

      await Promise.all(promises);
      const duration = Date.now() - startTime;

      this.addTestResult('Performance Load Test', true, {
        message: `Successfully handled 20 concurrent operations in ${duration}ms`,
        performance: {
          duration,
          operationsPerSecond: Math.round(20 / (duration / 1000)),
          averageTimePerOperation: Math.round(duration / 20)
        }
      });
      return true;
    } catch (error) {
      this.addTestResult('Performance Load Test', false, {
        message: `Performance test failed: ${error.message}`
      });
      return false;
    }
  }

  // Test error handling
  async testErrorHandling() {
    try {
      // Test with invalid supervisor info
      const result = await enhancedLogActivity(
        'error_test',
        { testType: 'error_handling' },
        null, // Invalid supervisor info
        TEST_REQUEST,
        { immediate: true }
      );

      // Should still succeed even with null supervisor
      if (result.success) {
        this.addTestResult('Error Handling', true, {
          message: 'Successfully handled null supervisor gracefully'
        });
        return true;
      } else {
        throw new Error('Failed to handle null supervisor');
      }
    } catch (error) {
      this.addTestResult('Error Handling', false, {
        message: `Error handling test failed: ${error.message}`
      });
      return false;
    }
  }

  // Clean up test data
  async cleanupTestData() {
    try {
      const { error } = await supabase
        .from('activity_logs')
        .delete()
        .eq('supervisor_id', TEST_SUPERVISOR.id)
        .like('action', '%test%');

      if (error) throw error;

      this.addTestResult('Test Data Cleanup', true, {
        message: 'Successfully cleaned up test data'
      });
      return true;
    } catch (error) {
      this.addTestResult('Test Data Cleanup', false, {
        message: `Cleanup failed: ${error.message}`
      });
      return false;
    }
  }

  // Generate test report
  generateReport() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const duration = Date.now() - this.startTime;

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUPERVISOR LOGGING TEST REPORT');
    console.log('='.repeat(60));
    console.log(`📅 Test Date: ${new Date().toISOString()}`);
    console.log(`⏱️  Test Duration: ${duration}ms`);
    console.log(`📋 Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    console.log('');

    if (failedTests > 0) {
      console.log('❌ FAILED TESTS:');
      this.testResults
        .filter(r => !r.success)
        .forEach(test => {
          console.log(`   • ${test.testName}: ${test.details.message}`);
        });
      console.log('');
    }

    console.log('✅ PASSED TESTS:');
    this.testResults
      .filter(r => r.success)
      .forEach(test => {
        console.log(`   • ${test.testName}: ${test.details.message}`);
      });

    console.log('\n' + '='.repeat(60));
    
    if (passedTests === totalTests) {
      console.log('🎉 ALL TESTS PASSED! Supervisor logging is working correctly.');
      console.log('\n📋 Next Steps:');
      console.log('1. Deploy to production environment');
      console.log('2. Monitor logging in Supabase dashboard');
      console.log('3. Set up analytics dashboards');
      console.log('4. Configure alerting for critical actions');
    } else {
      console.log('⚠️  SOME TESTS FAILED! Please review and fix issues before deployment.');
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Check Supabase connection and permissions');
      console.log('2. Verify activity_logs table exists and is accessible');
      console.log('3. Review error messages above');
      console.log('4. Check environment variables are set correctly');
    }
    
    return { totalTests, passedTests, failedTests, successRate: (passedTests / totalTests) * 100 };
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting Comprehensive Supervisor Logging Tests...\n');

    const tests = [
      { name: 'Database Connectivity', fn: () => this.testDatabaseConnectivity() },
      { name: 'Basic Activity Logging', fn: () => this.testBasicActivityLogging() },
      { name: 'Supervisor Login Logging', fn: () => this.testSupervisorLoginLogging() },
      { name: 'Supervisor Logout Logging', fn: () => this.testSupervisorLogoutLogging() },
      { name: 'Alert Dismissal Logging', fn: () => this.testAlertDismissalLogging() },
      { name: 'Roadwork Action Logging', fn: () => this.testRoadworkActionLogging() },
      { name: 'Batch Processing', fn: () => this.testBatchProcessing() },
      { name: 'Analytics Functions', fn: () => this.testAnalyticsFunctions() },
      { name: 'Data Retrieval', fn: () => this.testDataRetrieval() },
      { name: 'Performance Load Test', fn: () => this.testPerformanceLoad() },
      { name: 'Error Handling', fn: () => this.testErrorHandling() }
    ];

    for (const test of tests) {
      try {
        await test.fn();
      } catch (error) {
        this.addTestResult(test.name, false, {
          message: `Test execution failed: ${error.message}`
        });
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Cleanup test data
    await this.cleanupTestData();

    return this.generateReport();
  }
}

// Main execution
async function main() {
  const tester = new SupervisorLoggingTester();
  
  try {
    const report = await tester.runAllTests();
    
    // Exit with appropriate code
    process.exit(report.failedTests > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Test suite execution failed:', error);
    process.exit(1);
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { SupervisorLoggingTester, main as testSupervisorLogging };