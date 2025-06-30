/*
 * Go Barry - Traffic Intelligence Platform
 * Admin Dashboard - Activity Audit Trail Page
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, Pressable, RefreshControl, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSupervisorSession } from '../../components/hooks/useSupervisorSession';
import { useSupervisorActions } from '../../hooks/useConvexSync';
import { darkTheme } from './styles/darkTheme';

const API_BASE = 'https://go-barry.onrender.com';

export default function ActivityAuditTrail() {
  const router = useRouter();
  const { supervisorSession, isAdmin } = useSupervisorSession();
  
  // Use Convex for real-time supervisor actions
  const convexActivities = useSupervisorActions({ limit: 100 });
  
  // Fallback state for direct API calls if Convex is not available
  const [fallbackActivities, setFallbackActivities] = useState([]);
  const [fallbackLoading, setFallbackLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('today');

  // Redirect if not admin
  useEffect(() => {
    if (supervisorSession && !isAdmin) {
      router.replace('/');
    }
  }, [supervisorSession, isAdmin, router]);

  // Fallback: Load activities directly from API if Convex is not working
  useEffect(() => {
    const loadFallbackActivities = async () => {
      try {
        setFallbackLoading(true);
        const response = await fetch(`${API_BASE}/api/activity-logs?limit=100`);
        
        if (response.ok) {
          const data = await response.json();
          setFallbackActivities(data.logs || []);
          console.log('✅ Fallback activities loaded:', data.logs?.length || 0);
        }
      } catch (error) {
        console.error('❌ Error loading fallback activities:', error);
      } finally {
        setFallbackLoading(false);
      }
    };

    // Only use fallback if Convex activities are not available
    if (!convexActivities && fallbackLoading) {
      loadFallbackActivities();
      // Refresh every 30 seconds
      const interval = setInterval(loadFallbackActivities, 30000);
      return () => clearInterval(interval);
    }
  }, [convexActivities, fallbackLoading]);

  // Use Convex data if available, otherwise fallback to API data
  const activities = convexActivities || fallbackActivities;
  const loading = !convexActivities && fallbackLoading;

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const getActivityIcon = (action) => {
    switch (action) {
      case 'supervisor_login': return { name: 'login', color: darkTheme.primary };
      case 'supervisor_logout': return { name: 'logout', color: darkTheme.textSecondary };
      case 'alert_dismissed': return { name: 'close-circle', color: darkTheme.error };
      case 'roadwork_created': return { name: 'road', color: darkTheme.warning };
      case 'email_sent': return { name: 'email', color: darkTheme.success };
      case 'duty_started': return { name: 'play-circle', color: darkTheme.accent };
      case 'alert_acknowledged': return { name: 'check-circle', color: darkTheme.success };
      case 'priority_updated': return { name: 'flag', color: darkTheme.warning };
      case 'note_added': return { name: 'note-text', color: darkTheme.textSecondary };
      case 'message_broadcast': return { name: 'bullhorn', color: darkTheme.primary };
      default: return { name: 'information', color: darkTheme.textSecondary };
    }
  };

  const formatActivityDetails = (action, details) => {
    if (!details) return action;
    
    switch (action) {
      case 'supervisor_login':
        return `${details.supervisor_name || 'Supervisor'} logged in`;
      case 'supervisor_logout':
        return `${details.supervisor_name || 'Supervisor'} logged out`;
      case 'alert_dismissed':
        return `Dismissed alert at ${details.location || 'unknown location'}: ${details.reason || 'No reason'}`;
      case 'roadwork_created':
        return `Created roadwork at ${details.location || 'unknown location'} (${details.severity || 'Unknown'} severity)`;
      case 'email_sent':
        return `Sent ${details.type || 'notification'} email to ${details.recipients?.length || 0} recipients`;
      case 'duty_started':
        return `Started ${details.duty_name || 'duty'}`;
      case 'alert_acknowledged':
        return `Acknowledged alert: ${details.reason || 'No reason'}`;
      case 'priority_updated':
        return `Updated alert priority to ${details.priority || 'Unknown'}`;
      case 'note_added':
        return `Added note: "${details.note || ''}"`;
      case 'message_broadcast':
        return `Broadcast: "${details.message || ''}"`;
      default:
        return typeof details === 'string' ? details : JSON.stringify(details);
    }
  };

  const filteredActivities = activities.filter(activity => {
    // Filter by type
    if (filter !== 'all' && activity.action !== filter) return false;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const details = formatActivityDetails(activity.action, activity.details).toLowerCase();
      const supervisor = (activity.supervisorName || activity.supervisor_name || '').toLowerCase();
      
      if (!details.includes(query) && !supervisor.includes(query)) {
        return false;
      }
    }
    
    // Filter by date range - handle both timestamp formats
    const activityDate = new Date(activity.timestamp || activity.created_at);
    const now = new Date();
    
    switch (dateRange) {
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (activityDate < today) return false;
        break;
      case 'week':
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        if (activityDate < weekAgo) return false;
        break;
      case 'month':
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        if (activityDate < monthAgo) return false;
        break;
    }
    
    return true;
  });

  const actionTypes = [
    { value: 'all', label: 'All Activities' },
    { value: 'supervisor_login', label: 'Logins' },
    { value: 'supervisor_logout', label: 'Logouts' },
    { value: 'alert_dismissed', label: 'Dismissals' },
    { value: 'roadwork_created', label: 'Roadworks' },
    { value: 'email_sent', label: 'Emails' },
    { value: 'message_broadcast', label: 'Messages' }
  ];

  if (!supervisorSession || !isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#a8edea" />
        <Text style={styles.loadingText}>Loading Activity Audit Trail...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Activity Audit Trail',
          headerStyle: {
            backgroundColor: '#1a1a2e',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              style={{ marginLeft: 15 }}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
            </Pressable>
          ),
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
              tintColor="#a8edea"
            />
          }
        >
          {/* Page Header */}
          <View style={styles.pageHeader}>
            <View style={styles.headerIcon}>
              <MaterialCommunityIcons name="file-document-outline" size={32} color="#a8edea" />
            </View>
            <View>
              <Text style={styles.pageTitle}>Activity Audit Trail</Text>
              <Text style={styles.pageSubtitle}>System activity logs</Text>
            </View>
          </View>

          {/* Filters */}
          <View style={styles.filtersContainer}>
            <View style={styles.searchContainer}>
              <MaterialCommunityIcons name="magnify" size={20} color={darkTheme.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search activities..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={darkTheme.textSecondary}
              />
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabs}>
              {actionTypes.map(type => (
                <TouchableOpacity
                  key={type.value}
                  style={[styles.filterTab, filter === type.value && styles.filterTabActive]}
                  onPress={() => setFilter(type.value)}
                >
                  <Text style={[styles.filterTabText, filter === type.value && styles.filterTabTextActive]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={styles.dateRangeContainer}>
              {['today', 'week', 'month', 'all'].map(range => (
                <TouchableOpacity
                  key={range}
                  style={[styles.dateRangeButton, dateRange === range && styles.dateRangeButtonActive]}
                  onPress={() => setDateRange(range)}
                >
                  <Text style={[styles.dateRangeText, dateRange === range && styles.dateRangeTextActive]}>
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Activity List */}
          <Text style={styles.resultCount}>
            {filteredActivities.length} activities found
          </Text>
          
          {filteredActivities.map((activity) => {
            const icon = getActivityIcon(activity.action);
            
            return (
              <View key={activity.id || activity._id} style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: `${icon.color}15` }]}>
                  <MaterialCommunityIcons name={icon.name} size={20} color={icon.color} />
                </View>
                
                <View style={styles.activityContent}>
                  <Text style={styles.activityText}>
                    {formatActivityDetails(activity.action, activity.details)}
                  </Text>
                  
                  <View style={styles.activityMeta}>
                    <Text style={styles.activitySupervisor}>
                      {activity.supervisorName || activity.supervisor_name || 'System'}
                    </Text>
                    <Text style={styles.activityTime}>
                      {new Date(activity.timestamp || activity.created_at).toLocaleString()}
                    </Text>
                  </View>
                  
                  {activity.ip_address && (
                    <Text style={styles.activityIp}>IP: {activity.ip_address}</Text>
                  )}
                  
                  {/* Show data source for debugging */}
                  {Platform.OS === 'web' && (
                    <Text style={styles.dataSource}>
                      {convexActivities ? '🔴 Real-time' : '🔵 Fallback'}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
          
          {filteredActivities.length === 0 && (
            <View style={styles.noActivities}>
              <MaterialCommunityIcons name="file-document-off" size={48} color={darkTheme.textSecondary} />
              <Text style={styles.noActivitiesText}>No activities found</Text>
            </View>
          )}
        </ScrollView>
        
        {/* Export Button */}
        <TouchableOpacity style={styles.exportButton}>
          <MaterialCommunityIcons name="download" size={20} color={darkTheme.background} />
          <Text style={styles.exportButtonText}>Export Audit Log</Text>
        </TouchableOpacity>
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
    marginBottom: 32,
    gap: 16,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(168, 237, 234, 0.1)',
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
  filtersContainer: {
    backgroundColor: darkTheme.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkTheme.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: darkTheme.text,
  },
  filterTabs: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: darkTheme.background,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  filterTabActive: {
    backgroundColor: darkTheme.primary,
    borderColor: darkTheme.primary,
  },
  filterTabText: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: darkTheme.background,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dateRangeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: darkTheme.background,
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
  resultCount: {
    fontSize: 14,
    color: darkTheme.textSecondary,
    marginBottom: 12,
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: darkTheme.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: darkTheme.text,
    marginBottom: 4,
    lineHeight: 20,
  },
  activityMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activitySupervisor: {
    fontSize: 12,
    color: darkTheme.primary,
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
  activityIp: {
    fontSize: 11,
    color: darkTheme.textTertiary,
    marginTop: 2,
  },
  dataSource: {
    fontSize: 10,
    color: darkTheme.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  noActivities: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  noActivitiesText: {
    marginTop: 12,
    fontSize: 16,
    color: darkTheme.textSecondary,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: darkTheme.success,
    paddingVertical: 12,
    borderRadius: 8,
    margin: 20,
    marginTop: 0,
  },
  exportButtonText: {
    color: darkTheme.background,
    fontSize: 14,
    fontWeight: '600',
  },
});
