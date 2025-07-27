/*
 * Go Barry - Traffic Intelligence Platform
 * Admin Dashboard - API Usage Page
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, Pressable, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSupervisorSession } from '../../components/hooks/useSupervisorSession';
import { darkTheme } from './styles/darkTheme';
import MetricCard from './components/MetricCard';
import SectionHeader from './components/SectionHeader';
import ProgressBar from './components/ProgressBar';
import TomTomUsageMonitor from '../../components/admin/monitoring/TomTomUsageMonitor';

const API_BASE = 'https://go-barry.onrender.com';

// API Rate Limits (mock data - would come from actual API providers)
const API_LIMITS = {
  tomtom: { limit: 2500, period: 'day', cost: 0.005 },
  nationalHighways: { limit: 10000, period: 'day', cost: 0 },
  streetManager: { limit: 5000, period: 'day', cost: 0 },
  mapquest: { limit: 15000, period: 'month', cost: 0.002 },
  weather: { limit: 1000, period: 'day', cost: 0.001 }
};

export default function APIUsage() {
  const router = useRouter();
  const { supervisorSession, isAdmin } = useSupervisorSession();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // API usage data
  const [summary, setSummary] = useState(null);
  const [performance, setPerformance] = useState({});
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [apiBreakdown, setApiBreakdown] = useState({});
  
  // Time range filter
  const [timeRange, setTimeRange] = useState('24h');

  // Redirect if not admin
  useEffect(() => {
    if (supervisorSession && !isAdmin) {
      setTimeout(() => {
        router.replace('/');
      }, 0);
    }
  }, [supervisorSession, isAdmin, router]);

  // Load API usage data
  useEffect(() => {
    loadAPIUsageData();
  }, [timeRange]);

  const loadAPIUsageData = async () => {
    try {
      setLoading(true);
      
      // Fetch API usage data
      const [summaryRes, performanceRes, systemRes] = await Promise.all([
        fetch(`${API_BASE}/api/analytics/summary`),
        fetch(`${API_BASE}/api/analytics/performance`),
        fetch(`${API_BASE}/api/analytics/system-metrics?timeRange=${timeRange}`)
      ]);
      
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData.summary);
        
        // Calculate API breakdown from event types
        const breakdown = {};
        Object.entries(summaryData.summary?.eventTypes || {}).forEach(([event, count]) => {
          if (event.includes('api_')) {
            const apiName = event.replace('api_', '').replace('_call', '');
            breakdown[apiName] = count;
          }
        });
        setApiBreakdown(breakdown);
      }
      
      if (performanceRes.ok) {
        const perfData = await performanceRes.json();
        setPerformance(perfData.performance || {});
      }
      
      if (systemRes.ok) {
        const sysData = await systemRes.json();
        setSystemMetrics(sysData.systemMetrics);
      }
      
    } catch (error) {
      console.error('Error loading API usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCosts = () => {
    let totalCost = 0;
    const costBreakdown = {};
    
    Object.entries(apiBreakdown).forEach(([api, calls]) => {
      const apiConfig = API_LIMITS[api];
      if (apiConfig?.cost) {
        const cost = calls * apiConfig.cost;
        costBreakdown[api] = cost;
        totalCost += cost;
      }
    });
    
    return { total: totalCost, breakdown: costBreakdown };
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAPIUsageData();
    setRefreshing(false);
  };

  if (!supervisorSession || !isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff9a9e" />
        <Text style={styles.loadingText}>Loading API Usage...</Text>
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
              tintColor="#ff9a9e"
            />
          }
        >
          {/* Page Header */}
          <View style={styles.pageHeader}>
            <View style={styles.headerIcon}>
              <MaterialCommunityIcons name="api" size={32} color="#ff9a9e" />
            </View>
            <View>
              <Text style={styles.pageTitle}>API Usage</Text>
              <Text style={styles.pageSubtitle}>Service consumption & costs</Text>
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

          {/* Overview Metrics */}
          <SectionHeader title="Overview" />
          <View style={styles.metricsGrid}>
            <MetricCard
              label="Total API Calls"
              value={(summary?.totals?.apiCalls || 0).toLocaleString()}
              color={darkTheme.primary}
              icon="cloud-sync"
            />
            <MetricCard
              label="Error Rate"
              value={`${systemMetrics?.activity?.errorRate || 0}%`}
              color={systemMetrics?.activity?.errorRate > 5 ? darkTheme.error : darkTheme.success}
              icon="alert-circle"
            />
            <MetricCard
              label="Avg Response"
              value={`${systemMetrics?.performance?.averageApiResponseTime || 0}ms`}
              color={darkTheme.warning}
              icon="timer"
            />
            <MetricCard
              label="Est. Cost"
              value={`£${calculateCosts().total.toFixed(2)}`}
              color={darkTheme.accent}
              icon="currency-gbp"
            />
          </View>

          {/* API Breakdown */}
          <SectionHeader title="API Service Usage" />
          <View style={styles.apiBreakdownContainer}>
            {Object.keys(API_LIMITS).map(apiName => {
              const calls = apiBreakdown[apiName] || 0;
              const limit = API_LIMITS[apiName].limit;
              const usage = (calls / limit) * 100;
              const isNearLimit = usage > 80;
              
              return (
                <View key={apiName} style={styles.apiCard}>
                  <View style={styles.apiHeader}>
                    <View style={styles.apiInfo}>
                      <Text style={styles.apiName}>{apiName}</Text>
                      <Text style={styles.apiCalls}>{calls.toLocaleString()} calls</Text>
                    </View>
                    <View style={[styles.apiStatus, isNearLimit && styles.apiStatusWarning]}>
                      <Text style={[styles.apiStatusText, isNearLimit && styles.apiStatusTextWarning]}>
                        {usage.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                  <ProgressBar 
                    progress={usage / 100} 
                    color={isNearLimit ? darkTheme.warning : darkTheme.primary}
                    height={8}
                  />
                  <View style={styles.apiFooter}>
                    <Text style={styles.apiLimit}>
                      Limit: {limit.toLocaleString()}/{API_LIMITS[apiName].period}
                    </Text>
                    {API_LIMITS[apiName].cost > 0 && (
                      <Text style={styles.apiCost}>
                        £{(calls * API_LIMITS[apiName].cost).toFixed(2)}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* TomTom Usage Monitor */}
          <SectionHeader title="TomTom API Detailed Usage" />
          <View style={styles.tomtomMonitorContainer}>
            <TomTomUsageMonitor />
          </View>

          {/* Performance Metrics */}
          <SectionHeader title="Performance Metrics" />
          <View style={styles.performanceGrid}>
            {Object.entries(performance).map(([metric, data]) => (
              <View key={metric} style={styles.perfCard}>
                <Text style={styles.perfMetric}>{metric.replace(/_/g, ' ')}</Text>
                <View style={styles.perfStats}>
                  <View style={styles.perfStat}>
                    <Text style={styles.perfLabel}>Avg</Text>
                    <Text style={styles.perfValue}>{Math.round(data.average || 0)}ms</Text>
                  </View>
                  <View style={styles.perfStat}>
                    <Text style={styles.perfLabel}>P95</Text>
                    <Text style={styles.perfValue}>{Math.round(data.p95 || 0)}ms</Text>
                  </View>
                  <View style={styles.perfStat}>
                    <Text style={styles.perfLabel}>P99</Text>
                    <Text style={styles.perfValue}>{Math.round(data.p99 || 0)}ms</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Throughput Stats */}
          <SectionHeader title="Throughput" />
          <View style={styles.throughputContainer}>
            <View style={styles.throughputCard}>
              <MaterialCommunityIcons name="speedometer" size={32} color={darkTheme.primary} />
              <Text style={styles.throughputValue}>
                {systemMetrics?.performance?.throughput?.apiCallsPerMinute?.toFixed(1) || 0}
              </Text>
              <Text style={styles.throughputLabel}>API Calls/min</Text>
            </View>
            <View style={styles.throughputCard}>
              <MaterialCommunityIcons name="transfer" size={32} color={darkTheme.success} />
              <Text style={styles.throughputValue}>
                {systemMetrics?.performance?.throughput?.eventsPerMinute?.toFixed(1) || 0}
              </Text>
              <Text style={styles.throughputLabel}>Events/min</Text>
            </View>
          </View>

          {/* Cost Summary */}
          <SectionHeader title="Cost Analysis" />
          <View style={styles.costContainer}>
            <View style={styles.costHeader}>
              <Text style={styles.costTitle}>Estimated Daily Cost</Text>
              <Text style={styles.costTotal}>£{calculateCosts().total.toFixed(2)}</Text>
            </View>
            <View style={styles.costBreakdown}>
              {Object.entries(calculateCosts().breakdown)
                .filter(([_, cost]) => cost > 0)
                .map(([api, cost]) => (
                  <View key={api} style={styles.costItem}>
                    <Text style={styles.costApi}>{api}</Text>
                    <Text style={styles.costAmount}>£{cost.toFixed(2)}</Text>
                  </View>
                ))
              }
            </View>
            <Text style={styles.costNote}>
              Note: Costs are estimated based on current usage rates
            </Text>
          </View>

          {/* Rate Limit Warnings */}
          {Object.entries(apiBreakdown).some(([api, calls]) => {
            const limit = API_LIMITS[api]?.limit || 0;
            return (calls / limit) > 0.8;
          }) && (
            <View style={styles.warningContainer}>
              <MaterialCommunityIcons name="alert" size={24} color={darkTheme.warning} />
              <Text style={styles.warningText}>
                Some APIs are approaching their rate limits
              </Text>
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
    backgroundColor: 'rgba(255, 154, 158, 0.1)',
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
  apiBreakdownContainer: {
    marginBottom: 24,
  },
  tomtomMonitorContainer: {
    marginBottom: 24,
  },
  apiCard: {
    backgroundColor: darkTheme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  apiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  apiInfo: {
    flex: 1,
  },
  apiName: {
    fontSize: 16,
    fontWeight: '600',
    color: darkTheme.text,
    textTransform: 'capitalize',
  },
  apiCalls: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    marginTop: 2,
  },
  apiStatus: {
    backgroundColor: darkTheme.primaryDim,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  apiStatusWarning: {
    backgroundColor: darkTheme.warningDim,
  },
  apiStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: darkTheme.primary,
  },
  apiStatusTextWarning: {
    color: darkTheme.warning,
  },
  apiFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  apiLimit: {
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
  apiCost: {
    fontSize: 12,
    fontWeight: '600',
    color: darkTheme.accent,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  perfCard: {
    backgroundColor: darkTheme.surface,
    borderRadius: 8,
    padding: 16,
    minWidth: '48%',
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  perfMetric: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
    textTransform: 'capitalize',
    marginBottom: 12,
  },
  perfStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  perfStat: {
    alignItems: 'center',
  },
  perfLabel: {
    fontSize: 11,
    color: darkTheme.textSecondary,
  },
  perfValue: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
    marginTop: 2,
  },
  throughputContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  throughputCard: {
    flex: 1,
    backgroundColor: darkTheme.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  throughputValue: {
    fontSize: 36,
    fontWeight: '700',
    color: darkTheme.text,
    marginVertical: 8,
  },
  throughputLabel: {
    fontSize: 14,
    color: darkTheme.textSecondary,
  },
  costContainer: {
    backgroundColor: darkTheme.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  costHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  costTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: darkTheme.text,
  },
  costTotal: {
    fontSize: 24,
    fontWeight: '700',
    color: darkTheme.accent,
  },
  costBreakdown: {
    marginBottom: 16,
  },
  costItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
  },
  costApi: {
    fontSize: 14,
    color: darkTheme.text,
    textTransform: 'capitalize',
  },
  costAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.textSecondary,
  },
  costNote: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    fontStyle: 'italic',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkTheme.warningDim,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: darkTheme.warning,
  },
});
