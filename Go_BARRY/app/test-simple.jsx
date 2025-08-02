import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TestSimple() {
  console.log('TestSimple component rendering');
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>HELLO WORLD - THIS IS A TEST</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ff0000', // Bright red so we can see it
  },
  text: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
});