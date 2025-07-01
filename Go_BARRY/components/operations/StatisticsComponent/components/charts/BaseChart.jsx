/*
 * Go Barry - Base Chart Component
 * Foundation component for all chart types with theming and responsive design
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart, BarChart, PieChart } from 'recharts';
import { statisticsTheme } from '../styles/statistics.styles.js';

const { width: screenWidth } = Dimensions.get('window');

const BaseChart = ({ 
  type = 'line',
  data = [],
  title,
  subtitle,
  loading = false,
  error = null,
  config = {},
  children,
  height = 250,
  ...props 
}) => {
  // Calculate responsive width
  const chartWidth = Math.min(screenWidth - 40, config.width || 400);
  
  // Default chart configurations
  const defaultConfigs = {
    line: {
      margin: { top: 20, right: 30, left: 20, bottom: 20 },
      stroke: statisticsTheme.charts.primary,
      strokeWidth: 2,
      dot: { fill: statisticsTheme.charts.primary, r: 4 },
      activeDot: { r: 6, fill: statisticsTheme.charts.secondary }
    },
    bar: {
      margin: { top: 20, right: 30, left: 20, bottom: 20 },
      fill: statisticsTheme.charts.primary
    },
    pie: {
      cx: '50%',
      cy: '50%',
      outerRadius: 80,
      dataKey: 'value'
    }
  };

  const chartConfig = { ...defaultConfigs[type], ...config };

  const renderChart = () => {
    if (loading) {
      return (
        <View style={[styles.chartContainer, { height }]}>
          <Text style={styles.loadingText}>Loading chart...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={[styles.chartContainer, { height }]}>
          <Text style={styles.errorText}>Failed to load chart: {error}</Text>
        </View>
      );
    }

    if (!data || data.length === 0) {
      return (
        <View style={[styles.chartContainer, { height }]}>
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      );
    }

    // For now, render a placeholder since we need to handle Recharts installation
    return (
      <View style={[styles.chartContainer, { height }]}>
        <View style={styles.chartPlaceholder}>
          <Text style={styles.placeholderTitle}>{title}</Text>
          <Text style={styles.placeholderText}>
            📊 {type.toUpperCase()} CHART
          </Text>
          <Text style={styles.placeholderSubtext}>
            Data points: {data.length}
          </Text>
          {subtitle && (
            <Text style={styles.placeholderSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      
      {renderChart()}
      
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: statisticsTheme.colors.cardBg,
    borderRadius: statisticsTheme.borderRadius.md,
    padding: statisticsTheme.spacing.lg,
    marginBottom: statisticsTheme.spacing.md,
    ...statisticsTheme.shadows.sm,
  },

  header: {
    marginBottom: statisticsTheme.spacing.md,
  },

  title: {
    fontSize: 18,
    fontWeight: '600',
    color: statisticsTheme.colors.textPrimary,
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 14,
    color: statisticsTheme.colors.textSecondary,
  },

  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFBFC',
    borderRadius: statisticsTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  chartPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: statisticsTheme.spacing.xl,
  },

  placeholderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: statisticsTheme.colors.textPrimary,
    marginBottom: statisticsTheme.spacing.sm,
  },

  placeholderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: statisticsTheme.charts.primary,
    marginBottom: statisticsTheme.spacing.xs,
  },

  placeholderSubtext: {
    fontSize: 12,
    color: statisticsTheme.colors.textSecondary,
  },

  placeholderSubtitle: {
    fontSize: 12,
    color: statisticsTheme.colors.textSecondary,
    marginTop: statisticsTheme.spacing.xs,
    fontStyle: 'italic',
  },

  loadingText: {
    fontSize: 16,
    color: statisticsTheme.colors.textSecondary,
  },

  errorText: {
    fontSize: 14,
    color: statisticsTheme.metrics.critical,
    textAlign: 'center',
  },

  emptyText: {
    fontSize: 14,
    color: statisticsTheme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default BaseChart;