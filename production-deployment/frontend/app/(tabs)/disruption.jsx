// Go_BARRY/app/(tabs)/disruption.jsx
// AI-Powered Disruption Management Screen with Enhanced Browser Compatibility
import React from 'react';
import { View, StyleSheet, StatusBar, Platform } from 'react-native';
import DisruptionControlRoom from '../../components/DisruptionControlRoom';
import { API_CONFIG } from '../../config/api';

const isWeb = Platform.OS === 'web';

export default function DisruptionScreen() {
  return (
    <View style={styles.container}>
      {!isWeb && <StatusBar barStyle="light-content" backgroundColor="#111827" />}
      <DisruptionControlRoom 
        baseUrl={API_CONFIG.baseURL}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});