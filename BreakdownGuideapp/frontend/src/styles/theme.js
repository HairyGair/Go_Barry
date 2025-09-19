// Go North East Brand Colors and Theme Configuration
export const theme = {
  colors: {
    // Primary Brand Colors
    primary: '#e4251b',        // Go North East Red
    primaryDark: '#c41e17',    // Darker red for hover states
    primaryLight: '#ff4136',   // Lighter red for highlights
    
    // Background Colors - Dark Theme
    bgPrimary: '#121212',      // Main dark background
    bgSecondary: '#1a1a1a',    // Card backgrounds
    bgTertiary: '#242424',     // Elevated surfaces
    bgHover: '#2a2a2a',        // Hover state backgrounds
    bgOverlay: 'rgba(0, 0, 0, 0.8)', // Modal overlays
    
    // Text Colors
    textPrimary: '#ffffff',    // Primary white text
    textSecondary: '#a0a0a0',  // Secondary gray text
    textMuted: '#666666',      // Muted text
    textDanger: '#ff4136',     // Danger text
    
    // Border Colors
    border: '#333333',         // Subtle borders
    borderHover: '#444444',    // Hover border
    borderFocus: '#e4251b',    // Focus border (brand red)
    
    // Status Colors
    success: '#28a745',        // Green for success
    warning: '#ffc107',        // Amber for warnings
    danger: '#dc3545',         // Red for danger/stop
    info: '#17a2b8',          // Blue for info
    
    // Decision Status Colors
    amber: '#ff9800',          // For AMBER decision
    stop: '#e4251b',           // For STOP decision
    continue: '#28a745',       // For CONTINUE decision
    
    // Special UI Colors
    emergency: '#ff0000',      // Emergency red
    priority: '#ff6b6b',       // Priority indicators
    badge: '#333333',          // Badge backgrounds
    highlight: 'rgba(228, 37, 27, 0.1)', // Subtle red highlight
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
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  
  // Shadows for dark theme
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.5)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.6)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.5)',
  },
  
  // Typography
  fonts: {
    primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'Consolas, "Courier New", monospace',
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
    normal: '300ms ease-in-out',
    slow: '500ms ease-in-out',
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
      return theme.colors.success;
    default:
      return theme.colors.textSecondary;
  }
};

// Helper function to get status background with opacity
export const getStatusBackground = (status, opacity = 0.1) => {
  const color = getStatusColor(status);
  const rgb = hexToRgb(color);
  return rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})` : color;
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
