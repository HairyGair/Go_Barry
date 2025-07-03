// Communications Platform Design System - React Native
// Based on Go BARRY Admin Dashboard & Operations Screen patterns
// Version: 1.0
// Date: July 2, 2025

import { StyleSheet, Platform } from 'react-native';

// === COLOR PALETTE (matching admin/ops screens) ===
export const Colors = {
  // Backgrounds
  background: {
    primary: '#FFFFFF',      // Main background
    secondary: '#F8FAFC',    // Section backgrounds
    tertiary: '#F9FAFB',     // Card backgrounds
  },
  
  // Brand Colors (component specific)
  brand: {
    primary: '#3B82F6',      // Primary blue
    ticketer: '#3B82F6',     // Blue - Driver messaging
    email: '#10B981',        // Green - Email
    voip: '#7C3AED',         // Purple - VoIP
    sharepoint: '#059669',   // Teal - SharePoint
    reports: '#F59E0B',      // Orange - Reports
    messages: '#8B5CF6',     // Purple - Messages
  },
  
  // Status Colors
  status: {
    success: '#10B981',      // Green
    warning: '#F59E0B',      // Orange
    error: '#EF4444',        // Red
    info: '#6B7280',         // Gray
  },
  
  // Text Colors
  text: {
    primary: '#1F2937',      // Main text
    secondary: '#374151',    // Secondary text
    muted: '#6B7280',        // Muted/subtitle
    light: '#9CA3AF',        // Light text
    white: '#FFFFFF',        // White text
  },
  
  // UI Elements
  border: {
    light: '#E5E7EB',        // Light border
    medium: '#D1D5DB',       // Medium border
  },
  
  // Emergency
  emergency: '#DC2626',      // Deep red for emergency
};

// === TYPOGRAPHY ===
export const Typography = {
  fontFamily: {
    primary: Platform.select({
      ios: 'System',
      android: 'Roboto',
      web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }),
    mono: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      web: '"SF Mono", Monaco, Inconsolata, monospace',
    }),
  },
  
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// === SPACING ===
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
};

// === LAYOUT ===
export const Layout = {
  container: {
    maxWidth: 1440,
    padding: Spacing.xl,
  },
  
  header: {
    height: 80,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
  },
  
  sidebar: {
    width: 320,
  },
  
  grid: {
    gap: Spacing.md,
  },
};

// === BORDER RADIUS ===
export const BorderRadius = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  full: 9999,
};

// === SHADOWS ===
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
};

// === COMMON STYLES (like Admin Dashboard) ===
export const CommonStyles = StyleSheet.create({
  // Container Styles
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  
  // Header Styles
  header: {
    backgroundColor: Colors.background.primary,
    padding: Spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 40 : Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.muted,
  },
  
  // Section Styles
  section: {
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    marginTop: 1,
  },
  
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  
  // Card Styles
  card: {
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadows.sm,
  },
  
  cardTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  
  // Grid Styles
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.sm,
  },
  
  gridItem: {
    padding: Spacing.sm,
  },
  
  // Button Styles
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  
  buttonPrimary: {
    backgroundColor: Colors.brand.primary,
  },
  
  buttonSecondary: {
    backgroundColor: Colors.background.tertiary,
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
  
  buttonDanger: {
    backgroundColor: Colors.status.error,
  },
  
  buttonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.white,
  },
  
  buttonTextSecondary: {
    color: Colors.text.primary,
  },
  
  // Input Styles
  input: {
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.border.medium,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
  },
  
  inputFocused: {
    borderColor: Colors.brand.primary,
  },
  
  // Status Styles
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  statusText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  
  // Metric Card Styles (like Admin Dashboard)
  metricCard: {
    backgroundColor: Colors.background.tertiary,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
    minWidth: 140,
  },
  
  metricValue: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.brand.primary,
    marginBottom: Spacing.xs,
  },
  
  metricLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.muted,
    textAlign: 'center',
  },
  
  // Alert Styles
  alert: {
    padding: Spacing.md,
    paddingLeft: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    marginBottom: Spacing.md,
  },
  
  alertSuccess: {
    backgroundColor: '#f0fdf4',
    borderLeftColor: Colors.status.success,
  },
  
  alertWarning: {
    backgroundColor: '#fffbeb',
    borderLeftColor: Colors.status.warning,
  },
  
  alertError: {
    backgroundColor: '#fef2f2',
    borderLeftColor: Colors.status.error,
  },
  
  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['3xl'],
  },
  
  loadingText: {
    marginTop: Spacing.lg,
    fontSize: Typography.fontSize.base,
    color: Colors.text.muted,
  },
  
  // Empty States
  emptyContainer: {
    padding: Spacing['3xl'],
    alignItems: 'center',
  },
  
  emptyIcon: {
    marginBottom: Spacing.lg,
  },
  
  emptyText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.muted,
    textAlign: 'center',
  },
});

// === RESPONSIVE BREAKPOINTS ===
export const Breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
};

// === COMPONENT-SPECIFIC STYLES ===
export const ComponentStyles = {
  // Communications Hub specific styles
  communicationCard: {
    ...CommonStyles.card,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  
  componentIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  
  componentTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  
  componentDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.muted,
    lineHeight: Typography.lineHeight.relaxed,
  },
  
  // Quick action buttons
  quickAction: {
    backgroundColor: Colors.background.tertiary,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    minWidth: 100,
  },
  
  quickActionIcon: {
    marginBottom: Spacing.sm,
  },
  
  quickActionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    textAlign: 'center',
  },
};

// === ANIMATION DURATIONS ===
export const Animations = {
  fast: 150,
  base: 200,
  slow: 300,
};

// === Z-INDEX SCALE ===
export const ZIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

export default {
  Colors,
  Typography,
  Spacing,
  Layout,
  BorderRadius,
  Shadows,
  CommonStyles,
  Breakpoints,
  ComponentStyles,
  Animations,
  ZIndex,
};