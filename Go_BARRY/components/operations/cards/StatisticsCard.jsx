/*
 * Go Barry - Statistics Card Component
 * Wrapper for the Statistics Component to integrate with Operations Centre
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import StatisticsComponent from '../StatisticsComponent/StatisticsComponent.jsx';

export default function StatisticsCard() {
  return (
    <View style={styles.container}>
      <StatisticsComponent />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});