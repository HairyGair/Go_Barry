/*
 * Go Barry - Traffic Intelligence Platform
 * ProgressBar Component - Reusable progress indicator
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { darkTheme } from '../styles/darkTheme';

const ProgressBar = ({ 
  progress = 0,
  height = 8,
  color,
  backgroundColor = darkTheme.progressBar.background,
  showPercentage = false,
  label,
  style
}) => {
  const validProgress = Math.min(100, Math.max(0, progress));
  
  const getProgressColor = () => {
    if (color) return color;
    if (validProgress > 90) return darkTheme.error;
    if (validProgress > 70) return darkTheme.warning;
    return darkTheme.success;
  };

  return (
    <View style={style}>
      {(label || showPercentage) && (
        <View style={styles.header}>
          {label && <Text style={styles.label}>{label}</Text>}
          {showPercentage && (
            <Text style={[styles.percentage, { color: getProgressColor() }]}>
              {validProgress.toFixed(1)}%
            </Text>
          )}
        </View>
      )}
      
      <View style={[styles.container, { height, backgroundColor }]}>
        <View 
          style={[
            styles.fill, 
            { 
              width: `${validProgress}%`,
              backgroundColor: getProgressColor()
            }
          ]} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    color: darkTheme.text,
    fontSize: 14,
  },
  percentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  container: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});

export default ProgressBar;
