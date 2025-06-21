// components/ConvexTest.jsx
// Quick test component to verify Convex is working

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';

export default function ConvexTest() {
  // Test queries
  const syncState = useQuery(api.sync.getSyncState);
  const activeSupervisors = useQuery(api.supervisors.getActiveSupervisors);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚀 Convex Connection Test</Text>
      
      <View style={styles.status}>
        <Text style={styles.label}>Sync State:</Text>
        <Text style={styles.value}>
          {syncState ? '✅ Connected' : '🔄 Connecting...'}
        </Text>
      </View>
      
      <View style={styles.status}>
        <Text style={styles.label}>Active Supervisors:</Text>
        <Text style={styles.value}>
          {activeSupervisors ? activeSupervisors.length : '0'}
        </Text>
      </View>
      
      {syncState && (
        <View style={styles.details}>
          <Text style={styles.json}>
            {JSON.stringify(syncState, null, 2)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    margin: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  status: {
    flexDirection: 'row',
    marginVertical: 5,
  },
  label: {
    fontWeight: 'bold',
    marginRight: 10,
  },
  value: {
    color: '#4CAF50',
  },
  details: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  json: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
});
