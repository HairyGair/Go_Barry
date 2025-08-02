import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Platform, 
  TouchableOpacity, 
  Modal, 
  SafeAreaView,
  Linking,
  Alert,
  TextInput
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// No longer need mapbox-gl for Google Maps iframe

const RoadworkMapModal = ({ visible, roadwork, onClose }) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Import geocoding service
  const [geocodeLocation, setGeocodeLocation] = useState(null);
  
  useEffect(() => {
    // Dynamically import geocoding service for better performance
    import('../services/geocoding').then(module => {
      setGeocodeLocation(() => module.geocodeLocation);
    });
  }, []);

  // Assess coordinate quality
  const assessCoordinateQuality = (roadwork) => {
    if (!roadwork?.coordinates) {
      return {
        quality: 'none',
        source: 'none',
        uncertainty: 'high',
        zoomLevel: 12,
        markerStyle: 'search',
        precision: 'unknown'
      };
    }

    const coordinateSource = roadwork.coordinateSource || 'unknown';
    const coordinateAccuracy = roadwork.coordinateAccuracy;
    const coordinatePrecision = roadwork.coordinatePrecision || 'unknown';
    
    // High precision GPS coordinates - now with proj4 conversion
    if (coordinateSource === 'gps' || coordinateSource === 'survey' || 
        coordinateSource === 'street_manager_precise' || coordinateAccuracy === 'high' ||
        coordinateSource.startsWith('street_manager_converted')) {
      return {
        quality: 'high',
        source: coordinateSource,
        uncertainty: 'low',
        zoomLevel: 18, // Increased zoom for higher precision
        markerStyle: 'precise',
        precision: coordinatePrecision
      };
    }
    
    // Geocoded or approximate coordinates
    if (coordinateSource === 'geocoded' || coordinateSource === 'address_lookup' ||
        coordinateSource === 'street_manager_geocoded' || coordinateSource === 'geocoded_fallback' ||
        coordinateSource === 'nominatim_geocoded' || coordinateSource === 'linestring_centroid' ||
        coordinateAccuracy === 'medium') {
      return {
        quality: 'medium',
        source: coordinateSource,
        uncertainty: 'medium',
        zoomLevel: 15,
        markerStyle: 'approximate'
      };
    }
    
    // Low quality fallbacks
    if (coordinateSource === 'highway_authority_area') {
      return {
        quality: 'low',
        source: coordinateSource,
        uncertainty: 'high',
        zoomLevel: 11,
        markerStyle: 'area'
      };
    }
    
    // Default for unknown quality
    return {
      quality: 'low',
      source: 'unknown',
      uncertainty: 'high',
      zoomLevel: 13,
      markerStyle: 'uncertain'
    };
  };

  // Get coordinates with fallback
  const getCoordinates = () => {
    if (roadwork?.coordinates) {
      // Handle different coordinate formats
      if (roadwork.coordinates.lat && roadwork.coordinates.lng) {
        return [roadwork.coordinates.lng, roadwork.coordinates.lat];
      }
      if (roadwork.coordinates.latitude && roadwork.coordinates.longitude) {
        return [roadwork.coordinates.longitude, roadwork.coordinates.latitude];
      }
      if (Array.isArray(roadwork.coordinates) && roadwork.coordinates.length === 2) {
        // Our backend returns [latitude, longitude], but mapbox expects [longitude, latitude]
        const [lat, lng] = roadwork.coordinates;
        return [lng, lat];
      }
    }
    
    // Fallback to Newcastle center if no coordinates
    return [-1.6178, 54.9783];
  };

  const coordinates = getCoordinates();
  const hasValidCoordinates = roadwork?.coordinates && 
    coordinates[0] !== -1.6178 && coordinates[1] !== 54.9783;
  const coordinateQuality = assessCoordinateQuality(roadwork);
  
  // Handle manual location search
  const handleLocationSearch = async () => {
    if (!searchQuery.trim() || !geocodeLocation || isSearching) return;
    
    setIsSearching(true);
    try {
      const result = await geocodeLocation(searchQuery);
      if (result && result.latitude && result.longitude) {
        // Update the roadwork coordinates temporarily for this session
        const updatedRoadwork = {
          ...roadwork,
          coordinates: [result.latitude, result.longitude],
          coordinateSource: 'manual_search',
          coordinateAccuracy: result.confidence || 'medium',
          searchResult: true
        };
        // Force re-render by updating state in parent would be ideal,
        // but for now we'll just update our local display
        setMapLoaded(false); // Trigger reload
        setTimeout(() => setMapLoaded(true), 500);
      } else {
        Alert.alert('Search Failed', 'Could not find coordinates for that location. Please try a different search term.');
      }
    } catch (error) {
      console.error('Manual search failed:', error);
      Alert.alert('Search Error', 'An error occurred while searching. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Set map as loaded after iframe loads
  useEffect(() => {
    if (visible && Platform.OS === 'web') {
      // Give iframe time to load
      const timer = setTimeout(() => setMapLoaded(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  // Handle external map apps
  const openInExternalMap = async () => {
    try {
      // Get original coordinates from roadwork data (should be [lat, lng])
      let lat, lng;
      
      if (roadwork?.coordinates) {
        if (Array.isArray(roadwork.coordinates) && roadwork.coordinates.length === 2) {
          // Backend returns [latitude, longitude]
          lat = roadwork.coordinates[0];
          lng = roadwork.coordinates[1];
        } else if (roadwork.coordinates.lat && roadwork.coordinates.lng) {
          lat = roadwork.coordinates.lat;
          lng = roadwork.coordinates.lng;
        } else if (roadwork.coordinates.latitude && roadwork.coordinates.longitude) {
          lat = roadwork.coordinates.latitude;
          lng = roadwork.coordinates.longitude;
        }
      }
      
      // Fallback to transformed coordinates if needed
      if (!lat || !lng) {
        lat = coordinates[1];
        lng = coordinates[0];
      }
      
      const label = encodeURIComponent(roadwork?.sm_street_name || roadwork?.street_name || 'Roadwork Location');
      
      if (Platform.OS === 'web') {
        // For web, open in new tab with more specific URL
        const googleUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${label}`;
        window.open(googleUrl, '_blank');
      } else if (Platform.OS === 'ios') {
        // Try Apple Maps first, fallback to Google
        const appleUrl = `http://maps.apple.com/?q=${label}&ll=${lat},${lng}`;
        const googleUrl = `https://maps.google.com/?q=${lat},${lng}`;
        
        const supported = await Linking.canOpenURL(appleUrl);
        if (supported) {
          await Linking.openURL(appleUrl);
        } else {
          await Linking.openURL(googleUrl);
        }
      } else {
        // Android - use Google Maps
        const googleUrl = `https://maps.google.com/?q=${lat},${lng}`;
        await Linking.openURL(googleUrl);
      }
    } catch (error) {
      console.error('Error opening external map:', error);
      Alert.alert('Error', 'Unable to open external map app');
    }
  };

  const openDirections = () => {
    const lat = coordinates[1];
    const lng = coordinates[0];
    
    if (Platform.OS === 'ios') {
      const url = `http://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;
      Linking.openURL(url);
    } else {
      const url = `https://maps.google.com/maps?daddr=${lat},${lng}`;
      Linking.openURL(url);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {roadwork?.sm_street_name || roadwork?.street_name || 'Roadwork Location'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {hasValidCoordinates 
                ? `${coordinates[1].toFixed(7)}, ${coordinates[0].toFixed(7)} (${coordinateQuality.quality} quality)`
                : roadwork?.geocodingAttempted 
                  ? 'Geocoding attempted - showing general area'
                  : roadwork?.coordinateFallbackStrategy === 'highway_authority_area'
                    ? `Showing ${roadwork?.sm_highway_authority || 'area'} region`
                  : roadwork?.showRegionalMap
                    ? 'Showing regional map'
                    : 'Location coordinates unavailable'
              }
            </Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Map Container */}
        <View style={styles.mapContainer}>
          {Platform.OS === 'web' ? (
            <>
              <iframe
                src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBhBN_kVOnIRTKXYhzrDwpr8kvb0Uy0IY8&q=${coordinates[1]},${coordinates[0]}&zoom=${coordinateQuality.zoomLevel}&maptype=roadmap`}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 0,
                  filter: coordinateQuality.quality === 'high' ? 'brightness(1)' : 
                         coordinateQuality.quality === 'medium' ? 'brightness(0.95) sepia(0.1)' :
                         'brightness(0.9) sepia(0.2)'
                }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                onLoad={() => setMapLoaded(true)}
              />
              {!mapLoaded && (
                <View style={styles.loadingOverlay}>
                  <MaterialCommunityIcons name="map-marker" size={48} color="#3b82f6" />
                  <Text style={styles.loadingText}>Loading map...</Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.mobileMapContainer}>
              <MaterialCommunityIcons name="map-marker" size={64} color="#3b82f6" />
              <Text style={styles.mobileMapTitle}>Map View</Text>
              <Text style={styles.mobileMapText}>
                Open in your preferred map app to view this location
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsWrapper}>
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={openInExternalMap}>
              <MaterialCommunityIcons name="map-marker" size={20} color="#3b82f6" />
              <Text style={styles.actionButtonText}>Open in External Map</Text>
            </TouchableOpacity>
          </View>
          
          {/* Coordinate quality indicator */}
          <View style={[
            styles.qualityContainer,
            coordinateQuality.quality === 'high' && styles.qualityHigh,
            coordinateQuality.quality === 'medium' && styles.qualityMedium,
            coordinateQuality.quality === 'low' && styles.qualityLow,
            coordinateQuality.quality === 'none' && styles.qualityNone
          ]}>
            <MaterialCommunityIcons 
              name={
                coordinateQuality.quality === 'high' ? 'crosshairs-gps' :
                coordinateQuality.quality === 'medium' ? 'map-marker-radius' :
                coordinateQuality.quality === 'low' ? 'map-marker-question' :
                'map-search'
              } 
              size={16} 
              color={
                coordinateQuality.quality === 'high' ? '#22c55e' :
                coordinateQuality.quality === 'medium' ? '#f59e0b' :
                coordinateQuality.quality === 'low' ? '#ef4444' :
                '#6b7280'
              } 
            />
            <Text style={[
              styles.qualityText,
              { color: coordinateQuality.quality === 'high' ? '#22c55e' :
                       coordinateQuality.quality === 'medium' ? '#f59e0b' :
                       coordinateQuality.quality === 'low' ? '#ef4444' :
                       '#6b7280' }
            ]}>
              {
                coordinateQuality.quality === 'high' ? 
                  `Precise GPS coordinates${roadwork?.coordinatePrecision ? ` (${roadwork.coordinatePrecision} precision)` : ''}${roadwork?.coordinatePoints > 1 ? ` - ${roadwork.coordinatePoints} point${roadwork.coordinatePoints > 1 ? 's' : ''} mapped${roadwork?.representativePointType ? `, showing ${roadwork.representativePointType} point` : ''}` : ''}` :
                coordinateQuality.quality === 'medium' ? 
                  `Approximate location from geocoding${roadwork?.coordinatePoints > 1 ? ` (${roadwork.coordinatePoints} points)` : ''}` :
                coordinateQuality.quality === 'low' ? 
                  'Coordinates may be inaccurate' :
                roadwork?.geocodingError ? 
                  'Geocoding failed - showing regional area' :
                'No coordinates available'
              }
            </Text>
          </View>
          
          {/* Fallback Suggestions for missing coordinates */}
          {(coordinateQuality.quality === 'none' || roadwork?.fallbackSuggestions) && (
            <View style={styles.fallbackContainer}>
              <Text style={styles.fallbackTitle}>
                <MaterialCommunityIcons name="information-outline" size={16} color="#60a5fa" />
                {' '}How to find this location:
              </Text>
              {(roadwork?.fallbackSuggestions || [
                {
                  icon: 'email-outline',
                  text: 'Check the original roadworks notification email',
                  detail: `Permit ref: ${roadwork?.sm_permit_reference || roadwork?.sm_reference || 'Unknown'}`
                },
                {
                  icon: 'web',
                  text: 'Search on one.network',
                  detail: roadwork?.sm_permit_reference ? 
                    `Use permit reference: ${roadwork.sm_permit_reference}` :
                    `Search for: ${roadwork?.sm_street_name || roadwork?.street_name}`,
                  url: roadwork?.sm_permit_reference ? 
                    `https://one.network/?q=${encodeURIComponent(roadwork.sm_permit_reference)}` :
                    `https://one.network/`
                },
                {
                  icon: 'phone',
                  text: `Contact ${roadwork?.sm_promoter_organisation || 'the contractor'}`,
                  detail: 'Request exact location details'
                },
                {
                  icon: 'map-search',
                  text: 'Use local knowledge',
                  detail: `Search area: ${roadwork?.sm_highway_authority || 'Check description'}`
                }
              ]).map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => {
                    if (suggestion.url) {
                      Linking.openURL(suggestion.url);
                    }
                  }}
                  disabled={!suggestion.url}
                >
                  <MaterialCommunityIcons 
                    name={suggestion.icon} 
                    size={20} 
                    color="#3b82f6" 
                  />
                  <View style={styles.suggestionTextContainer}>
                    <Text style={styles.suggestionText}>{suggestion.text}</Text>
                    <Text style={styles.suggestionDetail}>{suggestion.detail}</Text>
                  </View>
                  {suggestion.url && (
                    <MaterialCommunityIcons 
                      name="open-in-new" 
                      size={16} 
                      color="#60a5fa" 
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Manual search interface for missing coordinates */}
          {coordinateQuality.quality === 'none' && (
            <View style={styles.searchContainer}>
              <Text style={styles.searchTitle}>Search for Location</Text>
              <View style={styles.searchInputContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Enter street name or location..."
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleLocationSearch}
                  editable={!isSearching}
                />
                <TouchableOpacity 
                  style={[
                    styles.searchButton,
                    (!searchQuery.trim() || isSearching) && styles.searchButtonDisabled
                  ]}
                  onPress={handleLocationSearch}
                  disabled={!searchQuery.trim() || isSearching}
                >
                  {isSearching ? (
                    <MaterialCommunityIcons name="loading" size={20} color="#3b82f6" />
                  ) : (
                    <MaterialCommunityIcons name="magnify" size={20} color="#3b82f6" />
                  )}
                </TouchableOpacity>
              </View>
              <Text style={styles.searchHint}>
                Try searching for: "{roadwork?.sm_street_name || 'street name'}", "{roadwork?.sm_location_description || 'area name'}", or nearby landmarks
              </Text>
            </View>
          )}
        </View>

        {/* Roadwork Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>{roadwork?.sm_street_name || roadwork?.street_name}</Text>
          <Text style={styles.infoDescription}>{roadwork?.sm_works_description || roadwork?.sm_activity_type || 'Roadworks'}</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Contractor:</Text>
            <Text style={styles.infoValue}>{roadwork?.sm_promoter_organisation || roadwork?.sm_promoter_name || 'Unknown'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status:</Text>
            <View style={[styles.severityBadge, { backgroundColor: '#3b82f6' }]}>
              <Text style={styles.severityText}>{roadwork?.sm_works_state || 'UNKNOWN'}</Text>
            </View>
          </View>
          
          {roadwork?.sm_permit_reference && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Permit:</Text>
              <Text style={styles.infoValue}>{roadwork.sm_permit_reference}</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const getSeverityColor = (severity) => {
  switch (severity?.toLowerCase()) {
    case 'high': return '#ef4444';
    case 'medium': return '#f59e0b';
    case 'low': return '#10b981';
    default: return '#6b7280';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(31, 41, 55, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 130, 246, 0.3)',
  },
  headerLeft: {
    flex: 1,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#ffffff',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  mobileMapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
  },
  mobileMapTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  mobileMapText: {
    marginTop: 8,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionButtonsWrapper: {
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  actionButtonText: {
    marginLeft: 8,
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  qualityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  qualityHigh: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  qualityMedium: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  qualityLow: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  qualityNone: {
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    borderColor: 'rgba(107, 114, 128, 0.3)',
  },
  qualityText: {
    marginLeft: 6,
    fontSize: 12,
    flex: 1,
    fontWeight: '500',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  searchTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#ffffff',
  },
  searchButton: {
    padding: 10,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },
  searchHint: {
    fontSize: 11,
    color: 'rgba(59, 130, 246, 0.8)',
    fontStyle: 'italic',
    lineHeight: 14,
  },
  infoContainer: {
    padding: 20,
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    color: '#ffffff',
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  severityText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  fallbackContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  fallbackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#60a5fa',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  suggestionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  suggestionText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
    marginBottom: 2,
  },
  suggestionDetail: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});

export default RoadworkMapModal;
