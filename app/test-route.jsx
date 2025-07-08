// Test route to debug navigation
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function TestRoute() {
  const router = useRouter();
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test Route Works!</Text>
      <Text style={styles.info}>If you can see this, navigation is working.</Text>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => router.push('/')}
      >
        <Text style={styles.buttonText}>Back to Home</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, styles.operationsButton]} 
        onPress={() => {
          console.log('[TestRoute] Navigating to operations-centre');
          router.push('/operations-centre/');
        }}
      >
        <Text style={styles.buttonText}>Try Operations Centre</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  info: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  operationsButton: {
    backgroundColor: '#059669',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
