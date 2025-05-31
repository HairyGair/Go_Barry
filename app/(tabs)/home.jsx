// Go_BARRY/app/(tabs)/home.jsx
// Clean version with no external icon dependencies
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';

export default function HomeScreen() {
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const baseUrl = 'https://go-barry.onrender.com';

  const fetchSystemStatus = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching system status from:', `${baseUrl}/api/health`);
      
      const response = await fetch(`${baseUrl}/api/health`, {
        timeout: 10000
      });
      
      console.log('📡 Health response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Health data:', data);
      
      setSystemStatus(data);
      setLastUpdate(new Date());
      
    } catch (error) {
      console.error('❌ Health check failed:', error);
      Alert.alert(
        'Connection Error',
        `Unable to connect to BARRY backend:\n\n${error.message}\n\nBackend: ${baseUrl}`,
        [
          { text: 'OK' },
          { text: 'Retry', onPress: fetchSystemStatus }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemStatus();
  }, []);

  const handleQuickAction = async (action) => {
    try {
      setLoading(true);
      
      switch (action) {
        case 'refresh':
          console.log('🔄 Refreshing data...');
          await fetch(`${baseUrl}/api/refresh`);
          await fetchSystemStatus();
          Alert.alert('Success', 'Data refreshed successfully');
          break;
          
        case 'test':
          console.log('🧪 Testing alerts API...');
          const response = await fetch(`${baseUrl}/api/alerts`);
          const data = await response.json();
          Alert.alert(
            'API Test Results', 
            `Status: ${data.success ? '✅ Success' : '❌ Failed'}\nAlerts Found: ${data.alerts?.length || 0}\n\nBackend: ${baseUrl}`,
            [{ text: 'OK' }]
          );
          break;
      }
    } catch (error) {
      Alert.alert('Error', `Action failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !systemStatus) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#60A5FA" />
        <Text style={styles.loadingText}>Connecting to BARRY...</Text>
        <Text style={styles.loadingSubtext}>{baseUrl}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🚦 BARRY Control</Text>
        <Text style={styles.subtitle}>Bus Alerts and Roadworks Reporting for You</Text>
        
        {/* Connection Status */}
        <View style={styles.statusContainer}>
          {systemStatus ? (
            <View style={styles.statusRow}>
              <Text style={styles.statusIcon}>📶</Text>
              <Text style={styles.statusText}>Connected</Text>
              {lastUpdate && (
                <Text style={styles.lastUpdateText}>
                  • {lastUpdate.toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.statusRow}>
              <Text style={styles.statusIcon}>📵</Text>
              <Text style={[styles.statusText, { color: '#EF4444' }]}>Disconnected</Text>
            </View>
          )}
        </View>
      </View>

      {/* System Overview */}
      {systemStatus && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Status</Text>
          
          <View style={styles.statusGrid}>
            <View style={styles.statusCard}>
              <Text style={styles.statusCardIcon}>✅</Text>
              <Text style={styles.statusCardTitle}>Backend</Text>
              <Text style={styles.statusCardValue}>
                {systemStatus.status === 'healthy' ? 'Healthy' : 'Issues'}
              </Text>
              <Text style={styles.statusCardSubtext}>
                v{systemStatus.version || '1.0'}
              </Text>
            </View>

            <View style={styles.statusCard}>
              <Text style={styles.statusCardIcon}>🚨</Text>
              <Text style={styles.statusCardTitle}>Alerts</Text>
              <Text style={styles.statusCardValue}>
                {systemStatus.cachedAlerts || 0}
              </Text>
              <Text style={styles.statusCardSubtext}>
                Total cached
              </Text>
            </View>

            <View style={styles.statusCard}>
              <Text style={styles.statusCardIcon}>📍</Text>
              <Text style={styles.statusCardTitle}>Location</Text>
              <Text style={styles.statusCardValue}>
                North East
              </Text>
              <Text style={styles.statusCardSubtext}>
                Coverage area
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Data Sources */}
      {systemStatus?.configuration && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Sources</Text>
          
          <View style={styles.sourceCard}>
            <View style={styles.sourceHeader}>
              <Text style={styles.sourceIndicator}>
                {systemStatus.configuration.nationalHighways ? '🟢' : '🔴'}
              </Text>
              <Text style={styles.sourceName}>National Highways</Text>
            </View>
            <Text style={styles.sourceDescription}>
              {systemStatus.configuration.nationalHighways 
                ? 'API configured - Major road incidents and closures'
                : 'Not configured - Missing API key'
              }
            </Text>
          </View>

          <View style={styles.sourceCard}>
            <View style={styles.sourceHeader}>
              <Text style={styles.sourceIndicator}>🟡</Text>
              <Text style={styles.sourceName}>Street Manager</Text>
            </View>
            <Text style={styles.sourceDescription}>
              Webhook integration - Local authority roadworks
            </Text>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleQuickAction('refresh')}
          disabled={loading}
        >
          <Text style={styles.actionButtonIcon}>🔄</Text>
          <Text style={styles.actionButtonText}>Refresh Data</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => handleQuickAction('test')}
          disabled={loading}
        >
          <Text style={styles.actionButtonIcon}>🧪</Text>
          <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Test API</Text>
        </TouchableOpacity>
      </View>

      {/* API Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Information</Text>
        
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Backend URL:</Text>
          <Text style={styles.infoValue}>{baseUrl}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Main Endpoint:</Text>
          <Text style={styles.infoValue}>{baseUrl}/api/alerts</Text>
        </View>

        {systemStatus?.uptime && (
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Uptime:</Text>
            <Text style={styles.infoValue}>
              {Math.floor(systemStatus.uptime / 3600)}h {Math.floor((systemStatus.uptime % 3600) / 60)}m
            </Text>
          </View>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Getting Started</Text>
        
        <View style={styles.instructionCard}>
          <Text style={styles.instructionStep}>1️⃣</Text>
          <Text style={styles.instructionText}>
            Check the Dashboard tab for traffic overview
          </Text>
        </View>

        <View style={styles.instructionCard}>
          <Text style={styles.instructionStep}>2️⃣</Text>
          <Text style={styles.instructionText}>
            View detailed alerts in the Alerts tab
          </Text>
        </View>

        <View style={styles.instructionCard}>
          <Text style={styles.instructionStep}>3️⃣</Text>
          <Text style={styles.instructionText}>
            Configure settings and data sources in Settings
          </Text>
        </View>
      </View>

      {/* Debug Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Debug Info</Text>
        
        <View style={styles.debugCard}>
          <Text style={styles.debugLabel}>Last Status Check:</Text>
          <Text style={styles.debugValue}>
            {lastUpdate ? lastUpdate.toLocaleString('en-GB') : 'Never'}
          </Text>
        </View>

        <View style={styles.debugCard}>
          <Text style={styles.debugLabel}>App Mode:</Text>
          <Text style={styles.debugValue}>Mobile Production</Text>
        </View>

        <View style={styles.debugCard}>
          <Text style={styles.debugLabel}>Backend Status:</Text>
          <Text style={styles.debugValue}>
            {systemStatus ? 'Connected' : 'Not Connected'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 16,
    marginTop: 12,
  },
  loadingSubtext: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'monospace',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 16,
    marginBottom: 16,
  },
  statusContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  statusText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '500',
  },
  lastUpdateText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginLeft: 8,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statusCard: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statusCardIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statusCardTitle: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  statusCardValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusCardSubtext: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
  },
  sourceCard: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sourceIndicator: {
    fontSize: 16,
    marginRight: 12,
  },
  sourceName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sourceDescription: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#60A5FA',
  },
  actionButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#60A5FA',
  },
  infoCard: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  infoLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 4,
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'monospace',
  },
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  instructionStep: {
    fontSize: 18,
    marginRight: 12,
    minWidth: 30,
  },
  instructionText: {
    color: '#D1D5DB',
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
  debugCard: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  debugLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 4,
  },
  debugValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'monospace',
  },
});