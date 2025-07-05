// Go_BARRY/app/(tabs)/control.jsx
// Sector 3: Control Dashboard Tab Page

import React from 'react';
import { View, StyleSheet } from 'react-native';
import ControlDashboard from '../../components/ControlDashboard';
import AppHeader from '../../components/common/AppHeader';

export default function ControlDashboardTab() {
  return (
    <View style={styles.container}>
      <AppHeader />
      <ControlDashboard />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});