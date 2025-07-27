#!/usr/bin/env node
// backend/scripts/testSupervisorLoggingDeployment.js
// Test script to verify supervisor logging deployment

import axios from 'axios';

/**
 * Supervisor Logging Deployment Test
 * 
 * Comprehensive test script to verify the supervisor logging system
 * is properly deployed and functioning in production.
 */

class SupervisorLoggingDeploymentTest {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.testResults = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
  }

  /**
   * Add test result
   */
  addTestResult(name, passed, message, data = null, warning = false) {
    const result = {
      name,
      passed,
      message,
      data,
      warning,
      timestamp: new Date().toISOString()
    };

    this.testResults.tests.push(result);
    
    if (warning) {
      this.testResults.warnings++;
      console.log(`⚠️  ${name}: ${message}`);
    } else if (passed) {
      this.testResults.passed++;
      console.log(`✅ ${name}: ${message}`);
    } else {
      this.testResults.failed++;
      console.log(`❌ ${name}: ${message}`);
    }

    if (data && process.env.VERBOSE_TESTS === 'true') {
      console.log(`   Data: ${JSON.stringify(data, null, 2)}`);
    }
  }

  /**
   * Test basic health endpoint
   */
  async testBasicHealth() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/health`, {
        timeout: 10000
      });

      if (response.status === 200 && response.data.success) {
        this.addTestResult(
          'Basic Health Check',
          true,
          `Server operational (uptime: ${response.data.uptime}s)`,
          { status: response.data.status, memory: response.data.memory }
        );

        // Check if supervisor logging status is included
        if (response.data.supervisorLogging) {
          const loggingStatus = response.data.supervisorLogging;
          if (loggingStatus.enabled && loggingStatus.healthy) {
            this.addTestResult(
              'Basic Logging Status',
              true,
              `Logging enabled and healthy (status: ${loggingStatus.status})`
            );
          } else {
            this.addTestResult(
              'Basic Logging Status',
              false,
              `Logging issues detected: enabled=${loggingStatus.enabled}, healthy=${loggingStatus.healthy}`
            );
          }
        } else {
          this.addTestResult(
            'Basic Logging Status',
            false,
            'Supervisor logging status not included in health response',
            null,
            true
          );
        }
      } else {
        this.addTestResult(
          'Basic Health Check',
          false,
          `Health check failed: ${response.status} - ${response.data?.error || 'Unknown error'}`
        );
      }
    } catch (error) {
      this.addTestResult(
        'Basic Health Check',
        false,
        `Health endpoint error: ${error.message}`
      );
    }
  }

  /**
   * Test supervisor logging health endpoint
   */
  async testSupervisorLoggingHealth() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/supervisor-logging/health`, {
        timeout: 15000
      });

      if (response.status === 200) {
        const health = response.data;
        
        this.addTestResult(
          'Logging Health Endpoint',
          true,
          `Health check completed in ${health.checkDuration}ms`
        );

        // Test logging initialization
        if (health.logging && health.logging.initialized) {
          this.addTestResult(
            'Logging Initialization',
            true,
            `System initialized with status: ${health.logging.activationStatus}`
          );
        } else {
          this.addTestResult(
            'Logging Initialization',
            false,
            'Logging system not initialized'
          );
        }

        // Test functionality
        if (health.functionalityTest) {
          if (health.functionalityTest.status === 'operational') {
            this.addTestResult(
              'Logging Functionality',
              true,
              `Functionality test passed in ${health.functionalityTest.testDuration}ms`
            );
          } else {
            this.addTestResult(
              'Logging Functionality',
              false,
              `Functionality test failed: ${health.functionalityTest.error || 'Unknown error'}`
            );
          }
        }

        // Test memory usage
        if (health.system && health.system.memory) {
          const memoryUsage = health.system.memory.heapUsed;
          const maxMemory = 100; // 100MB threshold
          
          if (memoryUsage <= maxMemory) {
            this.addTestResult(
              'Memory Usage',
              true,
              `Memory usage within limits: ${memoryUsage}MB / ${maxMemory}MB`
            );
          } else {
            this.addTestResult(
              'Memory Usage',
              false,
              `Memory usage exceeds limits: ${memoryUsage}MB / ${maxMemory}MB`
            );
          }
        }

        // Test overall health status
        if (health.status === 'healthy') {
          this.addTestResult(
            'Overall Health Status',
            true,
            'System reports healthy status'
          );
        } else {
          const reasons = health.statusReasons?.join(', ') || 'Unknown reasons';
          this.addTestResult(
            'Overall Health Status',
            health.status !== 'error',
            `System status: ${health.status} (${reasons})`,
            null,
            health.status === 'warning'
          );
        }

      } else {
        this.addTestResult(
          'Logging Health Endpoint',
          false,
          `Unexpected status code: ${response.status}`
        );
      }
    } catch (error) {
      if (error.response?.status === 503) {
        this.addTestResult(
          'Logging Health Endpoint',
          false,
          'Service unavailable - logging system may have issues'
        );
      } else {
        this.addTestResult(
          'Logging Health Endpoint',
          false,
          `Health endpoint error: ${error.message}`
        );
      }
    }
  }

  /**
   * Test supervisor logging status endpoint
   */
  async testSupervisorLoggingStatus() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/supervisor-logging/status`, {
        timeout: 5000
      });

      if (response.status === 200) {
        const status = response.data;
        
        this.addTestResult(
          'Status Endpoint',
          true,
          'Status endpoint accessible'
        );

        // Quick status checks
        const checks = [
          { key: 'initialized', expected: true, name: 'Initialized' },
          { key: 'healthy', expected: true, name: 'Healthy' }
        ];

        checks.forEach(check => {
          if (status[check.key] === check.expected) {
            this.addTestResult(
              `Status: ${check.name}`,
              true,
              `${check.name} status correct: ${status[check.key]}`
            );
          } else {
            this.addTestResult(
              `Status: ${check.name}`,
              false,
              `${check.name} status incorrect: expected ${check.expected}, got ${status[check.key]}`
            );
          }
        });

        // Memory usage check
        if (typeof status.memoryUsage === 'number') {
          this.addTestResult(
            'Status: Memory Reporting',
            true,
            `Memory usage reported: ${status.memoryUsage}MB`
          );
        } else {
          this.addTestResult(
            'Status: Memory Reporting',
            false,
            'Memory usage not reported in status'
          );
        }

      } else {
        this.addTestResult(
          'Status Endpoint',
          false,
          `Status endpoint returned ${response.status}`
        );
      }
    } catch (error) {
      this.addTestResult(
        'Status Endpoint',
        false,
        `Status endpoint error: ${error.message}`
      );
    }
  }

  /**
   * Test supervisor logging metrics endpoint
   */
  async testSupervisorLoggingMetrics() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/supervisor-logging/metrics`, {
        timeout: 10000
      });

      if (response.status === 200) {
        const metrics = response.data;
        
        this.addTestResult(
          'Metrics Endpoint',
          true,
          'Metrics endpoint accessible'
        );

        // Check for key metrics sections
        const requiredSections = ['system', 'logging', 'performance'];
        requiredSections.forEach(section => {
          if (metrics[section]) {
            this.addTestResult(
              `Metrics: ${section}`,
              true,
              `${section} metrics available`
            );
          } else {
            this.addTestResult(
              `Metrics: ${section}`,
              false,
              `${section} metrics missing`
            );
          }
        });

        // Check performance metrics
        if (metrics.performance) {
          const perf = metrics.performance;
          
          if (typeof perf.memoryEfficiency === 'number') {
            this.addTestResult(
              'Performance: Memory Efficiency',
              perf.memoryEfficiency < 90,
              `Memory efficiency: ${perf.memoryEfficiency}%`,
              null,
              perf.memoryEfficiency >= 80
            );
          }

          if (typeof perf.memoryPressure === 'number') {
            this.addTestResult(
              'Performance: Memory Pressure',
              perf.memoryPressure < 90,
              `Memory pressure: ${perf.memoryPressure}%`,
              null,
              perf.memoryPressure >= 70
            );
          }
        }

      } else {
        this.addTestResult(
          'Metrics Endpoint',
          false,
          `Metrics endpoint returned ${response.status}`
        );
      }
    } catch (error) {
      this.addTestResult(
        'Metrics Endpoint',
        false,
        `Metrics endpoint error: ${error.message}`
      );
    }
  }

  /**
   * Test recent activities endpoint
   */
  async testRecentActivities() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/supervisor-logging/activities/recent?limit=5`, {
        timeout: 10000
      });

      if (response.status === 200) {
        const data = response.data;
        
        this.addTestResult(
          'Activities Endpoint',
          true,
          'Recent activities endpoint accessible'
        );

        if (data.success) {
          this.addTestResult(
            'Activities: API Response',
            true,
            `Activities query successful (count: ${data.count})`
          );

          if (data.activities && Array.isArray(data.activities)) {
            this.addTestResult(
              'Activities: Data Format',
              true,
              'Activities data properly formatted'
            );

            // If there are activities, check their structure
            if (data.activities.length > 0) {
              const activity = data.activities[0];
              const hasRequiredFields = activity.action && activity.created_at && activity.supervisor_id;
              
              this.addTestResult(
                'Activities: Data Structure',
                hasRequiredFields,
                hasRequiredFields ? 'Activity records have required fields' : 'Activity records missing required fields'
              );
            } else {
              this.addTestResult(
                'Activities: Data Availability',
                true,
                'No recent activities (this may be normal if no supervisor actions occurred recently)',
                null,
                true
              );
            }
          } else {
            this.addTestResult(
              'Activities: Data Format',
              false,
              'Activities data not properly formatted'
            );
          }
        } else {
          this.addTestResult(
            'Activities: API Response',
            false,
            `Activities query failed: ${data.error || 'Unknown error'}`
          );
        }

      } else {
        this.addTestResult(
          'Activities Endpoint',
          false,
          `Activities endpoint returned ${response.status}`
        );
      }
    } catch (error) {
      this.addTestResult(
        'Activities Endpoint',
        false,
        `Activities endpoint error: ${error.message}`
      );
    }
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Starting Supervisor Logging Deployment Tests...');
    console.log(`🌐 Target URL: ${this.baseUrl}`);
    console.log('');

    const tests = [
      { name: 'Basic Health Check', method: this.testBasicHealth },
      { name: 'Supervisor Logging Health', method: this.testSupervisorLoggingHealth },
      { name: 'Supervisor Logging Status', method: this.testSupervisorLoggingStatus },
      { name: 'Supervisor Logging Metrics', method: this.testSupervisorLoggingMetrics },
      { name: 'Recent Activities', method: this.testRecentActivities }
    ];

    for (const test of tests) {
      console.log(`\n🔄 Running: ${test.name}`);
      try {
        await test.method.call(this);
      } catch (error) {
        this.addTestResult(
          test.name,
          false,
          `Test execution failed: ${error.message}`
        );
      }
    }

    this.printSummary();
  }

  /**
   * Print test summary
   */
  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`⚠️  Warnings: ${this.testResults.warnings}`);
    console.log(`📋 Total Tests: ${this.testResults.tests.length}`);

    const successRate = Math.round((this.testResults.passed / this.testResults.tests.length) * 100);
    console.log(`📈 Success Rate: ${successRate}%`);

    if (this.testResults.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED!');
      if (this.testResults.warnings > 0) {
        console.log('⚠️  Some warnings detected - review above for details');
      }
    } else {
      console.log('\n🚨 SOME TESTS FAILED');
      console.log('❌ Failed tests:');
      this.testResults.tests
        .filter(test => !test.passed && !test.warning)
        .forEach(test => console.log(`   - ${test.name}: ${test.message}`));
    }

    if (this.testResults.warnings > 0) {
      console.log('\n⚠️  Warnings:');
      this.testResults.tests
        .filter(test => test.warning)
        .forEach(test => console.log(`   - ${test.name}: ${test.message}`));
    }

    console.log('\n📋 Recommendations:');
    if (successRate >= 90) {
      console.log('✅ Deployment appears successful');
      console.log('✅ Supervisor logging system is operational');
      if (this.testResults.warnings > 0) {
        console.log('⚠️  Monitor warnings and address if needed');
      }
    } else if (successRate >= 70) {
      console.log('⚠️  Deployment partially successful');
      console.log('🔧 Address failed tests before production use');
      console.log('📊 Monitor system closely');
    } else {
      console.log('❌ Deployment has significant issues');
      console.log('🚨 Do not use in production until issues are resolved');
      console.log('📞 Contact support or review deployment guide');
    }

    console.log('\n🔗 Useful URLs:');
    console.log(`   Health: ${this.baseUrl}/api/health`);
    console.log(`   Logging Health: ${this.baseUrl}/api/supervisor-logging/health`);
    console.log(`   Status: ${this.baseUrl}/api/supervisor-logging/status`);
    console.log(`   Metrics: ${this.baseUrl}/api/supervisor-logging/metrics`);
  }

  /**
   * Export test results for CI/CD
   */
  exportResults() {
    return {
      summary: {
        passed: this.testResults.passed,
        failed: this.testResults.failed,
        warnings: this.testResults.warnings,
        total: this.testResults.tests.length,
        successRate: Math.round((this.testResults.passed / this.testResults.tests.length) * 100)
      },
      tests: this.testResults.tests,
      timestamp: new Date().toISOString(),
      url: this.baseUrl
    };
  }
}

// Main execution
async function main() {
  const baseUrl = process.argv[2] || process.env.TEST_URL || 'http://localhost:3001';
  
  console.log('🧪 Go BARRY Supervisor Logging Deployment Test');
  console.log('=' .repeat(60));
  
  const tester = new SupervisorLoggingDeploymentTest(baseUrl);
  
  try {
    await tester.runAllTests();
    
    // Export results if requested
    if (process.env.EXPORT_RESULTS === 'true') {
      const results = tester.exportResults();
      console.log('\n📄 Exported Results:');
      console.log(JSON.stringify(results, null, 2));
    }
    
    // Exit with appropriate code
    process.exit(tester.testResults.failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default SupervisorLoggingDeploymentTest;