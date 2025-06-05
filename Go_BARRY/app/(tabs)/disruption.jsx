// Go_BARRY/app/(tabs)/disruption.jsx
// AI-Powered Disruption Management Screen
import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import DisruptionControlRoom from '../../components/DisruptionControlRoom';
import { API_CONFIG } from '../../config/api';

export default function DisruptionScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <DisruptionControlRoom 
        baseUrl={API_CONFIG?.baseURL || (__DEV__ 
          ? 'http://192.168.1.132:3001'
          : 'https://go-barry.onrender.com'
        )}
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