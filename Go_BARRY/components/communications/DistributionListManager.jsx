import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConvexSync } from '../hooks/useConvexSync';
import { useSupervisorSession } from '../hooks/useSupervisorSession';

const DistributionListManager = ({ onSelectList, onClose }) => {
  const { supervisor } = useSupervisorSession();
  const { distributionLists, saveDistributionList, deleteDistributionList } = useConvexSync();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedList, setSelectedList] = useState(null);
  const [newList, setNewList] = useState({
    name: '',
    description: '',
    members: [],
    type: 'static',
    isActive: true
  });
  const [newMemberEmail, setNewMemberEmail] = useState('');

  // Default distribution lists
  const defaultLists = [
    {
      id: 'default-1',
      name: 'All Supervisors',
      description: 'All Go North East bus supervisors',
      email: 'supervisors@gonortheast.com',
      members: [
        { email: 'alex.woodcock@gonortheast.com', name: 'Alex Woodcock', role: 'Supervisor' },
        { email: 'andrew.cowley@gonortheast.com', name: 'Andrew Cowley', role: 'Supervisor' },
        { email: 'anthony.gair@gonortheast.com', name: 'Anthony Gair', role: 'Admin Supervisor' },
        { email: 'claire.fiddler@gonortheast.com', name: 'Claire Fiddler', role: 'Supervisor' },
        { email: 'david.hall@gonortheast.com', name: 'David Hall', role: 'Supervisor' },
        { email: 'james.daglish@gonortheast.com', name: 'James Daglish', role: 'Supervisor' },
        { email: 'john.paterson@gonortheast.com', name: 'John Paterson', role: 'Supervisor' },
        { email: 'simon.glass@gonortheast.com', name: 'Simon Glass', role: 'Supervisor' },
        { email: 'barry.perryman@gonortheast.com', name: 'Barry Perryman', role: 'Admin Supervisor' }
      ],
      type: 'static',
      isActive: true,
      isDefault: true
    },
    {
      id: 'default-2',
      name: 'Traffic Control',
      description: 'Traffic control room staff',
      email: 'traffic.control@gonortheast.com',
      members: [
        { email: 'control1@gonortheast.com', name: 'Control Room 1', role: 'Controller' },
        { email: 'control2@gonortheast.com', name: 'Control Room 2', role: 'Controller' },
        { email: 'control.manager@gonortheast.com', name: 'Control Manager', role: 'Manager' }
      ],
      type: 'static',
      isActive: true,
      isDefault: true
    },
    {
      id: 'default-3',
      name: 'Emergency Response Team',
      description: 'Emergency response coordinators',
      email: 'emergency@gonortheast.com',
      members: [
        { email: 'emergency.coord@gonortheast.com', name: 'Emergency Coordinator', role: 'Coordinator' },
        { email: 'ops.manager@gonortheast.com', name: 'Operations Manager', role: 'Manager' },
        { email: 'safety.officer@gonortheast.com', name: 'Safety Officer', role: 'Safety' }
      ],
      type: 'static',
      isActive: true,
      isDefault: true
    },
    {
      id: 'default-4',
      name: 'Driver Support',
      description: 'Driver support and communication team',
      email: 'driver.support@gonortheast.com',
      members: [
        { email: 'driver.liaison@gonortheast.com', name: 'Driver Liaison', role: 'Support' },
        { email: 'driver.trainer@gonortheast.com', name: 'Driver Trainer', role: 'Training' }
      ],
      type: 'static',
      isActive: true,
      isDefault: true
    }
  ];

  // Get all lists (custom + defaults)
  const allLists = [...(distributionLists || []), ...defaultLists];

  // Validate email
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Add member to new list
  const addMemberToNewList = () => {
    if (!newMemberEmail) return;
    
    if (!validateEmail(newMemberEmail)) {
      alert('Please enter a valid email address');
      return;
    }

    if (newList.members.some(m => m.email === newMemberEmail)) {
      alert('This email is already in the list');
      return;
    }

    setNewList(prev => ({
      ...prev,
      members: [...prev.members, {
        email: newMemberEmail,
        name: newMemberEmail.split('@')[0].replace(/[._-]/g, ' '),
        role: 'Member',
        addedAt: new Date().toISOString()
      }]
    }));
    setNewMemberEmail('');
  };

  // Remove member from new list
  const removeMemberFromNewList = (email) => {
    setNewList(prev => ({
      ...prev,
      members: prev.members.filter(m => m.email !== email)
    }));
  };

  // Create new list
  const handleCreateList = async () => {
    if (!newList.name) {
      alert('Please provide a list name');
      return;
    }

    if (newList.members.length === 0) {
      alert('Please add at least one member to the list');
      return;
    }

    try {
      await saveDistributionList({
        ...newList,
        email: `${newList.name.toLowerCase().replace(/\s+/g, '.')}.list@gonortheast.com`,
        createdBy: supervisor.id,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        isDefault: false
      });

      setShowCreateModal(false);
      setNewList({
        name: '',
        description: '',
        members: [],
        type: 'static',
        isActive: true
      });
      alert('Distribution list created successfully!');
    } catch (error) {
      console.error('Error creating list:', error);
      alert('Failed to create distribution list');
    }
  };

  // Delete list
  const handleDeleteList = async (listId) => {
    if (listId.startsWith('default-')) {
      alert('Cannot delete default distribution lists');
      return;
    }

    if (confirm('Are you sure you want to delete this distribution list?')) {
      try {
        await deleteDistributionList(listId);
        alert('Distribution list deleted successfully');
      } catch (error) {
        console.error('Error deleting list:', error);
        alert('Failed to delete distribution list');
      }
    }
  };

  // Select list
  const handleSelectList = (list) => {
    if (onSelectList) {
      onSelectList(list);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Distribution Lists</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add-circle" size={24} color="#059669" />
            <Text style={styles.createButtonText}>Create</Text>
          </TouchableOpacity>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content}>
        {allLists.map(list => (
          <TouchableOpacity
            key={list.id}
            style={styles.listCard}
            onPress={() => setSelectedList(list)}
          >
            <View style={styles.listHeader}>
              <Ionicons name="people" size={24} color="#059669" />
              <View style={styles.listInfo}>
                <Text style={styles.listName}>{list.name}</Text>
                <Text style={styles.listEmail}>{list.email}</Text>
                {list.description && (
                  <Text style={styles.listDescription}>{list.description}</Text>
                )}
                <Text style={styles.memberCount}>
                  {list.members.length} members
                </Text>
              </View>
              {list.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>Default</Text>
                </View>
              )}
            </View>
            <View style={styles.listActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.selectButton]}
                onPress={() => handleSelectList(list)}
              >
                <Ionicons name="checkmark-circle" size={20} color="#059669" />
                <Text style={styles.selectButtonText}>Select</Text>
              </TouchableOpacity>
              {!list.isDefault && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteList(list.id)}
                >
                  <Ionicons name="trash" size={20} color="#dc2626" />
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Create List Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Distribution List</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.field}>
              <Text style={styles.label}>List Name *</Text>
              <TextInput
                style={styles.input}
                value={newList.name}
                onChangeText={(text) => setNewList(prev => ({ ...prev, name: text }))}
                placeholder="e.g., Night Shift Team"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={styles.input}
                value={newList.description}
                onChangeText={(text) => setNewList(prev => ({ ...prev, description: text }))}
                placeholder="Brief description of this list"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Add Members *</Text>
              <View style={styles.addMemberRow}>
                <TextInput
                  style={[styles.input, styles.memberInput]}
                  value={newMemberEmail}
                  onChangeText={setNewMemberEmail}
                  placeholder="email@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.addMemberButton}
                  onPress={addMemberToNewList}
                >
                  <Ionicons name="add-circle" size={24} color="#059669" />
                </TouchableOpacity>
              </View>
            </View>

            {newList.members.length > 0 && (
              <View style={styles.membersList}>
                <Text style={styles.membersTitle}>Members ({newList.members.length})</Text>
                {newList.members.map((member, index) => (
                  <View key={index} style={styles.memberItem}>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberEmail}>{member.email}</Text>
                      <Text style={styles.memberName}>{member.name}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeMemberFromNewList(member.email)}
                    >
                      <Ionicons name="close-circle" size={20} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.field}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Active</Text>
                <Switch
                  value={newList.isActive}
                  onValueChange={(value) => setNewList(prev => ({ ...prev, isActive: value }))}
                  trackColor={{ false: '#ddd', true: '#059669' }}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleCreateList}
              disabled={!newList.name || newList.members.length === 0}
            >
              <Text style={styles.saveButtonText}>Create List</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* List Details Modal */}
      <Modal
        visible={!!selectedList}
        animationType="slide"
        onRequestClose={() => setSelectedList(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedList?.name}</Text>
            <TouchableOpacity onPress={() => setSelectedList(null)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          {selectedList && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Email:</Text>
                <Text style={styles.detailValue}>{selectedList.email}</Text>
              </View>
              {selectedList.description && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Description:</Text>
                  <Text style={styles.detailValue}>{selectedList.description}</Text>
                </View>
              )}
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Status:</Text>
                <View style={[styles.statusBadge, selectedList.isActive && styles.statusBadgeActive]}>
                  <Text style={[styles.statusText, selectedList.isActive && styles.statusTextActive]}>
                    {selectedList.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Members ({selectedList.members.length}):</Text>
                {selectedList.members.map((member, index) => (
                  <View key={index} style={styles.memberCard}>
                    <Ionicons name="person" size={20} color="#666" />
                    <View style={styles.memberCardInfo}>
                      <Text style={styles.memberCardName}>{member.name}</Text>
                      <Text style={styles.memberCardEmail}>{member.email}</Text>
                      {member.role && (
                        <Text style={styles.memberCardRole}>{member.role}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={styles.useListButton}
                onPress={() => {
                  handleSelectList(selectedList);
                  setSelectedList(null);
                }}
              >
                <Text style={styles.useListButtonText}>Use This List</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f7ed',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  listCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  listInfo: {
    flex: 1,
    marginLeft: 12,
  },
  listName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  listEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  listDescription: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  defaultBadge: {
    backgroundColor: '#e6f7ed',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  listActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  selectButton: {
    backgroundColor: '#e6f7ed',
  },
  selectButtonText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  addMemberRow: {
    flexDirection: 'row',
    gap: 8,
  },
  memberInput: {
    flex: 1,
  },
  addMemberButton: {
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  membersList: {
    marginBottom: 20,
  },
  membersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  memberInfo: {
    flex: 1,
  },
  memberEmail: {
    fontSize: 14,
    color: '#333',
  },
  memberName: {
    fontSize: 12,
    color: '#666',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#059669',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
  },
  statusBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusBadgeActive: {
    backgroundColor: '#e6f7ed',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  statusTextActive: {
    color: '#059669',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  memberCardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  memberCardEmail: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  memberCardRole: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  useListButton: {
    backgroundColor: '#059669',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  useListButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DistributionListManager;
  },
  membersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  memberInfo: {
    flex: 1,
  },
  memberEmail: {
    fontSize: 14,
    color: '#333',
  },
  memberName: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  saveButton: {
    backgroundColor: '#059669',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
  },
  statusBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusBadgeActive: {
    backgroundColor: '#e6f7ed',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  statusTextActive: {
    color: '#059669',
    fontWeight: '600',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    marginTop: 8,
  },
  memberCardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  memberCardEmail: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  memberCardRole: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  useListButton: {
    backgroundColor: '#059669',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  useListButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DistributionListManager;