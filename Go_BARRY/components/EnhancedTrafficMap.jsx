// Go_BARRY/components/EnhancedTrafficMap.jsx
// TomTom-powered Interactive Traffic Map for Control Room Display
// Auto-zooms to alerts and shows markers with traffic overlay

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

const EnhancedTrafficMap = ({ alerts = [], currentAlert = null, alertIndex = 0 }) => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [trafficLayerVisible, setTrafficLayerVisible] = useState(true);

  // TomTom API key - using environment variable
  const TOMTOM_API_KEY = process.env.EXPO_PUBLIC_TOMTOM_API_KEY || 'your_tomtom_api_key_here';

  console.log('🗺️ TomTom Map - API key available:', TOMTOM_API_KEY ? 'Yes' : 'No');
  console.log('🌐 Platform:', Platform.OS);

  // North East England center coordinates
  const NE_ENGLAND_CENTER = [54.9783, -1.6131]; // [lat, lng] for TomTom
  const DEFAULT_ZOOM = 10;

  useEffect(() => {
    if (Platform.OS !== 'web' || !mapContainer.current) return;

    // Check if we're on localhost
    const isLocalhost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || 
       window.location.hostname === '127.0.0.1' || 
       window.location.hostname.includes('localhost'));
    
    if (isLocalhost) {
      console.log('🏠 Localhost detected - TomTom may be restricted');
      setMapError('TomTom Map disabled on localhost - Deploy to see live traffic map');
      return;
    }

    console.log('🗺️ Initializing TomTom TrafficMap...');

    // Load TomTom Maps SDK dynamically for web
    const initializeTomTomMap = async () => {
      try {
        console.log('🚀 Starting TomTom map initialization...');
        
        // Check if we're in a browser environment
        if (typeof window === 'undefined' || typeof document === 'undefined') {
          throw new Error('Not in browser environment');
        }

        // Add TomTom Maps SDK script if not already loaded
        if (!window.tt) {
          console.log('📦 Loading TomTom Maps SDK script...');
          const script = document.createElement('script');
          script.src = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps.min.js';
          script.async = true;
          document.head.appendChild(script);
          
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load TomTom Maps SDK script'));
          });
        }

        // Add TomTom CSS if not already added
        if (!document.querySelector('link[href*="tomtom"]')) {
          console.log('📄 Loading TomTom CSS...');
          const link = document.createElement('link');
          link.href = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps.css';
          link.rel = 'stylesheet';
          document.head.appendChild(link);
        }

        if (!window.tt) {
          throw new Error('TomTom Maps SDK failed to load');
        }

        console.log('✅ TomTom Maps SDK loaded successfully');

        // Create TomTom map instance
        const map = window.tt.map({
          key: TOMTOM_API_KEY,
          container: mapContainer.current,
          style: 'tomtom://vector/1/basic-main', // Clean vector style
          center: NE_ENGLAND_CENTER,
          zoom: DEFAULT_ZOOM,
          language: 'en-GB',
          geopoliticalView: 'GB'
        });

        console.log('🗺️ TomTom Map instance created');

        // Wait for map to load
        map.on('load', () => {
          console.log('✅ TomTom TrafficMap loaded successfully');
          setMapLoaded(true);
          
          // Add traffic flow layer
          if (trafficLayerVisible) {
            try {
              map.addLayer({
                id: 'traffic-flow',
                type: 'raster',
                source: {
                  type: 'raster',
                  tiles: [`https://api.tomtom.com/traffic/map/4/tile/flow/relative/{z}/{x}/{y}.png?key=${TOMTOM_API_KEY}`],
                  tileSize: 256
                },
                paint: {
                  'raster-opacity': 0.7
                }
              });
              console.log('🚦 Traffic flow layer added');
            } catch (error) {
              console.warn('⚠️ Could not add traffic layer:', error);
            }
          }

          // Add traffic incidents layer
          try {
            map.addLayer({
              id: 'traffic-incidents',
              type: 'raster',
              source: {
                type: 'raster',
                tiles: [`https://api.tomtom.com/traffic/map/4/tile/incidents/s3/{z}/{x}/{y}.png?key=${TOMTOM_API_KEY}`],
                tileSize: 256
              },
              paint: {
                'raster-opacity': 0.8
              }
            });
            console.log('🚨 Traffic incidents layer added');
          } catch (error) {
            console.warn('⚠️ Could not add incidents layer:', error);
          }

          console.log('🎨 TomTom Map layers added successfully');
        });

        map.on('error', (e) => {
          console.error('❌ TomTom Map error:', e);
          setMapError('TomTom Map failed to load properly');
        });

        mapRef.current = map;

      } catch (error) {
        console.error('❌ Failed to initialize TomTom map:', error);
        setMapError(`Failed to initialize TomTom map: ${error.message}`);
      }
    };

    initializeTomTomMap();

    // Cleanup
    return () => {
      if (mapRef.current) {
        console.log('🧹 Cleaning up TomTom map...');
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [TOMTOM_API_KEY, trafficLayerVisible]);

  // Add alert markers when alerts change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !alerts.length) return;

    try {
      const map = mapRef.current;
      
      console.log(`📍 Adding ${alerts.length} alert markers to TomTom map, current index: ${alertIndex}`);
      
      // Clear existing markers
      alerts.forEach((_, index) => {
        const markerId = `alert-marker-${index}`;
        const existingMarker = document.getElementById(markerId);
        if (existingMarker) {
          existingMarker.remove();
        }
      });

      // Add new markers for alerts with coordinates
      alerts
        .filter(alert => alert.coordinates && Array.isArray(alert.coordinates) && alert.coordinates.length >= 2)
        .forEach((alert, index) => {
          const isCurrent = index === alertIndex;
          const [lat, lng] = alert.coordinates;

          // Create custom marker element
          const markerElement = document.createElement('div');
          markerElement.id = `alert-marker-${index}`;
          markerElement.className = `tomtom-marker ${isCurrent ? 'current-alert' : ''}`;
          
          // Get severity color
          const getSeverityColor = () => {
            switch (alert.severity?.toLowerCase()) {
              case 'critical':
              case 'high':
                return '#DC2626';
              case 'medium':
                return '#F59E0B';
              case 'low':
                return '#10B981';
              default:
                return '#6B7280';
            }
          };

          // Create marker content
          markerElement.innerHTML = `
            <div style="
              width: ${isCurrent ? '30px' : '20px'};
              height: ${isCurrent ? '30px' : '20px'};
              border-radius: 50%;
              background-color: ${getSeverityColor()};
              border: ${isCurrent ? '4px' : '2px'} solid #FFFFFF;
              box-shadow: 0 ${isCurrent ? '4px 12px' : '2px 6px'} rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              transition: all 0.3s ease;
              position: relative;
              ${isCurrent ? 'animation: pulse 2s infinite;' : ''}
            ">
              ${isCurrent ? '🚨' : '⚠️'}
            </div>
            ${isCurrent ? `
              <div style="
                position: absolute;
                top: -35px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: bold;
                white-space: nowrap;
                max-width: 200px;
                overflow: hidden;
                text-overflow: ellipsis;
              ">
                ${(alert.title || 'Alert').substring(0, 30)}${alert.title?.length > 30 ? '...' : ''}
              </div>
            ` : ''}
          `;

          // Add pulsing animation styles if not already added
          if (!document.getElementById('tomtom-marker-styles')) {
            const styles = document.createElement('style');
            styles.id = 'tomtom-marker-styles';
            styles.textContent = `
              @keyframes pulse {
                0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7); }
                70% { box-shadow: 0 0 0 20px rgba(220, 38, 38, 0); }
                100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
              }
              .tomtom-marker:hover {
                transform: scale(1.2);
              }
            `;
            document.head.appendChild(styles);
          }

          // Create TomTom marker
          const marker = new window.tt.Marker(markerElement)
            .setLngLat([lng, lat])
            .addTo(map);

          // Add click handler for marker
          markerElement.addEventListener('click', () => {
            console.log(`📌 Clicked alert: ${alert.title}`);
            // You could emit an event or call a callback here
          });

          console.log(`📌 Added TomTom marker ${index}: ${alert.title} at [${lat}, ${lng}] - Current: ${isCurrent}`);
        });

      console.log(`✅ Added ${alerts.filter(a => a.coordinates && a.coordinates.length === 2).length} markers to TomTom map`);

    } catch (error) {
      console.error('❌ Error adding markers to TomTom map:', error);
    }
  }, [alerts, alertIndex, mapLoaded]);

  // Auto-zoom to current alert
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !currentAlert || !currentAlert.coordinates) return;

    try {
      const map = mapRef.current;
      const [lat, lng] = currentAlert.coordinates;

      console.log(`🎯 Auto-zooming TomTom map to current alert: ${currentAlert.title} at [${lat}, ${lng}]`);

      // Animate to the current alert location
      map.flyTo({
        center: [lat, lng],
        zoom: 15, // Closer zoom for alert details
        duration: 2500, // 2.5 second animation
        essential: true
      });

      console.log(`🎯 TomTom Map zooming to alert "${currentAlert.title}" at [${lat}, ${lng}]`);

    } catch (error) {
      console.error('❌ Error zooming TomTom map to alert:', error);
    }
  }, [currentAlert, alertIndex, mapLoaded]);

  // Reset to overview when no alerts or no current alert
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    if (!alerts.length || !currentAlert) {
      try {
        const map = mapRef.current;
        console.log('🔄 Resetting TomTom map to North East England overview');
        map.flyTo({
          center: NE_ENGLAND_CENTER,
          zoom: DEFAULT_ZOOM,
          duration: 2000,
          essential: true
        });
        console.log('🗺️ TomTom Map reset to North East England overview');
      } catch (error) {
        console.error('❌ Error resetting TomTom map view:', error);
      }
    }
  }, [alerts.length, currentAlert, mapLoaded]);

  // Toggle traffic layer
  const toggleTrafficLayer = () => {
    if (!mapRef.current || !mapLoaded) return;
    
    const newVisibility = !trafficLayerVisible;
    setTrafficLayerVisible(newVisibility);
    
    try {
      const map = mapRef.current;
      if (newVisibility) {
        map.setLayoutProperty('traffic-flow', 'visibility', 'visible');
        map.setLayoutProperty('traffic-incidents', 'visibility', 'visible');
      } else {
        map.setLayoutProperty('traffic-flow', 'visibility', 'none');
        map.setLayoutProperty('traffic-incidents', 'visibility', 'none');
      }
      console.log(`🚦 Traffic layer ${newVisibility ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('❌ Error toggling traffic layer:', error);
    }
  };

  // Handle non-web platforms
  if (Platform.OS !== 'web') {
    return (
      <View style={styles.unsupportedContainer}>
        <Text style={styles.unsupportedIcon}>🗺️</Text>
        <Text style={styles.unsupportedText}>
          TomTom interactive map view is only available on web browsers
        </Text>
      </View>
    );
  }

  // Handle map errors
  if (mapError) {
    const isLocalhostError = mapError.includes('localhost');
    
    return (
      <View style={isLocalhostError ? styles.localhostContainer : styles.errorContainer}>
        <Text style={styles.errorIcon}>{isLocalhostError ? '🏠' : '⚠️'}</Text>
        <Text style={[styles.errorTitle, isLocalhostError && styles.localhostTitle]}>
          {isLocalhostError ? 'Development Mode' : 'TomTom Map Error'}
        </Text>
        <Text style={[styles.errorText, isLocalhostError && styles.localhostText]}>{mapError}</Text>
        {isLocalhostError && (
          <View style={styles.localhostInfo}>
            <Text style={styles.localhostInfoText}>
              ✨ On production: Shows TomTom map with live traffic overlay
            </Text>
            <Text style={styles.localhostInfoText}>
              📍 Auto-zooms to current rotating alert location
            </Text>
            <Text style={styles.localhostInfoText}>
              🚦 Real-time traffic flow and incident visualization
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <div
        ref={mapContainer}
        style={styles.mapContainer}
      />
      {!mapLoaded && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingIcon}>🗺️</Text>
          <Text style={styles.loadingText}>Loading TomTom traffic map...</Text>
          <Text style={styles.loadingSubtext}>Connecting to TomTom...</Text>
        </View>
      )}
      {mapLoaded && (
        <View style={styles.mapControls}>
          <TouchableOpacity 
            style={[styles.trafficToggle, { backgroundColor: trafficLayerVisible ? '#10B981' : '#6B7280' }]}
            onPress={toggleTrafficLayer}
          >
            <Text style={styles.trafficToggleText}>
              🚦 {trafficLayerVisible ? 'Traffic ON' : 'Traffic OFF'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      {mapLoaded && alerts.length > 0 && (
        <View style={styles.mapInfo}>
          <Text style={styles.mapInfoText}>
            🗺️ TomTom • {alerts.filter(a => a.coordinates && a.coordinates.length === 2).length} alerts
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  mapContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(243, 244, 246, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  loadingIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  loadingText: {
    color: '#1F2937',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  loadingSubtext: {
    color: '#6B7280',
    fontSize: 14,
  },
  mapControls: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  trafficToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  trafficToggleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  mapInfo: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mapInfoText: {
    color: '#1F2937',
    fontSize: 12,
    fontWeight: '500',
  },
  unsupportedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(243, 244, 246, 0.8)',
    borderRadius: 16,
    padding: 32,
  },
  unsupportedIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  unsupportedText: {
    color: '#374151',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 16,
    padding: 32,
  },
  localhostContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 16,
    padding: 32,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  errorTitle: {
    color: '#ef4444',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  localhostTitle: {
    color: '#3b82f6',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  localhostText: {
    color: '#3b82f6',
    marginBottom: 20,
  },
  localhostInfo: {
    alignItems: 'center',
    gap: 8,
  },
  localhostInfoText: {
    color: '#1e40af',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
});

// Add TouchableOpacity for web
const TouchableOpacity = Platform.OS === 'web' 
  ? ({ children, style, onPress, ...props }) => (
      <div 
        style={{ 
          ...style, 
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'opacity 0.2s'
        }}
        onClick={onPress}
        onMouseDown={(e) => e.target.style.opacity = '0.7'}
        onMouseUp={(e) => e.target.style.opacity = '1'}
        onMouseLeave={(e) => e.target.style.opacity = '1'}
        {...props}
      >
        {children}
      </div>
    )
  : require('react-native').TouchableOpacity;

export default EnhancedTrafficMap;