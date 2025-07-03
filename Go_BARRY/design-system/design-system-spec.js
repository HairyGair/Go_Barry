/*
 * Go Barry - Communications Design System
 * Created as part of communications restructure plan GOB-COMM-2025-001
 */

// Design System Specification for Communications Platform
export const DesignSystem = {
  colors: {
    // Primary Colors (Communications Design System)
    primary: '#2563eb',    // Blue - Email/Primary
    secondary: '#059669',  // Green - Success/Email
    tertiary: '#7c3aed',   // Purple - VoIP
    accent: '#dc2626',     // Red - Urgent/Emergency
    
    neutral: {
      background: '#0a0e16',
      surface: '#1f2937',
      card: '#111827',
      border: '#374151',
      divider: '#4b5563',
      
      text: {
        primary: '#ffffff',
        secondary: '#d1d5db',
        tertiary: '#9ca3af',
        inverse: '#ffffff'
      }
    },
    
    status: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#0ea5e9'
    }
  },
  
  typography: {
    fontFamily: {
      primary: '"Inter", system-ui, sans-serif',
      mono: '"Fira Code", monospace'
    },
    
    sizes: {
      h1: { fontSize: 32, fontWeight: '800', lineHeight: 40 },
      h2: { fontSize: 24, fontWeight: '700', lineHeight: 32 },
      h3: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
      h4: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
      body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
      bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
      caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
      button: { fontSize: 16, fontWeight: '500', lineHeight: 24 },
      label: { fontSize: 14, fontWeight: '500', lineHeight: 20 }
    }
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64
  },
  
  layout: {
    card: {
      borderRadius: 12,
      padding: 24,
      backgroundColor: '#111827',
      borderWidth: 1,
      borderColor: '#374151',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 8
    },
    
    borderRadius: {
      sm: 6,
      md: 8,
      lg: 12,
      xl: 16,
      round: 50
    }
  }
};

// Component Themes for Communications Platform
export const ComponentThemes = {
  email: {
    primary: DesignSystem.colors.primary,
    secondary: DesignSystem.colors.secondary,
    background: DesignSystem.colors.neutral.background,
    surface: DesignSystem.colors.neutral.surface,
    text: DesignSystem.colors.neutral.text.primary
  },
  
  voip: {
    primary: DesignSystem.colors.tertiary,
    secondary: DesignSystem.colors.neutral.surface,
    background: DesignSystem.colors.neutral.background,
    surface: DesignSystem.colors.neutral.surface,
    text: DesignSystem.colors.neutral.text.primary
  },
  
  sharepoint: {
    primary: DesignSystem.colors.primary,
    secondary: DesignSystem.colors.neutral.surface,
    background: DesignSystem.colors.neutral.background,
    surface: DesignSystem.colors.neutral.surface,
    text: DesignSystem.colors.neutral.text.primary
  }
};

export default { DesignSystem, ComponentThemes };