/*
 * Go Barry - Traffic Intelligence Platform
 * EmptyState Component - Display when no data available
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { darkTheme } from '../styles/darkTheme';

const EmptyState = ({ 
  icon = 'alert-circle-outline',
  title = 'No Data Available',
  message,
  iconColor,
  style
}) => {
  return (
    <View style={[styles.container, style]}>
      <MaterialCommunityIcons 
        name={icon} 
        size={64} 
        color={iconColor || darkTheme.textMuted} 
      />
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: darkTheme.surface,
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  title: {
    color: darkTheme.text,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  message: {
    color: darkTheme.textSecondary,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default EmptyState;
