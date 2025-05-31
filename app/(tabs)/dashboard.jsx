// traffic-watch/app/(tabs)/dashboard.jsx
import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import Dashboard from '../../components/Dashboard';

export default function DashboardScreen({ navigation }) {
  const handleAlertPress = (alert) => {
    console.log('Critical alert pressed:', alert.id);
    // Navigate to detailed view or alerts list filtered to this alert
    // navigation.navigate('AlertDetail', { alert });
  };

  const handleViewAllPress = () => {
    console.log('View all alerts pressed');
    // Navigate to alerts screen with critical filter applied
    // navigation.navigate('Alerts', { filter: { severity: ['High'], status: ['red'] } });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <Dashboard 
        baseUrl="https://go-barry.onrender.com"
        onAlertPress={handleAlertPress}
        onViewAllPress={handleViewAllPress}
        autoRefreshInterval={30000} // 30 seconds for control room
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
});