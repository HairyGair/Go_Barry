/*
 * Go Barry - Modern Stats Card Component
 * Enhanced statistics display with trends and interactive hover states
 */

import React, { useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { roadworksStyles, colors } from '../styles/roadworks.styles';

const StatsCard = ({
  title,
  value,
  icon,
  trend,
  trendDirection, // 'up', 'down', 'neutral'
  color = colors.primary,
  onPress,
  loading = false,
  subtitle,
  badge,
  size = 'medium' // 'small', 'medium', 'large'
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getTrendColor = () => {
    switch (trendDirection) {
      case 'up':
        return colors.success;
      case 'down':
        return colors.error;
      default:
        return colors.textMuted;
    }
  };

  const getTrendIcon = () => {
    switch (trendDirection) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      default:
        return 'remove';
    }
  };

  const getCardSize = () => {
    switch (size) {
      case 'small':
        return { minWidth: 120, flex: 0 };
      case 'large':
        return { minWidth: 200, flex: 2 };
      default:
        return { minWidth: 150, flex: 1 };
    }
  };

  const formatValue = (val) => {
    if (loading) return '...';
    if (typeof val === 'number') {
      return val.toLocaleString();
    }
    return val || '0';
  };

  const cardContent = (
    <View style={[
      roadworksStyles.statCard,
      getCardSize(),
      isHovered && roadworksStyles.statCardHover,
      Platform.OS === 'web' && { 
        cursor: onPress ? 'pointer' : 'default',
        transition: 'all 0.2s ease'
      }
    ]}>
      {/* Header with icon and badge */}
      <View style={roadworksStyles.statCardHeader}>
        <View style={roadworksStyles.row}>
          {icon && (
            <View style={{
              backgroundColor: color,
              borderRadius: 8,
              padding: 8,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Ionicons 
                name={icon} 
                size={20} 
                color={colors.textPrimary} 
              />
            </View>
          )}
          {badge && (
            <View style={[
              roadworksStyles.statusBadge,
              { backgroundColor: badge.color || colors.warning }
            ]}>
              <Text style={roadworksStyles.statusBadgeText}>
                {badge.text}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Main value */}
      <Text style={[
        roadworksStyles.statValue,
        size === 'small' && { fontSize: 24, lineHeight: 32 },
        size === 'large' && { fontSize: 40, lineHeight: 48 },
        loading && { opacity: 0.5 }
      ]}>
        {formatValue(value)}
      </Text>

      {/* Title */}
      <Text style={roadworksStyles.statLabel}>
        {title}
      </Text>

      {/* Subtitle */}
      {subtitle && (
        <Text style={[roadworksStyles.statTrendText, { marginTop: 4 }]}>
          {subtitle}
        </Text>
      )}

      {/* Trend indicator */}
      {trend && (
        <View style={roadworksStyles.statTrend}>
          <Ionicons 
            name={getTrendIcon()} 
            size={14} 
            color={getTrendColor()} 
          />
          <Text style={[
            roadworksStyles.statTrendText,
            { color: getTrendColor() }
          ]}>
            {trend}
          </Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onHoverIn={() => Platform.OS === 'web' && setIsHovered(true)}
        onHoverOut={() => Platform.OS === 'web' && setIsHovered(false)}
        onPressIn={() => Platform.OS !== 'web' && setIsHovered(true)}
        onPressOut={() => Platform.OS !== 'web' && setIsHovered(false)}
        accessibilityRole="button"
        accessibilityLabel={`${title}: ${formatValue(value)}`}
      >
        {cardContent}
      </Pressable>
    );
  }

  return cardContent;
};

// Preset configurations for common stat types
export const StatCardPresets = {
  total: (value, onPress) => ({
    title: 'Total Roadworks',
    value,
    icon: 'construct',
    color: colors.primary,
    onPress,
  }),
  
  critical: (value, onPress) => ({
    title: 'Critical',
    value,
    icon: 'warning',
    color: colors.critical,
    onPress,
    badge: value > 0 ? { text: 'URGENT', color: colors.critical } : null,
  }),
  
  active: (value, onPress) => ({
    title: 'Active Now',
    value,
    icon: 'time',
    color: colors.success,
    onPress,
  }),
  
  planned: (value, onPress) => ({
    title: 'Planned',
    value,
    icon: 'calendar',
    color: colors.warning,
    onPress,
  }),
  
  affected: (value, onPress) => ({
    title: 'Routes Affected',
    value,
    icon: 'bus',
    color: colors.info,
    onPress,
  }),
  
  streetManager: (value, onPress) => ({
    title: 'Street Manager',
    value,
    icon: 'business',
    color: colors.primary,
    onPress,
    subtitle: 'Official UK system',
  }),
  
  manual: (value, onPress) => ({
    title: 'Manual',
    value,
    icon: 'person-add',
    color: colors.interactive,
    onPress,
    subtitle: 'Supervisor created',
  }),
  
  diversions: (value, onPress) => ({
    title: 'Active Diversions',
    value,
    icon: 'swap-horizontal',
    color: colors.warning,
    onPress,
  }),
};

export default StatsCard;