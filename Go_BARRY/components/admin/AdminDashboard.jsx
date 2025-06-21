// Go_BARRY/components/admin/AdminDashboard.jsx
// Comprehensive admin dashboard for system management and accountability

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupervisorSession } from '../hooks/useSupervisorSession';
import MonitoringDashboard from '../MonitoringDashboard';
import { API_CONFIG } from '../../config/api';

const isWeb = Platform.OS === 'web';
const API_BASE = API_CONFIG?.baseURL || 'https://go-barry.onrender.com';

const AdminDashboard = ({ onClose }) => {
  const { supervisorSession, isAdmin } = useSupervisorSession();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states
  const [systemStats, setSystemStats] = useState({});
  const [activityLogs, setActivityLogs] = useState([]);
  const [alertStats, setAlertStats] = useState({});
  const [supervisorStats, setSupervistorStats] = useState([]);
  const [apiUsage, setApiUsage] = useState({});
  const [systemHealth, setSystemHealth] = useState({});
  
  // Filter states
  const [dateFilter, setDateFilter] = useState('today');
  const [activityFilter, setActivityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Check admin access
  useEffect(() => {
    if (!isAdmin) {
      Alert.alert('Access Denied', 'Admin privileges required');
      if (onClose) onClose();
    }
  }, [isAdmin, onClose]);

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch multiple endpoints in parallel
      const [
        healthRes,
        activityRes,
        alertsRes,
        supervisorsRes
      ] = await Promise.all([
        fetch(`${API_BASE}/api/health-extended`),
        fetch(`${API_BASE}/api/activity-logs?limit=100`),
        fetch(`${API_BASE}/api/alerts-enhanced`),
        fetch(`${API_BASE}/api/supervisors/stats`)
      ]);

      // Process responses
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setSystemHealth(healthData);
        setApiUsage(healthData.tomtom || {});
      }

      if (activityRes.ok) {
        const activityData = await activityRes.json();
        setActivityLogs(activityData.logs || []);
      }

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        processAlertStats(alertsData.alerts || []);
      }

      if (supervisorsRes.ok) {
        const supervisorsData = await supervisorsRes.json();
        setSupervisorStats(supervisorsData.supervisors || []);
      }

      // Calculate system stats
      calculateSystemStats();
      
    } catch (error) {
      console.error('Error fetching admin data:', error);
      Alert.alert('Error', 'Failed to load admin data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Process alert statistics
  const processAlertStats = (alerts) => {
    const stats = {
      total: alerts.length,
      bySeverity: {},
      bySource: {},
      byStatus: {},
      avgResponseTime: 0,
      dismissalRate: 0
    };

    alerts.forEach(alert => {
      // By severity
      const severity = alert.severity || 'Unknown';
      stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;

      // By source
      const source = alert.source || 'Unknown';
      stats.bySource[source] = (stats.bySource[source] || 0) + 1;

      // By status
      const status = alert.status || 'active';
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
    });

    setAlertStats(stats);
  };

  // Calculate system stats
  const calculateSystemStats = () => {
    const stats = {
      totalAlerts: alertStats.total || 0,
      activeSuppervisors: supervisorStats.filter(s => s.isActive).length || 0,
      todayActivity: activityLogs.filter(log => {
        const logDate = new Date(log.created_at);
        const today = new Date();
        return logDate.toDateString() === today.toDateString();
      }).length,
      systemUptime: calculateUptime(),
      apiCallsToday: apiUsage.requestsToday || 0
    };
    setSystemStats(stats);
  };

  // Calculate system uptime
  const calculateUptime = () => {
    // Mock calculation - in production, get from backend
    const uptimeHours = Math.floor(Math.random() * 720) + 1; // Up to 30 days
    return `${Math.floor(uptimeHours / 24)}d ${uptimeHours % 24}h`;
  };

  // Initial data load
  useEffect(() => {
    fetchAllData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  // Filter activity logs
  const filteredActivityLogs = activityLogs.filter(log => {
    // Date filter
    if (dateFilter !== 'all') {
      const logDate = new Date(log.created_at);
      const now = new Date();
      
      switch (dateFilter) {
        case 'today':
          if (logDate.toDateString() !== now.toDateString()) return false;
          break;
        case 'week':
          const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
          if (logDate < weekAgo) return false;
          break;
        case 'month':
          const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
          if (logDate < monthAgo) return false;
          break;
      }
    }

    // Activity type filter
    if (activityFilter !== 'all' && log.action !== activityFilter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        log.supervisor_name?.toLowerCase().includes(query) ||
        log.details?.toLowerCase().includes(query) ||
        log.action?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Export functions
  const exportActivityLogs = () => {
    const csvContent = [
      ['Timestamp', 'Supervisor', 'Action', 'Details', 'Alert ID'],
      ...filteredActivityLogs.map(log => [
        new Date(log.created_at).toISOString(),
        log.supervisor_name || 'System',
        log.action,
        typeof log.details === 'object' ? JSON.stringify(log.details) : log.details,
        log.alert_id || ''
      ])
    ].map(row => row.join(',')).join('\n');

    if (isWeb) {
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `barry-activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      Alert.alert('Export', 'Export feature is only available on web');
    }
  };

  // Tab components
  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>System Overview</Text>
      
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
          <Ionicons name="alert-circle" size={24} color="#3B82F6" />
          <Text style={styles.statValue}>{systemStats.totalAlerts}</Text>
          <Text style={styles.statLabel}>Active Alerts</Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: '#F0FDF4' }]}>
          <Ionicons name="people" size={24} color="#10B981" />
          <Text style={styles.statValue}>{systemStats.activeSuppervisors}</Text>
          <Text style={styles.statLabel}>Active Supervisors</Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
          <Ionicons name="pulse" size={24} color="#F59E0B" />
          <Text style={styles.statValue}>{systemStats.todayActivity}</Text>
          <Text style={styles.statLabel}>Actions Today</Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: '#F3E8FF' }]}>
          <Ionicons name="time" size={24} color="#8B5CF6" />
          <Text style={styles.statValue}>{systemStats.systemUptime}</Text>
          <Text style={styles.statLabel}>System Uptime</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Alert Distribution</Text>
      <View style={styles.chartContainer}>
        {Object.entries(alertStats.bySeverity || {}).map(([severity, count]) => (
          <View key={severity} style={styles.chartBar}>
            <Text style={styles.chartLabel}>{severity}</Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${(count / alertStats.total) * 100}%`,
                    backgroundColor: severity === 'High' ? '#EF4444' : 
                                   severity === 'Medium' ? '#F59E0B' : '#10B981'
                  }
                ]}
              />
            </View>
            <Text style={styles.chartValue}>{count}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>API Usage</Text>
      <View style={styles.apiUsageCard}>
        <View style={styles.apiUsageRow}>
          <Text style={styles.apiUsageLabel}>TomTom API Calls Today:</Text>
          <Text style={styles.apiUsageValue}>{apiUsage.requestsToday || 0}</Text>
        </View>
        <View style={styles.apiUsageRow}>
          <Text style={styles.apiUsageLabel}>Cache Hit Rate:</Text>
          <Text style={styles.apiUsageValue}>{apiUsage.cacheHitRate || '0%'}</Text>
        </View>
        <View style={styles.apiUsageRow}>
          <Text style={styles.apiUsageLabel}>Average Response Time:</Text>
          <Text style={styles.apiUsageValue}>{apiUsage.avgResponseTime || '0ms'}</Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderActivityTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.filterBar}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search activities..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, dateFilter === 'today' && styles.filterChipActive]}
            onPress={() => setDateFilter('today')}
          >
            <Text style={[styles.filterChipText, dateFilter === 'today' && styles.filterChipTextActive]}>
              Today
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterChip, dateFilter === 'week' && styles.filterChipActive]}
            onPress={() => setDateFilter('week')}
          >
            <Text style={[styles.filterChipText, dateFilter === 'week' && styles.filterChipTextActive]}>
              This Week
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterChip, dateFilter === 'month' && styles.filterChipActive]}
            onPress={() => setDateFilter('month')}
          >
            <Text style={[styles.filterChipText, dateFilter === 'month' && styles.filterChipTextActive]}>
              This Month
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterChip, dateFilter === 'all' && styles.filterChipActive]}
            onPress={() => setDateFilter('all')}
          >
            <Text style={[styles.filterChipText, dateFilter === 'all' && styles.filterChipTextActive]}>
              All Time
            </Text>
          </TouchableOpacity>
        </ScrollView>
        
        <TouchableOpacity style={styles.exportButton} onPress={exportActivityLogs}>
          <Ionicons name="download" size={16} color="#FFFFFF" />
          <Text style={styles.exportButtonText}>Export</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.activityList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            fetchAllData();
          }} />
        }
      >
        {filteredActivityLogs.length > 0 ? (
          filteredActivityLogs.map((log) => (
            <View key={log.id} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons 
                  name={getActivityIcon(log.action)} 
                  size={20} 
                  color={getActivityColor(log.action)} 
                />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>
                  {log.supervisor_name || 'System'} - {formatActivityAction(log.action)}
                </Text>
                <Text style={styles.activityDetails}>
                  {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                </Text>
                <Text style={styles.activityTime}>
                  {new Date(log.created_at).toLocaleString()}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateText}>No activities found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  const renderSupervisorsTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Supervisor Activity Summary</Text>
      
      {supervisorStats.map((supervisor) => (
        <View key={supervisor.id} style={styles.supervisorCard}>
          <View style={styles.supervisorHeader}>
            <View style={styles.supervisorInfo}>
              <Text style={styles.supervisorName}>{supervisor.name}</Text>
              <Text style={styles.supervisorBadge}>{supervisor.badge}</Text>
            </View>
            <View style={[
              styles.supervisorStatus,
              { backgroundColor: supervisor.isActive ? '#D1FAE5' : '#FEE2E2' }
            ]}>
              <Text style={[
                styles.supervisorStatusText,
                { color: supervisor.isActive ? '#065F46' : '#991B1B' }
              ]}>
                {supervisor.isActive ? 'ACTIVE' : 'INACTIVE'}
              </Text>
            </View>
          </View>
          
          <View style={styles.supervisorStats}>
            <View style={styles.supervisorStat}>
              <Text style={styles.supervisorStatValue}>{supervisor.actionsToday || 0}</Text>
              <Text style={styles.supervisorStatLabel}>Actions Today</Text>
            </View>
            <View style={styles.supervisorStat}>
              <Text style={styles.supervisorStatValue}>{supervisor.alertsDismissed || 0}</Text>
              <Text style={styles.supervisorStatLabel}>Alerts Dismissed</Text>
            </View>
            <View style={styles.supervisorStat}>
              <Text style={styles.supervisorStatValue}>{supervisor.lastLogin || 'Never'}</Text>
              <Text style={styles.supervisorStatLabel}>Last Login</Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderDiagnosticsTab = () => (
    <ScrollView style={styles.tabContent}>
      <MonitoringDashboard 
        supervisorInfo={{
          name: supervisorSession?.supervisor?.name,
          badge: supervisorSession?.supervisor?.badge,
          isAdmin: true
        }}
        embedded={true}
      />
    </ScrollView>
  );

  // Helper functions
  const getActivityIcon = (action) => {
    switch (action) {
      case 'supervisor_login': return 'log-in';
      case 'supervisor_logout': return 'log-out';
      case 'alert_dismissed': return 'close-circle';
      case 'roadwork_created': return 'construct';
      case 'priority_updated': return 'flag';
      default: return 'information-circle';
    }
  };

  const getActivityColor = (action) => {
    switch (action) {
      case 'supervisor_login': return '#3B82F6';
      case 'supervisor_logout': return '#6B7280';
      case 'alert_dismissed': return '#EF4444';
      case 'roadwork_created': return '#F59E0B';
      case 'priority_updated': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const formatActivityAction = (action) => {
    return action.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading admin dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="shield-checkmark" size={32} color="#3B82F6" />
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
            <Text style={styles.headerSubtitle}>
              System Management & Accountability
            </Text>
          </View>
        </View>
        
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Ionicons name="analytics" size={20} color={activeTab === 'overview' ? '#3B82F6' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'activity' && styles.tabActive]}
          onPress={() => setActiveTab('activity')}
        >
          <Ionicons name="list" size={20} color={activeTab === 'activity' ? '#3B82F6' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'activity' && styles.tabTextActive]}>
            Activity Logs
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'supervisors' && styles.tabActive]}
          onPress={() => setActiveTab('supervisors')}
        >
          <Ionicons name="people" size={20} color={activeTab === 'supervisors' ? '#3B82F6' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'supervisors' && styles.tabTextActive]}>
            Supervisors
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'diagnostics' && styles.tabActive]}
          onPress={() => setActiveTab('diagnostics')}
        >
          <Ionicons name="pulse" size={20} color={activeTab === 'diagnostics' ? '#3B82F6' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'diagnostics' && styles.tabTextActive]}>
            Diagnostics
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'activity' && renderActivityTab()}
        {activeTab === 'supervisors' && renderSupervisorsTab()}
        {activeTab === 'diagnostics' && renderDiagnosticsTab()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...Platform.select({
      web: { paddingTop: 20 },
      default: { paddingTop: 44 }
    }),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerTitles: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#3B82F6',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  chartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartLabel: {
    width: 80,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  progressBar: {
    flex: 1,
    height: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 10,
  },
  chartValue: {
    width: 40,
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    textAlign: 'right',
  },
  apiUsageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  apiUsageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  apiUsageLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  apiUsageValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    outlineStyle: 'none',
  },
  filterScroll: {
    flexDirection: 'row',
    maxWidth: 300,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exportButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  activityList: {
    flex: 1,
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  activityDetails: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
  },
  supervisorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  supervisorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  supervisorInfo: {
    gap: 4,
  },
  supervisorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  supervisorBadge: {
    fontSize: 12,
    color: '#6B7280',
  },
  supervisorStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  supervisorStatusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  supervisorStats: {
    flexDirection: 'row',
    gap: 24,
  },
  supervisorStat: {
    alignItems: 'center',
  },
  supervisorStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  supervisorStatLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
});

export default AdminDashboard;
