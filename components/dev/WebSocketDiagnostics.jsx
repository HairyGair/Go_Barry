import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const WebSocketDiagnostics = () => {
  const [logs, setLogs] = useState([]);
  const [ws, setWs] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);

  const addLog = (message, type = 'info', data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [{
      id: Date.now(),
      timestamp,
      message,
      type,
      data
    }, ...prev].slice(0, 50)); // Keep last 50 logs
  };

  // Test 1: Check Backend Health
  const testBackendHealth = async () => {
    addLog('Testing backend health...', 'info');
    try {
      const response = await fetch('https://go-barry.onrender.com/api/health');
      const data = await response.json();
      addLog('Backend health check passed', 'success', data);
    } catch (error) {
      addLog('Backend health check failed', 'error', error.message);
    }
  };

  // Test 2: Create Test Session
  const createTestSession = async () => {
    addLog('Creating test supervisor session...', 'info');
    try {
      const response = await fetch('https://go-barry.onrender.com/api/supervisor/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supervisorId: 'supervisor001',
          badge: 'AW001'
        })
      });
      const data = await response.json();
      
      if (data.success) {
        setSessionInfo(data);
        addLog(`Session created: ${data.sessionId}`, 'success', data);
        return data.sessionId;
      } else {
        addLog('Failed to create session', 'error', data);
        return null;
      }
    } catch (error) {
      addLog('Session creation error', 'error', error.message);
      return null;
    }
  };

  // Test 3: Check Active Sessions
  const checkActiveSessions = async () => {
    addLog('Checking active sessions...', 'info');
    try {
      const response = await fetch('https://go-barry.onrender.com/api/supervisor/debug/sessions');
      const data = await response.json();
      addLog(`Found ${data.activeSessions} active sessions`, 'info', data);
    } catch (error) {
      addLog('Failed to check sessions', 'error', error.message);
    }
  };

  // Test 4: Connect WebSocket as Display
  const connectAsDisplay = () => {
    addLog('Connecting WebSocket as DISPLAY...', 'info');
    
    if (ws) {
      ws.close();
    }

    const websocket = new WebSocket('wss://go-barry.onrender.com/ws/supervisor-sync');
    
    websocket.onopen = () => {
      addLog('Display WebSocket connected', 'success');
      const authMessage = {
        type: 'auth',
        clientType: 'display'
      };
      websocket.send(JSON.stringify(authMessage));
      addLog('Sent display auth message', 'info', authMessage);
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      addLog(`Display received: ${data.type}`, 'info', data);
      
      if (data.type === 'auth_success') {
        addLog('Display authenticated successfully', 'success');
        addLog(`Connected supervisors: ${data.connectedSupervisors}`, 'info');
      } else if (data.type === 'supervisor_list_updated') {
        addLog(`Supervisor list updated: ${data.supervisors?.length || 0} supervisors`, 'success', data.supervisors);
      }
    };

    websocket.onerror = (error) => {
      addLog('Display WebSocket error', 'error', error.message);
    };

    websocket.onclose = () => {
      addLog('Display WebSocket closed', 'warning');
    };

    setWs(websocket);
  };

  // Test 5: Connect WebSocket as Supervisor
  const connectAsSupervisor = async () => {
    if (!sessionInfo) {
      addLog('No session available, creating one...', 'warning');
      const sessionId = await createTestSession();
      if (!sessionId) return;
    }

    addLog('Connecting WebSocket as SUPERVISOR...', 'info');
    
    const supervisorWs = new WebSocket('wss://go-barry.onrender.com/ws/supervisor-sync');
    
    supervisorWs.onopen = () => {
      addLog('Supervisor WebSocket connected', 'success');
      const authMessage = {
        type: 'auth',
        clientType: 'supervisor',
        supervisorId: 'supervisor001',
        sessionId: sessionInfo.sessionId
      };
      supervisorWs.send(JSON.stringify(authMessage));
      addLog('Sent supervisor auth message', 'info', authMessage);
    };

    supervisorWs.onmessage = (event) => {
      const data = JSON.parse(event.data);
      addLog(`Supervisor received: ${data.type}`, 'info', data);
      
      if (data.type === 'auth_success') {
        addLog('Supervisor authenticated successfully!', 'success');
        addLog(`Connected displays: ${data.connectedDisplays}`, 'info');
      } else if (data.type === 'auth_failed') {
        addLog('Supervisor auth failed!', 'error', data);
      }
    };

    supervisorWs.onerror = (error) => {
      addLog('Supervisor WebSocket error', 'error', error.message);
    };

    supervisorWs.onclose = () => {
      addLog('Supervisor WebSocket closed', 'warning');
    };

    // Close after 5 seconds to avoid keeping connections open
    setTimeout(() => {
      supervisorWs.close();
      addLog('Closed supervisor WebSocket (cleanup)', 'info');
    }, 5000);
  };

  // Test 6: Full Flow Test
  const runFullTest = async () => {
    addLog('=== STARTING FULL DIAGNOSTIC TEST ===', 'warning');
    
    // Step 1: Backend health
    await testBackendHealth();
    
    // Step 2: Create session
    await createTestSession();
    
    // Step 3: Check sessions
    await checkActiveSessions();
    
    // Step 4: Connect display
    connectAsDisplay();
    
    // Step 5: Wait then connect supervisor
    setTimeout(async () => {
      await connectAsSupervisor();
    }, 2000);
    
    addLog('=== TEST SEQUENCE INITIATED ===', 'warning');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (ws) ws.close();
    };
  }, [ws]);

  const getLogColor = (type) => {
    switch (type) {
      case 'success': return '#10B981';
      case 'error': return '#EF4444';
      case 'warning': return '#F59E0B';
      default: return '#3B82F6';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>WebSocket Diagnostics</Text>
        <Text style={styles.subtitle}>Debug supervisor-display connection issues</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={runFullTest}>
          <Ionicons name="play-circle" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Run Full Test</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testBackendHealth}>
          <Text style={styles.buttonTextSecondary}>Test Backend</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={createTestSession}>
          <Text style={styles.buttonTextSecondary}>Create Session</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={checkActiveSessions}>
          <Text style={styles.buttonTextSecondary}>Check Sessions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={connectAsDisplay}>
          <Text style={styles.buttonTextSecondary}>Connect Display</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={connectAsSupervisor}>
          <Text style={styles.buttonTextSecondary}>Connect Supervisor</Text>
        </TouchableOpacity>
      </View>

      {sessionInfo && (
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionTitle}>Current Session:</Text>
          <Text style={styles.sessionId}>{sessionInfo.sessionId}</Text>
          <Text style={styles.sessionDetails}>
            Supervisor: {sessionInfo.supervisor?.name} ({sessionInfo.supervisor?.id})
          </Text>
        </View>
      )}

      <ScrollView style={styles.logs}>
        {logs.map(log => (
          <View key={log.id} style={styles.logEntry}>
            <Text style={styles.logTime}>{log.timestamp}</Text>
            <Text style={[styles.logMessage, { color: getLogColor(log.type) }]}>
              {log.message}
            </Text>
            {log.data && (
              <Text style={styles.logData}>
                {JSON.stringify(log.data, null, 2)}
              </Text>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>How to use:</Text>
        <Text style={styles.instructionText}>
          1. Click "Run Full Test" to run complete diagnostic{'\n'}
          2. Watch the logs for any errors{'\n'}
          3. Check if supervisor appears in display after connection{'\n'}
          4. Share the log output if issues persist
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#374151',
    fontWeight: '500',
  },
  sessionInfo: {
    backgroundColor: '#F0FDF4',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
  },
  sessionId: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#166534',
    marginTop: 4,
  },
  sessionDetails: {
    fontSize: 12,
    color: '#166534',
    marginTop: 4,
  },
  logs: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  logEntry: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  logTime: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  logMessage: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  logData: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: 'monospace',
    marginTop: 4,
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 4,
  },
  instructions: {
    backgroundColor: '#EBF8FF',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A8A',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 12,
    color: '#1E3A8A',
    lineHeight: 18,
  },
});

export default WebSocketDiagnostics;
