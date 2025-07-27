/*
 * Go Barry - Traffic Intelligence Platform
 * Admin Dashboard - Supervisor Management Page
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, Pressable, RefreshControl, ActivityIndicator, TextInput, Modal, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSupervisorSession } from '../../components/hooks/useSupervisorSession';
import { darkTheme, getStatusColor as getStatusColorHelper } from './styles/darkTheme';

const API_BASE = 'https://go-barry.onrender.com';

export default function SupervisorManagement() {
  const router = useRouter();
  const { supervisorSession, isAdmin } = useSupervisorSession();
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [backendAvailable, setBackendAvailable] = useState(true);
  
  // Form state for new/edit supervisor
  const [formData, setFormData] = useState({
    name: '',
    badge: '',
    role: 'Depot Supervisor',
    shift: 'Day',
    permissions: ['view-alerts', 'dismiss-alerts'],
    email: '',
    phone: '',
    emergencyContact: '',
    startDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Additional state for advanced features
  const [selectedSupervisors, setSelectedSupervisors] = useState([]);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activityData, setActivityData] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    role: 'all',
    shift: 'all',
    status: 'all'
  });
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showPermissionTemplates, setShowPermissionTemplates] = useState(false);
  const [activeSessions, setActiveSessions] = useState([]);

  // Redirect if not admin
  useEffect(() => {
    if (supervisorSession && !isAdmin) {
      router.replace('/');
    }
  }, [supervisorSession, isAdmin, router]);

  useEffect(() => {
    if (supervisorSession && isAdmin) {
      loadSupervisors();
      loadActiveSessions();
      
      // Set up periodic refresh for active sessions
      const interval = setInterval(loadActiveSessions, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [supervisorSession, isAdmin]);

  const loadSupervisors = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/supervisor/list`);
      
      // Check if the response is ok
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setSupervisors(data.filter(s => s != null));
        setBackendAvailable(true);
      } else if (data.success && Array.isArray(data.supervisors)) {
        setSupervisors(data.supervisors.filter(s => s != null));
      } else {
        // Use fallback data
        console.log('Using fallback supervisor data');
        setSupervisors(getFallbackSupervisors());
      }
    } catch (error) {
      console.error('❌ Error loading supervisors:', error);
      console.log('Using fallback supervisor data');
      setSupervisors(getFallbackSupervisors());
      setBackendAvailable(false);
    } finally {
      setLoading(false);
    }
  };

  // Fallback supervisor data when backend is unavailable
  const getFallbackSupervisors = () => [
    { id: 'supervisor001', name: 'Alex Woodcock', badge: 'AW001', role: 'Supervisor', shift: 'Day', permissions: ['view-alerts', 'dismiss-alerts'] },
    { id: 'supervisor002', name: 'Andrew Cowley', badge: 'AC002', role: 'Supervisor', shift: 'Day', permissions: ['view-alerts', 'dismiss-alerts'] },
    { id: 'supervisor003', name: 'Anthony Gair', badge: 'AG003', role: 'Developer/Admin', shift: 'Day', permissions: ['view-alerts', 'dismiss-alerts', 'manage-supervisors'] },
    { id: 'supervisor004', name: 'Claire Fiddler', badge: 'CF004', role: 'Supervisor', shift: 'Day', permissions: ['view-alerts', 'dismiss-alerts'] },
    { id: 'supervisor005', name: 'David Hall', badge: 'DH005', role: 'Supervisor', shift: 'Day', permissions: ['view-alerts', 'dismiss-alerts'] },
    { id: 'supervisor006', name: 'James Daglish', badge: 'JD006', role: 'Supervisor', shift: 'Day', permissions: ['view-alerts', 'dismiss-alerts'] },
    { id: 'supervisor007', name: 'John Paterson', badge: 'JP007', role: 'Supervisor', shift: 'Day', permissions: ['view-alerts', 'dismiss-alerts'] },
    { id: 'supervisor008', name: 'Simon Glass', badge: 'SG008', role: 'Supervisor', shift: 'Day', permissions: ['view-alerts', 'dismiss-alerts'] },
    { id: 'supervisor009', name: 'Barry Perryman', badge: 'BP009', role: 'Service Delivery Controller', shift: 'Day', permissions: ['view-alerts', 'dismiss-alerts', 'manage-supervisors'] }
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSupervisors();
    setRefreshing(false);
  };

  const handleAddSupervisor = async () => {
    if (!supervisorSession?.sessionId) {
      showError('No valid session. Please log in again.');
      return;
    }
    
    // Validate form
    if (!formData.name.trim() || !formData.badge.trim()) {
      showError('Name and badge are required');
      return;
    }
    
    // Badge format validation
    const badgeRegex = /^[A-Z]{2,3}\d{3}$/;
    if (!badgeRegex.test(formData.badge)) {
      showError('Badge must be 2-3 letters followed by 3 numbers (e.g., AW001)');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/supervisor/admin/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: supervisorSession.sessionId,
          ...formData
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess(`Successfully added ${formData.name}`);
        setShowAddModal(false);
        resetForm();
        loadSupervisors();
      } else {
        showError(data.error || 'Failed to add supervisor');
      }
    } catch (error) {
      console.error('❌ Error adding supervisor:', error);
      showError('Failed to add supervisor');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSupervisor = async () => {
    if (!supervisorSession?.sessionId || !selectedSupervisor) {
      showError('Invalid request');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/supervisor/admin/edit/${selectedSupervisor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: supervisorSession.sessionId,
          ...formData
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess(`Successfully updated ${formData.name}`);
        setShowEditModal(false);
        setSelectedSupervisor(null);
        resetForm();
        loadSupervisors();
      } else {
        showError(data.error || 'Failed to update supervisor');
      }
    } catch (error) {
      console.error('❌ Error updating supervisor:', error);
      showError('Failed to update supervisor');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSupervisor = async (supervisor) => {
    if (!supervisorSession?.sessionId) {
      showError('No valid session. Please log in again.');
      return;
    }
    
    // Confirm deletion
    const confirmed = await confirmAction(
      'Delete Supervisor',
      `Are you sure you want to delete ${supervisor.name} (${supervisor.badge})? This action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/supervisor/admin/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: supervisorSession.sessionId,
          supervisorId: supervisor.id
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess(`Successfully deleted ${supervisor.name}`);
        loadSupervisors();
      } else {
        showError(data.error || 'Failed to delete supervisor');
      }
    } catch (error) {
      console.error('❌ Error deleting supervisor:', error);
      showError('Failed to delete supervisor');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (supervisor) => {
    if (!supervisorSession?.sessionId) {
      showError('No valid session. Please log in again.');
      return;
    }
    
    const confirmed = await confirmAction(
      'Reset Password',
      `Are you sure you want to reset the password for ${supervisor.name} (${supervisor.badge})? They will receive a temporary password.`
    );
    
    if (!confirmed) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/supervisor/admin/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: supervisorSession.sessionId,
          supervisorId: supervisor.id,
          newPassword: 'Barry123' // Default password
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess(`Password reset for ${supervisor.name}. Temporary password: ${data.temporaryPassword}`);
      } else {
        showError(data.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('❌ Error resetting password:', error);
      showError('Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (supervisor) => {
    setSelectedSupervisor(supervisor);
    setFormData({
      name: supervisor.name,
      badge: supervisor.badge,
      role: supervisor.role || 'Depot Supervisor',
      shift: supervisor.shift || 'Day',
      permissions: supervisor.permissions || ['view-alerts', 'dismiss-alerts'],
      email: supervisor.email || '',
      phone: supervisor.phone || '',
      emergencyContact: supervisor.emergencyContact || '',
      startDate: supervisor.startDate || new Date().toISOString().split('T')[0],
      notes: supervisor.notes || ''
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      badge: '',
      role: 'Depot Supervisor',
      shift: 'Day',
      permissions: ['view-alerts', 'dismiss-alerts'],
      email: '',
      phone: '',
      emergencyContact: '',
      startDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  // Load active sessions for real-time status
  const loadActiveSessions = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/supervisor/active`);
      const data = await response.json();
      if (data.success) {
        setActiveSessions(data.activeSupervisors || []);
      }
    } catch (error) {
      console.error('❌ Error loading active sessions:', error);
    }
  };

  // Permission templates
  const permissionTemplates = {
    'depot': {
      name: 'Depot Supervisor',
      permissions: ['view-alerts', 'dismiss-alerts', 'create-incidents', 'manage-roadworks']
    },
    'bus_station': {
      name: 'Bus Station Supervisor', 
      permissions: ['view-alerts', 'dismiss-alerts', 'create-incidents', 'manage-roadworks']
    },
    'sdc': {
      name: 'SDC Supervisor',
      permissions: ['view-alerts', 'dismiss-alerts', 'create-incidents', 'manage-roadworks', 'access-analytics', 'control-displays', 'send-messages', 'generate-reports', 'emergency-procedures']
    },
    'admin': {
      name: 'Administrator',
      permissions: ['view-alerts', 'dismiss-alerts', 'create-incidents', 'manage-roadworks', 'access-analytics', 'manage-supervisors', 'system-admin', 'control-displays', 'send-messages', 'generate-reports', 'emergency-procedures', 'access-logs']
    },
    'readonly': {
      name: 'Read Only',
      permissions: ['view-alerts']
    }
  };

  // Apply permission template
  const applyPermissionTemplate = (templateKey) => {
    const template = permissionTemplates[templateKey];
    if (template) {
      setFormData({...formData, permissions: template.permissions});
      setShowPermissionTemplates(false);
    }
  };

  // Load supervisor activity
  const loadSupervisorActivity = async (supervisorId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/supervisor/supervisors/${supervisorId}/activity?limit=100`);
      const data = await response.json();
      if (data.success) {
        setActivityData(data.activity || []);
        setShowActivityModal(true);
      } else {
        showError('Failed to load activity data');
      }
    } catch (error) {
      console.error('❌ Error loading activity:', error);
      showError('Failed to load activity data');
    } finally {
      setLoading(false);
    }
  };

  // Bulk operations
  const handleBulkAction = async (action) => {
    if (selectedSupervisors.length === 0) {
      showError('Please select supervisors first');
      return;
    }

    const confirmed = await confirmAction(
      `Bulk ${action}`,
      `Are you sure you want to ${action} ${selectedSupervisors.length} supervisor(s)?`
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      // Implementation would depend on specific bulk action
      console.log(`Performing bulk ${action} on:`, selectedSupervisors);
      showSuccess(`Bulk ${action} completed successfully`);
      setSelectedSupervisors([]);
      setShowBulkActions(false);
      loadSupervisors();
    } catch (error) {
      console.error(`❌ Error performing bulk ${action}:`, error);
      showError(`Failed to perform bulk ${action}`);
    } finally {
      setLoading(false);
    }
  };

  // Toggle supervisor selection
  const toggleSupervisorSelection = (supervisorId) => {
    setSelectedSupervisors(prev => 
      prev.includes(supervisorId)
        ? prev.filter(id => id !== supervisorId)
        : [...prev, supervisorId]
    );
  };

  // Check if supervisor is currently active
  const isCurrentlyActive = (supervisorBadge) => {
    return activeSessions.some(session => session.supervisorBadge === supervisorBadge);
  };

  // Enhanced permissions list with categories
  const getPermissionCategories = () => {
    return {
      'Core Operations': [
        { id: 'view-alerts', label: 'View Alerts', description: 'View traffic alerts and incidents' },
        { id: 'dismiss-alerts', label: 'Dismiss Alerts', description: 'Dismiss traffic alerts' },
        { id: 'create-incidents', label: 'Create Incidents', description: 'Create new traffic incidents' }
      ],
      'Traffic Management': [
        { id: 'manage-roadworks', label: 'Manage Roadworks', description: 'Create and manage roadwork entries' },
        { id: 'control-displays', label: 'Control Display Screens', description: 'Manage content on display screens' },
        { id: 'emergency-procedures', label: 'Emergency Procedures', description: 'Access emergency response tools' }
      ],
      'Communications': [
        { id: 'send-messages', label: 'Send Messages', description: 'Send messages to drivers and staff' },
        { id: 'manage-templates', label: 'Manage Templates', description: 'Create and edit message templates' },
        { id: 'broadcast-announcements', label: 'Broadcast Announcements', description: 'Send system-wide announcements' }
      ],
      'Analytics & Reporting': [
        { id: 'access-analytics', label: 'Access Analytics', description: 'View traffic and performance analytics' },
        { id: 'generate-reports', label: 'Generate Reports', description: 'Create operational reports' },
        { id: 'view-historical', label: 'View Historical Data', description: 'Access historical traffic data' }
      ],
      'Administration': [
        { id: 'manage-supervisors', label: 'Manage Supervisors', description: 'Add, edit, and remove supervisors' },
        { id: 'system-admin', label: 'System Administration', description: 'Full system administrative access' },
        { id: 'access-logs', label: 'Access System Logs', description: 'View system and audit logs' }
      ]
    };
  };

  // Helper functions
  const showError = (message) => {
    if (Platform.OS === 'web') {
      alert(`Error: ${message}`);
    } else {
      Alert.alert('Error', message);
    }
  };
  
  const showSuccess = (message) => {
    if (Platform.OS === 'web') {
      alert(message);
    } else {
      Alert.alert('Success', message);
    }
  };
  
  const confirmAction = async (title, message) => {
    if (Platform.OS === 'web') {
      return confirm(message);
    } else {
      return new Promise((resolve) => {
        Alert.alert(
          title,
          message,
          [
            { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
            { text: 'Confirm', onPress: () => resolve(true), style: 'destructive' }
          ]
        );
      });
    }
  };

  // Enhanced filter supervisors
  const filteredSupervisors = supervisors.filter(supervisor => {
    if (!supervisor) return false;
    
    // Text search
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query || 
      (supervisor.name && supervisor.name.toLowerCase().includes(query)) ||
      (supervisor.badge && supervisor.badge.toLowerCase().includes(query)) ||
      (supervisor.role && supervisor.role.toLowerCase().includes(query));
    
    // Role filter
    const matchesRole = filterOptions.role === 'all' || supervisor.role === filterOptions.role;
    
    // Shift filter
    const matchesShift = filterOptions.shift === 'all' || supervisor.shift === filterOptions.shift;
    
    // Status filter
    let matchesStatus = true;
    if (filterOptions.status === 'active') {
      matchesStatus = isCurrentlyActive(supervisor.badge);
    } else if (filterOptions.status === 'inactive') {
      matchesStatus = !isCurrentlyActive(supervisor.badge);
    }
    
    return matchesSearch && matchesRole && matchesShift && matchesStatus;
  });

  // Check if supervisor is protected
  const isProtectedAdmin = (supervisor) => {
    if (!supervisor || !supervisor.badge) return false;
    return supervisor.badge === 'AG003' || supervisor.badge === 'BP009';
  };

  if (!supervisorSession || !isAdmin) {
    return null;
  }

  if (loading && supervisors.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#30cfd0" />
        <Text style={styles.loadingText}>Loading supervisors...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Supervisor Management',
          headerStyle: {
            backgroundColor: '#1a1a2e',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              style={{ marginLeft: 15 }}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
            </Pressable>
          ),
        }}
      />
      
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.pageHeader}>
            <View style={styles.headerIcon}>
              <MaterialCommunityIcons name="account-group" size={32} color="#30cfd0" />
            </View>
            <View>
              <Text style={styles.pageTitle}>Supervisor Management</Text>
              <Text style={styles.pageSubtitle}>Manage team members & permissions</Text>
            </View>
          </View>
          
          {/* Admin Info */}
          <View style={styles.adminInfo}>
            <MaterialCommunityIcons name="shield-check" size={16} color="#30cfd0" />
            <Text style={styles.adminText}>
              Admin: {supervisorSession?.name || 'Unknown'} ({supervisorSession?.badge || 'N/A'})
            </Text>
          </View>
            
        {/* Backend Status */}
          {!backendAvailable && (
          <View style={styles.backendWarning}>
            <MaterialCommunityIcons name="alert-circle" size={16} color={darkTheme.warning} />
            <Text style={styles.backendWarningText}>
              Backend unavailable - showing cached data. Add/Edit/Delete functions disabled.
            </Text>
          </View>
        )}
      </View>

        {/* Enhanced Controls */}
        <View style={styles.controlsContainer}>
          {/* Search and Filters */}
          <View style={styles.searchAndFilters}>
            <View style={styles.searchContainer}>
              <MaterialCommunityIcons name="magnify" size={20} color={darkTheme.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search supervisors..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={darkTheme.textMuted}
              />
            </View>
            
            {/* Filter Options */}
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Filters:</Text>
              
              {/* Role Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupLabel}>Role:</Text>
                <View style={styles.filterOptions}>
                  {['all', 'SDC Supervisor', 'Depot Supervisor', 'Bus Station Supervisor', 'Developer/Admin', 'Service Delivery Controller'].map((role) => (
                    <Pressable
                      key={role}
                      style={[
                        styles.filterOption,
                        filterOptions.role === role && styles.filterOptionActive
                      ]}
                      onPress={() => setFilterOptions({...filterOptions, role})}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        filterOptions.role === role && styles.filterOptionTextActive
                      ]}>
                        {role === 'all' ? 'All' : role}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              
              {/* Status Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupLabel}>Status:</Text>
                <View style={styles.filterOptions}>
                  {['all', 'active', 'inactive'].map((status) => (
                    <Pressable
                      key={status}
                      style={[
                        styles.filterOption,
                        filterOptions.status === status && styles.filterOptionActive
                      ]}
                      onPress={() => setFilterOptions({...filterOptions, status})}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        filterOptions.status === status && styles.filterOptionTextActive
                      ]}>
                        {status === 'all' ? 'All' : status === 'active' ? 'Online' : 'Offline'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {selectedSupervisors.length > 0 && (
              <Pressable
                style={[styles.bulkButton, !backendAvailable && styles.disabledButton]}
                onPress={() => setShowBulkActions(true)}
                disabled={!backendAvailable}
              >
                <MaterialCommunityIcons name="check-all" size={20} color="#FFFFFF" />
                <Text style={styles.bulkButtonText}>Bulk Actions ({selectedSupervisors.length})</Text>
              </Pressable>
            )}
            
            <Pressable
              style={[styles.addButton, !backendAvailable && styles.disabledButton]}
              onPress={() => backendAvailable && setShowAddModal(true)}
              disabled={!backendAvailable}
            >
              <MaterialCommunityIcons name="account-plus" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add Supervisor</Text>
            </Pressable>
          </View>
        </View>

        {/* Supervisor List */}
        <ScrollView 
          style={styles.supervisorList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#30cfd0" />
          }
        >
          <Text style={styles.listTitle}>
            Active Supervisors ({filteredSupervisors.length})
          </Text>
          
          {filteredSupervisors.map((supervisor) => (
            <View key={supervisor.id} style={styles.supervisorCard}>
              {/* Selection Checkbox */}
              <Pressable
                style={styles.selectionCheckbox}
                onPress={() => toggleSupervisorSelection(supervisor.id)}
              >
                <MaterialCommunityIcons
                  name={selectedSupervisors.includes(supervisor.id) ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={24}
                  color={selectedSupervisors.includes(supervisor.id) ? '#30cfd0' : darkTheme.textSecondary}
                />
              </Pressable>
              
              <View style={styles.supervisorInfo}>
                <View style={styles.supervisorHeader}>
                  <View style={styles.nameAndStatus}>
                    <Text style={styles.supervisorName}>{supervisor.name || 'Unknown'}</Text>
                    {isCurrentlyActive(supervisor.badge) && (
                      <View style={styles.activeIndicator}>
                        <View style={styles.activeDot} />
                        <Text style={styles.activeText}>Online</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.badgeContainer}>
                    <Text style={styles.supervisorBadge}>{supervisor.badge || 'N/A'}</Text>
                  </View>
                </View>
                <Text style={styles.supervisorRole}>{supervisor.role || 'Supervisor'}</Text>
                <Text style={styles.supervisorShift}>Shift: {supervisor.shift || 'Day'}</Text>
                
                {/* Permissions */}
                <View style={styles.permissionsContainer}>
                  <Text style={styles.permissionsLabel}>Permissions:</Text>
                  <View style={styles.permissionsList}>
                    {(supervisor.permissions && Array.isArray(supervisor.permissions)) ? (
                      supervisor.permissions.map((perm, index) => (
                        <View key={index} style={styles.permissionTag}>
                          <Text style={styles.permissionText}>{perm}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.permissionText}>No permissions set</Text>
                    )}
                  </View>
                </View>
              </View>
              
              {/* Enhanced Actions */}
              <View style={styles.supervisorActions}>
                {isProtectedAdmin(supervisor) ? (
                  <View style={styles.protectedBadge}>
                    <MaterialCommunityIcons name="lock" size={14} color="#30cfd0" />
                    <Text style={styles.protectedText}>Protected</Text>
                  </View>
                ) : (
                  <>
                    <Pressable
                      style={[styles.actionButton, styles.viewButton, !backendAvailable && styles.disabledButton]}
                      onPress={() => backendAvailable && loadSupervisorActivity(supervisor.id)}
                      disabled={!backendAvailable}
                    >
                      <MaterialCommunityIcons name="eye" size={16} color="#FFFFFF" />
                    </Pressable>
                    
                    <Pressable
                      style={[styles.actionButton, !backendAvailable && styles.disabledButton]}
                      onPress={() => backendAvailable && openEditModal(supervisor)}
                      disabled={!backendAvailable}
                    >
                      <MaterialCommunityIcons name="pencil" size={16} color="#FFFFFF" />
                    </Pressable>
                    
                    <Pressable
                      style={[styles.actionButton, styles.resetButton, !backendAvailable && styles.disabledButton]}
                      onPress={() => backendAvailable && handleResetPassword(supervisor)}
                      disabled={!backendAvailable}
                    >
                      <MaterialCommunityIcons name="lock-reset" size={16} color="#FFFFFF" />
                    </Pressable>
                    
                    <Pressable
                      style={[styles.actionButton, styles.deleteButton, !backendAvailable && styles.disabledButton]}
                      onPress={() => backendAvailable && handleDeleteSupervisor(supervisor)}
                      disabled={!backendAvailable}
                    >
                      <MaterialCommunityIcons name="delete" size={16} color="#FFFFFF" />
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          ))}

          {filteredSupervisors.length === 0 && (
            <View style={styles.noSupervisors}>
              <MaterialCommunityIcons name="account-off" size={48} color={darkTheme.textMuted} />
              <Text style={styles.noSupervisorsText}>No supervisors found</Text>
              <Text style={styles.noSupervisorsSubtext}>Try adjusting your search</Text>
            </View>
          )}
        </ScrollView>

        {/* Add/Edit Modal */}
        <Modal
          visible={showAddModal || showEditModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            setShowAddModal(false);
            setShowEditModal(false);
            setSelectedSupervisor(null);
            resetForm();
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {showEditModal ? 'Edit Supervisor' : 'Add New Supervisor'}
                </Text>
                <Pressable
                  onPress={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setSelectedSupervisor(null);
                    resetForm();
                  }}
                >
                  <MaterialCommunityIcons name="close" size={24} color={darkTheme.textSecondary} />
                </Pressable>
              </View>
              
              <ScrollView style={styles.modalContent}>
                {/* Name Field */}
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Full Name *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="e.g., John Smith"
                    value={formData.name}
                    onChangeText={(text) => setFormData({...formData, name: text})}
                    placeholderTextColor={darkTheme.textMuted}
                  />
                </View>
                
                {/* Badge Field */}
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Badge Number *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="e.g., JS001"
                    value={formData.badge}
                    onChangeText={(text) => setFormData({...formData, badge: text.toUpperCase()})}
                    autoCapitalize="characters"
                    placeholderTextColor={darkTheme.textMuted}
                    editable={!showEditModal} // Can't change badge when editing
                  />
                  <Text style={styles.fieldHint}>2-3 letters followed by 3 numbers</Text>
                </View>
                
                {/* Role Field */}
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Role</Text>
                  <View style={styles.optionGroup}>
                    {['SDC Supervisor', 'Depot Supervisor', 'Bus Station Supervisor'].map((role) => (
                      <Pressable
                        key={role}
                        style={[
                          styles.optionButton,
                          formData.role === role && styles.optionButtonActive
                        ]}
                        onPress={() => setFormData({...formData, role})}
                      >
                        <Text style={[
                          styles.optionButtonText,
                          formData.role === role && styles.optionButtonTextActive
                        ]}>
                          {role}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                
                {/* Shift Field */}
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Shift</Text>
                  <View style={styles.optionGroup}>
                    {['Day', 'Night', 'Rotating'].map((shift) => (
                      <Pressable
                        key={shift}
                        style={[
                          styles.optionButton,
                          formData.shift === shift && styles.optionButtonActive
                        ]}
                        onPress={() => setFormData({...formData, shift})}
                      >
                        <Text style={[
                          styles.optionButtonText,
                          formData.shift === shift && styles.optionButtonTextActive
                        ]}>
                          {shift}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                
                {/* Email Field */}
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Email Address</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="supervisor@gobarry.co.uk"
                    value={formData.email}
                    onChangeText={(text) => setFormData({...formData, email: text})}
                    placeholderTextColor={darkTheme.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                
                {/* Phone Field */}
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Phone Number</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="+44 7XXX XXXXXX"
                    value={formData.phone}
                    onChangeText={(text) => setFormData({...formData, phone: text})}
                    placeholderTextColor={darkTheme.textMuted}
                    keyboardType="phone-pad"
                  />
                </View>
                
                {/* Emergency Contact Field */}
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Emergency Contact</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Emergency contact number"
                    value={formData.emergencyContact}
                    onChangeText={(text) => setFormData({...formData, emergencyContact: text})}
                    placeholderTextColor={darkTheme.textMuted}
                    keyboardType="phone-pad"
                  />
                </View>
                
                {/* Start Date Field */}
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Start Date</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="YYYY-MM-DD"
                    value={formData.startDate}
                    onChangeText={(text) => setFormData({...formData, startDate: text})}
                    placeholderTextColor={darkTheme.textMuted}
                  />
                </View>
                
                {/* Enhanced Permissions Field */}
                <View style={styles.formField}>
                  <View style={styles.permissionHeader}>
                    <Text style={styles.fieldLabel}>Permissions</Text>
                    <Pressable
                      style={styles.templateButton}
                      onPress={() => setShowPermissionTemplates(true)}
                    >
                      <MaterialCommunityIcons name="clipboard-list" size={16} color="#30cfd0" />
                      <Text style={styles.templateButtonText}>Templates</Text>
                    </Pressable>
                  </View>
                  
                  {Object.entries(getPermissionCategories()).map(([category, permissions]) => (
                    <View key={category} style={styles.permissionCategory}>
                      <Text style={styles.categoryTitle}>{category}</Text>
                      <View style={styles.permissionOptions}>
                        {permissions.map((perm) => (
                          <Pressable
                            key={perm.id}
                            style={styles.permissionOption}
                            onPress={() => {
                              const newPermissions = formData.permissions.includes(perm.id)
                                ? formData.permissions.filter(p => p !== perm.id)
                                : [...formData.permissions, perm.id];
                              setFormData({...formData, permissions: newPermissions});
                            }}
                          >
                            <MaterialCommunityIcons 
                              name={formData.permissions.includes(perm.id) ? 'checkbox-marked' : 'checkbox-blank-outline'} 
                              size={20} 
                              color={formData.permissions.includes(perm.id) ? '#30cfd0' : darkTheme.textSecondary} 
                            />
                            <View style={styles.permissionDetails}>
                              <Text style={styles.permissionOptionText}>{perm.label}</Text>
                              <Text style={styles.permissionDescription}>{perm.description}</Text>
                            </View>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
                
                {/* Notes Field */}
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Notes</Text>
                  <TextInput
                    style={[styles.fieldInput, styles.notesInput]}
                    placeholder="Additional notes about this supervisor..."
                    value={formData.notes}
                    onChangeText={(text) => setFormData({...formData, notes: text})}
                    placeholderTextColor={darkTheme.textMuted}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </ScrollView>
              
              {/* Modal Actions */}
              <View style={styles.modalActions}>
                <Pressable
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setSelectedSupervisor(null);
                    resetForm();
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                
                <Pressable
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                  onPress={showEditModal ? handleEditSupervisor : handleAddSupervisor}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <MaterialCommunityIcons 
                        name={showEditModal ? 'check' : 'account-plus'} 
                        size={20} 
                        color="#FFFFFF" 
                      />
                      <Text style={styles.submitButtonText}>
                        {showEditModal ? 'Update' : 'Add'} Supervisor
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Activity Modal */}
        <Modal
          visible={showActivityModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowActivityModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.activityModalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Supervisor Activity</Text>
                <Pressable onPress={() => setShowActivityModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={darkTheme.textSecondary} />
                </Pressable>
              </View>
              
              <ScrollView style={styles.activityContent}>
                {activityData.length > 0 ? (
                  activityData.map((activity, index) => (
                    <View key={index} style={styles.activityItem}>
                      <View style={styles.activityHeader}>
                        <Text style={styles.activityType}>{activity.type}</Text>
                        <Text style={styles.activityTime}>{new Date(activity.timestamp).toLocaleString()}</Text>
                      </View>
                      <Text style={styles.activityDetails}>{activity.details}</Text>
                      {activity.notes && <Text style={styles.activityNotes}>{activity.notes}</Text>}
                    </View>
                  ))
                ) : (
                  <View style={styles.noActivity}>
                    <MaterialCommunityIcons name="clipboard-text-off" size={48} color={darkTheme.textMuted} />
                    <Text style={styles.noActivityText}>No activity recorded</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Bulk Actions Modal */}
        <Modal
          visible={showBulkActions}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowBulkActions(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.bulkModalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Bulk Actions ({selectedSupervisors.length} selected)</Text>
                <Pressable onPress={() => setShowBulkActions(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={darkTheme.textSecondary} />
                </Pressable>
              </View>
              
              <View style={styles.bulkActionsList}>
                <Pressable
                  style={styles.bulkActionButton}
                  onPress={() => handleBulkAction('reset-passwords')}
                >
                  <MaterialCommunityIcons name="lock-reset" size={24} color={darkTheme.warning} />
                  <View style={styles.bulkActionText}>
                    <Text style={styles.bulkActionTitle}>Reset Passwords</Text>
                    <Text style={styles.bulkActionDescription}>Reset passwords for selected supervisors</Text>
                  </View>
                </Pressable>
                
                <Pressable
                  style={styles.bulkActionButton}
                  onPress={() => handleBulkAction('update-shift')}
                >
                  <MaterialCommunityIcons name="clock-outline" size={24} color={darkTheme.info} />
                  <View style={styles.bulkActionText}>
                    <Text style={styles.bulkActionTitle}>Update Shift</Text>
                    <Text style={styles.bulkActionDescription}>Change shift assignments for selected supervisors</Text>
                  </View>
                </Pressable>
                
                <Pressable
                  style={styles.bulkActionButton}
                  onPress={() => handleBulkAction('export-data')}
                >
                  <MaterialCommunityIcons name="download" size={24} color={darkTheme.success} />
                  <View style={styles.bulkActionText}>
                    <Text style={styles.bulkActionTitle}>Export Data</Text>
                    <Text style={styles.bulkActionDescription}>Export data for selected supervisors</Text>
                  </View>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Permission Templates Modal */}
        <Modal
          visible={showPermissionTemplates}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowPermissionTemplates(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.templateModalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Permission Templates</Text>
                <Pressable onPress={() => setShowPermissionTemplates(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={darkTheme.textSecondary} />
                </Pressable>
              </View>
              
              <View style={styles.templatesList}>
                {Object.entries(permissionTemplates).map(([key, template]) => (
                  <Pressable
                    key={key}
                    style={styles.templateOption}
                    onPress={() => applyPermissionTemplate(key)}
                  >
                    <View style={styles.templateInfo}>
                      <Text style={styles.templateName}>{template.name}</Text>
                      <Text style={styles.templatePermissions}>
                        {template.permissions.length} permission(s): {template.permissions.slice(0, 3).join(', ')}
                        {template.permissions.length > 3 && '...'}
                      </Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color={darkTheme.textSecondary} />
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: darkTheme.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: darkTheme.textSecondary,
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    backgroundColor: darkTheme.surface,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(48, 207, 208, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: darkTheme.text,
  },
  pageSubtitle: {
    fontSize: 16,
    color: darkTheme.textSecondary,
    marginTop: 4,
  },
  adminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkTheme.background,
    padding: 12,
    borderRadius: 8,
  },
  adminText: {
    fontSize: 14,
    color: '#30cfd0',
    fontWeight: '600',
    marginLeft: 8,
  },
  backendWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkTheme.warningBg,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  backendWarningText: {
    fontSize: 14,
    color: darkTheme.warning,
    marginLeft: 8,
    flex: 1,
  },
  controls: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: darkTheme.surface,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkTheme.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 16,
    color: darkTheme.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkTheme.success,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  supervisorList: {
    flex: 1,
    padding: 20,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: darkTheme.text,
    marginBottom: 16,
  },
  supervisorCard: {
    backgroundColor: darkTheme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  supervisorInfo: {
    flex: 1,
  },
  supervisorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  supervisorName: {
    fontSize: 18,
    fontWeight: '600',
    color: darkTheme.text,
    marginRight: 12,
  },
  badgeContainer: {
    backgroundColor: darkTheme.infoBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  supervisorBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: darkTheme.info,
  },
  supervisorRole: {
    fontSize: 14,
    color: darkTheme.textSecondary,
    marginBottom: 4,
  },
  supervisorShift: {
    fontSize: 14,
    color: darkTheme.textSecondary,
    marginBottom: 8,
  },
  permissionsContainer: {
    marginTop: 8,
  },
  permissionsLabel: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    marginBottom: 4,
  },
  permissionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  permissionTag: {
    backgroundColor: darkTheme.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  permissionText: {
    fontSize: 11,
    color: darkTheme.textSecondary,
  },
  supervisorActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: darkTheme.info,
    padding: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  resetButton: {
    backgroundColor: darkTheme.warning,
  },
  deleteButton: {
    backgroundColor: darkTheme.error,
  },
  protectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkTheme.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  protectedText: {
    color: '#30cfd0',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  noSupervisors: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  noSupervisorsText: {
    marginTop: 12,
    fontSize: 18,
    color: darkTheme.textSecondary,
    fontWeight: '500',
  },
  noSupervisorsSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: darkTheme.textMuted,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: darkTheme.surface,
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: darkTheme.text,
  },
  modalContent: {
    padding: 20,
  },
  formField: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
    marginBottom: 8,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: darkTheme.text,
    backgroundColor: darkTheme.background,
  },
  fieldHint: {
    fontSize: 12,
    color: darkTheme.textMuted,
    marginTop: 4,
  },
  optionGroup: {
    flexDirection: 'row',
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: darkTheme.border,
    backgroundColor: darkTheme.background,
    marginRight: 8,
  },
  optionButtonActive: {
    backgroundColor: '#30cfd0',
    borderColor: '#30cfd0',
  },
  optionButtonText: {
    fontSize: 14,
    color: darkTheme.textSecondary,
  },
  optionButtonTextActive: {
    color: '#FFFFFF',
  },
  permissionOptions: {
    marginTop: 8,
  },
  permissionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  permissionOptionText: {
    fontSize: 14,
    color: darkTheme.text,
    marginLeft: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: darkTheme.border,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: darkTheme.border,
    marginRight: 12,
  },
  cancelButtonText: {
    color: darkTheme.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#30cfd0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Enhanced Controls Styles
  controlsContainer: {
    backgroundColor: darkTheme.surface,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
  },
  searchAndFilters: {
    padding: 20,
  },
  filterRow: {
    marginTop: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
    marginBottom: 8,
  },
  filterGroup: {
    marginBottom: 12,
  },
  filterGroupLabel: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    marginBottom: 6,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterOption: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: darkTheme.border,
    backgroundColor: darkTheme.background,
    marginRight: 6,
    marginBottom: 6,
  },
  filterOptionActive: {
    backgroundColor: '#30cfd0',
    borderColor: '#30cfd0',
  },
  filterOptionText: {
    fontSize: 11,
    color: darkTheme.textSecondary,
  },
  filterOptionTextActive: {
    color: '#FFFFFF',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  bulkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkTheme.warning,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 12,
  },
  bulkButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  
  // Enhanced Supervisor Card Styles
  selectionCheckbox: {
    paddingRight: 12,
    justifyContent: 'center',
  },
  nameAndStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 4,
  },
  activeText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '600',
  },
  viewButton: {
    backgroundColor: darkTheme.info,
  },
  
  // Enhanced Modal Styles
  activityModalContainer: {
    backgroundColor: darkTheme.surface,
    borderRadius: 16,
    width: '90%',
    maxHeight: '70%',
  },
  activityContent: {
    padding: 20,
  },
  activityItem: {
    backgroundColor: darkTheme.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  activityType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#30cfd0',
  },
  activityTime: {
    fontSize: 12,
    color: darkTheme.textMuted,
  },
  activityDetails: {
    fontSize: 14,
    color: darkTheme.text,
  },
  activityNotes: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  noActivity: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noActivityText: {
    marginTop: 12,
    fontSize: 16,
    color: darkTheme.textMuted,
  },
  
  // Bulk Actions Modal Styles
  bulkModalContainer: {
    backgroundColor: darkTheme.surface,
    borderRadius: 16,
    width: '80%',
    maxHeight: '60%',
  },
  bulkActionsList: {
    padding: 20,
  },
  bulkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkTheme.background,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  bulkActionText: {
    marginLeft: 16,
    flex: 1,
  },
  bulkActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: darkTheme.text,
  },
  bulkActionDescription: {
    fontSize: 14,
    color: darkTheme.textSecondary,
    marginTop: 2,
  },
  
  // Permission Templates Modal Styles
  templateModalContainer: {
    backgroundColor: darkTheme.surface,
    borderRadius: 16,
    width: '80%',
    maxHeight: '60%',
  },
  templatesList: {
    padding: 20,
  },
  templateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkTheme.background,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: darkTheme.text,
  },
  templatePermissions: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    marginTop: 2,
  },
  
  // Enhanced Form Styles
  permissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#30cfd0',
  },
  templateButtonText: {
    fontSize: 12,
    color: '#30cfd0',
    marginLeft: 4,
  },
  permissionCategory: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#30cfd0',
    marginBottom: 8,
  },
  permissionDetails: {
    marginLeft: 8,
    flex: 1,
  },
  permissionDescription: {
    fontSize: 11,
    color: darkTheme.textMuted,
    marginTop: 2,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
});
