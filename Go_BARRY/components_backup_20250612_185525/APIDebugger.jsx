// Go_BARRY/components/APIDebugger.jsx
// Debug component to test API endpoints in real-time

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet,
  Alert
} from 'react-native';

const APIDebugger = () => {
  const [debugLogs, setDebugLogs] = useState([]);
  const [testing, setTesting] = useState(false);

  const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://go-barry.onrender.com';

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev, { 
      message, 
      type, 
      timestamp,
      id: Date.now() 
    }]);
  };

  const clearLogs = () => {
    setDebugLogs([]);
  };

  const testEndpoint = async (endpoint, description) => {
    addLog(`Testing ${description}: ${API_BASE_URL}${endpoint}`, 'info');
    
    try {
      const startTime = Date.now();
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      const duration = Date.now() - startTime;
      
      addLog(`Response: ${response.status} (${duration}ms)`, 
        response.ok ? 'success' : 'error');
      
      if (response.ok) {
        const data = await response.json();
        addLog(`Data: ${JSON.stringify(data).substring(0, 100)}...`, 'success');
        
        if (data.alerts) {
          addLog(`Found ${data.alerts.length} alerts`, 'success');
        }
      } else {
        addLog(`Error: ${response.status} ${response.statusText}`, 'error');
      }
    } catch (error) {
      addLog(`Failed: ${error.message}`, 'error');
    }
  };

  const runFullTest = async () => {
    setTesting(true);
    addLog('🚀 Starting full API test...', 'info');
    
    const endpoints = [
      ['/', 'Root endpoint'],
      ['/api/health', 'Health check'],
      ['/api/status', 'Service status'],
      ['/api/alerts', 'Main alerts'],
      ['/api/alerts-enhanced', 'Enhanced alerts'],
      ['/api/alerts-test', 'Test alerts'],
      ['/api/config', 'API configuration']
    ];

    for (const [endpoint, description] of endpoints) {
      await testEndpoint(endpoint, description);
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    addLog('✅ Full test completed', 'success');
    setTesting(false);
  };

  const getLogStyle = (type) => {
    switch (type) {
      case 'success': return styles.logSuccess;
      case 'error': return styles.logError;
      default: return styles.logInfo;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔧 API Debugger</Text>
        <Text style={styles.subtitle}>Base URL: {API_BASE_URL}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.button, styles.testButton]}
          onPress={runFullTest}
          disabled={testing}
        >
          <Text style={styles.buttonText}>
            {testing ? 'Testing...' : 'Test All Endpoints'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.clearButton]}
          onPress={clearLogs}
        >
          <Text style={styles.buttonText}>Clear Logs</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.logsContainer}>
        <Text style={styles.logsTitle}>Debug Logs:</Text>
        {debugLogs.map((log) => (
          <View key={log.id} style={[styles.logEntry, getLogStyle(log.type)]}>
            <Text style={styles.logTimestamp}>{log.timestamp}</Text>
            <Text style={styles.logMessage}>{log.message}</Text>
          </View>
        ))}
        {debugLogs.length === 0 && (
          <Text style={styles.noLogs}>No logs yet. Tap "Test All Endpoints" to start.</Text>
        )}
      </ScrollView>

      <View style={styles.quickTests}>
        <Text style={styles.quickTestsTitle}>Quick Tests:</Text>
        <TouchableOpacity 
          style={styles.quickButton}
          onPress={() => testEndpoint('/api/alerts', 'Main alerts')}
        >
          <Text style={styles.quickButtonText}>Test Main Alerts</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickButton}
          onPress={() => testEndpoint('/api/alerts-enhanced', 'Enhanced alerts')}
        >
          <Text style={styles.quickButtonText}>Test Enhanced Alerts</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: '#3B82F6',
  },
  clearButton: {
    backgroundColor: '#64748B',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  logsContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  logsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  logEntry: {
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  logInfo: {
    backgroundColor: '#F1F5F9',
  },
  logSuccess: {
    backgroundColor: '#DCFCE7',
  },
  logError: {
    backgroundColor: '#FEE2E2',
  },
  logTimestamp: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: 'monospace',
  },
  logMessage: {
    fontSize: 12,
    color: '#1E293B',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  noLogs: {
    textAlign: 'center',
    color: '#94A3B8',
    fontStyle: 'italic',
    padding: 20,
  },
  quickTests: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
  },
  quickTestsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  quickButton: {
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  quickButtonText: {
    fontSize: 12,
    color: '#3B82F6',
    textAlign: 'center',
  },
});

export default APIDebugger;
