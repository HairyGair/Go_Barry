// Go_BARRY/app/(tabs)/settings.jsx
// Clean version with no external icon dependencies
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

export default function SettingsScreen() {
  const [settings, setSettings] = useState({
    apiUrl: 'https://go-barry.onrender.com',
    autoRefresh: true,
    refreshInterval: 5,
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
      const response = await fetch(`${tempApiUrl}/api/health`);
      const data = await response.json();
      
      Alert.alert(
        'Connection Test',
        `✅ Success!\n\nStatus: ${data.status}\nUptime: ${Math.floor(data.uptime / 3600)}h ${Math.floor((data.uptime % 3600) / 60)}m\nCached Alerts: ${data.cachedAlerts || 0}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Connection Failed',
        `❌ Unable to connect:\n\n${error.message}`,
        [{ text: 'OK' }]
      );
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
              apiUrl: 'https://go-barry.onrender.com',
              autoRefresh: true,
              refreshInterval: 5,
              enableNotifications: false,
              showDebugInfo: false,
              darkMode: true
            });
            setTempApiUrl('https://go-barry.onrender.com');
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
              placeholder="https://go-barry.onrender.com"
              placeholderTextColor="#6B7280"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.testButton} onPress={testConnection}>
              <Text style={styles.testButtonText}>Test</Text>
            </TouchableOpacity>
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
            {[1, 5, 10, 15].map(interval => (
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
        <Text style={styles.sectionTitle}>🔧 Current Configuration</Text>
        
        <View style={styles.configCard}>
          <Text style={styles.configItem}>Backend: {settings.apiUrl}</Text>
          <Text style={styles.configItem}>Auto Refresh: {settings.autoRefresh ? 'On' : 'Off'}</Text>
          <Text style={styles.configItem}>Interval: {settings.refreshInterval} minutes</Text>
          <Text style={styles.configItem}>Notifications: {settings.enableNotifications ? 'On' : 'Off'}</Text>
          <Text style={styles.configItem}>Debug Mode: {settings.showDebugInfo ? 'On' : 'Off'}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Settings are saved locally on your device.
        </Text>
        <Text style={styles.footerSubtext}>
          BARRY v1.0.0 - Configuration Panel
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
  configCard: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 16,
  },
  configItem: {
    color: '#D1D5DB',
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 4,
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