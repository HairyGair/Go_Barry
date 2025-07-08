// Test runner for Email Integration Component
// Place this in Go_BARRY folder and run with: npm test -- --testNamePattern="EmailIntegration"

import React from 'react';
import { View, Text } from 'react-native';

// Mock supervisor session for testing
const mockSupervisor = {
  badgeId: 'AG003',
  name: 'Anthony Gair',
  role: 'Supervisor'
};

// Simple test wrapper component
const EmailIntegrationTestWrapper = () => {
  // Mock the hooks
  React.useSupervisorSession = () => ({
    supervisor: mockSupervisor
  });
  
  React.useConvexSync = () => ({
    emailTemplates: [],
    distributionLists: [],
    logCommunication: async (data) => {
      console.log('Mock logCommunication:', data);
    }
  });

  const [showEmail, setShowEmail] = React.useState(false);

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>
        Email Integration Component Test
      </Text>
      
      <View style={{ marginBottom: 20 }}>
        <Text>Supervisor: {mockSupervisor.name} ({mockSupervisor.badgeId})</Text>
      </View>

      <TouchableOpacity
        onPress={() => setShowEmail(!showEmail)}
        style={{
          backgroundColor: '#10B981',
          padding: 15,
          borderRadius: 8,
          alignItems: 'center'
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          {showEmail ? 'Close' : 'Open'} Email Integration
        </Text>
      </TouchableOpacity>

      {showEmail && (
        <View style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'white',
          zIndex: 100
        }}>
          <EmailIntegrationEnhanced onClose={() => setShowEmail(false)} />
        </View>
      )}
    </View>
  );
};

export default EmailIntegrationTestWrapper;