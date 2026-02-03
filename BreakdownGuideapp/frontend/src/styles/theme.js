/**
 * Go BARRY Theme Configuration
 * Ocean Teal + Scandinavian Industrial Design System
 *
 * Copyright © 2025 Anthony Gair. All Rights Reserved.
 */

export const theme = {
  colors: {
    // Primary Brand Colors - Ocean Teal
    primary: '#0097A7',           // Ocean Teal - main brand
    primaryDark: '#00838F',       // Darker teal for hover
    primaryLight: '#00BCD4',      // Lighter teal for highlights
    primaryAccent: '#00ACC1',     // Accent teal

    // Background Colors - Scandinavian Industrial Dark
    bgPrimary: '#0B1120',         // Deep navy background
    bgSecondary: '#141D2B',       // Card backgrounds
    bgTertiary: '#1E293B',        // Elevated surfaces
    bgHover: '#0F1624',           // Hover state backgrounds
    bgOverlay: 'rgba(11, 17, 32, 0.95)', // Modal overlays
    bgSurface: '#0F1624',         // Surface panels

    // Text Colors - High Contrast
    textPrimary: '#FFFFFF',       // Primary white text
    textSecondary: '#94A3B8',     // Secondary gray text
    textMuted: '#64748B',         // Muted text
    textDanger: '#F87171',        // Danger text
    textAccent: '#00BCD4',        // Teal accent text

    // Border Colors
    border: '#1E293B',            // Subtle borders
    borderHover: '#334155',       // Hover border
    borderFocus: '#0097A7',       // Focus border (teal)
    borderAccent: 'rgba(0, 151, 167, 0.3)', // Teal accent border

    // Status Colors - Vibrant and Clear
    success: '#10B981',           // Emerald green
    successLight: 'rgba(16, 185, 129, 0.15)',
    warning: '#F59E0B',           // Amber warning
    warningLight: 'rgba(245, 158, 11, 0.15)',
    danger: '#DC2626',            // Red danger
    dangerLight: 'rgba(220, 38, 38, 0.15)',
    info: '#3B82F6',              // Blue info
    infoLight: 'rgba(59, 130, 246, 0.15)',

    // Decision Status Colors
    amber: '#F59E0B',             // AMBER decision
    amberBg: 'rgba(245, 158, 11, 0.15)',
    stop: '#DC2626',              // STOP decision
    stopBg: 'rgba(220, 38, 38, 0.15)',
    continue: '#10B981',          // CONTINUE decision
    continueBg: 'rgba(16, 185, 129, 0.15)',

    // Special UI Colors
    emergency: '#DC2626',         // Emergency red
    priority: '#F87171',          // Priority indicators
    badge: '#1E293B',             // Badge backgrounds
    highlight: 'rgba(0, 151, 167, 0.1)', // Teal highlight
    cardGlow: 'rgba(0, 151, 167, 0.2)', // Card glow effect

    // Live/Active indicators
    live: '#10B981',              // Live indicator green
    active: '#0097A7',            // Active state teal
  },

  // Consistent spacing
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    xxl: '3rem',     // 48px
  },

  // Border radius
  radius: {
    sm: '6px',
    md: '10px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },

  // Shadows for dark theme
  shadows: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.3)',
    md: '0 4px 12px rgba(0, 0, 0, 0.4)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.5)',
    xl: '0 16px 40px rgba(0, 0, 0, 0.6)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.5)',
    glow: '0 0 20px rgba(0, 151, 167, 0.3)',
    glowStrong: '0 0 30px rgba(0, 151, 167, 0.5)',
  },

  // Typography
  fonts: {
    display: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    mono: "'JetBrains Mono', 'SF Mono', Consolas, monospace",
  },

  // Font sizes
  fontSizes: {
    xs: '0.75rem',   // 12px
    sm: '0.875rem',  // 14px
    md: '1rem',      // 16px
    lg: '1.125rem',  // 18px
    xl: '1.25rem',   // 20px
    xxl: '1.5rem',   // 24px
    xxxl: '2rem',    // 32px
  },

  // Transitions
  transitions: {
    fast: '150ms ease-in-out',
    normal: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  },

  // Z-index layers
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
  },

  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #0097A7 0%, #00838F 100%)',
    primaryHover: 'linear-gradient(135deg, #00ACC1 0%, #0097A7 100%)',
    surface: 'linear-gradient(180deg, #141D2B 0%, #0F1624 100%)',
    danger: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
    success: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    warning: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
  },
};

// Helper function to apply theme colors
export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'stop':
      return theme.colors.stop;
    case 'amber':
      return theme.colors.amber;
    case 'continue':
      return theme.colors.continue;
    case 'critical':
    case 'danger':
      return theme.colors.danger;
    case 'warning':
      return theme.colors.warning;
    case 'success':
    case 'complete':
    case 'resolved':
      return theme.colors.success;
    case 'info':
      return theme.colors.info;
    default:
      return theme.colors.textSecondary;
  }
};

// Helper function to get status background with opacity
export const getStatusBackground = (status, opacity = 0.15) => {
  switch (status?.toLowerCase()) {
    case 'stop':
      return theme.colors.stopBg;
    case 'amber':
      return theme.colors.amberBg;
    case 'continue':
      return theme.colors.continueBg;
    case 'critical':
    case 'danger':
      return theme.colors.dangerLight;
    case 'warning':
      return theme.colors.warningLight;
    case 'success':
    case 'complete':
    case 'resolved':
      return theme.colors.successLight;
    case 'info':
      return theme.colors.infoLight;
    default:
      return theme.colors.bgTertiary;
  }
};

// Utility function to convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}
