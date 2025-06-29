/*
 * Go Barry - Traffic Intelligence Platform
 * RecommendationCard Component - Display AI recommendations
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { darkTheme } from '../styles/darkTheme';

const RecommendationCard = ({ 
  recommendation,
  style
}) => {
  if (!recommendation) return null;

  const getPriorityColor = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL':
      case 'HIGH':
        return darkTheme.error;
      case 'MEDIUM':
        return darkTheme.warning;
      case 'LOW':
        return darkTheme.success;
      default:
        return darkTheme.textSecondary;
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL':
      case 'HIGH':
        return 'alert-circle';
      case 'MEDIUM':
        return 'alert';
      case 'LOW':
        return 'information';
      default:
        return 'help-circle';
    }
  };

  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(recommendation.priority) }]}>
          <MaterialCommunityIcons 
            name={getPriorityIcon(recommendation.priority)} 
            size={12} 
            color="#FFFFFF" 
          />
          <Text style={styles.priorityText}>{recommendation.priority}</Text>
        </View>
        <Text style={styles.title}>{recommendation.title}</Text>
      </View>
      
      <Text style={styles.description}>{recommendation.description}</Text>
      
      {recommendation.timeframe && (
        <View style={styles.timeframe}>
          <MaterialCommunityIcons name="clock-outline" size={14} color={darkTheme.textSecondary} />
          <Text style={styles.timeframeText}>Implementation: {recommendation.timeframe}</Text>
        </View>
      )}
      
      {recommendation.expectedBenefit && (
        <View style={styles.benefit}>
          <MaterialCommunityIcons name="trending-up" size={14} color={darkTheme.success} />
          <Text style={styles.benefitText}>
            Expected Benefit: {recommendation.expectedBenefit.frequencyRestoration || recommendation.expectedBenefit}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: darkTheme.surfaceLight,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  priorityText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
  },
  description: {
    fontSize: 13,
    color: darkTheme.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  timeframe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  timeframeText: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    fontStyle: 'italic',
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  benefitText: {
    fontSize: 12,
    color: darkTheme.success,
    fontWeight: '500',
  },
});

export default RecommendationCard;
