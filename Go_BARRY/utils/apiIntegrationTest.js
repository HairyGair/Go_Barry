// Go_BARRY/utils/apiIntegrationTest.js
// Comprehensive API Integration Test for Backend-Frontend Alignment
import { apiRequest, API_CONFIG } from '../config/api';

export class APIIntegrationTest {
  constructor() {
    this.results = {
      totalTests: 0,
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async runTest(testName, testFunction) {
    this.results.totalTests++;
    console.log(`🧪 Running test: ${testName}`);
    
    try {
      const result = await testFunction();
      if (result.success) {
        this.results.passed++;
        console.log(`✅ ${testName}: PASSED`);
        return { test: testName, status: 'PASSED', data: result };
      } else {
        this.results.failed++;
        console.log(`❌ ${testName}: FAILED - ${result.error}`);
        this.results.errors.push({ test: testName, error: result.error });
        return { test: testName, status: 'FAILED', error: result.error };
      }
    } catch (error) {
      this.results.failed++;
      console.error(`💥 ${testName}: ERROR - ${error.message}`);
      this.results.errors.push({ test: testName, error: error.message });
      return { test: testName, status: 'ERROR', error: error.message };
    }
  }

  // Core Alerts Tests
  async testAlertsEndpoints() {
    const tests = [];

    // Test enhanced alerts endpoint
    tests.push(await this.runTest('Enhanced Alerts', async () => {
      const response = await apiRequest('/api/alerts-enhanced');
      return {
        success: response.success,
        data: {
          alertCount: response.alerts?.length || 0,
          sources: Object.keys(response.metadata?.sources || {}),
          lastUpdated: response.metadata?.lastUpdated
        },
        error: response.error
      };
    }));

    // Test basic alerts endpoint
    tests.push(await this.runTest('Basic Alerts', async () => {
      const response = await apiRequest('/api/alerts');
      return {
        success: response.success,
        data: {
          alertCount: response.alerts?.length || 0,
          cached: response.metadata?.cached
        },
        error: response.error
      };
    }));

    // Test alerts test endpoint
    tests.push(await this.runTest('Test Alerts', async () => {
      const response = await apiRequest('/api/alerts-test');
      return {
        success: response.success,
        data: {
          alertCount: response.alerts?.length || 0,
          source: response.metadata?.source
        },
        error: response.error
      };
    }));

    return tests;
  }

  // Service Frequency Tests
  async testServiceFrequencyEndpoints() {
    const tests = [];

    // Test service frequency dashboard
    tests.push(await this.runTest('Service Frequency Dashboard', async () => {
      const response = await apiRequest('/api/service-frequency/dashboard');
      return {
        success: response.success,
        data: {
          dashboardExists: !!response.dashboard,
          routeCount: response.dashboard?.routes?.length || 0
        },
        error: response.error
      };
    }));

    // Test network status
    tests.push(await this.runTest('Network Status', async () => {
      const response = await apiRequest('/api/service-frequency/network-status');
      return {
        success: response.success,
        data: {
          networkStatus: response.networkStatus,
          routeCount: response.routes?.length || 0
        },
        error: response.error
      };
    }));

    // Test breakdown alerts
    tests.push(await this.runTest('Breakdown Alerts', async () => {
      const response = await apiRequest('/api/service-frequency/breakdown-alerts');
      return {
        success: response.success,
        data: {
          alertCount: response.alertCount || 0,
          criticalAlerts: response.criticalAlerts || 0
        },
        error: response.error
      };
    }));

    // Test service frequency status
    tests.push(await this.runTest('Service Frequency Status', async () => {
      const response = await apiRequest('/api/service-frequency/status');
      return {
        success: response.success,
        data: {
          systemInitialized: response.status?.systemInitialized,
          routesWithData: response.status?.routesWithData
        },
        error: response.error
      };
    }));

    // Test trends
    tests.push(await this.runTest('Service Trends', async () => {
      const response = await apiRequest('/api/service-frequency/trends');
      return {
        success: response.success,
        data: {
          trendsAvailable: !!response.trends
        },
        error: response.error
      };
    }));

    return tests;
  }

  // StreetManager Tests
  async testStreetManagerEndpoints() {
    const tests = [];

    // Test StreetManager activities
    tests.push(await this.runTest('StreetManager Activities', async () => {
      const response = await apiRequest('/api/streetmanager/activities');
      return {
        success: response.success,
        data: {
          activityCount: response.activities?.length || 0,
          official: response.metadata?.official
        },
        error: response.error
      };
    }));

    // Test StreetManager permits
    tests.push(await this.runTest('StreetManager Permits', async () => {
      const response = await apiRequest('/api/streetmanager/permits');
      return {
        success: response.success,
        data: {
          permitCount: response.permits?.length || 0,
          official: response.metadata?.official
        },
        error: response.error
      };
    }));

    // Test StreetManager combined
    tests.push(await this.runTest('StreetManager Combined', async () => {
      const response = await apiRequest('/api/streetmanager/all');
      return {
        success: response.success,
        data: {
          totalAlerts: response.metadata?.totalAlerts || 0,
          sources: Object.keys(response.metadata?.sources || {})
        },
        error: response.error
      };
    }));

    // Test StreetManager status
    tests.push(await this.runTest('StreetManager Status', async () => {
      const response = await apiRequest('/api/streetmanager/status');
      return {
        success: response.success,
        data: {
          webhookConnected: response.status?.webhookConnected,
          lastUpdated: response.status?.lastUpdated
        },
        error: response.error
      };
    }));

    return tests;
  }

  // Disruption Logging Tests
  async testDisruptionEndpoints() {
    const tests = [];

    // Test disruption logs
    tests.push(await this.runTest('Disruption Logs', async () => {
      const response = await apiRequest('/api/disruptions/logs?limit=10');
      return {
        success: response.success,
        data: {
          logCount: response.logs?.length || 0,
          totalCount: response.metadata?.totalCount
        },
        error: response.error
      };
    }));

    // Test disruption statistics
    tests.push(await this.runTest('Disruption Statistics', async () => {
      const response = await apiRequest('/api/disruptions/statistics');
      return {
        success: response.success,
        data: {
          statisticsAvailable: !!response.statistics,
          todayCount: response.statistics?.today?.total
        },
        error: response.error
      };
    }));

    // Test disruption health
    tests.push(await this.runTest('Disruption Health', async () => {
      const response = await apiRequest('/api/disruptions/health');
      return {
        success: response.success,
        data: {
          healthy: response.health?.status === 'healthy',
          dbConnected: response.health?.database
        },
        error: response.error
      };
    }));

    return tests;
  }

  // System Tests
  async testSystemEndpoints() {
    const tests = [];

    // Test system status
    tests.push(await this.runTest('System Status', async () => {
      const response = await apiRequest('/api/status');
      return {
        success: !!response.status,
        data: {
          status: response.status,
          apiKeysConfigured: response.apiKeys?.configured,
          servicesOnline: Object.values(response.services || {}).every(s => s === 'online')
        },
        error: !response.status ? 'No status returned' : null
      };
    }));

    // Test health endpoint
    tests.push(await this.runTest('Health Check', async () => {
      const response = await apiRequest('/api/health');
      return {
        success: response.success,
        data: {
          status: response.status,
          service: response.service
        },
        error: response.error
      };
    }));

    // Test config endpoint
    tests.push(await this.runTest('Configuration', async () => {
      const response = await apiRequest('/api/config');
      return {
        success: !!response.gtfsRoutesCount !== undefined,
        data: {
          gtfsRoutesCount: response.gtfsRoutesCount,
          enhancedLocationEnabled: response.enhancedLocationEnabled
        },
        error: response.gtfsRoutesCount === undefined ? 'No config data' : null
      };
    }));

    return tests;
  }

  // Test specific route endpoint
  async testRouteSpecificEndpoint() {
    const tests = [];

    // Test a specific route frequency analysis
    tests.push(await this.runTest('Route X1 Analysis', async () => {
      const response = await apiRequest('/api/service-frequency/route/X1');
      return {
        success: response.success,
        data: {
          routeFound: !!response.route,
          analysisAvailable: !!response.analysis
        },
        error: response.error
      };
    }));

    return tests;
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting comprehensive API integration test...');
    console.log(`🔗 Testing against: ${API_CONFIG.baseURL}`);
    
    const startTime = Date.now();
    const allResults = [];

    try {
      // Run all test suites
      const alertTests = await this.testAlertsEndpoints();
      const serviceTests = await this.testServiceFrequencyEndpoints();
      const streetManagerTests = await this.testStreetManagerEndpoints();
      const disruptionTests = await this.testDisruptionEndpoints();
      const systemTests = await this.testSystemEndpoints();
      const routeTests = await this.testRouteSpecificEndpoint();

      allResults.push(...alertTests);
      allResults.push(...serviceTests);
      allResults.push(...streetManagerTests);
      allResults.push(...disruptionTests);
      allResults.push(...systemTests);
      allResults.push(...routeTests);

    } catch (error) {
      console.error('💥 Test suite failed:', error);
      this.results.errors.push({ test: 'Test Suite', error: error.message });
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    // Generate summary
    const summary = {
      ...this.results,
      duration: `${duration}s`,
      successRate: `${((this.results.passed / this.results.totalTests) * 100).toFixed(1)}%`,
      baseUrl: API_CONFIG.baseURL,
      timestamp: new Date().toISOString(),
      details: allResults
    };

    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Success Rate: ${summary.successRate}`);
    console.log(`⏱️ Duration: ${summary.duration}`);

    if (this.results.errors.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.errors.forEach(error => {
        console.log(`  - ${error.test}: ${error.error}`);
      });
    }

    return summary;
  }

  // Test critical path (most important endpoints)
  async runCriticalPathTest() {
    console.log('🎯 Running critical path test...');
    
    const criticalTests = [
      () => this.runTest('Health Check', async () => {
        const response = await apiRequest('/api/health');
        return { success: response.success, error: response.error };
      }),
      () => this.runTest('Enhanced Alerts', async () => {
        const response = await apiRequest('/api/alerts-enhanced');
        return { success: response.success, error: response.error };
      }),
      () => this.runTest('Service Frequency Dashboard', async () => {
        const response = await apiRequest('/api/service-frequency/dashboard');
        return { success: response.success, error: response.error };
      }),
      () => this.runTest('StreetManager Status', async () => {
        const response = await apiRequest('/api/streetmanager/status');
        return { success: response.success, error: response.error };
      })
    ];

    const results = [];
    for (const test of criticalTests) {
      results.push(await test());
    }

    const criticalSuccessRate = (this.results.passed / this.results.totalTests) * 100;
    
    console.log(`🎯 Critical Path Success Rate: ${criticalSuccessRate.toFixed(1)}%`);
    
    return {
      criticalSuccessRate,
      allCriticalPassed: criticalSuccessRate === 100,
      results
    };
  }
}

// Export singleton instance for easy use
export const apiTest = new APIIntegrationTest();

// Quick test function for components
export const quickAPITest = async () => {
  const test = new APIIntegrationTest();
  return await test.runCriticalPathTest();
};

export default APIIntegrationTest;