// Go_BARRY/components/Dashboard.jsx
// SIMPLIFIED VERSION - No external hooks to avoid errors

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Dashboard = () => {
  console.log('🔧 Dashboard starting...');
  
  // Local state instead of hook
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Simple fetch function
  const fetchAlerts = async () => {
    try {
      console.log('🔧 Dashboard fetching alerts...');
      setError(null);
      
      const response = await fetch('https://go-barry.onrender.com/api/alerts');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🔧 Dashboard received data:', data);
      
      if (data.success && data.alerts) {
        setAlerts(data.alerts);
        setLastUpdated(new Date().toISOString());
        console.log(`✅ Dashboard loaded ${data.alerts.length} alerts`);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('❌ Dashboard fetch error:', err);
      setError(err.message);
      Alert.alert('Error', `Failed to fetch alerts: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    console.log('🔧 Dashboard effect running...');
    fetchAlerts();
  }, []);

  // Manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAlerts();
  };

  // Process alerts safely
  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  
  // Create all the arrays Dashboard needs
  const trafficAlerts = safeAlerts;
  const roadworkAlerts = safeAlerts.filter(alert => 
    alert && typeof alert === 'object' && alert.type === 'roadwork'
  );
  const incidentAlerts = safeAlerts.filter(alert => 
    alert && typeof alert === 'object' && alert.type === 'incident'
  );
  const congestionAlerts = safeAlerts.filter(alert => 
    alert && typeof alert === 'object' && alert.type === 'congestion'
  );
  const criticalAlerts = safeAlerts.filter(alert => 
    alert && typeof alert === 'object' && alert.status === 'red' && alert.severity === 'High'
  );
  const activeAlerts = safeAlerts.filter(alert => 
    alert && typeof alert === 'object' && alert.status === 'red'
  );

  console.log('🔧 Dashboard arrays created:', {
    trafficAlerts: trafficAlerts.length,
    roadworkAlerts: roadworkAlerts.length,
    incidentAlerts: incidentAlerts.length,
    criticalAlerts: criticalAlerts.length,
    activeAlerts: activeAlerts.length
  });

  // Calculate dashboard metrics from live data
  const dashboardMetrics = useMemo(() => {
    console.log('🔧 Dashboard calculating metrics...');
    
    const totalAlerts = trafficAlerts.reduce((sum, alert) => sum + 1, 0);
    const highPriorityCount = criticalAlerts.length;
    const activeCount = activeAlerts.length;
    
    // Routes analysis
    const routeImpact = {};
    trafficAlerts.forEach(alert => {
      if (alert && alert.affectsRoutes && Array.isArray(alert.affectsRoutes)) {
        alert.affectsRoutes.forEach(route => {
          routeImpact[route] = (routeImpact[route] || 0) + 1;
        });
      }
    });
    
    const topAffectedRoutes = Object.entries(routeImpact)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([route, count]) => ({ route, count }));

    return {
      totalAlerts,
      highPriorityCount,
      activeCount,
      topAffectedRoutes,
      lastUpdate: lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Unknown'
    };
  }, [trafficAlerts, criticalAlerts, activeAlerts, lastUpdated]);

  console.log('🔧 Dashboard metrics:', dashboardMetrics);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading traffic data...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#2563EB']}
          tintColor="#2563EB"
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🚦 Traffic Control Centre</Text>
        <Text style={styles.subtitle}>Live traffic intelligence for Go North East</Text>
        {lastUpdated && (
          <Text style={styles.lastUpdate}>
            Last updated: {new Date(lastUpdated).toLocaleTimeString()}
          </Text>
        )}
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="alert-circle" size={24} color="#EF4444" />
          <Text style={styles.statNumber}>{dashboardMetrics.totalAlerts}</Text>
          <Text style={styles.statLabel}>Total Alerts</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="warning" size={24} color="#F59E0B" />
          <Text style={styles.statNumber}>{dashboardMetrics.activeCount}</Text>
          <Text style={styles.statLabel}>Active Now</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="flame" size={24} color="#DC2626" />
          <Text style={styles.statNumber}>{dashboardMetrics.highPriorityCount}</Text>
          <Text style={styles.statLabel}>Critical</Text>
        </View>
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={20} color="#EF4444" />
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Alert Types Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alert Types</Text>
        <View style={styles.alertTypesContainer}>
          <View style={styles.alertTypeCard}>
            <Text style={styles.alertTypeEmoji}>🚧</Text>
            <Text style={styles.alertTypeCount}>{roadworkAlerts.length}</Text>
            <Text style={styles.alertTypeLabel}>Roadworks</Text>
          </View>
          
          <View style={styles.alertTypeCard}>
            <Text style={styles.alertTypeEmoji}>🚨</Text>
            <Text style={styles.alertTypeCount}>{incidentAlerts.length}</Text>
            <Text style={styles.alertTypeLabel}>Incidents</Text>
          </View>
          
          <View style={styles.alertTypeCard}>
            <Text style={styles.alertTypeEmoji}>🚗</Text>
            <Text style={styles.alertTypeCount}>{congestionAlerts.length}</Text>
            <Text style={styles.alertTypeLabel}>Traffic</Text>
          </View>
        </View>
      </View>

      {/* Most Affected Routes */}
      {dashboardMetrics.topAffectedRoutes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Most Affected Routes</Text>
          {dashboardMetrics.topAffectedRoutes.map((item, index) => (
            <View key={index} style={styles.routeItem}>
              <Text style={styles.routeNumber}>{item.route}</Text>
              <Text style={styles.routeCount}>{item.count} alerts</Text>
            </View>
          ))}
        </View>
      )}

      {/* Recent Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Critical Alerts</Text>
          {criticalAlerts.slice(0, 3).map((alert, index) => (
            <View key={index} style={styles.alertItem}>
              <View style={styles.alertHeader}>
                <Text style={styles.alertTitle}>{alert.title || 'Alert'}</Text>
                <Text style={styles.alertStatus}>{alert.status?.toUpperCase()}</Text>
              </View>
              <Text style={styles.alertLocation}>{alert.location}</Text>
              {alert.affectsRoutes && alert.affectsRoutes.length > 0 && (
                <Text style={styles.alertRoutes}>
                  Routes: {alert.affectsRoutes.join(', ')}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* System Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Status</Text>
        <View style={styles.statusItem}>
          <Text style={styles.statusIndicator}>🟢</Text>
          <Text style={styles.statusText}>Data feeds operational</Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={styles.statusIndicator}>🟢</Text>
          <Text style={styles.statusText}>API connectivity normal</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
  header: {
    backgroundColor: '#1E293B',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
  },
  lastUpdate: {
    fontSize: 12,
    color: '#64748B',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#DC2626',
    fontSize: 14,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  alertTypesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  alertTypeCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
  },
  alertTypeEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  alertTypeCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  alertTypeLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  routeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  routeNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
  },
  routeCount: {
    fontSize: 14,
    color: '#64748B',
  },
  alertItem: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  alertStatus: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#DC2626',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  alertLocation: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  alertRoutes: {
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: '500',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  statusIndicator: {
    fontSize: 12,
  },
  statusText: {
    fontSize: 14,
    color: '#64748B',
  },
});

export default Dashboard;