/*
 * Go Barry - Map Overview Component
 * Mini-map integration for spatial roadworks visualization
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { roadworksStyles, colors, spacing } from '../styles/roadworks.styles';

const MapOverview = ({
  roadworks = [],
  selectedRoadwork = null,
  onRoadworkSelect,
  onViewFullMap,
  showControls = true,
  height = 200,
  region = {
    latitude: 54.9783,
    longitude: -1.6178,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5
  }
}) => {
  const [mapType, setMapType] = useState('standard');
  const [showLabels, setShowLabels] = useState(true);
  const [clusteredRoadworks, setClusteredRoadworks] = useState([]);

  // Get screen dimensions for responsive design
  const screenWidth = Platform.OS === 'web' 
    ? (typeof window !== 'undefined' ? window.innerWidth : 400)
    : Dimensions.get('window').width;

  // Cluster nearby roadworks for better visualization
  useEffect(() => {
    if (!Array.isArray(roadworks) || roadworks.length === 0) {
      setClusteredRoadworks([]);
      return;
    }

    try {
      // Filter roadworks that have valid coordinates
      const roadworksWithCoords = roadworks.filter(work => 
        work.coordinates && 
        Array.isArray(work.coordinates) && 
        work.coordinates.length >= 2 &&
        typeof work.coordinates[0] === 'number' &&
        typeof work.coordinates[1] === 'number' &&
        !isNaN(work.coordinates[0]) &&
        !isNaN(work.coordinates[1])
      );

      if (roadworksWithCoords.length === 0) {
        setClusteredRoadworks([]);
        return;
      }

      const clustered = clusterRoadworks(roadworksWithCoords);
      setClusteredRoadworks(clustered);
    } catch (error) {
      console.error('Error clustering roadworks:', error);
      setClusteredRoadworks([]);
    }
  }, [roadworks]);

  // Simple clustering algorithm
  const clusterRoadworks = (works) => {
    const clusters = [];
    const processed = new Set();

    works.forEach((work, index) => {
      if (processed.has(index) || !work.coordinates) return;

      const cluster = {
        id: `cluster-${index}`,
        coordinates: work.coordinates,
        roadworks: [work],
        center: work.coordinates,
        severity: work.severity || 'medium'
      };

      // Find nearby roadworks within ~1km
      works.forEach((otherWork, otherIndex) => {
        if (otherIndex === index || processed.has(otherIndex) || !otherWork.coordinates) return;

        const distance = calculateDistance(
          work.coordinates[0], work.coordinates[1],
          otherWork.coordinates[0], otherWork.coordinates[1]
        );

        if (distance < 1) { // Within 1km
          cluster.roadworks.push(otherWork);
          processed.add(otherIndex);
          
          // Update cluster severity to highest
          if (getSeverityLevel(otherWork.severity) > getSeverityLevel(cluster.severity)) {
            cluster.severity = otherWork.severity;
          }
        }
      });

      processed.add(index);
      clusters.push(cluster);
    });

    return clusters;
  };

  // Calculate distance between two coordinates (rough approximation)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Get severity level for comparison
  const getSeverityLevel = (severity) => {
    const levels = { low: 1, medium: 2, high: 3, critical: 4 };
    return levels[severity] || 2;
  };

  // Get cluster color based on severity
  const getClusterColor = (severity) => {
    switch (severity) {
      case 'critical': return colors.critical;
      case 'high': return colors.error;
      case 'medium': return colors.warning;
      case 'low': return colors.success;
      default: return colors.primary;
    }
  };

  // Convert coordinates to screen position (simplified)
  const coordsToScreen = (coords) => {
    if (!coords || coords.length < 2) return { x: 0, y: 0 };
    
    const mapWidth = screenWidth - (spacing.md * 2);
    const mapHeight = height - (showControls ? 60 : 20);
    
    // Simple linear projection (for demo - real implementation would use proper map projection)
    const x = ((coords[1] - region.longitude + region.longitudeDelta/2) / region.longitudeDelta) * mapWidth;
    const y = ((region.latitude + region.latitudeDelta/2 - coords[0]) / region.latitudeDelta) * mapHeight;
    
    return { 
      x: Math.max(10, Math.min(mapWidth - 10, x)),
      y: Math.max(10, Math.min(mapHeight - 10, y))
    };
  };

  const renderMapMarker = (cluster, index) => {
    const position = coordsToScreen(cluster.coordinates);
    const isSelected = selectedRoadwork && cluster.roadworks.some(r => r.id === selectedRoadwork.id);
    const markerSize = cluster.roadworks.length > 1 ? 24 : 16;
    
    return (
      <Pressable
        key={cluster.id}
        style={{
          position: 'absolute',
          left: position.x - markerSize/2,
          top: position.y - markerSize/2,
          width: markerSize,
          height: markerSize,
          borderRadius: markerSize/2,
          backgroundColor: getClusterColor(cluster.severity),
          borderWidth: isSelected ? 3 : 1,
          borderColor: isSelected ? colors.textPrimary : colors.background,
          alignItems: 'center',
          justifyContent: 'center',
          ...roadworksStyles.shadows.md
        }}
        onPress={() => {
          if (cluster.roadworks.length === 1) {
            onRoadworkSelect?.(cluster.roadworks[0]);
          } else {
            // Show cluster details or zoom in
            console.log('Cluster selected:', cluster.roadworks.length, 'roadworks');
          }
        }}
      >
        {cluster.roadworks.length > 1 ? (
          <Text style={{
            fontSize: 10,
            fontWeight: '600',
            color: colors.textPrimary
          }}>
            {cluster.roadworks.length}
          </Text>
        ) : (
          <Ionicons 
            name="construct" 
            size={8} 
            color={colors.textPrimary} 
          />
        )}
      </Pressable>
    );
  };

  const renderMapControls = () => (
    <View style={[
      roadworksStyles.row,
      { 
        position: 'absolute',
        top: spacing.sm,
        right: spacing.sm,
        backgroundColor: colors.surface,
        borderRadius: 8,
        padding: spacing.xs,
        ...roadworksStyles.shadows.sm
      }
    ]}>
      <Pressable
        style={[
          roadworksStyles.quickActionButton,
          { padding: spacing.xs, minWidth: 'auto' },
          mapType === 'standard' && roadworksStyles.quickActionButtonActive
        ]}
        onPress={() => setMapType('standard')}
      >
        <Ionicons 
          name="map" 
          size={14} 
          color={mapType === 'standard' ? colors.textPrimary : colors.textMuted} 
        />
      </Pressable>
      
      <Pressable
        style={[
          roadworksStyles.quickActionButton,
          { padding: spacing.xs, minWidth: 'auto' },
          mapType === 'satellite' && roadworksStyles.quickActionButtonActive
        ]}
        onPress={() => setMapType('satellite')}
      >
        <Ionicons 
          name="globe" 
          size={14} 
          color={mapType === 'satellite' ? colors.textPrimary : colors.textMuted} 
        />
      </Pressable>

      <Pressable
        style={[
          roadworksStyles.quickActionButton,
          { padding: spacing.xs, minWidth: 'auto' },
          showLabels && roadworksStyles.quickActionButtonActive
        ]}
        onPress={() => setShowLabels(!showLabels)}
      >
        <Ionicons 
          name="text" 
          size={14} 
          color={showLabels ? colors.textPrimary : colors.textMuted} 
        />
      </Pressable>
    </View>
  );

  const renderMapBackground = () => (
    <View style={{
      width: '100%',
      height: '100%',
      backgroundColor: mapType === 'satellite' ? colors.surfaceLight : colors.surface,
      borderRadius: 12,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Simplified map background pattern */}
      <View style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        opacity: 0.1,
        backgroundColor: colors.primary,
      }} />
      
      {/* Grid lines for map feel */}
      {Array.from({ length: 5 }).map((_, i) => (
        <View key={`v-${i}`} style={{
          position: 'absolute',
          left: `${i * 25}%`,
          top: 0,
          bottom: 0,
          width: 1,
          backgroundColor: colors.border,
          opacity: 0.3
        }} />
      ))}
      
      {Array.from({ length: 4 }).map((_, i) => (
        <View key={`h-${i}`} style={{
          position: 'absolute',
          top: `${i * 25}%`,
          left: 0,
          right: 0,
          height: 1,
          backgroundColor: colors.border,
          opacity: 0.3
        }} />
      ))}
    </View>
  );

  const renderLegend = () => (
    <View style={[
      roadworksStyles.row,
      { 
        position: 'absolute',
        bottom: spacing.sm,
        left: spacing.sm,
        backgroundColor: colors.surface,
        borderRadius: 8,
        padding: spacing.sm,
        gap: spacing.sm,
        ...roadworksStyles.shadows.sm
      }
    ]}>
      {[
        { severity: 'critical', label: 'Critical' },
        { severity: 'high', label: 'High' },
        { severity: 'medium', label: 'Medium' },
        { severity: 'low', label: 'Low' }
      ].map((item) => (
        <View key={item.severity} style={roadworksStyles.row}>
          <View style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: getClusterColor(item.severity),
            marginRight: spacing.xs
          }} />
          <Text style={[
            roadworksStyles.statTrendText,
            { fontSize: 10 }
          ]}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderStats = () => (
    <View style={[
      roadworksStyles.row,
      { 
        position: 'absolute',
        top: spacing.sm,
        left: spacing.sm,
        backgroundColor: colors.surface,
        borderRadius: 8,
        padding: spacing.sm,
        gap: spacing.md,
        ...roadworksStyles.shadows.sm
      }
    ]}>
      <View style={roadworksStyles.row}>
        <Ionicons name="construct" size={14} color={colors.primary} />
        <Text style={[roadworksStyles.statTrendText, { marginLeft: spacing.xs }]}>
          {roadworks.length}
        </Text>
      </View>
      
      <View style={roadworksStyles.row}>
        <Ionicons name="layers" size={14} color={colors.info} />
        <Text style={[roadworksStyles.statTrendText, { marginLeft: spacing.xs }]}>
          {clusteredRoadworks.length}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[
      roadworksStyles.filterContainer,
      { height: height, position: 'relative' }
    ]}>
      {/* Header */}
      <View style={[roadworksStyles.filterHeader, { marginBottom: spacing.sm }]}>
        <View style={roadworksStyles.row}>
          <Ionicons name="map" size={20} color={colors.primary} />
          <Text style={roadworksStyles.filterTitle}>Map Overview</Text>
          <View style={[roadworksStyles.tabBadge, { backgroundColor: colors.primary }]}>
            <Text style={roadworksStyles.tabBadgeText}>{roadworks.length}</Text>
          </View>
        </View>
        
        {onViewFullMap && (
          <Pressable
            style={roadworksStyles.quickActionButton}
            onPress={onViewFullMap}
          >
            <Ionicons name="expand" size={16} color={colors.textMuted} />
            <Text style={roadworksStyles.quickActionText}>Full Map</Text>
          </Pressable>
        )}
      </View>

      {/* Map Container */}
      <View style={{ 
        flex: 1, 
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
        ...roadworksStyles.shadows.md
      }}>
        {renderMapBackground()}
        
        {/* Roadwork Markers */}
        {clusteredRoadworks.map((cluster, index) => renderMapMarker(cluster, index))}
        
        {/* Map Controls */}
        {showControls && renderMapControls()}
        
        {/* Legend */}
        {showLabels && renderLegend()}
        
        {/* Stats */}
        {showLabels && renderStats()}
        
        {/* No Data Message */}
        {roadworks.length === 0 && (
          <View style={[
            roadworksStyles.emptyContainer,
            { 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'transparent'
            }
          ]}>
            <Ionicons name="map" size={32} color={colors.textMuted} />
            <Text style={[roadworksStyles.statTrendText, { marginTop: spacing.sm }]}>
              No roadworks to display
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default MapOverview;