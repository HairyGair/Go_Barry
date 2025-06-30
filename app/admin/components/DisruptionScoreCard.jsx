/*
 * Go Barry - Traffic Intelligence Platform
 * DisruptionScoreCard Component - Live disruption score display
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { darkTheme } from '../styles/darkTheme';

const DisruptionScoreCard = ({ 
  score = 0,
  trend = 'stable',
  factors = [],
  style
}) => {
  const getScoreColor = (score) => {
    if (score >= 80) return darkTheme.error;
    if (score >= 60) return darkTheme.warning;
    if (score >= 40) return '#D97706';
    return darkTheme.success;
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'increasing':
        return 'trending-up';
      case 'decreasing':
        return 'trending-down';
      default:
        return 'trending-neutral';
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'increasing':
        return darkTheme.error;
      case 'decreasing':
        return darkTheme.success;
      default:
        return darkTheme.textSecondary;
    }
  };

  return (
    <View style={[styles.card, style]}>
      <Text style={styles.title}>Live Disruption Score</Text>
      
      <View style={styles.scoreContainer}>
        <Text style={[styles.scoreValue, { color: getScoreColor(score) }]}>
          {score}
        </Text>
        <View style={styles.scoreDetails}>
          <View style={styles.trendIndicator}>
            <MaterialCommunityIcons 
              name={getTrendIcon()} 
              size={16} 
              color={getTrendColor()} 
            />
            <Text style={[styles.trendText, { color: getTrendColor() }]}>
              {trend}
            </Text>
          </View>
        </View>
      </View>
      
      {factors.length > 0 && (
        <View style={styles.factorsContainer}>
          {factors.map((factor, index) => (
            <View key={index} style={styles.factorRow}>
              <Text style={styles.factorName}>{factor.name}</Text>
              <View style={styles.factorBar}>
                <View 
                  style={[
                    styles.factorProgress, 
                    { 
                      width: `${factor.impact}%`,
                      backgroundColor: getScoreColor(factor.impact)
                    }
                  ]} 
                />
              </View>
              <Text style={styles.factorValue}>{factor.impact}%</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: darkTheme.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: darkTheme.text,
    marginBottom: 16,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
  },
  scoreDetails: {
    alignItems: 'flex-end',
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  factorsContainer: {
    gap: 12,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  factorName: {
    flex: 1,
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
  factorBar: {
    flex: 2,
    height: 6,
    backgroundColor: darkTheme.progressBar.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  factorProgress: {
    height: '100%',
    borderRadius: 3,
  },
  factorValue: {
    width: 40,
    fontSize: 12,
    fontWeight: '600',
    color: darkTheme.text,
    textAlign: 'right',
  },
});

export default DisruptionScoreCard;
