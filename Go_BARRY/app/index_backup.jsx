import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const IndexApp = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello Go BARRY - Test Mode</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e16',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default IndexApp;