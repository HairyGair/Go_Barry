// Go_BARRY/components/SupervisorManagement.jsx
// Supervisor Management Component for Admin Users
// Allows adding and deleting supervisors from the system

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const API_BASE = 'https://go-barry.onrender.com';

const SupervisorManagement = ({ 
  visible,
  onClose,
  sessionId,
  adminInfo
}) => {
  // Initialize state with empty arrays to prevent undefined errors
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state for new supervisor
  const [newSupervisor, setNewSupervisor] = useState({
    name: '',
    badge: '',
    role: 'Supervisor',
    shift: 'Day',
    permissions: ['view-alerts', 'dismiss-alerts']
  });
  
  // Load supervisors on mount
  useEffect(() => {
    if (visible) {
      loadSupervisors();
    }
  }, [visible]);
  
  // Load all supervisors
  const loadSupervisors = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/supervisor/supervisors`);
      const data = await response.json();
      
      if (data.success && Array.isArray(data.supervisors)) {
        // Filter out any null/undefined entries
        setSupervisors(data.supervisors.filter(s => s != null));
      } else {
        showError('Failed to load supervisors');
        setSupervisors([]); // Ensure it's always an array
      }
    } catch (error) {
      console.error('❌ Error loading supervisors:', error);
      showError('Failed to load supervisors');
      setSupervisors([]); // Ensure it's always an array on error
    } finally {
      setLoading(false);
    }
  };
  
  // Add new supervisor
  const handleAddSupervisor = async () => {
    // Check if we have a valid session
    if (!sessionId) {
      showError('No valid session. Please log in again.');
      return;
    }
    
    // Validate form
    if (!newSupervisor.name.trim() || !newSupervisor.badge.trim()) {
      showError('Name and badge are required');
      return;
    }
    
    // Badge format validation (2-3 letters + 3 numbers)
    const badgeRegex = /^[A-Z]{2,3}\d{3}$/;
    if (!badgeRegex.test(newSupervisor.badge)) {
      showError('Badge must be 2-3 letters followed by 3 numbers (e.g., AW001)');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/supervisor/admin/add-supervisor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          ...newSupervisor
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess(`Successfully added ${newSupervisor.name}`);
        setShowAddForm(false);
        setNewSupervisor({
          name: '',
          badge: '',
          role: 'Supervisor',
          shift: 'Day',
          permissions: ['view-alerts', 'dismiss-alerts']
        });
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
  
  // Delete supervisor
  const handleDeleteSupervisor = async (supervisor) => {
    // Check if we have a valid session
    if (!sessionId) {
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
      const response = await fetch(`${API_BASE}/api/supervisor/admin/delete-supervisor/${supervisor.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId
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
  
  // Helper functions for alerts
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
            { text: 'Delete', onPress: () => resolve(true), style: 'destructive' }
          ]
        );
      });
    }
  };
  
  // Filter supervisors based on search
  const filteredSupervisors = (Array.isArray(supervisors) ? supervisors : []).filter(supervisor => {
    if (!supervisor) return false;
    const query = searchQuery.toLowerCase();
    return (
      (supervisor.name && supervisor.name.toLowerCase().includes(query)) ||
      (supervisor.badge && supervisor.badge.toLowerCase().includes(query)) ||
      (supervisor.role && supervisor.role.toLowerCase().includes(query))
    );
  });
  
  // Check if supervisor is an admin (and prevent deletion)
  const isProtectedAdmin = (supervisor) => {
    if (!supervisor || !supervisor.badge) return false;
    return supervisor.badge === 'AG003' || supervisor.badge === 'BP009';
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Ionicons name="people" size={28} color="#1F2937" />
            <Text style={styles.title}>Supervisor Management</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
        
        {/* Admin Info */}
        <View style={styles.adminInfo}>
          <Ionicons name="shield-checkmark" size={16} color="#7C3AED" />
          <Text style={styles.adminText}>
            Admin: {adminInfo?.name || 'Unknown'} ({adminInfo?.badge || 'N/A'})
          </Text>
        </View>
        
        {/* Search and Add Button */}
        <View style={styles.controls}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search supervisors..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
          </View>
          
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddForm(true)}
          >
            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Supervisor</Text>
          </TouchableOpacity>
        </View>
        
        {/* Supervisor List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading supervisors...</Text>
          </View>
        ) : (
          <ScrollView style={styles.supervisorList} showsVerticalScrollIndicator={false}>
            <Text style={styles.listTitle}>
              Active Supervisors ({filteredSupervisors.length})
            </Text>
            
            {filteredSupervisors.map((supervisor, index) => (
              <View key={supervisor.id || `supervisor-${index}`} style={styles.supervisorCard}>
                <View style={styles.supervisorInfo}>
                  <View style={styles.supervisorHeader}>
                    <Text style={styles.supervisorName}>{supervisor.name || 'Unknown'}</Text>
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
                
                {/* Actions */}
                <View style={styles.supervisorActions}>
                  {isProtectedAdmin(supervisor) ? (
                    <View style={styles.protectedBadge}>
                      <Ionicons name="lock-closed" size={14} color="#7C3AED" />
                      <Text style={styles.protectedText}>Protected</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteSupervisor(supervisor)}
                    >
                      <Ionicons name="trash" size={18} color="#FFFFFF" />
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        )}
        
        {/* Add Supervisor Form Modal */}
        <Modal
          visible={showAddForm}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAddForm(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.formModal}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>Add New Supervisor</Text>
                <TouchableOpacity onPress={() => setShowAddForm(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              
              {/* Form Fields */}
              <ScrollView style={styles.formContent}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Full Name *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="e.g., John Smith"
                    value={newSupervisor.name}
                    onChangeText={(text) => setNewSupervisor({...newSupervisor, name: text})}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Badge Number *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="e.g., JS001"
                    value={newSupervisor.badge}
                    onChangeText={(text) => setNewSupervisor({...newSupervisor, badge: text.toUpperCase()})}
                    autoCapitalize="characters"
                    placeholderTextColor="#9CA3AF"
                  />
                  <Text style={styles.fieldHint}>2-3 letters followed by 3 numbers</Text>
                </View>
                
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Role</Text>
                  <View style={styles.roleOptions}>
                    {['Supervisor', 'Senior Supervisor', 'Relief Supervisor'].map((role) => (
                      <TouchableOpacity
                        key={role}
                        style={[
                          styles.roleOption,
                          newSupervisor.role === role && styles.roleOptionActive
                        ]}
                        onPress={() => setNewSupervisor({...newSupervisor, role})}
                      >
                        <Text style={[
                          styles.roleOptionText,
                          newSupervisor.role === role && styles.roleOptionTextActive
                        ]}>
                          {role}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Shift</Text>
                  <View style={styles.shiftOptions}>
                    {['Day', 'Night', 'Rotating'].map((shift) => (
                      <TouchableOpacity
                        key={shift}
                        style={[
                          styles.shiftOption,
                          newSupervisor.shift === shift && styles.shiftOptionActive
                        ]}
                        onPress={() => setNewSupervisor({...newSupervisor, shift})}
                      >
                        <Text style={[
                          styles.shiftOptionText,
                          newSupervisor.shift === shift && styles.shiftOptionTextActive
                        ]}>
                          {shift}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Permissions</Text>
                  <View style={styles.permissionOptions}>
                    {[
                      { id: 'view-alerts', label: 'View Alerts' },
                      { id: 'dismiss-alerts', label: 'Dismiss Alerts' },
                      { id: 'create-incidents', label: 'Create Incidents' },
                      { id: 'manage-supervisors', label: 'Manage Supervisors (Admin)' }
                    ].map((perm) => (
                      <TouchableOpacity
                        key={perm.id}
                        style={[
                          styles.permissionOption,
                          newSupervisor.permissions.includes(perm.id) && styles.permissionOptionActive
                        ]}
                        onPress={() => {
                          const permissions = newSupervisor.permissions.includes(perm.id)
                            ? newSupervisor.permissions.filter(p => p !== perm.id)
                            : [...newSupervisor.permissions, perm.id];
                          setNewSupervisor({...newSupervisor, permissions});
                        }}
                      >
                        <Ionicons 
                          name={newSupervisor.permissions.includes(perm.id) ? 'checkbox' : 'square-outline'} 
                          size={20} 
                          color={newSupervisor.permissions.includes(perm.id) ? '#3B82F6' : '#6B7280'} 
                        />
                        <Text style={styles.permissionOptionText}>{perm.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>
              
              {/* Form Actions */}
              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowAddForm(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                  onPress={handleAddSupervisor}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                      <Text style={styles.submitButtonText}>Add Supervisor</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...Platform.select({
      web: { paddingTop: 20 },
      default: { paddingTop: 44 }
    }),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  adminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3E8FF',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9D5FF',
  },
  adminText: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#1F2937',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  supervisorList: {
    flex: 1,
    padding: 20,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  supervisorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  supervisorInfo: {
    flex: 1,
  },
  supervisorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  supervisorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  badgeContainer: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  supervisorBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
  },
  supervisorRole: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  supervisorShift: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  permissionsContainer: {
    marginTop: 8,
  },
  permissionsLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  permissionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  permissionTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  permissionText: {
    fontSize: 11,
    color: '#4B5563',
  },
  supervisorActions: {
    justifyContent: 'center',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  protectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  protectedText: {
    color: '#7C3AED',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  formModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  formContent: {
    padding: 20,
  },
  formField: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
  },
  fieldHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  roleOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  roleOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  roleOptionActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  roleOptionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  roleOptionTextActive: {
    color: '#FFFFFF',
  },
  shiftOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  shiftOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  shiftOptionActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  shiftOptionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  shiftOptionTextActive: {
    color: '#FFFFFF',
  },
  permissionOptions: {
    gap: 8,
  },
  permissionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  permissionOptionActive: {
    opacity: 1,
  },
  permissionOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
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
  },
});

export default SupervisorManagement;
