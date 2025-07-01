/*
 * Go Barry - Route Impact Section Component
 * Shows most affected routes and performance metrics
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { statisticsStyles, statisticsTheme } from '../styles/statistics.styles.js';

const RouteImpactSection = ({ data, loading }) => {
  if (loading || !data) {
    return (
      <View style={[statisticsStyles.card, styles.loadingContainer]}>
        <ActivityIndicator size="small" color={statisticsTheme.charts.primary} />
        <Text style={styles.loadingText}>Loading route data...</Text>
      </View>
    );
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return statisticsTheme.metrics.critical;
      case 'medium':
        return statisticsTheme.metrics.warning;
      case 'low':
        return statisticsTheme.metrics.success;
      default:
        return statisticsTheme.metrics.neutral;
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high':
        return 'alert-circle';
      case 'medium':
        return 'alert';
      case 'low':
        return 'information';
      default:
        return 'help-circle';
    }
  };

  const getSeverityText = (severity) => {
    switch (severity) {
      case 'high':
        return 'High';
      case 'medium':
        return 'Medium';
      case 'low':
        return 'Low';
      default:
        return 'Unknown';
    }
  };

  const mostAffected = data.mostAffected || [];
  const criticalRoutes = data.criticalRoutes || [];
  const performanceMetrics = data.performanceMetrics || {};

  return (
    <View style={statisticsStyles.card}>
      <View style={statisticsStyles.cardHeader}>
        <View>
          <Text style={statisticsStyles.cardTitle}>🚌 Route Impact</Text>
          <Text style={statisticsStyles.cardSubtitle}>Performance and disruption analysis</Text>
        </View>
      </View>

      {/* Performance Summary */}
      <View style={styles.performanceSummary}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{performanceMetrics.totalRoutes || 231}</Text>
          <Text style={styles.summaryLabel}>Total Routes</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: statisticsTheme.metrics.warning }]}>
            {performanceMetrics.affectedRoutes || 0}
          </Text>
          <Text style={styles.summaryLabel}>Affected</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: statisticsTheme.metrics.critical }]}>
            {performanceMetrics.averageDelay || '0 mins'}
          </Text>
          <Text style={styles.summaryLabel}>Avg Delay</Text>
        </View>
      </View>

      {/* Most Affected Routes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Most Affected Routes</Text>
        
        {mostAffected.length > 0 ? (
          <View style={styles.routesTable}>
            {mostAffected.map((route, index) => (
              <TouchableOpacity key={route.route} style={styles.routeRow}>
                <View style={styles.routeInfo}>
                  <View style={styles.routeNumber}>
                    <Text style={styles.routeNumberText}>{route.route}</Text>
                  </View>
                  
                  <View style={styles.routeDetails}>
                    <Text style={styles.routeIncidents}>
                      {route.incidents} incident{route.incidents !== 1 ? 's' : ''}
                    </Text>
                    <Text style={styles.routeDelay}>
                      Avg delay: {route.avgDelay}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.routeStatus}>
                  <MaterialCommunityIcons 
                    name={getSeverityIcon(route.severity)} 
                    size={16} 
                    color={getSeverityColor(route.severity)}
                  />
                  <View style={[
                    styles.severityBadge,
                    { backgroundColor: `${getSeverityColor(route.severity)}15` }
                  ]}>
                    <Text style={[
                      styles.severityText,
                      { color: getSeverityColor(route.severity) }
                    ]}>
                      {getSeverityText(route.severity)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons 
              name="check-circle" 
              size={32} 
              color={statisticsTheme.metrics.success}
            />
            <Text style={styles.emptyStateText}>All routes running smoothly!</Text>
          </View>
        )}
      </View>

      {/* Critical Routes */}
      {criticalRoutes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Critical Infrastructure</Text>
          <Text style={styles.sectionDescription}>
            Key routes requiring priority monitoring
          </Text>
          
          <View style={styles.criticalRoutes}>
            {criticalRoutes.map((route, index) => (
              <View key={index} style={styles.criticalRouteCard}>
                <MaterialCommunityIcons 
                  name="highway" 
                  size={16} 
                  color={statisticsTheme.charts.warning}
                />
                <Text style={styles.criticalRouteText}>{route}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons 
            name="clock-fast" 
            size={16} 
            color={statisticsTheme.charts.primary}
          />
          <Text style={styles.statText}>
            Updated: {new Date().toLocaleTimeString('en-GB', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <MaterialCommunityIcons 
            name="chart-timeline-variant" 
            size={16} 
            color={statisticsTheme.charts.secondary}
          />
          <Text style={styles.statText}>
            Real-time GTFS data
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
    minHeight: 200,
  },

  loadingText: {
    fontSize: 14,
    color: statisticsTheme.colors.textSecondary,
    marginTop: statisticsTheme.spacing.sm,
  },

  performanceSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: statisticsTheme.spacing.lg,
    gap: statisticsTheme.spacing.sm,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: statisticsTheme.borderRadius.sm,
    padding: statisticsTheme.spacing.md,
    alignItems: 'center',
  },

  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: statisticsTheme.colors.textPrimary,
  },

  summaryLabel: {
    fontSize: 12,
    color: statisticsTheme.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },

  section: {
    marginBottom: statisticsTheme.spacing.lg,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: statisticsTheme.colors.textPrimary,
    marginBottom: statisticsTheme.spacing.xs,
  },

  sectionDescription: {
    fontSize: 12,
    color: statisticsTheme.colors.textSecondary,
    marginBottom: statisticsTheme.spacing.sm,
  },

  routesTable: {
    backgroundColor: '#FFFFFF',
    borderRadius: statisticsTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },

  routeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: statisticsTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  routeNumber: {
    backgroundColor: statisticsTheme.charts.primary,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: statisticsTheme.spacing.md,
    minWidth: 40,
    alignItems: 'center',
  },

  routeNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  routeDetails: {
    flex: 1,
  },

  routeIncidents: {
    fontSize: 14,
    color: statisticsTheme.colors.textPrimary,
    fontWeight: '500',
  },

  routeDelay: {
    fontSize: 12,
    color: statisticsTheme.colors.textSecondary,
    marginTop: 2,
  },

  routeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: statisticsTheme.spacing.sm,
  },

  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  severityText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  emptyState: {
    alignItems: 'center',
    padding: statisticsTheme.spacing.xl,
  },

  emptyStateText: {
    fontSize: 14,
    color: statisticsTheme.colors.textSecondary,
    marginTop: statisticsTheme.spacing.sm,
    textAlign: 'center',
  },

  criticalRoutes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: statisticsTheme.spacing.sm,
  },

  criticalRouteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: statisticsTheme.borderRadius.sm,
    paddingHorizontal: statisticsTheme.spacing.sm,
    paddingVertical: statisticsTheme.spacing.xs,
    gap: 4,
  },

  criticalRouteText: {
    fontSize: 12,
    color: statisticsTheme.charts.warning,
    fontWeight: '500',
  },

  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: statisticsTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: statisticsTheme.spacing.md,
  },

  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },

  statText: {
    fontSize: 10,
    color: statisticsTheme.colors.textSecondary,
  },
});

export default RouteImpactSection;