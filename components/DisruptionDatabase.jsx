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
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('priority');
  const [sortDirection, setSortDirection] = useState('asc');

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
          <Text style={styles.subtitle}>All roadworks and incidents in one place</Text>
        </View>
        
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
          filteredDisruptions.map((item, index) => (
            <TouchableOpacity
              key={`${item.type}-${item.id}`}
              style={[
                styles.disruptionCard,
                item.type === 'incident' && styles.incidentCard,
                item.type === 'roadwork' && styles.roadworkCard,
                item.type === 'streetmanager' && styles.streetManagerCard,
                item.type === 'traffic' && styles.trafficCard
              ]}
              onPress={() => {
                setSelectedItem(item);
                setShowDetailsModal(true);
              }}
            >
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
                <Text style={styles.createdBy}>
                  Created by {item.createdBy}
                </Text>
                <Text style={styles.timeStamp}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

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
    </View>
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
});

export default DisruptionDatabase;