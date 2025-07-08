// Go_BARRY/components/messaging/QuickActions.jsx
// Quick action buttons for message creation with alert integration

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AlertMessageGenerator from './AlertMessageGenerator';

const QuickActions = ({ onActionSelect, onMessageGenerated }) => {
  const [showAlertGenerator, setShowAlertGenerator] = useState(false);
  const [alertType, setAlertType] = useState('roadwork');

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
    if (actionId === 'roadwork') {
      setAlertType('roadwork');
      setShowAlertGenerator(true);
    } else if (actionId === 'incident') {
      setAlertType('incident');
      setShowAlertGenerator(true);
    } else if (onActionSelect) {
      onActionSelect(actionId);
    } else {
      switch (actionId) {
        case 'custom':
          Alert.alert('Custom Message', 'Starting with a blank message template.');
          break;
      }
    }
  };

  const handleAlertMessageGenerated = (messageData) => {
    setShowAlertGenerator(false);
    if (onMessageGenerated) {
      onMessageGenerated(messageData);
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
            {(action.id === 'roadwork' || action.id === 'incident') && (
              <View style={styles.smartBadge}>
                <Text style={styles.smartBadgeText}>AI</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      <AlertMessageGenerator
        visible={showAlertGenerator}
        onClose={() => setShowAlertGenerator(false)}
        onMessageGenerated={handleAlertMessageGenerated}
        alertType={alertType}
      />
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
    borderColor: '#E2E8F0',
    position: 'relative'
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
  },
  smartBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  smartBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5
  }
});

export default QuickActions;
