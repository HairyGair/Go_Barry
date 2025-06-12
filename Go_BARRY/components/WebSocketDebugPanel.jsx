// Go_BARRY/components/WebSocketDebugPanel.jsx
// Debug panel to show WebSocket connection status and messages

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const WebSocketDebugPanel = ({ 
  connectionState, 
  isConnected, 
  lastError, 
  connectionStats,
  activeSupervisors,
  connectedSupervisors,
  clientType,
  supervisorId
}) => {
  const [expanded, setExpanded] = React.useState(false);
  const [logs, setLogs] = React.useState([]);

  // Add log entry
  const addLog = (message, type = 'info') => {
    setLogs(prev => [...prev.slice(-19), {
      time: new Date().toLocaleTimeString(),
      message,
      type
    }]);
  };

  React.useEffect(() => {
    addLog(`Client type: ${clientType}`, 'info');
    if (supervisorId) {
      addLog(`Supervisor ID: ${supervisorId}`, 'info');
    }
  }, [clientType, supervisorId]);

  React.useEffect(() => {
    addLog(`Connection state: ${connectionState}`, isConnected ? 'success' : 'warning');
  }, [connectionState, isConnected]);

  React.useEffect(() => {
    if (lastError) {
      addLog(`Error: ${lastError}`, 'error');
    }
  }, [lastError]);

  React.useEffect(() => {
    addLog(`Active supervisors: ${activeSupervisors?.length || 0}`, 'info');
  }, [activeSupervisors]);

  const getStatusColor = () => {
    if (isConnected) return '#10B981';
    if (connectionState === 'connecting' || connectionState === 'reconnecting') return '#F59E0B';
    return '#EF4444';
  };

  if (!expanded) {
    return (
      <TouchableOpacity 
        style={[styles.collapsedPanel, { borderColor: getStatusColor() }]}
        onPress={() => setExpanded(true)}
      >
        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
        <Text style={styles.collapsedText}>WS Debug</Text>
        <Ionicons name="chevron-up" size={16} color="#6B7280" />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <Text style={styles.title}>WebSocket Debug</Text>
        <TouchableOpacity onPress={() => setExpanded(false)}>
          <Ionicons name="chevron-down" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.statusSection}>
        <View style={styles.statusRow}>
          <Text style={styles.label}>Connection:</Text>
          <View style={styles.statusValue}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <Text style={[styles.value, { color: getStatusColor() }]}>
              {connectionState.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.label}>Client Type:</Text>
          <Text style={styles.value}>{clientType}</Text>
        </View>

        {supervisorId && (
          <View style={styles.statusRow}>
            <Text style={styles.label}>Supervisor ID:</Text>
            <Text style={styles.value}>{supervisorId}</Text>
          </View>
        )}

        <View style={styles.statusRow}>
          <Text style={styles.label}>Connected Since:</Text>
          <Text style={styles.value}>
            {connectionStats?.connectedAt 
              ? new Date(connectionStats.connectedAt).toLocaleTimeString()
              : 'Not connected'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.label}>Reconnect Attempts:</Text>
          <Text style={styles.value}>{connectionStats?.reconnectAttempts || 0}</Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.label}>Active Supervisors:</Text>
          <Text style={styles.value}>{connectedSupervisors || 0}</Text>
        </View>

        {activeSupervisors && activeSupervisors.length > 0 && (
          <View style={styles.supervisorList}>
            <Text style={styles.listTitle}>Connected Users:</Text>
            {activeSupervisors.map((sup, index) => (
              <Text key={sup.id || index} style={styles.supervisorItem}>
                • {sup.name || 'Unknown'} ({sup.role || 'Supervisor'})
              </Text>
            ))}
          </View>
        )}
      </View>

      <View style={styles.logSection}>
        <Text style={styles.logTitle}>Connection Log:</Text>
        <ScrollView style={styles.logScroll} showsVerticalScrollIndicator={false}>
          {logs.map((log, index) => (
            <View key={index} style={styles.logEntry}>
              <Text style={[styles.logTime, { color: '#6B7280' }]}>
                [{log.time}]
              </Text>
              <Text style={[
                styles.logMessage,
                log.type === 'error' && { color: '#EF4444' },
                log.type === 'success' && { color: '#10B981' },
                log.type === 'warning' && { color: '#F59E0B' }
              ]}>
                {log.message}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {lastError && (
        <View style={styles.errorSection}>
          <Text style={styles.errorLabel}>Last Error:</Text>
          <Text style={styles.errorText}>{lastError}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  collapsedPanel: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1000,
  },
  collapsedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  panel: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 350,
    maxHeight: 500,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statusSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  value: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '600',
  },
  statusValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  supervisorList: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  listTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  supervisorItem: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 8,
    marginBottom: 2,
  },
  logSection: {
    padding: 16,
    maxHeight: 200,
  },
  logTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  logScroll: {
    maxHeight: 150,
  },
  logEntry: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  logTime: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
  logMessage: {
    fontSize: 10,
    flex: 1,
    color: '#1F2937',
  },
  errorSection: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  errorLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 11,
    color: '#991B1B',
  },
});

export default WebSocketDebugPanel;
