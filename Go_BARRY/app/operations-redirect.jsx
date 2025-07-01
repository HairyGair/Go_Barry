// Emergency fix for Operations Centre navigation
// This provides a direct navigation method that works in all environments

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Link } from 'expo-router';

export default function OperationsRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Try multiple navigation methods
    const tryNavigation = async () => {
      try {
        // Method 1: Standard push
        router.push('/operations-centre');
      } catch (e1) {
        try {
          // Method 2: Replace
          router.replace('/operations-centre');
        } catch (e2) {
          // Method 3: Direct window navigation for web
          if (Platform.OS === 'web' && typeof window !== 'undefined') {
            window.location.href = '/operations-centre';
          }
        }
      }
    };
    
    tryNavigation();
  }, []);
  
  // Provide manual navigation options as fallback
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Loading Operations Centre...</Text>
      
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackText}>If not redirected automatically:</Text>
        
        {/* Method 1: Expo Router Link */}
        <Link href="/operations-centre" asChild>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Click here to continue</Text>
          </TouchableOpacity>
        </Link>
        
        {/* Method 2: Direct navigation button */}
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={() => {
            if (Platform.OS === 'web') {
              window.location.href = '/operations-centre';
            } else {
              router.push('/operations-centre');
            }
          }}
        >
          <Text style={styles.buttonText}>Alternative Link</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e16',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 40,
  },
  fallbackContainer: {
    alignItems: 'center',
  },
  fallbackText: {
    color: '#9ca3af',
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  secondaryButton: {
    backgroundColor: '#059669',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
