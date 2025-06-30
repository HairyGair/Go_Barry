/*
 * Go Barry - Traffic Intelligence Platform
 * MetricCard Component - Reusable metric display card
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { darkTheme } from '../styles/darkTheme';

const MetricCard = ({ 
  label,
  value,
  detail,
  color = darkTheme.accents.systemOverview,
  showProgress = false,
  progress = 0,
  progressColor,
  style
}) => {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {value !== undefined && (
          <Text style={[styles.value, { color }]}>{value}</Text>
        )}
      </View>
      
      {showProgress && (
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${Math.min(100, Math.max(0, progress))}%`,
                backgroundColor: progressColor || color 
              }
            ]} 
          />
        </View>
      )}
      
      {detail && (
        <Text style={styles.detail}>{detail}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: darkTheme.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    color: darkTheme.text,
    fontSize: 16,
    fontWeight: '600',
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: darkTheme.progressBar.background,
    borderRadius: 4,
    marginVertical: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  detail: {
    color: darkTheme.textSecondary,
    fontSize: 12,
    marginTop: 5,
  },
});

export default MetricCard;
