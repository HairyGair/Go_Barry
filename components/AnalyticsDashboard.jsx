// Analytics Dashboard Component
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import analytics, { useAnalytics } from '../services/analytics';

const { width } = Dimensions.get('window');

const AnalyticsDashboard = ({ supervisorSession }) => {
  const [timeRange, setTimeRange] = useState('today'); // today, week, month
  const [analyticsData, setAnalyticsData] = useState({
    overview: {
      totalEvents: 0,
      uniqueUsers: 0,
      avgSessionDuration: 0,
      bounceRate: 0,
    },
    traffic: {
      pageViews: [],
      topPages: [],
      userFlow: [],
    },
    engagement: {
      featureUsage: [],
      interactions: [],
      errorRate: 0,
    },
    performance: {
      avgLoadTime: 0,
      avgResponseTime: 0,
      uptime: 99.9,
    },
  });
  const [loading, setLoading] = useState(true);
  const { track } = useAnalytics();

  useEffect(() => {
    fetchAnalyticsData();
    track('analytics_dashboard_viewed', { timeRange });
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // In production, this would fetch from your analytics API
      // For now, we'll simulate with mock data
      setTimeout(() => {
        setAnalyticsData({
          overview: {
            totalEvents: Math.floor(Math.random() * 10000) + 5000,
            uniqueUsers: Math.floor(Math.random() * 100) + 50,
            avgSessionDuration: Math.floor(Math.random() * 600) + 300, // seconds
            bounceRate: Math.floor(Math.random() * 30) + 10, // percentage
          },
          traffic: {
            pageViews: generateTimeSeriesData(),
            topPages: [
              { page: '/dashboard', views: 2456, avgTime: 185 },
              { page: '/display', views: 1823, avgTime: 420 },
              { page: '/incidents', views: 945, avgTime: 90 },
              { page: '/roadworks', views: 612, avgTime: 120 },
              { page: '/help', views: 234, avgTime: 60 },
            ],
          },
          engagement: {
            featureUsage: [
              { feature: 'Alert Dismissal', count: 342, users: 8 },
              { feature: 'Map Interaction', count: 1523, users: 9 },
              { feature: 'Incident Creation', count: 67, users: 6 },
              { feature: 'Quick Actions', count: 489, users: 9 },
              { feature: 'Search', count: 234, users: 7 },
            ],
            interactions: generateInteractionData(),
            errorRate: Math.random() * 2, // percentage
          },
          performance: {
            avgLoadTime: Math.floor(Math.random() * 1000) + 500, // ms
            avgResponseTime: Math.floor(Math.random() * 200) + 50, // ms
            uptime: 99.9,
          },
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setLoading(false);
    }
  };

  const generateTimeSeriesData = () => {
    const data = [];
    const hours = timeRange === 'today' ? 24 : timeRange === 'week' ? 7 : 30;
    for (let i = 0; i < hours; i++) {
      data.push({
        time: i,
        views: Math.floor(Math.random() * 200) + 50,
      });
    }
    return data;
  };

  const generateInteractionData = () => {
    return [
      { type: 'clicks', count: Math.floor(Math.random() * 1000) + 500 },
      { type: 'scrolls', count: Math.floor(Math.random() * 2000) + 1000 },
      { type: 'forms', count: Math.floor(Math.random() * 100) + 20 },
      { type: 'downloads', count: Math.floor(Math.random() * 50) + 10 },
    ];
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const MetricCard = ({ icon, title, value, subtitle, color = '#3B82F6' }) => (
    <View style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </View>
  );

  const TimeRangeSelector = () => (
    <View style={styles.timeRangeContainer}>
      {['today', 'week', 'month'].map((range) => (
        <TouchableOpacity
          key={range}
          style={[
            styles.timeRangeButton,
            timeRange === range && styles.timeRangeButtonActive,
          ]}
          onPress={() => {
            setTimeRange(range);
            track('analytics_time_range_changed', { range });
          }}
        >
          <Text
            style={[
              styles.timeRangeText,
              timeRange === range && styles.timeRangeTextActive,
            ]}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Analytics Dashboard</Text>
          <Text style={styles.subtitle}>
            Track usage, performance, and engagement metrics
          </Text>
        </View>
        <TimeRangeSelector />
      </View>

      {/* Overview Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            icon="analytics"
            title="Total Events"
            value={analyticsData.overview.totalEvents.toLocaleString()}
            subtitle={`Last ${timeRange}`}
            color="#3B82F6"
          />
          <MetricCard
            icon="people"
            title="Unique Users"
            value={analyticsData.overview.uniqueUsers}
            subtitle="Active supervisors"
            color="#10B981"
          />
          <MetricCard
            icon="time"
            title="Avg Session"
            value={formatDuration(analyticsData.overview.avgSessionDuration)}
            subtitle="Duration per user"
            color="#8B5CF6"
          />
          <MetricCard
            icon="exit"
            title="Bounce Rate"
            value={`${analyticsData.overview.bounceRate}%`}
            subtitle="Single page sessions"
            color="#F59E0B"
          />
        </View>
      </View>

      {/* Traffic Analytics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Traffic Analytics</Text>
        
        {/* Page Views Chart (simplified representation) */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Page Views Over Time</Text>
          <View style={styles.chart}>
            {analyticsData.traffic.pageViews.slice(-12).map((data, index) => (
              <View
                key={index}
                style={[
                  styles.chartBar,
                  {
                    height: `${(data.views / 200) * 100}%`,
                    backgroundColor: '#3B82F6',
                  },
                ]}
              />
            ))}
          </View>
          <Text style={styles.chartLabel}>
            {timeRange === 'today' ? 'Last 12 hours' : 
             timeRange === 'week' ? 'Last 7 days' : 'Last 30 days'}
          </Text>
        </View>

        {/* Top Pages */}
        <View style={styles.topPagesContainer}>
          <Text style={styles.chartTitle}>Top Pages</Text>
          {analyticsData.traffic.topPages.map((page, index) => (
            <View key={index} style={styles.topPageItem}>
              <View style={styles.topPageInfo}>
                <Text style={styles.topPageRank}>#{index + 1}</Text>
                <Text style={styles.topPageName}>{page.page}</Text>
              </View>
              <View style={styles.topPageStats}>
                <Text style={styles.topPageViews}>{page.views.toLocaleString()} views</Text>
                <Text style={styles.topPageTime}>{page.avgTime}s avg</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Feature Usage */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Feature Engagement</Text>
        {analyticsData.engagement.featureUsage.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <View style={styles.featureInfo}>
              <Text style={styles.featureName}>{feature.feature}</Text>
              <Text style={styles.featureUsers}>{feature.users} users</Text>
            </View>
            <View style={styles.featureBar}>
              <View
                style={[
                  styles.featureProgress,
                  {
                    width: `${(feature.count / 1500) * 100}%`,
                    backgroundColor: ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'][index],
                  },
                ]}
              />
            </View>
            <Text style={styles.featureCount}>{feature.count}</Text>
          </View>
        ))}
      </View>

      {/* Performance Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance</Text>
        <View style={styles.performanceGrid}>
          <View style={styles.performanceItem}>
            <Ionicons name="speedometer" size={32} color="#10B981" />
            <Text style={styles.performanceLabel}>Avg Load Time</Text>
            <Text style={styles.performanceValue}>
              {analyticsData.performance.avgLoadTime}ms
            </Text>
          </View>
          <View style={styles.performanceItem}>
            <Ionicons name="flash" size={32} color="#3B82F6" />
            <Text style={styles.performanceLabel}>Response Time</Text>
            <Text style={styles.performanceValue}>
              {analyticsData.performance.avgResponseTime}ms
            </Text>
          </View>
          <View style={styles.performanceItem}>
            <Ionicons name="checkmark-circle" size={32} color="#10B981" />
            <Text style={styles.performanceLabel}>Uptime</Text>
            <Text style={styles.performanceValue}>
              {analyticsData.performance.uptime}%
            </Text>
          </View>
          <View style={styles.performanceItem}>
            <Ionicons name="warning" size={32} color="#EF4444" />
            <Text style={styles.performanceLabel}>Error Rate</Text>
            <Text style={styles.performanceValue}>
              {analyticsData.engagement.errorRate.toFixed(1)}%
            </Text>
          </View>
        </View>
      </View>

      {/* Export Actions */}
      <View style={styles.exportSection}>
        <TouchableOpacity
          style={styles.exportButton}
          onPress={() => {
            track('analytics_export_clicked', { format: 'csv' });
            alert('Export functionality coming soon!');
          }}
        >
          <Ionicons name="download" size={20} color="#fff" />
          <Text style={styles.exportButtonText}>Export to CSV</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.exportButton, styles.exportButtonSecondary]}
          onPress={() => {
            track('analytics_share_clicked');
            alert('Share functionality coming soon!');
          }}
        >
          <Ionicons name="share" size={20} color="#3B82F6" />
          <Text style={[styles.exportButtonText, { color: '#3B82F6' }]}>
            Share Report
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#64748B',
    fontSize: 16,
  },
  header: {
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#E5E7EB',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  timeRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1E293B',
  },
  timeRangeButtonActive: {
    backgroundColor: '#3B82F6',
  },
  timeRangeText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  timeRangeTextActive: {
    color: '#fff',
  },
  section: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#E5E7EB',
    marginBottom: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metricCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    flex: 1,
    minWidth: width > 768 ? 200 : '45%',
    alignItems: 'center',
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricTitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#E5E7EB',
  },
  metricSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 16,
  },
  chart: {
    height: 120,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  chartBar: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 4,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
  },
  topPagesContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
  },
  topPageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  topPageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topPageRank: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  topPageName: {
    fontSize: 14,
    color: '#E5E7EB',
  },
  topPageStats: {
    alignItems: 'flex-end',
  },
  topPageViews: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  topPageTime: {
    fontSize: 12,
    color: '#64748B',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureInfo: {
    width: 140,
  },
  featureName: {
    fontSize: 14,
    color: '#E5E7EB',
    fontWeight: '600',
  },
  featureUsers: {
    fontSize: 12,
    color: '#64748B',
  },
  featureBar: {
    flex: 1,
    height: 20,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  featureProgress: {
    height: '100%',
    borderRadius: 10,
  },
  featureCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E7EB',
    width: 50,
    textAlign: 'right',
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  performanceItem: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    flex: 1,
    minWidth: width > 768 ? 200 : '45%',
    alignItems: 'center',
  },
  performanceLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
    marginBottom: 4,
  },
  performanceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#E5E7EB',
  },
  exportSection: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
  },
  exportButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AnalyticsDashboard;