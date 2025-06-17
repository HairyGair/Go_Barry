// Go_BARRY/components/EnhancedTrafficMap.jsx
// TomTom-powered Interactive Traffic Map for Control Room Display
// Auto-zooms to alerts and shows markers with traffic overlay

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

const EnhancedTrafficMap = ({ alerts = [], currentAlert = null, alertIndex = 0, zoomTarget = null, onError = null }) => {
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

    console.log('🗺️ Initializing TomTom TrafficMap...');

    // Load TomTom Maps SDK dynamically for web
    const initializeTomTomMap = async () => {
      try {
        console.log('🚀 Starting TomTom map initialization...');
        
        // Check if we're in a browser environment
        if (typeof window === 'undefined' || typeof document === 'undefined') {
          throw new Error('Not in browser environment');
        }

        // Wait for container to be ready
        let retries = 0;
        while (retries < 10 && (!mapContainer.current || mapContainer.current.offsetWidth === 0)) {
          console.log(`⌛ Waiting for container (attempt ${retries + 1}/10)...`);
          await new Promise(resolve => setTimeout(resolve, 100));
          retries++;
        }
        
        if (!mapContainer.current) {
          throw new Error('Map container not ready after retries');
        }

        // Ensure container has proper dimensions
        if (mapContainer.current.offsetWidth === 0 || mapContainer.current.offsetHeight === 0) {
          console.log('📄 Setting container dimensions...');
          mapContainer.current.style.width = '100%';
          mapContainer.current.style.height = '300px';
          mapContainer.current.style.minHeight = '300px';
        }

        // Add TomTom Maps SDK script if not already loaded
        if (!window.tt) {
          console.log('📦 Loading TomTom Maps SDK script...');
          const script = document.createElement('script');
          script.src = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps-web.min.js';
          script.async = true;
          script.crossOrigin = 'anonymous';
          document.head.appendChild(script);
          
          await Promise.race([
            new Promise((resolve, reject) => {
              script.onload = () => {
                console.log('✅ TomTom script loaded successfully');
                resolve();
              };
              script.onerror = (error) => {
                console.error('❌ TomTom script failed to load:', error);
                reject(new Error('Failed to load TomTom Maps SDK script'));
              };
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('TomTom script load timeout')), 15000)
            )
          ]);
        }

        // Add TomTom CSS if not already added
        if (!document.querySelector('link[href*="tomtom"]')) {
          console.log('📄 Loading TomTom CSS...');
          const link = document.createElement('link');
          link.href = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps.css';
          link.rel = 'stylesheet';
          link.crossOrigin = 'anonymous';
          document.head.appendChild(link);
        }

        if (!window.tt) {
          throw new Error('TomTom Maps SDK failed to load');
        }

        console.log('✅ TomTom Maps SDK loaded successfully');

        // Validate API key
        if (!TOMTOM_API_KEY || TOMTOM_API_KEY === 'your_tomtom_api_key_here') {
          throw new Error('TomTom API key not configured. Set EXPO_PUBLIC_TOMTOM_API_KEY environment variable.');
        }

        console.log('🗺️ TomTom API Key validated:', TOMTOM_API_KEY ? `${TOMTOM_API_KEY.slice(0, 8)}...` : 'MISSING');

        console.log('🗺️ Creating TomTom map instance...', {
          container: mapContainer.current,
          width: mapContainer.current.offsetWidth,
          height: mapContainer.current.offsetHeight
        });

        // Create TomTom map instance
        const map = window.tt.map({
          key: TOMTOM_API_KEY,
          container: mapContainer.current,
          style: 'tomtom://vector/1/basic-main', // Clean vector style
          center: [-1.6131, 54.9783], // [lng, lat] for TomTom (reversed from our constant)
          zoom: DEFAULT_ZOOM,
          language: 'en-GB',
          geopoliticalView: 'GB'
        });

        console.log('🗺️ TomTom Map instance created');

        // Wait for map to load
        map.on('load', () => {
          console.log('✅ TomTom TrafficMap loaded successfully');
          setMapLoaded(true);
          setMapError(null);
          
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
          setMapError(`TomTom Map failed to load: ${e.error?.message || 'Unknown error'}`);
        });

        mapRef.current = map;

      } catch (error) {
        console.error('❌ Failed to initialize TomTom map:', error);
        const errorMessage = `Failed to initialize TomTom map: ${error.message}`;
        setMapError(errorMessage);
        if (onError) {
          onError(error);
        }
      }
    };

    // Use requestAnimationFrame to ensure DOM is ready
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          initializeTomTomMap();
        });
      });
    } else {
      setTimeout(initializeTomTomMap, 100);
    }

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

          // Create TomTom marker (TomTom uses [lng, lat] format)
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

  // Auto-zoom to alert when zoomTarget changes (from alert card clicks)
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !zoomTarget?.alert) return;

    try {
      const map = mapRef.current;
      const alert = zoomTarget.alert;
      
      if (!alert.coordinates || !Array.isArray(alert.coordinates) || alert.coordinates.length < 2) {
        console.warn('⚠️ Cannot zoom to alert without coordinates:', alert.title);
        return;
      }

      const [lat, lng] = alert.coordinates;

      console.log(`🎯 ZOOM TARGET: Zooming TomTom map to clicked alert: ${alert.title} at [${lat}, ${lng}]`);

      // Animate to the clicked alert location (TomTom uses [lng, lat])
      map.flyTo({
        center: [lng, lat],
        zoom: 16, // Even closer zoom for clicked alerts
        duration: 1500, // Faster animation for user-initiated zooms
        essential: true
      });

      // Highlight the clicked alert temporarily
      setTimeout(() => {
        const markerElement = document.getElementById(`alert-marker-${alertIndex}`);
        if (markerElement) {
          markerElement.style.animation = 'pulse 1s ease-in-out 3';
          console.log(`💥 Highlighting clicked alert marker`);
        }
      }, 1600); // After zoom completes

      console.log(`🎯 Map zoom to clicked alert "${alert.title}" completed`);

    } catch (error) {
      console.error('❌ Error zooming TomTom map to clicked alert:', error);
    }
  }, [zoomTarget, mapLoaded, alertIndex]);

  // Auto-zoom to current alert (fallback when no specific zoom target)
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !currentAlert || !currentAlert.coordinates || zoomTarget) return;

    try {
      const map = mapRef.current;
      const [lat, lng] = currentAlert.coordinates;

      console.log(`🎯 Auto-zooming TomTom map to current alert: ${currentAlert.title} at [${lat}, ${lng}]`);

      // Animate to the current alert location (TomTom uses [lng, lat])
      map.flyTo({
        center: [lng, lat],
        zoom: 15, // Closer zoom for alert details
        duration: 2500, // 2.5 second animation
        essential: true
      });

      console.log(`🎯 TomTom Map zooming to alert "${currentAlert.title}" at [${lat}, ${lng}]`);

    } catch (error) {
      console.error('❌ Error zooming TomTom map to alert:', error);
    }
  }, [currentAlert, alertIndex, mapLoaded, zoomTarget]);

  // Reset to overview when no alerts or no current alert
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    if (!alerts.length || !currentAlert) {
      try {
        const map = mapRef.current;
        console.log('🔄 Resetting TomTom map to North East England overview');
        map.flyTo({
          center: [-1.6131, 54.9783], // [lng, lat] for TomTom
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
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>TomTom Map Error</Text>
        <Text style={styles.errorText}>{mapError}</Text>
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>Debug Info:</Text>
          <Text style={styles.debugText}>API Key: {TOMTOM_API_KEY ? 'Present' : 'Missing'}</Text>
          <Text style={styles.debugText}>Platform: {Platform.OS}</Text>
          <Text style={styles.debugText}>Container: {mapContainer.current ? 'Ready' : 'Not ready'}</Text>
        </View>
        <Text style={styles.fallbackText}>
          Check browser console for detailed errors
        </Text>
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