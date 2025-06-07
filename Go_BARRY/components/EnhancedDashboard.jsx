// Go_BARRY/components/EnhancedDashboard.jsx
// Enhanced Dashboard with Supervisor Integration and Real-time Analytics

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupervisorSession } from './hooks/useSupervisorSession';
import SupervisorLogin from './SupervisorLogin';

const { width } = Dimensions.get('window');

const EnhancedDashboard = () => {
  console.log('🔧 Enhanced Dashboard starting...');
  
  // Supervisor session
  const {
    supervisorSession,
    isLoggedIn,
    supervisorName,
    supervisorRole,
    getSupervisorActivity
  } = useSupervisorSession();

  // Local state
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showSupervisorLogin, setShowSupervisorLogin] = useState(false);
  const [supervisorActivity, setSupervisorActivity] = useState([]);

  // Enhanced API endpoint for supervisor integration with browser fallback
  const API_BASE_URL = (() => {
    if (typeof window !== 'undefined') {
      // Browser environment
      return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3001'
        : 'https://go-barry.onrender.com';
    } else {
      // React Native environment
      return process.env.EXPO_PUBLIC_API_BASE_URL || (__DEV__ 
        ? 'http://192.168.1.132:3001'
        : 'https://go-barry.onrender.com');
    }
  })();

  // Enhanced fetch function with supervisor awareness and FALLBACK STRATEGY
  const fetchAlerts = async () => {
    try {
      console.log('🔧 Enhanced Dashboard fetching alerts with cache busting...');
      setError(null);
      
      // STRATEGY: Try enhanced endpoint first with cache busting, fallback to main alerts endpoint
      let response;
      let endpoint;
      let fallbackUsed = false;
      
      try {
        // Try enhanced endpoint first with cache busting
        endpoint = '/api/alerts-enhanced';
        const url = `${API_BASE_URL}${endpoint}?t=${Date.now()}&no_cache=true`;
        console.log(`🎯 Trying enhanced endpoint with cache busting: ${url}`);
        
        response = await fetch(url, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Enhanced endpoint failed: HTTP ${response.status}`);
        }
        console.log('✅ Enhanced endpoint successful');
      } catch (enhancedError) {
        console.warn('⚠️ Enhanced endpoint failed, trying fallback:', enhancedError.message);
        
        // Fallback to main alerts endpoint with cache busting
        endpoint = '/api/alerts';
        const fallbackUrl = `${API_BASE_URL}${endpoint}?t=${Date.now()}&no_cache=true`;
        console.log(`🔄 Fallback to main endpoint: ${fallbackUrl}`);
        
        response = await fetch(fallbackUrl, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Accept': 'application/json',
          },
        });
        fallbackUsed = true;
        
        if (!response.ok) {
          throw new Error(`Main endpoint also failed: HTTP ${response.status}`);
        }
        console.log('✅ Fallback endpoint successful');
      }
      
      const data = await response.json();
      console.log('🔧 Enhanced Dashboard received data:', {
        success: data.success,
        alertsCount: data.alerts?.length || 0,
        endpoint: endpoint,
        fallbackUsed: fallbackUsed
      });
      
      if (data.success && data.alerts) {
        // Frontend filter as additional protection
        const filteredAlerts = data.alerts.filter(alert => {
          if (alert.id && (
            alert.id.includes('barry_v3') ||
            alert.id.includes('sample') ||
            alert.source === 'go_barry_v3' ||
            alert.enhanced === true
          )) {
            console.warn('🗑️ Dashboard filtered sample alert:', alert.id);
            return false;
          }
          return true;
        });
        
        setAlerts(filteredAlerts);
        setLastUpdated(new Date().toISOString());
        console.log(`✅ Enhanced Dashboard loaded ${data.alerts.length} → ${filteredAlerts.length} alerts from ${endpoint} (filtered ${data.alerts.length - filteredAlerts.length} samples)`);
        
        if (fallbackUsed) {
          console.log('ℹ️ Using fallback endpoint - enhanced features may be limited');
        }
        
        // Show enhanced features in metadata
        if (data.metadata) {
          console.log(`🔍 Enhanced locations: ${data.metadata.enhancedLocations || 0}`);
          console.log(`🚌 Enhanced routes: ${data.metadata.enhancedRoutes || 0}`);
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('❌ Enhanced Dashboard fetch error:', err);
      setError(err.message);
      
      // Don't show alert for expected 404 errors during development
      if (!err.message.includes('404')) {
        Alert.alert('Error', `Failed to fetch alerts: ${err.message}`);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load supervisor activity
  const loadSupervisorActivity = async () => {
    if (isLoggedIn) {
      try {
        const activity = await getSupervisorActivity(10);
        setSupervisorActivity(activity);
      } catch (error) {
        console.error('Failed to load supervisor activity:', error);
      }
    }
  };

  // Load data on mount and when supervisor status changes
  useEffect(() => {
    console.log('🔧 Enhanced Dashboard effect running...');
    fetchAlerts();
    loadSupervisorActivity();
  }, [isLoggedIn]);

  // Manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAlerts();
    await loadSupervisorActivity();
  };

  // Process alerts safely with enhanced data
  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  
  // Enhanced alert categorization
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
    alert && typeof alert === 'object' && 
    (alert.status === 'red' && (alert.calculatedSeverity === 'High' || alert.severity === 'High'))
  );
  const activeAlerts = safeAlerts.filter(alert => 
    alert && typeof alert === 'object' && alert.status === 'red'
  );
  const enhancedLocationAlerts = safeAlerts.filter(alert =>
    alert && alert.locationAccuracy === 'high'
  );
  const enhancedRouteAlerts = safeAlerts.filter(alert =>
    alert && alert.routeMatchMethod === 'enhanced'
  );

  console.log('🔧 Enhanced Dashboard arrays created:', {
    trafficAlerts: trafficAlerts.length,
    roadworkAlerts: roadworkAlerts.length,
    incidentAlerts: incidentAlerts.length,
    criticalAlerts: criticalAlerts.length,
    activeAlerts: activeAlerts.length,
    enhancedLocationAlerts: enhancedLocationAlerts.length,
    enhancedRouteAlerts: enhancedRouteAlerts.length
  });

  // Enhanced dashboard metrics with supervisor data
  const dashboardMetrics = useMemo(() => {
    console.log('🔧 Enhanced Dashboard calculating metrics...');
    
    const totalAlerts = trafficAlerts.length;
    const highPriorityCount = criticalAlerts.length;
    const activeCount = activeAlerts.length;
    const enhancedLocationCount = enhancedLocationAlerts.length;
    const enhancedRouteCount = enhancedRouteAlerts.length;
    
    // Routes analysis with enhanced accuracy
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

    // Enhanced metrics
    const locationAccuracyRate = totalAlerts > 0 ? 
      Math.round((enhancedLocationCount / totalAlerts) * 100) : 0;
    
    const routeAccuracyRate = totalAlerts > 0 ? 
      Math.round((enhancedRouteCount / totalAlerts) * 100) : 0;

    return {
      totalAlerts,
      highPriorityCount,
      activeCount,
      enhancedLocationCount,
      enhancedRouteCount,
      locationAccuracyRate,
      routeAccuracyRate,
      topAffectedRoutes,
      lastUpdate: lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Unknown'
    };
  }, [trafficAlerts, criticalAlerts, activeAlerts, enhancedLocationAlerts, enhancedRouteAlerts, lastUpdated]);

  console.log('🔧 Enhanced Dashboard metrics:', dashboardMetrics);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading enhanced traffic data...</Text>
        <Text style={styles.loadingSubtext}>Initializing supervisor accountability system</Text>
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
          colors={['#3B82F6']}
          tintColor="#3B82F6"
        />
      }
    >
      {/* Enhanced Header with Supervisor Status */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>🚦 Enhanced Traffic Control Centre</Text>
          <Text style={styles.subtitle}>Real-time intelligence with supervisor accountability</Text>
          {lastUpdated && (
            <Text style={styles.lastUpdate}>
              Last updated: {new Date(lastUpdated).toLocaleTimeString()}
            </Text>
          )}
        </View>
        
        {/* Supervisor Status Card */}
        <View style={styles.supervisorCard}>
          {isLoggedIn ? (
            <View style={styles.supervisorInfo}>
              <View style={styles.supervisorHeader}>
                <Ionicons name="shield-checkmark" size={24} color="#10B981" />
                <View style={styles.supervisorDetails}>
                  <Text style={styles.supervisorName}>{supervisorName}</Text>
                  <Text style={styles.supervisorRole}>{supervisorRole}</Text>
                </View>
              </View>
              <Text style={styles.supervisorStatus}>Supervisor Mode Active</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.loginPrompt}
              onPress={() => setShowSupervisorLogin(true)}
            >
              <Ionicons name="person-circle-outline" size={24} color="#6B7280" />
              <Text style={styles.loginPromptText}>Tap to enable supervisor mode</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Enhanced Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="alert-circle" size={24} color="#EF4444" />
            <Text style={styles.statLabel}>Total Alerts</Text>
          </View>
          <Text style={styles.statNumber}>{dashboardMetrics.totalAlerts}</Text>
          <Text style={styles.statSubtext}>Live monitoring</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="warning" size={24} color="#F59E0B" />
            <Text style={styles.statLabel}>Active Now</Text>
          </View>
          <Text style={styles.statNumber}>{dashboardMetrics.activeCount}</Text>
          <Text style={styles.statSubtext}>Requiring attention</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Ionicons name="flame" size={24} color="#DC2626" />
            <Text style={styles.statLabel}>Critical</Text>
          </View>
          <Text style={styles.statNumber}>{dashboardMetrics.highPriorityCount}</Text>
          <Text style={styles.statSubtext}>High priority</Text>
        </View>
      </View>

      {/* Enhanced Features Stats */}
      <View style={styles.enhancedStatsContainer}>
        <Text style={styles.sectionTitle}>Enhanced Intelligence</Text>
        <View style={styles.enhancedStats}>
          <View style={styles.enhancedStatCard}>
            <Ionicons name="location" size={20} color="#10B981" />
            <Text style={styles.enhancedStatValue}>
              {dashboardMetrics.locationAccuracyRate}%
            </Text>
            <Text style={styles.enhancedStatLabel}>Location Accuracy</Text>
            <Text style={styles.enhancedStatCount}>
              {dashboardMetrics.enhancedLocationCount} enhanced
            </Text>
          </View>
          
          <View style={styles.enhancedStatCard}>
            <Ionicons name="bus" size={20} color="#3B82F6" />
            <Text style={styles.enhancedStatValue}>
              {dashboardMetrics.routeAccuracyRate}%
            </Text>
            <Text style={styles.enhancedStatLabel}>Route Matching</Text>
            <Text style={styles.enhancedStatCount}>
              {dashboardMetrics.enhancedRouteCount} enhanced
            </Text>
          </View>
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
              <View style={styles.routeBar}>
                <View 
                  style={[
                    styles.routeBarFill, 
                    { width: `${(item.count / Math.max(...dashboardMetrics.topAffectedRoutes.map(r => r.count))) * 100}%` }
                  ]} 
                />
              </View>
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
                <View style={styles.alertBadges}>
                  <Text style={styles.alertStatus}>{alert.status?.toUpperCase()}</Text>
                  {alert.locationAccuracy === 'high' && (
                    <View style={styles.enhancedBadge}>
                      <Ionicons name="location" size={12} color="#10B981" />
                    </View>
                  )}
                </View>
              </View>
              <Text style={styles.alertLocation}>{alert.location}</Text>
              {alert.affectsRoutes && alert.affectsRoutes.length > 0 && (
                <Text style={styles.alertRoutes}>
                  Routes: {alert.affectsRoutes.join(', ')}
                </Text>
              )}
              {alert.calculatedSeverity && (
                <Text style={styles.alertCalculatedSeverity}>
                  Calculated Severity: {alert.calculatedSeverity}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Supervisor Activity (if logged in) */}
      {isLoggedIn && supervisorActivity.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Supervisor Activity</Text>
          {supervisorActivity.slice(0, 5).map((activity, index) => (
            <View key={index} style={styles.activityItem}>
              <View style={styles.activityHeader}>
                <Text style={styles.activityType}>{activity.type.toUpperCase()}</Text>
                <Text style={styles.activityTime}>
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </Text>
              </View>
              <Text style={styles.activityDetails}>{activity.details}</Text>
            </View>
          ))}
        </View>
      )}

      {/* System Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Status</Text>
        <View style={styles.statusItem}>
          <Text style={styles.statusIndicator}>🟢</Text>
          <Text style={styles.statusText}>Enhanced processing active</Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={styles.statusIndicator}>🟢</Text>
          <Text style={styles.statusText}>Location enhancement operational</Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={styles.statusIndicator}>🟢</Text>
          <Text style={styles.statusText}>Route matching enhanced</Text>
        </View>
        {isLoggedIn && (
          <View style={styles.statusItem}>
            <Text style={styles.statusIndicator}>🟢</Text>
            <Text style={styles.statusText}>Supervisor accountability active</Text>
          </View>
        )}
      </View>

      {/* Supervisor Login Modal */}
      <SupervisorLogin 
        visible={showSupervisorLogin}
        onClose={() => setShowSupervisorLogin(false)}
      />
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
    fontWeight: '600',
  },
  loadingSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#1E293B',
    padding: 20,
    paddingTop: 40,
  },
  headerContent: {
    marginBottom: 16,
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
  supervisorCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  supervisorInfo: {
    alignItems: 'center',
  },
  supervisorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  supervisorDetails: {
    marginLeft: 12,
    alignItems: 'center',
  },
  supervisorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  supervisorRole: {
    fontSize: 12,
    color: '#94A3B8',
  },
  supervisorStatus: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  loginPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  loginPromptText: {
    marginLeft: 8,
    color: '#94A3B8',
    fontSize: 14,
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
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  statSubtext: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
  },
  enhancedStatsContainer: {
    margin: 16,
    marginTop: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  enhancedStats: {
    flexDirection: 'row',
    gap: 12,
  },
  enhancedStatCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  enhancedStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginVertical: 4,
  },
  enhancedStatLabel: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 2,
  },
  enhancedStatCount: {
    fontSize: 9,
    color: '#94A3B8',
    textAlign: 'center',
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
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    borderRadius: 8,
  },
  alertTypeEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  alertTypeCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  alertTypeLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  routeNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    width: 50,
  },
  routeCount: {
    fontSize: 14,
    color: '#64748B',
    width: 80,
  },
  routeBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    marginLeft: 12,
  },
  routeBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  alertItem: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
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
  alertBadges: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
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
  enhancedBadge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 10,
    padding: 2,
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
  alertCalculatedSeverity: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '500',
    marginTop: 2,
  },
  activityItem: {
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 6,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  activityType: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  activityTime: {
    fontSize: 10,
    color: '#64748B',
  },
  activityDetails: {
    fontSize: 12,
    color: '#3730A3',
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

export default EnhancedDashboard;
