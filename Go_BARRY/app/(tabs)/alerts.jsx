// traffic-watch/app/(tabs)/alerts.jsx
import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import AlertList from '../../components/AlertList';

export default function AlertsScreen() {
  const handleAlertPress = (alert) => {
    console.log('Alert pressed:', alert.id);
    // Navigate to detailed view or show modal
    // navigation.navigate('AlertDetail', { alert });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <AlertList 
        baseUrl="https://go-barry.onrender.com"
        onAlertPress={handleAlertPress}
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