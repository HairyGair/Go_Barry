// React Native Style Utilities
// Provides cross-platform styling abstractions

import { Platform, StyleSheet } from 'react-native'
import { isWeb, getScreenDimensions } from './PlatformUtils.js'

// Color palette optimized for both web and mobile
export const colors = {
  // Primary brand colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe', 
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Main blue
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a'
  },
  
  // Semantic colors
  success: '#10b981',
  warning: '#f59e0b', 
  error: '#ef4444',
  info: '#06b6d4',
  
  // Neutral colors
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb', 
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  },
  
  // Go North East brand colors
  gne: {
    navy: '#1a2b5a',
    blue: '#003d82',
    red: '#dc2626',
    orange: '#f97316',
    green: '#16a34a'
  }
}

// Typography system compatible with React Native
export const typography = {
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60
  },
  
  fontWeight: {
    light: Platform.select({
      ios: '300',
      android: '300',
      web: '300'
    }),
    normal: Platform.select({
      ios: '400',
      android: '400', 
      web: '400'
    }),
    medium: Platform.select({
      ios: '500',
      android: '500',
      web: '500'
    }),
    semibold: Platform.select({
      ios: '600',
      android: '600',
      web: '600'
    }),
    bold: Platform.select({
      ios: '700',
      android: '700',
      web: '700'
    })
  },
  
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75
  },
  
  letterSpacing: {
    tight: -0.025,
    normal: 0,
    wide: 0.025
  }
}

// Spacing system (consistent with Tailwind)
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
  32: 128,
  40: 160,
  48: 192,
  56: 224,
  64: 256
}

// Border radius
export const borderRadius = {
  none: 0,
  sm: 2,
  base: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 9999
}

// Shadow system for React Native
export const shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2
    },
    android: {
      elevation: 1
    },
    web: {
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
    }
  }),
  
  base: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3
    },
    android: {
      elevation: 3
    },
    web: {
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
    }
  }),
  
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6
    },
    android: {
      elevation: 6
    },
    web: {
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    }
  }),
  
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 15
    },
    android: {
      elevation: 10
    },
    web: {
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    }
  }),
  
  xl: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.15,
      shadowRadius: 25
    },
    android: {
      elevation: 15
    },
    web: {
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    }
  })
}

// Responsive breakpoints
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
}

// Screen size utilities
export const screenSize = {
  isSmall: () => {
    const { width } = getScreenDimensions()
    return width < breakpoints.sm
  },
  
  isMedium: () => {
    const { width } = getScreenDimensions()
    return width >= breakpoints.sm && width < breakpoints.lg
  },
  
  isLarge: () => {
    const { width } = getScreenDimensions()
    return width >= breakpoints.lg
  },
  
  isPortrait: () => {
    const { width, height } = getScreenDimensions()
    return height > width
  },
  
  isLandscape: () => {
    const { width, height } = getScreenDimensions()
    return width > height
  }
}

// Common style patterns
export const commonStyles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: colors.gray[50]
  },
  
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  
  row: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  
  column: {
    flexDirection: 'column'
  },
  
  // Typography
  heading1: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    lineHeight: typography.lineHeight.tight
  },
  
  heading2: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    lineHeight: typography.lineHeight.tight
  },
  
  heading3: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    lineHeight: typography.lineHeight.normal
  },
  
  bodyText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
    color: colors.gray[700],
    lineHeight: typography.lineHeight.normal
  },
  
  caption: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    color: colors.gray[500],
    lineHeight: typography.lineHeight.normal
  },
  
  // Buttons
  buttonPrimary: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    ...shadows.base
  },
  
  buttonSecondary: {
    backgroundColor: colors.gray[200],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    ...shadows.base
  },
  
  buttonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center'
  },
  
  buttonTextPrimary: {
    color: colors.gray[50]
  },
  
  buttonTextSecondary: {
    color: colors.gray[700]
  },
  
  // Cards
  card: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    margin: spacing[4],
    ...shadows.md
  },
  
  // Form elements
  input: {
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: typography.fontSize.base,
    color: colors.gray[900]
  },
  
  inputFocused: {
    borderColor: colors.primary[500],
    ...shadows.base
  },
  
  // Status indicators
  statusSuccess: {
    backgroundColor: colors.success,
    borderRadius: borderRadius.full,
    padding: spacing[2]
  },
  
  statusWarning: {
    backgroundColor: colors.warning,
    borderRadius: borderRadius.full,
    padding: spacing[2]
  },
  
  statusError: {
    backgroundColor: colors.error,
    borderRadius: borderRadius.full,
    padding: spacing[2]
  },
  
  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[50]
  },
  
  loadingText: {
    marginTop: spacing[4],
    fontSize: typography.fontSize.base,
    color: colors.gray[600]
  }
})

// Utility functions for responsive styles
export const responsive = {
  // Get value based on screen size
  getValue: (values) => {
    const { width } = getScreenDimensions()
    
    if (width >= breakpoints['2xl'] && values['2xl'] !== undefined) return values['2xl']
    if (width >= breakpoints.xl && values.xl !== undefined) return values.xl
    if (width >= breakpoints.lg && values.lg !== undefined) return values.lg
    if (width >= breakpoints.md && values.md !== undefined) return values.md
    if (width >= breakpoints.sm && values.sm !== undefined) return values.sm
    
    return values.base || values.default || Object.values(values)[0]
  },
  
  // Create responsive padding
  padding: (values) => {
    const value = responsive.getValue(values)
    return {
      padding: spacing[value] || value
    }
  },
  
  // Create responsive margin
  margin: (values) => {
    const value = responsive.getValue(values)
    return {
      margin: spacing[value] || value
    }
  },
  
  // Create responsive font size
  fontSize: (values) => {
    const value = responsive.getValue(values)
    return {
      fontSize: typography.fontSize[value] || value
    }
  }
}

// Theme context for runtime theme switching
export const createTheme = (customColors = {}, customTypography = {}) => {
  return {
    colors: { ...colors, ...customColors },
    typography: { ...typography, ...customTypography },
    spacing,
    borderRadius,
    shadows,
    breakpoints
  }
}

// Default theme
export const defaultTheme = createTheme()

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  breakpoints,
  screenSize,
  commonStyles,
  responsive,
  createTheme,
  defaultTheme
}