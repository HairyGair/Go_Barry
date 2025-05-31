/**
 * Go North East Brand Colors for BARRY App
 * Based on Go North East / GoAhead Group branding
 */

export const Colors = {
  // Primary Brand Colors
  primary: '#0066CC',        // Go North East Blue
  secondary: '#FF0000',      // Go North East Red
  
  // Neutral Colors
  white: '#FFFFFF',
  black: '#000000',
  lightGrey: '#F5F5F5',
  mediumGrey: '#E0E0E0',
  darkGrey: '#333333',
  background: '#F8F9FA',
  
  // Status Colors
  success: '#28A745',        // Green for success/active
  warning: '#FFC107',        // Yellow/orange for warnings
  danger: '#DC3545',         // Red for errors/high severity
  info: '#17A2B8',          // Blue for information
  
  // Traffic Alert Colors
  trafficAlert: {
    incident: '#DC3545',      // Red for incidents
    congestion: '#FFC107',    // Orange for congestion
    roadwork: '#FF0000',      // Go North East red for roadworks
    active: '#DC3545',        // Red for active alerts
    upcoming: '#FFC107',      // Orange for upcoming
    planned: '#28A745',       // Green for planned/future
  },
  
  // Route Badge Colors (for different bus routes)
  routeBadges: {
    primary: '#0066CC',       // Standard route color
    express: '#FF0000',       // Express routes (X services)
    local: '#28A745',         // Local routes
    special: '#6F42C1',       // Special services
    nightBus: '#343A40',      // Night services
  },
  
  // Shadow and Border Colors
  shadow: {
    light: 'rgba(0, 0, 0, 0.1)',
    medium: 'rgba(0, 0, 0, 0.2)',
    dark: 'rgba(0, 0, 0, 0.3)',
  },
  
  border: {
    light: '#E9ECEF',
    medium: '#DEE2E6',
    dark: '#CED4DA',
  },
  
  // Text Colors
  text: {
    primary: '#212529',       // Main text
    secondary: '#6C757D',     // Secondary text
    muted: '#ADB5BD',        // Muted text
    inverse: '#FFFFFF',      // White text on dark backgrounds
  },
  
  // Background Variants
  backgrounds: {
    primary: '#F8F9FA',      // Main app background
    card: '#FFFFFF',         // Card backgrounds
    section: '#F1F3F4',      // Section backgrounds
    highlight: '#E3F2FD',    // Highlighted areas
  },
};

// Export individual color groups for easier importing
export const BrandColors = {
  primary: Colors.primary,
  secondary: Colors.secondary,
  white: Colors.white,
  background: Colors.background,
};

export const StatusColors = {
  success: Colors.success,
  warning: Colors.warning,
  danger: Colors.danger,
  info: Colors.info,
};

export const TrafficColors = Colors.trafficAlert;

export const RouteColors = Colors.routeBadges;

// Utility function to get status color based on alert status
export const getStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'red':
    case 'active':
    case 'high':
      return Colors.trafficAlert.active;
    case 'amber':
    case 'upcoming':
    case 'medium':
      return Colors.trafficAlert.upcoming;
    case 'green':
    case 'planned':
    case 'low':
      return Colors.trafficAlert.planned;
    default:
      return Colors.mediumGrey;
  }
};

// Utility function to get severity color
export const getSeverityColor = (severity: string): string => {
  switch (severity?.toLowerCase()) {
    case 'high':
    case 'critical':
      return Colors.danger;
    case 'medium':
    case 'moderate':
      return Colors.warning;
    case 'low':
    case 'minor':
      return Colors.success;
    default:
      return Colors.info;
  }
};

// Utility function to get traffic type color
export const getTrafficTypeColor = (type: string): string => {
  switch (type?.toLowerCase()) {
    case 'incident':
      return Colors.trafficAlert.incident;
    case 'congestion':
      return Colors.trafficAlert.congestion;
    case 'roadwork':
    case 'roadworks':
      return Colors.trafficAlert.roadwork;
    default:
      return Colors.primary;
  }
};

export default Colors;