/*
 * Go Barry - Traffic Intelligence Platform
 * SeverityDistributionCard Component - Display severity distribution
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { darkTheme } from '../styles/darkTheme';

const SeverityDistributionCard = ({ 
  distribution = {},
  title = 'Severity Distribution',
  style
}) => {
  const getSeverityColor = (severity) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return darkTheme.error;
      case 'HIGH':
        return darkTheme.warning;
      case 'MEDIUM':
        return '#D97706';
      case 'LOW':
        return darkTheme.success;
      default:
        return darkTheme.textSecondary;
    }
  };

  const severityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const orderedDistribution = severityOrder.filter(sev => distribution[sev] !== undefined);

  return (
    <View style={[styles.card, style]}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.distributionGrid}>
        {orderedDistribution.map((severity) => (
          <View key={severity} style={styles.distributionItem}>
            <View style={[styles.severityDot, { backgroundColor: getSeverityColor(severity) }]} />
            <Text style={styles.severityLabel}>{severity}</Text>
            <Text style={styles.severityCount}>{distribution[severity] || 0}</Text>
          </View>
        ))}
      </View>
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
  distributionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  distributionItem: {
    alignItems: 'center',
    gap: 8,
  },
  severityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  severityLabel: {
    fontSize: 10,
    color: darkTheme.textSecondary,
    textTransform: 'uppercase',
  },
  severityCount: {
    fontSize: 20,
    fontWeight: '700',
    color: darkTheme.text,
  },
});

export default SeverityDistributionCard;
