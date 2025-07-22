/*
 * Go Barry - Incidents Map Component
 * Shows all incidents on an interactive map
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, shadows } from '../styles/incidents.styles';

const IncidentMap = ({ 
  incidents = [], 
  visible = false, 
  onClose,
  selectedIncident = null,
  onIncidentSelect
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);

  // Initialize map when modal opens
  useEffect(() => {
    if (visible && Platform.OS === 'web' && !mapLoaded) {
      // Add CSS for pulse animation
      if (!document.querySelector('#incident-map-styles')) {
        const style = document.createElement('style');
        style.id = 'incident-map-styles';
        style.innerHTML = `
          @keyframes pulse {
            0% {
              box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7);
            }
            70% {
              box-shadow: 0 0 0 10px rgba(220, 38, 38, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(220, 38, 38, 0);
            }
          }
          .incident-marker {
            background-color: white;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          }
        `;
        document.head.appendChild(style);
      }
      initializeMap();
    }
  }, [visible]);

  const initializeMap = async () => {
    try {
      // Check if Mapbox is available
      if (typeof window !== 'undefined' && window.mapboxgl) {
        const mapboxgl = window.mapboxgl;
        
        // Set access token
        mapboxgl.accessToken = 'pk.eyJ1IjoiaGFpcnlnYWlyMDAiLCJhIjoiY21iZ29heWg4MDEweTJsczMwbXJrZGRwcyJ9.X01ySycRdttY_Wt76n2vEg';
        
        // Create map
        const map = new mapboxgl.Map({
          container: mapRef.current,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: [-1.6137, 54.9783], // Newcastle
          zoom: 10
        });
        
        mapInstanceRef.current = map;
        
        map.on('load', () => {
          setMapLoaded(true);
          addIncidentMarkers();
        });
        
        // Add navigation controls
        map.addControl(new mapboxgl.NavigationControl());
        
      } else {
        setMapError('Map library not loaded');
      }
    } catch (error) {
      console.error('Map initialization error:', error);
      setMapError('Failed to initialize map');
    }
  };

  const addIncidentMarkers = () => {
    if (!mapInstanceRef.current || !window.mapboxgl) return;
    
    const mapboxgl = window.mapboxgl;
    const map = mapInstanceRef.current;
    
    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    // Add markers for each incident
    incidents.forEach(incident => {
      if (incident.coordinates) {
        const lat = parseFloat(incident.coordinates.lat || incident.coordinates.latitude);
        const lng = parseFloat(incident.coordinates.lng || incident.coordinates.longitude || incident.coordinates.lon);
        
        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
          console.log(`Adding marker for ${incident.title} at [${lng}, ${lat}]`);
          // Create custom marker element
          const el = document.createElement('div');
          el.className = 'incident-marker';
          el.style.width = '24px';
          el.style.height = '24px';
          el.style.borderRadius = '50%';
          el.style.border = '3px solid white';
          el.style.cursor = 'pointer';
          el.style.position = 'relative';
          
          // Color based on priority
          const markerColor = incident.priority === 'high' ? '#DC2626' : 
                            incident.priority === 'medium' ? '#F59E0B' : '#059669';
          el.style.backgroundColor = markerColor;
          
          // Add pulse animation for active incidents
          if (incident.status === 'active') {
            el.style.animation = 'pulse 2s infinite';
          }
          
          // Create marker with proper anchor
          const marker = new mapboxgl.Marker({
            element: el,
            anchor: 'center'
          })
            .setLngLat([lng, lat])
            .setPopup(
              new mapboxgl.Popup({ offset: 25 })
                .setHTML(`
                  <div style="padding: 8px;">
                    <h3 style="font-weight: bold; margin: 0 0 4px 0;">${incident.title}</h3>
                    <p style="margin: 0 0 4px 0; color: #666;">${incident.location}</p>
                    <p style="margin: 0; font-size: 12px;">
                      <span style="color: ${markerColor}; font-weight: bold;">${incident.priority.toUpperCase()}</span>${incident.affectsRoutes?.length ? ` • Routes: ${incident.affectsRoutes.join(', ')}` : ''}
                    </p>
                  </div>
                `)
            )
            .addTo(map);
          
          // Add click handler
          el.addEventListener('click', () => {
            if (onIncidentSelect) {
              onIncidentSelect(incident);
            }
          });
          
          markersRef.current.push(marker);
        }
      }
    });
    
    // Fit map to show all markers
    if (markersRef.current.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      markersRef.current.forEach(marker => {
        bounds.extend(marker.getLngLat());
      });
      map.fitBounds(bounds, { padding: 50, maxZoom: 14 });
    } else {
      // If no markers, ensure we're centered on Newcastle
      map.setCenter([-1.6137, 54.9783]);
      map.setZoom(10);
    }
  };

  // Update markers when incidents change
  useEffect(() => {
    if (mapLoaded) {
      addIncidentMarkers();
    }
  }, [incidents, mapLoaded]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Incidents Map</Text>
          <Text style={styles.subtitle}>
            {incidents.filter(i => i.coordinates).length} incidents with location data
          </Text>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textInverse} />
          </Pressable>
        </View>
        
        {/* Map Container */}
        <View style={styles.mapContainer}>
          {Platform.OS === 'web' ? (
            <>
              <div
                ref={mapRef}
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'absolute',
                  top: 0,
                  left: 0
                }}
              />
              {mapError && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={48} color={colors.error} />
                  <Text style={styles.errorText}>{mapError}</Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.mobileMessage}>
              <Ionicons name="map" size={48} color={colors.textMuted} />
              <Text style={styles.mobileText}>
                Map view is only available on web
              </Text>
            </View>
          )}
        </View>
        
        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Priority Levels:</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
              <Text style={styles.legendText}>High</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
              <Text style={styles.legendText}>Medium</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <Text style={styles.legendText}>Low</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  header: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 50 : spacing.lg,
  },
  
  title: {
    ...typography.h2,
    color: colors.textInverse,
    marginBottom: spacing.xs,
  },
  
  subtitle: {
    ...typography.body,
    color: colors.textInverse,
    opacity: 0.8,
  },
  
  closeButton: {
    position: 'absolute',
    right: spacing.lg,
    top: Platform.OS === 'ios' ? 50 : spacing.lg,
    padding: spacing.sm,
  },
  
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  
  errorText: {
    ...typography.body,
    color: colors.error,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  
  mobileMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  
  mobileText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  
  legend: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.lg,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: spacing.borderRadius,
    ...shadows.md,
  },
  
  legendTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  
  legendItems: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  
  legendText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});

export default IncidentMap;
