/*
 * Go Barry - Traffic Intelligence Platform
 * ActivityCard Component - Display activity metrics
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { darkTheme } from '../styles/darkTheme';

const ActivityCard = ({ 
  value,
  label,
  icon,
  valueColor = darkTheme.success,
  trend, // 'up', 'down', or percentage
  style
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend === 'up') return 'trending-up';
    if (trend === 'down') return 'trending-down';
    if (typeof trend === 'number') {
      return trend > 0 ? 'trending-up' : 'trending-down';
    }
    return null;
  };

  const getTrendColor = () => {
    if (!trend) return darkTheme.textSecondary;
    if (trend === 'up' || (typeof trend === 'number' && trend > 0)) {
      return darkTheme.success;
    }
    return darkTheme.error;
  };

  return (
    <View style={[styles.card, style]}>
      {icon && (
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons 
            name={icon} 
            size={24} 
            color={darkTheme.textMuted} 
          />
        </View>
      )}
      
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      
      {trend && (
        <View style={styles.trendContainer}>
          <MaterialCommunityIcons 
            name={getTrendIcon()} 
            size={16} 
            color={getTrendColor()} 
          />
          {typeof trend === 'number' && (
            <Text style={[styles.trendText, { color: getTrendColor() }]}>
              {trend > 0 ? '+' : ''}{trend}%
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: darkTheme.surface,
    padding: 20,
    borderRadius: 12,
    flex: 1,
    minWidth: 140,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: darkTheme.border,
    margin: 5,
  },
  iconContainer: {
    marginBottom: 12,
    opacity: 0.6,
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  label: {
    color: darkTheme.textSecondary,
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default ActivityCard;
