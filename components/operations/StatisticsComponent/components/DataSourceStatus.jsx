/*
 * Go Barry - Data Source Status Component
 * Monitors health and performance of all data sources
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { statisticsStyles, statisticsTheme } from '../styles/statistics.styles.js';

const DataSourceStatus = ({ data, loading }) => {
  if (loading || !data) {
    return (
      <View style={[statisticsStyles.card, styles.loadingContainer]}>
        <ActivityIndicator size="small" color={statisticsTheme.charts.primary} />
        <Text style={styles.loadingText}>Loading system status...</Text>
      </View>
    );
  }

  const dataSources = [
    {
      id: 'tomtom',
      name: 'TomTom API',
      icon: 'map-marker-path',
      description: 'Live traffic data',
      ...data.dataSources?.tomtom
    },
    {
      id: 'nationalHighways',
      name: 'National Highways',
      icon: 'highway',
      description: 'Official roadworks',
      ...data.dataSources?.nationalHighways
    },
    {
      id: 'streetManager',
      name: 'Street Manager',
      icon: 'road',
      description: 'Local roadworks',
      ...data.dataSources?.streetManager
    },
    {
      id: 'convex',
      name: 'Convex Sync',
      icon: 'sync',
      description: 'Real-time sync',
      ...data.dataSources?.convex
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return statisticsTheme.metrics.success;
      case 'degraded':
        return statisticsTheme.metrics.warning;
      case 'offline':
        return statisticsTheme.metrics.critical;
      default:
        return statisticsTheme.metrics.neutral;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
        return 'check-circle';
      case 'degraded':
        return 'alert-circle';
      case 'offline':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'degraded':
        return 'Degraded';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  const overallHealth = data.overallHealth || 0;
  const overallColor = overallHealth >= 95 ? statisticsTheme.metrics.success :
                      overallHealth >= 80 ? statisticsTheme.metrics.warning :
                      statisticsTheme.metrics.critical;

  return (
    <View style={statisticsStyles.card}>
      <View style={statisticsStyles.cardHeader}>
        <View>
          <Text style={statisticsStyles.cardTitle}>🔌 Data Sources</Text>
          <Text style={statisticsStyles.cardSubtitle}>System health monitoring</Text>
        </View>
        <View style={styles.overallHealth}>
          <Text style={[styles.healthPercentage, { color: overallColor }]}>
            {overallHealth}%
          </Text>
          <Text style={styles.healthLabel}>Health</Text>
        </View>
      </View>

      <View style={styles.sourcesList}>
        {dataSources.map((source) => (
          <View key={source.id} style={[
            styles.sourceCard,
            { borderLeftColor: getStatusColor(source.status) }
          ]}>
            <View style={styles.sourceHeader}>
              <View style={styles.sourceInfo}>
                <MaterialCommunityIcons 
                  name={source.icon} 
                  size={20} 
                  color={statisticsTheme.colors.textSecondary}
                  style={styles.sourceIcon}
                />
                <View style={styles.sourceDetails}>
                  <Text style={styles.sourceName}>{source.name}</Text>
                  <Text style={styles.sourceDescription}>{source.description}</Text>
                </View>
              </View>
              
              <View style={styles.sourceStatus}>
                <MaterialCommunityIcons 
                  name={getStatusIcon(source.status)} 
                  size={16} 
                  color={getStatusColor(source.status)}
                />
                <Text style={[
                  styles.statusText,
                  { color: getStatusColor(source.status) }
                ]}>
                  {getStatusText(source.status)}
                </Text>
              </View>
            </View>

            <View style={styles.sourceMetrics}>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Response</Text>
                <Text style={styles.metricValue}>{source.responseTime || 'N/A'}</Text>
              </View>
              
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Updated</Text>
                <Text style={styles.metricValue}>{source.lastUpdate || 'N/A'}</Text>
              </View>
              
              {source.errorRate !== undefined && (
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Errors</Text>
                  <Text style={[
                    styles.metricValue,
                    { color: source.errorRate > 0 ? statisticsTheme.metrics.warning : statisticsTheme.metrics.success }
                  ]}>
                    {source.errorRate}%
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Overall System Status */}
      <View style={styles.systemSummary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>System Uptime:</Text>
          <Text style={styles.summaryValue}>{data.uptime || '99.5%'}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Services Online:</Text>
          <Text style={styles.summaryValue}>
            {dataSources.filter(s => s.status === 'online').length}/{dataSources.length}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Last Health Check:</Text>
          <Text style={styles.summaryValue}>
            {new Date().toLocaleTimeString('en-GB', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },

  loadingText: {
    fontSize: 14,
    color: statisticsTheme.colors.textSecondary,
    marginTop: statisticsTheme.spacing.sm,
  },

  overallHealth: {
    alignItems: 'center',
  },

  healthPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
  },

  healthLabel: {
    fontSize: 12,
    color: statisticsTheme.colors.textSecondary,
    marginTop: 2,
  },

  sourcesList: {
    gap: statisticsTheme.spacing.sm,
  },

  sourceCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: statisticsTheme.borderRadius.sm,
    padding: statisticsTheme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: statisticsTheme.metrics.neutral,
  },

  sourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: statisticsTheme.spacing.sm,
  },

  sourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  sourceIcon: {
    marginRight: statisticsTheme.spacing.sm,
  },

  sourceDetails: {
    flex: 1,
  },

  sourceName: {
    fontSize: 16,
    fontWeight: '600',
    color: statisticsTheme.colors.textPrimary,
  },

  sourceDescription: {
    fontSize: 12,
    color: statisticsTheme.colors.textSecondary,
    marginTop: 2,
  },

  sourceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  sourceMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: statisticsTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },

  metric: {
    alignItems: 'center',
  },

  metricLabel: {
    fontSize: 10,
    color: statisticsTheme.colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 2,
  },

  metricValue: {
    fontSize: 12,
    fontWeight: '600',
    color: statisticsTheme.colors.textPrimary,
  },

  systemSummary: {
    marginTop: statisticsTheme.spacing.md,
    paddingTop: statisticsTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: statisticsTheme.spacing.xs,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  summaryLabel: {
    fontSize: 12,
    color: statisticsTheme.colors.textSecondary,
  },

  summaryValue: {
    fontSize: 12,
    fontWeight: '600',
    color: statisticsTheme.colors.textPrimary,
  },
});

export default DataSourceStatus;