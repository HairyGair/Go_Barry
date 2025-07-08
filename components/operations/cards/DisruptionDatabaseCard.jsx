import React from 'react';
import { View, StyleSheet } from 'react-native';
import DisruptionDatabase from '../DisruptionDatabase';

export default function DisruptionDatabaseCard() {
  return (
    <View style={styles.container}>
      <DisruptionDatabase />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
