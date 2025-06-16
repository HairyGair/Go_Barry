// Typography Scale System for Go BARRY
// Consistent typography across all components

export const typography = {
  // Font families
  fontFamily: {
    sans: 'System',
    mono: 'monospace',
  },

  // Font sizes with semantic naming
  fontSize: {
    // Display sizes
    'display-lg': 32,   // Main headers
    'display-md': 28,   // Sub headers
    'display-sm': 24,   // Section headers
    
    // Text sizes
    'text-2xl': 22,     // Large text
    'text-xl': 20,      // Emphasis text
    'text-lg': 17,      // Body large
    'text-base': 15,    // Body default
    'text-sm': 14,      // Small text
    'text-xs': 13,      // Extra small
    'text-2xs': 12,     // Tiny text
    
    // Special sizes
    'time-display': 32, // Clock displays
    'icon-lg': 32,      // Large icons
    'icon-md': 24,      // Medium icons
    'icon-sm': 20,      // Small icons
  },

  // Font weights
  fontWeight: {
    'thin': '300',
    'normal': '400',
    'medium': '500',
    'semibold': '600',
    'bold': '700',
    'extrabold': '800',
    'black': '900',
  },

  // Line heights
  lineHeight: {
    'tight': 1.2,
    'snug': 1.375,
    'normal': 1.5,
    'relaxed': 1.625,
    'loose': 2,
  },

  // Letter spacing
  letterSpacing: {
    'tighter': -1,
    'tight': -0.5,
    'normal': 0,
    'wide': 0.3,
    'wider': 0.5,
    'widest': 0.8,
    'ultra': 1.2,
  },

  // Pre-defined text styles
  styles: {
    // Headers
    headerLarge: {
      fontSize: 32,
      fontWeight: '900',
      letterSpacing: -0.5,
      lineHeight: 1.2,
    },
    headerMedium: {
      fontSize: 28,
      fontWeight: '900',
      letterSpacing: -0.5,
      lineHeight: 1.2,
    },
    headerSmall: {
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: 0.3,
      lineHeight: 1.3,
    },
    
    // Section titles
    sectionTitle: {
      fontSize: 17,
      fontWeight: '900',
      letterSpacing: 0.5,
      lineHeight: 1.4,
    },
    
    // Body text
    bodyLarge: {
      fontSize: 17,
      fontWeight: '500',
      letterSpacing: -0.1,
      lineHeight: 1.5,
    },
    bodyBase: {
      fontSize: 15,
      fontWeight: '500',
      letterSpacing: 0,
      lineHeight: 1.5,
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: '500',
      letterSpacing: 0.1,
      lineHeight: 1.5,
    },
    
    // Labels
    labelLarge: {
      fontSize: 14,
      fontWeight: '800',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    labelBase: {
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    labelSmall: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    
    // Special
    timeDisplay: {
      fontSize: 32,
      fontWeight: '900',
      letterSpacing: -1,
      fontFamily: 'monospace',
    },
    badge: {
      fontSize: 14,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
    button: {
      fontSize: 15,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
  },

  // Semantic icons for different alert types
  icons: {
    alert: {
      roadworks: '🚧',
      accident: '🚗',
      event: '📅',
      congestion: '🚦',
      closure: '🚫',
      weather: '🌧️',
      emergency: '🚨',
      warning: '⚠️',
      default: '⚠️',
    },
    severity: {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🔵',
      info: '🟢',
    },
    status: {
      live: '🟢',
      updating: '🟡',
      offline: '🔴',
      connected: '✅',
      disconnected: '❌',
    },
    action: {
      refresh: '🔄',
      close: '❌',
      check: '✅',
      add: '➕',
      remove: '➖',
      edit: '✏️',
      save: '💾',
      delete: '🗑️',
      search: '🔍',
      filter: '🔽',
      sort: '↕️',
      expand: '▶',
      collapse: '▼',
    },
    location: {
      pin: '📍',
      map: '🗺️',
      navigation: '🧭',
      route: '🛣️',
    },
    supervisor: {
      user: '👤',
      admin: '👮',
      activity: '📊',
      note: '📝',
      flag: '🏁',
      shield: '🛡️',
    },
  },
};

// Helper function to get alert type icon
export const getAlertIcon = (type) => {
  if (!type) return typography.icons.alert.default;
  
  const typeStr = type.toLowerCase();
  for (const [key, icon] of Object.entries(typography.icons.alert)) {
    if (typeStr.includes(key) || typeStr.includes(key.slice(0, -1))) {
      return icon;
    }
  }
  return typography.icons.alert.default;
};

// Helper function to get severity icon
export const getSeverityIcon = (severity) => {
  if (!severity) return '';
  return typography.icons.severity[severity.toLowerCase()] || '';
};

export default typography;
