/*
 * Go Barry - Traffic Intelligence Platform
 * StatCard Component - Display statistics with icon
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { darkTheme } from '../styles/darkTheme';

const StatCard = ({ 
  icon,
  iconColor,
  title,
  value,
  subtitle,
  onPress,
  accentColor = darkTheme.accents.systemOverview,
  trend, // { value: number, label: string }
  style
}) => {
  const content = (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor || accentColor}20` }]}>
          <MaterialCommunityIcons 
            name={icon} 
            size={24} 
            color={iconColor || accentColor} 
          />
        </View>
        
        {trend && (
          <View style={styles.trendBadge}>
            <MaterialCommunityIcons 
              name={trend.value > 0 ? 'trending-up' : 'trending-down'} 
              size={14} 
              color={trend.value > 0 ? darkTheme.success : darkTheme.error} 
            />
            <Text style={[
              styles.trendText, 
              { color: trend.value > 0 ? darkTheme.success : darkTheme.error }
            ]}>
              {trend.value > 0 ? '+' : ''}{trend.value}%
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.value, { color: accentColor }]}>{value}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      
      {onPress && (
        <MaterialCommunityIcons 
          name="chevron-right" 
          size={20} 
          color={darkTheme.textMuted} 
          style={styles.chevron}
        />
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => pressed && styles.pressed}
        onPress={onPress}
      >
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: darkTheme.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: darkTheme.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  header: {
    marginRight: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkTheme.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    color: darkTheme.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: darkTheme.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  chevron: {
    marginLeft: 12,
  },
});

export default StatCard;
