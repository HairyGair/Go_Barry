// Go_BARRY/app/(tabs)/settings.jsx
// Enhanced Settings with System Health and Training Access

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupervisorSession } from '../../components/hooks/useSupervisorSession';
import SystemHealthMonitor from '../../components/SystemHealthMonitor';
import TrainingHelpSystem from '../../components/TrainingHelpSystem';
import { API_CONFIG } from '../../config/api';

const isWeb = Platform.OS === 'web';

export default function SettingsScreen() {
  const { 
    isLoggedIn, 
    supervisorName, 
    supervisorRole, 
    isAdmin,
    logout 
  } = useSupervisorSession();

  const [activeView, setActiveView] = useState('settings');
  const [settings, setSettings] = useState({
    notifications: true,
    autoRefresh: true,
    soundAlerts: false,
    darkMode: false,
    showAdvanced: false
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // In production, save to backend/storage
    console.log(`Setting ${key} changed to:`, value);
  };

  const handleLogout = async () => {
    const confirmLogout = isWeb 
      ? window.confirm('Are you sure you want to log out?')
      : await new Promise(resolve => {
          Alert.alert(
            'Logout',
            'Are you sure you want to log out?',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Logout', style: 'destructive', onPress: () => resolve(true) }
            ]
          );
        });

    if (confirmLogout) {
      await logout();
    }
  };

  const clearCache = () => {
    const message = 'Cache cleared successfully';
    if (isWeb) {
      alert(message);
    } else {
      Alert.alert('Cache Cleared', message);
    }
  };

  if (activeView === 'health') {
    return (
      <View style={styles.container}>
        <View style={styles.backHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setActiveView('settings')}
          >
            <Ionicons name="arrow-back" size={24} color="#3B82F6" />
            <Text style={styles.backButtonText}>Back to Settings</Text>
          </TouchableOpacity>
        </View>
        <SystemHealthMonitor baseUrl={API_CONFIG.baseURL} />
      </View>
    );
  }

  if (activeView === 'training') {
    return (
      <View style={styles.container}>
        <View style={styles.backHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setActiveView('settings')}
          >
            <Ionicons name="arrow-back" size={24} color="#3B82F6" />
            <Text style={styles.backButtonText}>Back to Settings</Text>
          </TouchableOpacity>
        </View>
        <TrainingHelpSystem />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>⚙️ Settings</Text>
        <Text style={styles.subtitle}>Customize your BARRY experience</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Supervisor Info */}
        {isLoggedIn && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Supervisor Information</Text>
            <View style={styles.supervisorCard}>
              <View style={styles.supervisorInfo}>
                <Ionicons name="person-circle" size={48} color="#3B82F6" />
                <View style={styles.supervisorDetails}>
                  <Text style={styles.supervisorName}>{supervisorName}</Text>
                  <Text style={styles.supervisorRole}>{supervisorRole}</Text>
                  {isAdmin && (
                    <Text style={styles.adminBadge}>⭐ Administrator</Text>
                  )}
                </View>
              </View>
              <TouchableOpacity 
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Ionicons name="log-out" size={20} color="#EF4444" />
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Quick Access */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickAccessGrid}>
            <TouchableOpacity 
              style={styles.quickAccessCard}
              onPress={() => setActiveView('health')}
            >
              <Ionicons name="medical" size={32} color="#EF4444" />
              <Text style={styles.quickAccessTitle}>System Health</Text>
              <Text style={styles.quickAccessDesc}>Monitor performance</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAccessCard}
              onPress={() => setActiveView('training')}
            >
              <Ionicons name="school" size={32} color="#6B5B95" />
              <Text style={styles.quickAccessTitle}>Training & Help</Text>
              <Text style={styles.quickAccessDesc}>Learn & get support</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Push Notifications</Text>
              <Text style={styles.settingDesc}>Receive alert notifications</Text>
            </View>
            <Switch
              value={settings.notifications}
              onValueChange={(value) => handleSettingChange('notifications', value)}
              trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Auto Refresh</Text>
              <Text style={styles.settingDesc}>Automatically refresh data</Text>
            </View>
            <Switch
              value={settings.autoRefresh}
              onValueChange={(value) => handleSettingChange('autoRefresh', value)}
              trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Sound Alerts</Text>
              <Text style={styles.settingDesc}>Play sounds for critical alerts</Text>
            </View>
            <Switch
              value={settings.soundAlerts}
              onValueChange={(value) => handleSettingChange('soundAlerts', value)}
              trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Dark Mode</Text>
              <Text style={styles.settingDesc}>Use dark theme (Coming Soon)</Text>
            </View>
            <Switch
              value={settings.darkMode}
              onValueChange={(value) => handleSettingChange('darkMode', value)}
              trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
              thumbColor="#FFFFFF"
              disabled
            />
          </View>
        </View>

        {/* Advanced Settings */}
        {isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Advanced Settings (Admin)</Text>
            
            <TouchableOpacity style={styles.advancedButton}>
              <Ionicons name="server" size={20} color="#6B7280" />
              <Text style={styles.advancedButtonText}>Server Configuration</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.advancedButton}>
              <Ionicons name="people" size={20} color="#6B7280" />
              <Text style={styles.advancedButtonText}>User Management</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.advancedButton}>
              <Ionicons name="shield" size={20} color="#6B7280" />
              <Text style={styles.advancedButtonText}>Security Settings</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        )}

        {/* System Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version:</Text>
            <Text style={styles.infoValue}>3.0.0</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Environment:</Text>
            <Text style={styles.infoValue}>
              {isWeb ? 'Browser' : 'Mobile'} ({__DEV__ ? 'Development' : 'Production'})
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>API Endpoint:</Text>
            <Text style={styles.infoValue}>{API_CONFIG.baseURL}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Platform:</Text>
            <Text style={styles.infoValue}>{Platform.OS}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={clearCache}
          >
            <Ionicons name="refresh" size={20} color="#3B82F6" />
            <Text style={styles.actionButtonText}>Clear Cache</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="download" size={20} color="#3B82F6" />
            <Text style={styles.actionButtonText}>Export Data</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="bug" size={20} color="#3B82F6" />
            <Text style={styles.actionButtonText}>Report Bug</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About BARRY</Text>
          <Text style={styles.aboutText}>
            BARRY (Bus Alert Real-time Reporting Yield) is Go North East's advanced 
            traffic intelligence system. Version 3.0 introduces AI-powered disruption 
            management, enhanced GTFS integration, and multi-channel messaging capabilities.
          </Text>
          <Text style={styles.aboutCopyright}>
            © 2024 Go North East. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  backHeader: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  supervisorCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  supervisorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  supervisorDetails: {
    flex: 1,
  },
  supervisorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  supervisorRole: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  adminBadge: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 8,
  },
  logoutButtonText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 14,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAccessCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickAccessTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  quickAccessDesc: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: 14,
    color: '#6B7280',
  },
  advancedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  advancedButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
    textAlign: 'right',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
  aboutText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  aboutCopyright: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});
