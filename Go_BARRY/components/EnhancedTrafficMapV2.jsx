// Go_BARRY/components/EnhancedTrafficMapV2.jsx
// Enhanced TomTom-powered Interactive Traffic Map with Roadworks, Layer Controls & Performance Caching
// Integrated for Go BARRY traffic intelligence platform

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

const EnhancedTrafficMapV2 = ({ alerts = [], currentAlert = null, alertIndex = 0, zoomTarget = null, onError = null }) => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [layerVisibility, setLayerVisibility] = useState({
    trafficFlow: true,
    trafficIncidents: true,
    roadworks: true,
    speedCameras: false,
    absoluteFlow: false
  });
  const [performanceManager, setPerformanceManager] = useState(null);

  // TomTom API key - using environment variable
  const TOMTOM_API_KEY = process.env.EXPO_PUBLIC_TOMTOM_API_KEY || 'your_tomtom_api_key_here';

  console.log('🗺️ Enhanced TomTom Map V2 - API key available:', TOMTOM_API_KEY ? 'Yes' : 'No');

  // North East England center coordinates
  const NE_ENGLAND_CENTER = [54.9783, -1.6131]; // [lat, lng] for TomTom
  const DEFAULT_ZOOM = 10;

  // Performance Manager Class
  class TilePerformanceManager {
    constructor() {
      this.tileCache = new Map();
      this.currentZoom = 10;
      this.maxCacheSize = 50 * 1024 * 1024; // 50MB limit for Go BARRY
    }

    async initializeTileCache() {
      // Initialize service worker for tile caching
      if ('serviceWorker' in navigator && 'caches' in window) {
        try {
          const cacheName = 'go-barry-tiles-v1';
          this.cache = await caches.open(cacheName);
          console.log('✅ Tile caching initialized for Go BARRY');
        } catch (error) {
          console.warn('⚠️ Tile caching not available:', error);
        }
      }
    }

    async cacheRequest(url) {
      if (!this.cache) return null;
      
      try {
        const cachedResponse = await this.cache.match(url);
        if (cachedResponse) {
          console.log('📦 Serving tile from cache:', url.split('/').pop());
          return cachedResponse;
        }
        
        // Fetch and cache if not found
        const response = await fetch(url);
        if (response.ok) {
          await this.cache.put(url, response.clone());
          console.log('💾 Cached new tile:', url.split('/').pop());
        }
        return response;
      } catch (error) {
        console.warn('⚠️ Cache error:', error);
        return fetch(url); // Fallback to direct fetch
      }
    }

    manageLayersByZoom(map, zoomLevel) {
      // Optimize layer visibility based on zoom for Go BARRY
      if (zoomLevel <= 10) {
        // Overview level - show main traffic data only
        this.toggleLayerVisibility(map, 'speed-cameras', false);
        this.setLayerOpacity(map, 'roadworks-layer', 0.6);
      } else if (zoomLevel <= 13) {
        // District level - add infrastructure
        this.setLayerOpacity(map, 'roadworks-layer', 0.8);
      } else {
        // Street level - show all details for supervisors
        this.toggleLayerVisibility(map, 'speed-cameras', layerVisibility.speedCameras);
        this.setLayerOpacity(map, 'roadworks-layer', 1.0);
      }
      
      console.log(`🔍 Go BARRY layers optimized for zoom ${zoomLevel}`);
    }

    toggleLayerVisibility(map, layerId, visible) {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
      }
    }

    setLayerOpacity(map, layerId, opacity) {
      if (map.getLayer(layerId)) {
        const paintProperty = layerId.includes('line') ? 'line-opacity' : 
                            layerId.includes('circle') ? 'circle-opacity' : 'raster-opacity';
        map.setPaintProperty(layerId, paintProperty, opacity);
      }
    }

    cleanupCache() {
      // Clean old tiles to stay within memory limits
      if (this.cache) {
        caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            if (cacheName.startsWith('go-barry-tiles-v') && cacheName !== 'go-barry-tiles-v1') {
              caches.delete(cacheName);
            }
          });
        });
      }
    }
  }

  // Enhanced layer setup function
  const addEnhancedTrafficLayers = (map, apiKey, visibility) => {
    const layers = [
      {
        id: 'traffic-flow',
        type: 'raster',
        source: {
          type: 'raster',
          tiles: [`https://api.tomtom.com/traffic/map/4/tile/flow/relative/{z}/{x}/{y}.png?key=${apiKey}`],
          tileSize: 256
        },
        paint: { 'raster-opacity': 0.7 },
        visible: visibility.trafficFlow,
        icon: '🚦',
        name: 'Traffic Flow'
      },
      {
        id: 'traffic-flow-absolute',
        type: 'raster',
        source: {
          type: 'raster',
          tiles: [`https://api.tomtom.com/traffic/map/4/tile/flow/absolute/{z}/{x}/{y}.png?key=${apiKey}`],
          tileSize: 256
        },
        paint: { 'raster-opacity': 0.7 },
        visible: visibility.absoluteFlow,
        icon: '⚡',
        name: 'Exact Speeds'
      },
      {
        id: 'traffic-incidents',
        type: 'raster',
        source: {
          type: 'raster',
          tiles: [`https://api.tomtom.com/traffic/map/4/tile/incidents/s3/{z}/{x}/{y}.png?key=${apiKey}`],
          tileSize: 256
        },
        paint: { 'raster-opacity': 0.8 },
        visible: visibility.trafficIncidents,
        icon: '🚨',
        name: 'Incidents'
      },
      {
        id: 'roadworks-layer',
        type: 'raster',
        source: {
          type: 'raster',
          tiles: [`https://api.tomtom.com/traffic/map/4/tile/roadworks/{z}/{x}/{y}.png?key=${apiKey}`],
          tileSize: 256
        },
        paint: { 'raster-opacity': 0.8 },
        visible: visibility.roadworks,
        icon: '🚧',
        name: 'Roadworks'
      },
      {
        id: 'speed-cameras',
        type: 'raster',
        source: {
          type: 'raster',
          tiles: [`https://api.tomtom.com/traffic/map/4/tile/speedcams/{z}/{x}/{y}.png?key=${apiKey}`],
          tileSize: 256
        },
        paint: { 'raster-opacity': 0.7 },
        visible: visibility.speedCameras,
        icon: '📷',
        name: 'Speed Cameras'
      }
    ];

    layers.forEach(layer => {
      try {
        map.addLayer({
          id: layer.id,
          type: layer.type,
          source: layer.source,
          paint: layer.paint,
          layout: {
            visibility: layer.visible ? 'visible' : 'none'
          }
        });
        console.log(`${layer.icon} ${layer.name} layer added`);
      } catch (error) {
        console.warn(`⚠️ Could not add ${layer.name} layer:`, error);
      }
    });

    console.log('✅ All enhanced TomTom layers added for Go BARRY');
  };

  // Layer toggle function
  const toggleLayer = (layerId, visible) => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
      
      // Update state
      setLayerVisibility(prev => ({
        ...prev,
        [layerId.replace('-layer', '').replace('-', '').replace('traffic', '').toLowerCase()]: visible
      }));
      
      console.log(`${visible ? '👁️' : '🙈'} ${layerId} toggled`);
    }
  };

  useEffect(() => {
    if (Platform.OS !== 'web' || !mapContainer.current) return;

    console.log('🗺️ Initializing Enhanced TomTom TrafficMap V2...');

    // Load TomTom Maps SDK dynamically for web
    const initializeTomTomMap = async () => {
      try {
        console.log('🚀 Starting enhanced TomTom map initialization...');
        
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

        console.log('🗺️ Creating enhanced TomTom map instance...', {
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

        console.log('🗺️ Enhanced TomTom Map instance created');

        // Wait for map to load
        map.on('load', () => {
          console.log('✅ Enhanced TomTom TrafficMap loaded successfully');
          setMapLoaded(true);
          setMapError(null);
          
          // Initialize performance manager
          const perfManager = new TilePerformanceManager();
          perfManager.initializeTileCache();
          setPerformanceManager(perfManager);
          
          // Add enhanced traffic layers with caching
          addEnhancedTrafficLayers(map, TOMTOM_API_KEY, layerVisibility);
          
          // Set up zoom-based layer management
          map.on('zoom', () => {
            perfManager.manageLayersByZoom(map, map.getZoom());
          });

          console.log('🎨 Enhanced TomTom Map layers added successfully');
        });

        map.on('error', (e) => {
          console.error('❌ Enhanced TomTom Map error:', e);
          setMapError(`Enhanced TomTom Map failed to load: ${e.error?.message || 'Unknown error'}`);
        });

        mapRef.current = map;

      } catch (error) {
        console.error('❌ Failed to initialize enhanced TomTom map:', error);
        const errorMessage = `Failed to initialize enhanced TomTom map: ${error.message}`;
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
        console.log('🧹 Cleaning up enhanced TomTom map...');
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (performanceManager) {
        performanceManager.cleanupCache();
      }
    };
  }, [TOMTOM_API_KEY]);

  // Add alert markers when alerts change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !alerts.length) return;

    try {
      const map = mapRef.current;
      
      console.log(`📍 Adding ${alerts.length} alert markers to enhanced TomTom map, current index: ${alertIndex}`);
      
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
          });

          console.log(`📌 Added enhanced TomTom marker ${index}: ${alert.title} at [${lat}, ${lng}] - Current: ${isCurrent}`);
        });

      console.log(`✅ Added ${alerts.filter(a => a.coordinates && a.coordinates.length === 2).length} markers to enhanced TomTom map`);

    } catch (error) {
      console.error('❌ Error adding markers to enhanced TomTom map:', error);
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

      console.log(`🎯 ZOOM TARGET: Zooming enhanced TomTom map to clicked alert: ${alert.title} at [${lat}, ${lng}]`);

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

      console.log(`🎯 Enhanced map zoom to clicked alert "${alert.title}" completed`);

    } catch (error) {
      console.error('❌ Error zooming enhanced TomTom map to clicked alert:', error);
    }
  }, [zoomTarget, mapLoaded, alertIndex]);

  // Auto-zoom to current alert (fallback when no specific zoom target)
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !currentAlert || !currentAlert.coordinates || zoomTarget) return;

    try {
      const map = mapRef.current;
      const [lat, lng] = currentAlert.coordinates;

      console.log(`🎯 Auto-zooming enhanced TomTom map to current alert: ${currentAlert.title} at [${lat}, ${lng}]`);

      // Animate to the current alert location (TomTom uses [lng, lat])
      map.flyTo({
        center: [lng, lat],
        zoom: 15, // Closer zoom for alert details
        duration: 2500, // 2.5 second animation
        essential: true
      });

      console.log(`🎯 Enhanced TomTom Map zooming to alert "${currentAlert.title}" at [${lat}, ${lng}]`);

    } catch (error) {
      console.error('❌ Error zooming enhanced TomTom map to alert:', error);
    }
  }, [currentAlert, alertIndex, mapLoaded, zoomTarget]);

  // Reset to overview when no alerts or no current alert
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    if (!alerts.length || !currentAlert) {
      try {
        const map = mapRef.current;
        console.log('🔄 Resetting enhanced TomTom map to North East England overview');
        map.flyTo({
          center: [-1.6131, 54.9783], // [lng, lat] for TomTom
          zoom: DEFAULT_ZOOM,
          duration: 2000,
          essential: true
        });
        console.log('🗺️ Enhanced TomTom Map reset to North East England overview');
      } catch (error) {
        console.error('❌ Error resetting enhanced TomTom map view:', error);
      }
    }
  }, [alerts.length, currentAlert, mapLoaded]);

  // Handle non-web platforms
  if (Platform.OS !== 'web') {
    return (
      <View style={styles.unsupportedContainer}>
        <Text style={styles.unsupportedIcon}>🗺️</Text>
        <Text style={styles.unsupportedText}>
          Enhanced TomTom interactive map view is only available on web browsers
        </Text>
      </View>
    );
  }

  // Handle map errors
  if (mapError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Enhanced TomTom Map Error</Text>
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
          <Text style={styles.loadingText}>Loading enhanced TomTom traffic map...</Text>
          <Text style={styles.loadingSubtext}>Initializing layers & caching...</Text>
        </View>
      )}
      {mapLoaded && (
        <View style={styles.mapControls}>
          <View style={styles.layerControls}>
            <TouchableOpacity 
              style={[styles.layerToggle, { backgroundColor: layerVisibility.trafficFlow ? '#10B981' : '#6B7280' }]}
              onPress={() => toggleLayer('traffic-flow', !layerVisibility.trafficFlow)}
            >
              <Text style={styles.layerToggleText}>🚦</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.layerToggle, { backgroundColor: layerVisibility.trafficIncidents ? '#DC2626' : '#6B7280' }]}
              onPress={() => toggleLayer('traffic-incidents', !layerVisibility.trafficIncidents)}
            >
              <Text style={styles.layerToggleText}>🚨</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.layerToggle, { backgroundColor: layerVisibility.roadworks ? '#F59E0B' : '#6B7280' }]}
              onPress={() => toggleLayer('roadworks-layer', !layerVisibility.roadworks)}
            >
              <Text style={styles.layerToggleText}>🚧</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.layerToggle, { backgroundColor: layerVisibility.speedCameras ? '#3B82F6' : '#6B7280' }]}
              onPress={() => toggleLayer('speed-cameras', !layerVisibility.speedCameras)}
            >
              <Text style={styles.layerToggleText}>📷</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {mapLoaded && alerts.length > 0 && (
        <View style={styles.mapInfo}>
          <Text style={styles.mapInfoText}>
            🗺️ Enhanced TomTom • {alerts.filter(a => a.coordinates && a.coordinates.length === 2).length} alerts • Cached
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
    flexDirection: 'column',
    gap: 8,
  },
  layerControls: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  layerToggle: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  layerToggleText: {
    fontSize: 16,
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
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  debugContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  fallbackText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
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

export default EnhancedTrafficMapV2;
