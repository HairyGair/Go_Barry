/*
 * Go Barry - Live Map Styles and Theme
 * Consistent styling for live map components
 * Phase 1: Core theme with alert states and UI colors
 */

import { Platform } from 'react-native';

export const liveMapTheme = {
  // Alert State Colors
  alertStates: {
    new: '#ef4444',         // Red - Urgent attention needed
    acknowledged: '#f59e0b', // Amber - Supervisor aware  
    escalated: '#8b5cf6',   // Purple - In management workflow
  },
  
  // Bus & Route Colors (for future phases)
  buses: {
    active: '#10b981',      // Green - Bus in service
    delayed: '#f59e0b',     // Amber - Behind schedule
    route: '#06b6d4',       // Cyan - Route overlay
    routeHighlight: '#0ea5e9', // Brighter cyan for selected routes
  },
  
  // Modern UI Elements
  ui: {
    background: '#0a0e16',   // Dark background
    sidebar: '#1f2937',      // Sidebar background
    accent: '#3b82f6',       // Primary accent
    text: '#f3f4f6',         // Primary text
    textSecondary: '#9ca3af', // Secondary text
    border: 'rgba(255,255,255,0.1)', // Border color
    overlay: 'rgba(0,0,0,0.8)', // Modal overlay
  },
  
  // Map specific colors
  map: {
    background: '#1a1a3e',   // Map background
    loadingOverlay: 'rgba(26, 26, 62, 0.95)',
    errorOverlay: 'rgba(127, 29, 29, 0.95)',
    markerShadow: 'rgba(0,0,0,0.3)',
    trafficOpacity: 0.7,
  },
  
  // Button states
  buttons: {
    primary: '#3b82f6',
    secondary: '#6b7280',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    disabled: '#374151',
  },
  
  // Severity colors (for compatibility)
  severity: {
    critical: '#ef4444',
    high: '#f59e0b',
    medium: '#06b6d4',
    low: '#64748b',
    unknown: '#64748b',
  },
  
  // Animation durations
  animations: {
    fast: 150,
    normal: 250,
    slow: 500,
    flyTo: 1500,
  },
  
  // Z-index levels
  zIndex: {
    map: 1,
    markers: 100,
    selectedMarker: 1000,
    controls: 1100,
    sidebar: 1200,
    modal: 1300,
    tooltip: 1400,
  },
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  // Border radius
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  
  // Typography
  typography: {
    heading1: {
      fontSize: 24,
      fontWeight: '700',
      lineHeight: 32,
    },
    heading2: {
      fontSize: 20,
      fontWeight: '700',
      lineHeight: 28,
    },
    heading3: {
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 24,
    },
    body: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
    },
    button: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 20,
    },
  },
};

// Helper functions for consistent styling
export const createMarkerStyle = (state, isSelected = false) => {
  const baseSize = isSelected ? 24 : 18;
  const color = liveMapTheme.alertStates[state] || liveMapTheme.severity.unknown;
  
  return {
    width: baseSize,
    height: baseSize,
    backgroundColor: color,
    border: '2px solid white',
    borderRadius: '50%',
    cursor: 'pointer',
    boxShadow: `0 2px 8px ${liveMapTheme.map.markerShadow}`,
    transition: `all ${liveMapTheme.animations.normal}ms ease`,
    position: 'relative',
    ...(isSelected && Platform.OS === 'web' && {
      animation: 'pulse 2s infinite',
    }),
  };
};

export const createButtonStyle = (variant = 'primary', size = 'md') => {
  const baseStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: liveMapTheme.borderRadius.md,
    transition: `all ${liveMapTheme.animations.fast}ms ease`,
  };
  
  const sizeStyles = {
    sm: {
      paddingVertical: liveMapTheme.spacing.sm,
      paddingHorizontal: liveMapTheme.spacing.md,
      gap: liveMapTheme.spacing.sm,
    },
    md: {
      paddingVertical: liveMapTheme.spacing.md,
      paddingHorizontal: liveMapTheme.spacing.lg,
      gap: liveMapTheme.spacing.md,
    },
    lg: {
      paddingVertical: liveMapTheme.spacing.lg,
      paddingHorizontal: liveMapTheme.spacing.xl,
      gap: liveMapTheme.spacing.lg,
    },
  };
  
  const variantStyles = {
    primary: {
      backgroundColor: liveMapTheme.buttons.primary,
    },
    secondary: {
      backgroundColor: liveMapTheme.buttons.secondary,
    },
    success: {
      backgroundColor: liveMapTheme.buttons.success,
    },
    warning: {
      backgroundColor: liveMapTheme.buttons.warning,
    },
    danger: {
      backgroundColor: liveMapTheme.buttons.danger,
    },
    acknowledge: {
      backgroundColor: liveMapTheme.alertStates.acknowledged,
    },
    escalate: {
      backgroundColor: liveMapTheme.alertStates.escalated,
    },
  };
  
  return {
    ...baseStyle,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };
};

export const createOverlayStyle = (type = 'loading') => {
  const baseStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: liveMapTheme.zIndex.modal,
  };
  
  const typeStyles = {
    loading: {
      backgroundColor: liveMapTheme.map.loadingOverlay,
      color: liveMapTheme.ui.textSecondary,
    },
    error: {
      backgroundColor: liveMapTheme.map.errorOverlay,
      color: '#fca5a5',
    },
  };
  
  return {
    ...baseStyle,
    ...typeStyles[type],
  };
};

// CSS-in-JS helpers for web components
export const getCSSMarkerStyle = (state, isSelected = false) => {
  const style = createMarkerStyle(state, isSelected);
  
  return Object.entries(style)
    .map(([key, value]) => {
      // Convert camelCase to kebab-case
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${cssKey}: ${value}`;
    })
    .join('; ');
};

// Utility to get consistent spacing
export const getSpacing = (size) => {
  return liveMapTheme.spacing[size] || liveMapTheme.spacing.md;
};

// Utility to get consistent colors
export const getAlertStateColor = (state) => {
  return liveMapTheme.alertStates[state] || liveMapTheme.severity.unknown;
};

export const getSeverityColor = (severity) => {
  return liveMapTheme.severity[severity?.toLowerCase()] || liveMapTheme.severity.unknown;
};

// Export default theme
export default liveMapTheme;
