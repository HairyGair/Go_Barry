/*
 * Go Barry - Modern Roadworks Manager V2 Styles
 * Modern design system with consistent spacing, colors, and typography
 */

import { StyleSheet, Platform } from 'react-native';

// Design tokens
const colors = {
  // Primary Go Barry brand colors
  primary: '#3B82F6',
  primaryDark: '#2563EB', 
  primaryLight: '#60A5FA',
  primaryGradient: ['#3B82F6', '#2563EB'],
  
  // Status colors - Enhanced with better contrast
  success: '#059669',
  successLight: '#10B981',
  successBg: '#ECFDF5',
  warning: '#DC2626',
  warningLight: '#EF4444',
  warningBg: '#FEF2F2',
  error: '#DC2626',
  errorLight: '#EF4444',
  errorBg: '#FEF2F2',
  critical: '#991B1B',
  criticalBg: '#FEE2E2',
  
  // Neutral colors - Enhanced for better hierarchy
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceLight: '#F9FAFB',
  card: '#FFFFFF',
  cardHover: '#F8FAFC',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  
  // Text colors - Better contrast
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textDisabled: '#CBD5E1',
  textOnDark: '#FFFFFF',
  
  // Interactive colors
  interactive: '#3B82F6',
  interactiveHover: '#2563EB',
  interactivePressed: '#1D4ED8',
  
  // Semantic colors
  info: '#0284C7',
  infoLight: '#0EA5E9',
  infoBg: '#F0F9FF',
  
  // Gradient colors for cards
  gradients: {
    blue: ['#3B82F6', '#2563EB'],
    purple: ['#8B5CF6', '#7C3AED'],
    green: ['#10B981', '#059669'],
    orange: ['#F59E0B', '#D97706'],
    red: ['#EF4444', '#DC2626'],
  }
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  captionMedium: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  smallMedium: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
};

const shadows = {
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
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
};

const borderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  round: 50,
};

export const roadworksStyles = StyleSheet.create({
  // Animations (web only)
  '@keyframes pulse': {
    '0%': { opacity: 1 },
    '50%': { opacity: 0.5 },
    '100%': { opacity: 1 }
  },
  // Layout containers
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  scrollContainer: {
    flex: 1,
  },
  
  contentContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  
  section: {
    gap: spacing.sm,
  },
  
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  
  // Header styles - Enhanced with better visual design
  header: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    paddingTop: Platform.OS === 'web' ? spacing.lg : spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.sm,
  },
  
  headerGradient: {
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
      },
      default: {
        backgroundColor: colors.surface,
      },
    }),
  },
  
  headerTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    fontWeight: '700',
  },
  
  headerSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  
  // Stats dashboard - Enhanced with gradient accents
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  
  statCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    flex: 1,
    minWidth: 150,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  
  statCardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  
  statCardHover: {
    backgroundColor: colors.cardHover,
    transform: [{ translateY: -2 }],
    ...shadows.lg,
  },
  
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  
  statValue: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  
  statLabel: {
    ...typography.captionMedium,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  statTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  
  statTrendText: {
    ...typography.small,
    color: colors.textMuted,
  },
  
  statTrendPositive: {
    color: colors.success,
  },
  
  statTrendNegative: {
    color: colors.error,
  },
  
  // Navigation tabs - Enhanced design
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    marginBottom: spacing.lg,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  
  tab: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  
  tabActive: {
    backgroundColor: colors.primary,
    ...shadows.md,
  },
  
  tabText: {
    ...typography.captionMedium,
    color: colors.textMuted,
  },
  
  tabTextActive: {
    color: colors.textOnDark,
    fontWeight: '600',
  },
  
  tabBadge: {
    backgroundColor: colors.errorBg,
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error,
  },
  
  tabBadgeActive: {
    backgroundColor: colors.textOnDark,
    borderColor: colors.textOnDark,
  },
  
  tabBadgeText: {
    ...typography.small,
    color: colors.error,
    fontWeight: '700',
  },
  
  tabBadgeTextActive: {
    color: colors.primary,
  },
  
  // Filter panel - Enhanced styling
  filterContainer: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  
  filterTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  
  filterChip: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.sm,
  },
  
  filterChipText: {
    ...typography.captionMedium,
    color: colors.textSecondary,
  },
  
  filterChipTextActive: {
    color: colors.textOnDark,
    fontWeight: '600',
  },
  
  // Roadwork cards - Enhanced with better visual hierarchy
  roadworkCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    position: 'relative',
  },
  
  roadworkCardHover: {
    ...shadows.lg,
    borderColor: colors.primary,
    transform: [{ translateY: -2 }],
  },
  
  roadworkCardCritical: {
    borderLeftWidth: 4,
    borderLeftColor: colors.critical,
  },
  
  roadworkCardWarning: {
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  
  roadworkCardSuccess: {
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  
  roadworkCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  
  roadworkTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
    fontWeight: '600',
  },
  
  roadworkLocation: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  roadworkDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 24,
  },
  
  roadworkMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  
  // Status badges - Enhanced with better visual design
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.round,
    alignSelf: 'flex-start',
  },
  
  statusBadgeActive: {
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: colors.success,
  },
  
  statusBadgePlanned: {
    backgroundColor: colors.infoBg,
    borderWidth: 1,
    borderColor: colors.info,
  },
  
  statusBadgeCritical: {
    backgroundColor: colors.criticalBg,
    borderWidth: 1,
    borderColor: colors.critical,
  },
  
  statusBadgeCompleted: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  statusBadgeText: {
    ...typography.smallMedium,
    textTransform: 'capitalize',
    letterSpacing: 0.3,
  },
  
  statusBadgeTextActive: {
    color: colors.success,
  },
  
  statusBadgeTextPlanned: {
    color: colors.info,
  },
  
  statusBadgeTextCritical: {
    color: colors.critical,
  },
  
  statusBadgeTextCompleted: {
    color: colors.textMuted,
  },
  
  // Route chips - Enhanced design
  routeChip: {
    backgroundColor: colors.infoBg,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.info,
  },
  
  routeChipText: {
    ...typography.smallMedium,
    color: colors.info,
    fontWeight: '600',
  },
  
  // Action buttons - Enhanced with better interaction states
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    ...shadows.sm,
  },
  
  actionButtonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  
  actionButtonDanger: {
    backgroundColor: colors.error,
    borderWidth: 0,
  },
  
  actionButtonText: {
    ...typography.captionMedium,
    color: colors.textOnDark,
    fontWeight: '600',
  },
  
  actionButtonTextSecondary: {
    color: colors.textSecondary,
  },
  
  // Quick actions toolbar - Enhanced
  quickActionsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    flexWrap: 'wrap',
  },
  
  quickActionButton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.sm,
  },
  
  quickActionButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  
  quickActionText: {
    ...typography.captionMedium,
    color: colors.textMuted,
  },
  
  quickActionTextActive: {
    color: colors.textPrimary,
  },
  
  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  
  // Empty states - Enhanced design
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    margin: spacing.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  
  emptyIcon: {
    marginBottom: spacing.lg,
    opacity: 0.5,
  },
  
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  
  emptyDescription: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
    maxWidth: 400,
  },
  
  // Utility classes
  textCenter: {
    textAlign: 'center',
  },
  
  textBold: {
    fontWeight: '600',
  },
  
  textMuted: {
    color: colors.textMuted,
  },
  
  flex1: {
    flex: 1,
  },
  
  hidden: {
    display: 'none',
  },

  // Template styles
  templateCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  templateTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  templateScenario: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },

  templateStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  templateStatText: {
    ...typography.caption,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },

  templateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  templateUseCount: {
    ...typography.caption,
    color: colors.textMuted,
  },

  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },

  // Form styles
  routeSelector: {
    marginTop: spacing.xs,
  },

  routeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundSecondary,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  routeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  routeChipText: {
    ...typography.body,
    color: colors.textMuted,
    fontWeight: '600',
  },

  routeChipTextActive: {
    color: colors.textPrimary,
  },

  severitySelector: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },

  severityOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  severityOptionActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },

  severityOptionText: {
    ...typography.body,
    color: colors.textMuted,
  },

  severityOptionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },

  waypointInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  waypointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },

  waypointNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  waypointNumberText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },

  waypointText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },

  // Batch operations styles
  batchOperationsContainer: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },

  severityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    marginHorizontal: -spacing.xs,
  },

  batchSeverityCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.md,
    margin: spacing.xs,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  batchSeverityLabel: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: spacing.xs,
  },

  batchSeverityCount: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },

  batchSelectedIcon: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },

  batchActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  // Analytics styles
  timeRangeButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundSecondary,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  timeRangeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  timeRangeText: {
    ...typography.body,
    color: colors.textMuted,
    fontWeight: '600',
  },

  timeRangeTextActive: {
    color: colors.textPrimary,
  },

  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
    marginBottom: spacing.lg,
  },

  metricCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    margin: spacing.xs,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.sm,
  },

  metricIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },

  metricValue: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  metricLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },

  metricTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },

  metricTrendText: {
    ...typography.caption,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },

  chartSection: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },

  chartTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  chartSubtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },

  chartContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },

  chartContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },

  chartLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },

  pieChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  pieChart: {
    flexDirection: 'row',
    height: 100,
    width: '100%',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },

  pieSegmentText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
    padding: spacing.xs,
  },

  barChartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  barChartLabel: {
    ...typography.body,
    color: colors.textPrimary,
    width: 80,
  },

  barChartBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  barChartBar: {
    height: 24,
    borderRadius: borderRadius.sm,
  },

  barChartValue: {
    ...typography.caption,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },

  legendContainer: {
    flex: 1,
    paddingLeft: spacing.lg,
    justifyContent: 'center',
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },

  legendLabel: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },

  legendValue: {
    ...typography.body,
    color: colors.textMuted,
    fontWeight: '600',
  },

  performanceSection: {
    marginBottom: spacing.lg,
  },

  sectionSubtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },

  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },

  performanceCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    margin: spacing.xs,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },

  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  performanceLabel: {
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    fontWeight: '600',
  },

  performanceValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },

  performanceValue: {
    ...typography.h1,
    fontWeight: '700',
  },

  performanceUnit: {
    ...typography.h4,
    marginLeft: spacing.xs,
  },

  progressBarContainer: {
    marginBottom: spacing.sm,
  },

  progressBarBackground: {
    height: 8,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },

  progressBar: {
    height: '100%',
    borderRadius: 4,
  },

  performanceDescription: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },

  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  targetLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },

  targetValue: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },

  targetIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },

  summaryBox: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
  },

  summaryContent: {
    flex: 1,
    marginLeft: spacing.md,
  },

  summaryTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  summaryText: {
    ...typography.body,
    color: colors.textMuted,
  },

  insightsSection: {
    marginBottom: spacing.lg,
  },

  insightCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },

  insightContent: {
    flex: 1,
    marginLeft: spacing.md,
  },

  insightTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  insightValue: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.xs,
  },

  insightDescription: {
    ...typography.body,
    color: colors.textMuted,
  },

  hotspotText: {
    ...typography.body,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },

  peakTimeText: {
    ...typography.body,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },

  supervisorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
    marginTop: spacing.md,
  },

  supervisorCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.md,
    margin: spacing.xs,
    borderRadius: borderRadius.md,
  },

  supervisorName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },

  supervisorStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  supervisorStat: {
    alignItems: 'center',
  },

  supervisorStatValue: {
    ...typography.h4,
    color: colors.primary,
    fontWeight: '600',
  },

  supervisorStatLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },

  trendsContainer: {
    marginTop: spacing.md,
  },

  trendItem: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },

  trendRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  trendRankText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },

  trendContent: {
    flex: 1,
  },

  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },

  trendTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },

  trendStats: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },

  trendStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },

  trendStatText: {
    ...typography.caption,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },

  impactBar: {
    height: 4,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 2,
    overflow: 'hidden',
  },

  impactBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  impactBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },

  impactBadgeText: {
    ...typography.caption,
    fontWeight: '600',
  },

  moreTrends: {
    padding: spacing.md,
    alignItems: 'center',
  },

  moreTrendsText: {
    ...typography.body,
    color: colors.textMuted,
  },

  emptyTrends: {
    padding: spacing.lg,
    alignItems: 'center',
  },

  emptyTrendsText: {
    ...typography.body,
    color: colors.textMuted,
  },
});

// Export design tokens for use in other components
export { colors, spacing, typography, shadows, borderRadius };