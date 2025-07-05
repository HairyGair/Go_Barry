/*
 * Go Barry - Live Map Container
 * Real-time traffic intelligence map for Operations Centre
 * Phase 1: Core infrastructure with TomTom integration
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { operationsTheme } from '../../../app/operations-centre/styles';

// Import custom hooks and components
import { useLiveMapData } from './hooks/useLiveMapData';
import TomTomMapView from './components/TomTomMapView';
import BusLocationLayer from './components/BusLocationLayer';
import RouteOverlayLayer from './components/RouteOverlayLayer';
import DetailsSidebar from './components/DetailsSidebar';
import MapControls from './components/MapControls';
import { liveMapTheme } from './styles/liveMapStyles';
import { useAlertStateManager, AlertStateUtils } from './utils/alertStateManager';

const LiveMapContainer = ({ onClose }) => {
  // State management
  const [selectedItem, setSelectedItem] = useState(null);
  const [mapViewport, setMapViewport] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [showBuses, setShowBuses] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showTraffic, setShowTraffic] = useState(true);
  
  // Refs
  const mapRef = useRef(null);
  
  // Data hooks (Phase 3: Enhanced with bus locations and routes)
  const { 
    visibleAlerts, 
    allAlerts, 
    visibleBuses,
    allBuses,
    selectedBusId,
    allRoutes,
    highlightedRoutes,
    statistics,
    alertStats, // Legacy compatibility
    busStats,
    selectBus,
    deselectBus,
    getBusById,
    highlightRoute,
    unhighlightRoute,
    clearHighlightedRoutes,
    refreshBusLocations,
    loading: dataLoading,
    error: dataError,
    busDataIsRealTime 
  } = useLiveMapData(mapViewport);

  // Alert state management
  const {
    acknowledgeAlert,
    dismissAlert,
    escalateAlert,
    getAlertHistory,
    supervisor,
    isLoggedIn
  } = useAlertStateManager();

  // Map interaction handlers
  const handleMapLoad = useCallback(() => {
    console.log('[LiveMap] Map loaded successfully');
    setMapLoaded(true);
    setMapError(null);
  }, []);

  const handleMapError = useCallback((error) => {
    console.error('[LiveMap] Map error:', error);
    setMapError(error.message || 'Map failed to load');
    setMapLoaded(false);
  }, []);

  const handleViewportChange = useCallback((viewport) => {
    console.log('[LiveMap] Viewport changed:', viewport);
    setMapViewport(viewport);
  }, []);

  const handleAlertClick = useCallback((alert) => {
    console.log('[LiveMap] Alert clicked:', alert.id);
    setSelectedItem({
      type: 'alert',
      data: alert
    });
    // Clear any selected bus when selecting an alert
    if (selectedBusId) {
      deselectBus();
    }
  }, [selectedBusId, deselectBus]);

  // Bus interaction handlers (Phase 3)
  const handleBusClick = useCallback((bus) => {
    console.log('[LiveMap] Bus clicked:', bus.id || bus.busId);
    const busId = bus.id || bus.busId;
    
    // Clear any selected alert when selecting a bus
    setSelectedItem({
      type: 'bus',
      data: bus
    });
    
    // Select the bus (this will highlight its route)
    selectBus(busId);
  }, [selectBus]);

  // Route interaction handlers (Phase 3)
  const handleRouteClick = useCallback((route, event) => {
    console.log('[LiveMap] Route clicked:', route.id || route.routeId);
    const routeId = route.id || route.routeId;
    
    // Toggle route highlighting
    if (highlightedRoutes.includes(routeId)) {
      unhighlightRoute(routeId);
    } else {
      highlightRoute(routeId);
    }
  }, [highlightedRoutes, highlightRoute, unhighlightRoute]);

  const handleMapClick = useCallback(() => {
    // Deselect current item when clicking empty map area
    setSelectedItem(null);
  }, []);

  // Map control handlers (Phase 3)
  const handleToggleBuses = useCallback(() => {
    setShowBuses(prev => {
      console.log(`[LiveMap] ${!prev ? 'Showing' : 'Hiding'} buses`);
      return !prev;
    });
  }, []);

  const handleToggleRoutes = useCallback(() => {
    setShowRoutes(prev => {
      console.log(`[LiveMap] ${!prev ? 'Showing' : 'Hiding'} routes`);
      return !prev;
    });
  }, []);

  const handleToggleTraffic = useCallback(() => {
    setShowTraffic(prev => {
      console.log(`[LiveMap] ${!prev ? 'Showing' : 'Hiding'} traffic layer`);
      return !prev;
    });
  }, []);

  const handleZoomIn = useCallback(() => {
    if (mapRef.current?.getMap) {
      const map = mapRef.current.getMap();
      map.zoomIn();
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (mapRef.current?.getMap) {
      const map = mapRef.current.getMap();
      map.zoomOut();
    }
  }, []);

  const handleResetView = useCallback(() => {
    if (mapRef.current?.getMap) {
      const map = mapRef.current.getMap();
      // Reset to Newcastle/Gateshead area
      map.setCenter([-1.6178, 54.9783]);
      map.setZoom(11);
    }
  }, []);

  const handleFitBounds = useCallback(() => {
    if (mapRef.current?.getMap && (visibleAlerts.length > 0 || visibleBuses.length > 0)) {
      const map = mapRef.current.getMap();
      
      // Calculate bounds from visible alerts and buses
      let bounds = null;
      const coordinates = [];
      
      // Add alert coordinates
      visibleAlerts.forEach(alert => {
        if (alert.coordinates && alert.coordinates.length >= 2) {
          coordinates.push(alert.coordinates);
        }
      });
      
      // Add bus coordinates
      visibleBuses.forEach(bus => {
        if (bus.coordinates && bus.coordinates.length >= 2) {
          coordinates.push(bus.coordinates);
        }
      });
      
      if (coordinates.length > 0) {
        const lats = coordinates.map(c => c[0]);
        const lngs = coordinates.map(c => c[1]);
        
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        
        // Add padding
        const padding = 0.01;
        bounds = [
          [minLng - padding, minLat - padding], // Southwest
          [maxLng + padding, maxLat + padding]  // Northeast
        ];
        
        map.fitBounds(bounds, { padding: 50 });
      }
    }
  }, [visibleAlerts, visibleBuses]);

  // Sidebar actions
  const handleAlertAction = useCallback(async (action, alertId) => {
    console.log('[LiveMap] Alert action:', action, alertId);
    
    if (!isLoggedIn) {
      console.warn('[LiveMap] No supervisor logged in for action:', action);
      return;
    }

    try {
      let result;
      
      switch (action) {
        case 'acknowledge':
          result = await acknowledgeAlert(alertId);
          if (result.success) {
            console.log('✅ Alert acknowledged:', result.message);
            // Update local UI state for immediate feedback
            setSelectedItem(prev => {
              if (prev?.type === 'alert' && prev.data.id === alertId) {
                return {
                  ...prev,
                  data: {
                    ...prev.data,
                    alertState: 'acknowledged',
                    acknowledgedBy: supervisor.name
                  }
                };
              }
              return prev;
            });
          } else {
            console.error('❌ Acknowledge failed:', result.error);
          }
          break;
          
        case 'dismiss':
          result = await dismissAlert(alertId);
          if (result.success) {
            console.log('✅ Alert dismissed:', result.message);
            // Clear selected item and let real-time sync remove from map
            setSelectedItem(null);
          } else {
            console.error('❌ Dismiss failed:', result.error);
          }
          break;
          
        case 'escalate':
          // Determine escalation type based on alert
          const alert = allAlerts.find(a => a.id === alertId);
          const escalationType = determineEscalationType(alert);
          
          result = await escalateAlert(alertId, escalationType);
          if (result.success) {
            console.log('✅ Alert escalated:', result.message);
            // Navigate to appropriate manager (Phase 4 implementation)
            console.log('🔄 Would navigate to:', escalationType, 'manager');
            
            // Update local UI state
            setSelectedItem(prev => {
              if (prev?.type === 'alert' && prev.data.id === alertId) {
                return {
                  ...prev,
                  data: {
                    ...prev.data,
                    alertState: 'escalated',
                    escalatedBy: supervisor.name
                  }
                };
              }
              return prev;
            });
          } else {
            console.error('❌ Escalate failed:', result.error);
          }
          break;
          
        default:
          console.warn('Unknown alert action:', action);
      }
    } catch (error) {
      console.error('[LiveMap] Alert action error:', error);
    }
  }, [isLoggedIn, acknowledgeAlert, dismissAlert, escalateAlert, supervisor, allAlerts]);

  // Helper function to determine escalation type
  const determineEscalationType = useCallback((alert) => {
    if (!alert) return 'incident';
    
    // Check if it's a roadwork-related alert
    if (alert.source === 'StreetManager' || 
        alert.source === 'streetmanager' ||
        alert.title?.toLowerCase().includes('roadwork') ||
        alert.description?.toLowerCase().includes('roadwork')) {
      return 'roadwork';
    }
    
    // Default to incident for traffic alerts
    return 'incident';
  }, []);

  // Close button handler
  const handleClose = useCallback(() => {
    console.log('[LiveMap] Closing live map');
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  // Loading state
  if (dataLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Live Map</Text>
          <Pressable style={styles.closeButton} onPress={handleClose}>
            <MaterialCommunityIcons name="close" size={24} color="#fff" />
          </Pressable>
        </View>
        
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons name="map-marker-radius" size={48} color="#3b82f6" />
          <Text style={styles.loadingText}>Loading live traffic data...</Text>
          <Text style={styles.loadingSubtext}>Connecting to real-time feeds</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (dataError && !allAlerts.length) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Live Map</Text>
          <Pressable style={styles.closeButton} onPress={handleClose}>
            <MaterialCommunityIcons name="close" size={24} color="#fff" />
          </Pressable>
        </View>
        
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorText}>Unable to load map data</Text>
          <Text style={styles.errorSubtext}>{dataError}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="map-marker-radius" size={24} color="#fff" />
          <Text style={styles.headerTitle}>Live Map</Text>
          <View style={styles.counterGroup}>
            <View style={styles.alertCounter}>
              <MaterialCommunityIcons name="alert" size={12} color="#fff" />
              <Text style={styles.alertCounterText}>{allAlerts.length}</Text>
            </View>
            {busDataIsRealTime && (
              <View style={styles.busCounter}>
                <MaterialCommunityIcons name="bus" size={12} color="#fff" />
                <Text style={styles.busCounterText}>{visibleBuses.length}</Text>
              </View>
            )}
          </View>
        </View>
        
        <Pressable style={styles.closeButton} onPress={handleClose}>
          <MaterialCommunityIcons name="close" size={24} color="#fff" />
        </Pressable>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Map Area */}
        <View style={styles.mapContainer}>
          {Platform.OS === 'web' ? (
            <>
              <TomTomMapView
                ref={mapRef}
                alerts={visibleAlerts}
                selectedAlert={selectedItem?.type === 'alert' ? selectedItem.data : null}
                onMapLoad={handleMapLoad}
                onMapError={handleMapError}
                onViewportChange={handleViewportChange}
                onAlertClick={handleAlertClick}
                onMapClick={handleMapClick}
                style={styles.map}
              />
              
              {/* Bus Location Layer (Phase 3) */}
              {mapLoaded && showBuses && (
                <BusLocationLayer
                  map={mapRef.current}
                  busLocations={visibleBuses}
                  selectedBusId={selectedBusId}
                  onBusClick={handleBusClick}
                  visible={showBuses}
                />
              )}
              
              {/* Route Overlay Layer (Phase 3: UPDATED with GTFS shapes) */}
              {mapLoaded && showRoutes && (
                <RouteOverlayLayer
                  map={mapRef.current}
                  visibleRoutes={highlightedRoutes}
                  highlightedRoute={highlightedRoutes[0] || null}
                  viewport={mapViewport}
                  onRouteClick={handleRouteClick}
                  visible={showRoutes}
                />
              )}
              
              {/* Map Controls (Phase 3: FINAL INTEGRATION) */}
              {mapLoaded && (
                <MapControls
                  showBuses={showBuses}
                  showRoutes={showRoutes}
                  showTraffic={showTraffic}
                  onToggleBuses={handleToggleBuses}
                  onToggleRoutes={handleToggleRoutes}
                  onToggleTraffic={handleToggleTraffic}
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                  onResetView={handleResetView}
                  onFitBounds={handleFitBounds}
                  busCount={visibleBuses.length}
                  routeCount={highlightedRoutes.length}
                />
              )}
            </>
          ) : (
            <View style={styles.mapPlaceholder}>
              <MaterialCommunityIcons name="monitor" size={48} color="#6b7280" />
              <Text style={styles.mapPlaceholderText}>Live Map available on web only</Text>
            </View>
          )}

          {/* Map Status Overlay */}
          {Platform.OS === 'web' && !mapLoaded && !mapError && (
            <View style={styles.mapLoadingOverlay}>
              <MaterialCommunityIcons name="loading" size={32} color="#3b82f6" />
              <Text style={styles.mapLoadingText}>Loading map...</Text>
            </View>
          )}

          {/* Map Error Overlay */}
          {Platform.OS === 'web' && mapError && (
            <View style={styles.mapErrorOverlay}>
              <MaterialCommunityIcons name="alert-circle" size={32} color="#ef4444" />
              <Text style={styles.mapErrorText}>Map Error</Text>
              <Text style={styles.mapErrorSubtext}>{mapError}</Text>
            </View>
          )}
        </View>

        {/* Details Sidebar (Phase 3: Enhanced with bus data) */}
        <DetailsSidebar
          selectedItem={selectedItem}
          alertStats={alertStats}
          busStats={busStats}
          statistics={statistics}
          busDataIsRealTime={busDataIsRealTime}
          onAction={handleAlertAction}
          onBusAction={handleBusClick}
          onRouteAction={handleRouteClick}
          onClose={() => {
            setSelectedItem(null);
            if (selectedBusId) {
              deselectBus();
            }
          }}
          onRefreshBuses={refreshBusLocations}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: liveMapTheme.ui.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: operationsTheme.colors.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  counterGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  alertCounter: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  alertCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  busCounter: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  busCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f2937',
  },
  mapPlaceholderText: {
    color: '#6b7280',
    fontSize: 16,
    marginTop: 12,
  },
  mapLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(31, 41, 55, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapLoadingText: {
    color: '#3b82f6',
    fontSize: 16,
    marginTop: 12,
  },
  mapErrorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(127, 29, 29, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapErrorText: {
    color: '#fca5a5',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  mapErrorSubtext: {
    color: '#f87171',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    color: '#f3f4f6',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  loadingSubtext: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  errorSubtext: {
    color: '#f87171',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default LiveMapContainer;
