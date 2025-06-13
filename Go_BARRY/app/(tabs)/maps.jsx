// Go_BARRY/app/(tabs)/maps.jsx
// Browser-First Traffic Intelligence Dashboard
// Optimized for supervisor workstations - no maps dependency

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  ScrollView,
  Platform,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBarryAPI } from '../../components/hooks/useBARRYapi';
import { API_CONFIG, ENV_INFO } from '../../config/api';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

// Simple Alert Details Component (replacement for EnhancedTrafficCard)
const SimpleAlertDetails = ({ alert }) => {
  if (!alert) return null;

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'High': return '#EF4444';
      case 'Medium': return '#F59E0B';
      case 'Low': return '#10B981';
      default: return '#6B7280';
    }
  };

  return (
    <View style={styles.alertDetails}>
      <View style={styles.alertDetailsHeader}>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(alert.severity) }]}>
          <Text style={styles.severityText}>{alert.severity}</Text>
        </View>
        <Text style={styles.alertType}>{alert.type?.toUpperCase()}</Text>
      </View>
      
      <Text style={styles.alertDetailsTitle}>{alert.title}</Text>
      <Text style={styles.alertDetailsLocation}>📍 {alert.location}</Text>
      
      {alert.description && (
        <Text style={styles.alertDetailsDescription}>{alert.description}</Text>
      )}
      
      {alert.affectsRoutes && alert.affectsRoutes.length > 0 && (
        <View style={styles.affectedRoutes}>
          <Text style={styles.routesLabel}>Affected Routes:</Text>
          <View style={styles.routesList}>
            {alert.affectsRoutes.map((route, idx) => (
              <View key={idx} style={styles.routeBadge}>
                <Text style={styles.routeText}>{route}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      
      <View style={styles.alertTimestamp}>
        <Ionicons name="time" size={16} color="#6B7280" />
        <Text style={styles.timestampText}>
          {alert.timestamp ? 
            new Date(alert.timestamp).toLocaleString('en-GB') : 
            'Recent alert'
          }
        </Text>
      </View>
    </View>
  );
};

// Enhanced browser-first interface for traffic intelligence
export default function TrafficIntelligenceScreen() {
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // grid, list, summary
  const [sortBy, setSortBy] = useState('priority'); // priority, time, location
  
  // Use existing BARRY API hook with centralized config
  const {
    alerts,
    loading,
    lastUpdated,
    refreshAlerts,
    isRefreshing
  } = useBarryAPI({
    autoRefresh: true,
    refreshInterval: API_CONFIG.refreshIntervals.operational
  });

  // Enhanced filtering and sorting for supervisor workflow
  const processedAlerts = useMemo(() => {
    if (!alerts || alerts.length === 0) return [];
    
    // Apply filters
    let filtered = alerts;
    if (filterType !== 'all') {
      filtered = alerts.filter(alert => alert.type === filterType);
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
          return (priorityOrder[b.severity] || 0) - (priorityOrder[a.severity] || 0);
        case 'time':
          return new Date(b.timestamp || b.created) - new Date(a.timestamp || a.created);
        case 'location':
          return (a.location || '').localeCompare(b.location || '');
        default:
          return 0;
      }
    });
    
    return sorted;
  }, [alerts, filterType, sortBy]);

  const handleAlertPress = (alert) => {
    console.log('🚨 Alert selected:', alert.title);
    setSelectedAlert(alert);
    setShowDetails(true);
  };

  const getFilterCounts = () => {
    if (!alerts) return { all: 0, incident: 0, congestion: 0, roadwork: 0 };
    
    return {
      all: alerts.length,
      incident: alerts.filter(a => a.type === 'incident').length,
      congestion: alerts.filter(a => a.type === 'congestion').length,
      roadwork: alerts.filter(a => a.type === 'roadwork').length
    };
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'High': return '#EF4444';
      case 'Medium': return '#F59E0B';
      case 'Low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'incident': return 'alert-circle';
      case 'congestion': return 'car';
      case 'roadwork': return 'construct';
      default: return 'information-circle';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'incident': return '#DC2626';
      case 'congestion': return '#F97316';
      case 'roadwork': return '#2563EB';
      default: return '#6B7280';
    }
  };

  const counts = getFilterCounts();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading traffic intelligence...</Text>
          <Text style={styles.environmentText}>
            {ENV_INFO.isDevelopment ? '🔧 Development' : '🚀 Production'} • {ENV_INFO.apiBaseUrl}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderGridView = () => (
    <ScrollView 
      style={styles.contentContainer}
      contentContainerStyle={styles.gridContainer}
      showsVerticalScrollIndicator={false}
    >
      {processedAlerts.map((alert, index) => (
        <TouchableOpacity
          key={alert.id || `alert_${index}`}
          style={styles.gridCard}
          onPress={() => handleAlertPress(alert)}
        >
          <View style={styles.gridCardHeader}>
            <View style={styles.typeContainer}>
              <Ionicons 
                name={getTypeIcon(alert.type)} 
                size={20} 
                color={getTypeColor(alert.type)} 
              />
              <Text style={[styles.typeText, { color: getTypeColor(alert.type) }]}>
                {alert.type?.toUpperCase()}
              </Text>
            </View>
            <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(alert.severity) }]}>
              <Text style={styles.severityText}>{alert.severity}</Text>
            </View>
          </View>
          
          <Text style={styles.gridCardTitle} numberOfLines={2}>
            {alert.title}
          </Text>
          
          <Text style={styles.gridCardLocation} numberOfLines={1}>
            📍 {alert.location}
          </Text>
          
          <View style={styles.gridCardFooter}>
            <Text style={styles.gridCardTime}>
              {alert.timestamp ? 
                new Date(alert.timestamp).toLocaleTimeString('en-GB', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }) : 
                'Recent'
              }
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </View>
        </TouchableOpacity>
      ))}
      
      {processedAlerts.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle" size={64} color="#10B981" />
          <Text style={styles.emptyStateTitle}>No Active Alerts</Text>
          <Text style={styles.emptyStateText}>
            {filterType === 'all' 
              ? 'All systems operational in North East England'
              : `No ${filterType} alerts at this time`
            }
          </Text>
        </View>
      )}
    </ScrollView>
  );

  const renderListView = () => (
    <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {processedAlerts.map((alert, index) => (
        <TouchableOpacity
          key={alert.id || `alert_${index}`}
          style={styles.listCard}
          onPress={() => handleAlertPress(alert)}
        >
          <View style={styles.listCardContent}>
            <View style={styles.listCardLeft}>
              <View style={styles.listIconContainer}>
                <Ionicons 
                  name={getTypeIcon(alert.type)} 
                  size={24} 
                  color={getTypeColor(alert.type)} 
                />
              </View>
              <View style={styles.listCardInfo}>
                <Text style={styles.listCardTitle} numberOfLines={1}>
                  {alert.title}
                </Text>
                <Text style={styles.listCardLocation} numberOfLines={1}>
                  📍 {alert.location}
                </Text>
                <Text style={styles.listCardTime}>
                  {alert.timestamp ? 
                    new Date(alert.timestamp).toLocaleString('en-GB', { 
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit', 
                      minute: '2-digit' 
                    }) : 
                    'Recent'
                  }
                </Text>
              </View>
            </View>
            <View style={styles.listCardRight}>
              <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(alert.severity) }]}>
                <Text style={styles.severityText}>{alert.severity}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderSummaryView = () => (
    <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.summaryContainer}>
        {/* Summary Stats */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{counts.incident}</Text>
            <Text style={styles.summaryLabel}>Active Incidents</Text>
            <Ionicons name="alert-circle" size={32} color="#DC2626" />
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{counts.congestion}</Text>
            <Text style={styles.summaryLabel}>Traffic Issues</Text>
            <Ionicons name="car" size={32} color="#F97316" />
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{counts.roadwork}</Text>
            <Text style={styles.summaryLabel}>Roadworks</Text>
            <Ionicons name="construct" size={32} color="#2563EB" />
          </View>
        </View>
        
        {/* Recent Critical Alerts */}
        <View style={styles.criticalSection}>
          <Text style={styles.sectionTitle}>🚨 Critical Alerts</Text>
          {processedAlerts
            .filter(alert => alert.severity === 'High')
            .slice(0, 3)
            .map((alert, index) => (
              <TouchableOpacity
                key={`critical_${index}`}
                style={styles.criticalCard}
                onPress={() => handleAlertPress(alert)}
              >
                <View style={styles.criticalHeader}>
                  <Ionicons 
                    name={getTypeIcon(alert.type)} 
                    size={20} 
                    color={getTypeColor(alert.type)} 
                  />
                  <Text style={styles.criticalTitle}>{alert.title}</Text>
                </View>
                <Text style={styles.criticalLocation}>📍 {alert.location}</Text>
              </TouchableOpacity>
            ))
          }
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerEmoji}>🚦</Text>
            <Text style={styles.headerTitle}>BARRY Traffic Intelligence</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            {processedAlerts.length} alerts • North East England
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={refreshAlerts}
          disabled={isRefreshing}
        >
          <Ionicons 
            name="refresh" 
            size={24} 
            color={isRefreshing ? "#9CA3AF" : "#3B82F6"} 
          />
        </TouchableOpacity>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        {/* Filter Buttons */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow}>
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'all' && styles.filterButtonActive]}
            onPress={() => setFilterType('all')}
          >
            <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>
              All ({counts.all})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'incident' && styles.filterButtonActive]}
            onPress={() => setFilterType('incident')}
          >
            <Text style={[styles.filterText, filterType === 'incident' && styles.filterTextActive]}>
              🚨 Incidents ({counts.incident})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'congestion' && styles.filterButtonActive]}
            onPress={() => setFilterType('congestion')}
          >
            <Text style={[styles.filterText, filterType === 'congestion' && styles.filterTextActive]}>
              🚗 Traffic ({counts.congestion})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'roadwork' && styles.filterButtonActive]}
            onPress={() => setFilterType('roadwork')}
          >
            <Text style={[styles.filterText, filterType === 'roadwork' && styles.filterTextActive]}>
              🚧 Roadworks ({counts.roadwork})
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* View Mode & Sort Controls */}
        <View style={styles.viewControls}>
          <View style={styles.viewModeButtons}>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'summary' && styles.viewButtonActive]}
              onPress={() => setViewMode('summary')}
            >
              <Ionicons name="stats-chart" size={20} color={viewMode === 'summary' ? '#FFFFFF' : '#6B7280'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'grid' && styles.viewButtonActive]}
              onPress={() => setViewMode('grid')}
            >
              <Ionicons name="grid" size={20} color={viewMode === 'grid' ? '#FFFFFF' : '#6B7280'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'list' && styles.viewButtonActive]}
              onPress={() => setViewMode('list')}
            >
              <Ionicons name="list" size={20} color={viewMode === 'list' ? '#FFFFFF' : '#6B7280'} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => {
              const nextSort = sortBy === 'priority' ? 'time' : sortBy === 'time' ? 'location' : 'priority';
              setSortBy(nextSort);
            }}
          >
            <Ionicons name="funnel" size={16} color="#6B7280" />
            <Text style={styles.sortText}>
              {sortBy === 'priority' ? 'Priority' : sortBy === 'time' ? 'Time' : 'Location'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {viewMode === 'grid' && renderGridView()}
      {viewMode === 'list' && renderListView()}
      {viewMode === 'summary' && renderSummaryView()}

      {/* Status Bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          {ENV_INFO.isDevelopment ? '🔧 Development' : '🚀 Production'} • 
          {lastUpdated && ` Updated: ${new Date(lastUpdated).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit'
          })}`}
        </Text>
      </View>

      {/* Alert Details Modal */}
      <Modal
        visible={showDetails && selectedAlert}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Alert Details</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowDetails(false)}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {selectedAlert && (
              <ScrollView style={styles.modalBody}>
                <SimpleAlertDetails alert={selectedAlert} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    color: '#1F2937',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '600',
  },
  environmentText: {
    color: '#3B82F6',
    fontSize: 12,
    marginTop: 8,
    fontFamily: 'monospace',
  },
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  headerEmoji: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  controlsContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filtersRow: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  filterButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  viewControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  viewModeButtons: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  viewButtonActive: {
    backgroundColor: '#3B82F6',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  sortText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
  },
  gridContainer: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: isWeb ? (width > 768 ? '32%' : '48%') : '48%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  gridCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  gridCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 20,
  },
  gridCardLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  gridCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridCardTime: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  listCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  listCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  listIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listCardInfo: {
    flex: 1,
  },
  listCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  listCardLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  listCardTime: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },
  listCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryContainer: {
    padding: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  criticalSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  criticalCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  criticalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  criticalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  criticalLocation: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 24,
  },
  statusBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'monospace',
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalBody: {
    padding: 20,
  },
  
  // Alert Details Component Styles
  alertDetails: {
    backgroundColor: '#FFFFFF',
  },
  alertDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 1,
  },
  alertDetailsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 24,
  },
  alertDetailsLocation: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
    marginBottom: 12,
  },
  alertDetailsDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 16,
  },
  affectedRoutes: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  routesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    letterSpacing: 1,
  },
  routesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  routeBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  routeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  alertTimestamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  timestampText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
});
