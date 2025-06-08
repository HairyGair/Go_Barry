// Go_BARRY/app/(tabs)/home.jsx
// EMERGENCY SAFE VERSION - Minimal imports to avoid errors
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DUTIES = [
  { key: '100', label: 'Duty 100 (6am-3:30pm)', password: null },
  { key: '200', label: 'Duty 200 (7:30am-5pm)', password: null },
  { key: '400', label: 'Duty 400 (12:30pm-10pm)', password: null },
  { key: '500', label: 'Duty 500 (2:45pm-12:15am)', password: null },
  { key: 'xops', label: 'XOps', password: null }
];

// EMERGENCY: Simple direct API URL to avoid config import issues
const API_BASE_URL = 'https://go-barry.onrender.com';

export default function HomeScreen() {
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Duty state
  const [currentDuty, setCurrentDuty] = useState(null);
  const [showDutyModal, setShowDutyModal] = useState(false);
  const [selectedDuty, setSelectedDuty] = useState(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [dutyError, setDutyError] = useState('');

  const fetchSystemStatus = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching system status from:', API_BASE_URL);
      
      const response = await fetch(`${API_BASE_URL}/api/health`, {
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
        `Unable to connect to BARRY backend:\n\n${error.message}\n\nBackend: ${API_BASE_URL}`,
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
    AsyncStorage.getItem('barry_duty').then(duty => {
      if (duty) setCurrentDuty(JSON.parse(duty));
      else setShowDutyModal(true);
    });
  }, []);

  // Duty handlers
  const handleDutySelect = (duty) => {
    setSelectedDuty(duty);
    setPasswordInput('');
    setDutyError('');
    if (!duty.password) handleDutyConfirm(duty, '');
  };

  const handleDutyConfirm = (duty, password) => {
    if (duty.password && password !== duty.password) {
      setDutyError('Incorrect password');
      return;
    }
    setCurrentDuty(duty);
    AsyncStorage.setItem('barry_duty', JSON.stringify(duty));
    setShowDutyModal(false);
    setSelectedDuty(null);
    setPasswordInput('');
    setDutyError('');
  };

  const handleChangeDuty = () => setShowDutyModal(true);

  const handleQuickAction = async (action) => {
    try {
      setLoading(true);
      
      switch (action) {
        case 'refresh':
          console.log('🔄 Refreshing data...');
          await fetch(`${API_BASE_URL}/api/refresh`);
          await fetchSystemStatus();
          Alert.alert('Success', 'Data refreshed successfully');
          break;
          
        case 'test':
          console.log('🧪 Testing alerts API...');
          const response = await fetch(`${API_BASE_URL}/api/alerts`);
          const data = await response.json();
          Alert.alert(
            'API Test Results', 
            `Status: ${data.success ? '✅ Success' : '❌ Failed'}\nAlerts Found: ${data.alerts?.length || 0}\n\nBackend: ${API_BASE_URL}`,
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
        <Text style={styles.loadingSubtext}>{API_BASE_URL}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLogoContainer}>
          <View style={styles.headerLogo}>
            {/* Logo placeholder - React Native Image component would be used here */}
            <Text style={styles.headerLogoText}>GO BARRY</Text>
          </View>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>BARRY Control</Text>
            <Text style={styles.subtitle}>Bus Alerts and Roadworks Reporting for You</Text>
          </View>
        </View>
        
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

      {/* Duty status display */}
      {currentDuty && (
        <View style={styles.dutyContainer}>
          <Text style={styles.dutyLabel}>Current Duty:</Text>
          <Text style={styles.dutyText}>{currentDuty.label}</Text>
          <TouchableOpacity onPress={handleChangeDuty} style={styles.changeDutyButton}>
            <Text style={styles.changeDutyText}>Change Duty</Text>
          </TouchableOpacity>
        </View>
      )}

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

      {/* Debug Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Info</Text>
        
        <View style={styles.debugCard}>
          <Text style={styles.debugLabel}>Backend URL:</Text>
          <Text style={styles.debugValue}>{API_BASE_URL}</Text>
        </View>

        <View style={styles.debugCard}>
          <Text style={styles.debugLabel}>Status:</Text>
          <Text style={styles.debugValue}>
            {systemStatus ? 'Connected' : 'Not Connected'}
          </Text>
        </View>

        <View style={styles.debugCard}>
          <Text style={styles.debugLabel}>App Version:</Text>
          <Text style={styles.debugValue}>Emergency Safe Mode</Text>
        </View>
      </View>

      {/* Duty modal */}
      <Modal visible={showDutyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sign in for your duty</Text>
            {DUTIES.map((duty) => (
              <TouchableOpacity
                key={duty.key}
                style={[
                  styles.dutyOption,
                  selectedDuty && selectedDuty.key === duty.key && styles.dutyOptionSelected
                ]}
                onPress={() => handleDutySelect(duty)}
              >
                <Text style={styles.dutyOptionText}>{duty.label}</Text>
              </TouchableOpacity>
            ))}
            {selectedDuty && selectedDuty.password && (
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={passwordInput}
                  onChangeText={setPasswordInput}
                  placeholder="Password"
                  placeholderTextColor="#999"
                  secureTextEntry
                />
                <TouchableOpacity
                  onPress={() => handleDutyConfirm(selectedDuty, passwordInput)}
                  style={styles.confirmButton}
                >
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                </TouchableOpacity>
                {dutyError ? <Text style={styles.dutyErrorText}>{dutyError}</Text> : null}
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  headerLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  headerLogo: {
    width: 50,
    height: 50,
    backgroundColor: '#E31E24',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerLogoText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
  },
  headerTitleContainer: {
    flex: 1,
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
  dutyContainer: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 8,
    margin: 16,
    alignItems: 'center',
  },
  dutyLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 4,
  },
  dutyText: {
    color: '#60A5FA',
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 8,
  },
  changeDutyButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  changeDutyText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    minWidth: 300,
    alignItems: 'center',
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 18,
    color: '#1F2937',
  },
  dutyOption: {
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  dutyOptionSelected: {
    backgroundColor: '#60A5FA',
  },
  dutyOptionText: {
    fontSize: 16,
    color: '#1F2937',
  },
  passwordContainer: {
    marginTop: 14,
    width: '100%',
    alignItems: 'center',
  },
  passwordInput: {
    width: '100%',
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: '#2563EB',
    padding: 10,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  dutyErrorText: {
    color: '#EF4444',
    marginTop: 8,
    fontSize: 14,
  },
});