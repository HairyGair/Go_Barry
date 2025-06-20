import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSupervisorSession } from '../hooks/useSupervisorSession';
import { useSupervisorSync } from '../hooks/useSupervisorSync';

const WebSocketTest = () => {
  const {
    isLoggedIn,
    supervisorSession,
    supervisorName,
    sessionId,
    login
  } = useSupervisorSession();

  const [logs, setLogs] = useState([]);

  // Add log entry
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
  };

  // Test supervisor WebSocket
  const supervisorSync = useSupervisorSync({
    clientType: 'supervisor',
    supervisorId: supervisorSession?.supervisor?.backendId,
    sessionId: sessionId,
    autoConnect: isLoggedIn,
    onConnectionChange: (connected) => {
      addLog(`Supervisor WebSocket: ${connected ? 'Connected' : 'Disconnected'}`, connected ? 'success' : 'error');
    },
    onMessage: (message) => {
      addLog(`Received: ${message.type}`, 'info');
    },
    onError: (error) => {
      addLog(`Error: ${error}`, 'error');
    }
  });

  // Test display WebSocket
  const displaySync = useSupervisorSync({
    clientType: 'display',
    autoConnect: true,
    onConnectionChange: (connected) => {
      addLog(`Display WebSocket: ${connected ? 'Connected' : 'Disconnected'}`, connected ? 'success' : 'warning');
    },
    onMessage: (message) => {
      addLog(`Display received: ${message.type}`, 'warning');
    }
  });

  // Test login
  const testLogin = async () => {
    addLog('Testing login as Alex Woodcock...', 'info');
    const result = await login({
      supervisorId: 'alex_woodcock',
      duty: { id: '100', name: 'Duty 100' }
    });
    
    if (result.success) {
      addLog(`Login successful! Session: ${result.session.sessionId}`, 'success');
      addLog(`Backend ID: ${result.session.supervisor.backendId}`, 'success');
    } else {
      addLog(`Login failed: ${result.error}`, 'error');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>WebSocket Connection Test</Text>
      
      <View style={styles.status}>
        <Text style={styles.statusLabel}>Login Status:</Text>
        <Text style={[styles.statusValue, isLoggedIn ? styles.success : styles.error]}>
          {isLoggedIn ? `Logged in as ${supervisorName}` : 'Not logged in'}
        </Text>
      </View>
      
      <View style={styles.status}>
        <Text style={styles.statusLabel}>Session ID:</Text>
        <Text style={styles.statusValue}>{sessionId || 'None'}</Text>
      </View>
      
      <View style={styles.status}>
        <Text style={styles.statusLabel}>Backend ID:</Text>
        <Text style={styles.statusValue}>{supervisorSession?.supervisor?.backendId || 'None'}</Text>
      </View>
      
      <View style={styles.status}>
        <Text style={styles.statusLabel}>Supervisor WS:</Text>
        <Text style={[styles.statusValue, supervisorSync.isConnected ? styles.success : styles.error]}>
          {supervisorSync.connectionState}
        </Text>
      </View>
      
      <View style={styles.status}>
        <Text style={styles.statusLabel}>Display WS:</Text>
        <Text style={[styles.statusValue, displaySync.isConnected ? styles.success : styles.error]}>
          {displaySync.connectionState}
        </Text>
      </View>
      
      <View style={styles.status}>
        <Text style={styles.statusLabel}>Active Supervisors:</Text>
        <Text style={styles.statusValue}>{displaySync.activeSupervisors?.length || 0}</Text>
      </View>
      
      {!isLoggedIn && (
        <TouchableOpacity style={styles.button} onPress={testLogin}>
          <Text style={styles.buttonText}>Test Login (Alex Woodcock)</Text>
        </TouchableOpacity>
      )}
      
      <ScrollView style={styles.logs}>
        <Text style={styles.logsTitle}>Connection Logs:</Text>
        {logs.map((log, index) => (
          <View key={index} style={styles.logEntry}>
            <Text style={styles.logTime}>{log.timestamp}</Text>
            <Text style={[styles.logMessage, styles[log.type]]}>{log.message}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  status: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  statusLabel: {
    fontWeight: 'bold',
    width: 150,
  },
  statusValue: {
    flex: 1,
    fontFamily: 'monospace',
  },
  success: {
    color: '#10B981',
  },
  error: {
    color: '#EF4444',
  },
  warning: {
    color: '#F59E0B',
  },
  info: {
    color: '#3B82F6',
  },
  button: {
    backgroundColor: '#3B82F6',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  logs: {
    flex: 1,
    marginTop: 20,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  logsTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  logEntry: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  logTime: {
    width: 80,
    fontSize: 12,
    color: '#666',
  },
  logMessage: {
    flex: 1,
    fontSize: 12,
  },
});

export default WebSocketTest;
