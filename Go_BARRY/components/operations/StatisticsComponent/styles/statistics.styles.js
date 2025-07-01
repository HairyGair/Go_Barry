/*
 * Go Barry - Statistics Component Styles
 * Self-contained theme for deployment
 */

import { StyleSheet, Platform } from 'react-native';

// Self-contained operations theme
const operationsTheme = {
  colors: {
    background: '#FFFFFF',
    cardBg: '#FFFFFF',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280'
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    }
  }
};

// Extended theme for statistics - DEFINE FIRST
export const statisticsTheme = {
  ...operationsTheme,
  charts: {
    primary: '#3B82F6',
    secondary: '#10B981', 
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#06B6D4',
    grid: '#E5E7EB',
    text: '#374151'
  },
  metrics: {
    success: '#10B981',
    warning: '#F59E0B',
    critical: '#EF4444',
    neutral: '#6B7280',
    positive: '#059669',
    negative: '#DC2626'
  },
  breakpoints: {
    mobile: 768,
    tablet: 1024,
    desktop: 1280
  }
};

// Now create styles using the defined theme
export const statisticsStyles = StyleSheet.create({
  // Main Container
  container: {
    flex: 1,
    backgroundColor: operationsTheme.colors.background,
  },

  // Unauthorized Access
  unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: operationsTheme.colors.background,
    padding: operationsTheme.spacing.xl,
  },
  unauthorizedText: {
    fontSize: 18,
    color: operationsTheme.colors.textSecondary,
    textAlign: 'center',
  },

  // Error States
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: operationsTheme.colors.background,
    padding: operationsTheme.spacing.xl,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: statisticsTheme.metrics.critical,
    marginBottom: operationsTheme.spacing.sm,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: operationsTheme.colors.textSecondary,
    textAlign: 'center',
  },

  // Content Layout
  content: {
    flex: 1,
  },

  // Main Three-Column Layout
  mainContent: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: operationsTheme.spacing.lg,
    padding: operationsTheme.spacing.lg,
    ...Platform.select({
      web: {
        '@media (max-width: 768px)': {
          flexDirection: 'column',
        },
      },
    }),
  },

  leftColumn: {
    flex: 1,
    minWidth: Platform.OS === 'web' ? 300 : '100%',
  },

  centerColumn: {
    flex: 1,
    minWidth: Platform.OS === 'web' ? 300 : '100%',
  },

  rightColumn: {
    flex: 1,
    minWidth: Platform.OS === 'web' ? 300 : '100%',
    gap: operationsTheme.spacing.lg,
  },

  // Bottom Section
  bottomSection: {
    padding: operationsTheme.spacing.lg,
    paddingTop: 0,
  },

  // Card Styles
  card: {
    backgroundColor: operationsTheme.colors.cardBg,
    borderRadius: operationsTheme.borderRadius.md,
    padding: operationsTheme.spacing.lg,
    marginBottom: operationsTheme.spacing.md,
    ...operationsTheme.shadows.sm,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      },
    }),
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: operationsTheme.spacing.md,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: operationsTheme.colors.textPrimary,
  },

  cardSubtitle: {
    fontSize: 14,
    color: operationsTheme.colors.textSecondary,
    marginTop: 4,
  },

  // Metric Cards
  metricCard: {
    backgroundColor: operationsTheme.colors.cardBg,
    borderRadius: operationsTheme.borderRadius.md,
    padding: operationsTheme.spacing.lg,
    ...operationsTheme.shadows.sm,
    minHeight: 120,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        transition: 'transform 0.2s ease-in-out',
        ':hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
        },
      },
    }),
  },

  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: operationsTheme.spacing.sm,
  },

  metricIcon: {
    marginRight: operationsTheme.spacing.sm,
  },

  metricValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: operationsTheme.colors.textPrimary,
    marginBottom: 4,
  },

  metricLabel: {
    fontSize: 14,
    color: operationsTheme.colors.textSecondary,
    marginBottom: operationsTheme.spacing.sm,
  },

  metricTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  trendPositive: {
    color: statisticsTheme.metrics.positive,
  },

  trendNegative: {
    color: statisticsTheme.metrics.negative,
  },

  trendNeutral: {
    color: statisticsTheme.metrics.neutral,
  },

  trendText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },

  // Status Indicators
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: operationsTheme.spacing.sm,
  },

  statusOnline: {
    backgroundColor: statisticsTheme.metrics.success,
  },

  statusOffline: {
    backgroundColor: statisticsTheme.metrics.critical,
  },

  statusDegraded: {
    backgroundColor: statisticsTheme.metrics.warning,
  },

  // Data Source Cards
  dataSourceCard: {
    backgroundColor: operationsTheme.colors.cardBg,
    borderRadius: operationsTheme.borderRadius.sm,
    padding: operationsTheme.spacing.md,
    marginBottom: operationsTheme.spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: statisticsTheme.metrics.neutral,
  },

  dataSourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: operationsTheme.spacing.xs,
  },

  dataSourceName: {
    fontSize: 16,
    fontWeight: '600',
    color: operationsTheme.colors.textPrimary,
  },

  dataSourceStatus: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },

  dataSourceMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: operationsTheme.spacing.xs,
  },

  dataSourceMetric: {
    fontSize: 12,
    color: operationsTheme.colors.textSecondary,
  },

  // Route Impact Styles
  routeTable: {
    backgroundColor: operationsTheme.colors.cardBg,
    borderRadius: operationsTheme.borderRadius.sm,
    overflow: 'hidden',
  },

  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: operationsTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },

  routeNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: operationsTheme.colors.textPrimary,
    minWidth: 60,
  },

  routeIncidents: {
    flex: 1,
    fontSize: 14,
    color: operationsTheme.colors.textSecondary,
  },

  routeDelay: {
    fontSize: 14,
    fontWeight: '500',
    color: statisticsTheme.metrics.warning,
  },

  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: operationsTheme.spacing.sm,
  },

  severityHigh: {
    backgroundColor: '#FEE2E2',
  },

  severityMedium: {
    backgroundColor: '#FEF3C7',
  },

  severityLow: {
    backgroundColor: '#D1FAE5',
  },

  severityText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  // Supervisor Activity
  supervisorCard: {
    backgroundColor: operationsTheme.colors.cardBg,
    borderRadius: operationsTheme.borderRadius.sm,
    padding: operationsTheme.spacing.md,
    marginBottom: operationsTheme.spacing.sm,
  },

  supervisorName: {
    fontSize: 14,
    fontWeight: '600',
    color: operationsTheme.colors.textPrimary,
  },

  supervisorStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: operationsTheme.spacing.xs,
  },

  supervisorStat: {
    fontSize: 12,
    color: operationsTheme.colors.textSecondary,
  },

  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: operationsTheme.spacing.xl,
  },

  loadingText: {
    fontSize: 16,
    color: operationsTheme.colors.textSecondary,
    marginTop: operationsTheme.spacing.md,
    textAlign: 'center',
  },

  // Placeholder Cards (for Phase 2 components)
  placeholderCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: operationsTheme.borderRadius.md,
    padding: operationsTheme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    minHeight: 200,
  },

  placeholderText: {
    fontSize: 16,
    color: operationsTheme.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Responsive Utilities
  hideOnMobile: {
    ...Platform.select({
      web: {
        '@media (max-width: 768px)': {
          display: 'none',
        },
      },
      default: {
        display: 'none',
      },
    }),
  },

  showOnlyMobile: {
    ...Platform.select({
      web: {
        display: 'none',
        '@media (max-width: 768px)': {
          display: 'flex',
        },
      },
      default: {
        display: 'flex',
      },
    }),
  },
});