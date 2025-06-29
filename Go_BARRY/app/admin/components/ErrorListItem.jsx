/*
 * Go Barry - Traffic Intelligence Platform
 * ErrorListItem Component - Display error items consistently
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { darkTheme } from '../styles/darkTheme';

const ErrorListItem = ({ 
  service,
  message,
  timestamp,
  severity = 'error', // 'error', 'warning', 'info'
  icon,
  style
}) => {
  const getSeverityColor = () => {
    switch (severity) {
      case 'warning':
        return darkTheme.warning;
      case 'info':
        return darkTheme.info;
      default:
        return darkTheme.error;
    }
  };

  const getSeverityIcon = () => {
    if (icon) return icon;
    switch (severity) {
      case 'warning':
        return 'alert';
      case 'info':
        return 'information-circle';
      default:
        return 'alert-circle';
    }
  };

  const formatTime = (time) => {
    if (!time) return '';
    const date = new Date(time);
    return date.toLocaleTimeString();
  };

  return (
    <View style={[styles.container, style]}>
      <MaterialCommunityIcons 
        name={getSeverityIcon()} 
        size={20} 
        color={getSeverityColor()} 
      />
      <View style={styles.content}>
        <Text style={[styles.service, { color: getSeverityColor() }]}>
          {service}
        </Text>
        <Text style={styles.message}>{message}</Text>
        {timestamp && (
          <Text style={styles.time}>{formatTime(timestamp)}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 10,
  },
  content: {
    flex: 1,
  },
  service: {
    fontSize: 14,
    fontWeight: '600',
  },
  message: {
    color: darkTheme.text,
    fontSize: 12,
    marginTop: 2,
  },
  time: {
    color: darkTheme.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
});

export default ErrorListItem;
