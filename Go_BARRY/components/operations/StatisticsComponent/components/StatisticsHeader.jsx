/*
 * Go Barry - Statistics Header Component
 * Header with title, time range selector, and refresh controls
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { statisticsStyles, statisticsTheme } from '../styles/statistics.styles.js';

const StatisticsHeader = ({ 
  supervisorName, 
  timeRange, 
  onTimeRangeChange, 
  onRefresh, 
  loading 
}) => {
  const timeRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' }
  ];

  const formatLastUpdated = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <View style={styles.header}>
      <View style={styles.titleSection}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons 
            name="chart-line" 
            size={24} 
            color={statisticsTheme.charts.primary} 
          />
          <Text style={styles.title}>Statistics Dashboard</Text>
        </View>
        <Text style={styles.subtitle}>
          Operations Dashboard - {new Date().toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </Text>
      </View>

      <View style={styles.controlsSection}>
        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          {timeRangeOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.timeRangeButton,
                timeRange === option.value && styles.timeRangeButtonActive
              ]}
              onPress={() => onTimeRangeChange(option.value)}
            >
              <Text style={[
                styles.timeRangeButtonText,
                timeRange === option.value && styles.timeRangeButtonTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Refresh Control */}
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={statisticsTheme.charts.primary} />
          ) : (
            <MaterialCommunityIcons 
              name="refresh" 
              size={20} 
              color={statisticsTheme.charts.primary} 
            />
          )}
          <Text style={styles.refreshButtonText}>
            {loading ? 'Updating...' : `Last: ${formatLastUpdated()}`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: statisticsTheme.colors.cardBg,
    paddingHorizontal: statisticsTheme.spacing.lg,
    paddingVertical: statisticsTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: statisticsTheme.spacing.md,
  },

  titleSection: {
    flex: 1,
    minWidth: 200,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: statisticsTheme.spacing.sm,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: statisticsTheme.colors.textPrimary,
  },

  subtitle: {
    fontSize: 14,
    color: statisticsTheme.colors.textSecondary,
    marginTop: 4,
  },

  controlsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: statisticsTheme.spacing.lg,
    flexWrap: 'wrap',
  },

  timeRangeContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: statisticsTheme.borderRadius.md,
    padding: 4,
  },

  timeRangeButton: {
    paddingHorizontal: statisticsTheme.spacing.md,
    paddingVertical: statisticsTheme.spacing.sm,
    borderRadius: statisticsTheme.borderRadius.sm,
  },

  timeRangeButtonActive: {
    backgroundColor: statisticsTheme.charts.primary,
  },

  timeRangeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: statisticsTheme.colors.textSecondary,
  },

  timeRangeButtonTextActive: {
    color: '#FFFFFF',
  },

  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: statisticsTheme.spacing.sm,
    paddingHorizontal: statisticsTheme.spacing.md,
    paddingVertical: statisticsTheme.spacing.sm,
    backgroundColor: '#F9FAFB',
    borderRadius: statisticsTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  refreshButtonText: {
    fontSize: 12,
    color: statisticsTheme.colors.textSecondary,
    fontWeight: '500',
  },
});

export default StatisticsHeader;