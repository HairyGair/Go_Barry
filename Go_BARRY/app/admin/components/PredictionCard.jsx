/*
 * Go Barry - Traffic Intelligence Platform
 * PredictionCard Component - Display ML predictions
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { darkTheme, getStatusColor } from '../styles/darkTheme';

const PredictionCard = ({ 
  prediction,
  showRoutes = true,
  style
}) => {
  if (!prediction) return null;

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
        <View style={[styles.icon, { backgroundColor: getSeverityColor(prediction.severity) + '20' }]}>
          <MaterialCommunityIcons 
            name="lightning-bolt" 
            size={16} 
            color={getSeverityColor(prediction.severity)} 
          />
        </View>
        <View style={styles.info}>
          <Text style={styles.description}>{prediction.description}</Text>
          <Text style={styles.timeframe}>Timeframe: {prediction.timeframe}</Text>
        </View>
        <Text style={[styles.confidence, { color: getSeverityColor(prediction.severity) }]}>
          {prediction.confidence}%
        </Text>
      </View>
      
      {showRoutes && prediction.affectedRoutes && prediction.affectedRoutes.length > 0 && (
        <View style={styles.routes}>
          {prediction.affectedRoutes.map((route, idx) => (
            <View key={idx} style={styles.routeChip}>
              <Text style={styles.routeChipText}>{route}</Text>
            </View>
          ))}
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
    alignItems: 'flex-start',
    gap: 12,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  description: {
    fontSize: 14,
    fontWeight: '500',
    color: darkTheme.text,
    marginBottom: 4,
  },
  timeframe: {
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
  confidence: {
    fontSize: 14,
    fontWeight: '600',
  },
  routes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 12,
  },
  routeChip: {
    backgroundColor: darkTheme.accents.intelligence + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: darkTheme.accents.intelligence + '40',
  },
  routeChipText: {
    fontSize: 10,
    color: darkTheme.accents.intelligence,
    fontWeight: '600',
  },
});

export default PredictionCard;
