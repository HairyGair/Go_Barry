/*
 * Go Barry - Real-Time Overview Component
 * Displays key operational metrics in card format
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { statisticsStyles, statisticsTheme } from '../styles/statistics.styles.js';

const RealTimeOverview = ({ data, loading }) => {
  if (loading || !data) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={statisticsTheme.charts.primary} />
          <Text style={styles.loadingText}>Loading dashboard metrics...</Text>
        </View>
      </View>
    );
  }

  const metrics = [
    {
      id: 'alerts',
      icon: 'bell',
      value: data.realTime?.alertsToday || 0,
      label: 'Alerts Processed',
      trend: data.realTime?.alertsTrend || '0%',
      trendType: data.realTime?.alertsTrend?.startsWith('+') ? 'positive' : 
                 data.realTime?.alertsTrend?.startsWith('-') ? 'negative' : 'neutral',
      color: statisticsTheme.charts.info
    },
    {
      id: 'incidents',
      icon: 'alert-circle',
      value: data.realTime?.incidentsManaged || 0,
      label: 'Incidents Managed',
      trend: data.realTime?.incidentsTrend || '0%',
      trendType: data.realTime?.incidentsTrend?.startsWith('-') ? 'positive' : 
                 data.realTime?.incidentsTrend?.startsWith('+') ? 'negative' : 'neutral',
      color: statisticsTheme.charts.danger
    },
    {
      id: 'roadworks',
      icon: 'road-variant',
      value: data.realTime?.activeRoadworks || 0,
      label: 'Active Roadworks',
      trend: data.realTime?.roadworksTrend || '0%',
      trendType: 'neutral',
      color: statisticsTheme.charts.warning
    },
    {
      id: 'supervisors',
      icon: 'account-group',
      value: data.realTime?.activeSupervisors || 0,
      label: 'Supervisors Online',
      trend: null, // No trend for this metric
      trendType: 'neutral',
      color: statisticsTheme.charts.secondary
    },
    {
      id: 'health',
      icon: 'heart-pulse',
      value: `${data.realTime?.systemHealth || 0}%`,
      label: 'System Health',
      trend: null,
      trendType: data.realTime?.systemHealth >= 95 ? 'positive' : 
                 data.realTime?.systemHealth >= 80 ? 'neutral' : 'negative',
      color: data.realTime?.systemHealth >= 95 ? statisticsTheme.metrics.success :
             data.realTime?.systemHealth >= 80 ? statisticsTheme.metrics.warning :
             statisticsTheme.metrics.critical
    }
  ];

  const getTrendIcon = (trendType) => {
    switch (trendType) {
      case 'positive':
        return 'trending-up';
      case 'negative':
        return 'trending-down';
      default:
        return 'minus';
    }
  };

  const getTrendColor = (trendType) => {
    switch (trendType) {
      case 'positive':
        return statisticsTheme.metrics.positive;
      case 'negative':
        return statisticsTheme.metrics.negative;
      default:
        return statisticsTheme.metrics.neutral;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>📈 Today's Operations</Text>
        <Text style={styles.sectionSubtitle}>Real-time operational metrics</Text>
      </View>
      
      <View style={styles.metricsGrid}>
        {metrics.map((metric) => (
          <View key={metric.id} style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <MaterialCommunityIcons 
                name={metric.icon} 
                size={24} 
                color={metric.color}
                style={styles.metricIcon}
              />
              {metric.id === 'health' && (
                <View style={[
                  styles.healthIndicator,
                  { backgroundColor: metric.color }
                ]} />
              )}
            </View>
            
            <Text style={styles.metricValue}>{metric.value}</Text>
            <Text style={styles.metricLabel}>{metric.label}</Text>
            
            {metric.trend && (
              <View style={styles.metricTrend}>
                <MaterialCommunityIcons 
                  name={getTrendIcon(metric.trendType)} 
                  size={14} 
                  color={getTrendColor(metric.trendType)}
                />
                <Text style={[
                  styles.trendText,
                  { color: getTrendColor(metric.trendType) }
                ]}>
                  {metric.trend} vs yesterday
                </Text>
              </View>
            )}
            
            {metric.id === 'supervisors' && (
              <View style={styles.supervisorStatus}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>All systems operational</Text>
              </View>
            )}
            
            {metric.id === 'health' && (
              <View style={styles.healthStatus}>
                <Text style={[
                  styles.healthStatusText,
                  { color: metric.color }
                ]}>
                  {data.realTime?.systemHealth >= 95 ? '🟢 Excellent' :
                   data.realTime?.systemHealth >= 80 ? '🟡 Good' : '🔴 Needs Attention'}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: statisticsTheme.spacing.lg,
    backgroundColor: statisticsTheme.colors.background,
  },

  sectionHeader: {
    marginBottom: statisticsTheme.spacing.lg,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: statisticsTheme.colors.textPrimary,
    marginBottom: 4,
  },

  sectionSubtitle: {
    fontSize: 14,
    color: statisticsTheme.colors.textSecondary,
  },

  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: statisticsTheme.spacing.md,
    justifyContent: 'space-between',
  },

  metricCard: {
    ...statisticsStyles.metricCard,
    flex: 1,
    minWidth: 200,
    maxWidth: 300,
  },

  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: statisticsTheme.spacing.sm,
  },

  metricIcon: {
    // Icon styling handled by the icon component
  },

  healthIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  metricValue: {
    ...statisticsStyles.metricValue,
  },

  metricLabel: {
    ...statisticsStyles.metricLabel,
  },

  metricTrend: {
    ...statisticsStyles.metricTrend,
    marginTop: 'auto',
  },

  trendText: {
    ...statisticsStyles.trendText,
  },

  supervisorStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: statisticsTheme.metrics.success,
    marginRight: statisticsTheme.spacing.xs,
  },

  statusText: {
    fontSize: 12,
    color: statisticsTheme.colors.textSecondary,
    fontWeight: '500',
  },

  healthStatus: {
    marginTop: 'auto',
  },

  healthStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },

  loadingCard: {
    ...statisticsStyles.card,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },

  loadingText: {
    ...statisticsStyles.loadingText,
    marginTop: statisticsTheme.spacing.sm,
  },
});

export default RealTimeOverview;