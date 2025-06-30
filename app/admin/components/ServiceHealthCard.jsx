/*
 * Go Barry - Traffic Intelligence Platform
 * ServiceHealthCard Component - Service status display
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { darkTheme } from '../styles/darkTheme';
import StatusIndicator from './StatusIndicator';

const ServiceHealthCard = ({ 
  serviceName,
  status = 'unknown',
  detail,
  onRestart,
  showRestartButton = false,
  style
}) => {
  return (
    <View style={[styles.card, style]}>
      <StatusIndicator status={status} size={12} style={styles.indicator} />
      <Text style={styles.serviceName}>{serviceName}</Text>
      {detail && <Text style={styles.detail}>{detail}</Text>}
      
      {showRestartButton && onRestart && (
        <Pressable
          style={({ pressed }) => [
            styles.restartButton,
            pressed && styles.restartButtonPressed
          ]}
          onPress={onRestart}
        >
          <MaterialCommunityIcons name="restart" size={16} color={darkTheme.button.text} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: darkTheme.surfaceLight,
    padding: 15,
    borderRadius: 12,
    minWidth: 140,
    margin: 5,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  indicator: {
    marginBottom: 8,
  },
  serviceName: {
    color: darkTheme.text,
    fontSize: 14,
    fontWeight: '600',
  },
  detail: {
    color: darkTheme.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  restartButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
    borderRadius: 4,
    backgroundColor: darkTheme.button.danger,
  },
  restartButtonPressed: {
    opacity: 0.8,
  },
});

export default ServiceHealthCard;
