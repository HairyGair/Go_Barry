/*
 * Go Barry - Traffic Intelligence Platform
 * Duty Boards Card Wrapper
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import DutyBoards from '../DutyBoards';
import { operationsTheme } from '../../../app/operations-centre/styles/theme';

export default function DutyBoardsCard() {
  return (
    <View style={styles.container}>
      <DutyBoards />
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
