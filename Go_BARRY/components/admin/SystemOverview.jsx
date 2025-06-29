import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  RefreshControl
} from 'react-native';
import { useConvexSync } from '../../hooks/useConvexSync';
import { useBarryAPI } from '../hooks/useBARRYapi';
import { useSupervisorSession } from '../hooks/useSupervisorSession';
import { Ionicons } from '@expo/vector-icons';

const SystemOverview = () => {
  const { activeAlerts, activeSupervisors, syncState } = useConvexSync();
  const { systemHealth, refreshAlerts } = useBarryAPI();
  const { supervisorSession } = useSupervisorSession();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [coverageData, setCoverageData] = useState([]);
  
  console.log('🟦 SystemOverview component is rendering!', {
    hasMetrics: !!metrics,
    loading,
    activeAlerts: activeAlerts?.length || 0
  });

  // Fetch detailed system health
  const fetchSystemHealth = async () => {
    try {
      console.log('📡 Fetching system health...');
      const response = await fetch('https://go-barry.onrender.com/api/admin/health-extended', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supervisorSession?.token || ''}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
        console.log('✅ System health data received:', data);
      } else {
        console.log('❌ Failed to fetch health:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch health:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch coverage data for map
  const fetchCoverageData = async () => {
    try {
      const response = await fetch('https://go-barry.onrender.com/api/alerts-enhanced', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.alerts) {
          // Group alerts by area for coverage map
          const grouped = data.alerts.reduce((acc, alert) => {
            const area = alert.location?.area || alert.location?.split(',')[1]?.trim() || 'Unknown';
            acc[area] = (acc[area] || 0) + 1;
            return acc;
          }, {});
          setCoverageData(Object.entries(grouped));
        }
      }
    } catch (error) {
      console.error('Failed to fetch coverage:', error);
    }
  };

  useEffect(() => {
    fetchSystemHealth();
    fetchCoverageData();
    
    // Live updates every 10 seconds
    const interval = setInterval(() => {
      fetchSystemHealth();
      fetchCoverageData();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
      case 'operational':
        return '#4CAF50';
      case 'degraded':
      case 'warning':
        return '#FF9800';
      case 'down':
      case 'error':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getRAMStatus = (used, total) => {
    const percentage = (used / total) * 100;
    if (percentage > 90) return { color: '#F44336', status: 'Critical' };
    if (percentage > 70) return { color: '#FF9800', status: 'Warning' };
    return { color: '#4CAF50', status: 'Healthy' };
  };

  const restartService = async (service) => {
    try {
      const response = await fetch(`https://go-barry.onrender.com/api/admin/restart/${service}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supervisorSession?.token || ''}`
        }
      });
      
      if (response.ok) {
        fetchSystemHealth();
      }
    } catch (error) {
      console.error('Failed to restart service:', error);
    }
  };

  const ramUsage = metrics?.system?.memory || {};
  const ramPercentage = ramUsage.total ? ((ramUsage.used / ramUsage.total) * 100).toFixed(1) : 0;
  const ramStatus = getRAMStatus(ramUsage.used || 0, ramUsage.total || 2048);

  // Return simple test view first to ensure component renders
  if (false) {
    return (
      <View style={{ flex: 1, padding: 20, backgroundColor: '#f8fafc' }}>
        <Text style={{ fontSize: 24, color: '#1F2937', fontWeight: 'bold' }}>
          System Overview Test
        </Text>
        <Text style={{ fontSize: 16, color: '#6B7280', marginTop: 10 }}>
          If you see this, the component is rendering!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>System Overview</Text>
        <Text style={styles.subtitle}>Real-time health monitoring and metrics</Text>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            fetchSystemHealth();
            fetchCoverageData();
          }} />
        }
      >
        {/* Service Health Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Service Health Grid</Text>
          <View style={styles.healthGrid}>
            {/* Core Services */}
            <View style={styles.healthCard}>
              <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(metrics?.api?.status) }]} />
              <Text style={styles.serviceName}>Backend API</Text>
              <Text style={styles.serviceStatus}>{metrics?.api?.responseTime || 0}ms</Text>
            </View>

            <View style={styles.healthCard}>
              <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(metrics?.database?.status) }]} />
              <Text style={styles.serviceName}>Database</Text>
              <Text style={styles.serviceStatus}>{metrics?.database?.connections || 0} conn</Text>
            </View>

            <View style={styles.healthCard}>
              <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(syncState?.status || 'operational') }]} />
              <Text style={styles.serviceName}>Convex Sync</Text>
              <Text style={styles.serviceStatus}>{activeAlerts?.length || 0} alerts</Text>
            </View>

            {/* Data Sources */}
            {metrics?.services && Object.entries(metrics.services).map(([service, data]) => (
              <View key={service} style={styles.healthCard}>
                <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(data.status) }]} />
                <Text style={styles.serviceName}>{service}</Text>
                <Text style={styles.serviceStatus}>
                  {data.lastSuccess ? new Date(data.lastSuccess).toLocaleTimeString() : 'Never'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Performance Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Performance Metrics</Text>
          
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>RAM Usage</Text>
              <Text style={[styles.metricValue, { color: ramStatus.color }]}>
                {ramPercentage}% ({ramStatus.status})
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { 
                width: `${ramPercentage}%`, 
                backgroundColor: ramStatus.color 
              }]} />
            </View>
            <Text style={styles.metricDetail}>
              {(ramUsage.used / 1024).toFixed(2)}GB / {(ramUsage.total / 1024).toFixed(2)}GB
            </Text>
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metricBox}>
              <Text style={styles.metricBoxValue}>{metrics?.api?.responseTime || 0}ms</Text>
              <Text style={styles.metricBoxLabel}>API Response</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricBoxValue}>{activeAlerts?.length || 0}</Text>
              <Text style={styles.metricBoxLabel}>Active Alerts</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricBoxValue}>{metrics?.api?.requestsPerMinute || 0}</Text>
              <Text style={styles.metricBoxLabel}>Req/min</Text>
            </View>
          </View>
        </View>

        {/* Activity Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Activity Overview</Text>
          
          <View style={styles.activityGrid}>
            <View style={styles.activityCard}>
              <Text style={styles.activityValue}>{metrics?.stats?.alertsToday || 0}</Text>
              <Text style={styles.activityLabel}>Alerts Today</Text>
            </View>
            <View style={styles.activityCard}>
              <Text style={styles.activityValue}>{metrics?.stats?.alertsWeek || 0}</Text>
              <Text style={styles.activityLabel}>Alerts This Week</Text>
            </View>
            <View style={styles.activityCard}>
              <Text style={styles.activityValue}>{metrics?.stats?.supervisorActions || 0}</Text>
              <Text style={styles.activityLabel}>Supervisor Actions</Text>
            </View>
            <View style={styles.activityCard}>
              <Text style={styles.activityValue}>{metrics?.system?.uptime || '99.9'}%</Text>
              <Text style={styles.activityLabel}>System Uptime</Text>
            </View>
          </View>
        </View>

        {/* Quick Diagnostics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 Quick Diagnostics</Text>
          
          {metrics?.errors && metrics.errors.length > 0 ? (
            <View style={styles.errorsList}>
              {metrics.errors.slice(0, 5).map((error, index) => (
                <View key={index} style={styles.errorItem}>
                  <Ionicons name="warning" size={20} color="#F44336" />
                  <View style={styles.errorContent}>
                    <Text style={styles.errorService}>{error.service}</Text>
                    <Text style={styles.errorMessage}>{error.message}</Text>
                    <Text style={styles.errorTime}>
                      {new Date(error.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noErrors}>No recent errors</Text>
          )}

          {/* Service Restart Buttons */}
          <View style={styles.restartGrid}>
            <TouchableOpacity 
              style={styles.restartButton}
              onPress={() => restartService('tomtom')}
            >
              <Ionicons name="refresh" size={20} color="#FFF" />
              <Text style={styles.restartText}>Restart TomTom</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.restartButton}
              onPress={() => restartService('highways')}
            >
              <Ionicons name="refresh" size={20} color="#FFF" />
              <Text style={styles.restartText}>Restart Highways</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Coverage Map */}
        {coverageData.length > 0 && (
          <View style={[styles.section, { marginBottom: 20 }]}>
            <Text style={styles.sectionTitle}>🗺️ Incident Coverage</Text>
            <View style={styles.coverageContainer}>
              {coverageData.sort((a, b) => b[1] - a[1]).slice(0, 10).map(([area, count]) => (
                <View key={area} style={styles.coverageItem}>
                  <Text style={styles.coverageArea}>{area}</Text>
                  <View style={styles.coverageBar}>
                    <View style={[styles.coverageFill, { 
                      width: `${(count / coverageData[0][1]) * 100}%`,
                      backgroundColor: count > 10 ? '#F44336' : count > 5 ? '#FF9800' : '#4CAF50'
                    }]} />
                  </View>
                  <Text style={styles.coverageCount}>{count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 15,
  },
  healthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  healthCard: {
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 10,
    minWidth: 140,
    margin: 5,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  serviceName: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '600',
  },
  serviceStatus: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
  },
  metricCard: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metricLabel: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  metricDetail: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    marginHorizontal: -5,
  },
  metricBox: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    margin: 5,
  },
  metricBoxValue: {
    color: '#3B82F6',
    fontSize: 24,
    fontWeight: 'bold',
  },
  metricBoxLabel: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 5,
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  activityCard: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 10,
    flex: 1,
    minWidth: 140,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    margin: 5,
  },
  activityValue: {
    color: '#10B981',
    fontSize: 28,
    fontWeight: 'bold',
  },
  activityLabel: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  errorsList: {
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  errorItem: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  errorContent: {
    marginLeft: 10,
    flex: 1,
  },
  errorService: {
    color: '#991b1b',
    fontSize: 14,
    fontWeight: '600',
  },
  errorMessage: {
    color: '#1F2937',
    fontSize: 12,
    marginTop: 2,
  },
  errorTime: {
    color: '#6B7280',
    fontSize: 10,
    marginTop: 2,
  },
  noErrors: {
    color: '#10B981',
    textAlign: 'center',
    padding: 20,
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  restartGrid: {
    flexDirection: 'row',
    marginHorizontal: -5,
    marginTop: 15,
  },
  restartButton: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    flex: 1,
    justifyContent: 'center',
    margin: 5,
  },
  restartText: {
    color: '#FFF',
    marginLeft: 8,
    fontWeight: '600',
  },
  coverageContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  coverageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  coverageArea: {
    color: '#1F2937',
    width: 120,
    fontSize: 14,
  },
  coverageBar: {
    flex: 1,
    height: 20,
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    marginHorizontal: 10,
  },
  coverageFill: {
    height: '100%',
    borderRadius: 10,
  },
  coverageCount: {
    color: '#6B7280',
    width: 40,
    textAlign: 'right',
  },
});

export default SystemOverview;