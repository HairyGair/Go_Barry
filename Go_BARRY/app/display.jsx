// Go_BARRY/app/display.jsx
// Dedicated Display Screen Application for Control Room 24/7 Monitoring
// This runs independently for large control room displays

import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import DisplayScreen from '../components/DisplayScreen';

const DisplayApp = () => {
  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#000000" 
        hidden={true} // Hide status bar for fullscreen control room display
      />
      <DisplayScreen />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});

export default DisplayApp;
