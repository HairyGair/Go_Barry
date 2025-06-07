// components/mobile/OptimizedMobileDashboard.jsx
// Optimized mobile dashboard with enhanced touch interactions and offline support
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  usePerformanceMonitor, 
  useOfflineCache, 
  useTouchOptimization,
  useNetworkStatus 
} from './MobilePerformanceOptimizer';
import { API_CONFIG } from '../../config/api';

const { width, height } = Dimensions.get('window');

const OptimizedMobileDashboard = ({ baseUrl = API_CONFIG.baseURL }) => {
  const performanceMetrics = usePerformanceMonitor();
  const { isConnected, connectionType } = useNetworkStatus();
  const { touchState, handleTouchStart, handleLongPress } = useTouchOptimization();
  
  // Optimized data fetching with offline cache
  const { data: alertsData, loading: alertsLoading, isOffline: alertsOffline, refetch: refetchAlerts } = useOfflineCache(
    'traffic_alerts',
    async () => {
      const response = await fetch(`${baseUrl}/api/alerts-enhanced`, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    },
    [baseUrl]
  );

  const { data: healthData, loading: healthLoading, isOffline: healthOffline, refetch: refetchHealth } = useOfflineCache(
    'system_health',
    async () => {
      const response = await fetch(`${baseUrl}/api/health`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    },
    [baseUrl]
  );

  // Auto-refresh with smart intervals based on connection
  useEffect(() => {
    if (!isConnected) return;

    const refreshInterval = connectionType === 'wifi' ? 15000 : 30000; // Faster on WiFi
    const interval = setInterval(() => {
      refetchAlerts();
      refetchHealth();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [isConnected, connectionType, refetchAlerts, refetchHealth]);

  // Optimized alerts processing
  const processedAlerts = useMemo(() => {
    if (!alertsData?.alerts) return { critical: [], high: [], medium: [], low: [] };

    const categorized = {
      critical: [],
      high: [],
      medium: [],
      low: []
    };

    alertsData.alerts.forEach(alert => {
      const priority = alert.severity?.toLowerCase() === 'high' ? 'critical' :
                     alert.severity?.toLowerCase() === 'medium' ? 'high' :
                     alert.severity?.toLowerCase() === 'low' ? 'medium' : 'low';
      categorized[priority].push(alert);
    });

    return categorized;
  }, [alertsData]);

  // Smart refresh with haptic feedback on mobile
  const handleRefresh = useCallback(async () => {
    try {
      // Haptic feedback on mobile (with graceful fallback)
      if (Platform.OS !== 'web') {
        try {
          const { HapticFeedback } = await import('expo-haptics');
          HapticFeedback.impactAsync(HapticFeedback.ImpactFeedbackStyle.Light);
        } catch (hapticError) {
          // Graceful fallback if haptics not available
          console.log('Haptic feedback not available');
        }
      }
      
      await Promise.all([refetchAlerts(), refetchHealth()]);
    } catch (error) {
      Alert.alert('Refresh Error', 'Failed to refresh data. Please try again.');
    }
  }, [refetchAlerts, refetchHealth]);

  // Enhanced touch handlers for alert cards
  const handleAlertPress = useCallback((alert) => {
    handleTouchStart();
    
    if (touchState.tapCount === 2) {
      // Double tap - show detailed view
      Alert.alert(
        alert.title,
        `${alert.description}\n\nLocation: ${alert.location}\nRoutes: ${alert.affectsRoutes?.join(', ') || 'None detected'}\nSource: ${alert.source}`,
        [{ text: 'OK' }]
      );
    } else {
      // Single tap - basic interaction
      console.log('Alert selected:', alert.id);
    }
  }, [touchState.tapCount, handleTouchStart]);

  const handleAlertLongPress = useCallback((alert) => {
    handleLongPress();
    
    // Long press - action menu
    Alert.alert(
      'Alert Actions',
      `${alert.title}\n\nWhat would you like to do?`,
      [
        { text: 'View Details', onPress: () => console.log('View details for', alert.id) },
        { text: 'Mark as Acknowledged', onPress: () => console.log('Acknowledge', alert.id) },
        { text: 'Share', onPress: () => console.log('Share', alert.id) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  }, [handleLongPress]);

  // Connection status indicator
  const ConnectionStatus = () => (
    <View style={[styles.connectionStatus, !isConnected && styles.offline]}>
      <Ionicons 
        name={isConnected ? 'wifi' : 'wifi-outline'} 
        size={16} 
        color={isConnected ? '#10B981' : '#EF4444'} 
      />
      <Text style={[styles.connectionText, !isConnected && styles.offlineText]}>
        {isConnected ? `Online (${connectionType})` : 'Offline Mode'}
      </Text>
      {(alertsOffline || healthOffline) && (
        <Text style={styles.cacheText}>• Cached Data</Text>
      )}
    </View>
  );

  // Performance indicator (development only)
  const PerformanceIndicator = () => {
    if (__DEV__) {
      return (
        <View style={styles.performanceIndicator}>
          <Text style={styles.perfText}>
            Render: {performanceMetrics.renderTime}ms | Mem: {performanceMetrics.memoryUsage.toFixed(1)}MB
          </Text>
        </View>
      );
    }
    return null;
  };

  // Alert priority card component
  const AlertCard = ({ alert, priority }) => (
    <TouchableOpacity
      style={[styles.alertCard, styles[`${priority}Card`]]}
      onPress={() => handleAlertPress(alert)}
      onLongPress={() => handleAlertLongPress(alert)}
      activeOpacity={0.7}
    >
      <View style={styles.alertHeader}>
        <Ionicons 
          name={priority === 'critical' ? 'warning' : priority === 'high' ? 'alert-circle' : 'information-circle'} 
          size={20} 
          color={styles[`${priority}Icon`].color} 
        />
        <Text style={[styles.alertTitle, styles[`${priority}Text`]]} numberOfLines={2}>
          {alert.title}
        </Text>
      </View>
      
      <Text style={styles.alertLocation} numberOfLines={1}>
        📍 {alert.location || 'Location updating...'}
      </Text>
      
      {alert.affectsRoutes && alert.affectsRoutes.length > 0 && (
        <View style={styles.routeContainer}>
          <Text style={styles.routeLabel}>Routes:</Text>
          {alert.affectsRoutes.slice(0, 6).map(route => (
            <View key={route} style={styles.routeTag}>
              <Text style={styles.routeText}>{route}</Text>
            </View>
          ))}
          {alert.affectsRoutes.length > 6 && (
            <Text style={styles.routeMore}>+{alert.affectsRoutes.length - 6}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  // System status component
  const SystemStatus = () => (
    <View style={styles.statusContainer}>
      <Text style={styles.sectionTitle}>System Status</Text>
      <View style={styles.statusGrid}>
        <View style={styles.statusItem}>
          <Ionicons name="server" size={24} color="#3B82F6" />
          <Text style={styles.statusLabel}>Backend</Text>
          <Text style={[styles.statusValue, healthData?.status === 'healthy' ? styles.statusHealthy : styles.statusError]}>
            {healthLoading ? 'Checking...' : healthData?.status || 'Unknown'}
          </Text>
        </View>
        
        <View style={styles.statusItem}>
          <Ionicons name="analytics" size={24} color="#10B981" />
          <Text style={styles.statusLabel}>Alerts</Text>
          <Text style={styles.statusValue}>
            {alertsLoading ? 'Loading...' : alertsData?.alerts?.length || 0}
          </Text>
        </View>
        
        <View style={styles.statusItem}>
          <Ionicons name="location" size={24} color="#F59E0B" />
          <Text style={styles.statusLabel}>GTFS</Text>
          <Text style={styles.statusValue}>
            {healthData?.gtfs?.routes || 'N/A'}
          </Text>
        </View>
        
        <View style={styles.statusItem}>
          <Ionicons name="time" size={24} color="#8B5CF6" />
          <Text style={styles.statusLabel}>Updated</Text>
          <Text style={styles.statusValue}>
            {alertsData?.lastUpdated ? new Date(alertsData.lastUpdated).toLocaleTimeString('en-GB', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }) : 'Unknown'}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ConnectionStatus />
      <PerformanceIndicator />
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={alertsLoading || healthLoading}
            onRefresh={handleRefresh}
            tintColor="#3B82F6"
            colors={['#3B82F6']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>BARRY Mobile</Text>
          <Text style={styles.headerSubtitle}>Traffic Intelligence Dashboard</Text>
        </View>

        {/* System Status */}
        <SystemStatus />

        {/* Critical Alerts */}
        {processedAlerts.critical.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🚨 Critical Alerts</Text>
            {processedAlerts.critical.map(alert => (
              <AlertCard key={alert.id} alert={alert} priority="critical" />
            ))}
          </View>
        )}

        {/* High Priority Alerts */}
        {processedAlerts.high.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ High Priority</Text>
            {processedAlerts.high.map(alert => (
              <AlertCard key={alert.id} alert={alert} priority="high" />
            ))}
          </View>
        )}

        {/* Medium Priority Alerts */}
        {processedAlerts.medium.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Medium Priority</Text>
            {processedAlerts.medium.slice(0, 5).map(alert => (
              <AlertCard key={alert.id} alert={alert} priority="medium" />
            ))}
            {processedAlerts.medium.length > 5 && (
              <Text style={styles.showMore}>
                +{processedAlerts.medium.length - 5} more alerts
              </Text>
            )}
          </View>
        )}

        {/* No alerts message */}
        {!alertsLoading && (!alertsData?.alerts || alertsData.alerts.length === 0) && (
          <View style={styles.noAlertsContainer}>
            <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            <Text style={styles.noAlertsTitle}>All Clear</Text>
            <Text style={styles.noAlertsText}>No traffic alerts in your area</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F0FDF4',
    borderBottomWidth: 1,
    borderBottomColor: '#D1FAE5',
  },
  offline: {
    backgroundColor: '#FEF2F2',
    borderBottomColor: '#FECACA',
  },
  connectionText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '500',
    color: '#10B981',
  },
  offlineText: {
    color: '#EF4444',
  },
  cacheText: {
    marginLeft: 8,
    fontSize: 11,
    color: '#6B7280',
  },
  performanceIndicator: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: '#1F2937',
  },
  perfText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#1F2937',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  criticalCard: {
    borderLeftColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  highCard: {
    borderLeftColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  mediumCard: {
    borderLeftColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  alertTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    lineHeight: 22,
  },
  criticalText: { color: '#DC2626' },
  criticalIcon: { color: '#DC2626' },
  highText: { color: '#D97706' },
  highIcon: { color: '#D97706' },
  mediumText: { color: '#2563EB' },
  mediumIcon: { color: '#2563EB' },
  alertLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  routeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  routeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginRight: 8,
  },
  routeTag: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  routeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  routeMore: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  statusContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusItem: {
    width: (width - 48) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 8,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 4,
  },
  statusHealthy: {
    color: '#10B981',
  },
  statusError: {
    color: '#EF4444',
  },
  showMore: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  noAlertsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noAlertsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
    marginTop: 16,
  },
  noAlertsText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
});

export default OptimizedMobileDashboard;
