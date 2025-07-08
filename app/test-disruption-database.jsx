/*
 * Development Testing Route - Disruption Database (No Auth Required)
 * Direct access for testing Phase 1 features
 * Access via: http://localhost:8081/test-disruption-database
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import DisruptionDatabaseTest from '../components/DisruptionDatabaseTest';

export default function TestDisruptionDatabasePage() {
  return (
    <View style={styles.container}>
      <DisruptionDatabaseTest 
        baseUrl="https://go-barry.onrender.com"
        onBack={() => {
          console.log('🔙 Back pressed from test mode');
          if (typeof window !== 'undefined' && window.history) {
            window.history.back();
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});