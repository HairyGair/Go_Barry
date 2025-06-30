/*
 * Go Barry - Traffic Intelligence Platform
 * ImpactCard Component - Display disruption impact details
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { darkTheme } from '../styles/darkTheme';

const ImpactCard = ({ 
  impact,
  style
}) => {
  if (!impact) return null;

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

  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>{impact.title}</Text>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(impact.severityLevel) }]}>
          <Text style={styles.severityBadgeText}>{impact.severityLevel}</Text>
        </View>
      </View>
      
      <View style={styles.location}>
        <MaterialCommunityIcons name="map-marker" size={14} color={darkTheme.accents.liveMap} />
        <Text style={styles.locationText}>{impact.location}</Text>
      </View>
      
      <View style={styles.metrics}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Impact Score</Text>
          <Text style={[styles.metricValue, { color: getSeverityColor(impact.severityLevel) }]}>
            {impact.impactScore}/100
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Est. Delay</Text>
          <Text style={styles.metricValue}>{impact.estimatedDelay}min</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Passengers</Text>
          <Text style={styles.metricValue}>{impact.passengerImpact}</Text>
        </View>
      </View>
      
      {impact.affectedRoutes && impact.affectedRoutes.length > 0 && (
        <View style={styles.affectedRoutes}>
          <Text style={styles.routesLabel}>Affected Routes:</Text>
          <View style={styles.routesList}>
            {impact.affectedRoutes.map((route, idx) => (
              <View key={idx} style={styles.routeChip}>
                <Text style={styles.routeChipText}>{route.routeId}</Text>
              </View>
            ))}
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: darkTheme.text,
    marginRight: 12,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    color: darkTheme.accents.liveMap,
  },
  metrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: darkTheme.textSecondary,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: darkTheme.text,
  },
  affectedRoutes: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: darkTheme.border,
  },
  routesLabel: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    marginBottom: 8,
  },
  routesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  routeChip: {
    backgroundColor: darkTheme.accents.intelligence + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: darkTheme.accents.intelligence + '40',
  },
  routeChipText: {
    fontSize: 12,
    color: darkTheme.accents.intelligence,
    fontWeight: '600',
  },
});

export default ImpactCard;
