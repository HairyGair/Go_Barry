import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import OperationsErrorBoundary from './components/OperationsErrorBoundary';
import { deploymentChecks } from './config/production';

export default function OperationsCentreLayout() {
  useEffect(() => {
    // Production deployment checks
    if (process.env.NODE_ENV === 'production') {
      if (!deploymentChecks.hasRequiredEnvVars()) {
        console.error('⚠️ Missing required environment variables for Operations Centre');
      }
    }
  }, []);

  return (
    <OperationsErrorBoundary>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#f0f2f5' },
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ 
            headerShown: false,
            animation: 'slide_from_right',
          }} 
        />
      </Stack>
    </OperationsErrorBoundary>
  );
}
