/*
 * Go Barry - Traffic Intelligence Platform
 * Admin Dashboard - Alert Analytics Page
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, Pressable, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSupervisorSession } from '../../components/hooks/useSupervisorSession';
import darkTheme from './styles/darkTheme';
import MetricCard from './components/MetricCard';
import SectionHeader from './components/SectionHeader';

const API_BASE = 'https://go-barry.onrender.com';

export default function AlertAnalytics() {
  const router = useRouter();
  const { supervisorSession, isAdmin } = useSupervisorSession();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Analytics data state
  const [alertStats, setAlertStats] = useState({
    totalAlerts: 0,
    bySource: {},
    bySeverity: {},
    topRoutes: [],
    avgDismissalTime: '0 mins',
    peakHours: []
  });
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [trends, setTrends] = useState([]);
  const [supervisorRanking, setSupervisorRanking] = useState([]);
  
  // Filter state
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedMetric, setSelectedMetric] = useState('events');

  // Redirect if not admin
  useEffect(() => {
    if (supervisorSession && !isAdmin) {
      setTimeout(() => {
        router.replace('/');
      }, 0);
    }
  }, [supervisorSession, isAdmin, router]);

  // Load all analytics data
  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch multiple data sources in parallel
      const [alertsRes, systemRes, trendsRes, rankingRes] = await Promise.all([
        fetch(`${API_BASE}/api/alerts-enhanced`),
        fetch(`${API_BASE}/api/analytics/system-metrics?timeRange=${timeRange}`),
        fetch(`${API_BASE}/api/analytics/trends?period=${timeRange}&metric=${selectedMetric}`),
        fetch(`${API_BASE}/api/analytics/supervisor-ranking?timeRange=${timeRange}`)
      ]);
      
      if (alertsRes.ok) {
        const alertData = await alertsRes.json();
        analyzeAlerts(alertData.alerts || []);
      }
      
      if (systemRes.ok) {
        const systemData = await systemRes.json();
        setSystemMetrics(systemData.systemMetrics);
      }
      
      if (trendsRes.ok) {
        const trendsData = await trendsRes.json();
        setTrends(trendsData.trends?.data || []);
      }
      
      if (rankingRes.ok) {
        const rankingData = await rankingRes.json();
        setSupervisorRanking(rankingData.ranking?.supervisors || []);
      }
      
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeAlerts = (alerts) => {
    const bySource = {};
    const bySeverity = { High: 0, Medium: 0, Low: 0 };
    const byRoute = {};
    const dismissalTimes = [];
    const hourCounts = new Array(24).fill(0);
    
    alerts.forEach(alert => {
      // By source
      bySource[alert.source] = (bySource[alert.source] || 0) + 1;
      
      // By severity
      if (alert.severity in bySeverity) {
        bySeverity[alert.severity]++;
      }
      
      // By route
      (alert.affectsRoutes || []).forEach(route => {
        byRoute[route] = (byRoute[route] || 0) + 1;
      });
      
      // Hour distribution
      const hour = new Date(alert.timestamp || alert.createdAt).getHours();
      hourCounts[hour]++;
      
      // Dismissal time (mock for now)
      if (alert.dismissed) {
        dismissalTimes.push(Math.random() * 10 + 2); // 2-12 mins
      }
    });
    
    // Get top 10 affected routes
    const topRoutes = Object.entries(byRoute)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([route, count]) => ({ route, count }));
    
    // Find peak hours
    const peakHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(({ hour }) => `${hour}:00-${hour + 1}:00`);
    
    const avgDismissalTime = dismissalTimes.length > 0
      ? `${Math.round(dismissalTimes.reduce((a, b) => a + b, 0) / dismissalTimes.length)} mins`
      : '0 mins';
    
    setAlertStats({
      totalAlerts: alerts.length,
      bySource,
      bySeverity,
      topRoutes,
      avgDismissalTime,
      peakHours
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
  };

  if (!supervisorSession || !isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffecd2" />
        <Text style={styles.loadingText}>Loading Alert Analytics...</Text>
      </View>
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
              tintColor="#ffecd2"
            />
          }
        >
          {/* Page Header */}
          <View style={styles.pageHeader}>
            <View style={styles.headerIcon}>
              <MaterialCommunityIcons name="chart-line" size={32} color="#ffecd2" />
            </View>
            <View>
              <Text style={styles.pageTitle}>Alert Analytics</Text>
              <Text style={styles.pageSubtitle}>Performance metrics & insights</Text>
            </View>
          </View>

          {/* Time Range Selector */}
          <View style={styles.dateRangeContainer}>
            {['1h', '24h', '7d', '30d'].map(range => (
              <TouchableOpacity
                key={range}
                style={[styles.dateRangeButton, timeRange === range && styles.dateRangeButtonActive]}
                onPress={() => setTimeRange(range)}
              >
                <Text style={[styles.dateRangeText, timeRange === range && styles.dateRangeTextActive]}>
                  {range === '1h' ? 'Last Hour' : 
                   range === '24h' ? 'Last 24h' : 
                   range === '7d' ? 'Last Week' : 'Last Month'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Key Metrics Grid */}
          <SectionHeader title="Overview" />
          <View style={styles.metricsGrid}>
            <MetricCard
              label="Total Alerts"
              value={alertStats.totalAlerts.toString()}
              color={darkTheme.warning}
              icon="alert"
            />
            <MetricCard
              label="Avg Response"
              value={alertStats.avgDismissalTime}
              color={darkTheme.primary}
              icon="timer"
            />
            <MetricCard
              label="Active Supervisors"
              value={supervisorRanking.length.toString()}
              color={darkTheme.success}
              icon="account-check"
            />
            <MetricCard
              label="System Health"
              value={systemMetrics?.health?.status || 'checking'}
              color={systemMetrics?.health?.status === 'healthy' ? darkTheme.success : darkTheme.warning}
              icon="heart-pulse"
            />
          </View>

          {/* Severity Distribution */}
          <SectionHeader title="Alerts by Severity" />
          <View style={styles.severityChart}>
            {Object.entries(alertStats.bySeverity).map(([severity, count]) => {
              const percentage = alertStats.totalAlerts > 0 ? (count / alertStats.totalAlerts * 100) : 0;
              const color = severity === 'High' ? darkTheme.error : 
                           severity === 'Medium' ? darkTheme.warning : darkTheme.success;
              
              return (
                <View key={severity} style={styles.severityItem}>
                  <View style={styles.severityHeader}>
                    <Text style={styles.severityLabel}>{severity}</Text>
                    <Text style={styles.severityCount}>{count}</Text>
                  </View>
                  <View style={styles.severityBar}>
                    <View 
                      style={[
                        styles.severityFill,
                        { width: `${percentage}%`, backgroundColor: color }
                      ]}
                    />
                  </View>
                  <Text style={styles.severityPercentage}>{percentage.toFixed(1)}%</Text>
                </View>
              );
            })}
          </View>

          {/* Alert Sources */}
          <SectionHeader title="Alert Sources" />
          <View style={styles.sourceGrid}>
            {Object.entries(alertStats.bySource).map(([source, count]) => (
              <View key={source} style={styles.sourceCard}>
                <MaterialCommunityIcons 
                  name={source === 'tomtom' ? 'map' : 'road'} 
                  size={24} 
                  color={darkTheme.primary} 
                />
                <Text style={styles.sourceLabel}>{source}</Text>
                <Text style={styles.sourceCount}>{count}</Text>
              </View>
            ))}
          </View>

          {/* Top Affected Routes */}
          <SectionHeader title="Most Affected Routes" />
          <View style={styles.routesList}>
            {alertStats.topRoutes.map(({ route, count }, index) => (
              <View key={route} style={styles.routeItem}>
                <Text style={styles.routeRank}>#{index + 1}</Text>
                <Text style={styles.routeName}>Route {route}</Text>
                <View style={styles.routeBar}>
                  <View 
                    style={[
                      styles.routeFill,
                      { width: `${(count / alertStats.topRoutes[0]?.count || 1) * 100}%` }
                    ]}
                  />
                </View>
                <Text style={styles.routeCount}>{count}</Text>
              </View>
            ))}
          </View>

          {/* Supervisor Performance Ranking */}
          <SectionHeader title="Supervisor Performance" />
          <View style={styles.rankingList}>
            {supervisorRanking.slice(0, 5).map((supervisor) => (
              <View key={supervisor.supervisorId} style={styles.rankingItem}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>{supervisor.rank}</Text>
                </View>
                <View style={styles.rankingContent}>
                  <Text style={styles.supervisorName}>{supervisor.supervisorName}</Text>
                  <View style={styles.supervisorStats}>
                    <Text style={styles.statText}>
                      <MaterialCommunityIcons name="alert-octagon" size={14} color={darkTheme.primary} />
                      {' '}{supervisor.alertsHandled} handled
                    </Text>
                    <Text style={styles.statText}>
                      <MaterialCommunityIcons name="timer" size={14} color={darkTheme.success} />
                      {' '}{supervisor.averageResponseTime}ms avg
                    </Text>
                  </View>
                </View>
                <Text style={styles.scoreText}>{supervisor.score}</Text>
              </View>
            ))}
          </View>

          {/* Peak Hours */}
          <SectionHeader title="Peak Alert Hours" />
          <View style={styles.peakHours}>
            {alertStats.peakHours.map(hour => (
              <View key={hour} style={styles.peakHourItem}>
                <MaterialCommunityIcons name="clock-alert" size={20} color={darkTheme.warning} />
                <Text style={styles.peakHourText}>{hour}</Text>
              </View>
            ))}
          </View>

          {/* Trend Chart (simplified for RN) */}
          <SectionHeader title="Activity Trends" />
          <View style={styles.trendChart}>
            <View style={styles.trendInfo}>
              <Text style={styles.trendLabel}>Total Events</Text>
              <Text style={styles.trendValue}>{trends.reduce((sum, t) => sum + t.events, 0)}</Text>
            </View>
            <View style={styles.trendBars}>
              {trends.slice(-24).map((trend, index) => {
                const maxEvents = Math.max(...trends.map(t => t.events), 1);
                const height = (trend.events / maxEvents) * 100;
                
                return (
                  <View key={index} style={styles.trendBarContainer}>
                    <View 
                      style={[
                        styles.trendBar,
                        { height: `${height}%` }
                      ]}
                    />
                  </View>
                );
              })}
            </View>
          </View>

          {/* Export Section */}
          <View style={styles.exportSection}>
            <TouchableOpacity style={styles.exportButton}>
              <MaterialCommunityIcons name="file-export" size={20} color={darkTheme.background} />
              <Text style={styles.exportButtonText}>Export Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.exportButton, { backgroundColor: darkTheme.primary }]}>
              <MaterialCommunityIcons name="email" size={20} color={darkTheme.background} />
              <Text style={styles.exportButtonText}>Email Report</Text>
            </TouchableOpacity>
          </View>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: darkTheme.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: darkTheme.textSecondary,
    marginTop: 16,
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 236, 210, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: darkTheme.text,
  },
  pageSubtitle: {
    fontSize: 16,
    color: darkTheme.textSecondary,
    marginTop: 4,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  dateRangeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: darkTheme.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  dateRangeButtonActive: {
    backgroundColor: darkTheme.primaryDim,
    borderColor: darkTheme.primary,
  },
  dateRangeText: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    fontWeight: '500',
  },
  dateRangeTextActive: {
    color: darkTheme.primary,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  severityChart: {
    backgroundColor: darkTheme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  severityItem: {
    marginBottom: 16,
  },
  severityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  severityLabel: {
    fontSize: 14,
    color: darkTheme.text,
    fontWeight: '500',
  },
  severityCount: {
    fontSize: 14,
    color: darkTheme.textSecondary,
  },
  severityBar: {
    height: 8,
    backgroundColor: darkTheme.background,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  severityFill: {
    height: '100%',
    borderRadius: 4,
  },
  severityPercentage: {
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
  sourceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  sourceCard: {
    backgroundColor: darkTheme.surface,
    borderRadius: 8,
    padding: 16,
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  sourceLabel: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    textTransform: 'capitalize',
    marginTop: 8,
  },
  sourceCount: {
    fontSize: 20,
    fontWeight: '700',
    color: darkTheme.text,
    marginTop: 4,
  },
  routesList: {
    backgroundColor: darkTheme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
  },
  routeRank: {
    width: 30,
    fontSize: 12,
    color: darkTheme.textSecondary,
    fontWeight: '600',
  },
  routeName: {
    flex: 1,
    fontSize: 14,
    color: darkTheme.text,
    fontWeight: '500',
  },
  routeBar: {
    flex: 2,
    height: 4,
    backgroundColor: darkTheme.background,
    borderRadius: 2,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  routeFill: {
    height: '100%',
    backgroundColor: darkTheme.primary,
    borderRadius: 2,
  },
  routeCount: {
    width: 40,
    fontSize: 14,
    color: darkTheme.textSecondary,
    textAlign: 'right',
  },
  rankingList: {
    backgroundColor: darkTheme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: darkTheme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    color: darkTheme.background,
    fontWeight: '700',
    fontSize: 14,
  },
  rankingContent: {
    flex: 1,
  },
  supervisorName: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
    marginBottom: 4,
  },
  supervisorStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statText: {
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '700',
    color: darkTheme.primary,
  },
  peakHours: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  peakHourItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: darkTheme.warningDim,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  peakHourText: {
    fontSize: 14,
    color: darkTheme.warning,
    fontWeight: '500',
  },
  trendChart: {
    backgroundColor: darkTheme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  trendInfo: {
    marginBottom: 16,
  },
  trendLabel: {
    fontSize: 14,
    color: darkTheme.textSecondary,
  },
  trendValue: {
    fontSize: 24,
    fontWeight: '700',
    color: darkTheme.text,
  },
  trendBars: {
    flexDirection: 'row',
    height: 100,
    alignItems: 'flex-end',
    gap: 2,
  },
  trendBarContainer: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  trendBar: {
    width: '100%',
    backgroundColor: darkTheme.primary,
    borderRadius: 2,
  },
  exportSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: darkTheme.success,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exportButtonText: {
    color: darkTheme.background,
    fontSize: 14,
    fontWeight: '600',
  },
});
