// Go_BARRY/components/admin/UnifiedRoadworksManager.jsx
// Comprehensive roadworks management interface

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const API_BASE = 'https://go-barry.onrender.com';

const UnifiedRoadworksManager = ({ supervisorToken }) => {
  const [roadworks, setRoadworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sourcesStatus, setSourcesStatus] = useState({});
  const [stats, setStats] = useState({});
  
  // Modal states
  const [selectedRoadwork, setSelectedRoadwork] = useState(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionType, setActionType] = useState(''); // dismiss, acknowledge, save
  const [actionNote, setActionNote] = useState('');

  const sources = [
    { value: 'all', label: 'All Sources', icon: '🔄' },
    { value: 'street_manager', label: 'Street Manager', icon: '🏛️' },
    { value: 'durham_council', label: 'Durham Council', icon: '🏢' },
    { value: 'manual', label: 'Manual Entry', icon: '✍️' }
  ];

  const statuses = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'planned', label: 'Planned' },
    { value: 'completed', label: 'Completed' }
  ];

  useEffect(() => {
    loadRoadworks();
    loadSourcesStatus();
    loadStats();
  }, [selectedSource, selectedStatus]);

  const loadRoadworks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        source: selectedSource,
        status: selectedStatus,
        limit: '100'
      });

      if (searchQuery) {
        params.append('query', searchQuery);
      }

      const response = await fetch(`${API_BASE}/api/roadworks/unified?${params}`);
      const data = await response.json();

      if (data.success) {
        setRoadworks(data.roadworks || []);
        console.log('✅ Loaded roadworks:', data.roadworks?.length || 0);
      } else {
        console.error('❌ Failed to load roadworks:', data.error);
      }
    } catch (error) {
      console.error('❌ Error loading roadworks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSourcesStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/roadworks/sources`);
      const data = await response.json();

      if (data.success) {
        setSourcesStatus(data.sources || {});
      }
    } catch (error) {
      console.error('❌ Error loading sources status:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/roadworks/stats?timeframe=7d`);
      const data = await response.json();

      if (data.success) {
        setStats(data.stats || {});
      }
    } catch (error) {
      console.error('❌ Error loading stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Force refresh the backend data
      await fetch(`${API_BASE}/api/roadworks/refresh`, { method: 'POST' });
      await loadRoadworks();
      await loadSourcesStatus();
      await loadStats();
    } catch (error) {
      console.error('❌ Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRoadworkAction = async (roadwork, action) => {
    setSelectedRoadwork(roadwork);
    setActionType(action);
    setActionNote('');
    setActionModalVisible(true);
  };

  const executeAction = async () => {
    if (!selectedRoadwork || !actionType) return;

    try {
      const endpoint = `${API_BASE}/api/roadworks/${selectedRoadwork.id}/${actionType}`;
      const body = {
        supervisorToken,
        [actionType === 'dismiss' ? 'reason' : actionType === 'acknowledge' ? 'note' : 'notes']: actionNote
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', `Roadwork ${actionType}ed successfully`);
        setActionModalVisible(false);
        await loadRoadworks();
        await loadStats();
      } else {
        Alert.alert('Error', data.error || `Failed to ${actionType} roadwork`);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to ${actionType} roadwork`);
      console.error(`❌ Error ${actionType}ing roadwork:`, error);
    }
  };

  const getSourceIcon = (source) => {
    const sourceMap = {
      street_manager: '🏛️',
      durham_council: '🏢',
      manual: '✍️'
    };
    return sourceMap[source] || '📋';
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading roadworks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Stats */}
      <View style={styles.header}>
        <Text style={styles.title}>Unified Roadworks Manager</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{roadworks.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.dismissals || 0}</Text>
            <Text style={styles.statLabel}>Dismissed (7d)</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.acknowledgments || 0}</Text>
            <Text style={styles.statLabel}>Acknowledged (7d)</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.saves || 0}</Text>
            <Text style={styles.statLabel}>Saved (7d)</Text>
          </View>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search roadworks..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={loadRoadworks}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabs}>
          {sources.map(source => (
            <TouchableOpacity
              key={source.value}
              style={[styles.filterTab, selectedSource === source.value && styles.filterTabActive]}
              onPress={() => setSelectedSource(source.value)}
            >
              <Text style={styles.filterTabIcon}>{source.icon}</Text>
              <Text style={[styles.filterTabText, selectedSource === source.value && styles.filterTabTextActive]}>
                {source.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabs}>
          {statuses.map(status => (
            <TouchableOpacity
              key={status.value}
              style={[styles.statusTab, selectedStatus === status.value && styles.statusTabActive]}
              onPress={() => setSelectedStatus(status.value)}
            >
              <Text style={[styles.statusTabText, selectedStatus === status.value && styles.statusTabTextActive]}>
                {status.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Sources Status */}
      <View style={styles.sourcesStatus}>
        {Object.entries(sourcesStatus).map(([source, status]) => (
          <View key={source} style={styles.sourceStatus}>
            <Text style={styles.sourceIcon}>{getSourceIcon(source)}</Text>
            <Text style={styles.sourceName}>{source.replace('_', ' ')}</Text>
            <View style={[styles.sourceIndicator, { backgroundColor: status.success ? '#10B981' : '#EF4444' }]} />
            <Text style={styles.sourceCount}>{status.count || 0}</Text>
          </View>
        ))}
      </View>

      {/* Roadworks List */}
      <ScrollView 
        style={styles.roadworksList} 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {roadworks.map((roadwork) => (
          <View key={roadwork.id} style={styles.roadworkItem}>
            <View style={styles.roadworkHeader}>
              <View style={styles.roadworkMeta}>
                <Text style={styles.sourceIcon}>{getSourceIcon(roadwork.source)}</Text>
                <Text style={styles.roadworkSource}>{roadwork.source.replace('_', ' ')}</Text>
                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(roadwork.severity) }]}>
                  <Text style={styles.severityText}>{roadwork.severity}</Text>
                </View>
              </View>
              <Text style={styles.roadworkDate}>{formatDate(roadwork.startDate)}</Text>
            </View>

            <Text style={styles.roadworkTitle}>{roadwork.title}</Text>
            <Text style={styles.roadworkLocation}>📍 {roadwork.location}</Text>
            
            {roadwork.description && (
              <Text style={styles.roadworkDescription} numberOfLines={2}>
                {roadwork.description}
              </Text>
            )}

            <View style={styles.roadworkFooter}>
              <View style={styles.roadworkInfo}>
                <Text style={styles.promoter}>{roadwork.promoter}</Text>
                <Text style={styles.authority}>{roadwork.authority}</Text>
              </View>

              <View style={styles.actionButtons}>
                {roadwork.managementActions?.canDismiss && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.dismissButton]}
                    onPress={() => handleRoadworkAction(roadwork, 'dismiss')}
                  >
                    <Ionicons name="close" size={16} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Dismiss</Text>
                  </TouchableOpacity>
                )}

                {roadwork.managementActions?.canAcknowledge && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.acknowledgeButton]}
                    onPress={() => handleRoadworkAction(roadwork, 'acknowledge')}
                  >
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>ACK</Text>
                  </TouchableOpacity>
                )}

                {roadwork.managementActions?.canSave && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.saveButton]}
                    onPress={() => handleRoadworkAction(roadwork, 'save')}
                  >
                    <Ionicons name="bookmark" size={16} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Save</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        ))}

        {roadworks.length === 0 && (
          <View style={styles.noRoadworks}>
            <Ionicons name="construct" size={48} color="#E5E7EB" />
            <Text style={styles.noRoadworksText}>No roadworks found</Text>
            <Text style={styles.noRoadworksSubtext}>Try adjusting your filters</Text>
          </View>
        )}
      </ScrollView>

      {/* Action Modal */}
      <Modal
        visible={actionModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {actionType.charAt(0).toUpperCase() + actionType.slice(1)} Roadwork
            </Text>
            
            <Text style={styles.modalSubtitle}>
              {selectedRoadwork?.title}
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder={
                actionType === 'dismiss' ? 'Reason for dismissal...' :
                actionType === 'acknowledge' ? 'Acknowledgment note...' :
                'Save notes...'
              }
              value={actionNote}
              onChangeText={setActionNote}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setActionModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={executeAction}
              >
                <Text style={styles.confirmButtonText}>
                  {actionType.charAt(0).toUpperCase() + actionType.slice(1)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1F2937',
  },
  filterTabs: {
    flexDirection: 'row',
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: '#3B82F6',
  },
  filterTabIcon: {
    fontSize: 14,
  },
  filterTabText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  statusTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  statusTabActive: {
    backgroundColor: '#10B981',
  },
  statusTabText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusTabTextActive: {
    color: '#FFFFFF',
  },
  sourcesStatus: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sourceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sourceIcon: {
    fontSize: 16,
  },
  sourceName: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  sourceIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sourceCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  roadworksList: {
    flex: 1,
    padding: 16,
  },
  roadworkItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  roadworkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roadworkMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roadworkSource: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  roadworkDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  roadworkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  roadworkLocation: {
    fontSize: 14,
    color: '#3B82F6',
    marginBottom: 8,
  },
  roadworkDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  roadworkFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  roadworkInfo: {
    flex: 1,
  },
  promoter: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  authority: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  dismissButton: {
    backgroundColor: '#EF4444',
  },
  acknowledgeButton: {
    backgroundColor: '#10B981',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
  },
  actionButtonText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  noRoadworks: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  noRoadworksText: {
    marginTop: 12,
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '500',
  },
  noRoadworksSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  confirmButton: {
    backgroundColor: '#3B82F6',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default UnifiedRoadworksManager;