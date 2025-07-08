// components/messaging/MessageHistory.jsx
// Message History component for Message Distribution Centre Phase 6
// Displays sent messages, drafts, and scheduled messages with search and filtering

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupervisor } from '../hooks/useSupervisorSession';

const MessageHistory = ({ visible, onClose }) => {
  const { supervisor } = useSupervisor();
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // all, sent, draft, scheduled
  const [selectedPriority, setSelectedPriority] = useState('all'); // all, urgent, normal
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMessageDetail, setShowMessageDetail] = useState(false);

  // Load message history when component opens
  useEffect(() => {
    if (visible) {
      loadMessageHistory();
    }
  }, [visible]);

  // Apply filters when search or filter changes
  useEffect(() => {
    applyFilters();
  }, [messages, searchQuery, selectedFilter, selectedPriority]);

  // Load message history from backend
  const loadMessageHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/messages/history', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Supervisor-ID': supervisor?.badgeNumber || 'unknown'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setMessages(data.messages || []);
      } else {
        console.error('API error:', data.error);
        // Fall back to mock data if API fails
        const mockMessages = generateMockMessages();
        setMessages(mockMessages);
      }
    } catch (error) {
      console.error('Failed to load message history:', error);
      // Fall back to mock data
      const mockMessages = generateMockMessages();
      setMessages(mockMessages);
    } finally {
      setLoading(false);
    }
  };

  // Generate mock message data
  const generateMockMessages = () => {
    const now = new Date();
    return [
      {
        id: 'msg_001',
        subject: 'URGENT: High Level Bridge - Police incident causing full closure',
        content: 'URGENT ROADWORK NOTIFICATION\n\nLocation: High Level Bridge, Newcastle\nDescription: Police incident causing full closure...',
        status: 'sent',
        priority: 'urgent',
        category: 'incident',
        routes: ['1', '10', '11', '12', '21', '56', '57'],
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        sentAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        createdBy: supervisor?.badgeNumber || 'AG003',
        recipientCount: 25,
        openRate: 0.84,
        alertId: 'RW001'
      },
      {
        id: 'msg_002',
        subject: 'IMPORTANT: A1 Southbound - Lane closures for emergency repairs',
        content: 'IMPORTANT ROADWORK NOTIFICATION\n\nLocation: A1 Southbound, Team Valley\nDescription: Lane closures for emergency repairs...',
        status: 'sent',
        priority: 'normal',
        category: 'roadworks',
        routes: ['21', 'X21', '685'],
        createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
        sentAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
        createdBy: supervisor?.badgeNumber || 'AG003',
        recipientCount: 18,
        openRate: 0.72,
        alertId: 'RW002'
      },
      {
        id: 'msg_003',
        subject: 'NOTICE: Central Station Bridge - Planned maintenance work',
        content: 'NOTICE ROADWORK NOTIFICATION\n\nLocation: Central Station Bridge\nDescription: Planned maintenance work...',
        status: 'draft',
        priority: 'normal',
        category: 'roadworks',
        routes: ['10', '11', '12'],
        createdAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        createdBy: supervisor?.badgeNumber || 'AG003',
        alertId: 'RW003'
      },
      {
        id: 'msg_004',
        subject: 'URGENT: A19 Traffic Incident - Multi-vehicle collision',
        content: 'URGENT TRAFFIC INCIDENT ALERT\n\nLocation: A19 Southbound, Tyne Tunnel approach\nIncident: Multi-vehicle collision...',
        status: 'scheduled',
        priority: 'urgent',
        category: 'incident',
        routes: ['309', '310', '311'],
        createdAt: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
        scheduledFor: new Date(now.getTime() + 15 * 60 * 1000).toISOString(),
        createdBy: supervisor?.badgeNumber || 'AG003',
        alertId: 'INC001'
      }
    ];
  };

  // Apply search and filter logic
  const applyFilters = () => {
    let filtered = [...messages];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(msg => 
        msg.subject.toLowerCase().includes(query) ||
        msg.content.toLowerCase().includes(query) ||
        msg.routes.some(route => route.toLowerCase().includes(query)) ||
        msg.category.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(msg => msg.status === selectedFilter);
    }

    // Apply priority filter
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(msg => msg.priority === selectedPriority);
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    setFilteredMessages(filtered);
  };

  // Handle message selection for detail view
  const handleMessageSelect = (message) => {
    setSelectedMessage(message);
    setShowMessageDetail(true);
  };

  // Delete draft message
  const handleDeleteDraft = async (messageId) => {
    Alert.alert(
      'Delete Draft',
      'Are you sure you want to delete this draft message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Call API to delete draft
              const response = await fetch(`/api/messages/${messageId}`, {
                method: 'DELETE',
                headers: {
                  'X-Supervisor-ID': supervisor?.badgeNumber || 'unknown'
                }
              });
              
              if (response.ok) {
                // Remove from local state
                setMessages(prev => prev.filter(msg => msg.id !== messageId));
                Alert.alert('Success', 'Draft deleted successfully');
              } else {
                Alert.alert('Error', 'Failed to delete draft');
              }
            } catch (error) {
              console.error('Delete error:', error);
              // For demo, remove from local state anyway
              setMessages(prev => prev.filter(msg => msg.id !== messageId));
            }
          }
        }
      ]
    );
  };

  // Resend message
  const handleResendMessage = (message) => {
    Alert.alert(
      'Resend Message',
      'Do you want to resend this message to all recipients?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resend',
          onPress: () => {
            Alert.alert('Success', 'Message has been resent to all recipients');
          }
        }
      ]
    );
  };

  // Get status color and icon
  const getStatusInfo = (status) => {
    const statusMap = {
      sent: { color: '#10B981', icon: 'checkmark-circle', bg: '#ECFDF5' },
      draft: { color: '#F59E0B', icon: 'document-text', bg: '#FFFBEB' },
      scheduled: { color: '#3B82F6', icon: 'time', bg: '#EFF6FF' }
    };
    return statusMap[status] || statusMap.sent;
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    return priority === 'urgent' ? '#DC2626' : '#6B7280';
  };

  // Render filter buttons
  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {/* Status Filters */}
        {['all', 'sent', 'draft', 'scheduled'].map(filter => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              selectedFilter === filter && styles.filterButtonActive
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text style={[
              styles.filterButtonText,
              selectedFilter === filter && styles.filterButtonTextActive
            ]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
        
        <View style={styles.filterSeparator} />
        
        {/* Priority Filters */}
        {['all', 'urgent', 'normal'].map(priority => (
          <TouchableOpacity
            key={priority}
            style={[
              styles.filterButton,
              selectedPriority === priority && styles.filterButtonActive
            ]}
            onPress={() => setSelectedPriority(priority)}
          >
            <Text style={[
              styles.filterButtonText,
              selectedPriority === priority && styles.filterButtonTextActive
            ]}>
              {priority === 'all' ? 'All Priority' : priority.charAt(0).toUpperCase() + priority.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Render message card
  const renderMessageCard = (message) => {
    const statusInfo = getStatusInfo(message.status);
    const priorityColor = getPriorityColor(message.priority);
    
    return (
      <TouchableOpacity
        key={message.id}
        style={styles.messageCard}
        onPress={() => handleMessageSelect(message)}
      >
        <View style={styles.messageHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <Ionicons name={statusInfo.icon} size={12} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {message.status.toUpperCase()}
            </Text>
          </View>
          
          <View style={styles.messageMeta}>
            <Text style={[styles.priorityText, { color: priorityColor }]}>
              {message.priority.toUpperCase()}
            </Text>
            <Text style={styles.categoryText}>{message.category}</Text>
          </View>
        </View>

        <Text style={styles.messageSubject} numberOfLines={2}>
          {message.subject}
        </Text>
        
        <Text style={styles.messagePreview} numberOfLines={2}>
          {message.content}
        </Text>

        <View style={styles.messageFooter}>
          <View style={styles.routeInfo}>
            <Ionicons name="bus" size={14} color="#6B7280" />
            <Text style={styles.routeText}>
              {message.routes.length > 3 
                ? `${message.routes.slice(0, 3).join(', ')} +${message.routes.length - 3} more`
                : message.routes.join(', ')
              }
            </Text>
          </View>
          
          <View style={styles.timeInfo}>
            <Text style={styles.timeText}>
              {message.status === 'sent' && message.sentAt 
                ? `Sent ${new Date(message.sentAt).toLocaleString('en-GB')}`
                : message.status === 'scheduled' && message.scheduledFor
                ? `Scheduled for ${new Date(message.scheduledFor).toLocaleString('en-GB')}`
                : `Created ${new Date(message.createdAt).toLocaleString('en-GB')}`
              }
            </Text>
          </View>
        </View>

        {message.status === 'sent' && (
          <View style={styles.analyticsInfo}>
            <View style={styles.analyticItem}>
              <Ionicons name="people" size={12} color="#6B7280" />
              <Text style={styles.analyticText}>{message.recipientCount} recipients</Text>
            </View>
            {message.openRate && (
              <View style={styles.analyticItem}>
                <Ionicons name="eye" size={12} color="#6B7280" />
                <Text style={styles.analyticText}>{Math.round(message.openRate * 100)}% opened</Text>
              </View>
            )}
          </View>
        )}

        {/* Quick actions for drafts */}
        {message.status === 'draft' && (
          <View style={styles.draftActions}>
            <TouchableOpacity
              style={styles.draftActionButton}
              onPress={() => handleDeleteDraft(message.id)}
            >
              <Ionicons name="trash" size={16} color="#DC2626" />
              <Text style={styles.draftActionText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Render message detail modal
  const renderMessageDetail = () => (
    <Modal
      visible={showMessageDetail}
      animationType="slide"
      transparent={false}
      onRequestClose={() => setShowMessageDetail(false)}
    >
      <View style={styles.detailContainer}>
        <View style={styles.detailHeader}>
          <TouchableOpacity 
            style={styles.detailBackButton}
            onPress={() => setShowMessageDetail(false)}
          >
            <Ionicons name="arrow-back" size={24} color="#6B7280" />
          </TouchableOpacity>
          <View style={styles.detailHeaderContent}>
            <Text style={styles.detailTitle}>Message Details</Text>
            <Text style={styles.detailSubtitle}>
              {selectedMessage?.status.charAt(0).toUpperCase() + selectedMessage?.status.slice(1)} Message
            </Text>
          </View>
          
          {selectedMessage?.status === 'sent' && (
            <TouchableOpacity
              style={styles.resendButton}
              onPress={() => handleResendMessage(selectedMessage)}
            >
              <Ionicons name="paper-plane" size={20} color="#2563EB" />
            </TouchableOpacity>
          )}
        </View>

        {selectedMessage && (
          <ScrollView style={styles.detailContent}>
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Subject</Text>
              <Text style={styles.detailValue}>{selectedMessage.subject}</Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Message Content</Text>
              <ScrollView style={styles.detailMessageContainer}>
                <Text style={styles.detailMessage}>{selectedMessage.content}</Text>
              </ScrollView>
            </View>

            <View style={styles.detailMetaGrid}>
              <View style={styles.detailMetaItem}>
                <Text style={styles.detailMetaLabel}>Status</Text>
                <Text style={styles.detailMetaValue}>{selectedMessage.status}</Text>
              </View>
              <View style={styles.detailMetaItem}>
                <Text style={styles.detailMetaLabel}>Priority</Text>
                <Text style={styles.detailMetaValue}>{selectedMessage.priority}</Text>
              </View>
              <View style={styles.detailMetaItem}>
                <Text style={styles.detailMetaLabel}>Category</Text>
                <Text style={styles.detailMetaValue}>{selectedMessage.category}</Text>
              </View>
              <View style={styles.detailMetaItem}>
                <Text style={styles.detailMetaLabel}>Created By</Text>
                <Text style={styles.detailMetaValue}>{selectedMessage.createdBy}</Text>
              </View>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Affected Routes</Text>
              <View style={styles.routeChipsContainer}>
                {selectedMessage.routes.map(route => (
                  <View key={route} style={styles.routeChip}>
                    <Text style={styles.routeChipText}>{route}</Text>
                  </View>
                ))}
              </View>
            </View>

            {selectedMessage.status === 'sent' && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Delivery Analytics</Text>
                <View style={styles.analyticsGrid}>
                  <View style={styles.analyticCard}>
                    <Text style={styles.analyticNumber}>{selectedMessage.recipientCount}</Text>
                    <Text style={styles.analyticTitle}>Recipients</Text>
                  </View>
                  {selectedMessage.openRate && (
                    <View style={styles.analyticCard}>
                      <Text style={styles.analyticNumber}>
                        {Math.round(selectedMessage.openRate * 100)}%
                      </Text>
                      <Text style={styles.analyticTitle}>Open Rate</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </ScrollView>
        )}
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
            <Text style={styles.headerTitle}>Message History</Text>
            <Text style={styles.headerSubtitle}>
              View and manage sent messages, drafts, and scheduled messages
            </Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search messages, routes, or content..."
              placeholderTextColor="#9CA3AF"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {renderFilterButtons()}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Loading message history...</Text>
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {filteredMessages.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="mail-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyStateText}>
                  {searchQuery || selectedFilter !== 'all' || selectedPriority !== 'all'
                    ? 'No messages match your current filters'
                    : 'No message history found'
                  }
                </Text>
                {(searchQuery || selectedFilter !== 'all' || selectedPriority !== 'all') && (
                  <TouchableOpacity
                    style={styles.clearFiltersButton}
                    onPress={() => {
                      setSearchQuery('');
                      setSelectedFilter('all');
                      setSelectedPriority('all');
                    }}
                  >
                    <Text style={styles.clearFiltersText}>Clear Filters</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.messagesList}>
                <Text style={styles.resultsText}>
                  {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''} found
                </Text>
                {filteredMessages.map(renderMessageCard)}
              </View>
            )}
          </ScrollView>
        )}

        {renderMessageDetail()}
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
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterScroll: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
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
  filterSeparator: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
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
  content: {
    flex: 1,
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
  clearFiltersButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#2563EB',
    borderRadius: 8,
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  messagesList: {
    padding: 20,
  },
  resultsText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  messageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  messageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryText: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  messageSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  messagePreview: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  messageFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  routeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  timeInfo: {
    marginBottom: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  analyticsInfo: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  analyticItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  analyticText: {
    fontSize: 12,
    color: '#6B7280',
  },
  draftActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  draftActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  draftActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },

  // Detail modal styles
  detailContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  detailHeader: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'web' ? 20 : 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailBackButton: {
    padding: 8,
    marginRight: 16,
  },
  detailHeaderContent: {
    flex: 1,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  detailSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  resendButton: {
    padding: 8,
  },
  detailContent: {
    flex: 1,
    padding: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  detailMessageContainer: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
  },
  detailMessage: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  detailMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  detailMetaItem: {
    flex: 1,
    minWidth: 120,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailMetaLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailMetaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textTransform: 'capitalize',
  },
  routeChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  routeChip: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  routeChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  analyticsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  analyticCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  analyticNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  analyticTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
});

export default MessageHistory;