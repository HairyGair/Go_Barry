// Go_BARRY/app/(tabs)/settings.jsx
// Updated to use centralized API configuration
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert
} from 'react-native';
import { API_CONFIG, ENV_INFO, testApiConnectivity } from '../../config/api';

export default function SettingsScreen() {
  const [settings, setSettings] = useState({
    apiUrl: API_CONFIG.baseURL,
    autoRefresh: true,
    refreshInterval: API_CONFIG.refreshIntervals.alerts / (60 * 1000), // Convert to minutes
    enableNotifications: false,
    showDebugInfo: false,
    darkMode: true
  });

  const [tempApiUrl, setTempApiUrl] = useState(settings.apiUrl);

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = () => {
    const newSettings = {
      ...settings,
      apiUrl: tempApiUrl
    };
    
    setSettings(newSettings);
    Alert.alert('Settings Saved', 'Your preferences have been saved successfully.');
  };

  const testConnection = async () => {
    try {
      const result = await testApiConnectivity();
      
      if (result.success) {
        Alert.alert(
          'Connection Test',
          `✅ Success!\n\nHealth: ${result.health?.status}\nUptime: ${result.health?.uptime ? Math.floor(result.health.uptime / 3600) + 'h ' + Math.floor((result.health.uptime % 3600) / 60) + 'm' : 'Unknown'}\nTest Alerts: ${result.testAlerts}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Connection Failed', `❌ ${result.error}`);
      }
    } catch (error) {
      Alert.alert('Connection Failed', `❌ ${error.message}`);
    }
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset Settings',
      'Reset all settings to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setSettings({
              apiUrl: API_CONFIG.baseURL,
              autoRefresh: true,
              refreshInterval: API_CONFIG.refreshIntervals.alerts / (60 * 1000),
              enableNotifications: false,
              showDebugInfo: false,
              darkMode: true
            });
            setTempApiUrl(API_CONFIG.baseURL);
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>⚙️ Settings</Text>
        <Text style={styles.subtitle}>Configure BARRY preferences</Text>
        
        {/* Environment Badge */}
        <View style={styles.environmentContainer}>
          <Text style={styles.environmentText}>
            {ENV_INFO.isDevelopment ? '🔧 Development Environment' : '🚀 Production Environment'}
          </Text>
        </View>
      </View>

      {/* API Configuration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📡 API Configuration</Text>
        
        <View style={styles.settingCard}>
          <Text style={styles.settingLabel}>Backend URL</Text>
          <Text style={styles.settingDescription}>BARRY backend server endpoint</Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={tempApiUrl}
              onChangeText={setTempApiUrl}
              placeholder={API_CONFIG.baseURL}
              placeholderTextColor="#6B7280"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.testButton} onPress={testConnection}>
              <Text style={styles.testButtonText}>Test</Text>
            </TouchableOpacity>
          </View>
          
          {/* Current vs Default URLs */}
          <View style={styles.urlComparison}>
            <Text style={styles.urlLabel}>Default ({ENV_INFO.isDevelopment ? 'Dev' : 'Prod'}):</Text>
            <Text style={styles.urlText}>{API_CONFIG.baseURL}</Text>
            {API_CONFIG.fallbackURL !== API_CONFIG.baseURL && (
              <>
                <Text style={styles.urlLabel}>Fallback:</Text>
                <Text style={styles.urlText}>{API_CONFIG.fallbackURL}</Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Auto Refresh</Text>
              <Text style={styles.settingDescription}>Automatically update alerts</Text>
            </View>
            <Switch
              value={settings.autoRefresh}
              onValueChange={(value) => updateSetting('autoRefresh', value)}
              trackColor={{ false: '#374151', true: '#2563EB' }}
              thumbColor={settings.autoRefresh ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>
        </View>

        <View style={styles.settingCard}>
          <Text style={styles.settingLabel}>Refresh Interval</Text>
          <Text style={styles.settingDescription}>How often to check for new data (minutes)</Text>
          
          <View style={styles.intervalContainer}>
            {[1, 3, 5, 10, 15].map(interval => (
              <TouchableOpacity
                key={interval}
                style={[
                  styles.intervalButton,
                  settings.refreshInterval === interval && styles.intervalButtonActive
                ]}
                onPress={() => updateSetting('refreshInterval', interval)}
              >
                <Text style={[
                  styles.intervalButtonText,
                  settings.refreshInterval === interval && styles.intervalButtonTextActive
                ]}>
                  {interval}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Show current configured intervals */}
          <View style={styles.configuredIntervals}>
            <Text style={styles.configLabel}>Configured Intervals:</Text>
            <Text style={styles.configText}>
              Alerts: {API_CONFIG.refreshIntervals.alerts / (60 * 1000)}m, 
              Dashboard: {API_CONFIG.refreshIntervals.dashboard / 1000}s, 
              Operational: {API_CONFIG.refreshIntervals.operational / (60 * 1000)}m
            </Text>
          </View>
        </View>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔔 Notifications</Text>
        
        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Enable Notifications</Text>
              <Text style={styles.settingDescription}>Get notified about new alerts</Text>
            </View>
            <Switch
              value={settings.enableNotifications}
              onValueChange={(value) => updateSetting('enableNotifications', value)}
              trackColor={{ false: '#374151', true: '#2563EB' }}
              thumbColor={settings.enableNotifications ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>
        </View>
      </View>

      {/* Display */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎨 Display Options</Text>
        
        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Dark Mode</Text>
              <Text style={styles.settingDescription}>Use dark theme (recommended)</Text>
            </View>
            <Switch
              value={settings.darkMode}
              onValueChange={(value) => updateSetting('darkMode', value)}
              trackColor={{ false: '#374151', true: '#2563EB' }}
              thumbColor={settings.darkMode ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>
        </View>

        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Show Debug Info</Text>
              <Text style={styles.settingDescription}>Display technical information</Text>
            </View>
            <Switch
              value={settings.showDebugInfo}
              onValueChange={(value) => updateSetting('showDebugInfo', value)}
              trackColor={{ false: '#374151', true: '#2563EB' }}
              thumbColor={settings.showDebugInfo ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>
        </View>
      </View>

      {/* API Configuration Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔧 API Details</Text>
        
        <View style={styles.configCard}>
          <Text style={styles.configTitle}>Endpoints:</Text>
          {Object.entries(API_CONFIG.endpoints).map(([key, path]) => (
            <Text key={key} style={styles.configItem}>
              {key}: {path}
            </Text>
          ))}
        </View>

        <View style={styles.configCard}>
          <Text style={styles.configTitle}>Timeouts:</Text>
          <Text style={styles.configItem}>Default: {API_CONFIG.timeouts.default}ms</Text>
          <Text style={styles.configItem}>Health: {API_CONFIG.timeouts.health}ms</Text>
          <Text style={styles.configItem}>Alerts: {API_CONFIG.timeouts.alerts}ms</Text>
        </View>

        <View style={styles.configCard}>
          <Text style={styles.configTitle}>Retry Configuration:</Text>
          <Text style={styles.configItem}>Attempts: {API_CONFIG.retry.attempts}</Text>
          <Text style={styles.configItem}>Delay: {API_CONFIG.retry.delay}ms</Text>
        </View>
      </View>

      {/* Coverage Areas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📍 Coverage Areas</Text>
        
        <View style={styles.coverageCard}>
          <Text style={styles.coverageTitle}>🏙️ Newcastle</Text>
          <Text style={styles.coverageDescription}>City centre, Quayside, Central Motorway</Text>
        </View>

        <View style={styles.coverageCard}>
          <Text style={styles.coverageTitle}>🌊 Sunderland</Text>
          <Text style={styles.coverageDescription}>City centre, A19 corridor, seafront</Text>
        </View>

        <View style={styles.coverageCard}>
          <Text style={styles.coverageTitle}>🏰 Durham</Text>
          <Text style={styles.coverageDescription}>City centre, A167 corridor, university</Text>
        </View>

        <View style={styles.coverageCard}>
          <Text style={styles.coverageTitle}>🛣️ Major Roads</Text>
          <Text style={styles.coverageDescription}>A1, A19, A69, A167, A1058, Tyne Tunnel</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
          <Text style={styles.saveButtonText}>💾 Save Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetButton} onPress={resetToDefaults}>
          <Text style={styles.resetButtonText}>🔄 Reset to Defaults</Text>
        </TouchableOpacity>
      </View>

      {/* Current Settings Display */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Current Configuration</Text>
        
        <View style={styles.configCard}>
          <Text style={styles.configItem}>Backend: {settings.apiUrl}</Text>
          <Text style={styles.configItem}>Environment: {ENV_INFO.isDevelopment ? 'Development' : 'Production'}</Text>
          <Text style={styles.configItem}>Auto Refresh: {settings.autoRefresh ? 'On' : 'Off'}</Text>
          <Text style={styles.configItem}>Interval: {settings.refreshInterval} minutes</Text>
          <Text style={styles.configItem}>Notifications: {settings.enableNotifications ? 'On' : 'Off'}</Text>
          <Text style={styles.configItem}>Debug Mode: {settings.showDebugInfo ? 'On' : 'Off'}</Text>
          <Text style={styles.configItem}>Config Version: {ENV_INFO.version}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Settings are saved locally on your device.
        </Text>
        <Text style={styles.footerSubtext}>
          BARRY v{ENV_INFO.version} - Configuration Panel
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
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
    marginBottom: 12,
  },
  environmentContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  environmentText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingCard: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    backgroundColor: '#374151',
    borderRadius: 6,
    padding: 12,
  },
  testButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 6,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  urlComparison: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#374151',
    borderRadius: 6,
  },
  urlLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
  urlText: {
    color: '#D1D5DB',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  intervalContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  intervalButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  intervalButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  intervalButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  intervalButtonTextActive: {
    color: '#FFFFFF',
  },
  configuredIntervals: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#374151',
    borderRadius: 6,
  },
  configLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 4,
  },
  configText: {
    color: '#D1D5DB',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  configCard: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  configTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  configItem: {
    color: '#D1D5DB',
    fontSize: 13,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  coverageCard: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  coverageTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  coverageDescription: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
  footerSubtext: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'center',
  },
});