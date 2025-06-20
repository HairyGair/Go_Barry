// Go_BARRY/components/ActivityLogViewer.jsx
// Activity Log Viewer for Go BARRY - View supervisor and system activity

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform 
} from 'react-native';

const ActivityLogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState({
    screenType: 'all',
    action: 'all',
    supervisorId: '',
    timeRange: 'today'
  });
  const [summary, setSummary] = useState(null);
  const [viewMode, setViewMode] = useState('logs'); // 'logs' or 'summary'

  // Fetch activity logs
  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.screenType !== 'all') params.append('screenType', filter.screenType);
      if (filter.action !== 'all') params.append('action', filter.action);
      if (filter.supervisorId) params.append('supervisorId', filter.supervisorId);
      
      // Set date range based on timeRange filter
      const now = new Date();
      let startDate;
      switch (filter.timeRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = null;
      }
      if (startDate) params.append('startDate', startDate.toISOString());
      
      const response = await fetch(`https://go-barry.onrender.com/api/activity/logs?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch summary statistics
  const fetchSummary = async () => {
    try {
      const response = await fetch(`https://go-barry.onrender.com/api/activity-logs/summary?timeRange=${filter.timeRange}`);
      const data = await response.json();
      
      if (data.success) {
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchSummary();
  }, [filter]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs();
    fetchSummary();
  };

  // Format action name for display
  const formatAction = (action) => {
    const actionMap = {
      'supervisor_login': 'Login',
      'supervisor_logout': 'Logout',
      'alert_dismissed': 'Alert Dismissed',
      'session_timeout': 'Session Timeout',
      'roadwork_created': 'Roadwork Created',
      'email_sent': 'Email Sent',
      'display_screen_view': 'Display View',
      'manual_incident_created': 'Incident Created',
      'manual_incident_updated': 'Incident Updated',
      'manual_incident_deleted': 'Incident Deleted'
    };
    return actionMap[action] || action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get color for action type
  const getActionColor = (action) => {
    if (action.includes('login') || action.includes('logout')) return '#3b82f6';
    if (action.includes('dismissed')) return '#f59e0b';
    if (action.includes('roadwork')) return '#ef4444';
    if (action.includes('email')) return '#8b5cf6';
    if (action.includes('display')) return '#10b981';
    if (action.includes('incident')) return '#f97316';
    return '#64748b';
  };

  const renderLogItem = (log) => (
    <View style={styles.logItem} key={log.id}>
      <View style={[styles.actionIndicator, { backgroundColor: getActionColor(log.action) }]} />
      <View style={styles.logContent}>
        <View style={styles.logHeader}>
          <Text style={styles.logAction}>{formatAction(log.action)}</Text>
          <Text style={styles.logTime}>{formatTime(log.created_at)}</Text>
        </View>
        {log.supervisor_name && (
          <Text style={styles.logSupervisor}>{log.supervisor_name}</Text>
        )}
        {log.details && (
          <View style={styles.logDetails}>
            {log.details.reason && (
              <Text style={styles.detailText}>Reason: {log.details.reason}</Text>
            )}
            {log.details.location && (
              <Text style={styles.detailText}>Location: {log.details.location}</Text>
            )}
            {log.details.alertCount !== undefined && (
              <Text style={styles.detailText}>Alerts: {log.details.alertCount}</Text>
            )}
            {log.details.sessionDuration && (
              <Text style={styles.detailText}>Duration: {log.details.sessionDuration}</Text>
            )}
          </View>
        )}
      </View>
    </View>
  );

  const renderSummary = () => (
    <ScrollView style={styles.summaryContainer}>
      <View style={styles.summarySection}>
        <Text style={styles.summaryTitle}>Activity Summary</Text>
        <Text style={styles.summarySubtitle}>{filter.timeRange.charAt(0).toUpperCase() + filter.timeRange.slice(1)}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{summary?.totalActivities || 0}</Text>
          <Text style={styles.statLabel}>Total Activities</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{Object.keys(summary?.bySupervisor || {}).length}</Text>
          <Text style={styles.statLabel}>Active Supervisors</Text>
        </View>
      </View>

      {summary?.byAction && Object.keys(summary.byAction).length > 0 && (
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Activities by Type</Text>
          {Object.entries(summary.byAction)
            .sort((a, b) => b[1] - a[1])
            .map(([action, count]) => (
              <View key={action} style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{formatAction(action)}</Text>
                <Text style={styles.summaryValue}>{count}</Text>
              </View>
            ))}
        </View>
      )}

      {summary?.bySupervisor && Object.keys(summary.bySupervisor).length > 0 && (
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Activities by Supervisor</Text>
          {Object.entries(summary.bySupervisor)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([supervisor, count]) => (
              <View key={supervisor} style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{supervisor}</Text>
                <Text style={styles.summaryValue}>{count}</Text>
              </View>
            ))}
        </View>
      )}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Activity Logs</Text>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'logs' && styles.toggleActive]}
            onPress={() => setViewMode('logs')}
          >
            <Text style={[styles.toggleText, viewMode === 'logs' && styles.toggleTextActive]}>
              Logs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'summary' && styles.toggleActive]}
            onPress={() => setViewMode('summary')}
          >
            <Text style={[styles.toggleText, viewMode === 'summary' && styles.toggleTextActive]}>
              Summary
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        <TouchableOpacity
          style={[styles.filterChip, filter.timeRange === 'today' && styles.filterActive]}
          onPress={() => setFilter({...filter, timeRange: 'today'})}
        >
          <Text style={[styles.filterText, filter.timeRange === 'today' && styles.filterTextActive]}>
            Today
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter.timeRange === 'week' && styles.filterActive]}
          onPress={() => setFilter({...filter, timeRange: 'week'})}
        >
          <Text style={[styles.filterText, filter.timeRange === 'week' && styles.filterTextActive]}>
            Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter.timeRange === 'month' && styles.filterActive]}
          onPress={() => setFilter({...filter, timeRange: 'month'})}
        >
          <Text style={[styles.filterText, filter.timeRange === 'month' && styles.filterTextActive]}>
            Month
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter.screenType === 'supervisor' && styles.filterActive]}
          onPress={() => setFilter({...filter, screenType: filter.screenType === 'supervisor' ? 'all' : 'supervisor'})}
        >
          <Text style={[styles.filterText, filter.screenType === 'supervisor' && styles.filterTextActive]}>
            Supervisor Only
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter.screenType === 'display' && styles.filterActive]}
          onPress={() => setFilter({...filter, screenType: filter.screenType === 'display' ? 'all' : 'display'})}
        >
          <Text style={[styles.filterText, filter.screenType === 'display' && styles.filterTextActive]}>
            Display Only
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading activity logs...</Text>
        </View>
      ) : viewMode === 'logs' ? (
        <ScrollView
          style={styles.logsContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {logs.length > 0 ? (
            logs.map(renderLogItem)
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No activity logs found</Text>
              <Text style={styles.emptySubtext}>Activity will appear here as supervisors use the system</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        renderSummary()
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleActive: {
    backgroundColor: '#3b82f6',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  toggleTextActive: {
    color: '#ffffff',
  },
  filterContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  logsContainer: {
    flex: 1,
    padding: 16,
  },
  logItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  actionIndicator: {
    width: 4,
    marginRight: 12,
    borderRadius: 2,
  },
  logContent: {
    flex: 1,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logAction: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  logTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  logSupervisor: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  logDetails: {
    marginTop: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  summaryContainer: {
    flex: 1,
    padding: 16,
  },
  summarySection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginRight: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#4b5563',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
});

export default ActivityLogViewer;