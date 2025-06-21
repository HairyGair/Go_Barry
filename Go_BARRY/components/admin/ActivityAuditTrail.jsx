// Go_BARRY/components/admin/ActivityAuditTrail.jsx
// Comprehensive activity audit trail for admin accountability

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const API_BASE = 'https://go-barry.onrender.com';

const ActivityAuditTrail = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('today');

  useEffect(() => {
    loadActivities();
  }, [filter, dateRange]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/activity-logs?limit=100`);
      
      if (response.ok) {
        const data = await response.json();
        setActivities(data.logs || []);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (action) => {
    switch (action) {
      case 'supervisor_login': return { name: 'log-in', color: '#3B82F6' };
      case 'supervisor_logout': return { name: 'log-out', color: '#6B7280' };
      case 'alert_dismissed': return { name: 'close-circle', color: '#EF4444' };
      case 'roadwork_created': return { name: 'construct', color: '#F59E0B' };
      case 'email_sent': return { name: 'mail', color: '#10B981' };
      case 'duty_started': return { name: 'play-circle', color: '#8B5CF6' };
      case 'alert_acknowledged': return { name: 'checkmark-circle', color: '#059669' };
      case 'priority_updated': return { name: 'flag', color: '#F59E0B' };
      case 'note_added': return { name: 'create', color: '#6B7280' };
      case 'message_broadcast': return { name: 'megaphone', color: '#3B82F6' };
      default: return { name: 'information-circle', color: '#6B7280' };
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
      const supervisor = (activity.supervisor_name || '').toLowerCase();
      
      if (!details.includes(query) && !supervisor.includes(query)) {
        return false;
      }
    }
    
    // Filter by date range
    const activityDate = new Date(activity.created_at);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search activities..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
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
      <ScrollView style={styles.activityList} showsVerticalScrollIndicator={false}>
        <Text style={styles.resultCount}>
          {filteredActivities.length} activities found
        </Text>
        
        {filteredActivities.map((activity) => {
          const icon = getActivityIcon(activity.action);
          
          return (
            <View key={activity.id} style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: `${icon.color}15` }]}>
                <Ionicons name={icon.name} size={20} color={icon.color} />
              </View>
              
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>
                  {formatActivityDetails(activity.action, activity.details)}
                </Text>
                
                <View style={styles.activityMeta}>
                  <Text style={styles.activitySupervisor}>
                    {activity.supervisor_name || 'System'}
                  </Text>
                  <Text style={styles.activityTime}>
                    {new Date(activity.created_at).toLocaleString()}
                  </Text>
                </View>
                
                {activity.ip_address && (
                  <Text style={styles.activityIp}>IP: {activity.ip_address}</Text>
                )}
              </View>
            </View>
          );
        })}
        
        {filteredActivities.length === 0 && (
          <View style={styles.noActivities}>
            <Ionicons name="document-text" size={48} color="#E5E7EB" />
            <Text style={styles.noActivitiesText}>No activities found</Text>
          </View>
        )}
      </ScrollView>

      {/* Export Button */}
      <TouchableOpacity style={styles.exportButton}>
        <Ionicons name="download" size={20} color="#FFFFFF" />
        <Text style={styles.exportButtonText}>Export Audit Log</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1F2937',
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
    backgroundColor: '#F3F4F6',
  },
  filterTabActive: {
    backgroundColor: '#3B82F6',
  },
  filterTabText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  dateRangeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dateRangeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  dateRangeButtonActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  dateRangeText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  dateRangeTextActive: {
    color: '#3B82F6',
  },
  activityList: {
    flex: 1,
  },
  resultCount: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#1F2937',
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
    color: '#3B82F6',
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  activityIp: {
    fontSize: 11,
    color: '#D1D5DB',
    marginTop: 2,
  },
  noActivities: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  noActivitiesText: {
    marginTop: 12,
    fontSize: 16,
    color: '#9CA3AF',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ActivityAuditTrail;
