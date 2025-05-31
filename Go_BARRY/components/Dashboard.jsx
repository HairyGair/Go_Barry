// traffic-watch/components/Dashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const Dashboard = ({ 
  baseUrl = 'https://go-barry.onrender.com',
  onAlertPress = null,
  onViewAllPress = null,
  autoRefreshInterval = 30000, // 30 seconds
  style = {}
}) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  // Auto-refresh timer
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData(true); // Silent refresh
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshInterval]);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setRefreshing(true);
      }
      setError(null);

      // Fetch main alerts data
      const alertsResponse = await fetch(`${baseUrl}/api/alerts`);
      
      if (!alertsResponse.ok) {
        throw new Error(`Alerts API: HTTP ${alertsResponse.status}`);
      }

      const alertsData = await alertsResponse.json();

      // Fetch system health
      const healthResponse = await fetch(`${baseUrl}/api/health`);
      let healthData = null;
      
      if (healthResponse.ok) {
        healthData = await healthResponse.json();
      }

      if (alertsData.success) {
        setDashboardData(alertsData);
        setSystemStatus(healthData);
        setLastRefresh(new Date());
        setIsOnline(true);
      } else {
        throw new Error(alertsData.error || 'Invalid response format');
      }

    } catch (err) {
      setError(err.message);
      setIsOnline(false);
      console.error('Dashboard fetch error:', err);
      
      if (!silent) {
        Alert.alert(
          'Connection Error',
          'Unable to fetch dashboard data. Please check your connection.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [baseUrl]);

  // Force refresh via backend
  const forceRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      
      // Trigger backend refresh
      await fetch(`${baseUrl}/api/refresh`);
      
      // Fetch updated data
      await fetchDashboardData(false);
      
    } catch (err) {
      console.error('Force refresh error:', err);
      await fetchDashboardData(false);
    }
  }, [baseUrl, fetchDashboardData]);

  // Initial load
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Get route impact analysis
  const getRouteImpactAnalysis = useCallback(() => {
    if (!dashboardData?.alerts) return [];

    const routeImpacts = {};
    
    dashboardData.alerts.forEach(alert => {
      if (alert.affectsRoutes && alert.status === 'red') {
        alert.affectsRoutes.forEach(route => {
          if (!routeImpacts[route]) {
            routeImpacts[route] = {
              route,
              incidents: 0,
              roadworks: 0,
              highSeverity: 0,
              totalAlerts: 0
            };
          }
          
          routeImpacts[route].totalAlerts++;
          
          if (alert.type === 'incident') {
            routeImpacts[route].incidents++;
          } else {
            routeImpacts[route].roadworks++;
          }
          
          if (alert.severity === 'High') {
            routeImpacts[route].highSeverity++;
          }
        });
      }
    });

    return Object.values(routeImpacts)
      .sort((a, b) => b.totalAlerts - a.totalAlerts)
      .slice(0, 8);
  }, [dashboardData]);

  // Get recent critical alerts
  const getRecentCriticalAlerts = useCallback(() => {
    if (!dashboardData?.alerts) return [];

    return dashboardData.alerts
      .filter(alert => alert.status === 'red' && alert.severity === 'High')
      .sort((a, b) => new Date(b.lastUpdated || b.startDate || 0) - new Date(a.lastUpdated || a.startDate || 0))
      .slice(0, 5);
  }, [dashboardData]);

  // Render loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#60A5FA" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  const stats = dashboardData?.metadata?.statistics || {};
  const sources = dashboardData?.metadata?.sources || {};
  const routeImpacts = getRouteImpactAnalysis();
  const criticalAlerts = getRecentCriticalAlerts();

  return (
    <ScrollView 
      style={[styles.container, style]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={fetchDashboardData}
          colors={['#60A5FA']}
          tintColor="#60A5FA"
          title="Updating dashboard..."
          titleColor="#9CA3AF"
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header with Status */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>🚦 BARRY Control Room</Text>
          <View style={styles.statusRow}>
            {isOnline ? (
              <Ionicons name="wifi" size={16} color="#10B981" />
            ) : (
              <Ionicons name="wifi-off" size={16} color="#EF4444" />
            )}
            <Text style={[styles.statusText, { color: isOnline ? '#10B981' : '#EF4444' }]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
            {lastRefresh && (
              <Text style={styles.lastUpdateText}>
                • Updated {lastRefresh.toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </Text>
            )}
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={forceRefresh}
          disabled={refreshing}
        >
          <Ionicons
            name="refresh"
            size={20}
            color="#60A5FA"
            style={refreshing ? { opacity: 0.5 } : {}}
          />
        </TouchableOpacity>
      </View>

      {/* Alert Statistics Cards */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.criticalCard]}>
          <Ionicons name="warning" size={24} color="#EF4444" />
          <Text style={styles.statNumber}>{stats.activeAlerts || 0}</Text>
          <Text style={styles.statLabel}>Active Alerts</Text>
          <Text style={styles.statSubtext}>Requiring attention</Text>
        </View>

        <View style={[styles.statCard, styles.warningCard]}>
          <Ionicons name="time" size={24} color="#F59E0B" />
          <Text style={styles.statNumber}>{stats.upcomingAlerts || 0}</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
          <Text style={styles.statSubtext}>Within 7 days</Text>
        </View>

        <View style={[styles.statCard, styles.infoCard]}>
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          <Text style={styles.statNumber}>{stats.plannedAlerts || 0}</Text>
          <Text style={styles.statLabel}>Planned</Text>
          <Text style={styles.statSubtext}>Future works</Text>
        </View>

        <View style={[styles.statCard, styles.totalCard]}>
          <Ionicons name="pulse" size={24} color="#60A5FA" />
          <Text style={styles.statNumber}>{dashboardData?.metadata?.totalAlerts || 0}</Text>
          <Text style={styles.statLabel}>Total Alerts</Text>
          <Text style={styles.statSubtext}>All sources</Text>
        </View>
      </View>

      {/* Severity Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Severity Breakdown</Text>
        <View style={styles.severityGrid}>
          <View style={styles.severityItem}>
            <View style={[styles.severityDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.severityLabel}>High</Text>
            <Text style={styles.severityCount}>{stats.highSeverity || 0}</Text>
          </View>
          <View style={styles.severityItem}>
            <View style={[styles.severityDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.severityLabel}>Medium</Text>
            <Text style={styles.severityCount}>{stats.mediumSeverity || 0}</Text>
          </View>
          <View style={styles.severityItem}>
            <View style={[styles.severityDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.severityLabel}>Low</Text>
            <Text style={styles.severityCount}>{stats.lowSeverity || 0}</Text>
          </View>
        </View>
      </View>

      {/* Data Sources Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Sources</Text>
        <View style={styles.sourcesGrid}>
          <View style={styles.sourceCard}>
            <View style={styles.sourceHeader}>
              <Ionicons name="server" size={20} color="#60A5FA" />
              <Text style={styles.sourceTitle}>National Highways</Text>
            </View>
            <Text style={styles.sourceCount}>{sources.nationalHighways?.count || 0} alerts</Text>
            <View style={styles.sourceStatusRow}>
              <View style={[
                styles.sourceStatusDot, 
                { backgroundColor: sources.nationalHighways?.success ? '#10B981' : '#EF4444' }
              ]} />
              <Text style={styles.sourceStatus}>
                {sources.nationalHighways?.success ? 'Connected' : 'Error'}
              </Text>
            </View>
            <Text style={styles.sourceMethod}>Direct API</Text>
          </View>

          <View style={styles.sourceCard}>
            <View style={styles.sourceHeader}>
              <Ionicons name="database" size={20} color="#8B5CF6" />
              <Text style={styles.sourceTitle}>Street Manager</Text>
            </View>
            <Text style={styles.sourceCount}>{sources.streetManager?.count || 0} works</Text>
            <View style={styles.sourceStatusRow}>
              <View style={[
                styles.sourceStatusDot, 
                { backgroundColor: sources.streetManager?.success ? '#10B981' : '#EF4444' }
              ]} />
              <Text style={styles.sourceStatus}>
                {sources.streetManager?.success ? 'Connected' : 'Error'}
              </Text>
            </View>
            <Text style={styles.sourceMethod}>AWS SNS</Text>
          </View>
        </View>
      </View>

      {/* Route Impact Analysis */}
      {routeImpacts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Routes Most Affected</Text>
          <Text style={styles.sectionSubtitle}>Active alerts only</Text>
          <View style={styles.routeGrid}>
            {routeImpacts.map((routeData, index) => (
              <View key={routeData.route} style={styles.routeCard}>
                <View style={styles.routeHeader}>
                  <Ionicons name="git-branch" size={16} color="#60A5FA" />
                  <Text style={styles.routeNumber}>{routeData.route}</Text>
                </View>
                <Text style={styles.routeAlertCount}>
                  {routeData.totalAlerts} alert{routeData.totalAlerts !== 1 ? 's' : ''}
                </Text>
                <View style={styles.routeBreakdown}>
                  {routeData.incidents > 0 && (
                    <Text style={styles.routeBreakdownText}>
                      {routeData.incidents} incident{routeData.incidents !== 1 ? 's' : ''}
                    </Text>
                  )}
                  {routeData.roadworks > 0 && (
                    <Text style={styles.routeBreakdownText}>
                      {routeData.roadworks} roadwork{routeData.roadworks !== 1 ? 's' : ''}
                    </Text>
                  )}
                </View>
                {routeData.highSeverity > 0 && (
                  <View style={styles.highSeverityBadge}>
                    <Ionicons name="flash" size={12} color="#EF4444" />
                    <Text style={styles.highSeverityText}>{routeData.highSeverity} high</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Recent Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Critical Alerts</Text>
            {onViewAllPress && (
              <TouchableOpacity onPress={onViewAllPress}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.sectionSubtitle}>High severity, active status</Text>
          
          {criticalAlerts.map((alert, index) => (
            <TouchableOpacity
              key={alert.id}
              style={styles.criticalAlert}
              onPress={onAlertPress ? () => onAlertPress(alert) : null}
              activeOpacity={0.7}
            >
              <View style={styles.criticalAlertHeader}>
                <Ionicons name="warning" size={16} color="#EF4444" />
                <Text style={styles.criticalAlertTitle} numberOfLines={1}>
                  {alert.title}
                </Text>
                <Text style={styles.criticalAlertTime}>
                  {new Date(alert.lastUpdated || alert.startDate).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
              <View style={styles.criticalAlertBody}>
                <Ionicons name="location" size={12} color="#9CA3AF" />
                <Text style={styles.criticalAlertLocation} numberOfLines={1}>
                  {alert.location}
                </Text>
              </View>
              {alert.affectsRoutes && alert.affectsRoutes.length > 0 && (
                <View style={styles.criticalAlertRoutes}>
                  <Text style={styles.routesLabel}>Routes: </Text>
                  <Text style={styles.routesList}>
                    {alert.affectsRoutes.slice(0, 6).join(', ')}
                    {alert.affectsRoutes.length > 6 && ` +${alert.affectsRoutes.length - 6} more`}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* System Performance */}
      {dashboardData?.metadata && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Performance</Text>
          <View style={styles.performanceGrid}>
            <View style={styles.performanceItem}>
              <Ionicons name="trending-up" size={16} color="#10B981" />
              <Text style={styles.performanceLabel}>Processing Time</Text>
              <Text style={styles.performanceValue}>
                {dashboardData.metadata.processingTime || 'N/A'}
              </Text>
            </View>
            <View style={styles.performanceItem}>
              <Ionicons name="calendar" size={16} color="#60A5FA" />
              <Text style={styles.performanceLabel}>Last Updated</Text>
              <Text style={styles.performanceValue}>
                {dashboardData.metadata.lastUpdated ? 
                  new Date(dashboardData.metadata.lastUpdated).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'N/A'
                }
              </Text>
            </View>
            <View style={styles.performanceItem}>
              <Ionicons name="people" size={16} color="#8B5CF6" />
              <Text style={styles.performanceLabel}>Incidents</Text>
              <Text style={styles.performanceValue}>{stats.totalIncidents || 0}</Text>
            </View>
            <View style={styles.performanceItem}>
              <Ionicons name="pulse" size={16} color="#F59E0B" />
              <Text style={styles.performanceLabel}>Roadworks</Text>
              <Text style={styles.performanceValue}>{stats.totalRoadworks || 0}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={24} color="#EF4444" />
          <Text style={styles.errorTitle}>Connection Issue</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDashboardData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 16,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  lastUpdateText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginLeft: 8,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#374151',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 44) / 2,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderLeftWidth: 4,
  },
  criticalCard: {
    borderLeftColor: '#EF4444',
  },
  warningCard: {
    borderLeftColor: '#F59E0B',
  },
  infoCard: {
    borderLeftColor: '#10B981',
  },
  totalCard: {
    borderLeftColor: '#60A5FA',
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  statSubtext: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  sectionSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 12,
  },
  viewAllText: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '500',
  },
  severityGrid: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'space-around',
  },
  severityItem: {
    alignItems: 'center',
  },
  severityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  severityLabel: {
    color: '#D1D5DB',
    fontSize: 14,
    marginBottom: 4,
  },
  severityCount: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sourcesGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  sourceCard: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
  },
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sourceTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  sourceCount: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sourceStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sourceStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  sourceStatus: {
    color: '#D1D5DB',
    fontSize: 14,
  },
  sourceMethod: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  routeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  routeCard: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    minWidth: (width - 44) / 3,
    flex: 1,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  routeNumber: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  routeAlertCount: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  routeBreakdown: {
    marginBottom: 4,
  },
  routeBreakdownText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  highSeverityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7F1D1D',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  highSeverityText: {
    color: '#FCA5A5',
    fontSize: 11,
    marginLeft: 2,
  },
  criticalAlert: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  criticalAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  criticalAlertTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginLeft: 8,
  },
  criticalAlertTime: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  criticalAlertBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  criticalAlertLocation: {
    color: '#D1D5DB',
    fontSize: 13,
    marginLeft: 6,
    flex: 1,
  },
  criticalAlertRoutes: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routesLabel: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  routesList: {
    color: '#60A5FA',
    fontSize: 12,
    flex: 1,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  performanceItem: {
    flex: 1,
    minWidth: (width - 44) / 2,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  performanceLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  performanceValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
    margin: 16,
    backgroundColor: '#7F1D1D',
    borderRadius: 12,
  },
  errorTitle: {
    color: '#FCA5A5',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  retryButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default Dashboard;