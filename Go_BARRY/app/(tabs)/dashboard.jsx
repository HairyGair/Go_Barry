// Go_BARRY/app/(tabs)/dashboard.jsx
// Updated to use optimized mobile dashboard with enhanced performance and touch interactions
import React from 'react';
import { View, StyleSheet, StatusBar, Platform } from 'react-native';
import OptimizedMobileDashboard from '../../components/mobile/OptimizedMobileDashboard';
import EnhancedDashboard from '../../components/EnhancedDashboard';
import { API_CONFIG } from '../../config/api';

const isWeb = Platform.OS === 'web';

export default function DashboardScreen({ navigation }) {
  const handleAlertPress = (alert) => {
    console.log('Critical alert pressed:', alert.id);
    // Navigate to detailed view or alerts list filtered to this alert
    // navigation?.navigate?.('AlertDetail', { alert });
  };

  const handleViewAllPress = () => {
    console.log('View all alerts pressed');
    // Navigate to alerts screen with critical filter applied
    // navigation?.navigate?.('Alerts', { filter: { severity: ['High'], status: ['red'] } });
  };

  return (
    <View style={styles.container}>
      {!isWeb && <StatusBar barStyle="light-content" backgroundColor="#111827" />}
      
      {/* Use optimized mobile dashboard for better performance */}
      {Platform.OS !== 'web' ? (
        <OptimizedMobileDashboard 
          baseUrl={API_CONFIG.baseURL}
          onAlertPress={handleAlertPress}
          onViewAllPress={handleViewAllPress}
          autoRefreshInterval={API_CONFIG.refreshIntervals.dashboard}
        />
      ) : (
        <EnhancedDashboard 
          baseUrl={API_CONFIG.baseURL}
          onAlertPress={handleAlertPress}
          onViewAllPress={handleViewAllPress}
          autoRefreshInterval={API_CONFIG.refreshIntervals.dashboard}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
});