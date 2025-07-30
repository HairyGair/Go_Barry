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
import { useSupervisor } from './hooks/useSupervisorSession';
import useConvexSync from '../hooks/useConvexSync';
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
// Test data utilities removed during cleanup

const DisruptionDatabase = ({ baseUrl, onBack }) => {
  const {
    isLoggedIn,
    supervisorName,
    supervisorRole,
    sessionId,
    isAdmin
  } = useSupervisor();

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
  
  // Test mode states
  const [testMode, setTestMode] = useState(false);
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

  useEffect(() => {
    if (isLoggedIn) {
      loadRoadworks();
    }
  }, [isLoggedIn]);
  
  // Initialize test data
  useEffect(() => {
    if (testMode) {
      // Generate simple test disruptions inline
      const mockDisruptions = [
        {
          id: 'test-1',
          location: 'Test Location 1',
          description: 'Test roadwork 1',
          impact: 'MODERATE',
          status: 'ACTIVE',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          permitReference: 'TEST-001'
        },
        {
          id: 'test-2',
          location: 'Test Location 2',
          description: 'Test roadwork 2',
          impact: 'SEVERE',
          status: 'ACTIVE',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          permitReference: 'TEST-002'
        }
      ];
      setTestDisruptions(mockDisruptions);
    }
  }, [testMode]);

  const loadRoadworks = async () => {
    setLoading(true);
    try {
      // TEMPORARILY DISABLED: Return empty data to clear disruption database
      // User requested all information removed from Disruption Database
      console.log('Disruption Database: Cleared all data as requested');
      setRoadworks([]);
    } catch (error) {
      console.error('Error in loadRoadworks:', error);
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

  // Export functionality
  const handleExport = async (format, includeFilters = false) => {
    try {
      setExportLoading(true);
      
      // Get data to export
      let dataToExport;
      if (selectedItems.length > 0) {
        // Export selected items
        const allDisruptions = getAllDisruptions();
        dataToExport = allDisruptions.filter(item => 
          selectedItems.includes(`${item.type}-${item.id}`)
        );
      } else if (includeFilters) {
        // Export filtered data
        dataToExport = getFilteredDisruptions();
      } else {
        // Export all data
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
      const filename = `gobarry_disruptions_${scope}_${timestamp}`;
      
      // Perform export
      await exportDisruptions(dataToExport, format, filename);
      
      // Success feedback
      const exportType = format.toUpperCase();
      const itemCount = dataToExport.length;
      
      if (Platform.OS === 'web') {
        // Web-specific success message
        Alert.alert(
          'Export Started', 
          `${exportType} export initiated for ${itemCount} disruption${itemCount > 1 ? 's' : ''}. ` +
          `${format === 'pdf' ? 'A new tab will open with the report.' : 'The file will download shortly.'}`
        );
      } else {
        Alert.alert(
          'Export Successful', 
          `Exported ${itemCount} disruption${itemCount > 1 ? 's' : ''} to ${exportType} format`
        );
      }
      
      // Close export modal and exit selection mode
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
      
      // Get disruption data to communicate about
      let disruptionData;
      if (selectedItems.length === 1) {
        // Single item communication
        const allDisruptions = getAllDisruptions();
        disruptionData = allDisruptions.find(item => 
          selectedItems.includes(`${item.type}-${item.id}`)
        );
      } else if (selectedItems.length > 1) {
        // Multiple items - create summary
        const allDisruptions = getAllDisruptions();
        const selectedDisruptions = allDisruptions.filter(item => 
          selectedItems.includes(`${item.type}-${item.id}`)
        );
        disruptionData = createCommunicationSummary(selectedDisruptions);
      } else {
        Alert.alert('No Selection', 'Please select at least one disruption to communicate about');
        return;
      }
      
      if (!disruptionData) {
        Alert.alert('Error', 'Could not find disruption data');
        return;
      }
      
      // Prepare communication channels
      const channels = selectedChannels.map(channelType => ({
        type: channelType,
        name: COMMUNICATION_CHANNELS[channelType].name,
        recipients: channelType === 'email' ? ['control.room@gonortheast.co.uk'] : []
      }));
      
      if (channels.length === 0) {
        Alert.alert('No Channels', 'Please select at least one communication channel');
        return;
      }
      
      // Distribute message
      const results = await distributeMessage(channels, disruptionData, communicationTemplate);
      
      // Show results
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      if (successCount > 0) {
        const successMessage = failCount > 0 ?
          `Successfully sent to ${successCount} channel${successCount > 1 ? 's' : ''}, ${failCount} failed.` :
          `Successfully sent to ${successCount} channel${successCount > 1 ? 's' : ''}.`;
          
        Alert.alert(
          'Communication Sent',
          successMessage + '\n\n' +
          (selectedChannels.includes('email') ? 'Email: Opens your default email client\n' : '') +
          (selectedChannels.includes('twitter') ? 'Twitter: Opens in new tab\n' : '') +
          (selectedChannels.includes('facebook') ? 'Facebook: Opens in new tab\n' : '') +
          (selectedChannels.includes('teams') ? 'Teams: Opens Teams web app' : '')
        );
      } else {
        Alert.alert(
          'Communication Failed', 
          'Failed to send to any channels. Please check your popup blocker settings and try again.'
        );
      }
      
      // Close modal and reset
      setShowCommunicationModal(false);
      resetCommunicationState();
      
    } catch (error) {
      Alert.alert('Communication Error', error.message || 'An error occurred while sending communications');
    } finally {
      setCommunicationLoading(false);
    }
  };
  
  const createCommunicationSummary = (disruptions) => {
    const typeCount = {};
    const priorityCount = {};
    const affectedRoutes = new Set();
    
    disruptions.forEach(d => {
      typeCount[d.type] = (typeCount[d.type] || 0) + 1;
      priorityCount[d.priority] = (priorityCount[d.priority] || 0) + 1;
      d.affectedRoutes?.forEach(route => affectedRoutes.add(route));
    });
    
    const summary = {
      id: 'summary',
      type: 'multiple disruptions',
      title: `${disruptions.length} Active Disruptions`,
      location: `Multiple locations (${disruptions.length} total)`,
      status: 'active',
      priority: Object.keys(priorityCount).includes('critical') ? 'critical' : 'high',
      description: `Summary of ${disruptions.length} disruptions: ` +
                  Object.entries(typeCount).map(([type, count]) => `${count} ${type}`).join(', '),
      affectedRoutes: Array.from(affectedRoutes),
      createdAt: new Date().toISOString(),
      createdBy: supervisorName || 'System',
      lastUpdated: new Date().toISOString()
    };
    
    return summary;
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
      type: roadwork.type || 'roadwork', // Preserve original type (including 'streetmanager')
      title: roadwork.title,
      location: roadwork.location,
      description: roadwork.description,
      status: roadwork.status,
      priority: roadwork.priority,
      affectedRoutes: roadwork.affectedRoutes || [],
      createdAt: roadwork.createdAt,
      createdBy: roadwork.createdBy,
      lastUpdated: roadwork.lastUpdated,
      source: roadwork.source || 'roadwork', // Preserve source information
      authority: roadwork.authority,
      startDate: roadwork.startDate,
      endDate: roadwork.endDate
    }));
  };

  // Combine and filter all disruptions
  const getAllDisruptions = () => {
    if (testMode) {
      return testDisruptions;
    }
    
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
  // Calculate counts for all disruption types including StreetManager
  const activeCount = allDisruptions.filter(item => ['active', 'monitoring'].includes(item.status)).length;
  const incidentCount = allDisruptions.filter(item => item.type === 'incident').length;
  const roadworkCount = allDisruptions.filter(item => item.type === 'roadwork').length;
  const streetManagerCount = allDisruptions.filter(item => item.type === 'streetmanager').length;
  const actionNeededCount = allDisruptions.filter(item => ['reported', 'assessing'].includes(item.status)).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {onBack && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              accessibilityLabel="Go back to Disruptions"
            >
              <Ionicons name="arrow-back" size={20} color="#3B82F6" />
              <Text style={styles.backButtonText}>Disruptions</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.title}>Disruption Database</Text>
          <Text style={styles.subtitle}>
            {selectionMode ? `${selectedItems.length} selected` : 'All roadworks and incidents in one place'}
          </Text>
        </View>
        
        <View style={styles.headerActions}>
          {testMode && (
            <View style={styles.testModeBadge}>
              <Text style={styles.testModeBadgeText}>TEST MODE</Text>
            </View>
          )}
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
            style={[styles.testModeButton, testMode && styles.testModeActive]}
            onPress={() => setTestMode(!testMode)}
          >
            <Ionicons name="flask" size={16} color={testMode ? "#FFFFFF" : "#8B5CF6"} />
            <Text style={[styles.testModeText, testMode && styles.testModeTextActive]}>
              {testMode ? 'Test' : 'Live'}
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
            style={[styles.tab, activeTab === 'streetmanager' && styles.activeTab]}
            onPress={() => setActiveTab('streetmanager')}
          >
            <Text style={[styles.tabText, activeTab === 'streetmanager' && styles.activeTabText]}>
              StreetManager ({streetManagerCount})
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
              <Text style={styles.bulkModalTitle}>Export Disruptions</Text>
              <TouchableOpacity
                onPress={() => setShowExportModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.exportContent}>
              <Text style={styles.exportSubtitle}>
                {selectedItems.length > 0 
                  ? `Export ${selectedItems.length} selected items`
                  : `Export all ${getFilteredDisruptions().length} disruptions`
                }
              </Text>
              
              {/* Export Summary */}
              <View style={styles.exportSummary}>
                <Text style={styles.exportSummaryTitle}>Export Summary</Text>
                {(() => {
                  const dataToSummarize = selectedItems.length > 0 
                    ? getAllDisruptions().filter(item => selectedItems.includes(`${item.type}-${item.id}`))
                    : getFilteredDisruptions();
                  const summary = generateExportSummary(dataToSummarize);
                  
                  return (
                    <View style={styles.summaryStats}>
                      <Text style={styles.summaryText}>Total: {summary.total}</Text>
                      <Text style={styles.summaryText}>
                        Types: {Object.entries(summary.byType)
                          .map(([type, count]) => `${type} (${count})`)
                          .join(', ')}
                      </Text>
                      <Text style={styles.summaryText}>
                        Statuses: {Object.entries(summary.byStatus)
                          .map(([status, count]) => `${status} (${count})`)
                          .join(', ')}
                      </Text>
                    </View>
                  );
                })()}
              </View>
              
              {/* Export Format Options */}
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
                  <Text style={styles.exportLoadingText}>Preparing export...</Text>
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
              <Text style={styles.bulkModalTitle}>Share Disruption Updates</Text>
              <TouchableOpacity
                onPress={() => setShowCommunicationModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.communicationContent}>
              <Text style={styles.exportSubtitle}>
                {selectedItems.length === 1 
                  ? 'Share information about the selected disruption'
                  : selectedItems.length > 1
                  ? `Share summary of ${selectedItems.length} selected disruptions`
                  : 'No disruptions selected'}
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
              
              {/* Stakeholder Groups */}
              <View style={styles.communicationSection}>
                <Text style={styles.communicationSectionTitle}>Who to Notify</Text>
                <View style={styles.stakeholderGrid}>
                  {Object.entries(STAKEHOLDER_GROUPS).map(([key, group]) => (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.stakeholderOption,
                        selectedStakeholders.includes(key) && styles.stakeholderOptionSelected
                      ]}
                      onPress={() => toggleStakeholder(key)}
                    >
                      <View style={[
                        styles.stakeholderCheckbox,
                        selectedStakeholders.includes(key) && styles.stakeholderCheckboxSelected
                      ]}>
                        {selectedStakeholders.includes(key) && (
                          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                        )}
                      </View>
                      <View style={styles.stakeholderInfo}>
                        <Text style={styles.stakeholderName}>{group.name}</Text>
                        <Text style={styles.stakeholderDescription}>{group.description}</Text>
                        <Text style={styles.stakeholderChannels}>
                          Via: {group.channels.join(', ')}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
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
              
              {/* Preview */}
              {selectedItems.length > 0 && selectedChannels.length > 0 && (
                <View style={styles.communicationSection}>
                  <Text style={styles.communicationSectionTitle}>Preview</Text>
                  <View style={styles.previewContainer}>
                    {(() => {
                      try {
                        const sampleDisruption = getAllDisruptions().find(item => 
                          selectedItems.includes(`${item.type}-${item.id}`)
                        ) || createCommunicationSummary(getAllDisruptions().filter(item => 
                          selectedItems.includes(`${item.type}-${item.id}`)
                        ));
                        
                        if (selectedChannels.includes('email')) {
                          const emailContent = generateEmailContent(communicationTemplate, sampleDisruption);
                          return (
                            <View style={styles.previewSection}>
                              <Text style={styles.previewLabel}>Email Preview:</Text>
                              <Text style={styles.previewSubject}>Subject: {emailContent.subject}</Text>
                              <Text style={styles.previewBody}>{emailContent.body.substring(0, 200)}...</Text>
                            </View>
                          );
                        } else if (selectedChannels.includes('twitter')) {
                          const twitterContent = generateSocialContent('twitter', communicationTemplate, sampleDisruption);
                          return (
                            <View style={styles.previewSection}>
                              <Text style={styles.previewLabel}>Twitter Preview:</Text>
                              <Text style={styles.previewBody}>{twitterContent}</Text>
                            </View>
                          );
                        }
                      } catch (error) {
                        return (
                          <Text style={styles.previewError}>Preview unavailable</Text>
                        );
                      }
                    })()}
                  </View>
                </View>
              )}
              
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
                        Send to {selectedChannels.length} Channel{selectedChannels.length !== 1 ? 's' : ''}
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
  // Export modal styles
  exportModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  exportContent: {
    paddingHorizontal: 20,
  },
  exportSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  exportSummary: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  exportSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  summaryStats: {
    gap: 4,
  },
  summaryText: {
    fontSize: 14,
    color: '#6B7280',
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
  // Test mode styles
  testModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  testModeActive: {
    backgroundColor: '#8B5CF6',
  },
  testModeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  testModeTextActive: {
    color: '#FFFFFF',
  },
  testModeBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  testModeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  // Communication modal styles
  communicationModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '95%',
  },
  communicationContent: {
    paddingHorizontal: 20,
    maxHeight: '100%',
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
  stakeholderGrid: {
    gap: 8,
  },
  stakeholderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  stakeholderOptionSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  stakeholderCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stakeholderCheckboxSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  stakeholderInfo: {
    flex: 1,
  },
  stakeholderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  stakeholderDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  stakeholderChannels: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
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
  previewContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
  },
  previewSection: {
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  previewSubject: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  previewBody: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  previewError: {
    fontSize: 12,
    color: '#DC2626',
    fontStyle: 'italic',
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
  communicateButton: {
    backgroundColor: '#8B5CF6',
  },
});

export default DisruptionDatabase;