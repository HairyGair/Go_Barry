// components/EnhancedAlertList.jsx
import React, { useState } from 'react';
import { View, ScrollView, Text, StyleSheet, RefreshControl } from 'react-native';
import { useConvexSync } from '../hooks/useConvexSync';
import GlassAlertCard from './GlassAlertCard';
import TrafficFlowIndicatorEnhanced from './TrafficFlowIndicatorEnhanced';
import NetworkHealthScore from './NetworkHealthScore';
import { ListSkeleton } from './SkeletonLoaders';
import { LinearGradient } from 'expo-linear-gradient';

const EnhancedAlertList = ({ onAlertPress, onDismiss }) => {
  const { activeAlerts, isLoading } = useConvexSync();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Convex syncs automatically, just wait a moment
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Sort alerts by severity and add flow indicators
  const sortedAlerts = React.useMemo(() => {
    if (!activeAlerts) return [];
    
    const severityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
    
    return [...activeAlerts].sort((a, b) => {
      const severityA = severityOrder[a.severity] ?? 999;
      const severityB = severityOrder[b.severity] ?? 999;
      return severityA - severityB;
    });
  }, [activeAlerts]);

  if (isLoading && !activeAlerts) {
    return (
      <View style={styles.container}>
        <NetworkHealthScore compact />
        <View style={styles.skeletonContainer}>
          <ListSkeleton count={3} />
        </View>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#f9fafb', '#f3f4f6']}
      style={styles.container}
    >
      {/* Network Health Score at top */}
      <View style={styles.healthContainer}>
        <NetworkHealthScore compact />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ee7203"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Critical Alerts Section */}
        {sortedAlerts.filter(a => a.severity === 'Critical').length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🚨 Critical Incidents</Text>
            {sortedAlerts
              .filter(a => a.severity === 'Critical')
              .map((alert) => (
                <View key={alert.id}>
                  <GlassAlertCard
                    alert={alert}
                    onPress={onAlertPress}
                    onDismiss={onDismiss}
                    showFlowData={false}
                  />
                  {alert.type === 'incident' && alert.coordinates && (
                    <View style={styles.flowIndicatorContainer}>
                      <TrafficFlowIndicatorEnhanced
                        alertId={alert.id}
                        showDetails={false}
                        onPress={() => onAlertPress?.(alert)}
                      />
                    </View>
                  )}
                </View>
              ))}
          </View>
        )}

        {/* High Priority Section */}
        {sortedAlerts.filter(a => a.severity === 'High').length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ High Priority</Text>
            {sortedAlerts
              .filter(a => a.severity === 'High')
              .map((alert) => (
                <View key={alert.id}>
                  <GlassAlertCard
                    alert={alert}
                    onPress={onAlertPress}
                    onDismiss={onDismiss}
                    showFlowData={false}
                  />
                  {alert.type === 'incident' && alert.coordinates && (
                    <View style={styles.flowIndicatorContainer}>
                      <TrafficFlowIndicatorEnhanced
                        alertId={alert.id}
                        showDetails={false}
                        onPress={() => onAlertPress?.(alert)}
                      />
                    </View>
                  )}
                </View>
              ))}
          </View>
        )}

        {/* Other Alerts */}
        {sortedAlerts.filter(a => a.severity !== 'Critical' && a.severity !== 'High').length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ℹ️ Active Monitoring</Text>
            {sortedAlerts
              .filter(a => a.severity !== 'Critical' && a.severity !== 'High')
              .map((alert) => (
                <View key={alert.id}>
                  <GlassAlertCard
                    alert={alert}
                    onPress={onAlertPress}
                    onDismiss={onDismiss}
                    showFlowData={false}
                  />
                  {alert.type === 'incident' && alert.coordinates && (
                    <View style={styles.flowIndicatorContainer}>
                      <TrafficFlowIndicatorEnhanced
                        alertId={alert.id}
                        showDetails={false}
                        onPress={() => onAlertPress?.(alert)}
                      />
                    </View>
                  )}
                </View>
              ))}
          </View>
        )}

        {/* Empty State */}
        {sortedAlerts.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyTitle}>All Clear!</Text>
            <Text style={styles.emptyText}>
              No active traffic incidents or roadworks
            </Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  healthContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  skeletonContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  flowIndicatorContainer: {
    marginTop: -8,
    marginHorizontal: 8,
    marginBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default EnhancedAlertList;