// Go_BARRY/app/(tabs)/roadworks.jsx
// StreetManager Roadworks Integration Screen
import React from 'react';
import { View, StyleSheet, StatusBar, Platform } from 'react-native';
import StreetManagerDashboard from '../../components/StreetManagerDashboard';
import { API_CONFIG } from '../../config/api';

const isWeb = Platform.OS === 'web';

export default function RoadworksScreen() {
  return (
    <View style={styles.container}>
      {!isWeb && <StatusBar barStyle="light-content" backgroundColor="#111827" />}
      <StreetManagerDashboard 
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