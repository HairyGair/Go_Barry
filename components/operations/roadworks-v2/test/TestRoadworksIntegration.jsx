import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TestRoadworksIntegration = ({ baseUrl = 'https://go-barry.onrender.com' }) => {
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [lastTest, setLastTest] = useState(null);

  const runComprehensiveTest = async () => {
    setLoading(true);
    const results = {};
    const startTime = Date.now();

    try {
      // Test 1: Health Check
      console.log('🏥 Testing API health...');
      const healthResponse = await fetch(`${baseUrl}/api/health`);
      results.health = {
        success: healthResponse.ok,
        status: healthResponse.status,
        data: healthResponse.ok ? await healthResponse.json() : null
      };

      // Test 2: Street Manager Roadworks Endpoint
      console.log('🚧 Testing Street Manager roadworks endpoint...');
      const roadworksResponse = await fetch(`${baseUrl}/api/street-manager-roadworks`);
      const roadworksData = roadworksResponse.ok ? await roadworksResponse.json() : null;
      results.roadworks = {
        success: roadworksResponse.ok,
        status: roadworksResponse.status,
        count: roadworksData?.roadworks?.length || 0,
        sampleRoadwork: roadworksData?.roadworks?.[0] || null,
        metadata: roadworksData?.metadata || null
      };

      // Test 3: Street Manager Status
      console.log('📊 Testing Street Manager status...');
      const statusResponse = await fetch(`${baseUrl}/api/roadworks-v2/status`);
      const statusData = statusResponse.ok ? await statusResponse.json() : null;
      results.status = {
        success: statusResponse.ok,
        data: statusData
      };

      // Test 4: Data Quality Check
      console.log('🔍 Testing data quality...');
      if (roadworksData?.roadworks?.length > 0) {
        const sample = roadworksData.roadworks[0];
        results.dataQuality = {
          hasTitle: !!sample.title,
          hasLocation: !!sample.location,
          hasStatus: !!sample.status,
          hasSeverity: !!sample.severity,
          hasSource: !!sample.source,
          hasEventType: !!sample.eventType,
          sampleFields: Object.keys(sample),
          score: calculateDataQualityScore(sample)
        };
      } else {
        results.dataQuality = { noData: true };
      }

      // Test 5: Real-time Test (check if data changes)
      console.log('⏱️ Testing real-time capabilities...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      const realtimeResponse = await fetch(`${baseUrl}/api/street-manager-roadworks`);
      const realtimeData = realtimeResponse.ok ? await realtimeResponse.json() : null;
      results.realtime = {
        success: realtimeResponse.ok,
        dataConsistent: JSON.stringify(roadworksData?.roadworks?.[0]) === JSON.stringify(realtimeData?.roadworks?.[0]),
        timestamp1: roadworksData?.metadata?.lastUpdated,
        timestamp2: realtimeData?.metadata?.lastUpdated
      };

    } catch (error) {
      results.error = {
        message: error.message,
        stack: error.stack
      };
    }

    results.testDuration = Date.now() - startTime;
    results.overallSuccess = calculateOverallSuccess(results);
    
    setTestResults(results);
    setLastTest(new Date());
    setLoading(false);

    // Show summary alert
    const successCount = Object.values(results).filter(r => r.success).length;
    const totalTests = Object.keys(results).filter(k => k !== 'testDuration' && k !== 'overallSuccess' && k !== 'error').length;
    
    Alert.alert(
      'Test Results',
      `${successCount}/${totalTests} tests passed\nDuration: ${results.testDuration}ms\nOverall: ${results.overallSuccess ? '✅ PASS' : '❌ FAIL'}`,
      [{ text: 'OK' }]
    );
  };

  const calculateDataQualityScore = (sample) => {
    const requiredFields = ['title', 'location', 'status', 'severity', 'source'];
    const presentFields = requiredFields.filter(field => !!sample[field]);
    return Math.round((presentFields.length / requiredFields.length) * 100);
  };

  const calculateOverallSuccess = (results) => {
    const tests = ['health', 'roadworks', 'status'];
    return tests.every(test => results[test]?.success);
  };

  const renderTestResult = (testName, result) => {
    if (!result) return null;

    const getStatusIcon = () => {
      if (result.success) return 'checkmark-circle';
      if (result.success === false) return 'close-circle';
      return 'help-circle';
    };

    const getStatusColor = () => {
      if (result.success) return '#10B981';
      if (result.success === false) return '#EF4444';
      return '#6B7280';
    };

    return (
      <View key={testName} style={styles.testResult}>
        <View style={styles.testHeader}>
          <Ionicons name={getStatusIcon()} size={20} color={getStatusColor()} />
          <Text style={styles.testName}>{testName.toUpperCase()}</Text>
          {result.count !== undefined && (
            <Text style={styles.testCount}>({result.count} items)</Text>
          )}
        </View>
        
        {result.success === false && (
          <Text style={styles.errorText}>Status: {result.status}</Text>
        )}
        
        {testName === 'dataQuality' && result.score && (
          <Text style={styles.qualityScore}>Quality Score: {result.score}%</Text>
        )}
        
        {testName === 'roadworks' && result.sampleRoadwork && (
          <View style={styles.sampleData}>
            <Text style={styles.sampleTitle}>{result.sampleRoadwork.title}</Text>
            <Text style={styles.sampleLocation}>{result.sampleRoadwork.location}</Text>
            <Text style={styles.sampleStatus}>
              {result.sampleRoadwork.status} • {result.sampleRoadwork.severity} • {result.sampleRoadwork.source}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="flask" size={24} color="#3B82F6" />
        <Text style={styles.title}>Roadworks V2 Integration Test</Text>
      </View>

      <View style={styles.controls}>
        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={runComprehensiveTest}
          disabled={loading}
        >
          <Ionicons 
            name={loading ? "hourglass" : "play"} 
            size={16} 
            color="#FFFFFF" 
          />
          <Text style={styles.buttonText}>
            {loading ? 'Running Tests...' : 'Run Full Test Suite'}
          </Text>
        </Pressable>

        {lastTest && (
          <Text style={styles.lastTest}>
            Last test: {lastTest.toLocaleTimeString()}
          </Text>
        )}
      </View>

      <ScrollView style={styles.results}>
        {Object.keys(testResults).length > 0 && (
          <>
            <View style={styles.summary}>
              <Text style={styles.summaryTitle}>Test Summary</Text>
              <Text style={[
                styles.summaryResult,
                { color: testResults.overallSuccess ? '#10B981' : '#EF4444' }
              ]}>
                {testResults.overallSuccess ? '✅ ALL SYSTEMS OPERATIONAL' : '❌ ISSUES DETECTED'}
              </Text>
              <Text style={styles.summaryDuration}>
                Duration: {testResults.testDuration}ms
              </Text>
            </View>

            {renderTestResult('health', testResults.health)}
            {renderTestResult('roadworks', testResults.roadworks)}
            {renderTestResult('status', testResults.status)}
            {renderTestResult('dataQuality', testResults.dataQuality)}
            {renderTestResult('realtime', testResults.realtime)}

            {testResults.error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorTitle}>Error Details</Text>
                <Text style={styles.errorMessage}>{testResults.error.message}</Text>
              </View>
            )}
          </>
        )}

        {Object.keys(testResults).length === 0 && !loading && (
          <View style={styles.placeholder}>
            <Ionicons name="flask-outline" size={48} color="#9CA3AF" />
            <Text style={styles.placeholderText}>
              Press "Run Full Test Suite" to validate the Roadworks Manager V2 integration
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#111827'
  },
  controls: {
    marginBottom: 20
  },
  button: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF'
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8
  },
  lastTest: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center'
  },
  results: {
    flex: 1
  },
  summary: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#111827'
  },
  summaryResult: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4
  },
  summaryDuration: {
    fontSize: 12,
    color: '#6B7280'
  },
  testResult: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  testName: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    color: '#111827'
  },
  testCount: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4
  },
  qualityScore: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600'
  },
  sampleData: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 4
  },
  sampleTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827'
  },
  sampleLocation: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2
  },
  sampleStatus: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginTop: 8
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 4
  },
  errorMessage: {
    fontSize: 12,
    color: '#DC2626'
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40
  },
  placeholderText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 12
  }
};

export default TestRoadworksIntegration;