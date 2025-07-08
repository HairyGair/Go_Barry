// Go_BARRY/components/StreetManagerDashboard.jsx
// StreetManager Integration Dashboard - Connects to backend /api/streetmanager/* endpoints
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../config/api';

const { width } = Dimensions.get('window');

const StreetManagerDashboard = ({ baseUrl }) => {
  const [activities, setActivities] = useState([]);
  const [permits, setPermits] = useState([]);
  const [combinedData, setCombinedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');
  const [status, setStatus] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch StreetManager data using correct backend endpoints
  const fetchStreetManagerData = async () => {
    try {
      setLoading(true);

      const [activitiesResponse, permitsResponse, statusResponse, combinedResponse] = await Promise.all([
        apiRequest('/api/streetmanager/activities'),
        apiRequest('/api/streetmanager/permits'),
        apiRequest('/api/streetmanager/status'),
        apiRequest('/api/streetmanager/all')
      ]);

      if (activitiesResponse.success) {
        setActivities(activitiesResponse.activities || []);
      }

      if (permitsResponse.success) {
        setPermits(permitsResponse.permits || []);
      }

      if (statusResponse.success) {
        setStatus(statusResponse.status);
      }

      if (combinedResponse.success) {
        setCombinedData(combinedResponse.alerts || []);
      }

      console.log('✅ StreetManager data loaded successfully');

    } catch (error) {
      console.error('❌ StreetManager data fetch error:', error);
      Alert.alert('Error', 'Failed to fetch StreetManager data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStreetManagerData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchStreetManagerData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStreetManagerData();
  };

  const getWorkType = (workType) => {
    const types = {
      'major': { color: '#DC2626', icon: 'construct' },
      'standard': { color: '#F59E0B', icon: 'build' },
      'minor': { color: '#10B981', icon: 'hammer' },
      'emergency': { color: '#7C2D12', icon: 'warning' },
      'planned': { color: '#3B82F6', icon: 'calendar' }
    };
    
    return types[workType?.toLowerCase()] || { color: '#6B7280', icon: 'information-circle' };
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'in_progress': return '#F59E0B';
      case 'completed': return '#10B981';
      case 'planned': return '#3B82F6';
      case 'cancelled': return '#6B7280';
      case 'proposed': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const RoadworkCard = ({ item, type }) => {
    const workTypeInfo = getWorkType(item.work_type || item.type);
    const statusColor = getStatusColor(item.status || item.activity_status);

    return (
      <TouchableOpacity
        style={[styles.roadworkCard, { borderLeftColor: workTypeInfo.color }]}
        onPress={() => {
          setSelectedItem({ ...item, dataType: type });
          setShowDetailModal(true);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <Ionicons 
              name={workTypeInfo.icon} 
              size={20} 
              color={workTypeInfo.color} 
            />
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.description || item.activity_name || item.title || 'Unnamed Work'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>
              {(item.status || item.activity_status || 'Unknown').toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.locationRow}>
          <Ionicons name="location" size={16} color="#6B7280" />
          <Text style={styles.locationText} numberOfLines={2}>
            {item.street_name || item.location || item.road_name || 'Location not specified'}
          </Text>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Start:</Text>
            <Text style={styles.detailValue}>
              {formatDate(item.start_date || item.proposed_start_date)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>End:</Text>
            <Text style={styles.detailValue}>
              {formatDate(item.end_date || item.proposed_end_date)}
            </Text>
          </View>
          {item.permit_reference && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Permit:</Text>
              <Text style={styles.detailValue}>{item.permit_reference}</Text>
            </View>
          )}
        </View>

        {item.work_type && (
          <View style={[styles.typeBadge, { backgroundColor: `${workTypeInfo.color}15` }]}>
            <Text style={[styles.typeText, { color: workTypeInfo.color }]}>
              {item.work_type.toUpperCase()}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const StatusCard = ({ title, value, subtitle, color = '#3B82F6', icon }) => (
    <View style={[styles.statusCard, { borderTopColor: color }]}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={styles.statusValue}>{value}</Text>
      <Text style={styles.statusTitle}>{title}</Text>
      {subtitle && <Text style={styles.statusSubtitle}>{subtitle}</Text>}
    </View>
  );

  const getDisplayData = () => {
    switch (selectedTab) {
      case 'activities':
        return activities;
      case 'permits':
        return permits;
      case 'all':
      default:
        return combinedData;
    }
  };

  const DetailModal = () => {
    if (!selectedItem) return null;

    return (
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedItem.dataType === 'activities' ? 'Activity' : 'Permit'} Details
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalItemTitle}>
              {selectedItem.description || selectedItem.activity_name || selectedItem.title}
            </Text>

            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>📍 Location</Text>
              <Text style={styles.sectionContent}>
                {selectedItem.street_name || selectedItem.location || selectedItem.road_name}
              </Text>
              {selectedItem.town && (
                <Text style={styles.sectionContent}>{selectedItem.town}</Text>
              )}
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>📅 Timeline</Text>
              <View style={styles.timelineRow}>
                <Text style={styles.timelineLabel}>Start:</Text>
                <Text style={styles.timelineValue}>
                  {formatDateTime(selectedItem.start_date || selectedItem.proposed_start_date)}
                </Text>
              </View>
              <View style={styles.timelineRow}>
                <Text style={styles.timelineLabel}>End:</Text>
                <Text style={styles.timelineValue}>
                  {formatDateTime(selectedItem.end_date || selectedItem.proposed_end_date)}
                </Text>
              </View>
            </View>

            {selectedItem.promoter_organisation && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>🏢 Organization</Text>
                <Text style={styles.sectionContent}>{selectedItem.promoter_organisation}</Text>
              </View>
            )}

            {selectedItem.work_type && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>🔧 Work Type</Text>
                <Text style={styles.sectionContent}>{selectedItem.work_type}</Text>
              </View>
            )}

            {selectedItem.permit_reference && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>📋 Reference</Text>
                <Text style={styles.sectionContent}>{selectedItem.permit_reference}</Text>
              </View>
            )}

            {(selectedItem.coordinates?.lat && selectedItem.coordinates?.lng) && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>🗺️ Coordinates</Text>
                <Text style={styles.sectionContent}>
                  {selectedItem.coordinates.lat.toFixed(6)}, {selectedItem.coordinates.lng.toFixed(6)}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading StreetManager data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>StreetManager Integration</Text>
          <Text style={styles.subtitle}>Official UK roadworks and activities</Text>
        </View>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={handleRefresh}
          disabled={refreshing}
        >
          <Ionicons 
            name="refresh" 
            size={20} 
            color="#FFFFFF" 
            style={refreshing ? styles.spinning : null}
          />
        </TouchableOpacity>
      </View>

      {/* Status Overview */}
      {status && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusContainer}>
          <StatusCard
            title="Activities"
            value={status.activitiesCount || activities.length}
            subtitle="current"
            color="#F59E0B"
            icon="construct-outline"
          />
          <StatusCard
            title="Permits"
            value={status.permitsCount || permits.length}
            subtitle="active"
            color="#3B82F6"
            icon="document-text-outline"
          />
          <StatusCard
            title="Webhook"
            value={status.webhookConnected ? 'Connected' : 'Offline'}
            subtitle="status"
            color={status.webhookConnected ? '#10B981' : '#DC2626'}
            icon={status.webhookConnected ? 'checkmark-circle-outline' : 'alert-circle-outline'}
          />
          <StatusCard
            title="Last Update"
            value={status.lastUpdated ? new Date(status.lastUpdated).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'Never'}
            subtitle="time"
            color="#6B7280"
            icon="time-outline"
          />
        </ScrollView>
      )}

      {/* Tab Selection */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'all' && styles.tabActive]}
          onPress={() => setSelectedTab('all')}
        >
          <Text style={[styles.tabText, selectedTab === 'all' && styles.tabTextActive]}>
            All ({combinedData.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'activities' && styles.tabActive]}
          onPress={() => setSelectedTab('activities')}
        >
          <Text style={[styles.tabText, selectedTab === 'activities' && styles.tabTextActive]}>
            Activities ({activities.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'permits' && styles.tabActive]}
          onPress={() => setSelectedTab('permits')}
        >
          <Text style={[styles.tabText, selectedTab === 'permits' && styles.tabTextActive]}>
            Permits ({permits.length})
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Data List */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {getDisplayData().length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="construct-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Roadworks Data</Text>
            <Text style={styles.emptySubtitle}>
              {selectedTab === 'all' ? 'No activities or permits found' :
               selectedTab === 'activities' ? 'No current activities' :
               'No active permits'}
            </Text>
          </View>
        ) : (
          getDisplayData().map((item, index) => (
            <RoadworkCard 
              key={item.id || item.permit_reference || index} 
              item={item} 
              type={selectedTab}
            />
          ))
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Data provided by StreetManager API • Updated every 5 minutes
          </Text>
        </View>
      </ScrollView>

      <DetailModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  refreshButton: {
    backgroundColor: '#3B82F6',
    padding: 10,
    borderRadius: 8,
  },
  spinning: {
    transform: [{ rotate: '360deg' }],
  },
  statusContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 120,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    borderTopWidth: 4,
    minWidth: 100,
    alignItems: 'center',
  },
  statusValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  statusTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  statusSubtitle: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  tabContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
    maxHeight: 50,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  tabActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  roadworkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
    flex: 1,
  },
  cardDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '600',
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  typeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalItemTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
    lineHeight: 28,
  },
  detailSection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  timelineLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  timelineValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
});

export default StreetManagerDashboard;