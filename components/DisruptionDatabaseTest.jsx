/**
 * Test version of Disruption Database with authentication bypassed
 * For development testing of Phase 1 features
 */

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
import { formatDateUK, formatTime24, formatDateTimeUK } from '../utils/dateTime';
import { exportDisruptions, EXPORT_FORMATS, generateExportSummary } from '../utils/exportUtils';
import { 
  COMMUNICATION_CHANNELS, 
  STAKEHOLDER_GROUPS, 
  COMMUNICATION_WORKFLOWS,
  distributeMessage,
  generateEmailContent,
  generateSocialContent,
  sendEmail,
  shareOnTwitter,
  shareOnFacebook,
  shareOnTeams
} from '../utils/communicationUtils';
import { generateTestDisruptions, getTestSummary } from '../utils/testData';

const DisruptionDatabaseTest = ({ baseUrl, onBack }) => {
  // Mock authentication for testing
  const mockAuth = {
    isLoggedIn: true,
    supervisorName: 'Test User',
    supervisorRole: 'Inspector', 
    sessionId: 'test-session-123',
    isAdmin: true
  };

  const {
    isLoggedIn,
    supervisorName,
    supervisorRole,
    sessionId,
    isAdmin
  } = mockAuth;

  // Mock Convex data for testing
  const mockConvexData = {
    activeIncidents: [],
    allIncidents: []
  };

  const { activeIncidents, allIncidents } = mockConvexData;

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
  
  // Export states
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  
  // Communication states
  const [showCommunicationModal, setShowCommunicationModal] = useState(false);
  const [communicationLoading, setCommunicationLoading] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [selectedStakeholders, setSelectedStakeholders] = useState([]);
  const [communicationTemplate, setCommunicationTemplate] = useState('disruption_alert');
  const [customMessage, setCustomMessage] = useState('');
  
  // Test mode states - AUTO ENABLED for testing
  const [testMode, setTestMode] = useState(true);
  const [testDisruptions, setTestDisruptions] = useState([]);

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

  // Initialize test data automatically
  useEffect(() => {
    console.log('🧪 TEST MODE: Auto-loading test disruptions');
    setTestDisruptions(generateTestDisruptions());
  }, []);
  
  const loadRoadworks = async () => {
    console.log('🔄 Mock loadRoadworks called');
    // In test mode, we don't need to load real data
    setLoading(false);
  };

  const handleRefresh = async () => {
    console.log('🔄 Mock refresh called');
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setRefreshing(false);
      if (selectionMode) {
        setSelectionMode(false);
        setSelectedItems([]);
      }
    }, 1000);
  };

  // Bulk selection handlers
  const toggleSelectionMode = () => {
    console.log('📋 Toggle selection mode:', !selectionMode);
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

  // Get formatted test data
  const getAllDisruptions = () => {
    return testDisruptions;
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

    return filtered;
  };

  // Export functionality
  const handleExport = async (format, includeFilters = false) => {
    try {
      setExportLoading(true);
      
      // Get data to export
      let dataToExport;
      if (selectedItems.length > 0) {
        const allDisruptions = getAllDisruptions();
        dataToExport = allDisruptions.filter(item => 
          selectedItems.includes(`${item.type}-${item.id}`)
        );
      } else if (includeFilters) {
        dataToExport = getFilteredDisruptions();
      } else {
        dataToExport = getAllDisruptions();
      }
      
      if (dataToExport.length === 0) {
        Alert.alert('No Data', 'No data available to export');
        return;
      }
      
      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const scope = selectedItems.length > 0 ? 'selected' : 
                   includeFilters ? `filtered_${activeTab}` : 'all';
      const filename = `gobarry_test_disruptions_${scope}_${timestamp}`;
      
      // Perform export
      await exportDisruptions(dataToExport, format, filename);
      
      // Success feedback
      const exportType = format.toUpperCase();
      const itemCount = dataToExport.length;
      
      Alert.alert(
        'Test Export Successful', 
        `🧪 TEST MODE: Exported ${itemCount} disruption${itemCount > 1 ? 's' : ''} to ${exportType} format.\n\n` +
        `This was a test export using sample data.`
      );
      
      setShowExportModal(false);
      if (selectedItems.length > 0) {
        setSelectedItems([]);
        setSelectionMode(false);
      }
      
    } catch (error) {
      Alert.alert('Export Failed', error.message || 'An error occurred during export');
    } finally {
      setExportLoading(false);
    }
  };

  // Communication functionality  
  const handleCommunication = async () => {
    try {
      setCommunicationLoading(true);
      
      if (selectedItems.length === 0) {
        Alert.alert('No Selection', 'Please select at least one disruption to communicate about');
        return;
      }
      
      // Get disruption data
      const allDisruptions = getAllDisruptions();
      const selectedDisruptions = allDisruptions.filter(item => 
        selectedItems.includes(`${item.type}-${item.id}`)
      );
      
      const disruptionData = selectedDisruptions.length === 1 ? 
        selectedDisruptions[0] : 
        createCommunicationSummary(selectedDisruptions);
      
      if (selectedChannels.length === 0) {
        Alert.alert('No Channels', 'Please select at least one communication channel');
        return;
      }
      
      // Simulate communication
      Alert.alert(
        'Test Communication Sent',
        `🧪 TEST MODE: Would send ${communicationTemplate} about "${disruptionData.title}" via:\n\n` +
        selectedChannels.map(ch => `• ${COMMUNICATION_CHANNELS[ch].name}`).join('\n') +
        `\n\nThis was a test communication using sample data.`
      );
      
      setShowCommunicationModal(false);
      resetCommunicationState();
      
    } catch (error) {
      Alert.alert('Communication Error', error.message);
    } finally {
      setCommunicationLoading(false);
    }
  };

  const createCommunicationSummary = (disruptions) => {
    return {
      id: 'summary',
      type: 'multiple disruptions',
      title: `${disruptions.length} Active Disruptions`,
      location: `Multiple locations (${disruptions.length} total)`,
      status: 'active',
      priority: 'high',
      description: `Summary of ${disruptions.length} test disruptions`,
      affectedRoutes: ['Q1', 'Q2', '12', '21'],
      createdAt: new Date().toISOString(),
      createdBy: 'Test User',
      lastUpdated: new Date().toISOString()
    };
  };

  const resetCommunicationState = () => {
    setSelectedChannels([]);
    setSelectedStakeholders([]);
    setCommunicationTemplate('disruption_alert');
    setCustomMessage('');
  };

  const toggleChannel = (channel) => {
    setSelectedChannels(prev => 
      prev.includes(channel) 
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };

  const toggleStakeholder = (stakeholder) => {
    setSelectedStakeholders(prev => {
      const newSelection = prev.includes(stakeholder) 
        ? prev.filter(s => s !== stakeholder)
        : [...prev, stakeholder];
      
      // Auto-select channels based on stakeholder groups
      if (!prev.includes(stakeholder)) {
        const stakeholderConfig = STAKEHOLDER_GROUPS[stakeholder];
        if (stakeholderConfig) {
          const autoChannels = stakeholderConfig.channels.filter(c => 
            COMMUNICATION_CHANNELS[c] && COMMUNICATION_CHANNELS[c].available
          );
          setSelectedChannels(current => 
            [...new Set([...current, ...autoChannels])]
          );
        }
      }
      
      return newSelection;
    });
  };

  const filteredDisruptions = getFilteredDisruptions();
  const allDisruptions = getAllDisruptions();
  
  // Calculate stats
  const activeCount = allDisruptions.filter(item => ['active', 'monitoring'].includes(item.status)).length;
  const incidentCount = allDisruptions.filter(item => item.type === 'incident').length;
  const roadworkCount = allDisruptions.filter(item => item.type === 'roadwork').length;
  const actionNeededCount = allDisruptions.filter(item => ['reported', 'assessing'].includes(item.status)).length;

  return (
    <View style={styles.container}>
      {/* Test Mode Header */}
      <View style={styles.testModeHeader}>
        <Text style={styles.testModeHeaderText}>
          🧪 TEST MODE - Phase 1 Feature Testing
        </Text>
        <Text style={styles.testModeSubtext}>
          Export & Communication Features • {allDisruptions.length} Sample Disruptions
        </Text>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {onBack && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={20} color="#3B82F6" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.title}>Disruption Database (Test)</Text>
          <Text style={styles.subtitle}>
            {selectionMode ? `${selectedItems.length} selected` : 'Testing Phase 1 implementation'}
          </Text>
        </View>
        
        <View style={styles.headerActions}>
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
            placeholder="Search test disruptions..."
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
        </ScrollView>
      </View>

      {/* Disruptions List */}
      <ScrollView 
        style={styles.disruptionsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredDisruptions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="flask" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Test Data Found</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Try adjusting your search terms' : 'Test data should load automatically'}
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
                  selectionMode && isSelected && styles.selectedCard
                ]}
                onPress={() => {
                  if (selectionMode) {
                    toggleItemSelection(item.id, item.type);
                  } else {
                    Alert.alert('Test Item', `This is test data: ${item.title}`);
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
                      { backgroundColor: PRIORITY_LEVELS[item.priority]?.bgColor || '#F3F4F6' }
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
              {selectedItems.length} test item{selectedItems.length > 1 ? 's' : ''} selected
            </Text>
            <View style={styles.floatingActions}>
              <TouchableOpacity
                style={styles.floatingActionButton}
                onPress={() => setShowExportModal(true)}
              >
                <Ionicons name="download" size={20} color="#FFFFFF" />
                <Text style={styles.floatingActionButtonText}>Export</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.floatingActionButton, styles.communicateButton]}
                onPress={() => setShowCommunicationModal(true)}
              >
                <Ionicons name="megaphone" size={20} color="#FFFFFF" />
                <Text style={styles.floatingActionButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Export Modal */}
      <Modal
        visible={showExportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowExportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.exportModal}>
            <View style={styles.bulkModalHeader}>
              <Text style={styles.bulkModalTitle}>Export Test Data</Text>
              <TouchableOpacity
                onPress={() => setShowExportModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.exportContent}>
              <Text style={styles.exportSubtitle}>
                🧪 Test Mode: Export {selectedItems.length} selected test disruptions
              </Text>
              
              <Text style={styles.exportOptionsTitle}>Choose Export Format:</Text>
              <View style={styles.exportOptions}>
                <TouchableOpacity
                  style={styles.exportOptionButton}
                  onPress={() => handleExport(EXPORT_FORMATS.CSV, true)}
                  disabled={exportLoading}
                >
                  <View style={[styles.bulkOptionIcon, { backgroundColor: '#F0FDF4' }]}>
                    <Ionicons name="document-text" size={20} color="#16A34A" />
                  </View>
                  <View style={styles.exportOptionText}>
                    <Text style={styles.exportOptionTitle}>CSV Spreadsheet</Text>
                    <Text style={styles.exportOptionSubtitle}>Excel-compatible format</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.exportOptionButton}
                  onPress={() => handleExport(EXPORT_FORMATS.EXCEL, true)}
                  disabled={exportLoading}
                >
                  <View style={[styles.bulkOptionIcon, { backgroundColor: '#FFF7ED' }]}>
                    <Ionicons name="grid" size={20} color="#EA580C" />
                  </View>
                  <View style={styles.exportOptionText}>
                    <Text style={styles.exportOptionTitle}>Excel Workbook</Text>
                    <Text style={styles.exportOptionSubtitle}>Formatted with styles</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.exportOptionButton}
                  onPress={() => handleExport(EXPORT_FORMATS.PDF, true)}
                  disabled={exportLoading}
                >
                  <View style={[styles.bulkOptionIcon, { backgroundColor: '#FEF2F2' }]}>
                    <Ionicons name="document" size={20} color="#DC2626" />
                  </View>
                  <View style={styles.exportOptionText}>
                    <Text style={styles.exportOptionTitle}>PDF Report</Text>
                    <Text style={styles.exportOptionSubtitle}>Print-ready format</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              
              {exportLoading && (
                <View style={styles.exportLoading}>
                  <ActivityIndicator size="small" color="#3B82F6" />
                  <Text style={styles.exportLoadingText}>Preparing test export...</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Communication Modal */}
      <Modal
        visible={showCommunicationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCommunicationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.communicationModal}>
            <View style={styles.bulkModalHeader}>
              <Text style={styles.bulkModalTitle}>Share Test Data</Text>
              <TouchableOpacity
                onPress={() => setShowCommunicationModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.communicationContent}>
              <Text style={styles.exportSubtitle}>
                🧪 Test Mode: Share information about {selectedItems.length} selected test disruptions
              </Text>
              
              {/* Template Selection */}
              <View style={styles.communicationSection}>
                <Text style={styles.communicationSectionTitle}>Message Type</Text>
                <View style={styles.templateOptions}>
                  <TouchableOpacity
                    style={[
                      styles.templateOption,
                      communicationTemplate === 'disruption_alert' && styles.templateOptionSelected
                    ]}
                    onPress={() => setCommunicationTemplate('disruption_alert')}
                  >
                    <Text style={[
                      styles.templateOptionText,
                      communicationTemplate === 'disruption_alert' && styles.templateOptionTextSelected
                    ]}>New Alert</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.templateOption,
                      communicationTemplate === 'status_update' && styles.templateOptionSelected
                    ]}
                    onPress={() => setCommunicationTemplate('status_update')}
                  >
                    <Text style={[
                      styles.templateOptionText,
                      communicationTemplate === 'status_update' && styles.templateOptionTextSelected
                    ]}>Status Update</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Communication Channels */}
              <View style={styles.communicationSection}>
                <Text style={styles.communicationSectionTitle}>Communication Channels</Text>
                <View style={styles.channelGrid}>
                  {Object.entries(COMMUNICATION_CHANNELS)
                    .filter(([key, channel]) => channel.available)
                    .map(([key, channel]) => (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.channelOption,
                        selectedChannels.includes(key) && styles.channelOptionSelected,
                        { borderColor: channel.color }
                      ]}
                      onPress={() => toggleChannel(key)}
                    >
                      <View style={[styles.channelIcon, { backgroundColor: channel.color }]}>
                        <Ionicons name={channel.icon} size={20} color="#FFFFFF" />
                      </View>
                      <Text style={styles.channelName}>{channel.name}</Text>
                      <Text style={styles.channelDescription}>{channel.description}</Text>
                      {selectedChannels.includes(key) && (
                        <View style={styles.channelSelected}>
                          <Ionicons name="checkmark-circle" size={16} color={channel.color} />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              {/* Send Button */}
              <View style={styles.communicationActions}>
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (selectedItems.length === 0 || selectedChannels.length === 0 || communicationLoading) && 
                    styles.sendButtonDisabled
                  ]}
                  onPress={handleCommunication}
                  disabled={selectedItems.length === 0 || selectedChannels.length === 0 || communicationLoading}
                >
                  {communicationLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="send" size={20} color="#FFFFFF" />
                      <Text style={styles.sendButtonText}>
                        Test Send to {selectedChannels.length} Channel{selectedChannels.length !== 1 ? 's' : ''}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  testModeHeader: {
    backgroundColor: '#1E40AF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  testModeHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  testModeSubtext: {
    fontSize: 12,
    color: '#DBEAFE',
    marginTop: 4,
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
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
  createdBy: {
    fontSize: 12,
    color: '#6B7280',
  },
  timeStamp: {
    fontSize: 12,
    color: '#6B7280',
  },
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
  communicateButton: {
    backgroundColor: '#8B5CF6',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  exportModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  communicationModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '95%',
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
  modalCloseButton: {
    padding: 4,
  },
  exportContent: {
    paddingHorizontal: 20,
  },
  communicationContent: {
    paddingHorizontal: 20,
    maxHeight: '100%',
  },
  exportSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  exportOptionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  exportOptions: {
    gap: 8,
  },
  exportOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bulkOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  exportOptionText: {
    flex: 1,
    marginLeft: 12,
  },
  exportOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  exportOptionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  exportLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  exportLoadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  communicationSection: {
    marginBottom: 24,
  },
  communicationSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  templateOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  templateOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  templateOptionSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  templateOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  templateOptionTextSelected: {
    color: '#FFFFFF',
  },
  channelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  channelOption: {
    width: '48%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    position: 'relative',
  },
  channelOptionSelected: {
    backgroundColor: '#F8FAFC',
  },
  channelIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  channelName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 2,
  },
  channelDescription: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  channelSelected: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  communicationActions: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sendButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DisruptionDatabaseTest;