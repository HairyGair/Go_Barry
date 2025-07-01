// Simple debug version of Operations Centre
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSupervisor } from '../../components/hooks/useSupervisorSession';

export default function OperationsCentreDebug() {
  const router = useRouter();
  const { isLoggedIn, supervisorName } = useSupervisor();

  useEffect(() => {
    console.log('Operations Centre Debug - Mounted');
    console.log('Is Logged In:', isLoggedIn);
    console.log('Supervisor Name:', supervisorName);
  }, [isLoggedIn, supervisorName]);

  // Don't redirect immediately to test if the route loads
  const handleBack = () => {
    router.push('/');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Operations Centre - Debug Mode</Text>
      <Text style={styles.info}>Route is working!</Text>
      <Text style={styles.info}>Logged in: {isLoggedIn ? 'Yes' : 'No'}</Text>
      <Text style={styles.info}>Supervisor: {supervisorName || 'None'}</Text>
      
      <TouchableOpacity style={styles.button} onPress={handleBack}>
        <Text style={styles.buttonText}>Back to Home</Text>
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
    marginBottom: 10,
  },
  button: {
    marginTop: 30,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
