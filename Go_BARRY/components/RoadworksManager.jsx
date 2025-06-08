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

  // Priority levels with colors
  const PRIORITY_LEVELS = {
    critical: { label: 'Critical', color: '#DC2626', bgColor: '#FEF2F2' },
    high: { label: 'High', color: '#EA580C', bgColor: '#FFF7ED' },
    medium: { label: 'Medium', color: '#D97706', bgColor: '#FFFBEB' },
    low: { label: 'Low', color: '#65A30D', bgColor: '#F7FEE7' },
    planned: { label: 'Planned', color: '#7C3AED', bgColor: '#FAF5FF' }
  };

  // Sample roadworks data for demonstration
  const sampleRoadworks = [
    {
      id: 'roadwork_001',
      title: 'A1 Northbound Road Surface Repairs',
      description: 'Major road surface repairs affecting both lanes between Junction 65 and 66. Expected delays of 10-15 minutes.',
      location: 'A1 Northbound, Birtley Junction 65',
      coordinates: { latitude: 54.9158, longitude: -1.5721 },
      authority: 'National Highways',
      contactPerson: 'John Smith',
      contactPhone: '0191 123 4567',
      contactEmail: 'j.smith@nationalhighways.co.uk',
      plannedStartDate: '2025-06-10T06:00:00.000Z',
      plannedEndDate: '2025-06-12T18:00:00.000Z',
      estimatedDuration: '3 days',
      roadworkType: 'road_surface',
      trafficManagement: 'traffic_lights',
      priority: 'high',
      affectedRoutes: ['21', 'X21', '10', '12', '25'],
      status: 'planning',
      assignedTo: 'supervisor001',
      assignedToName: supervisorName || 'Demo Supervisor',
      createdBy: 'supervisor001',
      createdByName: supervisorName || 'Demo Supervisor',
      createdAt: '2025-06-07T09:00:00.000Z',
      lastUpdated: '2025-06-07T10:30:00.000Z',
      promotedToDisplay: true,
      displayNotes: 'Major route closure affecting key services',
      diversions: [],
      tasks: [
        {
          id: 'task_001',
          title: 'Create Blink PDF Diversion Map',
          type: 'blink_pdf',
          status: 'pending',
          priority: 'urgent'
        }
      ]
    },
    {
      id: 'roadwork_002',
      title: 'Central Station Traffic Light Maintenance',
      description: 'Temporary traffic lights installation for planned maintenance works around Central Station area.',
      location: 'Central Station, Newcastle upon Tyne',
      coordinates: { latitude: 54.9686, longitude: -1.6174 },
      authority: 'Newcastle City Council',
      contactPerson: 'Sarah Johnson',
      contactPhone: '0191 987 6543',
      contactEmail: 's.johnson@newcastle.gov.uk',
      plannedStartDate: '2025-06-15T07:00:00.000Z',
      plannedEndDate: '2025-06-15T19:00:00.000Z',
      estimatedDuration: '1 day',
      roadworkType: 'utilities',
      trafficManagement: 'traffic_lights',
      priority: 'medium',
      affectedRoutes: ['Q3', 'Q3X', '10', '12'],
      status: 'approved',
      assignedTo: 'supervisor002',
      assignedToName: 'Sarah Wilson',
      createdBy: 'supervisor002',
      createdByName: 'Sarah Wilson',
      createdAt: '2025-06-05T14:20:00.000Z',
      lastUpdated: '2025-06-06T16:45:00.000Z',
      promotedToDisplay: false,
      diversions: [],
      tasks: []
    },
    {
      id: 'roadwork_003',
      title: 'Tyne Bridge Inspection Works',
      description: 'Scheduled safety inspection of Tyne Bridge structure requiring temporary lane closures.',
      location: 'Tyne Bridge, Newcastle/Gateshead',
      coordinates: { latitude: 54.9695, longitude: -1.6018 },
      authority: 'Gateshead Council',
      contactPerson: 'David Brown',
      contactPhone: '0191 456 7890',
      contactEmail: 'd.brown@gateshead.gov.uk',
      plannedStartDate: '2025-06-20T22:00:00.000Z',
      plannedEndDate: '2025-06-21T06:00:00.000Z',
      estimatedDuration: '8 hours',
      roadworkType: 'major_works',
      trafficManagement: 'lane_closure',
      priority: 'planned',
      affectedRoutes: ['21', '22', '27'],
      status: 'reported',
      assignedTo: 'supervisor001',
      assignedToName: supervisorName || 'Demo Supervisor',
      createdBy: 'supervisor003',
      createdByName: 'Mike Thompson',
      createdAt: '2025-06-03T11:15:00.000Z',
      lastUpdated: '2025-06-03T11:15:00.000Z',
      promotedToDisplay: false,
      diversions: [],
      tasks: []
    }
  ];

  // Load roadworks data
  useEffect(() => {
    loadRoadworks();
  }, [isLoggedIn, sessionId]);

  const loadRoadworks = async () => {
    setLoading(true);
    try {
      // For now, use sample data
      // In production, this would fetch from your backend
      setRoadworks(sampleRoadworks);
      calculateStats(sampleRoadworks);
    } catch (error) {
      console.error('Error loading roadworks:', error);
      Alert.alert('Error', 'Failed to load roadworks data');
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

  const handleCreateRoadwork = async (formData) => {
    if (!isLoggedIn) {
      Alert.alert('Error', 'You must be logged in to create roadworks');
      return;
    }

    try {
      // Create new roadwork with supervisor info
      const newRoadwork = {
        ...formData,
        id: `roadwork_${Date.now()}`,
        status: 'reported',
        createdBy: sessionId,
        createdByName: supervisorName,
        assignedTo: sessionId,
        assignedToName: supervisorName,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        promotedToDisplay: false,
        diversions: [],
        tasks: [],
        affectedRoutes: []
      };

      // In production, send to backend
      // For now, add to local state
      const updatedRoadworks = [newRoadwork, ...roadworks];
      setRoadworks(updatedRoadworks);
      calculateStats(updatedRoadworks);
      setShowCreateModal(false);
      Alert.alert('Success', 'Roadwork created successfully');
    } catch (error) {
      console.error('Error creating roadwork:', error);
      Alert.alert('Error', 'Failed to create roadwork');
    }
  };

  const handlePromoteToDisplay = async (roadworkId) => {
    if (!isLoggedIn) {
      Alert.alert('Error', 'You must be logged in to promote roadworks');
      return;
    }

    try {
      const updatedRoadworks = roadworks.map(r => 
        r.id === roadworkId 
          ? { ...r, promotedToDisplay: !r.promotedToDisplay, lastUpdated: new Date().toISOString() }
          : r
      );
      setRoadworks(updatedRoadworks);
      calculateStats(updatedRoadworks);
      Alert.alert('Success', 'Roadwork display status updated');
    } catch (error) {
      console.error('Error updating roadwork:', error);
      Alert.alert('Error', 'Failed to update roadwork');
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
        onCreate={handleCreateRoadwork}
        loading={loading}
        session={{ supervisorName, supervisorRole, sessionId }}
      />

      {/* Details Modal */}
      <RoadworkDetailsModal
        visible={showDetailsModal}
        roadwork={selectedRoadwork}
        onClose={() => setShowDetailsModal(false)}
        onPromoteToDisplay={handlePromoteToDisplay}
        isAdmin={isAdmin}
      />
    </View>
  );
};

// Create Roadwork Modal Component
const CreateRoadworkModal = ({ visible, onClose, onCreate, loading, session }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    authority: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    plannedStartDate: '',
    plannedEndDate: '',
    estimatedDuration: '',
    roadworkType: 'general',
    trafficManagement: 'traffic_control',
    priority: 'medium'
  });

  const priorities = [
    { value: 'critical', label: 'Critical', color: '#DC2626' },
    { value: 'high', label: 'High', color: '#EA580C' },
    { value: 'medium', label: 'Medium', color: '#D97706' },
    { value: 'low', label: 'Low', color: '#65A30D' },
    { value: 'planned', label: 'Planned', color: '#7C3AED' }
  ];

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.location.trim()) {
      Alert.alert('Error', 'Title and location are required');
      return;
    }

    onCreate(formData);
  };

  if (!visible) return null;

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
            <Text style={styles.modalTitle}>Create New Roadwork</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Basic Information */}
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.title}
                onChangeText={(text) => setFormData({...formData, title: text})}
                placeholder="e.g., A1 Northbound Road Surface Repairs"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Location *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.location}
                onChangeText={(text) => setFormData({...formData, location: text})}
                placeholder="e.g., A1 Northbound, Newcastle"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({...formData, description: text})}
                placeholder="Describe the roadworks and expected impact..."
                placeholderTextColor="#9CA3AF"
                multiline={true}
                numberOfLines={3}
              />
            </View>

            {/* Contact Information */}
            <Text style={styles.sectionTitle}>Contact Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Authority</Text>
              <TextInput
                style={styles.textInput}
                value={formData.authority}
                onChangeText={(text) => setFormData({...formData, authority: text})}
                placeholder="e.g., Newcastle City Council"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contact Person</Text>
              <TextInput
                style={styles.textInput}
                value={formData.contactPerson}
                onChangeText={(text) => setFormData({...formData, contactPerson: text})}
                placeholder="Contact person name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Classification */}
            <Text style={styles.sectionTitle}>Classification</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Priority Level</Text>
              <View style={styles.prioritySelector}>
                {priorities.map((priority) => (
                  <TouchableOpacity
                    key={priority.value}
                    style={[
                      styles.priorityOption,
                      formData.priority === priority.value && {
                        backgroundColor: `${priority.color}15`,
                        borderColor: priority.color
                      }
                    ]}
                    onPress={() => setFormData({...formData, priority: priority.value})}
                  >
                    <Text style={[
                      styles.priorityOptionText,
                      formData.priority === priority.value && { color: priority.color }
                    ]}>
                      {priority.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Timing */}
            <Text style={styles.sectionTitle}>Timing</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Estimated Duration</Text>
              <TextInput
                style={styles.textInput}
                value={formData.estimatedDuration}
                onChangeText={(text) => setFormData({...formData, estimatedDuration: text})}
                placeholder="e.g., 3 days, 2 weeks"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.createSubmitButton, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  <Text style={styles.createSubmitButtonText}>Create Roadwork</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Roadwork Details Modal Component
const RoadworkDetailsModal = ({ visible, roadwork, onClose, onPromoteToDisplay, isAdmin }) => {
  if (!visible || !roadwork) return null;

  const status = ROADWORKS_STATUSES[roadwork.status] || ROADWORKS_STATUSES.reported;
  const priority = PRIORITY_LEVELS[roadwork.priority] || PRIORITY_LEVELS.medium;

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
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  priorityOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  priorityOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
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
  createSubmitButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createSubmitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
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
});

export default RoadworksManager;