import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import RoadworksErrorBoundary from '../RoadworksErrorBoundary';

// Test component that throws an error when button is pressed
const ErrorThrowingComponent = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error for roadworks error boundary');
  }
  
  return (
    <View>
      <Text>Component is working normally</Text>
    </View>
  );
};

// Test component to verify error boundary functionality
const RoadworksErrorBoundaryTest = () => {
  const [shouldThrowError, setShouldThrowError] = React.useState(false);
  
  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 20 }}>
        Roadworks Error Boundary Test
      </Text>
      
      <TouchableOpacity
        style={{
          backgroundColor: '#ef4444',
          padding: 12,
          borderRadius: 8,
          marginBottom: 20,
        }}
        onPress={() => setShouldThrowError(true)}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          Trigger Error
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={{
          backgroundColor: '#10b981',
          padding: 12,
          borderRadius: 8,
          marginBottom: 20,
        }}
        onPress={() => setShouldThrowError(false)}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          Reset Component
        </Text>
      </TouchableOpacity>
      
      <RoadworksErrorBoundary
        onError={(error, errorInfo) => {
          console.log('Error caught by boundary:', error.message);
        }}
        onClose={() => {
          console.log('Close button pressed');
          setShouldThrowError(false);
        }}
      >
        <ErrorThrowingComponent shouldThrow={shouldThrowError} />
      </RoadworksErrorBoundary>
    </View>
  );
};

export default RoadworksErrorBoundaryTest;

// Usage instructions:
// 1. Import this component in your app
// 2. Press "Trigger Error" to test error boundary
// 3. Use "Try Again" button to test retry functionality
// 4. Use "Reset Component" to clear error state
// 5. Check console for error logging