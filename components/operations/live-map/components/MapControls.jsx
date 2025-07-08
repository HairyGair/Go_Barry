/*
 * MapControls.jsx
 * Phase 3: Live Map Controls
 * 
 * Floating control panel for Live Map with toggles for buses, routes, and other layers
 * Includes zoom controls and viewport management
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const MapControls = ({
  showBuses = true,
  showRoutes = true,
  showTraffic = true,
  onToggleBuses,
  onToggleRoutes,
  onToggleTraffic,
  onZoomIn,
  onZoomOut,
  onResetView,
  onFitBounds,
  busCount = 0,
  routeCount = 0,
  style
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Layer Toggles */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Layers</Text>
        
        {/* Traffic Toggle */}
        <Pressable 
          style={[styles.toggleButton, showTraffic && styles.toggleButtonActive]}
          onPress={onToggleTraffic}
        >
          <MaterialCommunityIcons 
            name="traffic-light" 
            size={16} 
            color={showTraffic ? '#fff' : '#6b7280'} 
          />
          <Text style={[styles.toggleText, showTraffic && styles.toggleTextActive]}>
            Traffic
          </Text>
        </Pressable>

        {/* Buses Toggle */}
        <Pressable 
          style={[styles.toggleButton, showBuses && styles.toggleButtonActive]}
          onPress={onToggleBuses}
        >
          <MaterialCommunityIcons 
            name="bus" 
            size={16} 
            color={showBuses ? '#fff' : '#6b7280'} 
          />
          <Text style={[styles.toggleText, showBuses && styles.toggleTextActive]}>
            Buses {busCount > 0 && `(${busCount})`}
          </Text>
        </Pressable>

        {/* Routes Toggle */}
        <Pressable 
          style={[styles.toggleButton, showRoutes && styles.toggleButtonActive]}
          onPress={onToggleRoutes}
        >
          <MaterialCommunityIcons 
            name="routes" 
            size={16} 
            color={showRoutes ? '#fff' : '#6b7280'} 
          />
          <Text style={[styles.toggleText, showRoutes && styles.toggleTextActive]}>
            Routes {routeCount > 0 && `(${routeCount})`}
          </Text>
        </Pressable>
      </View>

      {/* Zoom Controls */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>View</Text>
        
        <Pressable style={styles.controlButton} onPress={onZoomIn}>
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
        </Pressable>
        
        <Pressable style={styles.controlButton} onPress={onZoomOut}>
          <MaterialCommunityIcons name="minus" size={20} color="#fff" />
        </Pressable>
        
        <Pressable style={styles.controlButton} onPress={onResetView}>
          <MaterialCommunityIcons name="home-map-marker" size={16} color="#fff" />
        </Pressable>
        
        <Pressable style={styles.controlButton} onPress={onFitBounds}>
          <MaterialCommunityIcons name="fit-to-page-outline" size={16} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(31, 41, 55, 0.95)',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 140,
    gap: 16,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(75, 85, 99, 0.5)',
  },
  toggleButtonActive: {
    backgroundColor: '#3b82f6',
  },
  toggleText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#fff',
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(75, 85, 99, 0.8)',
  },
});

export default MapControls;
