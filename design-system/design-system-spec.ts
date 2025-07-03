// Communications Platform Design System
// Based on Go BARRY Operations & Admin Dashboard Patterns
// Version: 1.0
// Date: July 2, 2025

export const DesignSystem = {
  // Color Palette - Based on existing component colors
  colors: {
    // Primary colors for each communication component
    primary: {
      ticketer: '#3B82F6',      // Blue - matches dashboard
      email: '#10B981',         // Green - matches AI Disruption
      voip: '#8B5CF6',          // Purple - matches messaging
      sharepoint: '#059669',    // Teal - matches operations
      messageDistribution: '#F59E0B', // Orange - matches reports
      automatedReports: '#DC2626'     // Red - matches supervisor control
    },
    
    // Neutral colors from existing UI
    neutral: {
      white: '#FFFFFF',
      background: '#F8FAFC',    // Light gray background
      surface: '#FFFFFF',       // Card backgrounds
      border: '#E5E7EB',        // Light borders
      divider: '#F3F4F6',       // Subtle dividers
      
      text: {
        primary: '#1F2937',     // Main text
        secondary: '#6B7280',   // Secondary text
        tertiary: '#9CA3AF',    // Disabled/hint text
        inverse: '#FFFFFF'      // Text on colored backgrounds
      }
    },
    
    // Status colors
    status: {
      success: '#10B981',       // Green
      warning: '#F59E0B',       // Orange
      error: '#EF4444',         // Red
      info: '#3B82F6',          // Blue
      
      // Severity levels (from Admin dashboard)
      critical: '#DC2626',
      high: '#EF4444',
      medium: '#F59E0B',
      low: '#3B82F6'
    },
    
    // Interactive states
    interactive: {
      hover: 'rgba(0, 0, 0, 0.05)',
      pressed: 'rgba(0, 0, 0, 0.1)',
      disabled: '#F3F4F6',
      focus: '#3B82F6'
    }
  },
  
  // Typography - Following existing patterns
  typography: {
    fontFamily: {
      primary: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: 'Consolas, Monaco, "Courier New", monospace'
    },
    
    sizes: {
      // Headers
      h1: { fontSize: 24, fontWeight: 'bold', lineHeight: 32 },      // Main titles
      h2: { fontSize: 18, fontWeight: '600', lineHeight: 24 },       // Section titles
      h3: { fontSize: 16, fontWeight: '600', lineHeight: 20 },       // Card titles
      
      // Body text
      body: { fontSize: 14, fontWeight: 'normal', lineHeight: 20 },  // Standard text
      bodySmall: { fontSize: 12, fontWeight: 'normal', lineHeight: 16 }, // Small text
      
      // Special
      label: { fontSize: 12, fontWeight: '600', lineHeight: 16 },    // Form labels
      button: { fontSize: 14, fontWeight: '600', lineHeight: 20 },   // Button text
      caption: { fontSize: 10, fontWeight: 'normal', lineHeight: 14 } // Tiny text
    }
  },
  
  // Spacing - Consistent with existing components
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    
    // Component-specific
    cardPadding: 16,
    sectionPadding: 20,
    screenPadding: 20
  },
  
  // Layout patterns
  layout: {
    // Card styles (from Admin dashboard)
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      padding: 16,
      marginBottom: 16,
      
      // Shadow for web
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3
    },
    
    // Section container
    section: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: '#FFFFFF',
      marginTop: 1
    },
    
    // Header pattern
    header: {
      padding: 20,
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB'
    },
    
    // Grid layouts
    grid: {
      twoColumn: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -5
      },
      threeColumn: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -5
      }
    }
  },
  
  // Component patterns
  components: {
    // Button styles
    button: {
      primary: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
      },
      secondary: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
      },
      danger: {
        backgroundColor: '#EF4444',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
      }
    },
    
    // Input fields
    input: {
      container: {
        marginBottom: 16
      },
      field: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14
      },
      label: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 4
      }
    },
    
    // Status indicators
    statusIndicator: {
      dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8
      },
      badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        backgroundColor: '#F3F4F6'
      }
    },
    
    // Navigation items (from browser-main)
    navItem: {
      container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 4
      },
      active: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)'
      },
      icon: {
        marginRight: 12
      },
      text: {
        fontSize: 14,
        fontWeight: '500'
      }
    }
  },
  
  // Animation patterns
  animations: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500
    },
    easing: {
      default: 'ease-in-out',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    }
  },
  
  // Responsive breakpoints
  breakpoints: {
    mobile: 0,      // 0-767px
    tablet: 768,    // 768-1023px
    desktop: 1024,  // 1024px+
    wide: 1440      // 1440px+
  },
  
  // Z-index hierarchy
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    modal: 30,
    popover: 40,
    tooltip: 50,
    notification: 60
  }
};

// Style mixins for common patterns
export const StyleMixins = {
  // Card with header pattern
  cardWithHeader: {
    container: {
      ...DesignSystem.layout.card,
      padding: 0
    },
    header: {
      padding: DesignSystem.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: DesignSystem.colors.neutral.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    content: {
      padding: DesignSystem.spacing.lg
    }
  },
  
  // Metric display pattern (from Admin dashboard)
  metricCard: {
    container: {
      backgroundColor: DesignSystem.colors.neutral.background,
      padding: DesignSystem.spacing.xl,
      borderRadius: 10,
      flex: 1,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: DesignSystem.colors.neutral.border,
      margin: 5
    },
    value: {
      fontSize: 28,
      fontWeight: 'bold',
      color: DesignSystem.colors.neutral.text.primary,
      marginBottom: 4
    },
    label: {
      fontSize: 12,
      color: DesignSystem.colors.neutral.text.secondary,
      textAlign: 'center'
    }
  },
  
  // List item pattern
  listItem: {
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: DesignSystem.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: DesignSystem.colors.neutral.divider
    },
    content: {
      flex: 1
    },
    action: {
      marginLeft: DesignSystem.spacing.md
    }
  }
};

// Component-specific color assignments
export const ComponentThemes = {
  ticketer: {
    primary: DesignSystem.colors.primary.ticketer,
    headerBackground: DesignSystem.colors.primary.ticketer,
    headerText: DesignSystem.colors.neutral.text.inverse,
    iconColor: DesignSystem.colors.primary.ticketer
  },
  email: {
    primary: DesignSystem.colors.primary.email,
    headerBackground: DesignSystem.colors.neutral.white,
    headerText: DesignSystem.colors.neutral.text.primary,
    iconColor: DesignSystem.colors.primary.email
  },
  voip: {
    primary: DesignSystem.colors.primary.voip,
    headerBackground: DesignSystem.colors.neutral.white,
    headerText: DesignSystem.colors.neutral.text.primary,
    iconColor: DesignSystem.colors.primary.voip
  },
  sharepoint: {
    primary: DesignSystem.colors.primary.sharepoint,
    headerBackground: DesignSystem.colors.neutral.white,
    headerText: DesignSystem.colors.neutral.text.primary,
    iconColor: DesignSystem.colors.primary.sharepoint
  },
  messageDistribution: {
    primary: DesignSystem.colors.primary.messageDistribution,
    headerBackground: DesignSystem.colors.neutral.white,
    headerText: DesignSystem.colors.neutral.text.primary,
    iconColor: DesignSystem.colors.primary.messageDistribution
  },
  automatedReports: {
    primary: DesignSystem.colors.primary.automatedReports,
    headerBackground: DesignSystem.colors.neutral.white,
    headerText: DesignSystem.colors.neutral.text.primary,
    iconColor: DesignSystem.colors.primary.automatedReports
  }
};