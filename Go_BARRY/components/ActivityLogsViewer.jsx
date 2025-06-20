// Go_BARRY/components/ActivityLogsViewer.jsx
// Activity Logs Viewer Component for Go BARRY

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform
} from 'react-native';
import { API_BASE_URL } from '../config';

const ActivityLogsViewer = ({ supervisorId = null, compact = false }) => {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('today');
  const [filter, setFilter] = useState('all');

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (supervisorId) params.append('supervisorId', supervisorId);
      if (filter !== 'all') params.append('action', filter);
      params.append('limit', compact ? '10' : '50');

      const response = await fetch(`${API_BASE_URL}/api/activity-logs?${params}`);
      const data = await response.json();

      if (data.success) {
        setLogs(data.logs);
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/activity-logs/summary?timeRange=${timeRange}`);
      const data = await response.json();

      if (data.success) {
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [supervisorId, filter, timeRange]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchLogs(), fetchSummary()]);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'supervisor_login': return '🔐';
      case 'supervisor_logout': return '🚪';
      case 'alert_dismissed': return '🚫';
      case 'session_timeout': return '⏰';
      case 'display_screen_view': return '📺';
      default: return '📝';
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'supervisor_login': return '#4CAF50';
      case 'supervisor_logout': return '#FF9800';
      case 'alert_dismissed': return '#F44336';
      case 'session_timeout': return '#9E9E9E';
      case 'display_screen_view': return '#2196F3';
      default: return '#757575';
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
      </View>
    );
  }

  const renderCompactView = () => (
    <View style={styles.compactContainer}>
      <Text style={styles.compactTitle}>Recent Activity</Text>
      {logs.slice(0, 5).map((log, index) => (
        <View key={log.id || index} style={styles.compactLogItem}>
          <Text style={styles.compactIcon}>{getActionIcon(log.action)}</Text>
          <View style={styles.compactContent}>
            <Text style={styles.compactText} numberOfLines={1}>
              {log.supervisor_name || 'System'}: {log.action.replace(/_/g, ' ')}
            </Text>
            <Text style={styles.compactTime}>{formatTime(log.created_at)}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderFullView = () => (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Summary Stats */}
      {summary && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Activity Summary ({timeRange})</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{summary.totalActivities}</Text>
              <Text style={styles.statLabel}>Total Actions</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Object.keys(summary.bySupervisor).length}</Text>
              <Text style={styles.statLabel}>Active Supervisors</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{summary.byAction.alert_dismissed || 0}</Text>
              <Text style={styles.statLabel}>Alerts Dismissed</Text>
            </View>
          </View>
        </View>
      )}

      {/* Time Range Filters */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['today', 'week', 'month', 'all'].map((range) => (
            <TouchableOpacity
              key={range}
              style={[styles.filterButton, timeRange === range && styles.filterButtonActive]}
              onPress={() => setTimeRange(range)}
            >
              <Text style={[styles.filterText, timeRange === range && styles.filterTextActive]}>
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Action Filters */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'supervisor_login', 'alert_dismissed', 'display_screen_view'].map((action) => (
            <TouchableOpacity
              key={action}
              style={[styles.filterButton, filter === action && styles.filterButtonActive]}
              onPress={() => setFilter(action)}
            >
              <Text style={[styles.filterText, filter === action && styles.filterTextActive]}>
                {action === 'all' ? 'All Actions' : action.replace(/_/g, ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Activity Logs */}
      <View style={styles.logsContainer}>
        {logs.length === 0 ? (
          <Text style={styles.noLogsText}>No activity logs found</Text>
        ) : (
          logs.map((log, index) => (
            <View key={log.id || index} style={styles.logItem}>
              <View style={[styles.logIcon, { backgroundColor: getActionColor(log.action) }]}>
                <Text style={styles.logIconText}>{getActionIcon(log.action)}</Text>
              </View>
              <View style={styles.logContent}>
                <Text style={styles.logAction}>{log.action.replace(/_/g, ' ')}</Text>
                <Text style={styles.logSupervisor}>
                  {log.supervisor_name || 'System'}
                </Text>
                {log.details && log.details.alertId && (
                  <Text style={styles.logDetail}>Alert: {log.details.alertId}</Text>
                )}
                {log.details && log.details.reason && (
                  <Text style={styles.logDetail}>Reason: {log.details.reason}</Text>
                )}
                <Text style={styles.logTime}>{formatTime(log.created_at)}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );

  return compact ? renderCompactView() : renderFullView();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContainer: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  filterContainer: {
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
  },
  filterButtonActive: {
    backgroundColor: '#1976D2',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  filterTextActive: {
    color: 'white',
    fontWeight: '500',
  },
  logsContainer: {
    backgroundColor: 'white',
    padding: 16,
  },
  logItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  logIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logIconText: {
    fontSize: 20,
  },
  logContent: {
    flex: 1,
  },
  logAction: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    textTransform: 'capitalize',
  },
  logSupervisor: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  logDetail: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  logTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  noLogsText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    padding: 20,
  },
  // Compact view styles
  compactContainer: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
  },
  compactTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  compactLogItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  compactIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  compactContent: {
    flex: 1,
  },
  compactText: {
    fontSize: 14,
    color: '#333',
  },
  compactTime: {
    fontSize: 12,
    color: '#999',
  },
});

export default ActivityLogsViewer;
