// Disruption map component for web
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Type color mapping (same as DisruptionCard)
const TYPE_COLORS = {
  roadwork: '#f97316',
  incident: '#ef4444',
  event: '#8b5cf6',
  weather: '#3b82f6',
  breakdown: '#f59e0b',
};

// Conditionally import mapbox-gl for web
let mapboxgl = null;
if (Platform.OS === 'web') {
  mapboxgl = require('mapbox-gl');
  require('mapbox-gl/dist/mapbox-gl.css');
}

export default function DisruptionMap({ 
  disruptions, 
  selectedDisruption,
  onDisruptionSelect,
  mapStyle = 'streets-v11',
  initialCenter = [-1.6178, 54.9783], // Newcastle
  initialZoom = 10
}) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (Platform.OS !== 'web' || map.current) return;

    // Get TomTom API key from environment or use default
    const apiKey = process.env.EXPO_PUBLIC_TOMTOM_API_KEY || '9rZJqtnfYpOzlqnypI97nFb5oX17SNzp';
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: `https://api.tomtom.com/style/1/style/*?map=2/basic_street-light&poi=2/poi_dynamic-light&key=${apiKey}`,
      center: initialCenter,
      zoom: initialZoom,
      attributionControl: false
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Set loaded state
    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Update markers when disruptions change
  useEffect(() => {
    if (!map.current || !mapLoaded || !disruptions) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new markers
    disruptions.forEach(disruption => {
      if (!disruption.location?.coordinates) return;

      const { lat, lng } = disruption.location.coordinates;
      const color = TYPE_COLORS[disruption.type] || '#6b7280';

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'disruption-marker';
      el.style.backgroundColor = color;
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.borderRadius = '50%';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';

      // Add severity indicator
      if (disruption.severity === 'critical') {
        el.style.animation = 'pulse 2s infinite';
      }

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <div style="padding: 8px; max-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">
              ${disruption.title}
            </h3>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280;">
              ${disruption.location.description}
            </p>
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
              <span style="background-color: ${color}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">
                ${disruption.type}
              </span>
              <span style="background-color: ${getSeverityColor(disruption.severity)}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">
                ${disruption.severity}
              </span>
            </div>
            ${disruption.affectedRoutes?.length > 0 ? `
              <p style="margin: 8px 0 0 0; font-size: 11px; color: #6b7280;">
                Routes: ${disruption.affectedRoutes.slice(0, 3).join(', ')}${disruption.affectedRoutes.length > 3 ? '...' : ''}
              </p>
            ` : ''}
          </div>
        `);

      // Create marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map.current);

      // Handle click
      el.addEventListener('click', () => {
        if (onDisruptionSelect) {
          onDisruptionSelect(disruption);
        }
      });

      markers.current.push(marker);
    });

    // Add pulse animation
    if (!document.getElementById('disruption-map-styles')) {
      const style = document.createElement('style');
      style.id = 'disruption-map-styles';
      style.textContent = `
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
  }, [disruptions, mapLoaded]);

  // Focus on selected disruption
  useEffect(() => {
    if (!map.current || !selectedDisruption?.location?.coordinates) return;

    const { lat, lng } = selectedDisruption.location.coordinates;
    
    map.current.flyTo({
      center: [lng, lat],
      zoom: 14,
      duration: 1000
    });

    // Open popup for selected marker
    const marker = markers.current.find(m => {
      const lngLat = m.getLngLat();
      return Math.abs(lngLat.lng - lng) < 0.0001 && Math.abs(lngLat.lat - lat) < 0.0001;
    });
    
    if (marker) {
      marker.togglePopup();
    }
  }, [selectedDisruption]);

  // Fit bounds to show all disruptions
  const fitToDisruptions = () => {
    if (!map.current || !disruptions || disruptions.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    
    disruptions.forEach(disruption => {
      if (disruption.location?.coordinates) {
        const { lat, lng } = disruption.location.coordinates;
        bounds.extend([lng, lat]);
      }
    });

    map.current.fitBounds(bounds, {
      padding: 50,
      maxZoom: 14
    });
  };

  // Helper function for severity colors
  const getSeverityColor = (severity) => {
    const colors = {
      critical: '#dc2626',
      high: '#f97316',
      medium: '#f59e0b',
      low: '#10b981',
    };
    return colors[severity] || '#6b7280';
  };

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.unsupportedContainer}>
        <Text style={styles.unsupportedText}>
          Map view is only available on web
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      
      {/* Map legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Disruption Types</Text>
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <View key={type} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </View>
        ))}
      </View>

      {/* Stats overlay */}
      {disruptions && (
        <View style={styles.statsOverlay}>
          <Text style={styles.statsText}>
            {disruptions.length} disruptions
          </Text>
          <TouchableOpacity onPress={fitToDisruptions} style={styles.fitButton}>
            <Ionicons name="expand-outline" size={16} color="#2563eb" />
            <Text style={styles.fitText}>Fit all</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  unsupportedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  unsupportedText: {
    fontSize: 16,
    color: '#6b7280',
  },
  legend: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
  statsOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginRight: 12,
  },
  fitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderLeftWidth: 1,
    borderLeftColor: '#e5e7eb',
    paddingLeft: 12,
  },
  fitText: {
    fontSize: 13,
    color: '#2563eb',
    marginLeft: 4,
  },
});
