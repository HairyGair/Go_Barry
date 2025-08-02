// Go_BARRY/components/RoadworkLinestringMap.jsx
// Visual LINESTRING display component for showing full roadwork extent
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const RoadworkLinestringMap = ({ roadwork, width = '100%', height = 400 }) => {
  const mapRef = useRef(null);
  
  useEffect(() => {
    if (!roadwork?.allCoordinatePoints || roadwork.allCoordinatePoints.length < 2) {
      return;
    }
    
    // Initialize map with roadwork polyline
    initializeMap();
  }, [roadwork]);
  
  const initializeMap = () => {
    // Convert coordinate points to Google Maps format
    const pathCoordinates = roadwork.allCoordinatePoints
      .map(point => `${point[0]},${point[1]}`)
      .join('|');
    
    // Calculate bounds for centering
    const bounds = calculateBounds(roadwork.allCoordinatePoints);
    const center = {
      lat: (bounds.north + bounds.south) / 2,
      lng: (bounds.east + bounds.west) / 2
    };
    
    // Determine appropriate zoom level based on extent
    const latDiff = bounds.north - bounds.south;
    const lngDiff = bounds.east - bounds.west;
    const maxDiff = Math.max(latDiff, lngDiff);
    
    let zoom = 16;
    if (maxDiff > 0.01) zoom = 14;
    if (maxDiff > 0.05) zoom = 13;
    if (maxDiff > 0.1) zoom = 12;
    
    // Build the static map URL with polyline
    const polylineColor = getPolylineColor(roadwork);
    const mapUrl = buildMapUrl(center, zoom, pathCoordinates, polylineColor);
    
    if (mapRef.current) {
      mapRef.current.src = mapUrl;
    }
  };
  
  const calculateBounds = (points) => {
    let north = -90, south = 90, east = -180, west = 180;
    
    points.forEach(([lat, lng]) => {
      north = Math.max(north, parseFloat(lat));
      south = Math.min(south, parseFloat(lat));
      east = Math.max(east, parseFloat(lng));
      west = Math.min(west, parseFloat(lng));
    });
    
    return { north, south, east, west };
  };
  
  const getPolylineColor = (roadwork) => {
    // Color based on impact/status
    if (roadwork.sm_works_state === 'Works in progress') return '0xFF0000FF'; // Red
    if (roadwork.sm_works_state === 'Works planned') return '0xFFA500FF'; // Orange
    if (roadwork.affectedRoutes?.length > 5) return '0xFF00FFFF'; // Magenta for high impact
    return '0x0000FFFF'; // Blue default
  };
  
  const buildMapUrl = (center, zoom, path, color) => {
    const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';
    const params = new URLSearchParams({
      center: `${center.lat},${center.lng}`,
      zoom: zoom,
      size: '640x400',
      maptype: 'roadmap',
      key: 'AIzaSyBhBN_kVOnIRTKXYhzrDwpr8kvb0Uy0IY8',
      path: `color:${color}|weight:5|${path}`
    });
    
    // Add start and end markers
    const startPoint = roadwork.allCoordinatePoints[0];
    const endPoint = roadwork.allCoordinatePoints[roadwork.allCoordinatePoints.length - 1];
    
    params.append('markers', `color:green|label:S|${startPoint[0]},${startPoint[1]}`);
    params.append('markers', `color:red|label:E|${endPoint[0]},${endPoint[1]}`);
    
    return `${baseUrl}?${params.toString()}`;
  };
  
  // If no linestring data, show standard single point
  if (!roadwork?.allCoordinatePoints || roadwork.allCoordinatePoints.length < 2) {
    return (
      <View style={styles.noLinestringContainer}>
        <MaterialCommunityIcons name="map-marker" size={24} color="#6b7280" />
        <Text style={styles.noLinestringText}>
          Single point location only
        </Text>
      </View>
    );
  }
  
  const totalLength = calculateTotalLength(roadwork.allCoordinatePoints);
  
  return (
    <View style={[styles.container, { width, height }]}>
      <img
        ref={mapRef}
        style={styles.map}
        alt="Roadwork extent map"
      />
      <View style={styles.infoOverlay}>
        <View style={styles.infoBadge}>
          <MaterialCommunityIcons name="map-marker-path" size={16} color="#ffffff" />
          <Text style={styles.infoText}>
            {roadwork.coordinatePoints} points • ~{totalLength}m
          </Text>
        </View>
      </View>
    </View>
  );
};

// Calculate approximate length of linestring
const calculateTotalLength = (points) => {
  let totalMeters = 0;
  
  for (let i = 1; i < points.length; i++) {
    const [lat1, lng1] = points[i - 1].map(parseFloat);
    const [lat2, lng2] = points[i].map(parseFloat);
    
    // Simplified distance calculation
    const R = 6371000; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    totalMeters += R * c;
  }
  
  return Math.round(totalMeters);
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1f2937'
  },
  map: {
    width: '100%',
    height: '100%',
    borderRadius: 12
  },
  noLinestringContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    borderRadius: 8
  },
  noLinestringText: {
    marginLeft: 8,
    color: '#6b7280',
    fontSize: 14
  },
  infoOverlay: {
    position: 'absolute',
    top: 12,
    right: 12
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  infoText: {
    marginLeft: 6,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600'
  }
});

export default RoadworkLinestringMap;
