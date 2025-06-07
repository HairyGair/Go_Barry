// Simple API Test Component for Go BARRY
// Bypasses complex dashboard to test basic API connectivity
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

const SimpleAPITest = () => {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [lastTest, setLastTest] = useState(null);

  // Determine API base URL
  const getAPIBaseURL = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:3001';
      }
      return 'https://go-barry.onrender.com';
    }
    return 'https://go-barry.onrender.com';
  };

  const API_BASE_URL = getAPIBaseURL();

  // Test individual endpoints
  const testEndpoint = async (endpoint, name) => {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`🧪 Testing ${name}: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'BARRY-SimpleTest/1.0'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        status: response.status,
        data: data,
        alertCount: data.alerts ? data.alerts.length : 0,
        metadata: data.metadata || {},
        url: url
      };
    } catch (error) {
      console.error(`❌ ${name} failed:`, error);
      return {
        success: false,
        error: error.message,
        url: url,
        alertCount: 0
      };
    }
  };

  // Run all API tests
  const runAllTests = async () => {
    setLoading(true);
    setLastTest(new Date().toISOString());
    
    console.log('🧪 Starting Simple API Tests...');
    console.log(`📡 API Base URL: ${API_BASE_URL}`);

    const testResults = {};

    // Test health endpoint first
    console.log('🏥 Testing health endpoint...');
    testResults.health = await testEndpoint('/api/health', 'Health Check');

    // Test main alerts endpoint
    console.log('🚨 Testing main alerts endpoint...');
    testResults.alerts = await testEndpoint('/api/alerts', 'Main Alerts');

    // Test enhanced alerts endpoint
    console.log('⚡ Testing enhanced alerts endpoint...');
    testResults.alertsEnhanced = await testEndpoint('/api/alerts-enhanced', 'Enhanced Alerts');

    // Test debug endpoint
    console.log('🔍 Testing debug endpoint...');
    testResults.debug = await testEndpoint('/api/debug-traffic', 'Debug Traffic');

    // Test status endpoint
    console.log('📊 Testing status endpoint...');
    testResults.status = await testEndpoint('/api/status', 'Status');

    setResults(testResults);
    setLoading(false);

    // Log summary
    const workingEndpoints = Object.values(testResults).filter(r => r.success).length;
    const totalEndpoints = Object.keys(testResults).length;
    
    console.log(`📊 Test Summary: ${workingEndpoints}/${totalEndpoints} endpoints working`);
    
    if (workingEndpoints === 0) {
      console.log('❌ No endpoints are working - backend is likely not running');
    } else {
      console.log('✅ Some endpoints are working - check individual results');
    }
  };

  // Auto-run tests on mount
  useEffect(() => {
    runAllTests();
  }, []);

  // Render results
  const renderTestResult = (name, result) => {
    if (!result) return null;

    const statusColor = result.success ? '#10B981' : '#EF4444';
    const statusText = result.success ? 'SUCCESS' : 'FAILED';

    return (
      <View key={name} style={styles.testResult}>
        <View style={styles.testHeader}>
          <Text style={styles.testName}>{name}</Text>
          <Text style={[styles.testStatus, { color: statusColor }]}>
            {statusText}
          </Text>
        </View>
        
        <Text style={styles.testURL}>URL: {result.url}</Text>
        
        {result.success ? (
          <View>
            <Text style={styles.testDetail}>
              Status: {result.status} | Alerts: {result.alertCount}
            </Text>
            {result.metadata.totalAlerts && (
              <Text style={styles.testDetail}>
                Total: {result.metadata.totalAlerts} | Sources: {JSON.stringify(result.metadata.sources || {})}
              </Text>
            )}
            {result.data.status && (
              <Text style={styles.testDetail}>
                Service Status: {result.data.status}
              </Text>
            )}
          </View>
        ) : (
          <Text style={styles.testError}>Error: {result.error}</Text>
        )}
      </View>
    );
  };

  const totalWorkingEndpoints = Object.values(results).filter(r => r && r.success).length;
  const totalEndpoints = Object.keys(results).length;
  const totalAlerts = Object.values(results).reduce((sum, r) => sum + (r?.alertCount || 0), 0);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧪 Go BARRY API Test</Text>
        <Text style={styles.subtitle}>Simple connectivity diagnostic</Text>
        <Text style={styles.apiUrl}>Testing: {API_BASE_URL}</Text>
        {lastTest && (
          <Text style={styles.lastTest}>
            Last test: {new Date(lastTest).toLocaleTimeString()}
          </Text>
        )}
      </View>

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={runAllTests}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? '🔄 Testing...' : '🧪 Run Tests'}
        </Text>
      </TouchableOpacity>

      {totalEndpoints > 0 && (
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>📊 Test Summary</Text>
          <Text style={styles.summaryText}>
            Working Endpoints: {totalWorkingEndpoints}/{totalEndpoints}
          </Text>
          <Text style={styles.summaryText}>
            Total Alerts Found: {totalAlerts}
          </Text>
          <Text style={[
            styles.summaryStatus,
            { color: totalWorkingEndpoints > 0 ? '#10B981' : '#EF4444' }
          ]}>
            {totalWorkingEndpoints > 0 ? '✅ API Connection Working' : '❌ No API Connection'}
          </Text>
        </View>
      )}

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>📋 Detailed Results</Text>
        {Object.entries(results).map(([name, result]) => 
          renderTestResult(name, result)
        )}
      </View>

      {totalWorkingEndpoints === 0 && totalEndpoints > 0 && (
        <View style={styles.troubleshooting}>
          <Text style={styles.troubleshootingTitle}>🔧 Troubleshooting</Text>
          <Text style={styles.troubleshootingText}>
            • Check if backend server is running on port 3001
          </Text>
          <Text style={styles.troubleshootingText}>
            • Run: cd backend && npm run dev
          </Text>
          <Text style={styles.troubleshootingText}>
            • Check API keys in backend/.env file
          </Text>
          <Text style={styles.troubleshootingText}>
            • Verify network connection
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#1E293B',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
  },
  apiUrl: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'monospace',
  },
  lastTest: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#3B82F6',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#94A3B8',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  summary: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  summaryStatus: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  resultsContainer: {
    margin: 16,
    marginTop: 0,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  testResult: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  testName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  testStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  testURL: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  testDetail: {
    fontSize: 12,
    color: '#059669',
    marginBottom: 2,
  },
  testError: {
    fontSize: 12,
    color: '#DC2626',
  },
  troubleshooting: {
    backgroundColor: '#FEF2F2',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  troubleshootingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 8,
  },
  troubleshootingText: {
    fontSize: 12,
    color: '#7F1D1D',
    marginBottom: 4,
  },
});

export default SimpleAPITest;
