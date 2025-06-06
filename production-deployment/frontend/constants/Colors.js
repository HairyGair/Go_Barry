// Go_BARRY/constants/Colors.js
// Color scheme for BARRY Traffic Intelligence App

export const Colors = {
  // Primary brand colors
  primary: '#007AFF',
  primaryDark: '#005BB5',
  primaryLight: '#4DA2FF',
  
  // Background colors
  background: '#F8F9FA',
  white: '#FFFFFF',
  black: '#000000',
  
  // Grey scale
  lightGrey: '#F1F3F4',
  mediumGrey: '#9CA3AF',
  darkGrey: '#6B7280',
  
  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#60A5FA',
  
  // Traffic alert status colors
  trafficAlert: {
    active: '#EF4444',    // Red - immediate attention
    upcoming: '#F59E0B',  // Amber - upcoming/planned
    planned: '#10B981'    // Green - future/low priority
  },
  
  // Text colors
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    light: '#9CA3AF',
    inverse: '#FFFFFF'
  },
  
  // Border colors
  border: {
    light: '#E5E7EB',
    medium: '#D1D5DB',
    dark: '#9CA3AF'
  },
  
  // Background variations
  backgrounds: {
    section: '#F9FAFB',
    card: '#FFFFFF',
    highlight: '#EBF8FF',
    overlay: 'rgba(0, 0, 0, 0.5)'
  },
  
  // Traffic-specific colors
  traffic: {
    severe: '#DC2626',     // Severe congestion
    moderate: '#F59E0B',   // Moderate congestion  
    light: '#10B981',      // Light congestion
    freeFlow: '#059669',   // Free flowing traffic
    incident: '#EF4444',   // Traffic incidents
    roadwork: '#8B5CF6'    // Roadworks
  },
  
  // Route badge colors
  route: {
    background: '#2563EB',
    text: '#FFFFFF',
    border: '#1D4ED8'
  },
  
  // Severity colors
  severity: {
    high: '#EF4444',
    medium: '#F59E0B', 
    low: '#10B981'
  }
};

// Helper functions
export const getStatusColor = (status) => {
  switch (status) {
    case 'red':
      return Colors.trafficAlert.active;
    case 'amber':
      return Colors.trafficAlert.upcoming;
    case 'green':
      return Colors.trafficAlert.planned;
    default:
      return Colors.mediumGrey;
  }
};

export const getSeverityColor = (severity) => {
  switch (severity) {
    case 'High':
      return Colors.severity.high;
    case 'Medium':
      return Colors.severity.medium;
    case 'Low':
      return Colors.severity.low;
    default:
      return Colors.mediumGrey;
  }
};

export const getTrafficTypeColor = (type) => {
  switch (type) {
    case 'incident':
      return Colors.traffic.incident;
    case 'congestion':
      return Colors.traffic.moderate;
    case 'roadwork':
      return Colors.traffic.roadwork;
    default:
      return Colors.mediumGrey;
  }
};

export const getCongestionColor = (level) => {
  if (level >= 8) return Colors.traffic.severe;
  if (level >= 6) return Colors.traffic.moderate;
  if (level >= 3) return Colors.traffic.light;
  return Colors.traffic.freeFlow;
};

export default Colors;