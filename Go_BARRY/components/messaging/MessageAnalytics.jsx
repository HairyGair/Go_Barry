// components/messaging/MessageAnalytics.jsx
// Advanced analytics dashboard for Message Distribution Centre Phase 7
// Real-time delivery metrics, engagement tracking, and performance insights

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupervisor } from '../hooks/useSupervisorSession';
import {
  LineChart,
  BarChart,
  PieChart,
} from 'react-native-chart-kit';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = Platform.OS === 'web' ? Math.min(screenWidth * 0.9, 800) : screenWidth - 40;

const MessageAnalytics = ({ visible, onClose }) => {
  const { supervisor } = useSupervisor();
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState('7d'); // 24h, 7d, 30d, 90d
  const [selectedMetric, setSelectedMetric] = useState('overview'); // overview, delivery, engagement, routes
  const [refreshing, setRefreshing] = useState(false);

  // Load analytics when component opens or time range changes
  useEffect(() => {
    if (visible) {
      loadAnalytics();
    }
  }, [visible, timeRange]);

  // Auto-refresh every 30 seconds when visible
  useEffect(() => {
    if (visible) {
      const interval = setInterval(() => {
        refreshAnalytics();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [visible]);

  // Load analytics data
  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/messages/analytics?timeRange=${timeRange}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Supervisor-ID': supervisor?.badgeNumber || 'unknown'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.analytics);
      } else {
        // No data available
        setAnalytics(null);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  // Refresh analytics without loading state
  const refreshAnalytics = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const response = await fetch(`/api/messages/analytics?timeRange=${timeRange}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Supervisor-ID': supervisor?.badgeNumber || 'unknown'
        }
      });
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };


  // Generate time series data for charts
  const generateTimeSeriesData = (days) => {
    const data = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
        sent: Math.floor(Math.random() * 50) + 20,
        opened: Math.floor(Math.random() * 40) + 15,
        delivered: Math.floor(Math.random() * 45) + 18
      });
    }
    
    return data;
  };

  // Render metric cards
  const renderMetricCard = (title, value, subtitle, icon, color = '#2563EB') => (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricTitle}>{title}</Text>
        <View style={[styles.metricIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
      </View>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </View>
  );

  // Render overview section
  const renderOverview = () => {
    if (!analytics?.overview) return null;
    const { overview } = analytics;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Overview</Text>
        <View style={styles.metricsGrid}>
          {renderMetricCard(
            'Total Messages',
            overview.totalMessages.toLocaleString(),
            `${timeRange} period`,
            'paper-plane',
            '#2563EB'
          )}
          {renderMetricCard(
            'Total Recipients',
            overview.totalRecipients.toLocaleString(),
            'Unique contacts',
            'people',
            '#10B981'
          )}
          {renderMetricCard(
            'Average Open Rate',
            `${Math.round(overview.averageOpenRate * 100)}%`,
            'Engagement rate',
            'eye',
            '#F59E0B'
          )}
          {renderMetricCard(
            'Response Time',
            `${overview.averageResponseTime} min`,
            'Average time to first action',
            'time',
            '#8B5CF6'
          )}
        </View>
      </View>
    );
  };

  // Render delivery metrics
  const renderDeliveryMetrics = () => {
    if (!analytics?.delivery) return null;
    const { delivery } = analytics;
    
    const pieData = [
      {
        name: 'Delivered',
        count: delivery.delivered,
        color: '#10B981',
        legendFontColor: '#1F2937',
        legendFontSize: 12
      },
      {
        name: 'Pending',
        count: delivery.pending,
        color: '#F59E0B',
        legendFontColor: '#1F2937',
        legendFontSize: 12
      },
      {
        name: 'Failed',
        count: delivery.failed,
        color: '#DC2626',
        legendFontColor: '#1F2937',
        legendFontSize: 12
      },
      {
        name: 'Scheduled',
        count: delivery.scheduled,
        color: '#3B82F6',
        legendFontColor: '#1F2937',
        legendFontSize: 12
      }
    ];
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Status</Text>
        
        <View style={styles.chartContainer}>
          <PieChart
            data={pieData}
            width={chartWidth}
            height={220}
            chartConfig={{
              color: (opacity = 1) => `rgba(31, 41, 55, ${opacity})`,
            }}
            accessor="count"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>
        
        <View style={styles.deliveryStats}>
          <View style={styles.deliveryStat}>
            <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.deliveryStatLabel}>Delivered</Text>
            <Text style={styles.deliveryStatValue}>{delivery.delivered}</Text>
          </View>
          <View style={styles.deliveryStat}>
            <View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.deliveryStatLabel}>Pending</Text>
            <Text style={styles.deliveryStatValue}>{delivery.pending}</Text>
          </View>
          <View style={styles.deliveryStat}>
            <View style={[styles.statusDot, { backgroundColor: '#DC2626' }]} />
            <Text style={styles.deliveryStatLabel}>Failed</Text>
            <Text style={styles.deliveryStatValue}>{delivery.failed}</Text>
          </View>
          <View style={styles.deliveryStat}>
            <View style={[styles.statusDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={styles.deliveryStatLabel}>Scheduled</Text>
            <Text style={styles.deliveryStatValue}>{delivery.scheduled}</Text>
          </View>
        </View>
      </View>
    );
  };

  // Render time series chart
  const renderTimeSeriesChart = () => {
    if (!analytics?.timeSeriesData) return null;
    
    const data = {
      labels: analytics.timeSeriesData.map(d => d.date),
      datasets: [
        {
          data: analytics.timeSeriesData.map(d => d.sent),
          color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`, // blue
          strokeWidth: 2
        },
        {
          data: analytics.timeSeriesData.map(d => d.opened),
          color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, // green
          strokeWidth: 2
        }
      ],
      legend: ['Sent', 'Opened']
    };
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Message Activity Trend</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <LineChart
            data={data}
            width={chartWidth}
            height={220}
            chartConfig={{
              backgroundColor: '#FFFFFF',
              backgroundGradientFrom: '#FFFFFF',
              backgroundGradientTo: '#FFFFFF',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#2563EB'
              }
            }}
            bezier
            style={styles.chart}
          />
        </ScrollView>
      </View>
    );
  };

  // Render route performance
  const renderRoutePerformance = () => {
    if (!analytics?.routePerformance) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Route Performance</Text>
        <View style={styles.routeTable}>
          <View style={styles.routeTableHeader}>
            <Text style={[styles.routeTableCell, styles.routeTableHeaderText]}>Route</Text>
            <Text style={[styles.routeTableCell, styles.routeTableHeaderText]}>Messages</Text>
            <Text style={[styles.routeTableCell, styles.routeTableHeaderText]}>Open Rate</Text>
            <Text style={[styles.routeTableCell, styles.routeTableHeaderText]}>Avg Delay</Text>
          </View>
          {analytics.routePerformance.map((route, index) => (
            <View key={route.route} style={[
              styles.routeTableRow,
              index % 2 === 0 && styles.routeTableRowEven
            ]}>
              <Text style={[styles.routeTableCell, styles.routeNumber]}>{route.route}</Text>
              <Text style={styles.routeTableCell}>{route.messages}</Text>
              <Text style={[styles.routeTableCell, { color: route.openRate > 0.8 ? '#10B981' : '#F59E0B' }]}>
                {Math.round(route.openRate * 100)}%
              </Text>
              <Text style={styles.routeTableCell}>{route.avgDelay} min</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Render category breakdown
  const renderCategoryBreakdown = () => {
    if (!analytics?.categoryBreakdown) return null;
    
    const data = {
      labels: Object.keys(analytics.categoryBreakdown).map(cat => 
        cat.charAt(0).toUpperCase() + cat.slice(1)
      ),
      datasets: [{
        data: Object.values(analytics.categoryBreakdown)
      }]
    };
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Messages by Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <BarChart
            data={data}
            width={chartWidth}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: '#FFFFFF',
              backgroundGradientFrom: '#FFFFFF',
              backgroundGradientTo: '#FFFFFF',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
              barPercentage: 0.7,
            }}
            style={styles.chart}
          />
        </ScrollView>
      </View>
    );
  };

  // Render time range selector
  const renderTimeRangeSelector = () => (
    <View style={styles.timeRangeContainer}>
      {[
        { key: '24h', label: '24 Hours' },
        { key: '7d', label: '7 Days' },
        { key: '30d', label: '30 Days' },
        { key: '90d', label: '90 Days' }
      ].map(range => (
        <TouchableOpacity
          key={range.key}
          style={[
            styles.timeRangeButton,
            timeRange === range.key && styles.timeRangeButtonActive
          ]}
          onPress={() => setTimeRange(range.key)}
        >
          <Text style={[
            styles.timeRangeText,
            timeRange === range.key && styles.timeRangeTextActive
          ]}>
            {range.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Render metric tabs
  const renderMetricTabs = () => (
    <View style={styles.metricTabs}>
      {[
        { key: 'overview', label: 'Overview', icon: 'stats-chart' },
        { key: 'delivery', label: 'Delivery', icon: 'paper-plane' },
        { key: 'engagement', label: 'Engagement', icon: 'trending-up' },
        { key: 'routes', label: 'Routes', icon: 'bus' }
      ].map(tab => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.metricTab,
            selectedMetric === tab.key && styles.metricTabActive
          ]}
          onPress={() => setSelectedMetric(tab.key)}
        >
          <Ionicons 
            name={tab.icon} 
            size={20} 
            color={selectedMetric === tab.key ? '#2563EB' : '#6B7280'} 
          />
          <Text style={[
            styles.metricTabText,
            selectedMetric === tab.key && styles.metricTabTextActive
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#6B7280" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Message Analytics</Text>
            <Text style={styles.headerSubtitle}>
              Real-time performance metrics and insights
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={refreshAnalytics}
            disabled={refreshing}
          >
            <Ionicons 
              name="refresh" 
              size={24} 
              color={refreshing ? '#9CA3AF' : '#2563EB'} 
            />
          </TouchableOpacity>
        </View>

        {renderTimeRangeSelector()}
        {renderMetricTabs()}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Loading analytics...</Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {selectedMetric === 'overview' && (
              <>
                {renderOverview()}
                {renderTimeSeriesChart()}
                {renderCategoryBreakdown()}
              </>
            )}
            
            {selectedMetric === 'delivery' && (
              <>
                {renderDeliveryMetrics()}
                {renderTimeSeriesChart()}
              </>
            )}
            
            {selectedMetric === 'engagement' && (
              <>
                {renderOverview()}
                {renderTimeSeriesChart()}
              </>
            )}
            
            {selectedMetric === 'routes' && (
              <>
                {renderRoutePerformance()}
                {renderCategoryBreakdown()}
              </>
            )}

            {/* Last update timestamp */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Last updated: {new Date().toLocaleString('en-GB')}
              </Text>
              {refreshing && (
                <Text style={styles.footerText}>Refreshing...</Text>
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'web' ? 20 : 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  timeRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  timeRangeButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  timeRangeTextActive: {
    color: '#FFFFFF',
  },
  metricTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  metricTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  metricTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563EB',
  },
  metricTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  metricTabTextActive: {
    color: '#2563EB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: Platform.OS === 'web' ? 200 : '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderLeftWidth: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  deliveryStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 16,
  },
  deliveryStat: {
    flex: 1,
    minWidth: 120,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  deliveryStatLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  deliveryStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 'auto',
  },
  routeTable: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  routeTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  routeTableHeaderText: {
    fontWeight: '600',
    color: '#374151',
  },
  routeTableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  routeTableRowEven: {
    backgroundColor: '#F9FAFB',
  },
  routeTableCell: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
  },
  routeNumber: {
    fontWeight: '600',
    color: '#2563EB',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default MessageAnalytics;