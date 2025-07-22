// app/traffic-flow-demo.jsx
// Demo page showing traffic flow monitoring integration
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, Platform } from 'react-native';
import { Stack } from 'expo-router';
import EnhancedAlertList from '../components/EnhancedAlertList';
import EnhancedMapView from '../components/EnhancedMapView';
import TrafficFlowDashboard from '../components/TrafficFlowDashboard';
import NetworkHealthScore from '../components/NetworkHealthScore';
import { useConvexSync } from '../hooks/useConvexSync';
import { useSupervisorSession } from '../components/hooks/useSupervisorSession';

export default function TrafficFlowDemo() {
  const [selectedView, setSelectedView] = useState('map');
  const { activeAlerts } = useConvexSync();
  const { supervisorSession } = useSupervisorSession();

  const renderContent = () => {
    switch (selectedView) {
      case 'map':
        return <EnhancedMapView alerts={activeAlerts} showDashboard={true} />;
      case 'list':
        return <EnhancedAlertList onAlertPress={(alert) => console.log('Alert pressed:', alert)} />;
      case 'dashboard':
        return (
          <ScrollView style={styles.dashboardScroll}>
            <View style={styles.dashboardContent}>
              <NetworkHealthScore />
              <View style={{ marginTop: 24 }}>
                <TrafficFlowDashboard />
              </View>
            </View>
          </ScrollView>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Traffic Flow Monitoring',
          headerShown: true,
        }}
      />
      
      <View style={styles.container}>
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedView === 'map' && styles.activeTab]}
            onPress={() => setSelectedView('map')}
          >
            <Text style={[styles.tabText, selectedView === 'map' && styles.activeTabText]}>
              Live Map
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, selectedView === 'list' && styles.activeTab]}
            onPress={() => setSelectedView('list')}
          >
            <Text style={[styles.tabText, selectedView === 'list' && styles.activeTabText]}>
              Alert List
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, selectedView === 'dashboard' && styles.activeTab]}
            onPress={() => setSelectedView('dashboard')}
          >
            <Text style={[styles.tabText, selectedView === 'dashboard' && styles.activeTabText]}>
              Flow Analytics
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content Area */}
        <View style={styles.content}>
          {renderContent()}
        </View>

        {/* Supervisor Info */}
        {supervisorSession && (
          <View style={styles.supervisorInfo}>
            <Text style={styles.supervisorText}>
              Monitoring as: {supervisorSession.name} ({supervisorSession.badge})
            </Text>
          </View>
        )}
      </View>
    </>
  );
}

const TouchableOpacity = Platform.OS === 'web' 
  ? require('react-native-web').TouchableOpacity 
  : require('react-native').TouchableOpacity;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#ee7203',
  },
  tabText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#ee7203',
  },
  content: {
    flex: 1,
  },
  dashboardScroll: {
    flex: 1,
  },
  dashboardContent: {
    padding: 24,
    maxWidth: 1200,
    marginHorizontal: 'auto',
    width: '100%',
  },
  supervisorInfo: {
    backgroundColor: 'rgba(238, 114, 3, 0.1)',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#ee7203',
  },
  supervisorText: {
    textAlign: 'center',
    color: '#ee7203',
    fontWeight: '500',
  },
});