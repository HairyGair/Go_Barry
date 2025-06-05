// Go_BARRY/app/(tabs)/maps.jsx
// Interactive map showing traffic alerts across North East England
// Updated to use centralized API configuration
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  ScrollView
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useBarryAPI } from '../../components/hooks/useBARRYapi';
import { geocodeLocation, getNorthEastRegion, batchGeocode } from '../../services/geocoding';
import EnhancedTrafficCard from '../../components/EnhancedTrafficCard';
import { API_CONFIG, ENV_INFO } from '../../config/api';

// Map styling for dark theme to match app
const mapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#212121" }]
  },
  {
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#212121" }]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "administrative.country",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9ca5b3" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#2c2c2c" }]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#8a8a8a" }]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [{ "color": "#373737" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#3c3c3c" }]
  },
  {
    "featureType": "road.highway.controlled_access",
    "elementType": "geometry",
    "stylers": [{ "color": "#4e4e4e" }]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#000000" }]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#3d3d3d" }]
  }
];

// Get marker color based on alert type and status
function getMarkerColor(alert) {
  // Priority: Status first, then type
  if (alert.status === 'red') {
    return '#EF4444'; // Red for active alerts
  } else if (alert.status === 'amber') {
    return '#F59E0B'; // Amber for upcoming alerts
  } else if (alert.status === 'green') {
    return '#10B981'; // Green for planned/cleared alerts
  }
  
  // Fallback to type-based colors
  switch (alert.type) {
    case 'incident':
      return '#DC2626'; // Dark red for incidents
    case 'congestion':
      return '#F97316'; // Orange for traffic
    case 'roadwork':
      return '#2563EB'; // Blue for roadworks
    default:
      return '#6B7280'; // Grey for unknown
  }
}

// Get marker size based on severity
function getMarkerSize(alert) {
  switch (alert.severity) {
    case 'High':
      return 40;
    case 'Medium':
      return 30;
    case 'Low':
      return 20;
    default:
      return 25;
  }
}

export default function MapsScreen() {
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [mapMarkers, setMapMarkers] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [geocoding, setGeocoding] = useState(false);
  
  const mapRef = useRef(null);
  
  // Use existing BARRY API hook with centralized config
  const {
    alerts,
    loading,
    lastUpdated,
    refreshAlerts,
    isRefreshing
  } = useBarryAPI({
    autoRefresh: true,
    refreshInterval: API_CONFIG.refreshIntervals.operational // Use operational interval for maps
  });
  
  // Get default region for North East England
  const initialRegion = getNorthEastRegion();

  const processAlertsForMap = async () => {
    try {
      setGeocoding(true);
      console.log('📍 Processing alerts for map view using centralized config...');
      console.log(`📊 Processing ${alerts.length} alerts from ${ENV_INFO.apiBaseUrl}`);
      
      if (!alerts || alerts.length === 0) {
        console.log('📍 No alerts to process for map');
        setMapMarkers([]);
        return;
      }
      
      // Extract unique locations to minimize API calls
      const uniqueLocations = [...new Set(alerts.map(alert => alert.location).filter(Boolean))];
      console.log(`🗺️ Geocoding ${uniqueLocations.length} unique locations...`);
      
      // Batch geocode all locations
      const geocodeResults = await batchGeocode(uniqueLocations, 
        // Pass corresponding alerts to leverage backend coordinates
        uniqueLocations.map(loc => alerts.find(alert => alert.location === loc))
      );
      
      // Create a location-to-coords mapping
      const locationCoordsMap = {};
      geocodeResults.forEach(result => {
        if (result.coords) {
          locationCoordsMap[result.location] = result.coords;
        }
      });
      
      // Create markers for alerts with valid coordinates
      const markers = alerts
        .map((alert, index) => {
          const coords = locationCoordsMap[alert.location];
          if (!coords) {
            console.warn(`⚠️ No coordinates found for alert: ${alert.location}`);
            return null;
          }
          
          return {
            id: alert.id || `marker_${index}`,
            coordinate: {
              latitude: coords.latitude,
              longitude: coords.longitude
            },
            title: alert.title,
            description: alert.location,
            type: alert.type,
            alert: alert,
            geocodeInfo: coords
          };
        })
        .filter(Boolean); // Remove null entries
      
      setMapMarkers(markers);
      console.log(`✅ Created ${markers.length} map markers via centralized API`);
      
    } catch (error) {
      console.error('❌ Map data processing error:', error);
      Alert.alert(
        'Map Data Error',
        `Unable to load traffic alerts for map from ${ENV_INFO.apiBaseUrl}. Please check your connection and try again.`,
        [{ text: 'Retry', onPress: processAlertsForMap }, { text: 'Cancel' }]
      );
      setMapMarkers([]);
    } finally {
      setGeocoding(false);
    }
  };

  useEffect(() => {
    if (alerts && alerts.length > 0) {
      processAlertsForMap();
    } else {
      setMapMarkers([]);
    }
  }, [alerts]);

  // Filter markers based on selected type
  const filteredMarkers = useMemo(() => {
    if (filterType === 'all') return mapMarkers;
    return mapMarkers.filter(marker => marker.type === filterType);
  }, [mapMarkers, filterType]);

  const handleMarkerPress = (alert) => {
    console.log('📍 Marker pressed:', alert.title);
    setSelectedAlert(alert);
    setShowDetails(true);
  };

  const handleMapPress = () => {
    // Close any open details when map is tapped
    if (showDetails) {
      setShowDetails(false);
      setSelectedAlert(null);
    }
  };

  const centerOnMarkers = () => {
    if (filteredMarkers.length > 0 && mapRef.current) {
      const coordinates = filteredMarkers.map(marker => marker.coordinate);
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true
      });
    }
  };

  const getFilterCounts = () => {
    return {
      all: mapMarkers.length,
      incident: mapMarkers.filter(m => m.type === 'incident').length,
      congestion: mapMarkers.filter(m => m.type === 'congestion').length,
      roadwork: mapMarkers.filter(m => m.type === 'roadwork').length
    };
  };

  const counts = getFilterCounts();

  if (loading || geocoding) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#F3F4F6" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>
            {geocoding ? 'Processing locations...' : 'Loading map data...'}
          </Text>
          {geocoding && (
            <Text style={styles.loadingSubtext}>Geocoding locations...</Text>
          )}
          <Text style={styles.environmentText}>
            {ENV_INFO.isDevelopment ? '🔧 Development' : '🚀 Production'} • {ENV_INFO.apiBaseUrl}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />
      
      {/* Map Container */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          customMapStyle={mapStyle}
          initialRegion={initialRegion}
          onPress={handleMapPress}
          showsUserLocation={false}
          showsMyLocationButton={false}
          toolbarEnabled={false}
        >
          {filteredMarkers.map((marker) => (
            <Marker
              key={marker.id}
              coordinate={marker.coordinate}
              title={marker.title}
              description={marker.description}
              onPress={() => handleMarkerPress(marker.alert)}
              pinColor={getMarkerColor(marker.alert)}
            >
              <View style={[
                styles.customMarker,
                { 
                  backgroundColor: getMarkerColor(marker.alert),
                  width: getMarkerSize(marker.alert),
                  height: getMarkerSize(marker.alert)
                }
              ]}>
                <Text style={styles.markerText}>
                  {marker.alert.type === 'incident' ? '🚨' : 
                   marker.alert.type === 'congestion' ? '🚗' : '🚧'}
                </Text>
              </View>
            </Marker>
          ))}
        </MapView>
        
        {/* Floating Filter Buttons */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.filterButton, filterType === 'all' && styles.filterButtonActive]}
              onPress={() => setFilterType('all')}
            >
              <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>
                All ({counts.all})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.filterButton, filterType === 'incident' && styles.filterButtonActive]}
              onPress={() => setFilterType('incident')}
            >
              <Text style={[styles.filterText, filterType === 'incident' && styles.filterTextActive]}>
                🚨 Incidents ({counts.incident})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.filterButton, filterType === 'congestion' && styles.filterButtonActive]}
              onPress={() => setFilterType('congestion')}
            >
              <Text style={[styles.filterText, filterType === 'congestion' && styles.filterTextActive]}>
                🚗 Traffic ({counts.congestion})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.filterButton, filterType === 'roadwork' && styles.filterButtonActive]}
              onPress={() => setFilterType('roadwork')}
            >
              <Text style={[styles.filterText, filterType === 'roadwork' && styles.filterTextActive]}>
                🚧 Roadworks ({counts.roadwork})
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        
        {/* Floating Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={centerOnMarkers}>
            <Text style={styles.actionButtonText}>📍</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={refreshAlerts}>
            <Text style={styles.actionButtonText}>🔄</Text>
          </TouchableOpacity>
        </View>
        
        {/* Map Info Bar */}
        <View style={styles.infoBar}>
          <Text style={styles.infoText}>
            {filteredMarkers.length} alerts • North East England
          </Text>
          <Text style={styles.infoSubtext}>
            API: {ENV_INFO.isDevelopment ? 'Development' : 'Production'} • 
            {lastUpdated && ` Updated: ${new Date(lastUpdated).toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit'
            })}`}
          </Text>
        </View>
      </View>

      {/* Alert Details Modal */}
      <Modal
        visible={showDetails && selectedAlert}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Alert Details</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowDetails(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {selectedAlert && (
              <ScrollView style={styles.modalBody}>
                <EnhancedTrafficCard alert={selectedAlert} />
                
                {selectedAlert.geocodeInfo && (
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationInfoTitle}>📍 Location Info</Text>
                    <Text style={styles.locationInfoText}>
                      Source: {selectedAlert.geocodeInfo.source}
                    </Text>
                    <Text style={styles.locationInfoText}>
                      Confidence: {selectedAlert.geocodeInfo.confidence}
                    </Text>
                    <Text style={styles.locationInfoText}>
                      API: {ENV_INFO.apiBaseUrl}
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    color: '#1A202C',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '600',
  },
  loadingSubtext: {
    color: '#374151',
    fontSize: 14,
    marginTop: 4,
  },
  environmentText: {
    color: '#60A5FA',
    fontSize: 12,
    marginTop: 8,
    fontFamily: 'monospace',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  customMarker: {
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  markerText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  filterContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  filterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterText: {
    color: '#1A202C',
    fontSize: 14,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actionButtons: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    gap: 12,
    zIndex: 1000,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 20,
  },
  infoBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 1000,
  },
  infoText: {
    color: '#1A202C',
    fontSize: 14,
    fontWeight: '600',
  },
  infoSubtext: {
    color: '#374151',
    fontSize: 12,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    color: '#1A202C',
    fontSize: 18,
    fontWeight: '600',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    color: '#6B7280',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  locationInfo: {
    marginTop: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
  },
  locationInfoTitle: {
    color: '#1A202C',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  locationInfoText: {
    color: '#4B5563',
    fontSize: 14,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});