/*
 * Go Barry - Incidents Manager V2 Stats Card Component
 * Modern statistics display cards for incidents dashboard
 */

import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, shadows } from '../styles/incidents.styles';

const StatsCard = ({ 
  title, 
  value, 
  icon, 
  color = colors.primary, 
  size = 'medium',
  trend = null,
  trendDirection = 'neutral',
  onPress = null,
  loading = false 
}) => {
  const cardSize = {
    small: {
      minWidth: 120,
      padding: spacing.md,
    },
    medium: {
      minWidth: 150,
      padding: spacing.lg,
    },
    large: {
      minWidth: 200,
      padding: spacing.xl,
    }
  };

  const valueSize = {
    small: 20,
    medium: 28,
    large: 36
  };

  const renderTrend = () => {
    if (!trend) return null;
    
    const trendColor = {
      up: colors.error,
      down: colors.success,
      neutral: colors.textMuted
    }[trendDirection];

    const trendIcon = {
      up: 'trending-up',
      down: 'trending-down', 
      neutral: 'remove'
    }[trendDirection];

    return (
      <View style={styles.trendContainer}>
        <Ionicons name={trendIcon} size={12} color={trendColor} />
        <Text style={[styles.trendText, { color: trendColor }]}>
          {trend}
        </Text>
      </View>
    );
  };

  const cardStyle = [
    styles.card,
    cardSize[size],
    shadows.md,
    onPress && styles.pressable
  ];

  const content = (
    <>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon} size={size === 'large' ? 24 : 20} color={color} />
        </View>
        {renderTrend()}
      </View>
      
      <View style={styles.content}>
        <Text style={[styles.value, { 
          fontSize: valueSize[size],
          color: loading ? colors.textMuted : color 
        }]}>
          {loading ? '...' : String(value || 0)}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable style={cardStyle} onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return (
    <View style={cardStyle}>
      {content}
    </View>
  );
};

// Predefined stat card configurations
const StatCardPresets = {
  total: (value, onPress) => ({
    title: 'Total Incidents',
    value,
    icon: 'alert-circle',
    color: colors.primary,
    onPress
  }),

  active: (value, onPress) => ({
    title: 'Active Now',
    value,
    icon: 'time',
    color: colors.error,
    onPress
  }),


  high: (value, onPress) => ({
    title: 'High Priority',
    value,
    icon: 'alert',
    color: colors.priorityHigh,
    onPress
  }),

  medium: (value, onPress) => ({
    title: 'Medium Priority',
    value,
    icon: 'information-circle',
    color: colors.priorityMedium,
    onPress
  }),

  routesAffected: (value, onPress) => ({
    title: 'Routes Affected',
    value,
    icon: 'bus',
    color: colors.warning,
    onPress
  }),

  averageResolution: (value, onPress) => ({
    title: 'Avg Resolution',
    value: value ? `${Math.round(value)}min` : '0min',
    icon: 'stopwatch',
    color: colors.success,
    onPress
  }),

  traffic: (value, onPress) => ({
    title: 'Traffic Incidents',
    value,
    icon: 'car',
    color: colors.link,
    onPress
  }),

  manual: (value, onPress) => ({
    title: 'Manual Incidents',
    value,
    icon: 'person',
    color: colors.textSecondary,
    onPress
  }),

  resolved: (value, onPress) => ({
    title: 'Resolved Today',
    value,
    icon: 'checkmark-circle',
    color: colors.success,
    onPress
  })
};

const styles = {
  card: {
    backgroundColor: colors.surface,
    borderRadius: spacing.cardRadius,
    borderWidth: 1,
    borderColor: colors.border,
    margin: spacing.xs,
    flex: Platform.OS === 'web' ? 1 : 0,
    maxWidth: Platform.OS === 'web' ? '31%' : '48%',
  },
  
  pressable: {
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }
    })
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },

  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {
    flex: 1,
  },

  value: {
    ...typography.h2,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },

  title: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  trendText: {
    ...typography.caption,
    fontWeight: '500',
    marginLeft: spacing.xs,
  },
};

export default StatsCard;
export { StatCardPresets };