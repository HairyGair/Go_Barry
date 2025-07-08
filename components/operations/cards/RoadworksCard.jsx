import React from 'react';
import { View, StyleSheet } from 'react-native';
import RoadworksManager from '../RoadworksManager';

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
  },
});
