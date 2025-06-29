/*
 * Go Barry - Traffic Intelligence Platform
 * StatsCard Component - Display statistics with icon
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { darkTheme } from '../styles/darkTheme';

const StatsCard = ({ 
  value,
  label,
  icon,
  iconColor,
  valueColor,
  trend, // 'up', 'down', or null
  trendValue,
  style
}) => {
  const getTrendIcon = () => {
    if (trend === 'up') return 'trending-up';
    if (trend === 'down') return 'trending-down';
    return null;
  };

  const getTrendColor = () => {
    if (trend === 'up') return darkTheme.success;
    if (trend === 'down') return darkTheme.error;
    return darkTheme.textSecondary;
  };

  return (
    <View style={[styles.container, style]}>
      {icon && (
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons 
            name={icon} 
            size={24} 
            color={iconColor || darkTheme.textMuted} 
          />
        </View>
      )}
      
      <View style={styles.content}>
        <Text style={[styles.value, { color: valueColor || darkTheme.text }]}>
          {value}
        </Text>
        <Text style={styles.label}>{label}</Text>
        
        {trend && trendValue && (
          <View style={styles.trendContainer}>
            <MaterialCommunityIcons 
              name={getTrendIcon()} 
              size={16} 
              color={getTrendColor()} 
            />
            <Text style={[styles.trendValue, { color: getTrendColor() }]}>
              {trendValue}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: darkTheme.surface,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: darkTheme.border,
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: darkTheme.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  label: {
    color: darkTheme.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  trendValue: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default StatsCard;
