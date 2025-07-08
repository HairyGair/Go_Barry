/*
 * Go Barry - Roadworks Analytics Dashboard
 * Comprehensive analytics and reporting interface for roadworks management
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { roadworksStyles, colors, spacing } from '../styles/roadworks.styles';
import StatCard from './StatCard';
import TrendChart from './TrendChart';
import PerformanceMetrics from './PerformanceMetrics';

const { width: screenWidth } = Dimensions.get('window');

const RoadworksAnalyticsDashboard = ({ baseUrl, sessionId, supervisorName }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d'); // 1d, 7d, 30d, 90d
  const [selectedMetric, setSelectedMetric] = useState('overview');

  // Fetch analytics data
  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${baseUrl}/api/roadworks-v2/analytics?timeframe=${selectedTimeframe}`, {
        headers: {
          'x-session-id': sessionId,
          'x-supervisor': supervisorName
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (fetchError) {
      console.error('Failed to fetch analytics:', fetchError);
      setError(fetchError.message);
      Alert.alert('Error', 'Failed to load roadworks analytics');
    } finally {
      setLoading(false);
    }
  };

  // Generate report
  const generateReport = async (reportType) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${baseUrl}/api/roadworks-v2/reports/${reportType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
          'x-supervisor': supervisorName
        },
        body: JSON.stringify({
          timeframe: selectedTimeframe,
          requestedBy: supervisorName
        })
      });

      if (response.ok) {
        const result = await response.json();
        Alert.alert('Success', `${reportType} report generated and sent successfully`);
      } else {
        throw new Error(`Failed to generate ${reportType} report`);
      }
    } catch (reportError) {
      console.error('Error generating report:', reportError);
      Alert.alert('Error', `Failed to generate ${reportType} report`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedTimeframe]);

  if (loading && !analytics) {
    return (
      <View style={roadworksStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={roadworksStyles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  if (error && !analytics) {
    return (
      <View style={roadworksStyles.errorContainer}>
        <Ionicons name="analytics" size={48} color={colors.textMuted} />
        <Text style={roadworksStyles.errorTitle}>Analytics Unavailable</Text>
        <Text style={roadworksStyles.errorDescription}>{error}</Text>
        <Pressable
          style={roadworksStyles.retryButton}
          onPress={fetchAnalytics}
        >
          <Text style={roadworksStyles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const chartConfig = {
    backgroundColor: colors.background,
    backgroundGradientFrom: colors.background,
    backgroundGradientTo: colors.background,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: colors.primary
    }
  };

  return (
    <View style={roadworksStyles.container}>
      {/* Header */}
      <View style={roadworksStyles.section}>
        <View style={[roadworksStyles.row, { justifyContent: 'space-between', marginBottom: spacing.md }]}>
          <View>
            <Text style={roadworksStyles.sectionTitle}>Roadworks Analytics</Text>
            <Text style={roadworksStyles.textMuted}>
              Performance insights and trends
            </Text>
          </View>
          
          <Pressable
            style={[roadworksStyles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => generateReport('weekly')}
            disabled={loading}
          >
            <Ionicons name="document-text" size={16} color={colors.textPrimary} />
            <Text style={roadworksStyles.actionButtonText}>Generate Report</Text>
          </Pressable>
        </View>

        {/* Timeframe Selector */}
        <View style={roadworksStyles.segmentedControl}>
          {[
            { key: '1d', label: '24H' },
            { key: '7d', label: '7D' },
            { key: '30d', label: '30D' },
            { key: '90d', label: '90D' }
          ].map(option => (
            <Pressable
              key={option.key}
              style={[
                roadworksStyles.segmentOption,
                selectedTimeframe === option.key && roadworksStyles.segmentOptionActive
              ]}
              onPress={() => setSelectedTimeframe(option.key)}
            >
              <Text style={[
                roadworksStyles.segmentOptionText,
                selectedTimeframe === option.key && roadworksStyles.segmentOptionTextActive
              ]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView
        style={roadworksStyles.scrollContainer}
        contentContainerStyle={{ padding: spacing.md }}
        showsVerticalScrollIndicator={false}
      >
        {/* Key Metrics */}
        {analytics?.overview && (
          <View style={roadworksStyles.metricsGrid}>
            <StatCard
              title="Total Roadworks"
              value={analytics.overview.totalRoadworks}
              change={analytics.overview.totalChange}
              icon="layers"
              color={colors.primary}
            />
            <StatCard
              title="Active Now"
              value={analytics.overview.activeRoadworks}
              change={analytics.overview.activeChange}
              icon="time"
              color={colors.warning}
            />
            <StatCard
              title="With Diversions"
              value={analytics.overview.withDiversions}
              change={analytics.overview.diversionChange}
              icon="swap-horizontal"
              color={colors.success}
            />
            <StatCard
              title="Avg Duration"
              value={`${analytics.overview.avgDuration}d`}
              change={analytics.overview.durationChange}
              icon="hourglass"
              color={colors.info}
            />
          </View>
        )}

        {/* Roadworks Trend Chart */}
        {analytics?.trends?.daily && (
          <View style={roadworksStyles.chartContainer}>
            <View style={roadworksStyles.chartHeader}>
              <Text style={roadworksStyles.chartTitle}>Roadworks Trend</Text>
              <View style={roadworksStyles.chartLegend}>
                <View style={roadworksStyles.legendItem}>
                  <View style={[roadworksStyles.legendDot, { backgroundColor: colors.primary }]} />
                  <Text style={roadworksStyles.legendText}>New</Text>
                </View>
                <View style={roadworksStyles.legendItem}>
                  <View style={[roadworksStyles.legendDot, { backgroundColor: colors.success }]} />
                  <Text style={roadworksStyles.legendText}>Completed</Text>
                </View>
              </View>
            </View>
            
            <LineChart
              data={{
                labels: analytics.trends.daily.labels.slice(-7),
                datasets: [
                  {
                    data: analytics.trends.daily.newRoadworks.slice(-7),
                    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                    strokeWidth: 2
                  },
                  {
                    data: analytics.trends.daily.completedRoadworks.slice(-7),
                    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                    strokeWidth: 2
                  }
                ]
              }}
              width={screenWidth - 40}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={roadworksStyles.chart}
            />
          </View>
        )}

        {/* Severity Distribution */}
        {analytics?.severity && (
          <View style={roadworksStyles.chartContainer}>
            <Text style={roadworksStyles.chartTitle}>Severity Distribution</Text>
            
            <PieChart
              data={[
                {
                  name: 'Critical',
                  population: analytics.severity.critical,
                  color: '#DC2626',
                  legendFontColor: colors.textSecondary,
                  legendFontSize: 12
                },
                {
                  name: 'High',
                  population: analytics.severity.high,
                  color: '#EF4444',
                  legendFontColor: colors.textSecondary,
                  legendFontSize: 12
                },
                {
                  name: 'Medium',
                  population: analytics.severity.medium,
                  color: '#F59E0B',
                  legendFontColor: colors.textSecondary,
                  legendFontSize: 12
                },
                {
                  name: 'Low',
                  population: analytics.severity.low,
                  color: '#10B981',
                  legendFontColor: colors.textSecondary,
                  legendFontSize: 12
                }
              ].filter(item => item.population > 0)}
              width={screenWidth - 40}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              style={roadworksStyles.chart}
            />
          </View>
        )}

        {/* Top Promoters */}
        {analytics?.promoters && analytics.promoters.length > 0 && (
          <View style={roadworksStyles.chartContainer}>
            <Text style={roadworksStyles.chartTitle}>Most Active Promoters</Text>
            
            <BarChart
              data={{
                labels: analytics.promoters.slice(0, 5).map(p => p.name.substring(0, 8)),
                datasets: [{
                  data: analytics.promoters.slice(0, 5).map(p => p.count)
                }]
              }}
              width={screenWidth - 40}
              height={220}
              chartConfig={chartConfig}
              verticalLabelRotation={30}
              style={roadworksStyles.chart}
            />
            
            <View style={roadworksStyles.promoterList}>
              {analytics.promoters.slice(0, 8).map((promoter, index) => (
                <View key={promoter.name} style={roadworksStyles.promoterItem}>
                  <View style={roadworksStyles.promoterRank}>
                    <Text style={roadworksStyles.promoterRankText}>{index + 1}</Text>
                  </View>
                  <View style={roadworksStyles.promoterInfo}>
                    <Text style={roadworksStyles.promoterName}>{promoter.name}</Text>
                    <Text style={roadworksStyles.promoterCount}>{promoter.count} roadworks</Text>
                  </View>
                  <Text style={roadworksStyles.promoterPercentage}>
                    {((promoter.count / analytics.overview.totalRoadworks) * 100).toFixed(1)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Performance Metrics */}
        {analytics?.performance && (
          <PerformanceMetrics 
            data={analytics.performance}
            timeframe={selectedTimeframe}
          />
        )}

        {/* Diversion Effectiveness */}
        {analytics?.diversions && (
          <View style={roadworksStyles.chartContainer}>
            <Text style={roadworksStyles.chartTitle}>Diversion Effectiveness</Text>
            
            <View style={roadworksStyles.effectivenessGrid}>
              <View style={roadworksStyles.effectivenessCard}>
                <Text style={roadworksStyles.effectivenessValue}>
                  {analytics.diversions.successRate.toFixed(1)}%
                </Text>
                <Text style={roadworksStyles.effectivenessLabel}>Success Rate</Text>
                <View style={[
                  roadworksStyles.effectivenessIndicator,
                  { backgroundColor: analytics.diversions.successRate >= 80 ? colors.success : colors.warning }
                ]} />
              </View>
              
              <View style={roadworksStyles.effectivenessCard}>
                <Text style={roadworksStyles.effectivenessValue}>
                  {analytics.diversions.avgDelay}min
                </Text>
                <Text style={roadworksStyles.effectivenessLabel}>Avg Delay</Text>
                <View style={[
                  roadworksStyles.effectivenessIndicator,
                  { backgroundColor: analytics.diversions.avgDelay <= 10 ? colors.success : colors.warning }
                ]} />
              </View>
              
              <View style={roadworksStyles.effectivenessCard}>
                <Text style={roadworksStyles.effectivenessValue}>
                  {analytics.diversions.templateReuse}%
                </Text>
                <Text style={roadworksStyles.effectivenessLabel}>Template Reuse</Text>
                <View style={[
                  roadworksStyles.effectivenessIndicator,
                  { backgroundColor: analytics.diversions.templateReuse >= 60 ? colors.success : colors.info }
                ]} />
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={roadworksStyles.quickActionsContainer}>
          <Text style={roadworksStyles.sectionTitle}>Quick Actions</Text>
          
          <View style={roadworksStyles.quickActionsGrid}>
            <Pressable
              style={roadworksStyles.quickActionCard}
              onPress={() => generateReport('daily')}
            >
              <Ionicons name="document" size={32} color={colors.primary} />
              <Text style={roadworksStyles.quickActionTitle}>Daily Report</Text>
              <Text style={roadworksStyles.quickActionDescription}>Generate today's summary</Text>
            </Pressable>
            
            <Pressable
              style={roadworksStyles.quickActionCard}
              onPress={() => generateReport('weekly')}
            >
              <Ionicons name="calendar" size={32} color={colors.success} />
              <Text style={roadworksStyles.quickActionTitle}>Weekly Summary</Text>
              <Text style={roadworksStyles.quickActionDescription}>Comprehensive weekly report</Text>
            </Pressable>
            
            <Pressable
              style={roadworksStyles.quickActionCard}
              onPress={fetchAnalytics}
            >
              <Ionicons name="refresh" size={32} color={colors.info} />
              <Text style={roadworksStyles.quickActionTitle}>Refresh Data</Text>
              <Text style={roadworksStyles.quickActionDescription}>Update analytics</Text>
            </Pressable>
          </View>
        </View>

        {/* Export Options */}
        <View style={roadworksStyles.exportContainer}>
          <Text style={roadworksStyles.sectionTitle}>Export Data</Text>
          <Text style={roadworksStyles.textMuted}>
            Export analytics data for external analysis
          </Text>
          
          <View style={roadworksStyles.exportButtonsGrid}>
            <Pressable
              style={[roadworksStyles.exportButton, { backgroundColor: colors.success }]}
              onPress={() => generateReport('csv')}
            >
              <Ionicons name="document-text" size={16} color={colors.textPrimary} />
              <Text style={roadworksStyles.exportButtonText}>CSV Export</Text>
            </Pressable>
            
            <Pressable
              style={[roadworksStyles.exportButton, { backgroundColor: colors.info }]}
              onPress={() => generateReport('excel')}
            >
              <Ionicons name="grid" size={16} color={colors.textPrimary} />
              <Text style={roadworksStyles.exportButtonText}>Excel Export</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default RoadworksAnalyticsDashboard;