import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  FlatList,
  // Add Alert import if not already present
} from 'react-native';
import TrafficCard from '../../components/TrafficCard';
import { api } from '../../services/api';

// Filter and sort options
const ALERT_TYPES = [
  { key: 'all', label: 'All Types', icon: '🚦' },
  { key: 'incident', label: 'Incidents', icon: '🚨' },
  { key: 'congestion', label: 'Traffic', icon: '🚗' },
  { key: 'roadwork', label: 'Roadworks', icon: '🚧' }
];

const STATUS_FILTERS = [
  { key: 'all', label: 'All Status', color: '#6B7280' },
  { key: 'red', label: 'Active', color: '#DC2626' },
  { key: 'amber', label: 'Upcoming', color: '#D97706' },
  { key: 'green', label: 'Planned', color: '#059669' }
];

const SEVERITY_FILTERS = [
  { key: 'all', label: 'All Severity' },
  { key: 'High', label: 'High' },
  { key: 'Medium', label: 'Medium' },
  { key: 'Low', label: 'Low' }
];

const SORT_OPTIONS = [
  { key: 'priority', label: 'Priority (Default)' },
  { key: 'newest', label: 'Newest First' },
  { key: 'oldest', label: 'Oldest First' },
  { key: 'location', label: 'Location A-Z' },
  { key: 'type', label: 'Type' },
  { key: 'routes', label: 'Routes Affected' }
];

export default function AlertsScreen() {
  // State variables
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  
  // Filter states
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [sortBy, setSortBy] = useState('priority');
  
  // Modal states
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Enhanced SupaBase debug function
  const debugSupaBase = async () => {
    console.log('🔍 Enhanced SupaBase debug...');
    
    // Test 1: Basic internet connectivity
    console.log('🌐 Test 1: Basic internet test...');
    try {
      const response = await fetch('https://www.google.com', {
        method: 'GET',
        timeout: 5000
      });
      console.log('✅ Internet works, Google status:', response.status);
    } catch (error) {
      console.error('❌ No internet connection:', error.message);
      Alert.alert('No Internet ❌', 'Your device appears to be offline. Check your WiFi or mobile data connection.', [{ text: 'OK' }]);
      return false;
    }

    // Test 2: SupaBase domain connectivity
    console.log('🌐 Test 2: SupaBase domain test...');
    try {
      const response = await fetch('https://supabase.com', {
        method: 'GET',
        timeout: 5000
      });
      console.log('✅ SupaBase domain accessible, status:', response.status);
    } catch (error) {
      console.error('❌ Cannot reach SupaBase servers:', error.message);
      Alert.alert('SupaBase Unreachable ❌', 'Cannot connect to SupaBase servers. This might be a network firewall or SupaBase service issue.', [{ text: 'OK' }]);
      return false;
    }

    // Test 3: Your specific SupaBase project
    const SUPABASE_URL = 'https://haountnqhecfrsonivbq.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhb3VudG5naGVjZnJzb25pdWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2NzgxNDksImV4cCI6MjA2MzI1NDE0OX0.xtjxeGkxG3cx67IvpI4XxEpWewLG9Bh6bfyQenfTILs';

    console.log('🏗️ Test 3: Your SupaBase project test...');
    try {
      const response = await fetch(SUPABASE_URL, {
        method: 'GET',
        timeout: 10000
      });
      console.log('✅ Your SupaBase project accessible, status:', response.status);
      
      if (response.status === 200) {
        console.log('✅ Project is ACTIVE');
      } else {
        console.log('⚠️ Unexpected status - project might be paused');
      }
    } catch (error) {
      console.error('❌ Your SupaBase project unreachable:', error.message);
      Alert.alert(
        'Project Unreachable ❌', 
        'Your SupaBase project cannot be reached. Check:\n\n1. Project is not paused in dashboard\n2. URL is correct\n3. Project exists', 
        [{ text: 'OK' }]
      );
      return false;
    }

    // Test 4: API endpoint with authentication
    console.log('🔑 Test 4: API authentication test...');
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000
      });

      console.log('🔑 API endpoint status:', response.status);
      
      if (response.status === 200) {
        console.log('✅ API authentication works');
        
        // Test 5: Table access
        console.log('📊 Test 5: Table access test...');
        const tableResponse = await fetch(`${SUPABASE_URL}/rest/v1/traffic_alerts?select=id,title&limit=1`, {
          method: 'GET',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000
        });

        console.log('📊 Table query status:', tableResponse.status);

        if (tableResponse.ok) {
          const data = await tableResponse.json();
          console.log('🎉 SUCCESS! Table accessible, found:', data.length, 'records');
          Alert.alert('Debug Success! 🎉', `All tests passed!\n\nFound ${data.length} alerts in your SupaBase.\n\nThe issue was temporary - try refreshing your app now.`, [{ text: 'Great!' }]);
          return true;
        } else {
          const errorText = await tableResponse.text();
          console.error('❌ Table access denied:', tableResponse.status, errorText);
          Alert.alert('Access Denied ❌', `Table query failed with status ${tableResponse.status}.\n\nThis is likely a Row Level Security issue. Run the RLS fix SQL in your SupaBase dashboard.`, [{ text: 'OK' }]);
          return false;
        }
      } else {
        console.error('❌ API authentication failed:', response.status);
        Alert.alert('Auth Failed ❌', `API authentication failed with status ${response.status}.\n\nCheck your API key is correct.`, [{ text: 'OK' }]);
        return false;
      }
    } catch (error) {
      console.error('❌ API test failed:', error.message);
      Alert.alert('API Test Failed ❌', `Could not test API: ${error.message}`, [{ text: 'OK' }]);
      return false;
    }
  };

  const fetchAlerts = async () => {
    if (!refreshing) setLoading(true);
    setRefreshing(true);
    
    try {
      console.log('📋 Fetching detailed alerts for operations...');
      const result = await api.getAlerts();
      
      if (result.success && result.data.alerts) {
        setAlerts(result.data.alerts);
        setLastUpdated(result.data.metadata?.lastUpdated || new Date().toISOString());
        console.log(`✅ Loaded ${result.data.alerts.length} alerts for operations view`);
      } else {
        throw new Error(result.error || 'Failed to fetch alerts');
      }
    } catch (error) {
      console.error('❌ Alerts fetch error:', error);
      Alert.alert(
        'Data Error',
        'Unable to fetch traffic alerts. Please check your connection and try again.',
        [{ text: 'Retry', onPress: fetchAlerts }, { text: 'Cancel' }]
      );
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    
    // Auto-refresh every 3 minutes for operational view
    const interval = setInterval(fetchAlerts, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Advanced filtering and sorting logic
  const filteredAndSortedAlerts = useMemo(() => {
    let filtered = alerts;

    // Search filter
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(alert => 
        alert.title?.toLowerCase().includes(search) ||
        alert.description?.toLowerCase().includes(search) ||
        alert.location?.toLowerCase().includes(search) ||
        alert.affectsRoutes?.some(route => route.toLowerCase().includes(search))
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(alert => alert.type === selectedType);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(alert => alert.status === selectedStatus);
    }

    // Severity filter
    if (selectedSeverity !== 'all') {
      filtered = filtered.filter(alert => alert.severity === selectedSeverity);
    }

    // Sort logic
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          // Default priority: incidents > congestion > roadworks, then by status, then by severity
          const typePriority = { incident: 5, congestion: 4, roadwork: 3 };
          const statusPriority = { red: 3, amber: 2, green: 1 };
          const severityPriority = { High: 3, Medium: 2, Low: 1 };
          
          const aTypeScore = typePriority[a.type] || 1;
          const bTypeScore = typePriority[b.type] || 1;
          if (aTypeScore !== bTypeScore) return bTypeScore - aTypeScore;
          
          const aStatusScore = statusPriority[a.status] || 0;
          const bStatusScore = statusPriority[b.status] || 0;
          if (aStatusScore !== bStatusScore) return bStatusScore - aStatusScore;
          
          const aSeverityScore = severityPriority[a.severity] || 0;
          const bSeverityScore = severityPriority[b.severity] || 0;
          return bSeverityScore - aSeverityScore;

        case 'newest':
          return new Date(b.lastUpdated || b.startDate || 0) - new Date(a.lastUpdated || a.startDate || 0);

        case 'oldest':
          return new Date(a.lastUpdated || a.startDate || 0) - new Date(b.lastUpdated || b.startDate || 0);

        case 'location':
          return (a.location || '').localeCompare(b.location || '');

        case 'type':
          return (a.type || '').localeCompare(b.type || '');

        case 'routes':
          const aRoutes = (a.affectsRoutes || []).length;
          const bRoutes = (b.affectsRoutes || []).length;
          return bRoutes - aRoutes;

        default:
          return 0;
      }
    });

    return filtered;
  }, [alerts, searchText, selectedType, selectedStatus, selectedSeverity, sortBy]);

  const formatLastUpdated = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      
      if (diffMins < 1) return 'Just updated';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
      
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  const getAlertCounts = () => {
    return {
      total: filteredAndSortedAlerts.length,
      active: filteredAndSortedAlerts.filter(a => a.status === 'red').length,
      incidents: filteredAndSortedAlerts.filter(a => a.type === 'incident').length,
      congestion: filteredAndSortedAlerts.filter(a => a.type === 'congestion').length,
      roadworks: filteredAndSortedAlerts.filter(a => a.type === 'roadwork').length
    };
  };

  const counts = getAlertCounts();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading operational alerts...</Text>
          <Text style={styles.loadingSubtext}>Fetching latest traffic intelligence</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Traffic Alerts</Text>
          <Text style={styles.headerSubtitle}>Operational Control View</Text>
        </View>
        <View style={styles.headerStats}>
          <Text style={styles.headerStatsText}>
            {counts.total} alerts • {counts.active} active • Updated {formatLastUpdated(lastUpdated)}
          </Text>
        </View>
      </View>

      {/* Search and Filter Bar */}
      <View style={styles.controlsContainer}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search alerts, locations, routes..."
            placeholderTextColor="#6B7280"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        
        <View style={styles.controlButtons}>
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: '#DC2626' }]}
            onPress={debugSupaBase}
          >
            <Text style={styles.controlButtonText}>🧪 Debug</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Text style={styles.controlButtonText}>Filter</Text>
            {(selectedType !== 'all' || selectedStatus !== 'all' || selectedSeverity !== 'all') && (
              <View style={styles.activeFilterDot} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowSortModal(true)}
          >
            <Text style={styles.controlButtonText}>Sort</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Compact Metallic Filter Buttons */}
      <View style={styles.quickFilters}>
        {ALERT_TYPES.map(type => (
          <TouchableOpacity
            key={type.key}
            style={[
              styles.metallicButton,
              selectedType === type.key && styles.metallicButtonPressed
            ]}
            onPress={() => setSelectedType(type.key)}
          >
            <Text style={styles.buttonEmoji}>{type.icon}</Text>
            <Text style={[
              styles.buttonText,
              selectedType === type.key && styles.buttonTextPressed
            ]}>
              {type.label}
            </Text>
            <View style={styles.badgeContainer}>
              <Text style={[
                styles.badgeText,
                selectedType === type.key && styles.badgeTextPressed
              ]}>
                {type.key === 'all' ? counts.total : counts[type.key] || 0}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Alerts List */}
      <FlatList
        data={filteredAndSortedAlerts}
        keyExtractor={(item, index) => item.id || `alert_${index}`}
        renderItem={({ item, index }) => (
          <View style={styles.alertWrapper}>
            <TrafficCard alert={item} />
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchAlerts}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>🚦</Text>
            <Text style={styles.emptyStateTitle}>No alerts found</Text>
            <Text style={styles.emptyStateText}>
              {searchText.trim() || selectedType !== 'all' || selectedStatus !== 'all' || selectedSeverity !== 'all'
                ? 'Try adjusting your filters or search terms'
                : 'All clear - no traffic alerts at the moment'}
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => {
                setSearchText('');
                setSelectedType('all');
                setSelectedStatus('all');
                setSelectedSeverity('all');
              }}
            >
              <Text style={styles.emptyStateButtonText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        )}
        style={styles.alertsList}
        contentContainerStyle={styles.alertsListContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSortModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sort Alerts</Text>
            {SORT_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.modalOption,
                  sortBy === option.key && styles.modalOptionActive
                ]}
                onPress={() => {
                  setSortBy(option.key);
                  setShowSortModal(false);
                }}
              >
                <Text style={[
                  styles.modalOptionText,
                  sortBy === option.key && styles.modalOptionTextActive
                ]}>
                  {option.label}
                </Text>
                {sortBy === option.key && (
                  <Text style={styles.modalOptionCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowSortModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter Alerts</Text>
            
            {/* Status Filter */}
            <Text style={styles.modalSectionTitle}>Status</Text>
            <View style={styles.modalFilterRow}>
              {STATUS_FILTERS.map(status => (
                <TouchableOpacity
                  key={status.key}
                  style={[
                    styles.modalFilterButton,
                    { backgroundColor: selectedStatus === status.key ? status.color : '#F3F4F6' }
                  ]}
                  onPress={() => setSelectedStatus(status.key)}
                >
                  <Text style={[
                    styles.modalFilterButtonText,
                    { color: selectedStatus === status.key ? '#FFFFFF' : '#374151' }
                  ]}>
                    {status.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Severity Filter */}
            <Text style={styles.modalSectionTitle}>Severity</Text>
            <View style={styles.modalFilterRow}>
              {SEVERITY_FILTERS.map(severity => (
                <TouchableOpacity
                  key={severity.key}
                  style={[
                    styles.modalFilterButton,
                    selectedSeverity === severity.key && styles.modalFilterButtonActive
                  ]}
                  onPress={() => setSelectedSeverity(severity.key)}
                >
                  <Text style={[
                    styles.modalFilterButtonText,
                    selectedSeverity === severity.key && styles.modalFilterButtonTextActive
                  ]}>
                    {severity.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalResetButton}
                onPress={() => {
                  setSelectedStatus('all');
                  setSelectedSeverity('all');
                }}
              >
                <Text style={styles.modalResetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalApplyButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.modalApplyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  loadingSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 1,
  },
  headerStats: {
    marginTop: 6,
  },
  headerStatsText: {
    fontSize: 11,
    color: '#6B7280',
  },
  controlsContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    marginBottom: 8,
  },
  searchInput: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    fontSize: 15,
    color: '#374151',
  },
  controlButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderTopColor: '#E2E8F0',
    borderLeftColor: '#E2E8F0',
    borderRightColor: '#94A3B8',
    borderBottomColor: '#94A3B8',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  controlButtonText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
  },
  activeFilterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DC2626',
    marginLeft: 6,
  },
  quickFilters: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metallicButton: {
    flex: 1,
    marginHorizontal: 2,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderTopColor: '#E2E8F0',
    borderLeftColor: '#E2E8F0',
    borderRightColor: '#94A3B8',
    borderBottomColor: '#94A3B8',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  metallicButtonPressed: {
    backgroundColor: '#2563EB',
    borderTopColor: '#1E40AF',
    borderLeftColor: '#1E40AF',
    borderRightColor: '#3B82F6',
    borderBottomColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.2,
    elevation: 0,
  },
  buttonEmoji: {
    fontSize: 14,
    marginBottom: 2,
  },
  buttonText: {
    fontSize: 10,
    color: '#374151',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  buttonTextPressed: {
    color: '#FFFFFF',
  },
  badgeContainer: {
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 9,
    color: '#374151',
    fontWeight: 'bold',
  },
  badgeTextPressed: {
    color: '#1E40AF',
  },
  quickFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickFilterButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  quickFilterEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  quickFilterText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  quickFilterTextActive: {
    color: '#FFFFFF',
  },
  quickFilterCount: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: 'bold',
    marginTop: 2,
  },
  quickFilterCountActive: {
    color: '#FFFFFF',
  },
  alertsList: {
    flex: 1,
  },
  alertsListContent: {
    padding: 16,
    paddingBottom: 32,
  },
  alertWrapper: {
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    marginTop: 16,
  },
  modalFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  modalFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  modalFilterButtonActive: {
    backgroundColor: '#2563EB',
  },
  modalFilterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  modalFilterButtonTextActive: {
    color: '#FFFFFF',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalOptionActive: {
    backgroundColor: '#EBF8FF',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  modalOptionTextActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
  modalOptionCheck: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalResetButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalResetButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  modalApplyButton: {
    flex: 2,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalApplyButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalCloseButton: {
    marginTop: 16,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});