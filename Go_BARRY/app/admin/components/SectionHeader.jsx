/*
 * Go Barry - Traffic Intelligence Platform
 * SectionHeader Component - Reusable section header with optional action
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { darkTheme } from '../styles/darkTheme';

const SectionHeader = ({ 
  title,
  subtitle,
  icon,
  iconColor,
  actionLabel,
  actionIcon,
  onActionPress,
  style
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.titleSection}>
        {icon && (
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons 
              name={icon} 
              size={24} 
              color={iconColor || darkTheme.text} 
            />
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      
      {(actionLabel || actionIcon) && onActionPress && (
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed
          ]}
          onPress={onActionPress}
        >
          {actionIcon && (
            <MaterialCommunityIcons 
              name={actionIcon} 
              size={20} 
              color={darkTheme.accents.systemOverview} 
            />
          )}
          {actionLabel && (
            <Text style={styles.actionLabel}>{actionLabel}</Text>
          )}
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: darkTheme.text,
  },
  subtitle: {
    fontSize: 14,
    color: darkTheme.textSecondary,
    marginTop: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: darkTheme.surfaceLight,
    gap: 6,
  },
  actionButtonPressed: {
    opacity: 0.8,
  },
  actionLabel: {
    fontSize: 14,
    color: darkTheme.accents.systemOverview,
    fontWeight: '500',
  },
});

export default SectionHeader;
