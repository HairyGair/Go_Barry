// Go_BARRY/app/(tabs)/integration.jsx
// Sector 2: Integration Test Tab Page

import React from 'react';
import { View, StyleSheet } from 'react-native';
import IntegrationTest from '../../components/IntegrationTest';

export default function IntegrationTestTab() {
  return (
    <View style={styles.container}>
      <IntegrationTest />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
