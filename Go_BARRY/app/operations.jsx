// Redirect to the Operations Centre
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

export default function Operations() {
  const router = useRouter();
  
  useEffect(() => {
    console.log('[Operations] Redirect component mounted');
    // Immediate redirect to operations-centre
    router.replace('/operations-centre');
  }, [router]);
  
  // Show loading state while redirecting
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3b82f6" />
      <Text style={styles.text}>Loading Operations Centre...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e16',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 18,
    marginTop: 20,
  },
});
