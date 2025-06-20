// Go_BARRY/components/SupervisorDisplayIntegrationTest.jsx
// Comprehensive test component for supervisor → display integration
// Tests WebSocket sync, acknowledgments, dismissals, and real-time updates

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBarryAPI } from '../hooks/useBARRYapi';
import { useSupervisorSync } from '../hooks/useSupervisorSync';

const isWeb = Platform.OS === 'web';

const SupervisorDisplayIntegrationTest = () => {
  // Test state
  const [testResults, setTestResults] = useState({});
  const [currentTest, setCurrentTest] = useState(null);
  const [testSupervisorId, setTestSupervisorId] = useState('test_supervisor_001');
  const [testSessionId, setTestSessionId] = useState(`session_${Date.now()}`);
  const [testStartTime, setTestStartTime] = useState(null);
  
  // Get live alerts for testing
  const { alerts, loading: alertsLoading } = useBarryAPI({ 
    autoRefresh: true, 
    refreshInterval: 5000 
  });

  // Supervisor sync hook for testing
  const {
    connectionState,
    isConnected,
    acknowledgedAlerts,
    priorityOverrides,
    supervisorNotes,
    customMessages,
    connectedDisplays,
    acknowledgeAlert,
    updateAlertPriority,
    addNoteToAlert,
    broadcastMessage,
    connectionStats
  } = useSupervisorSync({
    clientType: 'supervisor',
    supervisorId: testSupervisorId,
    sessionId: testSessionId,
    autoConnect: true,
    onConnectionChange: (connected) => {
      updateTestResult('connection', {
        status: connected ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
        success: connected
      });
    },
    onError: (error) => {
      updateTestResult('connection_error', {
        error: error,
        timestamp: new Date().toISOString(),
        success: false
      });
    }
  });

  // Test result tracking
  const updateTestResult = (testName, result) => {
    setTestResults(prev => ({
      ...prev,
      [testName]: {
        ...result,
        completedAt: new Date().toISOString()
      }
    }));
  };

  // Test cases
  const tests = [
    {
      id: 'connection',
      name: '🔌 WebSocket Connection',
      description: 'Test supervisor WebSocket connection establishes',
      autoRun: true
    },
    {
      id: 'alert_acknowledge',
      name: '✅ Alert Acknowledgment',
      description: 'Test acknowledging alerts syncs to display',
      autoRun: false
    },
    {
      id: 'priority_override',
      name: '⚡ Priority Override',
      description: 'Test changing alert priority syncs to display',
      autoRun: false
    },
    {
      id: 'supervisor_notes',
      name: '📝 Supervisor Notes',
      description: 'Test adding notes to alerts syncs to display',
      autoRun: false
    },
    {
      id: 'broadcast_message',
      name: '📢 Broadcast Message',
      description: 'Test broadcasting messages to all displays',
      autoRun: false
    },
    {
      id: 'connection_stability',
      name: '🔄 Connection Stability',
      description: 'Test connection resilience and reconnection',
      autoRun: false
    }
  ];

  // Run individual tests
  const runTest = async (testId) => {
    setCurrentTest(testId);
    console.log(`🧪 Running test: ${testId}`);

    try {
      switch (testId) {
        case 'connection':
          await testConnection();
          break;
        case 'alert_acknowledge':
          await testAlertAcknowledgment();
          break;
        case 'priority_override':
          await testPriorityOverride();
          break;
        case 'supervisor_notes':
          await testSupervisorNotes();
          break;
        case 'broadcast_message':
          await testBroadcastMessage();
          break;
        case 'connection_stability':
          await testConnectionStability();
          break;
        default:
          throw new Error(`Unknown test: ${testId}`);
      }
    } catch (error) {
      console.error(`❌ Test ${testId} failed:`, error);
      updateTestResult(testId, {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }

    setCurrentTest(null);
  };

  // Individual test implementations
  const testConnection = async () => {
    return new Promise((resolve) => {
      // Connection test runs automatically via hook
      // Just wait a moment and check status
      setTimeout(() => {
        updateTestResult('connection', {
          success: isConnected,
          connectionState: connectionState,
          connectedDisplays: connectedDisplays,
          connectionStats: connectionStats,
          message: isConnected ? 'WebSocket connected successfully' : 'WebSocket connection failed'
        });
        resolve();
      }, 2000);
    });
  };

  const testAlertAcknowledgment = async () => {
    if (alerts.length === 0) {
      throw new Error('No alerts available to test acknowledgment');
    }

    const testAlert = alerts[0];
    const reason = 'Integration test acknowledgment';
    const notes = 'Automated test - please ignore';

    const success = acknowledgeAlert(testAlert.id, reason, notes);
    
    updateTestResult('alert_acknowledge', {
      success: success,
      alertId: testAlert.id,
      reason: reason,
      notes: notes,
      acknowledgedCount: acknowledgedAlerts.size,
      message: success ? 'Alert acknowledged successfully' : 'Alert acknowledgment failed'
    });
  };

  const testPriorityOverride = async () => {
    if (alerts.length === 0) {
      throw new Error('No alerts available to test priority override');
    }

    const testAlert = alerts[0];
    const newPriority = 'HIGH';
    const reason = 'Integration test priority change';

    const success = updateAlertPriority(testAlert.id, newPriority, reason);
    
    updateTestResult('priority_override', {
      success: success,
      alertId: testAlert.id,
      newPriority: newPriority,
      reason: reason,
      overrideCount: priorityOverrides.size,
      message: success ? `Priority changed to ${newPriority}` : 'Priority override failed'
    });
  };

  const testSupervisorNotes = async () => {
    if (alerts.length === 0) {
      throw new Error('No alerts available to test supervisor notes');
    }

    const testAlert = alerts[0];
    const note = `Integration test note - ${new Date().toLocaleTimeString()}`;

    const success = addNoteToAlert(testAlert.id, note);
    
    updateTestResult('supervisor_notes', {
      success: success,
      alertId: testAlert.id,
      note: note,
      noteCount: supervisorNotes.size,
      message: success ? 'Note added successfully' : 'Note addition failed'
    });
  };

  const testBroadcastMessage = async () => {
    const message = `🧪 Integration test broadcast - ${new Date().toLocaleTimeString()}`;
    const priority = 'info';
    const duration = 10000; // 10 seconds

    const success = broadcastMessage(message, priority, duration);
    
    updateTestResult('broadcast_message', {
      success: success,
      message: message,
      priority: priority,
      duration: duration,
      connectedDisplays: connectedDisplays,
      broadcastResult: success ? 'Message broadcast to all displays' : 'Broadcast failed'
    });
  };

  const testConnectionStability = async () => {
    // Test connection stats and stability
    const startTime = Date.now();
    const initialConnectionState = connectionState;
    
    // Wait a few seconds and check if connection is stable
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const endTime = Date.now();
    const connectionDuration = endTime - startTime;
    const finalConnectionState = connectionState;
    
    updateTestResult('connection_stability', {
      success: finalConnectionState === 'connected' && initialConnectionState === 'connected',
      initialState: initialConnectionState,
      finalState: finalConnectionState,
      connectionDuration: connectionDuration,
      reconnectAttempts: connectionStats?.reconnectAttempts || 0,
      message: 'Connection stability test completed'
    });
  };

  // Run all tests
  const runAllTests = async () => {
    setTestStartTime(new Date().toISOString());
    setTestResults({});
    
    console.log('🧪 Starting comprehensive integration tests...');
    
    for (const test of tests) {
      if (currentTest) break; // Don't run if already running
      await runTest(test.id);
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('✅ All tests completed');
  };

  // Auto-run connection test on mount
  useEffect(() => {
    if (isConnected && !testResults.connection) {
      runTest('connection');
    }
  }, [isConnected]);

  // Render test result
  const renderTestResult = (test) => {
    const result = testResults[test.id];
    const isRunning = currentTest === test.id;
    const status = isRunning ? 'running' : result ? (result.success ? 'passed' : 'failed') : 'pending';
    
    const getStatusColor = () => {
      switch (status) {
        case 'passed': return '#10B981';
        case 'failed': return '#EF4444';
        case 'running': return '#F59E0B';
        default: return '#6B7280';
      }
    };

    const getStatusIcon = () => {
      switch (status) {
        case 'passed': return 'checkmark-circle';
        case 'failed': return 'close-circle';
        case 'running': return 'time';
        default: return 'ellipse-outline';
      }
    };

    return (
      <View key={test.id} style={styles.testCard}>
        <View style={styles.testHeader}>
          <View style={styles.testInfo}>
            <View style={styles.testTitleRow}>
              <Ionicons 
                name={getStatusIcon()} 
                size={20} 
                color={getStatusColor()} 
              />
              <Text style={styles.testName}>{test.name}</Text>
            </View>
            <Text style={styles.testDescription}>{test.description}</Text>
          </View>
          
          <TouchableOpacity
            style={[styles.testButton, isRunning && styles.testButtonDisabled]}
            onPress={() => runTest(test.id)}
            disabled={isRunning || !isConnected}
          >
            <Text style={styles.testButtonText}>
              {isRunning ? '⏳' : '▶️'}
            </Text>
          </TouchableOpacity>
        </View>

        {result && (
          <View style={styles.testResult}>
            <Text style={[styles.resultMessage, { color: getStatusColor() }]}>
              {result.message || (result.success ? 'Test passed' : 'Test failed')}
            </Text>
            
            {result.error && (
              <Text style={styles.errorText}>Error: {result.error}</Text>
            )}
            
            {result.success && (
              <View style={styles.resultDetails}>
                {result.alertId && (
                  <Text style={styles.resultDetail}>Alert ID: {result.alertId}</Text>
                )}
                {result.connectedDisplays && (
                  <Text style={styles.resultDetail}>Connected Displays: {result.connectedDisplays}</Text>
                )}
                {result.acknowledgedCount !== undefined && (
                  <Text style={styles.resultDetail}>Acknowledged Alerts: {result.acknowledgedCount}</Text>
                )}
                {result.overrideCount !== undefined && (
                  <Text style={styles.resultDetail}>Priority Overrides: {result.overrideCount}</Text>
                )}
                {result.noteCount !== undefined && (
                  <Text style={styles.resultDetail}>Supervisor Notes: {result.noteCount}</Text>
                )}
              </View>
            )}
            
            <Text style={styles.timestamp}>
              Completed: {new Date(result.completedAt).toLocaleTimeString()}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Calculate test summary
  const completedTests = Object.keys(testResults).length;
  const passedTests = Object.values(testResults).filter(r => r.success).length;
  const failedTests = completedTests - passedTests;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧪 Supervisor ↔ Display Integration Test</Text>
        <Text style={styles.subtitle}>
          Test real-time sync between supervisor controls and display screens
        </Text>
      </View>

      {/* Test Configuration */}
      <View style={styles.configSection}>
        <Text style={styles.configTitle}>⚙️ Test Configuration</Text>
        <View style={styles.configRow}>
          <Text style={styles.configLabel}>Supervisor ID:</Text>
          <TextInput
            style={styles.configInput}
            value={testSupervisorId}
            onChangeText={setTestSupervisorId}
            placeholder="supervisor_id"
          />
        </View>
        <View style={styles.configRow}>
          <Text style={styles.configLabel}>Session ID:</Text>
          <Text style={styles.configValue}>{testSessionId}</Text>
        </View>
        <View style={styles.configRow}>
          <Text style={styles.configLabel}>Connection:</Text>
          <Text style={[styles.configValue, { color: isConnected ? '#10B981' : '#EF4444' }]}>
            {isConnected ? `✅ Connected (${connectedDisplays} displays)` : '❌ Disconnected'}
          </Text>
        </View>
        <View style={styles.configRow}>
          <Text style={styles.configLabel}>Available Alerts:</Text>
          <Text style={styles.configValue}>
            {alertsLoading ? 'Loading...' : `${alerts.length} alerts`}
          </Text>
        </View>
      </View>

      {/* Test Summary */}
      {completedTests > 0 && (
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>📊 Test Summary</Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>{passedTests}</Text>
              <Text style={[styles.summaryLabel, { color: '#10B981' }]}>Passed</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>{failedTests}</Text>
              <Text style={[styles.summaryLabel, { color: '#EF4444' }]}>Failed</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>{tests.length - completedTests}</Text>
              <Text style={[styles.summaryLabel, { color: '#6B7280' }]}>Pending</Text>
            </View>
          </View>
        </View>
      )}

      {/* Control Buttons */}
      <View style={styles.controlSection}>
        <TouchableOpacity
          style={[styles.runAllButton, (!isConnected || currentTest) && styles.buttonDisabled]}
          onPress={runAllTests}
          disabled={!isConnected || currentTest}
        >
          <Text style={styles.runAllButtonText}>
            {currentTest ? '🔄 Running Tests...' : '🧪 Run All Tests'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Individual Tests */}
      <View style={styles.testsSection}>
        <Text style={styles.testsTitle}>🎯 Individual Tests</Text>
        {tests.map(test => renderTestResult(test))}
      </View>

      {/* Instructions */}
      <View style={styles.instructionsSection}>
        <Text style={styles.instructionsTitle}>📋 Testing Instructions</Text>
        <Text style={styles.instructionText}>
          1. Open the Display Screen (/display) in another tab/window
        </Text>
        <Text style={styles.instructionText}>
          2. Ensure both supervisor and display are connected
        </Text>
        <Text style={styles.instructionText}>
          3. Run tests and watch changes appear on display in real-time
        </Text>
        <Text style={styles.instructionText}>
          4. Check display screen for acknowledgments, priority changes, and notes
        </Text>
        <Text style={styles.instructionText}>
          5. Verify broadcast messages appear on display
        </Text>
      </View>
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
    padding: 24,
    paddingTop: Platform.OS === 'web' ? 24 : 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#CBD5E1',
    lineHeight: 24,
  },
  configSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  configTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  configRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  configLabel: {
    fontSize: 14,
    color: '#6B7280',
    width: 120,
  },
  configInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1F2937',
  },
  configValue: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  summarySection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryCard: {
    alignItems: 'center',
    padding: 12,
  },
  summaryNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  controlSection: {
    paddingHorizontal: 16,
  },
  runAllButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  runAllButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  testsSection: {
    paddingHorizontal: 16,
  },
  testsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  testCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  testInfo: {
    flex: 1,
    marginRight: 12,
  },
  testTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  testDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  testButton: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    minWidth: 48,
    alignItems: 'center',
  },
  testButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  testButtonText: {
    fontSize: 18,
  },
  testResult: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  resultMessage: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginBottom: 8,
  },
  resultDetails: {
    marginBottom: 8,
  },
  resultDetail: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 10,
    color: '#9CA3AF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  instructionsSection: {
    backgroundColor: '#F0F9FF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#1E3A8A',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default SupervisorDisplayIntegrationTest;