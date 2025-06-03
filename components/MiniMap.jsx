// Go_BARRY/components/MiniMap.jsx
// Small map component integrated with BARRY backend coordinates
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { geocodeLocation } from '../services/geocoding';

// Light theme map style to match BARRY's TrafficCard
const miniMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#F3F4F6" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#374151" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#FFFFFF" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#E5E7EB" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#D1D5DB" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#93C5FD" }]
  }
];

/**
 * MiniMap component for showing a single traffic alert location
 * Integrates with BARRY backend coordinates and existing styling
 * @param {Object} props
 * @param {Object} props.alert - Alert object with location information (may have backend coordinates)
 * @param {number} props.height - Height of the map (default: 150)
 * @param {boolean} props.interactive - Whether map is interactive (default: false)
 * @param {Function} props.onPress - Callback when map is pressed
 */
export default function MiniMap({ 
  alert, 
  height = 150, 
  interactive = false, 
  onPress 
}) {
  const [coordinates, setCoordinates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadLocation() {
      if (!alert?.location) {
        setError(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Use enhanced geocoding that leverages backend coordinates
        const coords = await geocodeLocation(alert.location, alert);
        
        if (coords) {
          setCoordinates({
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01
          });
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('MiniMap geocoding error:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadLocation();
  }, [alert?.location, alert?.coordinates]);

  const getMarkerColor = () => {
    if (alert.status === 'red') return '#EF4444';
    if (alert.status === 'amber') return '#F59E0B';
    if (alert.status === 'green') return '#10B981';
    
    switch (alert.type) {
      case 'incident': return '#DC2626';
      case 'congestion': return '#F97316';
      case 'roadwork': return '#2563EB';
      default: return '#6B7280';
    }
  };

  const getMarkerEmoji = () => {
    switch (alert.type) {
      case 'incident': return '🚨';
      case 'congestion': return '🚗';
      case 'roadwork': return '🚧';
      default: return '📍';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#2563EB" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      </View>
    );
  }

  if (error || !coordinates) {
    return (
      <View style={[styles.container, styles.errorContainer, { height }]}>
        <Text style={styles.errorIcon}>📍</Text>
        <Text style={styles.errorText}>Location not available</Text>
        <Text style={styles.errorSubtext}>{alert?.location || 'Unknown location'}</Text>
      </View>
    );
  }

  const mapContent = (
    <MapView
      style={styles.map}
      provider={PROVIDER_GOOGLE}
      customMapStyle={miniMapStyle}
      region={coordinates}
      scrollEnabled={interactive}
      zoomEnabled={interactive}
      rotateEnabled={false}
      pitchEnabled={false}
      showsUserLocation={false}
      showsMyLocationButton={false}
      showsCompass={false}
      showsScale={false}
      toolbarEnabled={false}
    >
      <Marker
        coordinate={coordinates}
        title={alert.title}
        description={alert.location}
      >
        <View style={[styles.customMarker, { backgroundColor: getMarkerColor() }]}>
          <Text style={styles.markerText}>{getMarkerEmoji()}</Text>
        </View>
      </Marker>
    </MapView>
  );

  return (
    <View style={[styles.container, { height }]}>
      {onPress ? (
        <TouchableOpacity 
          style={styles.touchableMap} 
          onPress={onPress}
          activeOpacity={0.8}
        >
          {mapContent}
          <View style={styles.tapOverlay}>
            <Text style={styles.tapText}>Tap to view on map</Text>
          </View>
        </TouchableOpacity>
      ) : (
        mapContent
      )}
      
      {/* Location label */}
      <View style={styles.locationLabel}>
        <Text style={styles.locationText} numberOfLines={1}>
          {alert.location}
        </Text>
        {alert.affectsRoutes && alert.affectsRoutes.length > 0 && (
          <Text style={styles.routesText} numberOfLines={1}>
            Routes: {alert.affectsRoutes.slice(0, 3).join(', ')}
            {alert.affectsRoutes.length > 3 && ` +${alert.affectsRoutes.length - 3}`}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  map: {
    flex: 1,
  },
  touchableMap: {
    flex: 1,
    position: 'relative',
  },
  tapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(37, 99, 235, 0.9)',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  tapText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    color: '#4B5563',
    fontSize: 12,
    marginTop: 8,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  errorIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  errorText: {
    color: '#1A202C',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  errorSubtext: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'center',
  },
  customMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
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
    fontSize: 14,
    fontWeight: 'bold',
  },
  locationLabel: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locationText: {
    color: '#1A202C',
    fontSize: 12,
    fontWeight: '600',
  },
  routesText: {
    color: '#2563EB',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
});
