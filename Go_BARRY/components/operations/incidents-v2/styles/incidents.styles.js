/*
 * Go Barry - Modern Incidents Manager V2 Styles
 * Modern design system adapted from Roadworks Manager V2
 */

import { StyleSheet, Platform } from 'react-native';

// Add global styles for web animations and map support
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.1); }
      100% { opacity: 1; transform: scale(1); }
    }
    
    .pulsing-dot {
      animation: pulse 2s ease-in-out infinite;
    }
    
    .incident-marker {
      animation: pulse 2s ease-in-out infinite;
    }
  `;
  document.head.appendChild(style);
  
  // Add Mapbox CSS
  if (!document.querySelector('link[href*="mapbox-gl.css"]')) {
    const mapboxCSS = document.createElement('link');
    mapboxCSS.rel = 'stylesheet';
    mapboxCSS.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
    document.head.appendChild(mapboxCSS);
  }
  
  // Add Mapbox JS
  if (!window.mapboxgl && !document.querySelector('script[src*="mapbox-gl.js"]')) {
    const mapboxJS = document.createElement('script');
    mapboxJS.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
    document.head.appendChild(mapboxJS);
  }
}

// Design tokens
const colors = {
  // Primary Go Barry brand colors
  primary: '#DC2626', // Red theme for incidents
  primaryDark: '#B91C1C', 
  primaryLight: '#EF4444',
  primaryGradient: ['#DC2626', '#B91C1C'],
  
  // Status colors - Enhanced with better contrast
  success: '#059669',
  successLight: '#10B981',
  successBg: '#ECFDF5',
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  warningBg: '#FFFBEB',
  error: '#DC2626',
  errorLight: '#EF4444',
  errorBg: '#FEF2F2',
  
  // Priority colors
  priorityHigh: '#DC2626', 
  priorityMedium: '#F59E0B',
  priorityLow: '#059669',
  
  // Neutral colors - Enhanced for better hierarchy
  background: '#F8FAFC',
  backgroundDark: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceHover: '#F8FAFC',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderDark: '#CBD5E1',
  
  // Text colors - Improved readability
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textLight: '#CBD5E1',
  textInverse: '#FFFFFF',
  
  // Interactive colors
  link: '#3B82F6',
  linkHover: '#2563EB',
  focus: '#3B82F6',
  ai: '#9C27B0', // Purple for AI features
  
  // Incident type colors
  rtc: '#DC2626',        // Red
  roadworks: '#F59E0B',  // Amber
  weather: '#3B82F6',    // Blue
  breakdown: '#7C3AED',  // Purple
  event: '#059669',      // Green
  other: '#6B7280',      // Gray
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  
  // Card spacing
  cardPadding: 16,
  cardMargin: 12,
  cardRadius: 12,
  
  // Section spacing
  sectionPadding: 20,
  sectionMargin: 16,
};

const typography = {
  // Headings
  h1: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    color: colors.textPrimary,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
    color: colors.textPrimary,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    color: colors.textPrimary,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    color: colors.textPrimary,
  },
  
  // Body text
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: colors.textPrimary,
  },
  bodyMuted: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: colors.textSecondary,
  },
  small: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: colors.textSecondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    color: colors.textMuted,
  },
};

// Main stylesheet
const incidentsStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Loading and error states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  
  // Header styles
  header: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'web' ? spacing.xl : spacing.md,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 2,
    borderBottomColor: colors.primaryDark,
  },
  
  // Tab navigation
  tabContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  tabScrollView: {
    flexGrow: 0,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginRight: spacing.sm,
    borderRadius: spacing.sm,
    minHeight: 44,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabInactive: {
    backgroundColor: 'transparent',
  },
  tabText: {
    ...typography.small,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  tabTextActive: {
    color: colors.textInverse,
  },
  tabTextInactive: {
    color: colors.textSecondary,
  },
  tabBadge: {
    backgroundColor: colors.error,
    borderRadius: 10,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    marginLeft: spacing.xs,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: '600',
  },
  
  // View mode toggles
  viewModeContainer: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  viewModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewModeButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  viewModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  viewModeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  viewModeButtonText: {
    ...typography.small,
    marginLeft: spacing.xs,
  },
  
  // Stats container
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.lg,
    gap: spacing.md,
  },
  
  // Section styles
  section: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    borderRadius: spacing.cardRadius,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sectionTitle: {
    ...typography.h4,
  },
  sectionSubtitle: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: 2,
  },
  
  // Empty states
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  emptyIcon: {
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h3,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    ...typography.bodyMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  
  // Utility classes
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Text utilities
  textPrimary: {
    color: colors.textPrimary,
  },
  textSecondary: {
    color: colors.textSecondary,
  },
  textMuted: {
    color: colors.textMuted,
  },
  textSuccess: {
    color: colors.success,
  },
  textWarning: {
    color: colors.warning,
  },
  textError: {
    color: colors.error,
  },
  
  // Status badges
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.sm,
    backgroundColor: colors.backgroundDark,
    gap: spacing.xs,
  },
  statusBadgeText: {
    ...typography.caption,
    fontWeight: '600',
  },
  
  // Priority indicators
  priorityIndicator: {
    width: 4,
    height: '100%',
    borderTopLeftRadius: spacing.cardRadius,
    borderBottomLeftRadius: spacing.cardRadius,
  },
  priorityHigh: {
    backgroundColor: colors.priorityHigh,
  },
  priorityMedium: {
    backgroundColor: colors.priorityMedium,
  },
  priorityLow: {
    backgroundColor: colors.priorityLow,
  },
  
  // Action Bar styles
  actionBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.borderRadius,
    gap: spacing.xs,
  },
  
  primaryButton: {
    backgroundColor: colors.primary,
    marginRight: spacing.sm,
  },
  
  primaryButtonText: {
    ...typography.button,
    color: colors.textInverse,
    fontWeight: '600',
  },
  
  secondaryButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  secondaryButtonText: {
    ...typography.button,
    color: colors.primary,
    fontWeight: '600',
  },
});

// Shadows for different platforms
const shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: {
      elevation: 2,
    },
    web: {
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    },
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 4,
    },
    web: {
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    },
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    android: {
      elevation: 8,
    },
    web: {
      boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
    },
  }),
};

// Add new styles to the incidentsStyles object
Object.assign(incidentsStyles, {
  incidentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  selectionCheckbox: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    paddingVertical: spacing.lg,
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: spacing.borderRadius,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'web' ? spacing.sm : spacing.md,
    ...Platform.select({
      web: {
        minHeight: 40,
      }
    }),
  },
  
  liveUpdateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginLeft: spacing.sm,
    ...Platform.select({
      web: {
        className: 'pulsing-dot',
      }
    }),
  },
});

export { incidentsStyles, colors, spacing, typography, shadows };