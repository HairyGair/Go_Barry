/*
 * Go Barry - Traffic Intelligence Platform
 * StatusIndicator Component - Reusable status dot
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { getStatusColor } from '../styles/darkTheme';

const StatusIndicator = ({ 
  status = 'unknown', 
  size = 12,
  style 
}) => {
  const color = getStatusColor(status);
  
  return (
    <View 
      style={[
        styles.indicator,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        style
      ]} 
    />
  );
};

const styles = StyleSheet.create({
  indicator: {
    // Base styles can be added here if needed
  },
});

export default StatusIndicator;
