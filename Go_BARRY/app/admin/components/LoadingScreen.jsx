/*
 * Go Barry - Traffic Intelligence Platform
 * LoadingScreen Component - Consistent loading state
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { darkTheme } from '../styles/darkTheme';

const LoadingScreen = ({ 
  message = 'Loading...',
  color,
  size = 'large',
  style
}) => {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator 
        size={size} 
        color={color || darkTheme.accents.systemOverview} 
      />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: darkTheme.textSecondary,
    marginTop: 16,
    fontSize: 16,
  },
});

export default LoadingScreen;
