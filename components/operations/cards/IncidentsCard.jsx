import React from 'react';
import { View, StyleSheet } from 'react-native';
import IncidentManager from '../IncidentManagerLegacy';

export default function IncidentsCard() {
  return (
    <View style={styles.container}>
      <IncidentManager />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
