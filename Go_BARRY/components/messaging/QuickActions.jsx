// Go_BARRY/components/messaging/QuickActions.jsx
// Quick action buttons for message creation

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const QuickActions = ({ onActionSelect }) => {
  const actions = [
    {
      id: 'roadwork',
      icon: 'construct',
      label: 'Alert from Roadwork',
      color: '#F59E0B',
      description: 'Create alert from active roadwork'
    },
    {
      id: 'incident',
      icon: 'warning',
      label: 'Alert from Incident',
      color: '#EF4444',
      description: 'Create alert from traffic incident'
    },
    {
      id: 'custom',
      icon: 'create',
      label: 'Custom Message',
      color: '#6366F1',
      description: 'Compose new message'
    }
  ];

  const handleAction = (actionId) => {
    if (onActionSelect) {
      onActionSelect(actionId);
    } else {
      switch (actionId) {
        case 'roadwork':
          Alert.alert('Roadwork Alert', 'Select an active roadwork from the system to create an alert.');
          break;
        case 'incident':
          Alert.alert('Incident Alert', 'Select an active incident from the system to create an alert.');
          break;
        case 'custom':
          Alert.alert('Custom Message', 'Starting with a blank message template.');
          break;
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Actions</Text>
      <View style={styles.grid}>
        {actions.map((action) => (
          <Pressable
            key={action.id}
            style={styles.card}
            onPress={() => handleAction(action.id)}
          >
            <View style={[styles.iconContainer, { backgroundColor: action.color + '20' }]}>
              <Ionicons name={action.icon} size={24} color={action.color} />
            </View>
            <Text style={styles.label}>{action.label}</Text>
            <Text style={styles.description}>{action.description}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16
  },
  grid: {
    flexDirection: 'row',
    gap: 12
  },
  card: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
    marginBottom: 4
  },
  description: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center'
  }
});

export default QuickActions;
