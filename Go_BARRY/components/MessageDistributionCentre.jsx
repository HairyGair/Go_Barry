// Go_BARRY/components/MessageDistributionCentre.jsx
// Professional Message Distribution System with High-End UI

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
  Platform,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupervisorSession } from './hooks/useSupervisorSession';
import { LinearGradient } from './ui/LinearGradient';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isTablet = width >= 768;

// Message channels configuration with refined design
const MESSAGE_CHANNELS = {
  ticketer: {
    name: 'Driver Messaging',
    shortName: 'Drivers',
    icon: 'bus',
    color: '#2563EB',
    gradient: ['#2563EB', '#1D4ED8'],
    description: 'Direct to vehicle systems',
    url: 'https://portal.ticketer.org.uk/DriverMessagingCompose/CreateOutboundMessage',
    enabled: true
  },
  passengerCloud: {
    name: 'Customer Updates',
    shortName: 'Customers',
    icon: 'people',
    color: '#059669',
    gradient: ['#10B981', '#059669'],
    description: 'Website & app notifications',
    url: 'https://gonortheast.passenger-app.com/login',
    enabled: true
  },
  email: {
    name: 'Email Centre',
    shortName: 'Email',
    icon: 'mail',
    color: '#7C3AED',
    gradient: ['#8B5CF6', '#7C3AED'],
    description: 'Directors & management',
    url: 'https://outlook.office365.com/mail/',
    enabled: true
  }
};

const MessageDistributionCentre = ({ baseUrl }) => {
  const { 
    isLoggedIn, 
    supervisorName, 
    supervisorBadge,
    hasPermission, 
    logActivity 
  } = useSupervisorSession();

  // State management
  const [activeTab, setActiveTab] = useState('ticketer');
  const [showCompose, setShowCompose] = useState(false);
  const [recentMessages, setRecentMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Compose message state
  const [message, setMessage] = useState({
    subject: '',
    content: '',
    priority: 'standard',
    channels: [activeTab],
    affectedRoutes: []
  });

  // Quick action templates
  const quickActions = [
    {
      id: 'roadwork_alert',
      icon: 'construct',
      label: 'Roadwork Alert',
      color: '#F59E0B',
      template: 'roadwork'
    },
    {
      id: 'incident_update',
      icon: 'warning',
      label: 'Incident Update',
      color: '#EF4444',
      template: 'incident'
    },
    {
      id: 'service_restore',
      icon: 'checkmark-circle',
      label: 'Service Restored',
      color: '#10B981',
      template: 'restored'
    },
    {
      id: 'custom_message',
      icon: 'create',
      label: 'Custom Message',
      color: '#6366F1',
      template: null
    }
  ];

  // Load initial data
  useEffect(() => {
    if (isLoggedIn) {
      loadRecentMessages();
      loadTemplates();
    }
  }, [isLoggedIn]);

  const loadRecentMessages = async () => {
    // Mock data - replace with actual API call
    setRecentMessages([
      {
        id: 1,
        subject: 'High Level Bridge Closure - All Services',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        channels: ['ticketer', 'passengerCloud'],
        priority: 'urgent',
        sender: 'AG003',
        recipients: 127
      },
      {
        id: 2,
        subject: 'Route 21 Diversion - A1 Roadworks',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        channels: ['ticketer'],
        priority: 'standard',
        sender: 'DH005',
        recipients: 45
      }
    ]);
  };

  const loadTemplates = async () => {
    // Load message templates
    setTemplates([
      {
        id: 'high_level_bridge',
        name: 'High Level Bridge Closure',
        subject: 'URGENT: High Level Bridge Closure - Service Updates',
        content: 'Due to the closure of the High Level Bridge, the following services are affected:\n\n{routes}\n\nPlease follow signed diversions via {diversion_route}.\n\nWe apologise for any inconvenience.',
        priority: 'urgent',
        category: 'closure'
      },
      {
        id: 'roadwork_diversion',
        name: 'Roadwork Diversion',
        subject: 'Service Diversion - {location}',
        content: 'Services {routes} are currently diverted due to roadworks at {location}.\n\nExpected duration: {duration}\n\nPlease allow extra time for your journey.',
        priority: 'high',
        category: 'roadwork'
      }
    ]);
  };

  const handleQuickAction = (action) => {
    if (action.template) {
      const template = templates.find(t => t.category === action.template);
      if (template) {
        setMessage({
          subject: template.subject,
          content: template.content,
          priority: template.priority,
          channels: [activeTab],
          affectedRoutes: []
        });
        setSelectedTemplate(template);
      }
    }
    setShowCompose(true);
  };

  const sendMessage = async () => {
    if (!message.subject || !message.content) {
      Alert.alert('Missing Information', 'Please enter both subject and message content.');
      return;
    }

    setLoading(true);
    try {
      // Simulate sending - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      logActivity(
        'MESSAGE_SENT',
        `Sent "${message.subject}" to ${message.channels.join(', ')}`,
        { channels: message.channels, priority: message.priority }
      );

      Alert.alert('Success', 'Message sent successfully to all selected channels.');
      setShowCompose(false);
      setMessage({
        subject: '',
        content: '',
        priority: 'standard',
        channels: [activeTab],
        affectedRoutes: []
      });
      loadRecentMessages();
    } catch (error) {
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <View style={styles.authRequiredContainer}>
          <View style={styles.authIconContainer}>
            <Ionicons name="lock-closed" size={48} color="#E5E7EB" />
          </View>
          <Text style={styles.authRequiredTitle}>Authentication Required</Text>
          <Text style={styles.authRequiredText}>
            Please log in as a supervisor to access the Message Distribution Centre
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Professional Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Message Distribution Centre</Text>
            <Text style={styles.headerSubtitle}>Unified Communication Platform</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.userBadge}>
              <Ionicons name="person-circle" size={20} color="#6366F1" />
              <Text style={styles.userBadgeText}>{supervisorBadge}</Text>
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {Object.entries(MESSAGE_CHANNELS).map(([key, channel]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.tab,
                activeTab === key && styles.activeTab
              ]}
              onPress={() => setActiveTab(key)}
            >
              <Ionicons 
                name={channel.icon} 
                size={20} 
                color={activeTab === key ? '#FFFFFF' : '#64748B'} 
              />
              <Text style={[
                styles.tabText,
                activeTab === key && styles.activeTabText
              ]}>
                {isTablet ? channel.name : channel.shortName}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionCard}
                onPress={() => handleQuickAction(action)}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}20` }]}>
                  <Ionicons name={action.icon} size={24} color={action.color} />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Channel Interface */}
        <View style={styles.channelInterface}>
          <View style={styles.channelHeader}>
            <LinearGradient
              colors={MESSAGE_CHANNELS[activeTab].gradient}
              style={styles.channelGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name={MESSAGE_CHANNELS[activeTab].icon} size={24} color="#FFFFFF" />
              <Text style={styles.channelTitle}>{MESSAGE_CHANNELS[activeTab].name}</Text>
            </LinearGradient>
            <TouchableOpacity
              style={styles.composeButton}
              onPress={() => setShowCompose(true)}
            >
              <Ionicons name="create" size={20} color="#FFFFFF" />
              <Text style={styles.composeButtonText}>Compose</Text>
            </TouchableOpacity>
          </View>

          {/* Channel Content - iframe placeholder */}
          <View style={styles.iframeContainer}>
            {isWeb ? (
              <View style={styles.iframePlaceholder}>
                <Ionicons name="globe-outline" size={48} color="#E5E7EB" />
                <Text style={styles.iframePlaceholderText}>
                  {MESSAGE_CHANNELS[activeTab].name} Interface
                </Text>
                <Text style={styles.iframePlaceholderSubtext}>
                  {MESSAGE_CHANNELS[activeTab].url}
                </Text>
              </View>
            ) : (
              <View style={styles.mobileMessage}>
                <Text style={styles.mobileMessageText}>
                  This feature is available on web browsers only
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Recent Messages */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Messages</Text>
          <View style={styles.recentMessages}>
            {recentMessages.map((msg) => (
              <View key={msg.id} style={styles.messageCard}>
                <View style={styles.messageHeader}>
                  <Text style={styles.messageSubject} numberOfLines={1}>
                    {msg.subject}
                  </Text>
                  <View style={[
                    styles.priorityBadge,
                    msg.priority === 'urgent' && styles.priorityUrgent,
                    msg.priority === 'high' && styles.priorityHigh
                  ]}>
                    <Text style={styles.priorityText}>
                      {msg.priority.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.messageInfo}>
                  <Text style={styles.messageTime}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Text style={styles.messageSender}>{msg.sender}</Text>
                  <View style={styles.messageChannels}>
                    {msg.channels.map((channel, idx) => (
                      <Ionicons 
                        key={idx}
                        name={MESSAGE_CHANNELS[channel]?.icon || 'radio'} 
                        size={14} 
                        color={MESSAGE_CHANNELS[channel]?.color || '#64748B'} 
                        style={styles.channelIcon}
                      />
                    ))}
                  </View>
                  <Text style={styles.messageRecipients}>
                    {msg.recipients} recipients
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Compose Modal */}
      <Modal
        visible={showCompose}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCompose(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Compose Message</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCompose(false)}
            >
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Priority Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Priority</Text>
              <View style={styles.priorityOptions}>
                {['standard', 'high', 'urgent'].map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityOption,
                      message.priority === priority && styles.priorityOptionActive
                    ]}
                    onPress={() => setMessage({ ...message, priority })}
                  >
                    <Text style={[
                      styles.priorityOptionText,
                      message.priority === priority && styles.priorityOptionTextActive
                    ]}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Channel Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Distribution Channels</Text>
              <View style={styles.channelSelectors}>
                {Object.entries(MESSAGE_CHANNELS).map(([key, channel]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.channelSelector,
                      message.channels.includes(key) && styles.channelSelectorActive
                    ]}
                    onPress={() => {
                      const channels = message.channels.includes(key)
                        ? message.channels.filter(c => c !== key)
                        : [...message.channels, key];
                      setMessage({ ...message, channels });
                    }}
                  >
                    <Ionicons 
                      name={channel.icon} 
                      size={20} 
                      color={message.channels.includes(key) ? channel.color : '#94A3B8'} 
                    />
                    <Text style={[
                      styles.channelSelectorText,
                      message.channels.includes(key) && { color: channel.color }
                    ]}>
                      {channel.shortName}
                    </Text>
                    {message.channels.includes(key) && (
                      <Ionicons name="checkmark-circle" size={16} color={channel.color} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Subject */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Subject</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter message subject..."
                placeholderTextColor="#94A3B8"
                value={message.subject}
                onChangeText={(text) => setMessage({ ...message, subject: text })}
              />
            </View>

            {/* Message Content */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter your message..."
                placeholderTextColor="#94A3B8"
                value={message.content}
                onChangeText={(text) => setMessage({ ...message, content: text })}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            {/* Send Button */}
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!message.subject || !message.content) && styles.sendButtonDisabled
              ]}
              onPress={sendMessage}
              disabled={!message.subject || !message.content || loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#FFFFFF" />
                  <Text style={styles.sendButtonText}>Send Message</Text>
                </>
              )}
            </TouchableOpacity>
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
  
  // Auth Required
  authRequiredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  authIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  authRequiredTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  authRequiredText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Header
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: isWeb ? 24 : 48,
    paddingBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  userBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    backgroundColor: '#FAFBFC',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 8,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    gap: 8,
  },
  activeTab: {
    borderBottomColor: '#6366F1',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#6366F1',
  },

  // Content
  content: {
    flex: 1,
  },

  // Quick Actions
  quickActionsSection: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: isTablet ? 140 : 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },

  // Channel Interface
  channelInterface: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  channelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  channelGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    flex: 1,
  },
  channelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  composeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 16,
    borderRadius: 8,
    gap: 8,
  },
  composeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // iframe Container
  iframeContainer: {
    height: 500,
    backgroundColor: '#FAFBFC',
  },
  iframePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iframePlaceholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 16,
  },
  iframePlaceholderSubtext: {
    fontSize: 14,
    color: '#CBD5E1',
    marginTop: 4,
  },
  mobileMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  mobileMessageText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },

  // Recent Messages
  recentSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  recentMessages: {
    gap: 12,
  },
  messageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageSubject: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
    marginRight: 12,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  priorityUrgent: {
    backgroundColor: '#FEE2E2',
  },
  priorityHigh: {
    backgroundColor: '#FEF3C7',
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  messageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  messageTime: {
    fontSize: 13,
    color: '#64748B',
  },
  messageSender: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  messageChannels: {
    flexDirection: 'row',
    gap: 6,
  },
  channelIcon: {
    marginRight: 2,
  },
  messageRecipients: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 'auto',
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: isWeb ? 24 : 48,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },

  // Form
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0F172A',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },

  // Priority Options
  priorityOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  priorityOptionActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  priorityOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  priorityOptionTextActive: {
    color: '#FFFFFF',
  },

  // Channel Selectors
  channelSelectors: {
    gap: 8,
  },
  channelSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  channelSelectorActive: {
    borderColor: '#6366F1',
    backgroundColor: '#F0F4FF',
  },
  channelSelectorText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
    flex: 1,
  },

  // Send Button
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default MessageDistributionCentre;
