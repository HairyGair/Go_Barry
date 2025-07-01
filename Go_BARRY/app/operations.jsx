// Redirect to the new Operations Centre
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function Operations() {
  const router = useRouter();
  
  useEffect(() => {
    // Small delay to ensure router is ready
    const timer = setTimeout(() => {
      try {
        router.push('/operations-centre');
      } catch (error) {
        console.error('Failed to navigate to operations-centre:', error);
        // Fallback: show error message
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [router]);
  
  // Show loading state while redirecting
  return (
    <View style={styles.container}>
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
  },
});
