// Go_BARRY/components/AlertList.jsx
// BARRY Live Alert List - Displays live alerts from all sources
// NO SAMPLE DATA - All data comes from live APIs

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBARRYapi } from './hooks/useBARRYapi';
import EnhancedTrafficCard from './EnhancedTrafficCard';

const AlertList = () => {
  const {
    alerts,
    statistics,
    loading,
    error,
    lastUpdated,
    refreshing,
    refreshAllData,
    forceRefresh,
    getCriticalAlerts,
    getTrafficAlerts,
    getRoadworks,
    hasLiveData,
    isSystemHealthy,
    activeSourcesCount,
    totalSourcesCount
  } = useBARRYapi();

  // Local state for filtering
  const [filterType, setFilterType] = useState('all'); // all, critical, traffic, roadworks
  const [sortBy, setSortBy] = useState('priority'); // priority, date, location

  // Filter and sort live alerts
  const filteredAndSortedAlerts = useMemo(() => {
    let filtered = [...alerts];

    // Apply filter
    switch (filterType) {
      case 'critical':
        filtered = getCriticalAlerts();
        break;
      case 'traffic':
        filtered = getTrafficAlerts();
        break;
      case 'roadworks':
        filtered = getRoadworks();
        break;
      default:
        // 'all' - no filtering
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          // Sort by status (red > amber > green), then severity, then congestion level
          const statusPriority = { red: 3, amber: 2, green: 1 };
          const severityPriority = { High: 3, Medium: 2, Low: 1 };
          
          const aStatusScore = statusPriority[a.status] || 0;
          const bStatusScore = statusPriority[b.status] || 0;
          
          if (aStatusScore !== bStatusScore) return bStatusScore - aStatusScore;
          
          const aSeverityScore = severityPriority[a.severity] || 0;
          const bSeverityScore = severityPriority[b.severity] || 0;
          
          if (aSeverityScore !== bSeverityScore) return bSeverityScore - aSeverityScore;
          
          // For traffic alerts, sort by congestion level
          const aCongestion = a.congestionLevel || 0;
          const bCongestion = b.congestionLevel || 0;
          
          return bCongestion - aCongestion;
          
        case 'date':
          // Sort by start date, most recent first
          const aDate = new Date(a.startDate || a.lastUpdated || 0);
          const bDate = new Date(b.startDate || b.lastUpdated || 0);
          return bDate - aDate;
          
        case 'location':
          // Sort alphabetically by location
          const aLocation = a.location || '';
          const bLocation = b.location || '';
          return aLocation.localeCompare(bLocation);
          
        default:
          return 0;
      }
    });

    return filtered;
  }, [alerts, filterType, sortBy, getCriticalAlerts, getTrafficAlerts, getRoadworks]);

  // Handle filter button press
  const handleFilterPress = (type) => {
    setFilterType(type);
  };

  // Handle sort button press
  const handleSortPress = () => {
    const sortOptions = [
      { key: 'priority', label: 'Priority (Status & Severity)' },
      { key: 'date', label: 'Date (Most Recent First)' },
      { key: 'location', label: 'Location (A-Z)' }
    ];

    Alert.alert(
      'Sort Alerts',
      'Choose sorting method:',
      sortOptions.map(option => ({
        text: option.label,
        onPress: () => setSortBy(option.key)
      })).concat([{
        text: 'Cancel',
        style: 'cancel'
      }])
    );
  };

  // Handle force refresh
  const handleForceRefresh = () => {
    Alert.alert(
      'Force Refresh All Sources',
      'This will refresh Street Manager, National Highways, HERE, and MapQuest data sources. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Refresh', 
          onPress: forceRefresh,
          style: 'default'
        }
      ]
    );
  };

  // Format last updated time
  const formatLastUpdated = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  };

  // Render filter buttons
  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[
          { key: 'all', label: 'All', count: alerts.length },
          { key: 'critical', label: 'Critical', count: statistics.criticalAlerts },
          { key: 'traffic', label: 'Traffic', count: statistics.trafficIncidents + statistics.congestionAlerts },
          { key: 'roadworks', label: 'Roadworks', count: statistics.roadworks }
        ].map(filter => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              filterType === filter.key && styles.filterButtonActive
            ]}
            onPress={() => handleFilterPress(filter.key)}
          >
            <Text style={[
              styles.filterButtonText,
              filterType === filter.key && styles.filterButtonTextActive
            ]}>
              {filter.label} ({filter.count})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Render header with system status
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>Live Traffic Alerts</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleSortPress} style={styles.actionButton}>
            <Ionicons name="filter" size={20} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleForceRefresh} style={styles.actionButton}>
            <Ionicons name="refresh" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.statusBar}>
        <View style={styles.statusItem}>
          <Ionicons 
            name={isSystemHealthy ? "checkmark-circle" : "warning"} 
            size={16} 
            color={isSystemHealthy ? "#00ff88" : "#ff6b6b"} 
          />
          <Text style={styles.statusText}>
            {activeSourcesCount}/{totalSourcesCount} Sources
          </Text>
        </View>
        
        <View style={styles.statusItem}>
          <Ionicons name="time" size={16} color="#888" />
          <Text style={styles.statusText}>
            {formatLastUpdated(lastUpdated)}
          </Text>
        </View>
        
        <View style={styles.statusItem}>
          <Ionicons 
            name={hasLiveData ? "radio" : "radio-outline"} 
            size={16} 
            color={hasLiveData ? "#00ff88" : "#888"} 
          />
          <Text style={styles.statusText}>
            {hasLiveData ? 'Live' : 'No Data'}
          </Text>
        </View>
      </View>
    </View>
  );

  // Render loading state
  if (loading && alerts.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00ff88" />
          <Text style={styles.loadingText}>Loading live alerts...</Text>
          <Text style={styles.loadingSubtext}>
            Connecting to Street Manager, National Highways, HERE, and MapQuest
          </Text>
        </View>
      </View>
    );
  }

  // Render error state
  if (error && alerts.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color="#ff6b6b" />
          <Text style={styles.errorTitle}>Unable to Load Live Alerts</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={refreshAllData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Render empty state
  if (!hasLiveData && !loading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle" size={48} color="#00ff88" />
          <Text style={styles.emptyTitle}>No Active Alerts</Text>
          <Text style={styles.emptyText}>
            All traffic sources are clear. Check back later for updates.
          </Text>
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={refreshAllData}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Render alerts list
  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderFilterButtons()}
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshAllData}
            colors={['#00ff88']}
            tintColor="#00ff88"
          />
        }
      >
        <View style={styles.alertsContainer}>
          <Text style={styles.resultsText}>
            {filteredAndSortedAlerts.length} alert{filteredAndSortedAlerts.length !== 1 ? 's' : ''} 
            {filterType !== 'all' && ` (${filterType})`}
            {sortBy !== 'priority' && ` sorted by ${sortBy}`}
          </Text>
          
          {filteredAndSortedAlerts.map((alert, index) => (
            <EnhancedTrafficCard 
              key={alert.id || `alert-${index}`} 
              alert={alert} 
              index={index}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a'
  },
  header: {
    backgroundColor: '#2a2a2a',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10
  },
  actionButton: {
    padding: 8,
    backgroundColor: '#333',
    borderRadius: 6
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  statusText: {
    fontSize: 12,
    color: '#888'
  },
  filterContainer: {
    backgroundColor: '#2a2a2a',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    backgroundColor: '#333',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#444'
  },
  filterButtonActive: {
    backgroundColor: '#00ff88',
    borderColor: '#00ff88'
  },
  filterButtonText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500'
  },
  filterButtonTextActive: {
    color: '#000000'
  },
  scrollView: {
    flex: 1
  },
  alertsContainer: {
    padding: 15
  },
  resultsText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 15,
    textAlign: 'center'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  loadingText: {
    fontSize: 18,
    color: '#ffffff',
    marginTop: 15,
    textAlign: 'center'
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
    textAlign: 'center'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  errorTitle: {
    fontSize: 18,
    color: '#ff6b6b',
    marginTop: 15,
    textAlign: 'center',
    fontWeight: 'bold'
  },
  errorText: {
    fontSize: 14,
    color: '#888',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 20
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#ff6b6b',
    borderRadius: 6
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: 'bold'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  emptyTitle: {
    fontSize: 18,
    color: '#00ff88',
    marginTop: 15,
    textAlign: 'center',
    fontWeight: 'bold'
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 20
  },
  refreshButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#00ff88',
    borderRadius: 6
  },
  refreshButtonText: {
    color: '#000000',
    fontWeight: 'bold'
  }
});

export default AlertList;