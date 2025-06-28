import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Card } from '../ui/card';

const screenWidth = Dimensions.get('window').width;

export default function Analytics({ supervisor }) {
  const [timeRange, setTimeRange] = useState('today');
  const [isLoading, setIsLoading] = useState(true);
  
  // Get metrics from Convex
  const metrics = useQuery(api.supervisorActions.getActionMetrics, {
    supervisorId: supervisor.badgeNumber,
    startTime: getStartTime(timeRange),
    endTime: Date.now(),
  });
  
  // Get comparison data
  const recentActions = useQuery(api.supervisorActions.getRecentActions, {
    supervisorId: supervisor.badgeNumber,
    limit: 50,
  });
  
  useEffect(() => {
    if (metrics && recentActions) {
      setIsLoading(false);
    }
  }, [metrics, recentActions]);
  
  function getStartTime(range) {
    const now = Date.now();
    switch (range) {
      case 'today':
        return new Date().setHours(0, 0, 0, 0);
      case 'week':
        return now - (7 * 24 * 60 * 60 * 1000);
      case 'month':
        return now - (30 * 24 * 60 * 60 * 1000);
      default:
        return new Date().setHours(0, 0, 0, 0);
    }
  }
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00a5ff" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Performance Analytics</Text>
      
      {/* Time Range Selector */}
      <View style={styles.timeRangeSelector}>
        {['today', 'week', 'month'].map(range => (
          <TouchableOpacity
            key={range}
            style={[
              styles.timeRangeButton,
              timeRange === range && styles.timeRangeButtonActive
            ]}
            onPress={() => setTimeRange(range)}
          >
            <Text style={[
              styles.timeRangeText,
              timeRange === range && styles.timeRangeTextActive
            ]}>
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Key Metrics */}
      <View style={styles.metricsRow}>
        <Card style={styles.metricCard}>
          <Text style={styles.metricValue}>{metrics?.totalActions || 0}</Text>
          <Text style={styles.metricLabel}>Total Actions</Text>
        </Card>
        
        <Card style={styles.metricCard}>
          <Text style={styles.metricValue}>
            {metrics?.averageResponseTime 
              ? `${(metrics.averageResponseTime / 1000).toFixed(1)}s`
              : '0s'
            }
          </Text>
          <Text style={styles.metricLabel}>Avg Response</Text>
        </Card>
        
        <Card style={styles.metricCard}>
          <Text style={styles.metricValue}>{metrics?.peakHour || 'N/A'}</Text>
          <Text style={styles.metricLabel}>Peak Hour</Text>
        </Card>
      </View>
      
      {/* Actions by Type */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Actions by Type</Text>
        <View style={styles.actionTypesList}>
          {metrics?.actionsByType && Object.entries(metrics.actionsByType)
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => (
              <View key={type} style={styles.actionTypeRow}>
                <Text style={styles.actionTypeName}>
                  {type.replace(/_/g, ' ').charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ')}
                </Text>
                <View style={styles.actionTypeBarContainer}>
                  <View 
                    style={[
                      styles.actionTypeBar,
                      { 
                        width: `${(count / metrics.totalActions) * 100}%`,
                        backgroundColor: getActionColor(type)
                      }
                    ]}
                  />
                  <Text style={styles.actionTypeCount}>{count}</Text>
                </View>
              </View>
            ))
          }
        </View>
      </Card>
      
      {/* Recent Actions Timeline */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Actions</Text>
        <ScrollView style={styles.timeline}>
          {recentActions?.slice(0, 20).map((action, index) => (
            <View key={action._id || index} style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: getActionColor(action.actionType) }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineAction}>
                  {action.actionType.replace(/_/g, ' ')}
                </Text>
                <Text style={styles.timelineTime}>
                  {new Date(action.timestamp).toLocaleTimeString()} - {action.responseTimeMs}ms
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </Card>
      
      {/* Performance Tips */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Insights</Text>
        {generateInsights(metrics)}
      </Card>
    </ScrollView>
  );
}

function getActionColor(actionType) {
  const colors = {
    dismiss: '#4CAF50',
    acknowledge: '#2196F3',
    push_message: '#FF9800',
    quick_emergency: '#F44336',
    quick_route_suspend: '#E91E63',
    quick_status_update: '#9C27B0',
    quick_request_backup: '#00BCD4',
    tab_change: '#607D8B',
    hub_access: '#795548',
  };
  return colors[actionType] || '#9E9E9E';
}

function generateInsights(metrics) {
  const insights = [];
  
  if (metrics) {
    if (metrics.averageResponseTime < 5000) {
      insights.push({
        type: 'positive',
        text: 'Excellent response time! Keep up the quick actions.'
      });
    } else if (metrics.averageResponseTime > 15000) {
      insights.push({
        type: 'negative',
        text: 'Response times could be improved. Try using quick actions more.'
      });
    }
    
    if (metrics.totalActions > 50) {
      insights.push({
        type: 'positive',
        text: 'High activity level shows good engagement.'
      });
    }
    
    if (metrics.peakHour) {
      insights.push({
        type: 'info',
        text: `Most active during ${metrics.peakHour}. Plan accordingly.`
      });
    }
  }
  
  return (
    <View style={styles.insights}>
      {insights.map((insight, index) => (
        <View key={index} style={[styles.insight, styles[`insight${insight.type}`]]}>
          <Text style={styles.insightText}>{insight.text}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  timeRangeSelector: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: '#00a5ff',
  },
  timeRangeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  timeRangeTextActive: {
    color: '#fff',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00a5ff',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  section: {
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  actionTypesList: {
    gap: 10,
  },
  actionTypeRow: {
    marginBottom: 10,
  },
  actionTypeName: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  actionTypeBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionTypeBar: {
    height: '100%',
    minWidth: 30,
  },
  actionTypeCount: {
    position: 'absolute',
    right: 8,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  timeline: {
    maxHeight: 300,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 3,
    marginRight: 10,
  },
  timelineContent: {
    flex: 1,
  },
  timelineAction: {
    fontSize: 14,
    color: '#333',
    textTransform: 'capitalize',
  },
  timelineTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  insights: {
    gap: 10,
  },
  insight: {
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  insightpositive: {
    backgroundColor: '#e8f5e9',
    borderLeftColor: '#4caf50',
  },
  insightnegative: {
    backgroundColor: '#ffebee',
    borderLeftColor: '#f44336',
  },
  insightinfo: {
    backgroundColor: '#e3f2fd',
    borderLeftColor: '#2196f3',
  },
  insightText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});