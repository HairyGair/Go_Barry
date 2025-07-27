/*
 * Go Barry - Traffic Intelligence Platform
 * Admin Dashboard - System Overview Page
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, Pressable, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSupervisorSession } from '../../components/hooks/useSupervisorSession';
import { useConvexSync } from '../../hooks/useConvexSync';
import { useBarryAPI } from '../../components/hooks/useBARRYapi';
import { darkTheme, getStatusColor, getRAMStatus } from './styles/darkTheme';
import StatusIndicator from './components/StatusIndicator';
import MetricCard from './components/MetricCard';
import ServiceHealthCard from './components/ServiceHealthCard';
import SectionHeader from './components/SectionHeader';
import ActivityCard from './components/ActivityCard';
import ErrorListItem from './components/ErrorListItem';
import LoadingScreen from './components/LoadingScreen';

export default function SystemOverview() {
  const router = useRouter();
  const { supervisorSession, isAdmin } = useSupervisorSession();
  const { activeAlerts, activeSupervisors, syncState } = useConvexSync();
  const { systemHealth, refreshAlerts } = useBarryAPI();
  
  // State management from original component
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [coverageData, setCoverageData] = useState([]);

  // Redirect if not admin
  useEffect(() => {
    if (supervisorSession && !isAdmin) {
      setTimeout(() => {
        router.replace('/');
      }, 0);
    }
  }, [supervisorSession, isAdmin, router]);

  // Fetch detailed system health
  const fetchSystemHealth = async () => {
    try {
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
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch system health');
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
      // Silently fail - coverage map is not critical
    }
  };

  // Restart service function
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
        Alert.alert('Success', `${service} service restarted`);
        fetchSystemHealth();
      } else {
        Alert.alert('Error', 'Failed to restart service');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to restart service');
    }
  };

  // Main data loading effect
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

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSystemHealth();
    fetchCoverageData();
  };

  if (!supervisorSession || !isAdmin) {
    return null;
  }

  // Calculate RAM usage
  const ramUsage = metrics?.system?.memory || {};
  const ramPercentage = ramUsage.total ? ((ramUsage.used / ramUsage.total) * 100).toFixed(1) : 0;
  const ramStatus = getRAMStatus(ramUsage.used || 0, ramUsage.total || 2048);

  if (loading) {
    return (
      <LoadingScreen 
        message="Loading System Overview..."
        color={darkTheme.accents.systemOverview}
      />
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      <View style={styles.container}>
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#667eea"
            />
          }
        >
          {/* Service Health Grid */}
          <View style={styles.section}>
            <SectionHeader 
              title="Service Health Grid"
              icon="server-network"
              iconColor={darkTheme.accents.systemOverview}
            />
            <View style={styles.healthGrid}>
              {/* Core Services */}
              <ServiceHealthCard
                serviceName="Backend API"
                status={metrics?.api?.status}
                detail={`${metrics?.api?.responseTime || 0}ms`}
              />
              
              <ServiceHealthCard
                serviceName="Database"
                status={metrics?.database?.status}
                detail={`${metrics?.database?.connections || 0} conn`}
              />
              
              <ServiceHealthCard
                serviceName="Convex Sync"
                status={syncState?.status || 'operational'}
                detail={`${activeAlerts?.length || 0} alerts`}
              />

              {/* Data Sources */}
              {metrics?.services && Object.entries(metrics.services).map(([service, data]) => (
                <ServiceHealthCard
                  key={service}
                  serviceName={service}
                  status={data.status}
                  detail={data.lastSuccess ? new Date(data.lastSuccess).toLocaleTimeString() : 'Never'}
                />
              ))}
            </View>
          </View>

          {/* Performance Metrics */}
          <View style={styles.section}>
            <SectionHeader 
              title="Performance Metrics"
              icon="lightning-bolt"
              iconColor={darkTheme.warning}
            />
            
            <MetricCard
              label="RAM Usage"
              value={`${ramPercentage}% (${ramStatus.status})`}
              detail={`${(ramUsage.used / 1024).toFixed(2)}GB / ${(ramUsage.total / 1024).toFixed(2)}GB`}
              color={ramStatus.color}
              showProgress={true}
              progress={parseFloat(ramPercentage)}
              progressColor={ramStatus.color}
              style={{ marginBottom: 15 }}
            />

            <View style={styles.metricsRow}>
              <View style={[styles.metricBox, { flex: 1 }]}>
                <Text style={styles.metricBoxValue}>{metrics?.api?.responseTime || 0}ms</Text>
                <Text style={styles.metricBoxLabel}>API Response</Text>
              </View>
              <View style={[styles.metricBox, { flex: 1 }]}>
                <Text style={styles.metricBoxValue}>{activeAlerts?.length || 0}</Text>
                <Text style={styles.metricBoxLabel}>Active Alerts</Text>
              </View>
              <View style={[styles.metricBox, { flex: 1 }]}>
                <Text style={styles.metricBoxValue}>{metrics?.api?.requestsPerMinute || 0}</Text>
                <Text style={styles.metricBoxLabel}>Req/min</Text>
              </View>
            </View>
          </View>

          {/* Activity Overview */}
          <View style={styles.section}>
            <SectionHeader 
              title="Activity Overview"
              icon="chart-line"
              iconColor={darkTheme.success}
            />
            
            <View style={styles.activityGrid}>
              <ActivityCard
                value={metrics?.stats?.alertsToday || 0}
                label="Alerts Today"
                icon="alert"
              />
              <ActivityCard
                value={metrics?.stats?.alertsWeek || 0}
                label="Alerts This Week"
                icon="calendar-week"
              />
              <ActivityCard
                value={metrics?.stats?.supervisorActions || 0}
                label="Supervisor Actions"
                icon="account-check"
              />
              <ActivityCard
                value={`${metrics?.system?.uptime || '99.9'}%`}
                label="System Uptime"
                icon="clock-check"
                valueColor={darkTheme.accents.systemOverview}
              />
            </View>
          </View>

          {/* Quick Diagnostics */}
          <View style={styles.section}>
            <SectionHeader 
              title="Quick Diagnostics"
              icon="wrench"
              iconColor={darkTheme.info}
            />
            
            {metrics?.errors && metrics.errors.length > 0 ? (
              <View style={styles.errorsList}>
                {metrics.errors.slice(0, 5).map((error, index) => (
                  <ErrorListItem
                    key={index}
                    service={error.service}
                    message={error.message}
                    timestamp={error.timestamp}
                    severity="error"
                  />
                ))}
              </View>
            ) : (
              <View style={styles.noErrors}>
                <Text style={styles.noErrorsText}>No recent errors</Text>
              </View>
            )}

            {/* Service Restart Buttons */}
            <View style={styles.restartGrid}>
              <Pressable 
                style={({ pressed }) => [
                  styles.restartButton,
                  pressed && styles.restartButtonPressed
                ]}
                onPress={() => restartService('tomtom')}
              >
                <MaterialCommunityIcons name="restart" size={20} color="#FFF" />
                <Text style={styles.restartText}>Restart TomTom</Text>
              </Pressable>
              
              <Pressable 
                style={({ pressed }) => [
                  styles.restartButton,
                  pressed && styles.restartButtonPressed
                ]}
                onPress={() => restartService('highways')}
              >
                <MaterialCommunityIcons name="restart" size={20} color="#FFF" />
                <Text style={styles.restartText}>Restart Highways</Text>
              </Pressable>
            </View>
          </View>

          {/* Coverage Map */}
          {coverageData.length > 0 && (
            <View style={[styles.section, { marginBottom: 20 }]}>
              <SectionHeader 
                title="Incident Coverage"
                icon="map-marker-radius"
                iconColor={darkTheme.accents.liveMap}
              />
              <View style={styles.coverageContainer}>
                {coverageData.sort((a, b) => b[1] - a[1]).slice(0, 10).map(([area, count]) => (
                  <View key={area} style={styles.coverageItem}>
                    <Text style={styles.coverageArea}>{area}</Text>
                    <View style={styles.coverageBar}>
                      <View style={[styles.coverageFill, { 
                        width: `${(count / coverageData[0][1]) * 100}%`,
                        backgroundColor: count > 10 ? darkTheme.error : count > 5 ? darkTheme.warning : darkTheme.success
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.background,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: darkTheme.background,
    marginBottom: 1,
  },
  healthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricBox: {
    backgroundColor: darkTheme.surface,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  metricBoxValue: {
    color: darkTheme.accents.systemOverview,
    fontSize: 24,
    fontWeight: 'bold',
  },
  metricBoxLabel: {
    color: darkTheme.textSecondary,
    fontSize: 12,
    marginTop: 5,
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  errorsList: {
    backgroundColor: darkTheme.errorBg,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.2)',
  },
  noErrors: {
    backgroundColor: darkTheme.successBg,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
    alignItems: 'center',
  },
  noErrorsText: {
    color: darkTheme.success,
    fontSize: 14,
  },
  restartGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
  restartButton: {
    backgroundColor: darkTheme.button.danger,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  restartButtonPressed: {
    opacity: 0.8,
  },
  restartText: {
    color: darkTheme.button.text,
    fontWeight: '600',
  },
  coverageContainer: {
    backgroundColor: darkTheme.surface,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  coverageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  coverageArea: {
    color: darkTheme.text,
    width: 120,
    fontSize: 14,
  },
  coverageBar: {
    flex: 1,
    height: 20,
    backgroundColor: darkTheme.progressBar.background,
    borderRadius: 10,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  coverageFill: {
    height: '100%',
    borderRadius: 10,
  },
  coverageCount: {
    color: darkTheme.textSecondary,
    width: 40,
    textAlign: 'right',
  },
});
