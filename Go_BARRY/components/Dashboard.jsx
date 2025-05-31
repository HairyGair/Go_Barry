// Go_BARRY/components/Dashboard.jsx
// BARRY Live Dashboard - Shows live traffic intelligence overview
// NO SAMPLE DATA - All data comes from live APIs

import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBarryAPI } from './hooks/useBARRYapi'; // Fixed import

const Dashboard = () => {
  const {
    alerts,
    statistics,
    systemHealth,
    trafficIntelligence,
    loading,
    error,
    lastUpdated,
    refreshing,
    refreshAllData,
    forceRefresh,
    getCriticalAlerts,
    getTrafficAlerts,
    getRoadworks,
    hasLiveData,
    isSystemHealthy,
    activeSourcesCount,
    totalSourcesCount,
    mostAffectedRoutes
  } = useBarryAPI(); // Hook now auto-refreshes, no parameters needed

  // Calculate dashboard metrics from live data
  const dashboardMetrics = useMemo(() => {
    const criticalAlerts = getCriticalAlerts();
    const trafficAlerts = getTrafficAlerts();
    const roadworkAlerts = getRoadworks();
    
    // Calculate severity distribution
    const severityCount = {
      high: alerts.filter(a => a.severity === 'High').length,
      medium: alerts.filter(a => a.severity === 'Medium').length,
      low: alerts.filter(a => a.severity === 'Low').length
    };

    // Calculate status distribution
    const statusCount = {
      red: alerts.filter(a => a.status === 'red').length,
      amber: alerts.filter(a => a.status === 'amber').length,
      green: alerts.filter(a => a.status === 'green').length
    };

    // Calculate route impact analysis
    const routeImpacts = {};
    alerts.forEach(alert => {
      if (alert.affectsRoutes && Array.isArray(alert.affectsRoutes)) {
        alert.affectsRoutes.forEach(route => {
          if (!routeImpacts[route]) {
            routeImpacts[route] = { count: 0, critical: 0, routes: [] };
          }
          routeImpacts[route].count++;
          if (alert.status === 'red' || alert.severity === 'High') {
            routeImpacts[route].critical++;
          }
        });
      }
    });

    // Get top 5 most affected routes
    const topAffectedRoutes = Object.entries(routeImpacts)
      .sort(([,a], [,b]) => (b.critical * 2 + b.count) - (a.critical * 2 + a.count))
      .slice(0, 5)
      .map(([route, impact]) => ({ route, ...impact }));

    return {
      totalAlerts: alerts.length,
      criticalCount: criticalAlerts.length,
      trafficCount: trafficAlerts.length,
      roadworkCount: roadworkAlerts.length,
      severityCount,
      statusCount,
      topAffectedRoutes,
      averageDelay: trafficAlerts.reduce((sum, alert) => sum + (alert.delayMinutes || 0), 0) / Math.max(trafficAlerts.length, 1),
      congestionLevel: trafficAlerts.reduce((sum, alert) => sum + (alert.congestionLevel || 0), 0) / Math.max(trafficAlerts.length, 1)
    };
  }, [alerts, getCriticalAlerts, getTrafficAlerts, getRoadworks]);

  // Format last updated time
  const formatLastUpdated = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  };

  // Get status color
  const getStatusColor = (count, type = 'default') => {
    if (type === 'critical' && count > 0) return '#ff6b6b';
    if (type === 'warning' && count > 3) return '#ffa726';
    if (count === 0) return '#00ff88';
    return '#64b5f6';
  };

  // Render metric card
  const renderMetricCard = (title, value, subtitle, icon, status = 'default') => (
    <View style={[styles.metricCard, { borderLeftColor: getStatusColor(value, status) }]}>
      <View style={styles.metricHeader}>
        <Ionicons name={icon} size={24} color={getStatusColor(value, status)} />
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
      <Text style={[styles.metricValue, { color: getStatusColor(value, status) }]}>
        {value}
      </Text>
      {subtitle && (
        <Text style={styles.metricSubtitle}>{subtitle}</Text>
      )}
    </View>
  );

  // Render system status
  const renderSystemStatus = () => (
    <View style={styles.systemStatus}>
      <View style={styles.statusHeader}>
        <Text style={styles.sectionTitle}>System Status</Text>
        <TouchableOpacity onPress={forceRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.statusGrid}>
        <View style={styles.statusItem}>
          <Ionicons 
            name={isSystemHealthy ? "checkmark-circle" : "warning"} 
            size={20} 
            color={isSystemHealthy ? "#00ff88" : "#ff6b6b"} 
          />
          <Text style={styles.statusText}>
            System {isSystemHealthy ? 'Healthy' : 'Issues'}
          </Text>
        </View>
        
        <View style={styles.statusItem}>
          <Ionicons name="radio" size={20} color="#64b5f6" />
          <Text style={styles.statusText}>
            {activeSourcesCount}/{totalSourcesCount} Sources
          </Text>
        </View>
        
        <View style={styles.statusItem}>
          <Ionicons name="time" size={20} color="#888" />
          <Text style={styles.statusText}>
            {formatLastUpdated(lastUpdated)}
          </Text>
        </View>
        
        <View style={styles.statusItem}>
          <Ionicons 
            name={hasLiveData ? "radio" : "radio-outline"} 
            size={20} 
            color={hasLiveData ? "#00ff88" : "#888"} 
          />
          <Text style={styles.statusText}>
            {hasLiveData ? 'Live Data' : 'No Data'}
          </Text>
        </View>
      </View>
    </View>
  );

  // Render affected routes
  const renderAffectedRoutes = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Most Affected Routes</Text>
      {dashboardMetrics.topAffectedRoutes.length > 0 ? (
        <View style={styles.routesList}>
          {dashboardMetrics.topAffectedRoutes.map(({ route, count, critical }) => (
            <View key={route} style={styles.routeItem}>
              <View style={styles.routeBadge}>
                <Text style={styles.routeText}>{route}</Text>
              </View>
              <View style={styles.routeStats}>
                <Text style={styles.routeCount}>{count} alerts</Text>
                {critical > 0 && (
                  <Text style={styles.routeCritical}>{critical} critical</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.noDataText}>No route impacts detected</Text>
      )}
    </View>
  );

  // Render loading state
  if (loading && !hasLiveData) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00ff88" />
          <Text style={styles.loadingText}>Loading live dashboard...</Text>
          <Text style={styles.loadingSubtext}>
            Connecting to traffic intelligence sources
          </Text>
        </View>
      </View>
    );
  }

  // Render error state
  if (error && !hasLiveData) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color="#ff6b6b" />
          <Text style={styles.errorTitle}>Dashboard Unavailable</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={refreshAllData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Render main dashboard
  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refreshAllData}
          colors={['#00ff88']}
          tintColor="#00ff88"
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Traffic Intelligence</Text>
        <Text style={styles.headerSubtitle}>Live Overview</Text>
      </View>

      {renderSystemStatus()}

      {/* Main Metrics Grid */}
      <View style={styles.metricsGrid}>
        {renderMetricCard(
          'Total Alerts',
          dashboardMetrics.totalAlerts,
          'All active alerts',
          'list',
          'default'
        )}
        
        {renderMetricCard(
          'Critical Issues',
          dashboardMetrics.criticalCount,
          'Require immediate attention',
          'warning',
          'critical'
        )}
        
        {renderMetricCard(
          'Traffic Incidents',
          dashboardMetrics.trafficCount,
          'Active congestion & incidents',
          'car',
          'warning'
        )}
        
        {renderMetricCard(
          'Roadworks',
          dashboardMetrics.roadworkCount,
          'Active construction',
          'construct',
          'default'
        )}
      </View>

      {/* Traffic Intelligence Metrics */}
      {hasLiveData && (
        <View style={styles.trafficMetrics}>
          <Text style={styles.sectionTitle}>Traffic Intelligence</Text>
          <View style={styles.intelligenceGrid}>
            {renderMetricCard(
              'Avg Delay',
              `${Math.round(dashboardMetrics.averageDelay)}m`,
              'Across affected routes',
              'time',
              dashboardMetrics.averageDelay > 15 ? 'critical' : 'default'
            )}
            
            {renderMetricCard(
              'Congestion Level',
              `${Math.round(dashboardMetrics.congestionLevel)}/10`,
              'Network-wide average',
              'speedometer',
              dashboardMetrics.congestionLevel > 7 ? 'critical' : 'warning'
            )}
          </View>
        </View>
      )}

      {/* Status Distribution */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alert Distribution</Text>
        <View style={styles.distributionGrid}>
          <View style={styles.distributionItem}>
            <View style={[styles.statusIndicator, { backgroundColor: '#ff6b6b' }]} />
            <Text style={styles.distributionLabel}>Active: {dashboardMetrics.statusCount.red}</Text>
          </View>
          <View style={styles.distributionItem}>
            <View style={[styles.statusIndicator, { backgroundColor: '#ffa726' }]} />
            <Text style={styles.distributionLabel}>Upcoming: {dashboardMetrics.statusCount.amber}</Text>
          </View>
          <View style={styles.distributionItem}>
            <View style={[styles.statusIndicator, { backgroundColor: '#00ff88' }]} />
            <Text style={styles.distributionLabel}>Planned: {dashboardMetrics.statusCount.green}</Text>
          </View>
        </View>
      </View>

      {/* Most Affected Routes */}
      {renderAffectedRoutes()}

      {/* Data Sources Status */}
      {systemHealth && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Sources</Text>
          <View style={styles.sourcesStatus}>
            <Text style={styles.sourcesText}>
              Street Manager: {systemHealth.dataSources?.streetManager?.enabled ? '✅' : '❌'}
            </Text>
            <Text style={styles.sourcesText}>
              National Highways: {systemHealth.dataSources?.nationalHighways?.configured ? '✅' : '❌'}
            </Text>
            <Text style={styles.sourcesText}>
              HERE Traffic: {systemHealth.dataSources?.here?.configured ? '✅' : '❌'}
            </Text>
            <Text style={styles.sourcesText}>
              MapQuest: {systemHealth.dataSources?.mapquest?.configured ? '✅' : '❌'}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a'
  },
  header: {
    padding: 20,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#888'
  },
  systemStatus: {
    margin: 15,
    padding: 15,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333'
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  refreshButton: {
    padding: 8,
    backgroundColor: '#333',
    borderRadius: 6
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '48%',
    marginBottom: 10
  },
  statusText: {
    fontSize: 14,
    color: '#ffffff'
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
    gap: 15
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderColor: '#333'
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10
  },
  metricTitle: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500'
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5
  },
  metricSubtitle: {
    fontSize: 12,
    color: '#666'
  },
  trafficMetrics: {
    margin: 15,
    marginTop: 0
  },
  intelligenceGrid: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 10
  },
  section: {
    margin: 15,
    padding: 15,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333'
  },
  distributionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15
  },
  distributionItem: {
    alignItems: 'center',
    gap: 8
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6
  },
  distributionLabel: {
    fontSize: 12,
    color: '#ffffff'
  },
  routesList: {
    marginTop: 10,
    gap: 8
  },
  routeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#333',
    borderRadius: 8
  },
  routeBadge: {
    backgroundColor: '#00ff88',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  routeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000'
  },
  routeStats: {
    alignItems: 'flex-end'
  },
  routeCount: {
    fontSize: 12,
    color: '#ffffff'
  },
  routeCritical: {
    fontSize: 11,
    color: '#ff6b6b'
  },
  sourcesStatus: {
    marginTop: 10,
    gap: 5
  },
  sourcesText: {
    fontSize: 14,
    color: '#ffffff'
  },
  noDataText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 10
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  loadingText: {
    fontSize: 18,
    color: '#ffffff',
    marginTop: 15,
    textAlign: 'center'
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
    textAlign: 'center'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  errorTitle: {
    fontSize: 18,
    color: '#ff6b6b',
    marginTop: 15,
    textAlign: 'center',
    fontWeight: 'bold'
  },
  errorText: {
    fontSize: 14,
    color: '#888',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 20
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#ff6b6b',
    borderRadius: 6
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: 'bold'
  }
});

export default Dashboard;