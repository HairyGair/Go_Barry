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
  RefreshControl,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupervisorSession } from './hooks/useSupervisorSession';
import { useConvexSync } from '../hooks/useConvexSync';
import { formatDateUK, formatTime24, formatDateTimeUK } from '../utils/dateTime';

const DisruptionDatabase = ({ baseUrl }) => {
  const {
    isLoggedIn,
    supervisorName,
    supervisorRole,
    sessionId,
    isAdmin
  } = useSupervisorSession();

  // Get incidents from Convex
  const { activeIncidents, allIncidents } = useConvexSync();

  const [roadworks, setRoadworks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('priority');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Bulk selection states
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
  const [showBulkPriorityModal, setShowBulkPriorityModal] = useState(false);

  const apiBaseUrl = baseUrl || 'https://go-barry.onrender.com';

  // Combined disruption types
  const DISRUPTION_TYPES = {
    roadwork: { label: 'Roadwork', color: '#F59E0B', bgColor: '#FFF7ED', icon: 'construct' },
    incident: { label: 'Incident', color: '#EF4444', bgColor: '#FEF2F2', icon: 'alert-circle' },
    streetmanager: { label: 'Official Roadwork', color: '#059669', bgColor: '#ECFDF5', icon: 'document-text' },
    traffic: { label: 'Traffic Alert', color: '#3B82F6', bgColor: '#EFF6FF', icon: 'car' },
    planned: { label: 'Planned Work', color: '#8B5CF6', bgColor: '#FAF5FF', icon: 'calendar' }
  };

  // Status configurations (unified for both roadworks and incidents)
  const STATUS_CONFIG = {
    // Roadwork statuses
    reported: { label: 'Reported', color: '#EF4444', bgColor: '#FEF2F2', icon: 'alert-circle' },
    assessing: { label: 'Assessing', color: '#F59E0B', bgColor: '#FFF7ED', icon: 'search' },
    planning: { label: 'Planning', color: '#3B82F6', bgColor: '#EFF6FF', icon: 'map' },
    approved: { label: 'Approved', color: '#8B5CF6', bgColor: '#FAF5FF', icon: 'checkmark-circle' },
    active: { label: 'Active', color: '#10B981', bgColor: '#F0FDF4', icon: 'play-circle' },
    monitoring: { label: 'Monitoring', color: '#06B6D4', bgColor: '#F0F9FF', icon: 'eye' },
    completed: { label: 'Completed', color: '#6B7280', bgColor: '#F9FAFB', icon: 'checkmark-done' },
    cancelled: { label: 'Cancelled', color: '#9CA3AF', bgColor: '#F9FAFB', icon: 'close-circle' },
    // Incident statuses
    closed: { label: 'Closed', color: '#6B7280', bgColor: '#F9FAFB', icon: 'checkmark-done' }
  };

  const PRIORITY_LEVELS = {
    critical: { label: 'Critical', color: '#DC2626', bgColor: '#FEF2F2' },
    high: { label: 'High', color: '#EA580C', bgColor: '#FFF7ED' },
    medium: { label: 'Medium', color: '#D97706', bgColor: '#FFFBEB' },
    low: { label: 'Low', color: '#65A30D', bgColor: '#F7FEE7' },
    planned: { label: 'Planned', color: '#7C3AED', bgColor: '#FAF5FF' }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadRoadworks();
    }
  }, [isLoggedIn]);

  const loadRoadworks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/roadworks`);
      const data = await response.json();
      
      if (data.success) {
        setRoadworks(data.roadworks || []);
      } else {
        Alert.alert('Error', 'Failed to load roadworks data');
        setRoadworks([]);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to connect to server: ${error.message}`);
      setRoadworks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRoadworks();
    setRefreshing(false);
    // Exit selection mode on refresh
    if (selectionMode) {
      setSelectionMode(false);
      setSelectedItems([]);
    }
  };

  // Bulk selection handlers
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedItems([]);
    }
  };

  const toggleItemSelection = (itemId, itemType) => {
    const itemKey = `${itemType}-${itemId}`;
    setSelectedItems(prev => {
      if (prev.includes(itemKey)) {
        return prev.filter(id => id !== itemKey);
      } else {
        return [...prev, itemKey];
      }
    });
  };

  const selectAllVisible = () => {
    const allKeys = getFilteredDisruptions().map(item => `${item.type}-${item.id}`);
    setSelectedItems(allKeys);
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  // Bulk operations
  const handleBulkStatusUpdate = async (newStatus) => {
    setLoading(true);
    try {
      const promises = selectedItems.map(async (itemKey) => {
        const [type, id] = itemKey.split('-');
        const endpoint = type === 'incident' ?
          `${apiBaseUrl}/api/incidents/${id}` :
          `${apiBaseUrl}/api/roadworks/${id}/status`;
        
        const body = type === 'incident' ?
          { status: newStatus, sessionId, supervisorName } :
          { status: newStatus, sessionId, notes: `Bulk status update to ${newStatus}` };

        return fetch(endpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
      });

      await Promise.all(promises);
      Alert.alert('Success', `Updated ${selectedItems.length} items`);
      await handleRefresh();
      setShowBulkStatusModal(false);
      setSelectedItems([]);
      setSelectionMode(false);
    } catch (error) {
      Alert.alert('Error', 'Some updates failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkPriorityUpdate = async (newPriority) => {
    setLoading(true);
    try {
      const promises = selectedItems.map(async (itemKey) => {
        const [type, id] = itemKey.split('-');
        const endpoint = type === 'incident' ?
          `${apiBaseUrl}/api/incidents/${id}` :
          `${apiBaseUrl}/api/roadworks/${id}`;

        return fetch(endpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            priority: newPriority,
            sessionId,
            supervisorName
          })
        });
      });

      await Promise.all(promises);
      Alert.alert('Success', `Updated priority for ${selectedItems.length} items`);
      await handleRefresh();
      setShowBulkPriorityModal(false);
      setSelectedItems([]);
      setSelectionMode(false);
    } catch (error) {
      Alert.alert('Error', 'Some updates failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkArchive = async () => {
    if (Platform.OS === 'web') {
      if (!confirm(`Archive ${selectedItems.length} items? This action cannot be undone.`)) {
        return;
      }
    } else {
      Alert.alert(
        'Archive Items',
        `Archive ${selectedItems.length} items? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Archive', style: 'destructive', onPress: performBulkArchive }
        ]
      );
      return;
    }
    await performBulkArchive();
  };

  const performBulkArchive = async () => {
    setLoading(true);
    try {
      const promises = selectedItems.map(async (itemKey) => {
        const [type, id] = itemKey.split('-');
        const endpoint = type === 'incident' ?
          `${apiBaseUrl}/api/incidents/${id}` :
          `${apiBaseUrl}/api/roadworks/${id}`;

        return fetch(endpoint, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            reason: 'Bulk archive operation'
          })
        });
      });

      await Promise.all(promises);
      Alert.alert('Success', `Archived ${selectedItems.length} items`);
      await handleRefresh();
      setSelectedItems([]);
      setSelectionMode(false);
    } catch (error) {
      Alert.alert('Error', 'Some deletions failed');
    } finally {
      setLoading(false);
    }
  };

  // Edit handler for both incidents and roadworks
  const handleEdit = (item) => {
    setEditingItem(item);
    setShowEditModal(true);
  };

  // Save edited disruption
  const handleSaveEdit = async (itemId, updatedData, type) => {
    try {
      setLoading(true);
      const endpoint = type === 'incident' ? 
        `${apiBaseUrl}/api/incidents/${itemId}` : 
        `${apiBaseUrl}/api/roadworks/${itemId}`;
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updatedData,
          sessionId: sessionId,
          supervisorName: supervisorName
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', 'Updated successfully');
        await handleRefresh();
        setShowEditModal(false);
        setEditingItem(null);
      } else {
        Alert.alert('Error', data.error || 'Failed to update');
      }
    } catch (error) {
      Alert.alert('Error', `Failed to update: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Delete/Archive handler
  const handleDelete = async (item) => {
    const confirmMessage = item.type === 'incident' ? 
      'Archive this incident?' : 
      'Remove this roadwork?';
    
    if (Platform.OS === 'web') {
      if (!confirm(confirmMessage + ' This action cannot be undone.')) {
        return;
      }
    } else {
      Alert.alert(
        item.type === 'incident' ? 'Archive Incident' : 'Remove Roadwork',
        confirmMessage + ' This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Confirm', style: 'destructive', onPress: () => performDelete(item) }
        ]
      );
      return;
    }

    await performDelete(item);
  };

  const performDelete = async (item) => {
    try {
      setLoading(true);
      const endpoint = item.type === 'incident' ? 
        `${apiBaseUrl}/api/incidents/${item.id}` : 
        `${apiBaseUrl}/api/roadworks/${item.id}`;
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId,
          reason: 'Removed via disruption database'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', item.type === 'incident' ? 'Incident archived' : 'Roadwork removed');
        await handleRefresh();
      } else {
        Alert.alert('Error', data.error || 'Failed to remove');
      }
    } catch (error) {
      Alert.alert('Error', `Failed to remove: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Convert incidents to unified format
  const getFormattedIncidents = () => {
    if (!activeIncidents && !allIncidents) return [];
    
    const incidents = [...(activeIncidents || []), ...(allIncidents || [])];
    return incidents.map(incident => ({
      id: incident.incidentId || incident.id,
      type: 'incident',
      title: `${incident.type} - ${incident.location}`,
      location: incident.location,
      description: incident.description,
      status: incident.status,
      priority: incident.priority?.toLowerCase() || 'medium',
      affectedRoutes: incident.affectsRoutes || [],
      createdAt: incident.createdAt,
      createdBy: incident.createdBy,
      lastUpdated: incident.updatedAt || incident.createdAt,
      source: 'manual',
      subtype: incident.subtype,
      coordinates: incident.coordinates
    }));
  };

  // Get traffic incidents from API (includes Street Manager)
  const [trafficIncidents, setTrafficIncidents] = useState([]);
  
  // REMOVED: Don't load traffic incidents from API - only show supervisor-created items
  /*
  useEffect(() => {
    loadTrafficIncidents();
  }, []);
  
  const loadTrafficIncidents = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/incident-alerts`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.incidents) {
          setTrafficIncidents(data.incidents);
        }
      }
    } catch (error) {
      console.error('Failed to load traffic incidents:', error);
    }
  };
  */
  
  // Convert traffic incidents to unified format
  const getFormattedTrafficIncidents = () => {
    // Return empty array - we don't want API traffic incidents
    return [];
  };

  // Convert roadworks to unified format  
  const getFormattedRoadworks = () => {
    return roadworks.map(roadwork => ({
      id: roadwork.id,
      type: 'roadwork',
      title: roadwork.title,
      location: roadwork.location,
      description: roadwork.description,
      status: roadwork.status,
      priority: roadwork.priority,
      affectedRoutes: roadwork.affectedRoutes || [],
      createdAt: roadwork.createdAt,
      createdBy: roadwork.createdBy,
      lastUpdated: roadwork.lastUpdated,
      source: 'roadwork',
      authority: roadwork.authority,
      startDate: roadwork.startDate,
      endDate: roadwork.endDate
    }));
  };

  // Combine and filter all disruptions
  const getAllDisruptions = () => {
    const incidents = getFormattedIncidents();
    const roadworks = getFormattedRoadworks();
    const traffic = getFormattedTrafficIncidents();
    return [...incidents, ...roadworks, ...traffic];
  };

  const getFilteredDisruptions = () => {
    let filtered = getAllDisruptions();

    // Filter by tab
    switch (activeTab) {
      case 'active':
        filtered = filtered.filter(item => ['active', 'monitoring'].includes(item.status));
        break;
      case 'incidents':
        filtered = filtered.filter(item => item.type === 'incident');
        break;
      case 'roadworks':
        filtered = filtered.filter(item => item.type === 'roadwork');
        break;
      case 'streetmanager':
        filtered = filtered.filter(item => item.type === 'streetmanager');
        break;
      case 'traffic':
        filtered = filtered.filter(item => item.type === 'traffic');
        break;
      case 'needsAction':
        filtered = filtered.filter(item => ['reported', 'assessing'].includes(item.status));
        break;
      case 'all':
        // Show all
        break;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.authority?.toLowerCase().includes(query) ||
        item.affectedRoutes?.some(route => route.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'priority') {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3, planned: 4 };
        aValue = priorityOrder[a.priority] || 5;
        bValue = priorityOrder[b.priority] || 5;
      } else if (sortField === 'createdAt' || sortField === 'lastUpdated') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  const handleTakeAction = async (itemId, action, notes) => {
    if (!isLoggedIn) {
      Alert.alert('Error', 'You must be logged in to take action');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${apiBaseUrl}/api/roadworks/${itemId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: action,
          sessionId: sessionId,
          notes: notes
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', 'Action completed successfully');
        await loadRoadworks();
        setShowActionModal(false);
        setShowDetailsModal(false);
      } else {
        Alert.alert('Error', data.error || 'Failed to take action');
      }
    } catch (error) {
      Alert.alert('Error', `Failed to take action: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.unauthorizedContainer}>
        <Ionicons name="lock-closed" size={48} color="#6B7280" />
        <Text style={styles.unauthorizedTitle}>Supervisor Access Required</Text>
        <Text style={styles.unauthorizedText}>
          Please log in as a supervisor to access the disruption database
        </Text>
      </View>
    );
  }

  const filteredDisruptions = getFilteredDisruptions();
  const allDisruptions = getAllDisruptions();
  // Remove the traffic and streetmanager tabs from the stats
  const activeCount = allDisruptions.filter(item => ['active', 'monitoring'].includes(item.status)).length;
  const incidentCount = allDisruptions.filter(item => item.type === 'incident').length;
  const roadworkCount = allDisruptions.filter(item => item.type === 'roadwork').length;
  const actionNeededCount = allDisruptions.filter(item => ['reported', 'assessing'].includes(item.status)).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Disruption Database</Text>
          <Text style={styles.subtitle}>
            {selectionMode ? `${selectedItems.length} selected` : 'All roadworks and incidents in one place'}
          </Text>
        </View>
        
        <View style={styles.headerActions}>
          {selectionMode && selectedItems.length === getFilteredDisruptions().length && (
            <TouchableOpacity
              style={styles.selectAllButton}
              onPress={clearSelection}
            >
              <Text style={styles.selectAllText}>Deselect All</Text>
            </TouchableOpacity>
          )}
          {selectionMode && selectedItems.length < getFilteredDisruptions().length && (
            <TouchableOpacity
              style={styles.selectAllButton}
              onPress={selectAllVisible}
            >
              <Text style={styles.selectAllText}>Select All</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.selectionModeButton, selectionMode && styles.selectionModeActive]}
            onPress={toggleSelectionMode}
          >
            <Ionicons 
              name={selectionMode ? "checkmark-done" : "checkbox-outline"} 
              size={20} 
              color={selectionMode ? "#FFFFFF" : "#6B7280"} 
            />
            <Text style={[styles.selectionModeText, selectionMode && styles.selectionModeTextActive]}>
              {selectionMode ? 'Cancel' : 'Select'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <Ionicons name="refresh" size={20} color="#3B82F6" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by location, route, or description..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{allDisruptions.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#10B981' }]}>{activeCount}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#EF4444' }]}>{incidentCount}</Text>
          <Text style={styles.statLabel}>Incidents</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#F59E0B' }]}>{roadworkCount}</Text>
          <Text style={styles.statLabel}>Roadworks</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#DC2626' }]}>{actionNeededCount}</Text>
          <Text style={styles.statLabel}>Need Action</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && styles.activeTab]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
              All ({allDisruptions.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'active' && styles.activeTab]}
            onPress={() => setActiveTab('active')}
          >
            <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
              Active ({activeCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'incidents' && styles.activeTab]}
            onPress={() => setActiveTab('incidents')}
          >
            <Text style={[styles.tabText, activeTab === 'incidents' && styles.activeTabText]}>
              Incidents ({incidentCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'roadworks' && styles.activeTab]}
            onPress={() => setActiveTab('roadworks')}
          >
            <Text style={[styles.tabText, activeTab === 'roadworks' && styles.activeTabText]}>
              Roadworks ({roadworkCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'needsAction' && styles.activeTab]}
            onPress={() => setActiveTab('needsAction')}
          >
            <Text style={[styles.tabText, activeTab === 'needsAction' && styles.activeTabText]}>
              Needs Action ({actionNeededCount})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Disruptions List */}
      <ScrollView 
        style={styles.disruptionsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading && filteredDisruptions.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading disruptions...</Text>
          </View>
        ) : filteredDisruptions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Disruptions Found</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Try adjusting your search terms' : 'No disruptions match your current filter'}
            </Text>
          </View>
        ) : (
          filteredDisruptions.map((item, index) => {
            const itemKey = `${item.type}-${item.id}`;
            const isSelected = selectedItems.includes(itemKey);
            
            return (
              <TouchableOpacity
                key={itemKey}
                style={[
                  styles.disruptionCard,
                  item.type === 'incident' && styles.incidentCard,
                  item.type === 'roadwork' && styles.roadworkCard,
                  item.type === 'streetmanager' && styles.streetManagerCard,
                  item.type === 'traffic' && styles.trafficCard,
                  selectionMode && isSelected && styles.selectedCard
                ]}
                onPress={() => {
                  if (selectionMode) {
                    toggleItemSelection(item.id, item.type);
                  } else {
                    setSelectedItem(item);
                    setShowDetailsModal(true);
                  }
                }}
              >
                {selectionMode && (
                  <View style={styles.checkboxContainer}>
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                    </View>
                  </View>
                )}
              <View style={styles.cardHeader}>
                <View style={styles.typeAndPriority}>
                  <View style={[
                    styles.typeBadge,
                    { backgroundColor: DISRUPTION_TYPES[item.type]?.bgColor || '#F3F4F6' }
                  ]}>
                    <Ionicons 
                      name={DISRUPTION_TYPES[item.type]?.icon || 'help-circle'} 
                      size={14} 
                      color={DISRUPTION_TYPES[item.type]?.color || '#6B7280'} 
                    />
                    <Text style={[
                      styles.typeBadgeText,
                      { color: DISRUPTION_TYPES[item.type]?.color || '#6B7280' }
                    ]}>
                      {DISRUPTION_TYPES[item.type]?.label || item.type}
                    </Text>
                  </View>
                  
                  <View style={[
                    styles.priorityBadge,
                    { 
                      backgroundColor: PRIORITY_LEVELS[item.priority]?.bgColor || '#F3F4F6',
                    }
                  ]}>
                    <Text style={[
                      styles.priorityBadgeText,
                      { color: PRIORITY_LEVELS[item.priority]?.color || '#6B7280' }
                    ]}>
                      {PRIORITY_LEVELS[item.priority]?.label || item.priority}
                    </Text>
                  </View>
                </View>

                <View style={[
                  styles.statusBadge,
                  { backgroundColor: STATUS_CONFIG[item.status]?.bgColor || '#F3F4F6' }
                ]}>
                  <Ionicons 
                    name={STATUS_CONFIG[item.status]?.icon || 'help-circle'} 
                    size={12} 
                    color={STATUS_CONFIG[item.status]?.color || '#6B7280'} 
                  />
                  <Text style={[
                    styles.statusBadgeText,
                    { color: STATUS_CONFIG[item.status]?.color || '#6B7280' }
                  ]}>
                    {STATUS_CONFIG[item.status]?.label || item.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.disruptionTitle} numberOfLines={2}>
                {item.title}
              </Text>
              
              <Text style={styles.disruptionLocation} numberOfLines={1}>
                📍 {item.location}
              </Text>

              {item.description && (
                <Text style={styles.disruptionDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              )}

              {/* Street Manager Professional Details */}
              {item.type === 'streetmanager' && (
                <View style={styles.streetManagerInfo}>
                  {/* Timeline Status */}
                  {item.timelineStatus && (
                    <View style={[styles.timelineStatusBadge, {
                      backgroundColor: 
                        item.timelineStatus.includes('IN PROGRESS') ? '#FEF2F2' :
                        item.timelineStatus.includes('TODAY') ? '#FFF7ED' :
                        item.timelineStatus === 'COMPLETED' ? '#F0FDF4' : '#F3F4F6'
                    }]}>
                      <Text style={[styles.timelineStatusText, {
                        color: 
                          item.timelineStatus.includes('IN PROGRESS') ? '#DC2626' :
                          item.timelineStatus.includes('TODAY') ? '#EA580C' :
                          item.timelineStatus === 'COMPLETED' ? '#16A34A' : '#6B7280'
                      }]}>
                        {item.timelineStatus}
                      </Text>
                    </View>
                  )}
                  
                  {/* Authority & Reference */}
                  <View style={styles.authorityRefContainer}>
                    {item.authority && (
                      <Text style={styles.authorityText}>
                        🏛️ {item.authority}
                      </Text>
                    )}
                    {item.permitReference && (
                      <Text style={styles.referenceText}>
                        📋 {item.permitReference}
                      </Text>
                    )}
                  </View>
                  
                  {/* Duration & Dates */}
                  {(item.durationEstimate || item.proposedStartDate) && (
                    <View style={styles.timingInfo}>
                      {item.durationEstimate && (
                        <Text style={styles.durationText}>
                          ⏱️ {item.durationEstimate}
                        </Text>
                      )}
                      {item.proposedStartDate && (
                        <Text style={styles.dateText}>
                          📅 {new Date(item.proposedStartDate).toLocaleDateString('en-GB')}
                        </Text>
                      )}
                    </View>
                  )}
                  
                  {/* Emergency Indicator */}
                  {item.isEmergency && (
                    <View style={styles.emergencyIndicator}>
                      <Text style={styles.emergencyText}>🚨 EMERGENCY WORKS</Text>
                    </View>
                  )}
                </View>
              )}

              {item.affectedRoutes && item.affectedRoutes.length > 0 && (
                <View style={styles.routesContainer}>
                  <Text style={styles.routesLabel}>Routes:</Text>
                  <View style={styles.routesList}>
                    {item.affectedRoutes.slice(0, 4).map((route, idx) => (
                      <View key={idx} style={styles.routeBadge}>
                        <Text style={styles.routeBadgeText}>{route}</Text>
                      </View>
                    ))}
                    {item.affectedRoutes.length > 4 && (
                      <Text style={styles.moreRoutesText}>+{item.affectedRoutes.length - 4} more</Text>
                    )}
                  </View>
                </View>
              )}

              <View style={styles.cardFooter}>
                <View style={styles.cardFooterLeft}>
                  <Text style={styles.createdBy}>
                    Created by {item.createdBy}
                  </Text>
                  <Text style={styles.timeStamp}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                
                {/* Action Buttons */}
                <View style={styles.actionButtonsContainer}>
                  {item.status === 'active' && (
                    <View style={styles.activeBadge}>
                      <Ionicons name="radio" size={8} color="#10B981" />
                      <Text style={styles.activeText}>Active</Text>
                    </View>
                  )}
                  
                  {isLoggedIn && (
                    <>
                      <TouchableOpacity
                        style={styles.cardActionButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleEdit(item);
                        }}
                      >
                        <Ionicons name="pencil" size={14} color="#8B5CF6" />
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.cardActionButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDelete(item);
                        }}
                      >
                        <Ionicons name={item.type === 'incident' ? 'archive' : 'trash'} size={14} color="#EF4444" />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Floating Action Bar */}
      {selectionMode && selectedItems.length > 0 && (
        <View style={styles.floatingActionBar}>
          <View style={styles.floatingActionContent}>
            <Text style={styles.floatingActionText}>
              {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
            </Text>
            <View style={styles.floatingActions}>
              <TouchableOpacity
                style={styles.floatingActionButton}
                onPress={() => setShowBulkStatusModal(true)}
              >
                <Ionicons name="sync" size={20} color="#FFFFFF" />
                <Text style={styles.floatingActionButtonText}>Status</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.floatingActionButton}
                onPress={() => setShowBulkPriorityModal(true)}
              >
                <Ionicons name="flag" size={20} color="#FFFFFF" />
                <Text style={styles.floatingActionButtonText}>Priority</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.floatingActionButton, styles.archiveButton]}
                onPress={handleBulkArchive}
              >
                <Ionicons name="archive" size={20} color="#FFFFFF" />
                <Text style={styles.floatingActionButtonText}>Archive</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedItem && (
        <Modal
          visible={showDetailsModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowDetailsModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Disruption Details</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowDetailsModal(false)}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.detailSection}>
                <View style={styles.detailHeader}>
                  <View style={[
                    styles.typeBadge,
                    { backgroundColor: DISRUPTION_TYPES[selectedItem.type]?.bgColor || '#F3F4F6' }
                  ]}>
                    <Ionicons 
                      name={DISRUPTION_TYPES[selectedItem.type]?.icon || 'help-circle'} 
                      size={16} 
                      color={DISRUPTION_TYPES[selectedItem.type]?.color || '#6B7280'} 
                    />
                    <Text style={[
                      styles.typeBadgeText,
                      { color: DISRUPTION_TYPES[selectedItem.type]?.color || '#6B7280' }
                    ]}>
                      {DISRUPTION_TYPES[selectedItem.type]?.label || selectedItem.type}
                    </Text>
                  </View>

                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: STATUS_CONFIG[selectedItem.status]?.bgColor || '#F3F4F6' }
                  ]}>
                    <Ionicons 
                      name={STATUS_CONFIG[selectedItem.status]?.icon || 'help-circle'} 
                      size={14} 
                      color={STATUS_CONFIG[selectedItem.status]?.color || '#6B7280'} 
                    />
                    <Text style={[
                      styles.statusBadgeText,
                      { color: STATUS_CONFIG[selectedItem.status]?.color || '#6B7280' }
                    ]}>
                      {STATUS_CONFIG[selectedItem.status]?.label || selectedItem.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.detailTitle}>{selectedItem.title}</Text>
                <Text style={styles.detailLocation}>📍 {selectedItem.location}</Text>
                
                {selectedItem.description && (
                  <Text style={styles.detailDescription}>{selectedItem.description}</Text>
                )}
              </View>

              {selectedItem.affectedRoutes && selectedItem.affectedRoutes.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Affected Routes</Text>
                  <View style={styles.routesList}>
                    {selectedItem.affectedRoutes.map((route, idx) => (
                      <View key={idx} style={styles.routeBadge}>
                        <Text style={styles.routeBadgeText}>{route}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Information</Text>
                <Text style={styles.detailText}>Created: {formatDateTimeUK(selectedItem.createdAt)}</Text>
                <Text style={styles.detailText}>Created by: {selectedItem.createdBy}</Text>
                {selectedItem.lastUpdated && (
                  <Text style={styles.detailText}>Last updated: {formatDateTimeUK(selectedItem.lastUpdated)}</Text>
                )}
                <Text style={styles.detailText}>Priority: {PRIORITY_LEVELS[selectedItem.priority]?.label || selectedItem.priority}</Text>
                {selectedItem.authority && (
                  <Text style={styles.detailText}>Authority: {selectedItem.authority}</Text>
                )}
                {selectedItem.startDate && (
                  <Text style={styles.detailText}>Start date: {formatDateUK(selectedItem.startDate)}</Text>
                )}
                {selectedItem.endDate && (
                  <Text style={styles.detailText}>End date: {formatDateUK(selectedItem.endDate)}</Text>
                )}
              </View>

              {/* Action buttons for roadworks */}
              {selectedItem.type === 'roadwork' && isLoggedIn && (
                <View style={styles.actionSection}>
                  <Text style={styles.sectionTitle}>Actions</Text>
                  <View style={styles.actionButtons}>
                    {selectedItem.status === 'reported' && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleTakeAction(selectedItem.id, 'assessing', 'Started assessment')}
                      >
                        <Text style={styles.actionButtonText}>Start Assessment</Text>
                      </TouchableOpacity>
                    )}
                    {selectedItem.status === 'assessing' && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleTakeAction(selectedItem.id, 'planning', 'Moved to planning')}
                      >
                        <Text style={styles.actionButtonText}>Move to Planning</Text>
                      </TouchableOpacity>
                    )}
                    {selectedItem.status === 'planning' && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleTakeAction(selectedItem.id, 'approved', 'Approved roadwork')}
                      >
                        <Text style={styles.actionButtonText}>Approve</Text>
                      </TouchableOpacity>
                    )}
                    {selectedItem.status === 'approved' && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleTakeAction(selectedItem.id, 'active', 'Roadwork now active')}
                      >
                        <Text style={styles.actionButtonText}>Mark Active</Text>
                      </TouchableOpacity>
                    )}
                    {selectedItem.status === 'active' && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleTakeAction(selectedItem.id, 'completed', 'Roadwork completed')}
                      >
                        <Text style={styles.actionButtonText}>Mark Completed</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </Modal>
      )}

      {/* Edit Modal */}
      <EditDisruptionModal
        visible={showEditModal}
        item={editingItem}
        onClose={() => {
          setShowEditModal(false);
          setEditingItem(null);
        }}
        onSave={handleSaveEdit}
        loading={loading}
      />

      {/* Bulk Status Modal */}
      <Modal
        visible={showBulkStatusModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBulkStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bulkActionModal}>
            <View style={styles.bulkModalHeader}>
              <Text style={styles.bulkModalTitle}>Update Status</Text>
              <TouchableOpacity
                onPress={() => setShowBulkStatusModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text style={styles.bulkModalSubtitle}>
              Change status for {selectedItems.length} selected items
            </Text>
            <View style={styles.bulkOptions}>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <TouchableOpacity
                  key={key}
                  style={styles.bulkOptionButton}
                  onPress={() => handleBulkStatusUpdate(key)}
                >
                  <View style={[styles.bulkOptionIcon, { backgroundColor: config.bgColor }]}>
                    <Ionicons name={config.icon} size={20} color={config.color} />
                  </View>
                  <Text style={styles.bulkOptionText}>{config.label}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Bulk Priority Modal */}
      <Modal
        visible={showBulkPriorityModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBulkPriorityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bulkActionModal}>
            <View style={styles.bulkModalHeader}>
              <Text style={styles.bulkModalTitle}>Update Priority</Text>
              <TouchableOpacity
                onPress={() => setShowBulkPriorityModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text style={styles.bulkModalSubtitle}>
              Change priority for {selectedItems.length} selected items
            </Text>
            <View style={styles.bulkOptions}>
              {Object.entries(PRIORITY_LEVELS).map(([key, config]) => (
                <TouchableOpacity
                  key={key}
                  style={styles.bulkOptionButton}
                  onPress={() => handleBulkPriorityUpdate(key)}
                >
                  <View style={[styles.bulkOptionIcon, { backgroundColor: config.bgColor }]}>
                    <Text style={[styles.bulkOptionIconText, { color: config.color }]}>
                      {key.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.bulkOptionText}>{config.label}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Unified Edit Modal Component
const EditDisruptionModal = ({ visible, item, onClose, onSave, loading }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (item && visible) {
      setFormData({
        title: item.title || '',
        location: item.location || '',
        description: item.description || '',
        priority: item.priority || 'medium',
        status: item.status || 'active',
        affectedRoutes: item.affectedRoutes || [],
        // Incident specific
        type: item.type === 'incident' ? item.title.split(' - ')[0] : '',
        subtype: item.subtype || '',
        severity: item.severity || 'Medium',
        // Roadwork specific
        authority: item.authority || '',
        startDate: item.startDate || '',
        endDate: item.endDate || ''
      });
    }
  }, [item, visible]);

  const handleSave = () => {
    if (!formData.title || !formData.location) {
      Alert.alert('Error', 'Title and location are required');
      return;
    }
    onSave(item.id, formData, item.type);
  };

  const handleAddRoute = () => {
    Alert.prompt(
      'Add Route',
      'Enter route number:',
      (route) => {
        if (route && route.trim()) {
          setFormData({
            ...formData,
            affectedRoutes: [...formData.affectedRoutes, route.trim()]
          });
        }
      }
    );
  };

  const handleRemoveRoute = (route) => {
    setFormData({
      ...formData,
      affectedRoutes: formData.affectedRoutes.filter(r => r !== route)
    });
  };

  if (!visible || !item) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Edit {item.type === 'incident' ? 'Incident' : 'Roadwork'}</Text>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Title */}
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Title *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder={item.type === 'incident' ? 
                "E.g., RTC - Newcastle Bridge Emergency" : 
                "E.g., Gas Works - City Centre Repairs"}
              placeholderTextColor="#9CA3AF"
            />
            <Text style={styles.inputHelp}>Give a descriptive title that explains what's happening</Text>
          </View>

          {/* Location */}
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Location *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
              placeholder="Street name or area"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Priority */}
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Priority Level</Text>
            <View style={styles.priorityButtons}>
              {['critical', 'high', 'medium', 'low', 'planned'].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.priorityButton,
                    formData.priority === level && styles.priorityButtonActive
                  ]}
                  onPress={() => setFormData({ ...formData, priority: level })}
                >
                  <Text style={[
                    styles.priorityButtonText,
                    formData.priority === level && styles.priorityButtonTextActive
                  ]}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Detailed description..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Status */}
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Status</Text>
            <View style={styles.statusButtons}>
              {['active', 'monitoring', 'completed', 'closed'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusButton,
                    formData.status === status && styles.statusButtonActive
                  ]}
                  onPress={() => setFormData({ ...formData, status })}
                >
                  <Text style={[
                    styles.statusButtonText,
                    formData.status === status && styles.statusButtonTextActive
                  ]}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Affected Routes */}
          <View style={styles.formSection}>
            <View style={styles.routesHeader}>
              <Text style={styles.formLabel}>Affected Routes</Text>
              <TouchableOpacity
                style={styles.addRouteButton}
                onPress={handleAddRoute}
              >
                <Ionicons name="add-circle" size={20} color="#3B82F6" />
                <Text style={styles.addRouteButtonText}>Add Route</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.routesList}>
              {formData.affectedRoutes?.map((route) => (
                <TouchableOpacity
                  key={route}
                  style={styles.editableRouteBadge}
                  onPress={() => handleRemoveRoute(route)}
                >
                  <Text style={styles.routeBadgeText}>{route}</Text>
                  <Ionicons name="close-circle" size={16} color="#DC2626" />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Roadwork specific fields */}
          {item.type === 'roadwork' && (
            <>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Authority/Organisation</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.authority}
                  onChangeText={(text) => setFormData({ ...formData, authority: text })}
                  placeholder="E.g., Newcastle City Council"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </>
          )}

          {/* Action Buttons */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.saveButton,
                (!formData.title || !formData.location) && styles.submitButtonDisabled
              ]}
              onPress={handleSave}
              disabled={!formData.title || !formData.location || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="save" size={20} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  unauthorizedTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  unauthorizedText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  refreshButton: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 10,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  tabContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  activeTab: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  disruptionsList: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  disruptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  incidentCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  roadworkCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  streetManagerCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
    backgroundColor: '#FEFFFE',
  },
  trafficCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeAndPriority: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  disruptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  disruptionLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  disruptionDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  routesContainer: {
    marginBottom: 8,
  },
  routesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  routesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  routeBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  routeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E40AF',
  },
  moreRoutesText: {
    fontSize: 11,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cardFooterLeft: {
    flex: 1,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  cardActionButton: {
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createdBy: {
    fontSize: 12,
    color: '#6B7280',
  },
  timeStamp: {
    fontSize: 12,
    color: '#6B7280',
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
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  detailLocation: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  detailDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  actionSection: {
    marginBottom: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Street Manager Professional Styles
  streetManagerInfo: {
    backgroundColor: '#F0FDF4',
    borderRadius: 6,
    padding: 10,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  timelineStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  timelineStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  authorityRefContainer: {
    marginBottom: 4,
  },
  authorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 2,
  },
  referenceText: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'System',
  },
  timingInfo: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  durationText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  dateText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  emergencyIndicator: {
    backgroundColor: '#FEE2E2',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  emergencyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  // Edit Modal Styles
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
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
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputHelp: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  priorityButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  priorityButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  priorityButtonTextActive: {
    color: '#FFFFFF',
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  statusButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  statusButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  statusButtonTextActive: {
    color: '#FFFFFF',
  },
  routesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addRouteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addRouteButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  editableRouteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
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
  saveButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  // Bulk selection styles
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectionModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  selectionModeActive: {
    backgroundColor: '#3B82F6',
  },
  selectionModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  selectionModeTextActive: {
    color: '#FFFFFF',
  },
  selectAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  selectedCard: {
    borderColor: '#3B82F6',
    borderWidth: 2,
    backgroundColor: '#EFF6FF',
  },
  checkboxContainer: {
    position: 'absolute',
    left: 16,
    top: 16,
    zIndex: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  // Floating action bar
  floatingActionBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  floatingActionContent: {
    padding: 16,
  },
  floatingActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 12,
  },
  floatingActions: {
    flexDirection: 'row',
    gap: 12,
  },
  floatingActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    borderRadius: 8,
  },
  floatingActionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  archiveButton: {
    backgroundColor: '#DC2626',
  },
  // Bulk action modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bulkActionModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  bulkModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  bulkModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  bulkModalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  bulkOptions: {
    paddingHorizontal: 20,
  },
  bulkOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  bulkOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bulkOptionIconText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  bulkOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
});

export default DisruptionDatabase;