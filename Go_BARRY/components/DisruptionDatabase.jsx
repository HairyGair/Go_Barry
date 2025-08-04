import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Platform,
  Modal,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSupervisor } from './hooks/useSupervisorSession';

const DisruptionDatabase = ({ onClose }) => {
  const { supervisorName, supervisorSession, logActivity } = useSupervisor();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [disruptions, setDisruptions] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedDisruption, setSelectedDisruption] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [reactivationReason, setReactivationReason] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // active, ended, all
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch disruptions from API
  const fetchDisruptions = async () => {
    try {
      const baseUrl = process.env.NODE_ENV === 'development' ? '' : 'https://go-barry.onrender.com';
      
      // Fetch active disruptions
      const activeResponse = await fetch(`${baseUrl}/api/disruptions/active`);
      const activeData = await activeResponse.json();
      
      // Fetch statistics
      const statsResponse = await fetch(`${baseUrl}/api/disruptions/stats`);
      const statsData = await statsResponse.json();
      
      // Fetch all disruptions for other tabs
      const allResponse = await fetch(`${baseUrl}/api/disruptions/all?limit=100`);
      const allData = await allResponse.json();
      
      if (activeData.success) {
        setDisruptions(allData.disruptions || []);
        setStats(statsData.stats || {});
      }
    } catch (error) {
      console.error('Failed to fetch disruptions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    fetchDisruptions();
    // Refresh every 30 seconds
    const interval = setInterval(fetchDisruptions, 30000);
    return () => clearInterval(interval);
  }, []);
  
  // Filter disruptions by tab and search
  const filteredDisruptions = disruptions.filter(disruption => {
    // Tab filter
    if (activeTab === 'active' && !['Active', 'Reactivated'].includes(disruption.status)) {
      return false;
    }
    if (activeTab === 'ended' && disruption.status !== 'Ended') {
      return false;
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        disruption.location?.toLowerCase().includes(query) ||
        disruption.street_name?.toLowerCase().includes(query) ||
        disruption.affected_routes?.some(route => 
          route.toLowerCase().includes(query)
        )
      );
    }
    
    return true;
  });
  
  // Handle end disruption
  const handleEndDisruption = async (disruption) => {
    try {
      const baseUrl = process.env.NODE_ENV === 'development' ? '' : 'https://go-barry.onrender.com';
      const response = await fetch(`${baseUrl}/api/disruptions/${disruption.id}/end`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endedBy: supervisorSession?.supervisor?.badge || supervisorName,
          endedByName: supervisorName,
          reason: 'Roadworks completed',
          sessionId: supervisorSession?.sessionId
        })
      });
      
      if (response.ok) {
        await fetchDisruptions();
        await logActivity('end_disruption', {
          disruptionId: disruption.id,
          location: disruption.location
        });
      }
    } catch (error) {
      console.error('Failed to end disruption:', error);
    }
  };
  
  // Handle reactivate disruption
  const handleReactivateConfirm = async () => {
    if (!selectedDisruption) return;
    
    try {
      const baseUrl = process.env.NODE_ENV === 'development' ? '' : 'https://go-barry.onrender.com';
      const response = await fetch(`${baseUrl}/api/disruptions/${selectedDisruption.id}/reactivate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reactivatedBy: supervisorSession?.supervisor?.badge || supervisorName,
          reactivatedByName: supervisorName,
          reason: reactivationReason || 'Works resumed',
          sessionId: supervisorSession?.sessionId
        })
      });
      
      if (response.ok) {
        setShowReactivateModal(false);
        setSelectedDisruption(null);
        setReactivationReason('');
        await fetchDisruptions();
        await logActivity('reactivate_disruption', {
          disruptionId: selectedDisruption.id,
          location: selectedDisruption.location,
          reactivationCount: selectedDisruption.reactivation_count + 1
        });
      }
    } catch (error) {
      console.error('Failed to reactivate disruption:', error);
    }
  };
  
  // Format duration
  const formatDuration = (startTime) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 24) {
      const days = Math.floor(diffHours / 24);
      return `${days}d ${diffHours % 24}h`;
    }
    return diffHours > 0 ? `${diffHours}h ${diffMins}m` : `${diffMins}m`;
  };
  
  // Render disruption card
  const DisruptionCard = ({ disruption }) => {
    const isActive = ['Active', 'Reactivated'].includes(disruption.status);
    
    return (
      <TouchableOpacity
        style={[
          styles.disruptionCard,
          isActive && styles.activeCard,
          disruption.status === 'Reactivated' && styles.reactivatedCard
        ]}
        onPress={() => {
          setSelectedDisruption(disruption);
          setShowDetailsModal(true);
        }}
        activeOpacity={0.8}
      >
        {/* Status badge */}
        <View style={styles.statusRow}>
          <View style={[
            styles.statusBadge,
            isActive ? styles.statusBadgeActive : styles.statusBadgeEnded
          ]}>
            <MaterialCommunityIcons 
              name={isActive ? 'alert-circle' : 'check-circle'} 
              size={16} 
              color="#fff" 
            />
            <Text style={styles.statusText}>{disruption.status}</Text>
          </View>
          {disruption.reactivation_count > 0 && (
            <View style={styles.reactivationBadge}>
              <MaterialCommunityIcons name="restart" size={14} color="#f59e0b" />
              <Text style={styles.reactivationText}>
                Reactivated {disruption.reactivation_count}x
              </Text>
            </View>
          )}
        </View>
        
        {/* Location */}
        <Text style={styles.locationText} numberOfLines={2}>
          {disruption.location || disruption.street_name}
        </Text>
        
        {/* Authority */}
        {disruption.highway_authority && (
          <Text style={styles.authorityText} numberOfLines={1}>
            {disruption.highway_authority}
          </Text>
        )}
        
        {/* Affected routes */}
        {disruption.affected_routes && disruption.affected_routes.length > 0 && (
          <View style={styles.routesContainer}>
            <MaterialCommunityIcons name="bus-multiple" size={16} color="#60a5fa" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {disruption.affected_routes.map((route, idx) => (
                <View key={idx} style={styles.routeBadge}>
                  <Text style={styles.routeText}>{route}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
        
        {/* Timing info */}
        <View style={styles.timingRow}>
          <View style={styles.timingItem}>
            <MaterialCommunityIcons name="clock-start" size={14} color="#6b7280" />
            <Text style={styles.timingText}>
              {isActive ? 'Active for' : 'Was active for'} {formatDuration(disruption.escalated_at)}
            </Text>
          </View>
          <Text style={styles.pushedByText}>
            by {disruption.pushed_by_name || disruption.pushed_by}
          </Text>
        </View>
        
        {/* Action buttons */}
        <View style={styles.actionRow}>
          {isActive ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.endButton]}
              onPress={(e) => {
                e.stopPropagation();
                handleEndDisruption(disruption);
              }}
            >
              <MaterialCommunityIcons name="stop-circle" size={16} color="#dc2626" />
              <Text style={[styles.actionButtonText, { color: '#dc2626' }]}>
                End Disruption
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.reactivateButton]}
              onPress={(e) => {
                e.stopPropagation();
                setSelectedDisruption(disruption);
                setShowReactivateModal(true);
              }}
            >
              <MaterialCommunityIcons name="restart" size={16} color="#f59e0b" />
              <Text style={[styles.actionButtonText, { color: '#f59e0b' }]}>
                Reactivate
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Disruption Database</Text>
            <Text style={styles.subtitle}>
              {stats.active || 0} Active • {stats.ended || 0} Ended • {stats.total || 0} Total
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {/* Search bar */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search location or route..."
            placeholderTextColor="#6b7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>
      
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            Active ({stats.active + stats.reactivated || 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ended' && styles.tabActive]}
          onPress={() => setActiveTab('ended')}
        >
          <Text style={[styles.tabText, activeTab === 'ended' && styles.tabTextActive]}>
            Ended ({stats.ended || 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            All ({stats.total || 0})
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading disruptions...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchDisruptions();
              }}
            />
          }
        >
          {filteredDisruptions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="database-off" size={48} color="#6b7280" />
              <Text style={styles.emptyText}>No disruptions found</Text>
            </View>
          ) : (
            <View style={styles.cardsContainer}>
              {filteredDisruptions.map(disruption => (
                <DisruptionCard key={disruption.id} disruption={disruption} />
              ))}
            </View>
          )}
        </ScrollView>
      )}
      
      {/* Reactivate Modal */}
      {showReactivateModal && selectedDisruption && (
        <Modal
          visible={showReactivateModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowReactivateModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Reactivate Disruption</Text>
              
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Location</Text>
                <Text style={styles.modalText}>
                  {selectedDisruption.location || selectedDisruption.street_name}
                </Text>
              </View>
              
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Previous activations</Text>
                <Text style={styles.modalText}>
                  {selectedDisruption.reactivation_count} times
                </Text>
              </View>
              
              <Text style={styles.modalLabel}>Reason for reactivation</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., Works resumed after delay..."
                placeholderTextColor="#6b7280"
                value={reactivationReason}
                onChangeText={setReactivationReason}
                multiline
                numberOfLines={3}
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => {
                    setShowReactivateModal(false);
                    setReactivationReason('');
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonConfirm]}
                  onPress={handleReactivateConfirm}
                >
                  <Text style={[styles.modalButtonText, { color: '#f59e0b' }]}>
                    Reactivate
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#fff',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  tab: {
    marginRight: 24,
    paddingVertical: 4,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  cardsContainer: {
    padding: 20,
    gap: 16,
  },
  disruptionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeCard: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  reactivatedCard: {
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  statusBadgeActive: {
    backgroundColor: '#3b82f6',
  },
  statusBadgeEnded: {
    backgroundColor: '#6b7280',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  reactivationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reactivationText: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '500',
  },
  locationText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  authorityText: {
    fontSize: 14,
    color: '#a78bfa',
    marginBottom: 12,
  },
  routesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  routeBadge: {
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
  },
  routeText: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '600',
  },
  timingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timingText: {
    color: '#6b7280',
    fontSize: 13,
  },
  pushedByText: {
    color: '#6b7280',
    fontSize: 13,
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
  },
  endButton: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderColor: '#dc2626',
  },
  reactivateButton: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: '#f59e0b',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#6b7280',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: '#6b7280',
    marginTop: 12,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1f',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
  },
  modalSection: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 16,
    color: '#fff',
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
    minHeight: 80,
    textAlignVertical: 'top',
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
  modalButtonCancel: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalButtonConfirm: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default DisruptionDatabase;