/*
 * Go Barry - Roadworks Analytics Dashboard
 * Analytics and reporting for roadworks management
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { roadworksStyles, colors, spacing } from '../styles/roadworks.styles';
import AnalyticsChart from './AnalyticsChart';
import MetricsGrid from './MetricsGrid';
import PerformanceReport from './PerformanceReport';
import TrendsAnalysis from './TrendsAnalysis';

const { width: screenWidth } = Dimensions.get('window');

const RoadworksAnalytics = ({ baseUrl, sessionId, supervisorName }) => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week'); // week, month, quarter, year
  const [analyticsData, setAnalyticsData] = useState({
    overview: {
      totalRoadworks: 0,
      avgResolutionTime: 0,
      routesAffected: 0,
      diversionsCreated: 0,
      supervisorActions: 0,
      dataQuality: 0
    },
    trends: {
      roadworksByDay: [],
      severityDistribution: [],
      sourceBreakdown: [],
      routeImpact: []
    },
    performance: {
      reviewSpeed: 0,
      approvalRate: 0,
      diversionEffectiveness: 0,
      supervisorActivity: []
    },
    predictions: {
      nextWeekVolume: 0,
      criticalHotspots: [],
      peakTimes: []
    }
  });

  // Fetch analytics data
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/roadworks-v2/analytics?range=${timeRange}`, {
        headers: {
          'x-session-id': sessionId
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const timeRangeOptions = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' }
  ];

  if (loading) {
    return (
      <View style={roadworksStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={roadworksStyles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={roadworksStyles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={roadworksStyles.section}>
        <View style={[roadworksStyles.row, { justifyContent: 'space-between', marginBottom: spacing.md }]}>
          <View>
            <Text style={roadworksStyles.sectionTitle}>Analytics Dashboard</Text>
            <Text style={roadworksStyles.textMuted}>
              Roadworks insights and performance metrics
            </Text>
          </View>
          
          {/* Export Button */}
          <Pressable
            style={[roadworksStyles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => {/* Export report */}}
          >
            <Ionicons name="download" size={16} color={colors.textPrimary} />
            <Text style={roadworksStyles.actionButtonText}>Export Report</Text>
          </Pressable>
        </View>

        {/* Time Range Selector */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: spacing.lg }}
        >
          {timeRangeOptions.map(option => (
            <Pressable
              key={option.value}
              style={[
                roadworksStyles.timeRangeButton,
                timeRange === option.value && roadworksStyles.timeRangeButtonActive
              ]}
              onPress={() => setTimeRange(option.value)}
            >
              <Text style={[
                roadworksStyles.timeRangeText,
                timeRange === option.value && roadworksStyles.timeRangeTextActive
              ]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Key Metrics Grid */}
      <MetricsGrid metrics={analyticsData.overview} />

      {/* Roadworks Volume Chart */}
      <View style={roadworksStyles.chartSection}>
        <Text style={roadworksStyles.chartTitle}>Roadworks Volume</Text>
        <Text style={roadworksStyles.chartSubtitle}>
          Daily roadworks over {timeRange === 'week' ? 'the past week' : `the past ${timeRange}`}
        </Text>
        <AnalyticsChart
          type="line"
          data={analyticsData.trends.roadworksByDay}
          height={200}
          color={colors.primary}
        />
      </View>

      {/* Severity Distribution */}
      <View style={roadworksStyles.chartSection}>
        <Text style={roadworksStyles.chartTitle}>Severity Distribution</Text>
        <View style={roadworksStyles.row}>
          <AnalyticsChart
            type="pie"
            data={analyticsData.trends.severityDistribution}
            height={180}
            width={screenWidth * 0.4}
          />
          <View style={roadworksStyles.legendContainer}>
            {analyticsData.trends.severityDistribution.map((item, index) => (
              <View key={index} style={roadworksStyles.legendItem}>
                <View style={[
                  roadworksStyles.legendDot,
                  { backgroundColor: item.color }
                ]} />
                <Text style={roadworksStyles.legendLabel}>{item.label}</Text>
                <Text style={roadworksStyles.legendValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Source Breakdown */}
      <View style={roadworksStyles.chartSection}>
        <Text style={roadworksStyles.chartTitle}>Data Sources</Text>
        <Text style={roadworksStyles.chartSubtitle}>
          Roadworks by source system
        </Text>
        <AnalyticsChart
          type="bar"
          data={analyticsData.trends.sourceBreakdown}
          height={180}
          color={colors.secondary}
        />
      </View>

      {/* Route Impact Analysis */}
      <View style={roadworksStyles.chartSection}>
        <Text style={roadworksStyles.chartTitle}>Most Affected Routes</Text>
        <TrendsAnalysis
          data={analyticsData.trends.routeImpact}
          type="routes"
        />
      </View>

      {/* Performance Metrics */}
      <PerformanceReport
        performance={analyticsData.performance}
        timeRange={timeRange}
      />

      {/* Predictions & Insights */}
      <View style={roadworksStyles.insightsSection}>
        <Text style={roadworksStyles.sectionTitle}>Insights & Predictions</Text>
        
        <View style={roadworksStyles.insightCard}>
          <Ionicons name="trending-up" size={24} color={colors.primary} />
          <View style={roadworksStyles.insightContent}>
            <Text style={roadworksStyles.insightTitle}>Expected Volume</Text>
            <Text style={roadworksStyles.insightValue}>
              {analyticsData.predictions.nextWeekVolume} roadworks
            </Text>
            <Text style={roadworksStyles.insightDescription}>
              Predicted for next week based on historical patterns
            </Text>
          </View>
        </View>

        <View style={roadworksStyles.insightCard}>
          <Ionicons name="location" size={24} color={colors.error} />
          <View style={roadworksStyles.insightContent}>
            <Text style={roadworksStyles.insightTitle}>Critical Hotspots</Text>
            {analyticsData.predictions.criticalHotspots.slice(0, 3).map((hotspot, index) => (
              <Text key={index} style={roadworksStyles.hotspotText}>
                • {hotspot.location} ({hotspot.count} incidents)
              </Text>
            ))}
          </View>
        </View>

        <View style={roadworksStyles.insightCard}>
          <Ionicons name="time" size={24} color={colors.warning} />
          <View style={roadworksStyles.insightContent}>
            <Text style={roadworksStyles.insightTitle}>Peak Activity Times</Text>
            {analyticsData.predictions.peakTimes.map((time, index) => (
              <Text key={index} style={roadworksStyles.peakTimeText}>
                • {time.day}: {time.hour} ({time.percentage}% of daily volume)
              </Text>
            ))}
          </View>
        </View>
      </View>

      {/* Supervisor Activity */}
      <View style={roadworksStyles.section}>
        <Text style={roadworksStyles.sectionTitle}>Supervisor Activity</Text>
        <View style={roadworksStyles.supervisorGrid}>
          {analyticsData.performance.supervisorActivity.map((supervisor, index) => (
            <View key={index} style={roadworksStyles.supervisorCard}>
              <Text style={roadworksStyles.supervisorName}>{supervisor.name}</Text>
              <View style={roadworksStyles.supervisorStats}>
                <View style={roadworksStyles.supervisorStat}>
                  <Text style={roadworksStyles.supervisorStatValue}>{supervisor.reviews}</Text>
                  <Text style={roadworksStyles.supervisorStatLabel}>Reviews</Text>
                </View>
                <View style={roadworksStyles.supervisorStat}>
                  <Text style={roadworksStyles.supervisorStatValue}>{supervisor.avgTime}m</Text>
                  <Text style={roadworksStyles.supervisorStatLabel}>Avg Time</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

export default RoadworksAnalytics;