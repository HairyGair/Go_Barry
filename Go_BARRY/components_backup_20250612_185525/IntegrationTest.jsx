// Go_BARRY/components/IntegrationTest.jsx
// Sector 2: Integration Test - Internal API testing and system health

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const isWeb = Platform.OS === 'web';

// Test result status colors
const getStatusColor = (status) => {
  switch (status) {
    case 'pass': return '#10B981';
    case 'fail': return '#EF4444';
    case 'warning': return '#F59E0B';
    case 'testing': return '#3B82F6';
    default: return '#6B7280';
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'pass': return 'checkmark-circle';
    case 'fail': return 'close-circle';
    case 'warning': return 'warning';
    case 'testing': return 'hourglass';
    default: return 'help-circle';
  }
};

const IntegrationTest = ({ sector = 2 }) => {
  const [testResults, setTestResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Test categories
  const testCategories = {
    apis: {
      title: 'API Connections',
      tests: [
        { id: 'health', name: 'Health Check', endpoint: '/api/health' },
        { id: 'alerts', name: 'Main Alerts API', endpoint: '/api/alerts' },
        { id: 'alerts-enhanced', name: 'Enhanced Alerts API', endpoint: '/api/alerts-enhanced' },
        { id: 'health-extended', name: 'Extended Health Check', endpoint: '/api/health-extended' },
        { id: 'emergency-alerts', name: 'Emergency Alerts Fallback', endpoint: '/api/emergency-alerts' }
      ]
    },
    gtfs: {
      title: 'GTFS Route Mapping',
      tests: [
        { id: 'gtfs-stats', name: 'GTFS Statistics', endpoint: '/api/gtfs/stats' },
        { id: 'gtfs-performance', name: 'GTFS Performance', endpoint: '/api/gtfs/performance' },
        { id: 'gtfs-accuracy', name: 'Route Match Accuracy', endpoint: '/api/gtfs/test/accuracy' },
        { id: 'routes-search', name: 'Bus Stop Search', endpoint: '/api/routes/search-stops?query=Newcastle' }
      ]
    },
    integration: {
      title: 'Alert → Route Matching',
      tests: [
        { id: 'data-flow', name: 'Data Flow Test', endpoint: '/api/test/data-flow' },
        { id: 'ml-performance', name: 'ML Performance', endpoint: '/api/intelligence/ml/performance' },
        { id: 'intelligence-health', name: 'Intelligence Health', endpoint: '/api/intelligence/health' }
      ]
    },
    supervisor: {
      title: 'Supervisor Systems',
      tests: [
        { id: 'supervisor-activity', name: 'Supervisor Activity', endpoint: '/api/supervisor/activity' },
        { id: 'supervisor-active', name: 'Active Supervisors', endpoint: '/api/supervisor/active' },
        { id: 'supervisor-templates', name: 'Message Templates', endpoint: '/api/supervisor/templates' }
      ]
    }
  };

  // API base URL - use environment variable or fallback
  const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://go-barry.onrender.com';

  // Run individual test
  const runSingleTest = useCallback(async (test) => {
    setTestResults(prev => ({
      ...prev,
      [test.id]: { status: 'testing', message: 'Running test...', timestamp: new Date() }
    }));

    try {
      const response = await fetch(`${API_BASE}${test.endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000
      });

      const data = await response.json();
      
      if (response.ok) {
        setTestResults(prev => ({
          ...prev,
          [test.id]: {
            status: data.success ? 'pass' : 'fail',
            message: data.message || 'Test completed',
            details: data.details || {},
            responseTime: data.responseTime || 'N/A',
            timestamp: new Date()
          }
        }));
      } else {
        setTestResults(prev => ({
          ...prev,
          [test.id]: {
            status: 'fail',
            message: data.message || `HTTP ${response.status}`,
            timestamp: new Date()
          }
        }));
      }
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [test.id]: {
          status: 'fail',
          message: error.message || 'Network error',
          timestamp: new Date()
        }
      }));
    }
  }, []);

  // Run all tests
  const runAllTests = useCallback(async () => {
    setIsRunning(true);
    setLastRun(new Date());

    // Get all tests from all categories
    const allTests = Object.values(testCategories).flatMap(category => category.tests);
    
    // Run tests sequentially to avoid overwhelming the server
    for (const test of allTests) {
      await runSingleTest(test);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
  }, [runSingleTest, testCategories]);

  // Run health check on mount
  useEffect(() => {
    const runQuickHealthCheck = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/health`, { timeout: 5000 });
        const data = await response.json();
        
        setTestResults(prev => ({
          ...prev,
          'system-health': {
            status: data.status === 'ok' ? 'pass' : 'warning',
            message: `System ${data.status}`,
            details: data,
            timestamp: new Date()
          }
        }));
      } catch (error) {
        setTestResults(prev => ({
          ...prev,
          'system-health': {
            status: 'fail',
            message: 'Cannot reach backend',
            timestamp: new Date()
          }
        }));
      }
    };

    runQuickHealthCheck();
  }, []);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await runAllTests();
    setRefreshing(false);
  }, [runAllTests]);

  // Test result card component
  const TestResultCard = ({ test, result }) => {
    const status = result?.status || 'unknown';
    
    return (
      <View style={styles.testCard}>
        <View style={styles.testHeader}>
          <View style={styles.testInfo}>
            <Text style={styles.testName}>{test.name}</Text>
            <Text style={styles.testEndpoint}>{test.endpoint}</Text>
          </View>
          
          <View style={styles.testStatus}>
            <Ionicons 
              name={getStatusIcon(status)} 
              size={24} 
              color={getStatusColor(status)} 
            />
            <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
              {status.toUpperCase()}
            </Text>
          </View>
        </View>

        {result && (
          <View style={styles.testDetails}>
            <Text style={styles.testMessage}>{result.message}</Text>
            
            {result.responseTime && (
              <Text style={styles.responseTime}>Response: {result.responseTime}</Text>
            )}
            
            {result.timestamp && (
              <Text style={styles.timestamp}>
                {result.timestamp.toLocaleTimeString()}
              </Text>
            )}
            
            {result.details && Object.keys(result.details).length > 0 && (
              <View style={styles.detailsSection}>
                <Text style={styles.detailsTitle}>Details:</Text>
                <Text style={styles.detailsText}>
                  {JSON.stringify(result.details, null, 2)}
                </Text>
              </View>
            )}
          </View>
        )}

        <TouchableOpacity
          style={styles.runTestButton}
          onPress={() => runSingleTest(test)}
          disabled={isRunning}
        >
          {result?.status === 'testing' ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="play" size={16} color="#FFFFFF" />
          )}
          <Text style={styles.runTestText}>
            {result?.status === 'testing' ? 'Testing...' : 'Run Test'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Get overall status
  const getOverallStatus = () => {
    const results = Object.values(testResults);
    if (results.some(r => r.status === 'fail')) return 'fail';
    if (results.some(r => r.status === 'warning')) return 'warning';
    if (results.some(r => r.status === 'testing')) return 'testing';
    if (results.every(r => r.status === 'pass')) return 'pass';
    return 'unknown';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Sector 2: Integration Test</Text>
          <Text style={styles.subtitle}>API Connections & System Health</Text>
        </View>
        
        <View style={styles.headerRight}>
          <View style={[styles.overallStatus, { backgroundColor: getStatusColor(getOverallStatus()) }]}>
            <Ionicons name={getStatusIcon(getOverallStatus())} size={16} color="#FFFFFF" />
            <Text style={styles.overallStatusText}>
              {getOverallStatus().toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.controlBar}>
        <TouchableOpacity
          style={[styles.runAllButton, isRunning && styles.runAllButtonDisabled]}
          onPress={runAllTests}
          disabled={isRunning}
        >
          {isRunning ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="play-circle" size={20} color="#FFFFFF" />
          )}
          <Text style={styles.runAllText}>
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </Text>
        </TouchableOpacity>

        {lastRun && (
          <Text style={styles.lastRunText}>
            Last run: {lastRun.toLocaleTimeString()}
          </Text>
        )}
      </View>

      <ScrollView 
        style={styles.testsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {Object.entries(testCategories).map(([categoryKey, category]) => (
          <View key={categoryKey} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category.title}</Text>
            
            {category.tests.map(test => (
              <TestResultCard
                key={test.id}
                test={test}
                result={testResults[test.id]}
              />
            ))}
          </View>
        ))}

        {/* System Health Summary */}
        <View style={styles.categorySection}>
          <Text style={styles.categoryTitle}>System Health</Text>
          
          {testResults['system-health'] && (
            <View style={styles.healthSummary}>
              <View style={styles.healthHeader}>
                <Ionicons 
                  name={getStatusIcon(testResults['system-health'].status)} 
                  size={24} 
                  color={getStatusColor(testResults['system-health'].status)} 
                />
                <Text style={styles.healthTitle}>Backend System</Text>
                <Text style={[styles.healthStatus, { color: getStatusColor(testResults['system-health'].status) }]}>
                  {testResults['system-health'].status.toUpperCase()}
                </Text>
              </View>
              
              <Text style={styles.healthMessage}>
                {testResults['system-health'].message}
              </Text>
              
              {testResults['system-health'].details && (
                <View style={styles.healthDetails}>
                  <Text style={styles.healthDetailsText}>
                    Memory: {testResults['system-health'].details.memoryUsage || 'N/A'}
                  </Text>
                  <Text style={styles.healthDetailsText}>
                    Uptime: {testResults['system-health'].details.uptime || 'N/A'}
                  </Text>
                  <Text style={styles.healthDetailsText}>
                    Data Sources: {testResults['system-health'].details.dataSources || 'N/A'}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...Platform.select({
      web: { paddingTop: 16 },
      default: { paddingTop: 40 }
    }),
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  overallStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  overallStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  controlBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  runAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  runAllButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  runAllText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  lastRunText: {
    fontSize: 12,
    color: '#6B7280',
  },
  testsList: {
    flex: 1,
    padding: 16,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  testCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  testInfo: {
    flex: 1,
    marginRight: 12,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  testEndpoint: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  testStatus: {
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  testDetails: {
    marginBottom: 12,
  },
  testMessage: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
  },
  responseTime: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  detailsSection: {
    marginTop: 8,
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 4,
  },
  detailsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  detailsText: {
    fontSize: 10,
    color: '#4B5563',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  runTestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 8,
    borderRadius: 6,
  },
  runTestText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  healthSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  healthTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  healthStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  healthMessage: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
  },
  healthDetails: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 6,
  },
  healthDetailsText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
});

export default IntegrationTest;
