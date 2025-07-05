/*
 * Go Barry - Traffic Intelligence Platform
 * Operations Centre Quick Actions Component
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { operationsTheme } from '../../../lib/_styles-index.js';
import { UK_LOCALE } from '../../../lib/_constants-index.js';

export default function QuickActions() {
  const actions = [
    { 
      icon: 'alert-octagon', 
      label: UK_LOCALE.EMERGENCY_ALERT, 
      color: '#f44336',
      action: () => Alert.alert(UK_LOCALE.EMERGENCY_ALERT, 'Send emergency broadcast to all supervisors?', [
        { text: UK_LOCALE.CANCEL, style: 'cancel' },
        { text: 'Send', onPress: () => console.log('Emergency alert sent'), style: 'destructive' }
      ])
    },
    { 
      icon: 'bullhorn', 
      label: UK_LOCALE.BROADCAST, 
      color: '#FF9800',
      action: () => Alert.alert(UK_LOCALE.BROADCAST, 'Send message to control room displays?', [
        { text: UK_LOCALE.CANCEL, style: 'cancel' },
        { text: 'Send', onPress: () => console.log('Broadcast sent') }
      ])
    },
    { 
      icon: 'file-document', 
      label: UK_LOCALE.DAILY_REPORT, 
      color: '#2196F3',
      action: () => Alert.alert(UK_LOCALE.DAILY_REPORT, 'Generate report for today?', [
        { text: UK_LOCALE.CANCEL, style: 'cancel' },
        { text: 'Generate', onPress: () => console.log('Report generated') }
      ])
    },
    { 
      icon: 'refresh', 
      label: UK_LOCALE.REFRESH_DATA, 
      color: '#4CAF50',
      action: () => {
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }
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
              pressed && styles.actionPressed
            ]}
            onPress={action.action}
          >
            <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
              <MaterialCommunityIcons 
                name={action.icon} 
                size={24} 
                color={action.color} 
              />
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
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
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: operationsTheme.borderRadius.md,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 6,
    ...operationsTheme.shadows.sm,
  },
  actionPressed: {
    transform: [{ scale: 0.95 }],
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
    fontSize: 12,
    color: operationsTheme.colors.textSecondary,
    textAlign: 'center',
  },
});
