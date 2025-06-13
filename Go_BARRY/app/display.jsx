// Go_BARRY/app/display.jsx
// Clean Display Route - Uses the rebuilt DisplayScreen component

import React from 'react';
import { View, StyleSheet } from 'react-native';
import DisplayScreen from '../components/DisplayScreen';

export default function Display() {
  return (
    <View style={styles.container}>
      <DisplayScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: '100vh',
    // Remove old background - let DisplayScreen handle its own gradient background
  },
});
