// Go_BARRY/components/ControlDashboard.jsx
// Unified Control Dashboard for Go BARRY Operations

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useConvexSync } from '../hooks/useConvexSync';
import { useBarryAPI } from '../hooks/useBARRYapi';

const ControlDashboard = () => {
  const [selectedView, setSelectedView] = useState('overview');
  const [systemStats, setSystemStats] = useState({
    activeAlerts: 0,
    activeSupervisors: 0,
    systemHealth: 'healthy',
    lastUpdate: new Date()
  });

  // Use Convex for real-time data
  const { activeAlerts, activeSupervisors, mostSevereEvent } = useConvexSync();
  
  // Use API hook for additional data
  const { 
    alerts, 
    loading, 
    error, 
    systemHealth,
    totalAlertsCount,
    activeAlertsCount,
    criticalAlertsCount 
  } = useBarryAPI();

  useEffect(() => {
    setSystemStats({
      activeAlerts: activeAlertsCount,
      activeSupervisors: activeSupervisors?.length || 0,
      systemHealth: systemHealth?.status || 'healthy',
      lastUpdate: new Date()
    });
  }, [activeAlertsCount, activeSupervisors, systemHealth]);

  const renderOverview = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>System Overview</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{systemStats.activeAlerts}</Text>
          <Text style={styles.statLabel}>Active Alerts</Text>
          <View style={[styles.statusIndicator, { 
            backgroundColor: systemStats.activeAlerts > 0 ? '#ef4444' : '#10b981' 
          }]} />
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{systemStats.activeSupervisors}</Text>
          <Text style={styles.statLabel}>Active Supervisors</Text>
          <View style={[styles.statusIndicator, { 
            backgroundColor: systemStats.activeSupervisors > 0 ? '#10b981' : '#f59e0b' 
          }]} />
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{criticalAlertsCount}</Text>
          <Text style={styles.statLabel}>Critical Alerts</Text>
          <View style={[styles.statusIndicator, { 
            backgroundColor: criticalAlertsCount > 0 ? '#ef4444' : '#10b981' 
          }]} />
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>System Health</Text>
          <Text style={[styles.healthStatus, {
            color: systemStats.systemHealth === 'healthy' ? '#10b981' : '#ef4444'
          }]}>
            {systemStats.systemHealth.toUpperCase()}
          </Text>
          <View style={[styles.statusIndicator, { 
            backgroundColor: systemStats.systemHealth === 'healthy' ? '#10b981' : '#ef4444' 
          }]} />
        </View>
      </View>

      {mostSevereEvent && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertBannerTitle}>🚨 Active Major Event</Text>
          <Text style={styles.alertBannerText}>
            {mostSevereEvent.venue} - {mostSevereEvent.event}
          </Text>
          <Text style={styles.alertBannerTime}>{mostSevereEvent.time}</Text>
        </View>
      )}
    </View>
  );

  const renderAlertSummary = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Alert Summary</Text>
      
      {loading ? (
        <Text style={styles.loadingText}>Loading alerts...</Text>
      ) : error ? (
        <Text style={styles.errorText}>Error: {error}</Text>
      ) : (
        <View style={styles.alertList}>
          {alerts.slice(0, 5).map((alert, index) => (
            <View key={alert.id || index} style={styles.alertItem}>
              <View style={styles.alertHeader}>
                <Text style={styles.alertTitle} numberOfLines={1}>
                  {alert.title || alert.description}
                </Text>
                <View style={[styles.severityBadge, {
                  backgroundColor: getSeverityColor(alert.severity)
                }]}>
                  <Text style={styles.severityText}>
                    {alert.severity || 'UNKNOWN'}
                  </Text>
                </View>
              </View>
              <Text style={styles.alertLocation} numberOfLines={1}>
                📍 {alert.location || 'Location not specified'}
              </Text>
              {alert.affectedRoutes && alert.affectedRoutes.length > 0 && (
                <Text style={styles.alertRoutes} numberOfLines={1}>
                  🚌 Routes: {alert.affectedRoutes.slice(0, 3).join(', ')}
                  {alert.affectedRoutes.length > 3 && ` +${alert.affectedRoutes.length - 3} more`}
                </Text>
              )}
            </View>
          ))}
          
          {alerts.length === 0 && (
            <View style={styles.noAlertsContainer}>
              <Text style={styles.noAlertsText}>✅ No active alerts</Text>
              <Text style={styles.noAlertsSubtext}>All systems operating normally</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      
      <View style={styles.actionGrid}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>🚨</Text>
          <Text style={styles.actionText}>Create Incident</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>🚧</Text>
          <Text style={styles.actionText}>Add Roadwork</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>📧</Text>
          <Text style={styles.actionText}>Send Alert</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>📊</Text>
          <Text style={styles.actionText}>View Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>🔄</Text>
          <Text style={styles.actionText}>Refresh Data</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>⚙️</Text>
          <Text style={styles.actionText}>System Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#06b6d4';
      default:
        return '#64748b';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Control Dashboard</Text>
        <Text style={styles.headerSubtitle}>
          Last updated: {systemStats.lastUpdate.toLocaleTimeString()}
        </Text>
      </View>

      {/* View Selector */}
      <View style={styles.viewSelector}>
        <TouchableOpacity 
          style={[styles.viewButton, selectedView === 'overview' && styles.viewButtonActive]}
          onPress={() => setSelectedView('overview')}
        >
          <Text style={[styles.viewButtonText, selectedView === 'overview' && styles.viewButtonTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.viewButton, selectedView === 'alerts' && styles.viewButtonActive]}
          onPress={() => setSelectedView('alerts')}
        >
          <Text style={[styles.viewButtonText, selectedView === 'alerts' && styles.viewButtonTextActive]}>
            Alerts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.viewButton, selectedView === 'actions' && styles.viewButtonActive]}
          onPress={() => setSelectedView('actions')}
        >
          <Text style={[styles.viewButtonText, selectedView === 'actions' && styles.viewButtonTextActive]}>
            Actions
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedView === 'overview' && renderOverview()}
        {selectedView === 'alerts' && renderAlertSummary()}
        {selectedView === 'actions' && renderQuickActions()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    ...(Platform.OS === 'web' && { height: '100vh' })
  },
  header: {
    backgroundColor: '#1e40af',
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#93c5fd',
    fontWeight: '500',
  },
  viewSelector: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  viewButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  viewButtonActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#1e40af',
  },
  viewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  viewButtonTextActive: {
    color: '#1e40af',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: Platform.OS === 'web' ? '1 1 45%' : 1,
    minWidth: Platform.OS === 'web' ? 200 : '45%',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    position: 'relative',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    textAlign: 'center',
  },
  healthStatus: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  statusIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  alertBanner: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  alertBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: 4,
  },
  alertBannerText: {
    fontSize: 14,
    color: '#991b1b',
    marginBottom: 2,
  },
  alertBannerTime: {
    fontSize: 12,
    color: '#7f1d1d',
    fontWeight: '500',
  },
  alertList: {
    gap: 12,
  },
  alertItem: {
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#1e40af',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  alertTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginRight: 12,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  alertLocation: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  alertRoutes: {
    fontSize: 12,
    color: '#64748b',
  },
  noAlertsContainer: {
    alignItems: 'center',
    padding: 32,
  },
  noAlertsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 4,
  },
  noAlertsSubtext: {
    fontSize: 14,
    color: '#64748b',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: Platform.OS === 'web' ? '1 1 30%' : 1,
    minWidth: Platform.OS === 'web' ? 150 : '45%',
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    padding: 32,
  },
});

export default ControlDashboard;