// Go_BARRY/components/MonitoringDashboard.jsx
// System Monitoring Dashboard for Admin Supervisors

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

const MonitoringDashboard = ({ supervisorInfo }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('today');
  const [metrics, setMetrics] = useState({
    activeUsers: 0,
    totalActivities: 0,
    alertsDismissed: 0,
    apiLatency: 0
  });
  const [systemStatus, setSystemStatus] = useState({
    api: 'checking',
    database: 'checking',
    websocket: 'checking',
    cache: 'checking'
  });
  const [dataSources, setDataSources] = useState({
    tomtom: 'checking',
    highways: 'checking',
    streetmanager: 'checking',
    incidents: 'checking'
  });
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityBreakdown, setActivityBreakdown] = useState({});
  const [error, setError] = useState(null);

  // Fetch all monitoring data
  const fetchMonitoringData = async () => {
    try {
      setError(null);
      
      // Fetch data from multiple endpoints
      const [healthRes, activeRes, summaryRes, logsRes] = await Promise.all([
        fetch('https://go-barry.onrender.com/api/health-extended'),
        fetch('https://go-barry.onrender.com/api/supervisor/active'),
        fetch(`https://go-barry.onrender.com/api/activity-logs/summary?timeRange=${timeRange}`),
        fetch('https://go-barry.onrender.com/api/activity/logs?limit=10')
      ]);

      if (!healthRes.ok || !activeRes.ok || !summaryRes.ok || !logsRes.ok) {
        throw new Error('Failed to fetch monitoring data');
      }

      const healthData = await healthRes.json();
      const activeData = await activeRes.json();
      const summaryData = await summaryRes.json();
      const logsData = await logsRes.json();

      // Update metrics
      setMetrics({
        activeUsers: activeData.activeSupervisors?.length || 0,
        totalActivities: summaryData.summary?.totalActivities || 0,
        alertsDismissed: summaryData.summary?.byAction?.alert_dismissed || 0,
        apiLatency: healthData.services?.tomtom?.responseTime || healthData.responseTime || 0
      });

      // Update system status
      setSystemStatus({
        api: healthData.status === 'operational' ? 'operational' : 'error',
        database: healthData.services?.supabase?.status === 'operational' ? 'operational' : 'error',
        websocket: healthData.services?.webSocket?.connected ? 'operational' : 'error',
        cache: 'operational' // Default to operational
      });

      // Update data sources
      setDataSources({
        tomtom: healthData.services?.tomtom?.operational !== false ? 'operational' : 'error',
        highways: healthData.services?.nationalHighways?.operational !== false ? 'operational' : 'error',
        streetmanager: healthData.services?.streetManager?.status !== 'error' ? 'operational' : 'error',
        incidents: 'operational' // Manual incidents are always operational
      });

      // Update activity logs
      if (logsData.logs) {
        setActivityLogs(logsData.logs.slice(0, 10));
      }

      // Update activity breakdown
      if (summaryData.summary?.byAction) {
        setActivityBreakdown(summaryData.summary.byAction);
      }

    } catch (err) {
      console.error('Monitoring data fetch error:', err);
      setError('Failed to load monitoring data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchMonitoringData, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMonitoringData();
  };

  const formatActionName = (action) => {
    const actionMap = {
      'supervisor_login': 'Login',
      'supervisor_logout': 'Logout',
      'alert_dismissed': 'Dismissed',
      'session_timeout': 'Timeout',
      'display_screen_view': 'Display View',
      'roadwork_created': 'Roadwork',
      'email_sent': 'Email'
    };
    return actionMap[action] || action.replace(/_/g, ' ');
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    return status === 'operational' ? '#10b981' : '#ef4444';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading system metrics...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>System Monitoring</Text>
        <View style={styles.adminBadge}>
          <Text style={styles.adminText}>ADMIN VIEW</Text>
        </View>
      </View>

      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        {['today', 'week', 'month'].map((range) => (
          <TouchableOpacity
            key={range}
            style={[
              styles.timeButton,
              timeRange === range && styles.timeButtonActive
            ]}
            onPress={() => setTimeRange(range)}
          >
            <Text style={[
              styles.timeButtonText,
              timeRange === range && styles.timeButtonTextActive
            ]}>
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {/* Key Metrics */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{metrics.activeUsers}</Text>
          <Text style={styles.metricLabel}>Active Users</Text>
          <Text style={styles.metricSubtext}>Currently online</Text>
        </View>
        
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{metrics.totalActivities}</Text>
          <Text style={styles.metricLabel}>Activities</Text>
          <Text style={styles.metricSubtext}>This {timeRange}</Text>
        </View>
        
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{metrics.alertsDismissed}</Text>
          <Text style={styles.metricLabel}>Dismissed</Text>
          <Text style={styles.metricSubtext}>Alerts handled</Text>
        </View>
        
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{metrics.apiLatency}ms</Text>
          <Text style={styles.metricLabel}>Latency</Text>
          <Text style={styles.metricSubtext}>API response</Text>
        </View>
      </View>

      {/* Activity Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity Breakdown</Text>
        <View style={styles.activityBreakdown}>
          {Object.entries(activityBreakdown).map(([action, count]) => (
            <View key={action} style={styles.activityItem}>
              <Text style={styles.activityName}>{formatActionName(action)}</Text>
              <View style={styles.activityBarContainer}>
                <View 
                  style={[
                    styles.activityBar,
                    { 
                      width: `${(count / metrics.totalActivities) * 100}%`,
                      backgroundColor: '#3b82f6'
                    }
                  ]}
                />
              </View>
              <Text style={styles.activityCount}>{count}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* System Status */}
      <View style={styles.statusGrid}>
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>System Status</Text>
          
          <View style={styles.statusItem}>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(systemStatus.api) }]} />
            <Text style={styles.statusLabel}>Backend API</Text>
            <Text style={styles.statusValue}>
              {systemStatus.api === 'operational' ? 'Operational' : 'Error'}
            </Text>
          </View>
          
          <View style={styles.statusItem}>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(systemStatus.database) }]} />
            <Text style={styles.statusLabel}>Database</Text>
            <Text style={styles.statusValue}>
              {systemStatus.database === 'operational' ? 'Connected' : 'Error'}
            </Text>
          </View>
          
          <View style={styles.statusItem}>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(systemStatus.websocket) }]} />
            <Text style={styles.statusLabel}>WebSocket</Text>
            <Text style={styles.statusValue}>
              {systemStatus.websocket === 'operational' ? 'Active' : 'Disconnected'}
            </Text>
          </View>
          
          <View style={styles.statusItem}>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(systemStatus.cache) }]} />
            <Text style={styles.statusLabel}>Cache</Text>
            <Text style={styles.statusValue}>
              {systemStatus.cache === 'operational' ? 'Optimal' : 'Degraded'}
            </Text>
          </View>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Data Sources</Text>
          
          <View style={styles.statusItem}>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(dataSources.tomtom) }]} />
            <Text style={styles.statusLabel}>TomTom</Text>
            <Text style={styles.statusValue}>
              {dataSources.tomtom === 'operational' ? 'Active' : 'Error'}
            </Text>
          </View>
          
          <View style={styles.statusItem}>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(dataSources.highways) }]} />
            <Text style={styles.statusLabel}>Highways</Text>
            <Text style={styles.statusValue}>
              {dataSources.highways === 'operational' ? 'Active' : 'Error'}
            </Text>
          </View>
          
          <View style={styles.statusItem}>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(dataSources.streetmanager) }]} />
            <Text style={styles.statusLabel}>StreetManager</Text>
            <Text style={styles.statusValue}>
              {dataSources.streetmanager === 'operational' ? 'Active' : 'Error'}
            </Text>
          </View>
          
          <View style={styles.statusItem}>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(dataSources.incidents) }]} />
            <Text style={styles.statusLabel}>Incidents</Text>
            <Text style={styles.statusValue}>
              {dataSources.incidents === 'operational' ? 'Active' : 'Error'}
            </Text>
          </View>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {activityLogs.length > 0 ? (
          activityLogs.map((log, index) => (
            <View key={log.id || index} style={styles.logItem}>
              <Text style={styles.logTime}>{formatTime(log.created_at)}</Text>
              <Text style={styles.logAction}>{formatActionName(log.action)}</Text>
              <Text style={styles.logUser}>{log.supervisor_name || 'System'}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noActivityText}>No recent activity</Text>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Monitoring data refreshes every 30 seconds
        </Text>
        <Text style={styles.footerText}>
          Logged in as: {supervisorInfo?.name} ({supervisorInfo?.badge})
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  adminBadge: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  adminText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  timeButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  timeButtonActive: {
    backgroundColor: '#3b82f6',
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  timeButtonTextActive: {
    color: '#ffffff',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  metricCard: {
    width: '50%',
    padding: 8,
  },
  metricCardInner: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  metricValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#3b82f6',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  metricSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  section: {
    margin: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  activityBreakdown: {
    marginTop: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityName: {
    width: 100,
    fontSize: 12,
    color: '#4b5563',
  },
  activityBarContainer: {
    flex: 1,
    height: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  activityBar: {
    height: '100%',
    borderRadius: 10,
  },
  activityCount: {
    width: 30,
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'right',
  },
  statusGrid: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  statusCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  statusLabel: {
    flex: 1,
    fontSize: 14,
    color: '#6b7280',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  logItem: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  logTime: {
    width: 60,
    fontSize: 12,
    color: '#6b7280',
  },
  logAction: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    marginHorizontal: 12,
  },
  logUser: {
    fontSize: 12,
    color: '#6b7280',
  },
  noActivityText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6b7280',
    paddingVertical: 20,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
});

export default MonitoringDashboard;