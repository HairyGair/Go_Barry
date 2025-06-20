import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupervisorSession } from './hooks/useSupervisorSession';
import CreateRoadworkModal from './CreateRoadworkModal';

const RoadworksManager = ({ baseUrl }) => {
  // Get the supervisor session from the existing auth system
  const {
    isLoggedIn,
    supervisorName,
    supervisorRole,
    sessionId,
    isAdmin
  } = useSupervisorSession();

  // State management
  const [roadworks, setRoadworks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRoadwork, setSelectedRoadwork] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    promotedToDisplay: 0,
    activeDiversions: 0,
    pendingTasks: 0
  });

  // Roadworks statuses with colors
  const ROADWORKS_STATUSES = {
    reported: { label: 'Reported', color: '#EF4444', icon: 'alert-circle' },
    assessing: { label: 'Assessing', color: '#F59E0B', icon: 'search' },
    planning: { label: 'Planning', color: '#3B82F6', icon: 'map' },
    approved: { label: 'Approved', color: '#8B5CF6', icon: 'checkmark-circle' },
    active: { label: 'Active', color: '#10B981', icon: 'play-circle' },
    monitoring: { label: 'Monitoring', color: '#06B6D4', icon: 'eye' },
    completed: { label: 'Completed', color: '#6B7280', icon: 'checkmark-done' },
    cancelled: { label: 'Cancelled', color: '#9CA3AF', icon: 'close-circle' }
  };

// Status Change Modal Component
const StatusChangeModal = ({ visible, roadwork, onClose, onConfirm, loading }) => {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [notes, setNotes] = useState('');

  const statusOptions = [
    { value: 'assessing', label: 'Assessing Impact', description: 'Reviewing the impact on our services' },
    { value: 'planning', label: 'Planning Response', description: 'Creating diversion plans and communications' },
    { value: 'approved', label: 'Plans Approved', description: 'Response plans are ready for implementation' },
    { value: 'active', label: 'Monitoring Active', description: 'Roadworks are active, monitoring impact' },
    { value: 'monitoring', label: 'Ongoing Monitoring', description: 'Continuing to monitor and adjust' }
  ];

  const handleConfirm = () => {
    if (!selectedStatus) {
      Alert.alert('Error', 'Please select a status');
      return;
    }
    
    if (!notes.trim()) {
      Alert.alert('Error', 'Please provide notes about the action being taken');
      return;
    }

    onConfirm(roadwork?.id, selectedStatus, notes);
    setSelectedStatus('');
    setNotes('');
    onClose();
  };

  const handleClose = () => {
    setSelectedStatus('');
    setNotes('');
    onClose();
  };

  if (!visible || !roadwork) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Take Action on Roadwork</Text>
            <TouchableOpacity onPress={handleClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.statusModalTitle}>{roadwork.title}</Text>
            <Text style={styles.statusModalLocation}>{roadwork.location}</Text>

            <Text style={styles.sectionTitle}>Select Action</Text>
            
            {statusOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.statusOption,
                  selectedStatus === option.value && styles.statusOptionSelected
                ]}
                onPress={() => setSelectedStatus(option.value)}
              >
                <View style={styles.statusOptionContent}>
                  <Text style={[
                    styles.statusOptionLabel,
                    selectedStatus === option.value && styles.statusOptionLabelSelected
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={styles.statusOptionDescription}>
                    {option.description}
                  </Text>
                </View>
                {selectedStatus === option.value && (
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                )}
              </TouchableOpacity>
            ))}

            <Text style={styles.sectionTitle}>Action Notes</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Describe what action you're taking or plan to take...\n\nExamples:\n• Coordinating with council for shuttle service\n• Creating diversion route via A19\n• Sent to commercial team for council liaison"
              placeholderTextColor="#9CA3AF"
              multiline={true}
              numberOfLines={6}
            />
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.confirmActionButton, loading && styles.buttonDisabled]}
              onPress={handleConfirm}
              disabled={loading || !selectedStatus || !notes.trim()}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  <Text style={styles.confirmActionButtonText}>Confirm Action</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

  const handleDismissRoadwork = async (roadworkId, reason = 'No action required') => {
    if (!isLoggedIn) {
      Alert.alert('Error', 'You must be logged in to dismiss roadworks');
      return;
    }

    try {
      console.log(`🙅 ${roadworkId} - Dismissing roadwork...`);
      
      const response = await fetch(`${apiBaseUrl}/api/roadworks/${roadworkId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'cancelled',
          sessionId: sessionId,
          notes: reason
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Roadwork dismissed successfully');
        Alert.alert('Success', 'Roadwork dismissed successfully');
        await loadRoadworks();
      } else {
        console.error('❌ Failed to dismiss roadwork:', data.error);
        Alert.alert('Error', data.error || 'Failed to dismiss roadwork');
      }
    } catch (error) {
      console.error('❌ Error dismissing roadwork:', error);
      Alert.alert('Error', `Failed to dismiss roadwork: ${error.message}`);
    }
  };

  const handleAcknowledgeRoadwork = async (roadworkId, newStatus, notes) => {
    if (!isLoggedIn) {
      Alert.alert('Error', 'You must be logged in to acknowledge roadworks');
      return;
    }

    try {
      console.log(`✅ ${roadworkId} - Acknowledging roadwork with status: ${newStatus}`);
      
      const response = await fetch(`${apiBaseUrl}/api/roadworks/${roadworkId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          sessionId: sessionId,
          notes: notes
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Roadwork acknowledged successfully');
        Alert.alert('Success', 'Roadwork status updated successfully');
        await loadRoadworks();
      } else {
        console.error('❌ Failed to acknowledge roadwork:', data.error);
        Alert.alert('Error', data.error || 'Failed to update roadwork');
      }
    } catch (error) {
      console.error('❌ Error acknowledging roadwork:', error);
      Alert.alert('Error', `Failed to update roadwork: ${error.message}`);
    }
  };

  // Priority levels with colors
  const PRIORITY_LEVELS = {
    critical: { label: 'Critical', color: '#DC2626', bgColor: '#FEF2F2' },
    high: { label: 'High', color: '#EA580C', bgColor: '#FFF7ED' },
    medium: { label: 'Medium', color: '#D97706', bgColor: '#FFFBEB' },
    low: { label: 'Low', color: '#65A30D', bgColor: '#F7FEE7' },
    planned: { label: 'Planned', color: '#7C3AED', bgColor: '#FAF5FF' }
  };

  // API base URL
  const apiBaseUrl = baseUrl || 'https://go-barry.onrender.com';

  // Load roadworks data
  useEffect(() => {
    loadRoadworks();
  }, [isLoggedIn, sessionId]);

  const loadRoadworks = async () => {
    setLoading(true);
    try {
      console.log('🚧 Loading roadworks from API...');
      const response = await fetch(`${apiBaseUrl}/api/roadworks`);
      const data = await response.json();
      
      if (data.success) {
        setRoadworks(data.roadworks || []);
        calculateStats(data.roadworks || []);
        console.log(`✅ Loaded ${data.roadworks?.length || 0} roadworks`);
      } else {
        console.error('❌ Failed to load roadworks:', data.error);
        Alert.alert('Error', 'Failed to load roadworks data');
        setRoadworks([]);
        calculateStats([]);
      }
    } catch (error) {
      console.error('❌ Error loading roadworks:', error);
      Alert.alert('Error', `Failed to connect to server: ${error.message}`);
      setRoadworks([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (roadworksData) => {
    const stats = {
      total: roadworksData.length,
      promotedToDisplay: roadworksData.filter(r => r.promotedToDisplay).length,
      activeDiversions: roadworksData.filter(r => r.diversions && r.diversions.length > 0).length,
      pendingTasks: roadworksData.reduce((sum, r) => 
        sum + (r.tasks ? r.tasks.filter(t => t.status === 'pending').length : 0), 0
      )
    };
    setStats(stats);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRoadworks();
    setRefreshing(false);
  };



  const handlePromoteToDisplay = async (roadworkId) => {
    if (!isLoggedIn) {
      Alert.alert('Error', 'You must be logged in to promote roadworks');
      return;
    }

    try {
      console.log(`📺 ${roadworkId} - Toggling display status...`);
      
      const response = await fetch(`${apiBaseUrl}/api/roadworks/${roadworkId}/promote-to-display`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId,
          displayNotes: 'Promoted via mobile interface',
          reason: 'Supervisor decision to promote/remove from display'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Display status updated successfully');
        Alert.alert('Success', 'Roadwork display status updated');
        // Reload roadworks to get updated status
        await loadRoadworks();
      } else {
        console.error('❌ Failed to update display status:', data.error);
        Alert.alert('Error', data.error || 'Failed to update roadwork');
      }
    } catch (error) {
      console.error('❌ Error updating roadwork:', error);
      Alert.alert('Error', `Failed to update roadwork: ${error.message}`);
    }
  };

  const renderRoadworkCard = (roadwork) => {
    const status = ROADWORKS_STATUSES[roadwork.status] || ROADWORKS_STATUSES.reported;
    const priority = PRIORITY_LEVELS[roadwork.priority] || PRIORITY_LEVELS.medium;

    return (
      <TouchableOpacity
        key={roadwork.id}
        style={styles.roadworkCard}
        onPress={() => {
          setSelectedRoadwork(roadwork);
          setShowDetailsModal(true);
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.statusBadge, { backgroundColor: `${status.color}20` }]}>
              <Ionicons name={status.icon} size={16} color={status.color} />
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: priority.bgColor }]}>
              <Text style={[styles.priorityText, { color: priority.color }]}>{priority.label}</Text>
            </View>
          </View>
          {roadwork.promotedToDisplay && (
            <View style={styles.displayBadge}>
              <Ionicons name="tv" size={16} color="#10B981" />
              <Text style={styles.displayBadgeText}>On Display</Text>
            </View>
          )}
        </View>

        <Text style={styles.cardTitle}>{roadwork.title}</Text>
        <Text style={styles.cardLocation}>
          <Ionicons name="location" size={14} color="#6B7280" /> {roadwork.location}
        </Text>

        {roadwork.affectedRoutes && roadwork.affectedRoutes.length > 0 && (
          <View style={styles.affectedRoutes}>
            <Text style={styles.affectedRoutesLabel}>Affected Routes:</Text>
            <View style={styles.routeTags}>
              {roadwork.affectedRoutes.slice(0, 5).map((route) => (
                <View key={route} style={styles.routeTag}>
                  <Text style={styles.routeTagText}>{route}</Text>
                </View>
              ))}
              {roadwork.affectedRoutes.length > 5 && (
                <View style={styles.routeTag}>
                  <Text style={styles.routeTagText}>+{roadwork.affectedRoutes.length - 5}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.cardMeta}>
            Created by {roadwork.createdByName} • {new Date(roadwork.createdAt).toLocaleDateString()}
          </Text>
          {roadwork.tasks && roadwork.tasks.filter(t => t.status === 'pending').length > 0 && (
            <View style={styles.tasksBadge}>
              <Ionicons name="clipboard" size={14} color="#F59E0B" />
              <Text style={styles.tasksCount}>
                {roadwork.tasks.filter(t => t.status === 'pending').length} tasks
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <View style={styles.loginPrompt}>
          <Ionicons name="lock-closed" size={48} color="#6B7280" />
          <Text style={styles.loginPromptTitle}>Authentication Required</Text>
          <Text style={styles.loginPromptText}>
            Please log in as a supervisor to access the Roadworks Manager
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Roadworks Management System</Text>
          <Text style={styles.headerSubtitle}>
            Managing {supervisorName} • {supervisorRole}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add-circle" size={20} color="#FFFFFF" />
          <Text style={styles.createButtonText}>New Roadwork</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Roadworks</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.promotedToDisplay}</Text>
          <Text style={styles.statLabel}>On Display</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#3B82F6' }]}>{stats.activeDiversions}</Text>
          <Text style={styles.statLabel}>Active Diversions</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.pendingTasks}</Text>
          <Text style={styles.statLabel}>Pending Tasks</Text>
        </View>
      </View>

      {/* Roadworks List */}
      <ScrollView
        style={styles.roadworksList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading roadworks...</Text>
          </View>
        ) : roadworks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="construct" size={48} color="#E5E7EB" />
            <Text style={styles.emptyTitle}>No Roadworks Found</Text>
            <Text style={styles.emptyText}>Create your first roadwork to get started</Text>
          </View>
        ) : (
          roadworks.map(renderRoadworkCard)
        )}
      </ScrollView>

      {/* Create Modal */}
      <CreateRoadworkModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        supervisorData={{ id: sessionId, name: supervisorName, email: supervisorRole }}
        onRoadworkCreated={(newRoadwork) => {
          console.log('New roadwork created:', newRoadwork);
          loadRoadworks();
        }}
      />

      {/* Details Modal */}
      <RoadworkDetailsModal
        visible={showDetailsModal}
        roadwork={selectedRoadwork}
        onClose={() => setShowDetailsModal(false)}
        onPromoteToDisplay={handlePromoteToDisplay}
        onDismiss={handleDismissRoadwork}
        onAcknowledge={(roadworkId) => {
          setShowDetailsModal(false);
          setShowStatusModal(true);
        }}
        isAdmin={isAdmin}
      />

      {/* Status Change Modal */}
      <StatusChangeModal
        visible={showStatusModal}
        roadwork={selectedRoadwork}
        onClose={() => setShowStatusModal(false)}
        onConfirm={handleAcknowledgeRoadwork}
        loading={loading}
      />
    </View>
  );
};



// Roadwork Details Modal Component
const RoadworkDetailsModal = ({ visible, roadwork, onClose, onPromoteToDisplay, onDismiss, onAcknowledge, isAdmin }) => {
  if (!visible || !roadwork) return null;

  const status = ROADWORKS_STATUSES[roadwork.status] || ROADWORKS_STATUSES.reported;
  const priority = PRIORITY_LEVELS[roadwork.priority] || PRIORITY_LEVELS.medium;

  const canDismiss = roadwork.status === 'reported' || roadwork.status === 'assessing';
  const canAcknowledge = roadwork.status !== 'cancelled' && roadwork.status !== 'completed';

  const handleDismissPress = () => {
    Alert.alert(
      'Dismiss Roadwork',
      'Are you sure you want to dismiss this roadwork? This indicates no action is required.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dismiss',
          style: 'destructive',
          onPress: () => {
            onDismiss(roadwork.id, 'No action required - dismissed by supervisor');
            onClose();
          }
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Roadwork Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Status and Priority */}
            <View style={styles.detailsHeader}>
              <View style={[styles.statusBadge, { backgroundColor: `${status.color}20` }]}>
                <Ionicons name={status.icon} size={16} color={status.color} />
                <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
              </View>
              <View style={[styles.priorityBadge, { backgroundColor: priority.bgColor }]}>
                <Text style={[styles.priorityText, { color: priority.color }]}>{priority.label}</Text>
              </View>
            </View>

            {/* Title and Description */}
            <Text style={styles.detailsTitle}>{roadwork.title}</Text>
            <Text style={styles.detailsDescription}>{roadwork.description}</Text>

            {/* Location */}
            <View style={styles.detailsSection}>
              <Text style={styles.detailsSectionTitle}>Location</Text>
              <Text style={styles.detailsText}>
                <Ionicons name="location" size={16} color="#6B7280" /> {roadwork.location}
              </Text>
            </View>

            {/* Authority and Contact */}
            <View style={styles.detailsSection}>
              <Text style={styles.detailsSectionTitle}>Authority & Contact</Text>
              <Text style={styles.detailsText}>Authority: {roadwork.authority || 'N/A'}</Text>
              <Text style={styles.detailsText}>Contact: {roadwork.contactPerson || 'N/A'}</Text>
              {roadwork.contactPhone && (
                <Text style={styles.detailsText}>Phone: {roadwork.contactPhone}</Text>
              )}
              {roadwork.contactEmail && (
                <Text style={styles.detailsText}>Email: {roadwork.contactEmail}</Text>
              )}
            </View>

            {/* Affected Routes */}
            {roadwork.affectedRoutes && roadwork.affectedRoutes.length > 0 && (
              <View style={styles.detailsSection}>
                <Text style={styles.detailsSectionTitle}>Affected Routes</Text>
                <View style={styles.routeTags}>
                  {roadwork.affectedRoutes.map((route) => (
                    <View key={route} style={styles.routeTag}>
                      <Text style={styles.routeTagText}>{route}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Metadata */}
            <View style={styles.detailsSection}>
              <Text style={styles.detailsSectionTitle}>Information</Text>
              <Text style={styles.detailsText}>
                Created by: {roadwork.createdByName}
              </Text>
              <Text style={styles.detailsText}>
                Created: {new Date(roadwork.createdAt).toLocaleString()}
              </Text>
              <Text style={styles.detailsText}>
                Last Updated: {new Date(roadwork.lastUpdated).toLocaleString()}
              </Text>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.modalActions}>
            {canDismiss && (
              <TouchableOpacity
                style={styles.dismissButton}
                onPress={handleDismissPress}
              >
                <Ionicons name="close-circle" size={20} color="#EF4444" />
                <Text style={styles.dismissButtonText}>Dismiss</Text>
              </TouchableOpacity>
            )}
            
            {canAcknowledge && (
              <TouchableOpacity
                style={styles.acknowledgeButton}
                onPress={() => onAcknowledge(roadwork.id)}
              >
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.acknowledgeButtonText}>Take Action</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[
                styles.displayToggleButton,
                roadwork.promotedToDisplay && styles.displayToggleButtonActive
              ]}
              onPress={() => {
                onPromoteToDisplay(roadwork.id);
                onClose();
              }}
            >
              <Ionicons 
                name={roadwork.promotedToDisplay ? "tv" : "tv-outline"} 
                size={20} 
                color={roadwork.promotedToDisplay ? "#10B981" : "#6B7280"} 
              />
              <Text style={[
                styles.displayToggleButtonText,
                roadwork.promotedToDisplay && styles.displayToggleButtonTextActive
              ]}>
                {roadwork.promotedToDisplay ? 'Remove from Display' : 'Promote to Display'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Define ROADWORKS_STATUSES and PRIORITY_LEVELS for the modal components
const ROADWORKS_STATUSES = {
  reported: { label: 'Reported', color: '#EF4444', icon: 'alert-circle' },
  assessing: { label: 'Assessing', color: '#F59E0B', icon: 'search' },
  planning: { label: 'Planning', color: '#3B82F6', icon: 'map' },
  approved: { label: 'Approved', color: '#8B5CF6', icon: 'checkmark-circle' },
  active: { label: 'Active', color: '#10B981', icon: 'play-circle' },
  monitoring: { label: 'Monitoring', color: '#06B6D4', icon: 'eye' },
  completed: { label: 'Completed', color: '#6B7280', icon: 'checkmark-done' },
  cancelled: { label: 'Cancelled', color: '#9CA3AF', icon: 'close-circle' }
};

const PRIORITY_LEVELS = {
  critical: { label: 'Critical', color: '#DC2626', bgColor: '#FEF2F2' },
  high: { label: 'High', color: '#EA580C', bgColor: '#FFF7ED' },
  medium: { label: 'Medium', color: '#D97706', bgColor: '#FFFBEB' },
  low: { label: 'Low', color: '#65A30D', bgColor: '#F7FEE7' },
  planned: { label: 'Planned', color: '#7C3AED', bgColor: '#FAF5FF' }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  createButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  roadworksList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  roadworkCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  displayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
  },
  displayBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  cardLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  affectedRoutes: {
    marginBottom: 12,
  },
  affectedRoutesLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  routeTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  routeTag: {
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  routeTagText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardMeta: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  tasksBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tasksCount: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loginPromptTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  loginPromptText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '90%',
    maxWidth: 600,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 12,
  },

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },

  // Details Modal Styles
  detailsHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  detailsDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  detailsSection: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  displayToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  displayToggleButtonActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  displayToggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  displayToggleButtonTextActive: {
    color: '#10B981',
  },
  // Dismiss and Acknowledge Button Styles
  dismissButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    gap: 8,
  },
  dismissButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  acknowledgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    backgroundColor: '#F0FDF4',
    gap: 8,
  },
  acknowledgeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  // Status Change Modal Styles
  statusModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statusModalLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  statusOptionSelected: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  statusOptionContent: {
    flex: 1,
  },
  statusOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  statusOptionLabelSelected: {
    color: '#047857',
  },
  statusOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  confirmActionButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confirmActionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RoadworksManager;