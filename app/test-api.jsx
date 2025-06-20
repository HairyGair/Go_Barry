// Test API Connection Route
// Simple page to test API connectivity for Go BARRY
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SimpleAPITest from '../components/dev/SimpleAPITest';

const TestAPIPage = () => {
  console.log('🧪 Test API page loaded');
  
  return (
    <View style={styles.container}>
      <SimpleAPITest />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});

export default TestAPIPage;
