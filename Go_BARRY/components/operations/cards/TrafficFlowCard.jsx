// components/operations/cards/TrafficFlowCard.jsx
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import TrafficFlowDashboard from '../../TrafficFlowDashboard';
import NetworkHealthScore from '../../NetworkHealthScore';
import EnhancedAlertList from '../../EnhancedAlertList';

const TrafficFlowCard = ({ onClose }) => {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Network Health Overview */}
        <View style={styles.section}>
          <NetworkHealthScore />
        </View>
        
        {/* Traffic Flow Dashboard */}
        <View style={styles.section}>
          <TrafficFlowDashboard />
        </View>
        
        {/* Alert List with Flow Indicators */}
        <View style={styles.section}>
          <EnhancedAlertList />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
    paddingBottom: 0,
  },
});

export default TrafficFlowCard;