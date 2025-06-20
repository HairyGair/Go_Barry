import React, { useState, useMemo } from 'react';
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
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Simple Traffic Card component for mobile alerts
const SimpleTrafficCard = ({ alert, supervisorSession, onDismiss, onAcknowledge, onAddToDatabase }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'red': return '#EF4444';
      case 'amber': return '#F59E0B';
      case 'green': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'High': return '#DC2626';
      case 'Medium': return '#D97706';
      case 'Low': return '#059669';
      default: return '#4B5563';
    }
  };

  return (
    <View style={[
      {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginVertical: 6,
        borderLeftWidth: 4,
        borderLeftColor: getStatusColor(alert.status),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
      }
    ]}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 }}>
            {alert.title || 'Traffic Alert'}
          </Text>
          <Text style={{ fontSize: 14, color: '#6B7280' }}>
            {alert.location || 'Location not specified'}
          </Text>
        </View>
        <View style={[
          {
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
            backgroundColor: getSeverityColor(alert.severity)
          }
        ]}>
          <Text style={{ fontSize: 12, color: '#FFFFFF', fontWeight: '600' }}>
            {alert.severity || 'Unknown'}
          </Text>
        </View>
      </View>

      {/* Description */}
      {alert.description && (
        <Text style={{ fontSize: 14, color: '#374151', marginBottom: 12, lineHeight: 20 }}>
          {alert.description}
        </Text>
      )}

      {/* Routes affected */}
      {alert.affectsRoutes && alert.affectsRoutes.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Affects Routes:</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
            {alert.affectsRoutes.slice(0, 6).map((route, index) => (
              <View key={index} style={[
                {
                  backgroundColor: '#EFF6FF',
                  borderColor: '#3B82F6',
                  borderWidth: 1,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4
                }
              ]}>
                <Text style={{ fontSize: 11, color: '#3B82F6', fontWeight: '600' }}>
                  {route}
                </Text>
              </View>
            ))}
            {alert.affectsRoutes.length > 6 && (
              <Text style={{ fontSize: 11, color: '#6B7280', alignSelf: 'center' }}>
                +{alert.affectsRoutes.length - 6} more
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Footer with actions */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text style={{ fontSize: 12, color: '#6B7280' }}>
            {alert.type || 'Alert'} • {alert.status || 'Unknown'}
          </Text>
          {alert.lastUpdated && (
            <Text style={{ fontSize: 12, color: '#6B7280' }}>
              {new Date(alert.lastUpdated).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>
        
        {supervisorSession && (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity
              style={{
                backgroundColor: '#10B981',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6
              }}
              onPress={() => onAddToDatabase && onAddToDatabase(alert)}
            >
              <Text style={{ fontSize: 11, color: '#FFFFFF', fontWeight: '600' }}>ADD TO DB</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: '#F59E0B',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6
              }}
              onPress={() => onAcknowledge && onAcknowledge(alert.id)}
            >
              <Text style={{ fontSize: 12, color: '#FFFFFF', fontWeight: '600' }}>ACK</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: '#EF4444',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6
              }}
              onPress={() => onDismiss && onDismiss(alert.id, 'Supervisor dismissed', 'Mobile action')}
            >
              <Text style={{ fontSize: 12, color: '#FFFFFF', fontWeight: '600' }}>DISMISS</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};
import SupervisorLogin from '../../components/SupervisorLogin';
import CreateRoadworkModal from '../../components/CreateRoadworkModal';
import { useSupervisorSession } from '../../components/hooks/useSupervisorSession';
import { useBarryAPI } from '../../components/hooks/useBARRYapi';
import { Colors, getStatusColor, getSeverityColor, getTrafficTypeColor } from '../../constants/Colors';

// Filter and sort options
const ALERT_TYPES = [
  { key: 'all', label: 'All Types', icon: '🚦' },
  { key: 'incident', label: 'Incidents', icon: '🚨' },
  { key: 'congestion', label: 'Traffic', icon: '🚗' },
  { key: 'roadwork', label: 'Roadworks', icon: '🚧' }
];

const STATUS_FILTERS = [
  { key: 'all', label: 'All Status', color: Colors.mediumGrey },
  { key: 'red', label: 'Active', color: Colors.trafficAlert.active },
  { key: 'amber', label: 'Upcoming', color: Colors.trafficAlert.upcoming },
  { key: 'green', label: 'Planned', color: Colors.trafficAlert.planned }
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
  // Use the BARRY API hook
  const {
    alerts,
    loading,
    error,
    refreshAlerts,
    lastUpdated,
    isRefreshing
  } = useBarryAPI({
    autoRefresh: true,
    refreshInterval: 3 * 60 * 1000 // 3 minutes for operational view
  });
  
  // Debug logging
  console.log('🔍 Debug - Alerts data:', {
    alertsCount: alerts?.length || 0,
    loading,
    lastUpdated,
    isRefreshing,
    alertsPreview: alerts?.slice(0, 2), // First 2 alerts for debugging
    error: error || 'None'
  });
  
  // Supervisor session
  const {
    supervisorSession,
    isLoggedIn,
    supervisorName,
    supervisorRole,
    dismissAlert,
    isLoading: supervisorLoading
  } = useSupervisorSession();
  
  // Filter states
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [sortBy, setSortBy] = useState('priority');
  
  // Modal states
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSupervisorLogin, setShowSupervisorLogin] = useState(false);
  const [showCreateRoadworkModal, setShowCreateRoadworkModal] = useState(false);
  const [selectedAlertForRoadwork, setSelectedAlertForRoadwork] = useState(null);

  // Alert action handlers
  const handleAlertDismiss = async (alertId, reason, notes) => {
    try {
      const result = await dismissAlert(alertId, reason, notes);
      if (result.success) {
        // Refresh alerts to show updated list
        refreshAlerts();
      }
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
    }
  };

  const handleAlertAcknowledge = (alertId) => {
    Alert.alert(
      'Alert Acknowledged',
      `Alert ${alertId} has been acknowledged by ${supervisorName || 'supervisor'}`
    );
  };

  const handleSupervisorLogin = () => {
    setShowSupervisorLogin(true);
  };

  const handleAddToDatabase = (alert) => {
    setSelectedAlertForRoadwork(alert);
    setShowCreateRoadworkModal(true);
  };

  // Advanced filtering and sorting logic
  const filteredAndSortedAlerts = useMemo(() => {
    let filtered = alerts || [];

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
        <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading enhanced alerts...</Text>
          <Text style={styles.loadingSubtext}>
            Fetching from TomTom, MapQuest, HERE & National Highways
          </Text>
          <Text style={styles.debugText}>
            Debug: {alerts?.length || 0} alerts loaded, Loading: {loading ? 'Yes' : 'No'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      {/* Enhanced Header with Supervisor Status */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Traffic Alerts</Text>
            <Text style={styles.headerSubtitle}>Enhanced Operational Control</Text>
          </View>
          <View style={styles.headerRight}>
            {isLoggedIn ? (
              <View style={styles.supervisorStatus}>
                <View style={styles.supervisorInfo}>
                  <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                  <Text style={styles.supervisorName}>{supervisorName}</Text>
                </View>
                <Text style={styles.supervisorRole}>{supervisorRole}</Text>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.loginButton}
                onPress={handleSupervisorLogin}
              >
                <Ionicons name="person" size={16} color="#FFFFFF" />
                <Text style={styles.loginButtonText}>Supervisor Login</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles.headerStats}>
          <Text style={styles.headerStatsText}>
            {counts.total} alerts • {counts.active} active • Updated {formatLastUpdated(lastUpdated)}
            {isLoggedIn && " • Supervisor Mode Active"}
          </Text>
        </View>
      </View>

      {/* Search and Filter Bar */}
      <View style={styles.controlsContainer}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search alerts, locations, routes..."
            placeholderTextColor={Colors.text.secondary}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        
        <View style={styles.controlButtons}>
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

      {/* Quick Type Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickFilters}>
        {ALERT_TYPES.map(type => (
          <TouchableOpacity
            key={type.key}
            style={[
              styles.quickFilterButton,
              selectedType === type.key && styles.quickFilterButtonActive
            ]}
            onPress={() => setSelectedType(type.key)}
          >
            <Text style={styles.quickFilterEmoji}>{type.icon}</Text>
            <Text style={[
              styles.quickFilterText,
              selectedType === type.key && styles.quickFilterTextActive
            ]}>
              {type.label}
            </Text>
            <Text style={[
              styles.quickFilterCount,
              selectedType === type.key && styles.quickFilterCountActive
            ]}>
              {type.key === 'all' ? counts.total : counts[type.key] || 0}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Enhanced Alerts List */}
      <FlatList
        data={filteredAndSortedAlerts}
        keyExtractor={(item, index) => item.id || `alert_${index}`}
        renderItem={({ item, index }) => (
          <View style={styles.alertWrapper}>
            <SimpleTrafficCard 
              alert={item} 
              supervisorSession={supervisorSession}
              onDismiss={handleAlertDismiss}
              onAcknowledge={handleAlertAcknowledge}
              onAddToDatabase={handleAddToDatabase}
            />
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshAlerts}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
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

      {/* Supervisor Login Modal */}
      <SupervisorLogin 
        visible={showSupervisorLogin}
        onClose={() => setShowSupervisorLogin(false)}
      />

      {/* Create Roadwork Modal */}
      <CreateRoadworkModal
        visible={showCreateRoadworkModal}
        onClose={() => {
          setShowCreateRoadworkModal(false);
          setSelectedAlertForRoadwork(null);
        }}
        supervisorData={{ 
          id: supervisorSession?.sessionId, 
          name: supervisorName, 
          email: supervisorRole 
        }}
        onRoadworkCreated={(newRoadwork) => {
          console.log('Roadwork created from alert:', newRoadwork);
          setShowCreateRoadworkModal(false);
          setSelectedAlertForRoadwork(null);
          Alert.alert('Success', 'Traffic alert converted to roadwork entry successfully!');
        }}
        prefillData={selectedAlertForRoadwork ? {
          title: selectedAlertForRoadwork.title || 'Traffic Alert',
          description: selectedAlertForRoadwork.description || '',
          location: selectedAlertForRoadwork.location || '',
          affectedRoutes: selectedAlertForRoadwork.affectsRoutes || [],
          priority: selectedAlertForRoadwork.severity?.toLowerCase() || 'medium',
          type: 'incident'
        } : null}
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
                    { backgroundColor: selectedStatus === status.key ? status.color : Colors.lightGrey }
                  ]}
                  onPress={() => setSelectedStatus(status.key)}
                >
                  <Text style={[
                    styles.modalFilterButtonText,
                    { color: selectedStatus === status.key ? Colors.white : Colors.text.primary }
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
    backgroundColor: Colors.background,
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
    color: Colors.text.primary,
    fontWeight: '600',
  },
  loadingSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  debugText: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.warning,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.error,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  supervisorStatus: {
    alignItems: 'flex-end',
  },
  supervisorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  supervisorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  supervisorRole: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  headerStats: {
    marginTop: 8,
  },
  headerStatsText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  controlsContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: Colors.backgrounds.section,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    color: Colors.text.primary,
  },
  controlButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  controlButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  activeFilterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.warning,
    marginLeft: 6,
  },
  quickFilters: {
    backgroundColor: Colors.white,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  quickFilterButton: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: Colors.backgrounds.section,
    minWidth: 80,
  },
  quickFilterButtonActive: {
    backgroundColor: Colors.primary,
  },
  quickFilterEmoji: {
    fontSize: 16,
    marginBottom: 4,
  },
  quickFilterText: {
    fontSize: 12,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  quickFilterTextActive: {
    color: Colors.white,
  },
  quickFilterCount: {
    fontSize: 10,
    color: Colors.text.secondary,
    fontWeight: 'bold',
    marginTop: 2,
  },
  quickFilterCountActive: {
    color: Colors.white,
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
    color: Colors.text.primary,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
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
    backgroundColor: Colors.lightGrey,
  },
  modalFilterButtonActive: {
    backgroundColor: Colors.primary,
  },
  modalFilterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  modalFilterButtonTextActive: {
    color: Colors.white,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  modalOptionActive: {
    backgroundColor: Colors.backgrounds.highlight,
  },
  modalOptionText: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  modalOptionTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  modalOptionCheck: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalResetButton: {
    flex: 1,
    backgroundColor: Colors.backgrounds.section,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalResetButtonText: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  modalApplyButton: {
    flex: 2,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalApplyButtonText: {
    fontSize: 16,
    color: Colors.white,
    fontWeight: '600',
  },
  modalCloseButton: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: Colors.white,
    fontWeight: '600',
  },
});
