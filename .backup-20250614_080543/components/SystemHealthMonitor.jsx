// Go_BARRY/components/SystemHealthMonitor.jsx
// Phase 5: Testing, Training & Continuous Improvement - System Health & Performance

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupervisorSession } from './hooks/useSupervisorSession';

const isWeb = Platform.OS === 'web';

// System components to monitor
const SYSTEM_COMPONENTS = {
  api: {
    name: 'Backend API',
    endpoint: '/api/health',
    critical: true,
    description: 'Core API functionality'
  },
  database: {
    name: 'Database Connection', 
    endpoint: '/api/health/database',
    critical: true,
    description: 'Data storage and retrieval'
  },
  gtfs: {
    name: 'GTFS Data Processing',
    endpoint: '/api/routes/gtfs-stats',
    critical: false,
    description: 'Route and stop data'
  },
  geocoding: {
    name: 'Geocoding Service',
    endpoint: '/api/geocoding/stats',
    critical: false,
    description: 'Location enhancement'
  },
  messaging: {
    name: 'Message Distribution',
    endpoint: '/api/messaging/channels',
    critical: false,
    description: 'Multi-channel messaging'
  },
  alerts: {
    name: 'Alert Processing',
    endpoint: '/api/alerts',
    critical: true,
    description: 'Traffic alert system'
  }
};

const SystemHealthMonitor = ({ baseUrl }) => {
  const { isLoggedIn, logActivity } = useSupervisorSession();

  // State management
  const [systemHealth, setSystemHealth] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [lastHealthCheck, setLastHealthCheck] = useState(null);
  const [systemAlerts, setSystemAlerts] = useState([]);

  // API base URL
  const API_BASE = baseUrl || (isWeb 
    ? (window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://go-barry.onrender.com')
    : 'https://go-barry.onrender.com'
  );

  // Load system health on mount
  useEffect(() => {
    performHealthCheck();
    loadPerformanceMetrics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      performHealthCheck();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const performHealthCheck = async () => {
    const startTime = Date.now();
    const healthResults = {};
    const alerts = [];
    
    setRefreshing(true);

    for (const [componentId, component] of Object.entries(SYSTEM_COMPONENTS)) {
      try {
        const componentStartTime = Date.now();
        const response = await fetch(`${API_BASE}${component.endpoint}`, {
          timeout: 10000
        });
        
        const responseTime = Date.now() - componentStartTime;
        const isHealthy = response.ok;
        
        healthResults[componentId] = {
          status: isHealthy ? 'healthy' : 'unhealthy',
          responseTime,
          lastCheck: new Date().toISOString(),
          statusCode: response.status,
          error: isHealthy ? null : `HTTP ${response.status}`
        };

        // Generate alerts for critical components
        if (!isHealthy && component.critical) {
          alerts.push({
            id: `alert_${componentId}_${Date.now()}`,
            component: componentId,
            severity: 'high',
            message: `Critical component ${component.name} is unhealthy`,
            timestamp: new Date().toISOString()
          });
        }

        // Response time alerts
        if (responseTime > 5000) {
          alerts.push({
            id: `alert_${componentId}_slow_${Date.now()}`,
            component: componentId,
            severity: responseTime > 10000 ? 'high' : 'medium',
            message: `${component.name} response time is ${responseTime}ms`,
            timestamp: new Date().toISOString()
          });
        }

      } catch (error) {
        healthResults[componentId] = {
          status: 'error',
          responseTime: null,
          lastCheck: new Date().toISOString(),
          error: error.message
        };

        if (component.critical) {
          alerts.push({
            id: `alert_${componentId}_error_${Date.now()}`,
            component: componentId,
            severity: 'critical',
            message: `Critical component ${component.name} failed: ${error.message}`,
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    const totalTime = Date.now() - startTime;
    
    setSystemHealth(healthResults);
    setSystemAlerts(alerts);
    setLastHealthCheck(new Date().toISOString());
    setLoading(false);
    setRefreshing(false);

    // Log health check activity
    if (isLoggedIn) {
      const healthyComponents = Object.values(healthResults).filter(r => r.status === 'healthy').length;
      const totalComponents = Object.keys(healthResults).length;
      
      logActivity(
        'HEALTH_CHECK',
        `System health: ${healthyComponents}/${totalComponents} components healthy (${totalTime}ms)`,
        null
      );
    }

    console.log(`🏥 Health check completed in ${totalTime}ms: ${Object.keys(healthResults).length} components checked`);
  };

  const loadPerformanceMetrics = async () => {
    try {
      // Mock performance data - in production this would come from monitoring system
      setPerformanceMetrics({
        uptime: '99.8%',
        averageResponseTime: '245ms',
        requestsPerMinute: 147,
        errorRate: '0.2%',
        memoryUsage: '68%',
        cpuUsage: '45%',
        diskUsage: '32%',
        activeConnections: 23,
        cacheHitRate: '94.5%',
        alertsProcessed: 1547,
        averageAlertProcessingTime: '1.2s'
      });
    } catch (error) {
      console.error('Failed to load performance metrics:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return '#10B981';
      case 'unhealthy': return '#F59E0B';
      case 'error': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return 'checkmark-circle';
      case 'unhealthy': return 'warning';
      case 'error': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#DC2626';
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const handleRefresh = async () => {
    await performHealthCheck();
    await loadPerformanceMetrics();
  };

  const runDiagnostics = () => {
    if (isWeb) {
      alert('Running full system diagnostics...\n\nThis would perform comprehensive tests of all system components.');
    } else {
      Alert.alert('Diagnostics', 'Running full system diagnostics...');
    }
    
    if (isLoggedIn) {
      logActivity('RUN_DIAGNOSTICS', 'Initiated full system diagnostics', null);
    }
  };

  // Calculate overall system health
  const healthyComponents = Object.values(systemHealth).filter(h => h.status === 'healthy').length;
  const totalComponents = Object.keys(systemHealth).length;
  const overallHealth = totalComponents > 0 ? (healthyComponents / totalComponents * 100).toFixed(1) : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>🏥 System Health Monitor</Text>
          <Text style={styles.subtitle}>Real-time performance & diagnostics</Text>
        </View>
        
        <TouchableOpacity
          style={styles.diagnosticsButton}
          onPress={runDiagnostics}
        >
          <Ionicons name="medical" size={20} color="#FFFFFF" />
          <Text style={styles.diagnosticsButtonText}>Diagnostics</Text>
        </TouchableOpacity>
      </View>

      {/* Overall Health Score */}
      <View style={styles.healthScoreCard}>
        <View style={styles.healthScoreContent}>
          <Text style={styles.healthScoreNumber}>{overallHealth}%</Text>
          <Text style={styles.healthScoreLabel}>System Health</Text>
          <Text style={styles.healthScoreDetail}>
            {healthyComponents}/{totalComponents} components healthy
          </Text>
        </View>
        
        <View style={styles.healthScoreIndicator}>
          <View style={[
            styles.healthScoreBar,
            { width: `${overallHealth}%`, backgroundColor: overallHealth >= 90 ? '#10B981' : overallHealth >= 70 ? '#F59E0B' : '#EF4444' }
          ]} />
        </View>
        
        {lastHealthCheck && (
          <Text style={styles.lastCheckTime}>
            Last check: {new Date(lastHealthCheck).toLocaleTimeString()}
          </Text>
        )}
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
      >
        {/* System Alerts */}
        {systemAlerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System Alerts</Text>
            {systemAlerts.map((alert) => (
              <View key={alert.id} style={[
                styles.alertCard,
                { borderLeftColor: getSeverityColor(alert.severity) }
              ]}>
                <View style={styles.alertHeader}>
                  <Text style={[
                    styles.alertSeverity,
                    { color: getSeverityColor(alert.severity) }
                  ]}>
                    {alert.severity.toUpperCase()}
                  </Text>
                  <Text style={styles.alertTime}>
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
                <Text style={styles.alertMessage}>{alert.message}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Component Health Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Component Status</Text>
          {loading && Object.keys(systemHealth).length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Checking system health...</Text>
            </View>
          ) : (
            <View style={styles.componentsGrid}>
              {Object.entries(SYSTEM_COMPONENTS).map(([componentId, component]) => {
                const health = systemHealth[componentId];
                return (
                  <View key={componentId} style={styles.componentCard}>
                    <View style={styles.componentHeader}>
                      <Ionicons 
                        name={getStatusIcon(health?.status)} 
                        size={24} 
                        color={getStatusColor(health?.status)} 
                      />
                      <View style={styles.componentInfo}>
                        <Text style={styles.componentName}>{component.name}</Text>
                        <Text style={styles.componentDesc}>{component.description}</Text>
                      </View>
                      {component.critical && (
                        <View style={styles.criticalBadge}>
                          <Text style={styles.criticalBadgeText}>CRITICAL</Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.componentStatus}>
                      <Text style={[
                        styles.componentStatusText,
                        { color: getStatusColor(health?.status) }
                      ]}>
                        {health?.status?.toUpperCase() || 'CHECKING...'}
                      </Text>
                      
                      {health?.responseTime && (
                        <Text style={styles.componentResponseTime}>
                          {health.responseTime}ms
                        </Text>
                      )}
                    </View>
                    
                    {health?.error && (
                      <Text style={styles.componentError}>{health.error}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Performance Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          <View style={styles.metricsGrid}>
            {Object.entries(performanceMetrics).map(([metric, value]) => (
              <View key={metric} style={styles.metricCard}>
                <Text style={styles.metricValue}>{value}</Text>
                <Text style={styles.metricLabel}>
                  {metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* System Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Information</Text>
          <View style={styles.systemInfo}>
            <View style={styles.systemInfoRow}>
              <Text style={styles.systemInfoLabel}>Environment:</Text>
              <Text style={styles.systemInfoValue}>
                {isWeb ? 'Browser' : 'Mobile'} ({__DEV__ ? 'Development' : 'Production'})
              </Text>
            </View>
            <View style={styles.systemInfoRow}>
              <Text style={styles.systemInfoLabel}>API Endpoint:</Text>
              <Text style={styles.systemInfoValue}>{API_BASE}</Text>
            </View>
            <View style={styles.systemInfoRow}>
              <Text style={styles.systemInfoLabel}>Platform:</Text>
              <Text style={styles.systemInfoValue}>{Platform.OS}</Text>
            </View>
            <View style={styles.systemInfoRow}>
              <Text style={styles.systemInfoLabel}>Version:</Text>
              <Text style={styles.systemInfoValue}>3.0.0</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  diagnosticsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  diagnosticsButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  healthScoreCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  healthScoreContent: {
    alignItems: 'center',
    marginBottom: 16,
  },
  healthScoreNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  healthScoreLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  healthScoreDetail: {
    fontSize: 14,
    color: '#6B7280',
  },
  healthScoreIndicator: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 12,
  },
  healthScoreBar: {
    height: '100%',
    borderRadius: 4,
  },
  lastCheckTime: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  content: {
    flex: 1,
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
    color: '#1F2937',
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  alertCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertSeverity: {
    fontSize: 12,
    fontWeight: '600',
  },
  alertTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  alertMessage: {
    fontSize: 14,
    color: '#374151',
  },
  componentsGrid: {
    gap: 12,
  },
  componentCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  componentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  componentInfo: {
    flex: 1,
  },
  componentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  componentDesc: {
    fontSize: 12,
    color: '#6B7280',
  },
  criticalBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  criticalBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#DC2626',
  },
  componentStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  componentStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  componentResponseTime: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  componentError: {
    fontSize: 12,
    color: '#EF4444',
    fontStyle: 'italic',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    minWidth: 100,
    flex: 1,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  systemInfo: {
    gap: 12,
  },
  systemInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  systemInfoLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  systemInfoValue: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
    textAlign: 'right',
  },
});

export default SystemHealthMonitor;
