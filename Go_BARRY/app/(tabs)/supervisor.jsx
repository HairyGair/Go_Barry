// app/(tabs)/supervisor.jsx
// Main Supervisor Tab - Phase 1 Implementation
// New unified supervisor interface

import React from 'react';
import { View, StyleSheet } from 'react-native';
import SupervisorHub from '../../components/SupervisorHub';

export default function SupervisorScreen() {
  return (
    <View style={styles.container}>
      <SupervisorHub />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
});
