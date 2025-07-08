/*
 * Go Barry - Metrics Grid Component
 * Display key metrics in a responsive grid
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { roadworksStyles, colors, spacing } from '../styles/roadworks.styles';

const MetricsGrid = ({ metrics }) => {
  const metricConfigs = [
    {
      key: 'totalRoadworks',
      label: 'Total Roadworks',
      icon: 'construct',
      color: colors.primary,
      format: (v) => v.toLocaleString()
    },
    {
      key: 'avgResolutionTime',
      label: 'Avg Resolution',
      icon: 'time',
      color: colors.secondary,
      format: (v) => `${v.toFixed(1)} hrs`
    },
    {
      key: 'routesAffected',
      label: 'Routes Affected',
      icon: 'bus',
      color: colors.warning,
      format: (v) => v
    },
    {
      key: 'diversionsCreated',
      label: 'Diversions',
      icon: 'git-branch',
      color: colors.success,
      format: (v) => v
    },
    {
      key: 'supervisorActions',
      label: 'Supervisor Actions',
      icon: 'people',
      color: colors.info,
      format: (v) => v.toLocaleString()
    },
    {
      key: 'dataQuality',
      label: 'Data Quality',
      icon: 'analytics',
      color: colors.tertiary,
      format: (v) => `${v}%`
    }
  ];

  return (
    <View style={roadworksStyles.metricsGrid}>
      {metricConfigs.map((config) => (
        <View key={config.key} style={roadworksStyles.metricCard}>
          <View style={[
            roadworksStyles.metricIconContainer,
            { backgroundColor: config.color + '20' }
          ]}>
            <Ionicons 
              name={config.icon} 
              size={24} 
              color={config.color} 
            />
          </View>
          
          <Text style={roadworksStyles.metricValue}>
            {config.format(metrics[config.key] || 0)}
          </Text>
          
          <Text style={roadworksStyles.metricLabel}>
            {config.label}
          </Text>
          
          {/* Trend indicator (mock data for now) */}
          <View style={roadworksStyles.metricTrend}>
            <Ionicons 
              name={Math.random() > 0.5 ? 'trending-up' : 'trending-down'} 
              size={12} 
              color={Math.random() > 0.5 ? colors.success : colors.error} 
            />
            <Text style={[
              roadworksStyles.metricTrendText,
              { color: Math.random() > 0.5 ? colors.success : colors.error }
            ]}>
              {Math.floor(Math.random() * 20)}%
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};

export default MetricsGrid;