// Go_BARRY/components/DisruptionStatsDashboard.jsx
// Statistics dashboard for disruption logging performance analytics

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

const { width } = Dimensions.get('window');

const DisruptionStatsDashboard = ({ supervisorInfo, visible, onClose }) => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState('7'); // days

  useEffect(() => {
    if (visible) {
      fetchStatistics();
    }
  }, [visible, timeframe]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeframe));
      
      const params = new URLSearchParams({
        date_from: startDate.toISOString(),
        date_to: endDate.toISOString()
      });

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/disruptions/statistics?${params}`);
      const result = await response.json();

      if (result.success) {
        setStatistics(result.statistics);
      } else {
        Alert.alert('Error', `Failed to fetch statistics: ${result.error}`);
      }
    } catch (error) {
      console.error('Fetch statistics error:', error);
      Alert.alert('Error', 'Network error. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStatistics();
  };

  const getTimeframeLabel = () => {
    switch (timeframe) {
      case '1': return 'Today';
      case '7': return 'Last 7 Days';
      case '30': return 'Last 30 Days';
      case '90': return 'Last 90 Days';
      default: return `Last ${timeframe} Days`;
    }
  };

  const renderStatCard = (title, value, subtitle, icon, color = '#007AFF') => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Text style={styles.statIcon}>{icon}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const renderChartBar = (label, value, maxValue, color) => {
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
    
    return (
      <View key={label} style={styles.chartBarContainer}>
        <Text style={styles.chartBarLabel}>{label}</Text>
        <View style={styles.chartBarTrack}>
          <View 
            style={[
              styles.chartBarFill, 
              { width: `${percentage}%`, backgroundColor: color }
            ]} 
          />
        </View>
        <Text style={styles.chartBarValue}>{value}</Text>
      </View>
    );
  };

  const renderTypeBreakdown = () => {
    if (!statistics?.by_type) return null;

    const types = Object.entries(statistics.by_type);
    const maxValue = Math.max(...types.map(([_, count]) => count));
    
    const typeColors = {
      incident: '#FF3B30',
      roadwork: '#FF9500',
      diversion: '#007AFF',
      weather: '#5AC8FA',
      breakdown: '#FFCC00',
      accident: '#FF2D92',
      emergency: '#FF3B30',
      planned_works: '#34C759',
      other: '#8E8E93'
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>📊 Disruptions by Type</Text>
        {types.map(([type, count]) => 
          renderChartBar(
            type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            count,
            maxValue,
            typeColors[type] || '#8E8E93'
          )
        )}
      </View>
    );
  };

  const renderSeverityBreakdown = () => {
    if (!statistics?.by_severity) return null;

    const severities = Object.entries(statistics.by_severity);
    const maxValue = Math.max(...severities.map(([_, count]) => count));
    
    const severityColors = {
      critical: '#FF3B30',
      high: '#FF9500',
      medium: '#FFCC00',
      low: '#34C759'
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>🎯 Disruptions by Severity</Text>
        {severities.map(([severity, count]) => 
          renderChartBar(
            severity.charAt(0).toUpperCase() + severity.slice(1),
            count,
            maxValue,
            severityColors[severity] || '#8E8E93'
          )
        )}
      </View>
    );
  };

  const renderPerformanceMetrics = () => {
    if (!statistics) return null;

    return (
      <View style={styles.metricsGrid}>
        <Text style={styles.sectionTitle}>⚡ Performance Metrics</Text>
        
        <View style={styles.metricsRow}>
          {renderStatCard(
            'Avg Resolution Time',
            statistics.average_resolution_time ? `${statistics.average_resolution_time}min` : 'N/A',
            'Time to resolve',
            '⏱️',
            '#34C759'
          )}
          
          {renderStatCard(
            'Avg Response Time',
            statistics.average_response_time ? `${statistics.average_response_time}min` : 'N/A',
            'Time to respond',
            '🚀',
            '#007AFF'
          )}
        </View>

        <View style={styles.metricsRow}>
          {renderStatCard(
            'Preventable',
            `${statistics.preventable_percentage || 0}%`,
            'Could be prevented',
            '🔄',
            '#FF9500'
          )}
          
          {renderStatCard(
            'Recurring Issues',
            `${statistics.recurring_percentage || 0}%`,
            'Repeat problems',
            '🔁',
            '#FF3B30'
          )}
        </View>
      </View>
    );
  };

  const renderSummaryStats = () => {
    if (!statistics) return null;

    return (
      <View style={styles.summaryContainer}>
        <Text style={styles.sectionTitle}>📋 Summary ({getTimeframeLabel()})</Text>
        
        <View style={styles.summaryRow}>
          {renderStatCard(
            'Total Disruptions',
            statistics.total_disruptions || 0,
            'Successfully resolved',
            '📝',
            '#007AFF'
          )}
        </View>

        {statistics.by_depot && Object.keys(statistics.by_depot).length > 0 && (
          <View style={styles.depotContainer}>
            <Text style={styles.chartTitle}>🏢 By Depot</Text>
            <View style={styles.depotGrid}>
              {Object.entries(statistics.by_depot).map(([depot, count]) => (
                <View key={depot} style={styles.depotCard}>
                  <Text style={styles.depotName}>{depot || 'Unknown'}</Text>
                  <Text style={styles.depotCount}>{count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderInsights = () => {
    if (!statistics) return null;

    const insights = [];
    
    // Generate insights based on data
    if (statistics.total_disruptions > 0) {
      if (statistics.preventable_percentage > 30) {
        insights.push({
          icon: '⚠️',
          text: `${statistics.preventable_percentage}% of disruptions were preventable. Consider reviewing procedures.`,
          type: 'warning'
        });
      }
      
      if (statistics.recurring_percentage > 20) {
        insights.push({
          icon: '🔁',
          text: `${statistics.recurring_percentage}% are recurring issues. Focus on permanent solutions.`,
          type: 'attention'
        });
      }
      
      if (statistics.average_resolution_time && statistics.average_resolution_time < 30) {
        insights.push({
          icon: '🎉',
          text: `Excellent response time! Average resolution in ${statistics.average_resolution_time} minutes.`,
          type: 'success'
        });
      }
      
      // Top disruption type
      if (statistics.by_type) {
        const topType = Object.entries(statistics.by_type)
          .sort(([,a], [,b]) => b - a)[0];
        if (topType) {
          insights.push({
            icon: '📊',
            text: `${topType[0]} is the most common disruption type (${topType[1]} incidents).`,
            type: 'info'
          });
        }
      }
    } else {
      insights.push({
        icon: '🤔',
        text: 'No disruptions logged in this time period. Great work maintaining smooth operations!',
        type: 'success'
      });
    }

    if (insights.length === 0) return null;

    return (
      <View style={styles.insightsContainer}>
        <Text style={styles.sectionTitle}>💡 Insights</Text>
        {insights.map((insight, index) => (
          <View key={index} style={[styles.insightCard, styles[`insight${insight.type}`]]}>
            <Text style={styles.insightIcon}>{insight.icon}</Text>
            <Text style={styles.insightText}>{insight.text}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>📈 Disruption Analytics</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.controlsContainer}>
          <View style={styles.timeframeContainer}>
            <Text style={styles.timeframeLabel}>Time Period:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={timeframe}
                onValueChange={setTimeframe}
                style={styles.timeframePicker}
              >
                <Picker.Item label="Today" value="1" />
                <Picker.Item label="Last 7 Days" value="7" />
                <Picker.Item label="Last 30 Days" value="30" />
                <Picker.Item label="Last 90 Days" value="90" />
              </Picker>
            </View>
          </View>
          
          <TouchableOpacity onPress={fetchStatistics} style={styles.refreshButton}>
            <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading analytics...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {renderSummaryStats()}
            {renderPerformanceMetrics()}
            {renderTypeBreakdown()}
            {renderSeverityBreakdown()}
            {renderInsights()}
            
            <View style={styles.bottomPadding} />
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  timeframeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeframeLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    minWidth: 120,
  },
  timeframePicker: {
    height: 40,
  },
  refreshButton: {
    padding: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  summaryContainer: {
    marginBottom: 24,
  },
  summaryRow: {
    marginBottom: 16,
  },
  metricsGrid: {
    marginBottom: 24,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flex: 0.48,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  chartBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartBarLabel: {
    fontSize: 14,
    color: '#333',
    width: 80,
    textTransform: 'capitalize',
  },
  chartBarTrack: {
    flex: 1,
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  chartBarFill: {
    height: '100%',
    borderRadius: 10,
    minWidth: 2,
  },
  chartBarValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    width: 30,
    textAlign: 'right',
  },
  depotContainer: {
    marginTop: 16,
  },
  depotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  depotCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    minWidth: '45%',
    alignItems: 'center',
  },
  depotName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  depotCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  insightsContainer: {
    marginBottom: 24,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightwarning: {
    borderLeftColor: '#FF9500',
  },
  insightattention: {
    borderLeftColor: '#FF3B30',
  },
  insightsuccess: {
    borderLeftColor: '#34C759',
  },
  insightinfo: {
    borderLeftColor: '#007AFF',
  },
  insightIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  insightText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 40,
  },
});

export default DisruptionStatsDashboard;
