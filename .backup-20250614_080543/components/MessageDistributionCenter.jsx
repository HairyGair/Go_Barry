// Go_BARRY/components/MessageDistributionCenter.jsx
// Phase 4: Multi-Channel Distribution & Automation System

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Switch,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupervisorSession } from './hooks/useSupervisorSession';

const isWeb = Platform.OS === 'web';

// Message channels configuration
const MESSAGE_CHANNELS = {
  ticketer: {
    name: 'Ticketer (Driver/Crew)',
    icon: 'car',
    color: '#3B82F6',
    description: 'Direct messages to vehicle systems',
    apiEndpoint: '/api/messaging/ticketer',
    enabled: true,
    requiresAuth: true
  },
  passengerCloud: {
    name: 'Passenger Cloud (Website)',
    icon: 'globe',
    color: '#10B981',
    description: 'Website passenger information',
    apiEndpoint: '/api/messaging/passenger-cloud',
    enabled: true,
    requiresAuth: true
  },
  socialMedia: {
    name: 'Social Media',
    icon: 'share-social',
    color: '#8B5CF6',
    description: 'Twitter/Facebook updates',
    apiEndpoint: '/api/messaging/social',
    enabled: false,
    requiresAuth: true
  },
  email: {
    name: 'Email Alerts',
    icon: 'mail',
    color: '#F59E0B',
    description: 'SMT/Comms/Depot notifications',
    apiEndpoint: '/api/messaging/email',
    enabled: true,
    requiresAuth: false
  },
  sms: {
    name: 'SMS Alerts',
    icon: 'chatbubble-ellipses',
    color: '#EF4444',
    description: 'Critical supervisor notifications',
    apiEndpoint: '/api/messaging/sms',
    enabled: false,
    requiresAuth: true
  }
};

// Email distribution lists
const EMAIL_LISTS = {
  smt: {
    name: 'Senior Management Team',
    emails: ['barry.perryman@gonortheast.co.uk', 'smt@gonortheast.co.uk'],
    description: 'Critical incidents only'
  },
  comms: {
    name: 'Communications Team',
    emails: ['comms@gonortheast.co.uk'],
    description: 'All public-facing disruptions'
  },
  depots: {
    name: 'All Depots',
    emails: ['operations@gonortheast.co.uk'],
    description: 'Operational updates'
  },
  supervisors: {
    name: 'All Supervisors',
    emails: ['supervisors@gonortheast.co.uk'],
    description: 'Supervisor notifications'
  }
};

const MessageDistributionCenter = ({ baseUrl }) => {
  const { 
    isLoggedIn, 
    supervisorName, 
    hasPermission, 
    logActivity 
  } = useSupervisorSession();

  // State management
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [channelStatus, setChannelStatus] = useState({});
  const [distributionStats, setDistributionStats] = useState({});

  // New message state
  const [newMessage, setNewMessage] = useState({
    title: '',
    content: '',
    priority: 'Medium',
    channels: [],
    emailLists: [],
    scheduleTime: '',
    expiryTime: '',
    affectedRoutes: [],
    locations: []
  });

  // Template state
  const [showTemplates, setShowTemplates] = useState(false);
  const [messageTemplates] = useState([
    {
      id: 'service_disruption',
      name: 'Service Disruption',
      title: 'Service Disruption - Route {route}',
      content: 'We are experiencing disruption to Route {route} services due to {reason} at {location}. Expected delays: {delay}. We apologize for any inconvenience.',
      channels: ['ticketer', 'passengerCloud', 'email'],
      priority: 'High'
    },
    {
      id: 'planned_diversion',
      name: 'Planned Diversion',
      title: 'Planned Diversion - Route {route}',
      content: 'Route {route} will be diverted via {diversion} due to {reason} at {location}. This will be in effect from {startTime} to {endTime}.',
      channels: ['ticketer', 'passengerCloud'],
      priority: 'Medium'
    },
    {
      id: 'service_restored',
      name: 'Service Restored',
      title: 'Service Restored - Route {route}',
      content: 'Route {route} services have now returned to normal operation. Thank you for your patience during the disruption.',
      channels: ['passengerCloud', 'email'],
      priority: 'Low'
    }
  ]);

  // API base URL
  const API_BASE = baseUrl || (isWeb 
    ? (window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://go-barry.onrender.com')
    : 'https://go-barry.onrender.com'
  );

  // Load data on mount
  useEffect(() => {
    loadMessages();
    loadChannelStatus();
    loadDistributionStats();
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    try {
      // Mock data for now - in production this would come from backend
      const mockMessages = [
        {
          id: 'msg_001',
          title: 'Service Disruption - Route Q3',
          content: 'Route Q3 experiencing delays due to roadworks on Grainger Street',
          priority: 'High',
          channels: ['ticketer', 'passengerCloud', 'email'],
          status: 'sent',
          sentAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          sentBy: 'Alex Woodcock',
          recipients: 45
        },
        {
          id: 'msg_002',
          title: 'Planned Diversion - Route 21',
          content: 'Route 21 will use temporary diversion via Durham Road',
          priority: 'Medium',
          channels: ['ticketer', 'passengerCloud'],
          status: 'sent',
          sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          sentBy: 'David Hall',
          recipients: 28
        }
      ];
      setMessages(mockMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChannelStatus = async () => {
    // Mock channel status - in production this would check actual API connectivity
    const status = {};
    Object.keys(MESSAGE_CHANNELS).forEach(channelId => {
      status[channelId] = {
        online: Math.random() > 0.1, // 90% uptime simulation
        lastCheck: new Date().toISOString(),
        responseTime: Math.floor(Math.random() * 500) + 100
      };
    });
    setChannelStatus(status);
  };

  const loadDistributionStats = async () => {
    // Mock distribution statistics
    setDistributionStats({
      totalMessagesSent: 156,
      todayMessages: 12,
      successRate: 98.5,
      averageDeliveryTime: '2.3 seconds',
      channelPerformance: {
        ticketer: { sent: 45, delivered: 44, failed: 1 },
        passengerCloud: { sent: 38, delivered: 38, failed: 0 },
        email: { sent: 25, delivered: 24, failed: 1 },
        sms: { sent: 8, delivered: 8, failed: 0 }
      }
    });
  };

  // Send message to all selected channels
  const sendMessage = async () => {
    if (!isLoggedIn) {
      alert('Please log in as a supervisor to send messages');
      return;
    }

    if (!newMessage.title || !newMessage.content || newMessage.channels.length === 0) {
      alert('Please fill in required fields (Title, Content, and select at least one channel)');
      return;
    }

    setLoading(true);
    try {
      const messageData = {
        ...newMessage,
        id: 'msg_' + Date.now(),
        sentBy: supervisorName,
        sentAt: new Date().toISOString(),
        status: 'sending'
      };

      // Simulate sending to each channel
      const sendResults = {};
      for (const channelId of newMessage.channels) {
        try {
          // In production, this would make actual API calls
          await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
          sendResults[channelId] = { success: true, recipients: Math.floor(Math.random() * 50) + 10 };
        } catch (error) {
          sendResults[channelId] = { success: false, error: error.message };
        }
      }

      // Update message status
      messageData.status = 'sent';
      messageData.sendResults = sendResults;
      messageData.recipients = Object.values(sendResults).reduce((total, result) => 
        total + (result.recipients || 0), 0
      );

      // Add to messages list
      setMessages(prev => [messageData, ...prev]);

      // Log activity
      logActivity(
        'SEND_MESSAGE',
        `Sent "${newMessage.title}" to ${newMessage.channels.length} channels`,
        messageData.id
      );

      // Reset form
      setNewMessage({
        title: '',
        content: '',
        priority: 'Medium',
        channels: [],
        emailLists: [],
        scheduleTime: '',
        expiryTime: '',
        affectedRoutes: [],
        locations: []
      });

      setShowNewMessage(false);
      alert('Message sent successfully to all selected channels');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  // Apply message template
  const applyTemplate = (template) => {
    setNewMessage(prev => ({
      ...prev,
      title: template.title,
      content: template.content,
      channels: template.channels,
      priority: template.priority
    }));
    setShowTemplates(false);
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.unauthorizedContainer}>
        <Ionicons name="lock-closed" size={48} color="#6B7280" />
        <Text style={styles.unauthorizedTitle}>Supervisor Access Required</Text>
        <Text style={styles.unauthorizedText}>
          Please log in as a supervisor to access message distribution
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>📢 Message Distribution Center</Text>
          <Text style={styles.subtitle}>Multi-channel communication system</Text>
        </View>
        
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowNewMessage(true)}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.createButtonText}>New Message</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Dashboard */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{distributionStats.todayMessages}</Text>
          <Text style={styles.statLabel}>Today's Messages</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{distributionStats.successRate}%</Text>
          <Text style={styles.statLabel}>Success Rate</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{distributionStats.averageDeliveryTime}</Text>
          <Text style={styles.statLabel}>Avg. Delivery</Text>
        </View>
      </View>

      {/* Channel Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Channel Status</Text>
        <View style={styles.channelsGrid}>
          {Object.entries(MESSAGE_CHANNELS).map(([channelId, channel]) => {
            const status = channelStatus[channelId];
            return (
              <View key={channelId} style={styles.channelCard}>
                <View style={styles.channelHeader}>
                  <Ionicons name={channel.icon} size={20} color={channel.color} />
                  <View style={[
                    styles.statusIndicator,
                    { backgroundColor: status?.online ? '#10B981' : '#EF4444' }
                  ]} />
                </View>
                <Text style={styles.channelName}>{channel.name}</Text>
                <Text style={styles.channelStatus}>
                  {status?.online ? 'Online' : 'Offline'}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Recent Messages */}
      <ScrollView style={styles.messagesList}>
        <Text style={styles.sectionTitle}>Recent Messages</Text>
        
        {loading && messages.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Messages</Text>
            <Text style={styles.emptyText}>No messages have been sent yet.</Text>
          </View>
        ) : (
          messages.map((message) => (
            <View key={message.id} style={styles.messageCard}>
              <View style={styles.messageHeader}>
                <Text style={styles.messageTitle}>{message.title}</Text>
                <View style={styles.messagePriority}>
                  <Text style={styles.messagePriorityText}>{message.priority}</Text>
                </View>
              </View>
              
              <Text style={styles.messageContent} numberOfLines={2}>
                {message.content}
              </Text>
              
              <View style={styles.messageChannels}>
                {message.channels.map((channelId, index) => (
                  <View key={index} style={styles.channelBadge}>
                    <Ionicons 
                      name={MESSAGE_CHANNELS[channelId]?.icon || 'radio'} 
                      size={12} 
                      color={MESSAGE_CHANNELS[channelId]?.color || '#6B7280'} 
                    />
                    <Text style={styles.channelBadgeText}>
                      {MESSAGE_CHANNELS[channelId]?.name || channelId}
                    </Text>
                  </View>
                ))}
              </View>
              
              <View style={styles.messageFooter}>
                <Text style={styles.messageTime}>
                  {new Date(message.sentAt).toLocaleString()}
                </Text>
                <Text style={styles.messageRecipients}>
                  {message.recipients} recipients
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* New Message Modal */}
      <Modal
        visible={showNewMessage}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNewMessage(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Message</Text>
            <View style={styles.modalHeaderActions}>
              <TouchableOpacity
                style={styles.templatesButton}
                onPress={() => setShowTemplates(true)}
              >
                <Ionicons name="documents" size={20} color="#3B82F6" />
                <Text style={styles.templatesButtonText}>Templates</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowNewMessage(false)}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Message Title */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Title *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter message title..."
                value={newMessage.title}
                onChangeText={(text) => setNewMessage(prev => ({ ...prev, title: text }))}
              />
            </View>

            {/* Message Content */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Content *</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Enter message content..."
                value={newMessage.content}
                onChangeText={(text) => setNewMessage(prev => ({ ...prev, content: text }))}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Priority */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Priority</Text>
              <View style={styles.priorityButtons}>
                {['Low', 'Medium', 'High', 'Critical'].map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityButton,
                      newMessage.priority === priority && styles.priorityButtonSelected
                    ]}
                    onPress={() => setNewMessage(prev => ({ ...prev, priority }))}
                  >
                    <Text style={[
                      styles.priorityButtonText,
                      newMessage.priority === priority && styles.priorityButtonTextSelected
                    ]}>
                      {priority}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Channels */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Distribution Channels *</Text>
              {Object.entries(MESSAGE_CHANNELS).map(([channelId, channel]) => (
                <View key={channelId} style={styles.channelSelector}>
                  <View style={styles.channelSelectorInfo}>
                    <Ionicons name={channel.icon} size={20} color={channel.color} />
                    <View style={styles.channelSelectorText}>
                      <Text style={styles.channelSelectorName}>{channel.name}</Text>
                      <Text style={styles.channelSelectorDesc}>{channel.description}</Text>
                    </View>
                  </View>
                  <Switch
                    value={newMessage.channels.includes(channelId)}
                    onValueChange={(enabled) => {
                      setNewMessage(prev => ({
                        ...prev,
                        channels: enabled 
                          ? [...prev.channels, channelId]
                          : prev.channels.filter(c => c !== channelId)
                      }));
                    }}
                    trackColor={{ false: '#E5E7EB', true: channel.color }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowNewMessage(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!newMessage.title || !newMessage.content || newMessage.channels.length === 0) && styles.sendButtonDisabled
                ]}
                onPress={sendMessage}
                disabled={!newMessage.title || !newMessage.content || newMessage.channels.length === 0 || loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="send" size={20} color="#FFFFFF" />
                    <Text style={styles.sendButtonText}>Send Message</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Templates Modal */}
      <Modal
        visible={showTemplates}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTemplates(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Message Templates</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowTemplates(false)}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {messageTemplates.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={styles.templateCard}
                onPress={() => applyTemplate(template)}
              >
                <Text style={styles.templateName}>{template.name}</Text>
                <Text style={styles.templateTitle}>{template.title}</Text>
                <Text style={styles.templateContent} numberOfLines={2}>
                  {template.content}
                </Text>
                <View style={styles.templateFooter}>
                  <View style={styles.templateChannels}>
                    {template.channels.map((channelId, index) => (
                      <Ionicons 
                        key={index}
                        name={MESSAGE_CHANNELS[channelId]?.icon || 'radio'} 
                        size={16} 
                        color={MESSAGE_CHANNELS[channelId]?.color || '#6B7280'} 
                      />
                    ))}
                  </View>
                  <Text style={styles.templatePriority}>{template.priority}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
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
  section: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  channelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  channelCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    minWidth: 80,
    flex: 1,
  },
  channelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  channelName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 2,
  },
  channelStatus: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  messagesList: {
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
  messageCard: {
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
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  messagePriority: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  messagePriorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  messageContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  messageChannels: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  channelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4,
  },
  channelBadgeText: {
    fontSize: 10,
    color: '#374151',
    fontWeight: '500',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  messageTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  messageRecipients: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
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
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  templatesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  templatesButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    marginBottom: 24,
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
    backgroundColor: '#FFFFFF',
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  priorityButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  priorityButtonTextSelected: {
    color: '#FFFFFF',
  },
  channelSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  channelSelectorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  channelSelectorText: {
    flex: 1,
  },
  channelSelectorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  channelSelectorDesc: {
    fontSize: 12,
    color: '#6B7280',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  sendButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  templateCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  templateTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  templateContent: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 16,
    marginBottom: 12,
  },
  templateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateChannels: {
    flexDirection: 'row',
    gap: 6,
  },
  templatePriority: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
});

export default MessageDistributionCenter;
