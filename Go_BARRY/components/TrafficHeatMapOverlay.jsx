// components/TrafficHeatMapOverlay.jsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Text, Platform } from 'react-native';
import { useActiveFlows } from '../hooks/useTrafficFlow';

const TrafficHeatMapOverlay = ({ mapRef }) => {
  const { activeFlows, isLoading } = useActiveFlows();
  const heatmapLayerRef = useRef(null);

  useEffect(() => {
    if (!mapRef || !mapRef.current || Platform.OS !== 'web') return;
    
    const map = mapRef.current;
    
    // Create heat map data from flow monitoring
    const heatmapData = activeFlows.map(flow => ({
      lat: flow.coordinates?.[0] || 0,
      lng: flow.coordinates?.[1] || 0,
      weight: (100 - flow.speedRatio) / 100, // Inverse speed ratio for heat intensity
    })).filter(point => point.lat && point.lng);

    // Add heatmap layer to TomTom map
    if (window.tt && heatmapData.length > 0) {
      // Remove existing layer
      if (heatmapLayerRef.current) {
        map.removeLayer(heatmapLayerRef.current);
      }

      // Create GeoJSON from flow data
      const geojson = {
        type: 'FeatureCollection',
        features: heatmapData.map(point => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [point.lng, point.lat]
          },
          properties: {
            weight: point.weight
          }
        }))
      };

      // Add heatmap source
      if (!map.getSource('traffic-heat')) {
        map.addSource('traffic-heat', {
          type: 'geojson',
          data: geojson
        });
      } else {
        map.getSource('traffic-heat').setData(geojson);
      }

      // Add heatmap layer
      if (!map.getLayer('traffic-heat-layer')) {
        map.addLayer({
          id: 'traffic-heat-layer',
          type: 'heatmap',
          source: 'traffic-heat',
          paint: {
            'heatmap-weight': ['get', 'weight'],
            'heatmap-intensity': {
              stops: [[11, 1], [15, 3]]
            },
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(33,102,172,0)',
              0.2, 'rgb(103,169,207)',
              0.4, 'rgb(209,229,240)',
              0.6, 'rgb(253,219,199)',
              0.8, 'rgb(239,138,98)',
              1, 'rgb(178,24,43)'
            ],
            'heatmap-radius': {
              stops: [[11, 15], [15, 20]]
            },
            'heatmap-opacity': 0.7
          }
        });
        
        heatmapLayerRef.current = 'traffic-heat-layer';
      }
    }

    return () => {
      // Cleanup
      if (map && heatmapLayerRef.current) {
        if (map.getLayer(heatmapLayerRef.current)) {
          map.removeLayer(heatmapLayerRef.current);
        }
        if (map.getSource('traffic-heat')) {
          map.removeSource('traffic-heat');
        }
      }
    };
  }, [activeFlows, mapRef]);

  // Overlay stats
  return (
    <View style={styles.overlayContainer} pointerEvents="none">
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Traffic Flow</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#b21822' }]} />
            <Text style={styles.legendText}>Severe</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#ef8a62' }]} />
            <Text style={styles.legendText}>Heavy</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#fddbc7' }]} />
            <Text style={styles.legendText}>Moderate</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#67a9cf' }]} />
            <Text style={styles.legendText}>Light</Text>
          </View>
        </View>
      </View>
      
      {activeFlows.length > 0 && (
        <View style={styles.statsOverlay}>
          <Text style={styles.statsText}>
            {activeFlows.filter(f => f.speedRatio < 25).length} Critical
          </Text>
          <Text style={styles.statsText}>
            {activeFlows.filter(f => f.speedRatio < 50).length} Congested
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  legendContainer: {
    position: 'absolute',
    top: 80,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  legendItems: {
    gap: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 11,
    color: '#6b7280',
  },
  statsOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  statsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default TrafficHeatMapOverlay;