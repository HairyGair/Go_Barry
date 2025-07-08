/*
 * Go Barry - Traffic Intelligence Platform
 * Operations Centre Quick Actions Component - Live Data
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { operationsTheme } from '../../../lib/_styles-index.js';
import { useSupervisor } from '../../../components/hooks/useSupervisorSession.js';

export default function QuickActionsLive({ onRefresh }) {
  const { supervisor } = useSupervisor();
  const [isLoading, setIsLoading] = useState({});

  const API_BASE = 'https://go-barry.onrender.com';

  const handlePriorityAlert = async () => {
    console.log('🚨 Priority Alert function called - function exists!');
    Alert.alert(
      '⚠️ Priority Alert',
      'Send important operational alert to all supervisors?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send Alert', 
          onPress: async () => {
            setIsLoading(prev => ({ ...prev, priority: true }));
            try {
              const response = await fetch(`${API_BASE}/api/emergency-alerts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'priority',
                  message: `Priority alert from ${supervisor?.name || 'supervisor'}`,
                  supervisorId: supervisor?.badge,
                  timestamp: new Date().toISOString(),
                  priority: 'high'
                })
              });
              
              if (response.ok) {
                Alert.alert('✅ Success', 'Priority alert sent to all supervisors');
                onRefresh?.();
              } else {
                throw new Error('Failed to send alert');
              }
            } catch (error) {
              console.error('Priority alert failed:', error);
              Alert.alert('❌ Error', 'Failed to send priority alert');
            } finally {
              setIsLoading(prev => ({ ...prev, priority: false }));
            }
          }
        }
      ]
    );
  };

  const handleBroadcastMessage = async () => {
    Alert.alert(
      '📢 Broadcast Message',
      'Send operational update to control room displays?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send Message', 
          onPress: async () => {
            setIsLoading(prev => ({ ...prev, broadcast: true }));
            try {
              const response = await fetch(`${API_BASE}/api/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'broadcast',
                  content: `Operational update from ${supervisor?.name || 'Operations Centre'}`,
                  sender: supervisor?.badge || 'OPS',
                  priority: 'normal',
                  timestamp: new Date().toISOString()
                })
              });
              
              if (response.ok) {
                Alert.alert('✅ Success', 'Message broadcast to control room');
                onRefresh?.();
              } else {
                throw new Error('Failed to send broadcast');
              }
            } catch (error) {
              console.error('Broadcast failed:', error);
              Alert.alert('❌ Error', 'Failed to send broadcast message');
            } finally {
              setIsLoading(prev => ({ ...prev, broadcast: false }));
            }
          }
        }
      ]
    );
  };

  const handleGenerateReport = async () => {
    setIsLoading(prev => ({ ...prev, report: true }));
    try {
      // Fetch current operational data for report
      const [alertsRes, roadworksRes] = await Promise.all([
        fetch(`${API_BASE}/api/alerts-enhanced`),
        fetch(`${API_BASE}/api/roadworks-v2/stats`)
      ]);

      const alerts = alertsRes.ok ? await alertsRes.json() : { alerts: [] };
      const roadworks = roadworksRes.ok ? await roadworksRes.json() : { active: 0, total: 0 };

      const reportData = {
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-GB'),
        supervisor: supervisor?.name || 'Unknown',
        activeAlerts: alerts.alerts?.length || 0,
        activeRoadworks: roadworks.active || 0,
        totalIncidents: alerts.alerts?.filter(a => a.type === 'incident').length || 0,
        weatherAlerts: alerts.alerts?.filter(a => a.type === 'weather').length || 0
      };

      // Open report in new tab/window
      if (Platform.OS === 'web') {
        const reportUrl = `${API_BASE}/api/analytics/daily-report?date=${reportData.date}&supervisor=${supervisor?.badge}`;
        window.open(reportUrl, '_blank');
        Alert.alert('📊 Report Generated', 'Daily operational report opened in new tab');
      } else {
        Alert.alert(
          '📊 Daily Report Summary',
          `Date: ${reportData.date}\nTime: ${reportData.time}\n\nActive Alerts: ${reportData.activeAlerts}\nActive Roadworks: ${reportData.activeRoadworks}\nIncidents: ${reportData.totalIncidents}\nWeather Alerts: ${reportData.weatherAlerts}`
        );
      }
      
      onRefresh?.();
    } catch (error) {
      console.error('Report generation failed:', error);
      Alert.alert('❌ Error', 'Failed to generate daily report');
    } finally {
      setIsLoading(prev => ({ ...prev, report: false }));
    }
  };

  const handleRefreshData = async () => {
    setIsLoading(prev => ({ ...prev, refresh: true }));
    try {
      // Trigger data refresh across the system
      await Promise.all([
        fetch(`${API_BASE}/api/alerts-enhanced`).catch(() => {}),
        fetch(`${API_BASE}/api/roadworks-v2/status`).catch(() => {}),
        fetch(`${API_BASE}/api/weather/current`).catch(() => {}),
        fetch(`${API_BASE}/api/bods/status`).catch(() => {})
      ]);

      Alert.alert('🔄 Data Refreshed', 'All operational data has been updated');
      onRefresh?.();
      
      // Also refresh the page for good measure
      if (Platform.OS === 'web') {
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (error) {
      console.error('Data refresh failed:', error);
      Alert.alert('⚠️ Partial Refresh', 'Some data sources may not be updated');
    } finally {
      setIsLoading(prev => ({ ...prev, refresh: false }));
    }
  };

  const actions = [
    { 
      icon: 'alert', 
      label: 'Priority Alert', 
      color: '#ea580c',
      action: handlePriorityAlert,
      loading: isLoading.priority,
      description: 'Send important alert to all supervisors'
    },
    { 
      icon: 'bullhorn', 
      label: 'Broadcast', 
      color: '#0891b2',
      action: handleBroadcastMessage,
      loading: isLoading.broadcast,
      description: 'Send message to control room displays'
    },
    { 
      icon: 'file-document-outline', 
      label: 'Daily Report', 
      color: '#0ea5e9',
      action: handleGenerateReport,
      loading: isLoading.report,
      description: 'Generate operational report for today'
    },
    { 
      icon: 'refresh', 
      label: 'Refresh Data', 
      color: '#059669',
      action: handleRefreshData,
      loading: isLoading.refresh,
      description: 'Update all live data sources'
    },
  ];
  
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {actions.map((action, index) => (
          <Pressable
            key={index}
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionPressed,
              action.loading && styles.actionLoading
            ]}
            onPress={action.action}
            disabled={action.loading}
          >
            <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
              {action.loading ? (
                <MaterialCommunityIcons 
                  name="loading" 
                  size={24} 
                  color={action.color}
                  style={{ transform: [{ rotate: '45deg' }] }}
                />
              ) : (
                <MaterialCommunityIcons 
                  name={action.icon} 
                  size={24} 
                  color={action.color} 
                />
              )}
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
            <Text style={styles.actionDescription}>{action.description}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: operationsTheme.colors.textPrimary,
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: 'white',
    borderRadius: operationsTheme.borderRadius.md,
    padding: 16,
    alignItems: 'center',
    ...operationsTheme.shadows.sm,
  },
  actionPressed: {
    transform: [{ scale: 0.95 }],
  },
  actionLoading: {
    opacity: 0.7,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: operationsTheme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 10,
    color: operationsTheme.colors.textLight,
    textAlign: 'center',
    lineHeight: 12,
  },
});