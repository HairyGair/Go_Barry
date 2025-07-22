/*
 * Go Barry - Incident Map Picker
 * Click on map to set incident location with route auto-detection
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  TextInput,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../styles/incidents.styles';

const IncidentMapPicker = ({ 
  onLocationSelect, 
  onRoutesDetected,
  baseUrl,
  initialLocation = null 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [detectedRoutes, setDetectedRoutes] = useState([]);
  const [confidence, setConfidence] = useState({});
  const [postcodeInput, setPostcodeInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Initialize map on web platform
  useEffect(() => {
    if (Platform.OS !== 'web') {
      setIsLoading(false);
      return;
    }

    // Load Leaflet CSS
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => {
      initialiseMap();
    };
    document.body.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  const initialiseMap = () => {
    if (!window.L || !mapRef.current) return;

    // Initialise map centred on Newcastle
    const map = window.L.map(mapRef.current).setView([54.9783, -1.6178], 12);
    mapInstanceRef.current = map;

    // Add OpenStreetMap tiles
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Add click handler
    map.on('click', handleMapClick);

    setIsLoading(false);
  };

  const handleMapClick = async (e) => {
    const { lat, lng } = e.latlng;
    
    // Update marker
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = window.L.marker([lat, lng], {
        icon: window.L.divIcon({
          className: 'incident-marker',
          html: '<div style="background-color: #ef4444; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      }).addTo(mapInstanceRef.current);
    }

    // Get location name
    const locationName = await reverseGeocode(lat, lng);
    
    const location = {
      lat,
      lng,
      description: locationName
    };

    setSelectedLocation(location);
    
    // Detect affected routes
    await detectRoutes(lat, lng);
    
    // Notify parent
    if (onLocationSelect) {
      onLocationSelect(location);
    }
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      
      // Build location description
      const parts = [];
      if (data.address.road) parts.push(data.address.road);
      if (data.address.suburb) parts.push(data.address.suburb);
      if (data.address.city || data.address.town) {
        parts.push(data.address.city || data.address.town);
      }
      
      return parts.join(', ') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      console.error('Reverse geocode error:', error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  const detectRoutes = async (lat, lng) => {
    try {
      setIsSearching(true);
      
      // Call backend route matching API
      const response = await fetch(`${baseUrl}/api/gtfs/match/enhanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lat,
          lng,
          radius: 250 // 250m radius
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
          setDetectedRoutes(data.routes);
          
          // Extract confidence scores
          const confidenceMap = {};
          data.routes.forEach(route => {
            if (route.confidence) {
              confidenceMap[route.route] = route.confidence;
            }
          });
          setConfidence(confidenceMap);
          
          // Notify parent
          if (onRoutesDetected) {
            onRoutesDetected(data.routes.map(r => r.route), confidenceMap);
          }
        } else {
          setDetectedRoutes([]);
          setConfidence({});
          if (onRoutesDetected) {
            onRoutesDetected([], {});
          }
        }
      }
    } catch (error) {
      console.error('Route detection error:', error);
      setDetectedRoutes([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePostcodeSearch = async () => {
    if (!postcodeInput.trim()) return;
    
    setIsSearching(true);
    try {
      // Search for postcode
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(postcodeInput + ', UK')}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        
        // Center map and add marker
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 15);
          
          // Simulate click to trigger route detection
          handleMapClick({ latlng: { lat, lng } });
        }
      } else {
        alert('Postcode not found. Please try again.');
      }
    } catch (error) {
      console.error('Postcode search error:', error);
      alert('Error searching for postcode. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Mobile fallback
  if (Platform.OS !== 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.mobileMessage}>
          <Ionicons name="map-outline" size={48} color={colors.textMuted} />
          <Text style={styles.mobileText}>
            Map view is only available on web.
            Please enter location details manually.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Postcode Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Enter postcode (e.g., NE1 4ST)"
          value={postcodeInput}
          onChangeText={setPostcodeInput}
          onSubmitEditing={handlePostcodeSearch}
        />
        <Pressable 
          style={styles.searchButton}
          onPress={handlePostcodeSearch}
          disabled={isSearching}
        >
          {isSearching ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="search" size={20} color="#fff" />
          )}
        </Pressable>
      </View>

      {/* Map Container */}
      <View style={styles.mapWrapper}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        ) : (
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        )}
      </View>

      {/* Selected Location Info */}
      {selectedLocation && (
        <View style={styles.locationInfo}>
          <View style={styles.locationHeader}>
            <Ionicons name="location" size={20} color={colors.primary} />
            <Text style={styles.locationText}>{selectedLocation.description}</Text>
          </View>
          
          {/* Detected Routes */}
          {detectedRoutes.length > 0 && (
            <View style={styles.routesContainer}>
              <Text style={styles.routesTitle}>Affected Routes:</Text>
              <View style={styles.routesList}>
                {detectedRoutes.map((route, index) => (
                  <View key={index} style={styles.routeChip}>
                    <Text style={styles.routeNumber}>{route.route}</Text>
                    {confidence[route.route] && (
                      <Text style={styles.routeConfidence}>
                        {confidence[route.route]}%
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          Click on the map or search by postcode to set incident location
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
  },
  mapWrapper: {
    flex: 1,
    margin: spacing.md,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.textSecondary,
  },
  locationInfo: {
    margin: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  locationText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  routesContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  routesTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  routesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  routeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  routeNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  routeConfidence: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: spacing.xs,
    opacity: 0.7,
  },
  instructions: {
    padding: spacing.md,
    backgroundColor: colors.infoBg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  instructionText: {
    fontSize: 14,
    color: colors.info,
    textAlign: 'center',
  },
  mobileMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  mobileText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default IncidentMapPicker;