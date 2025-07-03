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
  
  // Status colors
  success: '#10B981',
  successLight: '#34D399',
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  error: '#EF4444',
  errorLight: '#F87171',
  critical: '#DC2626',
  
  // Neutral colors
  background: '#0a0e16',
  surface: '#1f2937',
  surfaceLight: '#374151',
  card: '#111827',
  cardHover: '#1f2937',
  border: '#374151',
  borderLight: '#4b5563',
  
  // Text colors
  textPrimary: '#ffffff',
  textSecondary: '#d1d5db',
  textMuted: '#9ca3af',
  textDisabled: '#6b7280',
  
  // Interactive colors
  interactive: '#3B82F6',
  interactiveHover: '#2563EB',
  interactivePressed: '#1d4ed8',
  
  // Semantic colors
  info: '#0ea5e9',
  infoLight: '#38bdf8',
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
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
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
  
  // Header styles
  header: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    paddingTop: Platform.OS === 'web' ? spacing.lg : spacing.md,
    ...shadows.md,
  },
  
  headerGradient: {
    background: Platform.OS === 'web' ? 
      'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' : colors.primary,
  },
  
  headerTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  
  headerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    opacity: 0.8,
  },
  
  // Stats dashboard
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  
  statCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flex: 1,
    minWidth: 150,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border,
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
  
  // Navigation tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  tabActive: {
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  
  tabText: {
    ...typography.captionMedium,
    color: colors.textMuted,
  },
  
  tabTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  
  tabBadge: {
    backgroundColor: colors.warning,
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    marginLeft: spacing.xs,
    minWidth: 20,
    alignItems: 'center',
  },
  
  tabBadgeText: {
    ...typography.small,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  
  // Filter panel
  filterContainer: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: colors.surface,
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  
  filterChipText: {
    ...typography.captionMedium,
    color: colors.textMuted,
  },
  
  filterChipTextActive: {
    color: colors.textPrimary,
  },
  
  // Roadwork cards
  roadworkCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  roadworkCardHover: {
    backgroundColor: colors.cardHover,
    borderColor: colors.primary,
    ...shadows.lg,
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
  },
  
  roadworkLocation: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  
  roadworkDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  
  roadworkMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  
  // Status badges
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  
  statusBadgeActive: {
    backgroundColor: colors.success,
  },
  
  statusBadgePlanned: {
    backgroundColor: colors.warning,
  },
  
  statusBadgeCritical: {
    backgroundColor: colors.critical,
  },
  
  statusBadgeCompleted: {
    backgroundColor: colors.textMuted,
  },
  
  statusBadgeText: {
    ...typography.smallMedium,
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Route chips
  routeChip: {
    backgroundColor: colors.info,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  },
  
  routeChipText: {
    ...typography.smallMedium,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  
  // Action buttons
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    ...shadows.sm,
  },
  
  actionButtonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  actionButtonDanger: {
    backgroundColor: colors.error,
  },
  
  actionButtonText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  
  actionButtonTextSecondary: {
    color: colors.textSecondary,
  },
  
  // Quick actions toolbar
  quickActionsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  
  quickActionButton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
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
  
  // Empty states
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  
  emptyIcon: {
    marginBottom: spacing.lg,
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
});

// Export design tokens for use in other components
export { colors, spacing, typography, shadows, borderRadius };