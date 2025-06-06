// Web fallback for react-native-maps
// This provides compatible exports for web builds

import React from 'react';
import { View, Text } from 'react-native';

// Mock MapView component that works on web
const MapView = ({ children, style, ...props }) => {
  return (
    <View style={[{
      backgroundColor: '#E5E7EB',
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 200
    }, style]}>
      <Text style={{ color: '#6B7280', fontSize: 16 }}>
        🗺️ Map View (Web Mode)
      </Text>
      <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>
        Maps functionality available in native apps
      </Text>
      {children}
    </View>
  );
};

// Mock Marker component
const Marker = ({ children, ...props }) => {
  return <View>{children}</View>;
};

// Mock Callout component
const Callout = ({ children, ...props }) => {
  return <View>{children}</View>;
};

// Mock Polygon component
const Polygon = ({ children, ...props }) => {
  return <View>{children}</View>;
};

// Mock Polyline component
const Polyline = ({ children, ...props }) => {
  return <View>{children}</View>;
};

// Mock Circle component
const Circle = ({ children, ...props }) => {
  return <View>{children}</View>;
};

// Mock Overlay component
const Overlay = ({ children, ...props }) => {
  return <View>{children}</View>;
};

// Export all the components that react-native-maps usually exports
export default MapView;
export {
  MapView,
  Marker,
  Callout,
  Polygon,
  Polyline,
  Circle,
  Overlay
};

// Mock constants
export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = 'default';

// Mock types for TypeScript compatibility
export const MAP_TYPES = {
  STANDARD: 'standard',
  SATELLITE: 'satellite',
  HYBRID: 'hybrid',
  TERRAIN: 'terrain'
};
