import React from 'react';
import { Stack } from 'expo-router';

export default function OperationsCentreLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#f0f2f5' },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Operations Centre',
          animation: 'slide_from_right',
        }} 
      />
    </Stack>
  );
}
