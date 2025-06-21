// Go_BARRY/components/admin/SystemConfiguration.jsx
// System configuration component for admin panel

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SystemConfiguration = () => {
  const [settings, setSettings] = useState({
    alertRefreshInterval: '15',
    alertRetentionDays: '7',
    autoRemoveDuplicates: true,
    severityThresholds: {
      high: '80',
      medium: '50'
    },
    emailNotifications: true,
    slackIntegration: false,
    maintenanceMode: false,
    debugMode: false,
    apiCaching: {
      tomtom: '30',
      here: '60',
      nationalHighways: '300'
    }
  });

  const handleSave = () => {
    Alert.alert(
      'Save Configuration',
      'Are you sure you want to save these settings?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Save', 
          onPress: () => {
            // Would save to backend
            Alert.alert('Success', 'Configuration saved successfully');
          }
        }
      ]
    );
  };

  const handleReset = () => {
    Alert.alert(
      'Reset to Defaults',
      'This will reset all settings to their default values. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            // Would reset settings
            Alert.alert('Success', 'Settings reset to defaults');
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>General Settings</Text>
      
      <View style={styles.settingsGroup}>
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Alert Refresh Interval</Text>
            <Text style={styles.settingDescription}>How often to check for new alerts (seconds)</Text>
          </View>
          <TextInput
            style={styles.settingInput}
            value={settings.alertRefreshInterval}
            onChangeText={(text) => setSettings({...settings, alertRefreshInterval: text})}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Alert Retention</Text>
            <Text style={styles.settingDescription}>Days to keep dismissed alerts</Text>
          </View>
          <TextInput
            style={styles.settingInput}
            value={settings.alertRetentionDays}
            onChangeText={(text) => setSettings({...settings, alertRetentionDays: text})}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Auto-Remove Duplicates</Text>
            <Text style={styles.settingDescription}>Automatically remove duplicate alerts</Text>
          </View>
          <Switch
            value={settings.autoRemoveDuplicates}
            onValueChange={(value) => setSettings({...settings, autoRemoveDuplicates: value})}
            trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Severity Thresholds</Text>
      
      <View style={styles.settingsGroup}>
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>High Severity Threshold</Text>
            <Text style={styles.settingDescription}>ML confidence % for high severity</Text>
          </View>
          <TextInput
            style={styles.settingInput}
            value={settings.severityThresholds.high}
            onChangeText={(text) => setSettings({
              ...settings, 
              severityThresholds: {...settings.severityThresholds, high: text}
            })}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Medium Severity Threshold</Text>
            <Text style={styles.settingDescription}>ML confidence % for medium severity</Text>
          </View>
          <TextInput
            style={styles.settingInput}
            value={settings.severityThresholds.medium}
            onChangeText={(text) => setSettings({
              ...settings, 
              severityThresholds: {...settings.severityThresholds, medium: text}
            })}
            keyboardType="numeric"
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Integrations</Text>
      
      <View style={styles.settingsGroup}>
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Email Notifications</Text>
            <Text style={styles.settingDescription}>Send email alerts for critical incidents</Text>
          </View>
          <Switch
            value={settings.emailNotifications}
            onValueChange={(value) => setSettings({...settings, emailNotifications: value})}
            trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Slack Integration</Text>
            <Text style={styles.settingDescription}>Post alerts to Slack channel</Text>
          </View>
          <Switch
            value={settings.slackIntegration}
            onValueChange={(value) => setSettings({...settings, slackIntegration: value})}
            trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>API Cache Settings</Text>
      
      <View style={styles.settingsGroup}>
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>TomTom Cache Duration</Text>
            <Text style={styles.settingDescription}>Seconds to cache TomTom responses</Text>
          </View>
          <TextInput
            style={styles.settingInput}
            value={settings.apiCaching.tomtom}
            onChangeText={(text) => setSettings({
              ...settings,
              apiCaching: {...settings.apiCaching, tomtom: text}
            })}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>HERE Cache Duration</Text>
            <Text style={styles.settingDescription}>Seconds to cache HERE responses</Text>
          </View>
          <TextInput
            style={styles.settingInput}
            value={settings.apiCaching.here}
            onChangeText={(text) => setSettings({
              ...settings,
              apiCaching: {...settings.apiCaching, here: text}
            })}
            keyboardType="numeric"
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>System Modes</Text>
      
      <View style={styles.settingsGroup}>
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Maintenance Mode</Text>
            <Text style={styles.settingDescription}>Show maintenance message to users</Text>
          </View>
          <Switch
            value={settings.maintenanceMode}
            onValueChange={(value) => setSettings({...settings, maintenanceMode: value})}
            trackColor={{ false: '#E5E7EB', true: '#EF4444' }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Debug Mode</Text>
            <Text style={styles.settingDescription}>Enable verbose logging</Text>
          </View>
          <Switch
            value={settings.debugMode}
            onValueChange={(value) => setSettings({...settings, debugMode: value})}
            trackColor={{ false: '#E5E7EB', true: '#F59E0B' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Ionicons name="save" size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Ionicons name="refresh" size={20} color="#EF4444" />
          <Text style={styles.resetButtonText}>Reset to Defaults</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  settingsGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  settingDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  settingInput: {
    width: 80,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1F2937',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  resetButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SystemConfiguration;
