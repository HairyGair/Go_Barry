// Go_BARRY/app/(tabs)/incidents.jsx
// Sector 4: Incident Manager Tab Page

import React from 'react';
import { View, StyleSheet } from 'react-native';
import IncidentManager from '../../components/operations/IncidentManager';
import AppHeader from '../../components/common/AppHeader';

export default function IncidentManagerTab() {
  return (
    <View style={styles.container}>
      <AppHeader />
      <IncidentManager />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});