// components/EnhancedMapView.jsx
import React, { useRef, useState } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import OptimizedTomTomMap from './OptimizedTomTomMap';
import TrafficHeatMapOverlay from './TrafficHeatMapOverlay';
import TrafficFlowDashboard from './TrafficFlowDashboard';
import NetworkHealthScore from './NetworkHealthScore';
import { Ionicons } from '@expo/vector-icons';

const EnhancedMapView = ({ alerts = [], showDashboard = true }) => {
  const mapRef = useRef(null);
  const [showHeatMap, setShowHeatMap] = useState(true);
  const [showFlowDashboard, setShowFlowDashboard] = useState(false);

  return (
    <View style={styles.container}>
      {/* Map Container */}
      <View style={styles.mapContainer}>
        <OptimizedTomTomMap
          ref={mapRef}
          alerts={alerts}
          style={StyleSheet.absoluteFillObject}
        />
        
        {/* Heat Map Overlay */}
        {showHeatMap && Platform.OS === 'web' && (
          <TrafficHeatMapOverlay mapRef={mapRef} />
        )}

        {/* Map Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity
            style={[styles.controlButton, showHeatMap && styles.activeButton]}
            onPress={() => setShowHeatMap(!showHeatMap)}
          >
            <Ionicons 
              name="flame" 
              size={20} 
              color={showHeatMap ? '#fff' : '#666'} 
            />
            <Text style={[styles.controlText, showHeatMap && styles.activeText]}>
              Heat Map
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, showFlowDashboard && styles.activeButton]}
            onPress={() => setShowFlowDashboard(!showFlowDashboard)}
          >
            <Ionicons 
              name="pulse" 
              size={20} 
              color={showFlowDashboard ? '#fff' : '#666'} 
            />
            <Text style={[styles.controlText, showFlowDashboard && styles.activeText]}>
              Flow Data
            </Text>
          </TouchableOpacity>
        </View>

        {/* Network Health Score Overlay */}
        <View style={styles.healthOverlay}>
          <NetworkHealthScore compact />
        </View>
      </View>

      {/* Flow Dashboard Panel */}
      {showDashboard && showFlowDashboard && (
        <View style={styles.dashboardPanel}>
          <View style={styles.dashboardHeader}>
            <Text style={styles.dashboardTitle}>Live Traffic Flow Analysis</Text>
            <TouchableOpacity onPress={() => setShowFlowDashboard(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <TrafficFlowDashboard />
        </View>
      )}
    </View>
  );
};

const TouchableOpacity = Platform.OS === 'web' 
  ? require('react-native-web').TouchableOpacity 
  : require('react-native').TouchableOpacity;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapControls: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeButton: {
    backgroundColor: '#ee7203',
  },
  controlText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeText: {
    color: '#fff',
  },
  healthOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  dashboardPanel: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 400,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dashboardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
});

export default EnhancedMapView;