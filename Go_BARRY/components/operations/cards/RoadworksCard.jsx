/*
 * Go Barry - Traffic Intelligence Platform
 * Roadworks Card Wrapper
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import RoadworksManager from '../RoadworksManager';
import { operationsTheme } from '../../../app/operations-centre/styles/theme';

export default function RoadworksCard() {
  return (
    <View style={styles.container}>
      <RoadworksManager />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: operationsTheme.colors.background,
    borderRadius: operationsTheme.borderRadius.lg,
    overflow: 'hidden',
  },
});
