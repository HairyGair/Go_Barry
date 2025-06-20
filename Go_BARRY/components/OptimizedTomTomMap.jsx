// Go_BARRY/components/OptimizedTomTomMap.jsx
// Optimized TomTom map component with tile caching and request deduplication

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, Platform } from 'react-native';

// Global tile cache and request tracking
const tileCache = new Map();
const pendingRequests = new Map();
const TILE_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes cache
const TILE_REQUEST_STATS = {
  total: 0,
  cached: 0,
  network: 0,
  lastReset: Date.now()
};

// Reset stats daily
setInterval(() => {
  TILE_REQUEST_STATS.total = 0;
  TILE_REQUEST_STATS.cached = 0;
  TILE_REQUEST_STATS.network = 0;
  TILE_REQUEST_STATS.lastReset = Date.now();
}, 24 * 60 * 60 * 1000);

const OptimizedTomTomMap = ({ 
  alerts = [], 
  currentAlert = null, 
  alertIndex = 0,
  zoomTarget = null,
  mapId = 'default' // Unique ID for each map instance
}) => {
  const [containerElement, setContainerElement] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('Starting initialization...');
  const [tileStats, setTileStats] = useState({ ...TILE_REQUEST_STATS });
  
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const lastAlertsHashRef = useRef('');
  const initializingRef = useRef(false);

  const mapContainerCallback = useCallback((element) => {
    if (element && element !== containerElement) {
      console.log(`🔗 [${mapId}] Container element captured`);
      setContainerElement(element);
    }
  }, [containerElement, mapId]);

  // Calculate alerts hash to detect changes
  const getAlertsHash = useCallback(() => {
    return alerts.map(a => `${a.id}-${a.coordinates?.[0]}-${a.coordinates?.[1]}`).join('|');
  }, [alerts]);

  // Optimized tile fetching with caching
  const createCachedTileUrl = useCallback((baseUrl, apiKey) => {
    return baseUrl.replace('{key}', apiKey);
  }, []);

  // Initialize map only once
  useEffect(() => {
    if (Platform.OS !== 'web' || !containerElement || initializingRef.current) {
      return;
    }

    const initializeMap = async () => {
      if (mapInstanceRef.current) {
        console.log(`🔄 [${mapId}] Map already initialized, skipping`);
        return;
      }

      initializingRef.current = true;
      
      try {
        console.log(`🗺️ [${mapId}] Initializing optimized TomTom map...`);
        setDebugInfo('Getting TomTom API key...');
        
        // Get API key
        let apiKey = process.env.EXPO_PUBLIC_TOMTOM_API_KEY;
        
        if (!apiKey) {
          try {
            const keyResponse = await fetch('https://go-barry.onrender.com/api/config/tomtom-key');
            if (keyResponse.ok) {
              const keyData = await keyResponse.json();
              apiKey = keyData.apiKey;
            }
          } catch (keyError) {
            console.warn(`⚠️ [${mapId}] Backend API key fetch failed`);
          }
        }
        
        if (!apiKey) {
          apiKey = '9rZJqtnfYpOzlqnypI97nFb5oX17SNzp';
        }
        
        console.log(`✅ [${mapId}] Using API key: ${apiKey.substring(0, 8)}...`);
        setDebugInfo('Loading MapLibre GL JS...');
        
        // Load MapLibre GL JS from CDN
        if (!window.maplibregl) {
          console.log(`📦 [${mapId}] Loading MapLibre GL JS from CDN...`);
          
          const cssLink = document.createElement('link');
          cssLink.rel = 'stylesheet';
          cssLink.href = 'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css';
          document.head.appendChild(cssLink);
          
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js';
            script.onload = () => {
              console.log(`✅ [${mapId}] MapLibre GL JS loaded`);
              resolve();
            };
            script.onerror = reject;
            document.body.appendChild(script);
          });
        }
        
        const maplibregl = window.maplibregl;
        setDebugInfo('Creating map instance...');
        
        // Create custom protocol for cached tiles
        const originalProtocolAdd = maplibregl.addProtocol;
        if (!window.tomtomTileProtocolAdded) {
          maplibregl.addProtocol('tomtom-cached', (params, callback) => {
            const url = params.url.replace('tomtom-cached://', 'https://');
            const cacheKey = url.split('?')[0]; // Remove API key from cache key
            
            TILE_REQUEST_STATS.total++;
            
            // Check cache
            const cached = tileCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < TILE_CACHE_DURATION) {
              TILE_REQUEST_STATS.cached++;
              console.log(`📦 [${mapId}] Tile from cache: ${cacheKey}`);
              callback(null, cached.data, cached.cacheControl, cached.expires);
              return { cancel: () => {} };
            }
            
            // Check if request already pending
            if (pendingRequests.has(cacheKey)) {
              console.log(`⏳ [${mapId}] Tile request already pending: ${cacheKey}`);
              pendingRequests.get(cacheKey).then(data => {
                callback(null, data.arrayBuffer, data.cacheControl, data.expires);
              }).catch(err => callback(err));
              return { cancel: () => {} };
            }
            
            // Make network request
            TILE_REQUEST_STATS.network++;
            console.log(`🌐 [${mapId}] Fetching tile from network: ${cacheKey}`);
            
            const fetchPromise = fetch(url)
              .then(response => response.arrayBuffer())
              .then(arrayBuffer => {
                const data = {
                  arrayBuffer,
                  cacheControl: 'max-age=3600',
                  expires: new Date(Date.now() + TILE_CACHE_DURATION).toISOString()
                };
                
                // Cache the tile
                tileCache.set(cacheKey, {
                  data: arrayBuffer,
                  cacheControl: data.cacheControl,
                  expires: data.expires,
                  timestamp: Date.now()
                });
                
                pendingRequests.delete(cacheKey);
                return data;
              });
            
            pendingRequests.set(cacheKey, fetchPromise);
            
            fetchPromise
              .then(data => callback(null, data.arrayBuffer, data.cacheControl, data.expires))
              .catch(err => {
                pendingRequests.delete(cacheKey);
                callback(err);
              });
            
            return { cancel: () => {} };
          });
          window.tomtomTileProtocolAdded = true;
        }
        
        // Build optimized tile URLs
        const baseTileUrl = `tomtom-cached://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key=${apiKey}`;
        const trafficTileUrl = `tomtom-cached://api.tomtom.com/traffic/map/4/tile/flow/relative-delay/{z}/{x}/{y}.png?key=${apiKey}`;
        
        // Create map with optimizations
        const map = new maplibregl.Map({
          container: containerElement,
          style: {
            version: 8,
            sources: {
              'tomtom-base': {
                type: 'raster',
                tiles: [baseTileUrl],
                tileSize: 256,
                attribution: '© TomTom',
                minzoom: 5,
                maxzoom: 18
              }
            },
            layers: [{
              id: 'tomtom-base',
              type: 'raster',
              source: 'tomtom-base'
            }]
          },
          center: [-1.6178, 54.9783],
          zoom: 10,
          // Optimizations
          preserveDrawingBuffer: false,
          refreshExpiredTiles: false,
          maxTileCacheSize: 100,
          trackResize: false,
          renderWorldCopies: false
        });

        map.on('load', () => {
          console.log(`✅ [${mapId}] Map loaded successfully`);
          setMapLoaded(true);
          setDebugInfo('Map loaded with tile caching');
          
          // Add traffic layer
          try {
            map.addSource('tomtom-traffic', {
              type: 'raster',
              tiles: [trafficTileUrl],
              tileSize: 256,
              minzoom: 8,
              maxzoom: 16
            });
            
            map.addLayer({
              id: 'traffic-flow',
              type: 'raster',
              source: 'tomtom-traffic',
              paint: {
                'raster-opacity': 0.6
              }
            });
            
            console.log(`✅ [${mapId}] Traffic layer added`);
          } catch (trafficError) {
            console.warn(`⚠️ [${mapId}] Traffic layer failed:`, trafficError);
          }
          
          // Update tile stats
          setInterval(() => {
            setTileStats({ ...TILE_REQUEST_STATS });
          }, 5000);
        });

        map.on('error', (error) => {
          console.error(`❌ [${mapId}] Map error:`, error);
          setMapError(error.message);
        });

        mapInstanceRef.current = map;
        
      } catch (error) {
        console.error(`❌ [${mapId}] Failed to initialize map:`, error);
        setMapError(error.message);
      } finally {
        initializingRef.current = false;
      }
    };

    const timer = setTimeout(initializeMap, 100);
    
    return () => {
      clearTimeout(timer);
    };
  }, [containerElement, mapId]);

  // Update markers when alerts change (without recreating map)
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    const currentHash = getAlertsHash();
    if (currentHash === lastAlertsHashRef.current) {
      console.log(`🔄 [${mapId}] Alerts unchanged, skipping marker update`);
      return;
    }
    
    console.log(`📍 [${mapId}] Updating markers for ${alerts.length} alerts`);
    
    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    // Add new markers
    alerts.forEach((alert, index) => {
      if (!alert.coordinates || !Array.isArray(alert.coordinates)) return;

      const [lat, lng] = alert.coordinates;
      const isCurrentAlert = index === alertIndex;
      
      const markerElement = document.createElement('div');
      markerElement.style.cssText = `
        width: ${isCurrentAlert ? 16 : 12}px;
        height: ${isCurrentAlert ? 16 : 12}px;
        background-color: ${getSeverityColor(alert.severity)};
        border: 2px solid white;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ${isCurrentAlert ? 'animation: pulse 2s infinite;' : ''}
      `;

      const marker = new window.maplibregl.Marker({ element: markerElement })
        .setLngLat([lng, lat])
        .addTo(mapInstanceRef.current);

      const popup = new window.maplibregl.Popup({ offset: 25 })
        .setHTML(`
          <div style="padding: 8px; max-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px;">${alert.title}</h3>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280;">${alert.location || 'Location not specified'}</p>
            <span style="
              background-color: ${getSeverityColor(alert.severity)};
              color: white;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: bold;
            ">${alert.severity || 'UNKNOWN'}</span>
          </div>
        `);

      marker.setPopup(popup);
      markersRef.current.push(marker);
    });
    
    lastAlertsHashRef.current = currentHash;
  }, [alerts, alertIndex, mapLoaded, getAlertsHash, mapId]);

  // Handle zoom target changes
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded || !zoomTarget?.alert?.coordinates) return;
    
    const [lat, lng] = zoomTarget.alert.coordinates;
    console.log(`🎯 [${mapId}] Zooming to alert:`, zoomTarget.alert.title);
    
    mapInstanceRef.current.flyTo({
      center: [lng, lat],
      zoom: 14,
      duration: 1500
    });
  }, [zoomTarget, mapLoaded, mapId]);

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return '#ef4444';
      case 'high':
        return '#f59e0b';
      case 'medium':
        return '#06b6d4';
      default:
        return '#64748b';
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        console.log(`🧹 [${mapId}] Cleaning up map instance`);
        try {
          // Remove all markers
          markersRef.current.forEach(marker => marker.remove());
          markersRef.current = [];
          
          // Remove map
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        } catch (e) {
          console.warn(`⚠️ [${mapId}] Cleanup error:`, e);
        }
      }
    };
  }, [mapId]);

  if (Platform.OS !== 'web') {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a3e',
        minHeight: 400
      }}>
        <Text style={{ color: '#94a3b8', fontSize: 14 }}>
          🗺️ Map view available on web only
        </Text>
      </View>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '400px' }}>
      <div
        ref={mapContainerCallback}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '400px',
          borderRadius: '8px',
          position: 'relative',
          backgroundColor: '#1a1a3e'
        }}
      />
      
      {/* Tile usage stats */}
      {mapLoaded && (
        <div style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '11px',
          fontFamily: 'monospace',
          zIndex: 1000
        }}>
          <div>📊 Tile Stats (Daily)</div>
          <div>Total: {tileStats.total} | Cached: {tileStats.cached} ({Math.round((tileStats.cached / Math.max(tileStats.total, 1)) * 100)}%)</div>
          <div>Network: {tileStats.network} | Saved: {tileStats.cached}</div>
          <div>Cache Size: {tileCache.size} tiles</div>
        </div>
      )}
      
      {/* Loading overlay */}
      {!mapLoaded && !mapError && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(26, 26, 62, 0.95)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: '8px',
          zIndex: 1000
        }}>
          <div style={{ color: '#94a3b8', fontSize: '16px', marginBottom: '8px' }}>
            🗺️ Loading optimized map...
          </div>
          <div style={{ color: '#f59e0b', fontSize: '11px', fontFamily: 'monospace' }}>
            {debugInfo}
          </div>
        </div>
      )}
      
      {/* Error overlay */}
      {mapError && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(127, 29, 29, 0.95)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: '8px',
          zIndex: 1000
        }}>
          <div style={{ color: '#fca5a5', fontSize: '16px', marginBottom: '8px' }}>
            ❌ Map error: {mapError}
          </div>
        </div>
      )}
      
      {/* Add CSS for pulse animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      `}} />
    </div>
  );
};

export default OptimizedTomTomMap;
