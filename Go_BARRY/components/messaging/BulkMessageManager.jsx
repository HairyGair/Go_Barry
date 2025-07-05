// components/messaging/BulkMessageManager.jsx
// Bulk message operations component for Message Distribution Centre Phase 7
// Select multiple messages for batch actions, bulk operations, mass export

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupervisor } from '../hooks/useSupervisorSession';

const BulkMessageManager = ({ visible, onClose }) => {
  const { supervisor } = useSupervisor();
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all'); // all, draft, sent, scheduled
  const [bulkAction, setBulkAction] = useState(null); // delete, resend, export, schedule, template
  const [bulkTemplate, setBulkTemplate] = useState(null);
  const [bulkSchedule, setBulkSchedule] = useState(null);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Load messages when component opens
  useEffect(() => {
    if (visible) {
      loadMessages();
    }
  }, [visible, filterStatus]);

  // Handle select all toggle
  useEffect(() => {
    if (selectAll) {
      setSelectedMessages(new Set(messages.map(m => m.id)));
    } else {
      setSelectedMessages(new Set());
    }
  }, [selectAll, messages]);

  // Load messages for bulk operations
  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/messages/history', {
        headers: {
          'Content-Type': 'application/json',
          'X-Supervisor-ID': supervisor?.badgeNumber || 'unknown'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        let filteredMessages = data.messages || [];
        
        // Apply status filter
        if (filterStatus !== 'all') {
          filteredMessages = filteredMessages.filter(msg => msg.status === filterStatus);
        }
        
        setMessages(filteredMessages);
      } else {
        // No data available
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };


  // Toggle message selection
  const toggleMessageSelection = (messageId) => {
    const newSelection = new Set(selectedMessages);
    if (newSelection.has(messageId)) {
      newSelection.delete(messageId);
    } else {
      newSelection.add(messageId);
    }
    setSelectedMessages(newSelection);
    setSelectAll(newSelection.size === messages.length);
  };

  // Handle bulk action initiation
  const handleBulkAction = (action) => {
    if (selectedMessages.size === 0) {
      Alert.alert('No Selection', 'Please select at least one message to perform bulk actions.');
      return;
    }

    setBulkAction(action);
    setShowBulkActionModal(true);
  };

  // Execute bulk action
  const executeBulkAction = async () => {
    if (selectedMessages.size === 0) return;

    setProcessing(true);
    try {
      const messageIds = Array.from(selectedMessages);
      
      switch (bulkAction) {
        case 'delete':
          await executeBulkDelete(messageIds);
          break;
        case 'resend':
          await executeBulkResend(messageIds);
          break;
        case 'export':
          await executeBulkExport(messageIds);
          break;
        case 'schedule':
          await executeBulkSchedule(messageIds);
          break;
        case 'template':
          await executeBulkTemplate(messageIds);
          break;
        default:
          throw new Error('Unknown bulk action');
      }

      // Refresh messages and clear selection
      await loadMessages();
      setSelectedMessages(new Set());
      setSelectAll(false);
      setShowBulkActionModal(false);
      
      Alert.alert('Success', `Bulk ${bulkAction} completed successfully.`);
      
    } catch (error) {
      console.error('Bulk action failed:', error);
      Alert.alert('Error', `Bulk ${bulkAction} failed. Please try again.`);
    } finally {
      setProcessing(false);
    }
  };

  // Execute bulk delete
  const executeBulkDelete = async (messageIds) => {
    for (const messageId of messageIds) {
      const message = messages.find(m => m.id === messageId);
      if (message?.status === 'draft') {
        await fetch(`/api/messages/${messageId}`, {
          method: 'DELETE',
          headers: {
            'X-Supervisor-ID': supervisor?.badgeNumber || 'unknown'
          }
        });
      }
    }
  };

  // Execute bulk resend
  const executeBulkResend = async (messageIds) => {
    for (const messageId of messageIds) {
      const message = messages.find(m => m.id === messageId);
      if (message?.status === 'sent') {
        await fetch(`/api/messages/${messageId}/resend`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Supervisor-ID': supervisor?.badgeNumber || 'unknown'
          }
        });
      }
    }
  };

  // Execute bulk export
  const executeBulkExport = async (messageIds) => {
    const selectedMessagesData = messages.filter(m => messageIds.includes(m.id));
    
    // Generate CSV content
    const csvHeaders = ['ID', 'Subject', 'Status', 'Priority', 'Category', 'Routes', 'Created', 'Sent', 'Recipients', 'Open Rate'];
    const csvRows = selectedMessagesData.map(msg => [
      msg.id,
      `"${msg.subject}"`,
      msg.status,
      msg.priority,
      msg.category,
      `"${msg.routes.join(', ')}"`,
      new Date(msg.createdAt).toLocaleString('en-GB'),
      msg.sentAt ? new Date(msg.sentAt).toLocaleString('en-GB') : '',
      msg.recipientCount || 0,
      msg.openRate ? Math.round(msg.openRate * 100) + '%' : ''
    ]);
    
    const csvContent = [csvHeaders, ...csvRows].map(row => row.join(',')).join('\n');
    
    // For web, trigger download
    if (Platform.OS === 'web') {
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulk_messages_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  // Execute bulk schedule
  const executeBulkSchedule = async (messageIds) => {
    if (!bulkSchedule) {
      throw new Error('Schedule time not specified');
    }
    
    for (const messageId of messageIds) {
      await fetch(`/api/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Supervisor-ID': supervisor?.badgeNumber || 'unknown'
        },
        body: JSON.stringify({
          status: 'scheduled',
          scheduledFor: bulkSchedule
        })
      });
    }
  };

  // Execute bulk template application
  const executeBulkTemplate = async (messageIds) => {
    if (!bulkTemplate) {
      throw new Error('Template not specified');
    }
    
    for (const messageId of messageIds) {
      await fetch(`/api/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Supervisor-ID': supervisor?.badgeNumber || 'unknown'
        },
        body: JSON.stringify({
          template: bulkTemplate.id,
          content: bulkTemplate.content,
          category: bulkTemplate.category
        })
      });
    }
  };

  // Get status info for display
  const getStatusInfo = (status) => {
    const statusMap = {
      sent: { color: '#10B981', icon: 'checkmark-circle', bg: '#ECFDF5' },
      draft: { color: '#F59E0B', icon: 'document-text', bg: '#FFFBEB' },
      scheduled: { color: '#3B82F6', icon: 'time', bg: '#EFF6FF' }
    };
    return statusMap[status] || statusMap.sent;
  };

  // Render filter controls
  const renderFilterControls = () => (
    <View style={styles.filterContainer}>
      <Text style={styles.filterLabel}>Filter by Status:</Text>
      <View style={styles.filterButtons}>
        {['all', 'sent', 'draft', 'scheduled'].map(status => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              filterStatus === status && styles.filterButtonActive
            ]}
            onPress={() => setFilterStatus(status)}
          >
            <Text style={[
              styles.filterButtonText,
              filterStatus === status && styles.filterButtonTextActive
            ]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Render selection controls
  const renderSelectionControls = () => (
    <View style={styles.selectionContainer}>
      <View style={styles.selectAllContainer}>
        <Switch
          value={selectAll}
          onValueChange={setSelectAll}
          thumbColor={selectAll ? '#2563EB' : '#F3F4F6'}
          trackColor={{ false: '#D1D5DB', true: '#DBEAFE' }}
        />
        <Text style={styles.selectAllText}>
          Select All ({selectedMessages.size} of {messages.length} selected)
        </Text>
      </View>
      
      {selectedMessages.size > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bulkActions}>
          <TouchableOpacity
            style={[styles.bulkActionButton, { backgroundColor: '#DC2626' }]}
            onPress={() => handleBulkAction('delete')}
          >
            <Ionicons name="trash" size={16} color="#FFFFFF" />
            <Text style={styles.bulkActionText}>Delete</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.bulkActionButton, { backgroundColor: '#2563EB' }]}
            onPress={() => handleBulkAction('resend')}
          >
            <Ionicons name="paper-plane" size={16} color="#FFFFFF" />
            <Text style={styles.bulkActionText}>Resend</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.bulkActionButton, { backgroundColor: '#10B981' }]}
            onPress={() => handleBulkAction('export')}
          >
            <Ionicons name="download" size={16} color="#FFFFFF" />
            <Text style={styles.bulkActionText}>Export</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.bulkActionButton, { backgroundColor: '#8B5CF6' }]}
            onPress={() => handleBulkAction('schedule')}
          >
            <Ionicons name="time" size={16} color="#FFFFFF" />
            <Text style={styles.bulkActionText}>Schedule</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.bulkActionButton, { backgroundColor: '#F59E0B' }]}
            onPress={() => handleBulkAction('template')}
          >
            <Ionicons name="document-text" size={16} color="#FFFFFF" />
            <Text style={styles.bulkActionText}>Apply Template</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );

  // Render message item
  const renderMessageItem = (message) => {
    const isSelected = selectedMessages.has(message.id);
    const statusInfo = getStatusInfo(message.status);
    
    return (
      <TouchableOpacity
        key={message.id}
        style={[styles.messageItem, isSelected && styles.messageItemSelected]}
        onPress={() => toggleMessageSelection(message.id)}
      >
        <View style={styles.messageHeader}>
          <View style={styles.selectionCheckbox}>
            <Ionicons 
              name={isSelected ? 'checkmark-circle' : 'ellipse-outline'} 
              size={24} 
              color={isSelected ? '#2563EB' : '#9CA3AF'} 
            />
          </View>
          
          <View style={styles.messageInfo}>
            <View style={styles.messageTopRow}>
              <Text style={styles.messageSubject} numberOfLines={1}>
                {message.subject}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                <Ionicons name={statusInfo.icon} size={12} color={statusInfo.color} />
                <Text style={[styles.statusText, { color: statusInfo.color }]}>
                  {message.status.toUpperCase()}
                </Text>
              </View>
            </View>
            
            <View style={styles.messageBottomRow}>
              <Text style={styles.messageRoutes}>
                Routes: {message.routes.join(', ')}
              </Text>
              <Text style={styles.messageDate}>
                {new Date(message.createdAt).toLocaleDateString('en-GB')}
              </Text>
            </View>
            
            {message.status === 'sent' && (
              <View style={styles.messageStats}>
                <Text style={styles.messageStat}>
                  {message.recipientCount} recipients
                </Text>
                {message.openRate && (
                  <Text style={styles.messageStat}>
                    {Math.round(message.openRate * 100)}% opened
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render bulk action modal
  const renderBulkActionModal = () => (
    <Modal
      visible={showBulkActionModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowBulkActionModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Bulk {bulkAction?.charAt(0).toUpperCase() + bulkAction?.slice(1)}
            </Text>
            <TouchableOpacity onPress={() => setShowBulkActionModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              You are about to perform a bulk {bulkAction} on {selectedMessages.size} message{selectedMessages.size !== 1 ? 's' : ''}.
            </Text>
            
            {bulkAction === 'schedule' && (
              <View style={styles.scheduleInput}>
                <Text style={styles.inputLabel}>Schedule for:</Text>
                <TextInput
                  style={styles.textInput}
                  value={bulkSchedule}
                  onChangeText={setBulkSchedule}
                  placeholder="YYYY-MM-DD HH:MM"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            )}
            
            {bulkAction === 'delete' && (
              <Text style={styles.warningText}>
                ⚠️ This action cannot be undone. Only draft messages will be deleted.
              </Text>
            )}
          </View>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowBulkActionModal(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={executeBulkAction}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.modalButtonTextPrimary}>
                  Confirm {bulkAction?.charAt(0).toUpperCase() + bulkAction?.slice(1)}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#6B7280" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Bulk Message Manager</Text>
            <Text style={styles.headerSubtitle}>
              Select and manage multiple messages at once
            </Text>
          </View>
        </View>

        {renderFilterControls()}
        {renderSelectionControls()}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.messageList}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="mail-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyStateText}>
                  No messages found for the selected filter
                </Text>
              </View>
            ) : (
              messages.map(renderMessageItem)
            )}
          </ScrollView>
        )}

        {renderBulkActionModal()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'web' ? 20 : 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  filterButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  selectionContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  selectAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  selectAllText: {
    fontSize: 14,
    color: '#374151',
  },
  bulkActions: {
    flexDirection: 'row',
  },
  bulkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    gap: 6,
  },
  bulkActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  messageList: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
    textAlign: 'center',
  },
  messageItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  messageItemSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  selectionCheckbox: {
    marginRight: 12,
    paddingTop: 2,
  },
  messageInfo: {
    flex: 1,
  },
  messageTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  messageSubject: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  messageBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  messageRoutes: {
    fontSize: 12,
    color: '#6B7280',
  },
  messageDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  messageStats: {
    flexDirection: 'row',
    gap: 16,
  },
  messageStat: {
    fontSize: 12,
    color: '#6B7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalContent: {
    padding: 20,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  scheduleInput: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  warningText: {
    fontSize: 14,
    color: '#DC2626',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  modalButtonPrimary: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  modalButtonTextPrimary: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

export default BulkMessageManager;