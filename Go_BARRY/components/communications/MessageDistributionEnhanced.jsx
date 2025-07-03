/*
 * Go Barry - Enhanced Message Distribution Center
 * Phase 4.1 - Focus on Ticketer & Email channels
 * Unified message tracking and template system
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
  FlatList,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignSystem } from '../../design-system/design-system-spec';
import { useSupervisor } from '../hooks/useSupervisorSession';
import { useConvexSync } from '../../hooks/useConvexSync';
import SmartReplyEngine from '../messaging/smartReply/SmartReplyEngine';
import { useSmartReply } from '../messaging/hooks/useSmartReply';

const { width: screenWidth } = Dimensions.get('window');

const MessageDistributionEnhanced = ({ baseUrl, onClose, visible = true, alert = null, context = {} }) => {
  const { supervisorName, supervisorId } = useSupervisor();
  const { logCommunication } = useConvexSync();
  const { recordSuggestionUsage, contextualHints } = useSmartReply(alert, context);
  
  // State management
  const [selectedChannel, setSelectedChannel] = useState('ticketer');
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [messageStats, setMessageStats] = useState(null);
  const [showSmartReply, setShowSmartReply] = useState(false);
  const [supervisorHistory, setSupervisorHistory] = useState([]);
  
  // Message composition
  const [messageForm, setMessageForm] = useState({
    to: [],
    subject: '',
    message: '',
    template: null,
    priority: 'normal',
    category: 'general',
    routes: [],
    depots: []
  });
  
  // Available channels (focused on Ticketer & Email)
  const channels = [
    { 
      id: 'ticketer', 
      name: 'Ticketer (Drivers)', 
      icon: 'bus', 
      color: '#2563eb',
      description: 'Send to driver Ticketer devices',
      features: ['templates', 'routes', 'priority']
    },
    { 
      id: 'email', 
      name: 'Email', 
      icon: 'mail', 
      color: '#10B981',
      description: 'Send via Outlook',
      features: ['templates', 'attachments', 'scheduling']
    },
    { 
      id: 'both', 
      name: 'Both Channels', 
      icon: 'git-merge', 
      color: '#059669',
      description: 'Send to Ticketer & Email',
      features: ['templates', 'tracking']
    }
  ];
  
  // Message categories
  const messageCategories = [
    { id: 'general', name: 'General Update', icon: 'information-circle' },
    { id: 'disruption', name: 'Service Disruption', icon: 'warning' },
    { id: 'roadworks', name: 'Roadworks Alert', icon: 'construct' },
    { id: 'weather', name: 'Weather Advisory', icon: 'cloud' },
    { id: 'emergency', name: 'Emergency', icon: 'alert-circle' },
    { id: 'operational', name: 'Operational', icon: 'cog' }
  ];
  
  // Priority levels
  const priorityLevels = [
    { id: 'low', name: 'Low', color: '#d1d5db' },
    { id: 'normal', name: 'Normal', color: '#2563eb' },
    { id: 'high', name: 'High', color: '#F59E0B' },
    { id: 'urgent', name: 'Urgent', color: '#EF4444' }
  ];
  
  // Load data on mount
  useEffect(() => {
    fetchTemplates();
    fetchRecentMessages();
    fetchMessageStats();
    fetchSupervisorHistory();
    // Show smart reply if alert context is provided
    if (alert) {
      setShowSmartReply(true);
    }
  }, [alert]);
  
  // Fetch message templates
  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/communications/templates`, {
        headers: {
          'supervisor-id': supervisorId,
          'supervisor-name': supervisorName
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.data?.templates || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };
  
  // Fetch recent messages
  const fetchRecentMessages = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/communications/messages/recent`, {
        headers: {
          'supervisor-id': supervisorId,
          'supervisor-name': supervisorName
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecentMessages(data.data?.messages || []);
      }
    } catch (error) {
      console.error('Error fetching recent messages:', error);
    }
  };
  
  // Fetch message statistics
  const fetchMessageStats = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/communications/messages/stats`, {
        headers: {
          'supervisor-id': supervisorId,
          'supervisor-name': supervisorName
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessageStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching message stats:', error);
    }
  };
  
  // Fetch supervisor message history for smart suggestions
  const fetchSupervisorHistory = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/communications/supervisor/history`, {
        headers: {
          'supervisor-id': supervisorId
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSupervisorHistory(data.data?.messages || []);
      }
    } catch (error) {
      console.error('Error fetching supervisor history:', error);
    }
  };
  
  // Handle template selection
  const handleTemplateSelect = (template) => {
    setMessageForm(prev => ({
      ...prev,
      message: template.content,
      subject: template.subject || '',
      category: template.category || 'general',
      template: template.id
    }));
  };
  
  // Handle smart reply selection
  const handleSmartReplySelect = async (suggestion) => {
    setMessageForm(prev => ({
      ...prev,
      message: suggestion.template,
      subject: suggestion.title || '',
      category: suggestion.category || 'general',
      priority: suggestion.priority || 'normal',
      template: suggestion.id
    }));
    
    // Update channels based on suggestion
    if (suggestion.channels) {
      if (suggestion.channels.includes('all') || suggestion.channels.length > 1) {
        setSelectedChannel('both');
      } else if (suggestion.channels.includes('drivers')) {
        setSelectedChannel('ticketer');
      } else if (suggestion.channels.includes('email')) {
        setSelectedChannel('email');
      }
    }
    
    setShowSmartReply(false);
  };
  
  // Handle smart reply customization
  const handleSmartReplyCustomize = (suggestion) => {
    if (suggestion.template) {
      setMessageForm(prev => ({
        ...prev,
        message: suggestion.template,
        subject: suggestion.title || '',
        category: suggestion.category || 'general',
        priority: suggestion.priority || 'normal'
      }));
    }
    setShowSmartReply(false);
  };
  
  // Handle message send
  const handleSendMessage = async () => {
    if (!messageForm.message.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }
    
    setLoading(true);
    try {
      const endpoint = selectedChannel === 'ticketer' 
        ? '/api/communications/ticketer/send'
        : selectedChannel === 'email'
        ? '/api/communications/email/send'
        : '/api/communications/multi/send';
      
      const payload = {
        channel: selectedChannel,
        message: messageForm.message,
        subject: messageForm.subject,
        priority: messageForm.priority,
        category: messageForm.category,
        templateId: messageForm.template,
        routes: messageForm.routes,
        depots: messageForm.depots,
        to: selectedChannel === 'email' ? messageForm.to : undefined
      };
      
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'supervisor-id': supervisorId,
          'supervisor-name': supervisorName
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Log to Convex
        await logCommunication({
          type: 'message_distribution',
          action: 'message_sent',
          channel: selectedChannel,
          supervisorId,
          timestamp: new Date().toISOString(),
          metadata: {
            messageId: result.data?.messageId,
            priority: messageForm.priority,
            category: messageForm.category,
            recipientCount: result.data?.recipientCount
          }
        });
        
        // Record smart reply usage if applicable
        if (messageForm.template && messageForm.template.startsWith('base_') || messageForm.template.startsWith('learned_')) {
          await recordSuggestionUsage(
            { id: messageForm.template, template: messageForm.message },
            messageForm.message
          );
        }
        
        Alert.alert(
          'Success',
          `Message sent successfully to ${result.data?.recipientCount || 0} recipients`,
          [{ text: 'OK', onPress: () => {
            setMessageForm({
              to: [],
              subject: '',
              message: '',
              template: null,
              priority: 'normal',
              category: 'general',
              routes: [],
              depots: []
            });
            fetchRecentMessages();
          }}]
        );
      } else {
        const error = await response.json();
        Alert.alert('Error', error.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Render header
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.titleRow}>
          <Ionicons name="chatbubbles" size={24} color={DesignSystem.colors.primary} />
          <Text style={styles.headerTitle}>Message Distribution Center</Text>
        </View>
        <Pressable
          style={styles.closeButton}
          onPress={onClose}
          accessibilityLabel="Close Message Distribution"
        >
          <Ionicons name="close" size={24} color={DesignSystem.colors.neutral.text.primary} />
        </Pressable>
      </View>
      
      {/* Channel Selection */}
      <View style={styles.channelContainer}>
        {channels.map((channel) => (
          <Pressable
            key={channel.id}
            style={[
              styles.channelCard,
              selectedChannel === channel.id && styles.channelCardActive,
              { borderColor: selectedChannel === channel.id ? channel.color : DesignSystem.colors.neutral.border }
            ]}
            onPress={() => setSelectedChannel(channel.id)}
          >
            <Ionicons 
              name={channel.icon} 
              size={20} 
              color={selectedChannel === channel.id ? channel.color : DesignSystem.colors.neutral.text.secondary} 
            />
            <View style={styles.channelInfo}>
              <Text style={[
                styles.channelName,
                selectedChannel === channel.id && { color: channel.color }
              ]}>
                {channel.name}
              </Text>
              <Text style={styles.channelDescription}>{channel.description}</Text>
            </View>
            {selectedChannel === channel.id && (
              <Ionicons name="checkmark-circle" size={20} color={channel.color} />
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
  
  // Render message composition
  const renderMessageComposition = () => (
    <View style={styles.compositionSection}>
      {/* Smart Reply Button for alerts */}
      {alert && (
        <Pressable
          style={styles.smartReplyButton}
          onPress={() => setShowSmartReply(true)}
        >
          <Ionicons name="bulb" size={20} color={DesignSystem.colors.primary} />
          <Text style={styles.smartReplyButtonText}>Get Smart Reply Suggestions</Text>
          {contextualHints.length > 0 && (
            <View style={styles.hintBadge}>
              <Text style={styles.hintBadgeText}>{contextualHints.length}</Text>
            </View>
          )}
        </Pressable>
      )}
      
      {/* Contextual Hints */}
      {contextualHints.length > 0 && !showSmartReply && (
        <View style={styles.hintsContainer}>
          {contextualHints.map((hint, index) => (
            <View key={index} style={styles.hintItem}>
              <Text style={styles.hintIcon}>{hint.icon}</Text>
              <Text style={styles.hintText}>{hint.message}</Text>
            </View>
          ))}
        </View>
      )}
      {/* Category Selection */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Message Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.categoryContainer}>
            {messageCategories.map((category) => (
              <Pressable
                key={category.id}
                style={[
                  styles.categoryChip,
                  messageForm.category === category.id && styles.categoryChipActive
                ]}
                onPress={() => setMessageForm(prev => ({ ...prev, category: category.id }))}
              >
                <Ionicons 
                  name={category.icon} 
                  size={16} 
                  color={messageForm.category === category.id ? DesignSystem.colors.primary : DesignSystem.colors.neutral.text.secondary} 
                />
                <Text style={[
                  styles.categoryText,
                  messageForm.category === category.id && styles.categoryTextActive
                ]}>
                  {category.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
      
      {/* Priority Selection */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Priority</Text>
        <View style={styles.priorityContainer}>
          {priorityLevels.map((priority) => (
            <Pressable
              key={priority.id}
              style={[
                styles.priorityButton,
                messageForm.priority === priority.id && styles.priorityButtonActive,
                messageForm.priority === priority.id && { borderColor: priority.color }
              ]}
              onPress={() => setMessageForm(prev => ({ ...prev, priority: priority.id }))}
            >
              <Text style={[
                styles.priorityText,
                messageForm.priority === priority.id && { color: priority.color }
              ]}>
                {priority.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      
      {/* Recipients (for email) */}
      {(selectedChannel === 'email' || selectedChannel === 'both') && (
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Recipients</Text>
          <TextInput
            style={styles.recipientInput}
            placeholder="Enter email addresses (comma-separated)"
            value={messageForm.to.join(', ')}
            onChangeText={(text) => {
              const emails = text.split(',').map(e => e.trim()).filter(e => e);
              setMessageForm(prev => ({ ...prev, to: emails }));
            }}
          />
        </View>
      )}
      
      {/* Routes (for ticketer) */}
      {(selectedChannel === 'ticketer' || selectedChannel === 'both') && (
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Routes (optional)</Text>
          <TextInput
            style={styles.routeInput}
            placeholder="Enter route numbers (e.g., 21, X21, 307)"
            value={messageForm.routes.join(', ')}
            onChangeText={(text) => {
              const routes = text.split(',').map(r => r.trim()).filter(r => r);
              setMessageForm(prev => ({ ...prev, routes }));
            }}
          />
        </View>
      )}
      
      {/* Subject (for email) */}
      {(selectedChannel === 'email' || selectedChannel === 'both') && (
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Subject</Text>
          <TextInput
            style={styles.subjectInput}
            placeholder="Enter email subject"
            value={messageForm.subject}
            onChangeText={(text) => setMessageForm(prev => ({ ...prev, subject: text }))}
          />
        </View>
      )}
      
      {/* Message Content */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Message</Text>
        <TextInput
          style={styles.messageInput}
          placeholder="Type your message here..."
          value={messageForm.message}
          onChangeText={(text) => setMessageForm(prev => ({ ...prev, message: text }))}
          multiline
          numberOfLines={6}
          maxLength={1000}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{messageForm.message.length}/1000</Text>
      </View>
      
      {/* Send Button */}
      <Pressable
        style={[
          styles.sendButton,
          !messageForm.message.trim() && styles.sendButtonDisabled,
          loading && styles.sendButtonLoading
        ]}
        onPress={handleSendMessage}
        disabled={!messageForm.message.trim() || loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <Ionicons name="send" size={20} color="white" />
            <Text style={styles.sendButtonText}>Send Message</Text>
          </>
        )}
      </Pressable>
    </View>
  );
  
  // Render templates
  const renderTemplates = () => (
    <View style={styles.templatesSection}>
      <Text style={styles.sectionTitle}>Quick Templates</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.templateList}>
          {templates.length > 0 ? (
            templates.map((template) => (
              <Pressable
                key={template.id}
                style={styles.templateCard}
                onPress={() => handleTemplateSelect(template)}
              >
                <Text style={styles.templateName}>{template.name}</Text>
                <Text style={styles.templatePreview} numberOfLines={2}>
                  {template.content}
                </Text>
                <View style={styles.templateMeta}>
                  <Text style={styles.templateCategory}>{template.category}</Text>
                  {template.lastUsed && (
                    <Text style={styles.templateLastUsed}>
                      Used {new Date(template.lastUsed).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              </Pressable>
            ))
          ) : (
            <View style={styles.noTemplates}>
              <Text style={styles.noTemplatesText}>No templates available</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
  
  // Render recent messages
  const renderRecentMessages = () => (
    <View style={styles.recentSection}>
      <View style={styles.recentHeader}>
        <Text style={styles.sectionTitle}>Recent Messages</Text>
        {messageStats && (
          <Text style={styles.messageStats}>
            {messageStats.todayCount} today • {messageStats.weekCount} this week
          </Text>
        )}
      </View>
      
      {recentMessages.length > 0 ? (
        <FlatList
          data={recentMessages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.recentMessage}>
              <View style={styles.recentMessageHeader}>
                <Ionicons 
                  name={item.channel === 'ticketer' ? 'bus' : item.channel === 'email' ? 'mail' : 'git-merge'} 
                  size={16} 
                  color={DesignSystem.colors.primary} 
                />
                <Text style={styles.recentMessageChannel}>{item.channelName}</Text>
                <Text style={[
                  styles.recentMessagePriority,
                  { color: priorityLevels.find(p => p.id === item.priority)?.color }
                ]}>
                  {item.priority}
                </Text>
                <Text style={styles.recentMessageTime}>
                  {new Date(item.timestamp).toLocaleTimeString()}
                </Text>
              </View>
              
              {item.subject && (
                <Text style={styles.recentMessageSubject}>{item.subject}</Text>
              )}
              
              <Text style={styles.recentMessageText} numberOfLines={2}>
                {item.message}
              </Text>
              
              <View style={styles.recentMessageFooter}>
                <Text style={styles.recentMessageRecipients}>
                  {item.recipientCount} recipients
                </Text>
                {item.routes && item.routes.length > 0 && (
                  <Text style={styles.recentMessageRoutes}>
                    Routes: {item.routes.join(', ')}
                  </Text>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="mail-open-outline" size={48} color={DesignSystem.colors.neutral.text.secondary} />
              <Text style={styles.emptyText}>No recent messages</Text>
            </View>
          }
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="mail-open-outline" size={48} color={DesignSystem.colors.neutral.text.secondary} />
          <Text style={styles.emptyText}>No recent messages</Text>
        </View>
      )}
    </View>
  );
  
  // Main render
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {renderHeader()}
        
        <ScrollView style={styles.content}>
          {renderMessageComposition()}
          {renderTemplates()}
          {renderRecentMessages()}
        </ScrollView>
        
        {/* Smart Reply Modal */}
        {showSmartReply && (
          <Modal
            visible={showSmartReply}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowSmartReply(false)}
          >
            <View style={styles.smartReplyModal}>
              <View style={styles.smartReplyContainer}>
                <SmartReplyEngine
                  alert={alert}
                  context={context}
                  onSelectReply={handleSmartReplySelect}
                  onCustomize={handleSmartReplyCustomize}
                  supervisorHistory={supervisorHistory}
                />
                <Pressable
                  style={styles.smartReplyClose}
                  onPress={() => setShowSmartReply(false)}
                >
                  <Ionicons name="close-circle" size={32} color={DesignSystem.colors.neutral.text.secondary} />
                </Pressable>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.neutral.background
  },
  header: {
    backgroundColor: DesignSystem.colors.neutral.surface,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.neutral.border
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.md
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.sm
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: DesignSystem.colors.neutral.text.primary
  },
  closeButton: {
    padding: DesignSystem.spacing.sm
  },
  channelContainer: {
    gap: DesignSystem.spacing.sm
  },
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignSystem.spacing.md,
    backgroundColor: DesignSystem.colors.neutral.background,
    borderRadius: DesignSystem.layout.borderRadius.md,
    borderWidth: 2,
    borderColor: DesignSystem.colors.neutral.border,
    marginBottom: DesignSystem.spacing.sm,
    gap: DesignSystem.spacing.sm
  },
  channelCardActive: {
    backgroundColor: DesignSystem.colors.neutral.card
  },
  channelInfo: {
    flex: 1
  },
  channelName: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.neutral.text.primary
  },
  channelDescription: {
    fontSize: 12,
    color: DesignSystem.colors.neutral.text.secondary,
    marginTop: 2
  },
  content: {
    flex: 1
  },
  compositionSection: {
    padding: DesignSystem.spacing.lg
  },
  fieldGroup: {
    marginBottom: DesignSystem.spacing.lg
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: DesignSystem.colors.neutral.text.primary,
    marginBottom: DesignSystem.spacing.sm
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: DesignSystem.spacing.sm
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    backgroundColor: DesignSystem.colors.neutral.surface,
    borderRadius: DesignSystem.layout.borderRadius.round,
    borderWidth: 1,
    borderColor: DesignSystem.colors.neutral.border,
    gap: DesignSystem.spacing.xs,
    marginRight: DesignSystem.spacing.sm
  },
  categoryChipActive: {
    backgroundColor: DesignSystem.colors.primary + '20',
    borderColor: DesignSystem.colors.primary
  },
  categoryText: {
    fontSize: 14,
    color: DesignSystem.colors.neutral.text.secondary
  },
  categoryTextActive: {
    color: DesignSystem.colors.primary,
    fontWeight: '500'
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: DesignSystem.spacing.sm
  },
  priorityButton: {
    flex: 1,
    paddingVertical: DesignSystem.spacing.sm,
    backgroundColor: DesignSystem.colors.neutral.surface,
    borderRadius: DesignSystem.layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: DesignSystem.colors.neutral.border,
    alignItems: 'center'
  },
  priorityButtonActive: {
    backgroundColor: DesignSystem.colors.neutral.card,
    borderWidth: 2
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '500',
    color: DesignSystem.colors.neutral.text.secondary
  },
  recipientInput: {
    backgroundColor: DesignSystem.colors.neutral.surface,
    borderRadius: DesignSystem.layout.borderRadius.md,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    fontSize: 14,
    borderWidth: 1,
    borderColor: DesignSystem.colors.neutral.border,
    minHeight: 44
  },
  routeInput: {
    backgroundColor: DesignSystem.colors.neutral.surface,
    borderRadius: DesignSystem.layout.borderRadius.md,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    fontSize: 14,
    borderWidth: 1,
    borderColor: DesignSystem.colors.neutral.border,
    minHeight: 44
  },
  subjectInput: {
    backgroundColor: DesignSystem.colors.neutral.surface,
    borderRadius: DesignSystem.layout.borderRadius.md,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    fontSize: 14,
    borderWidth: 1,
    borderColor: DesignSystem.colors.neutral.border,
    minHeight: 44
  },
  messageInput: {
    backgroundColor: DesignSystem.colors.neutral.surface,
    borderRadius: DesignSystem.layout.borderRadius.md,
    padding: DesignSystem.spacing.md,
    fontSize: 16,
    borderWidth: 1,
    borderColor: DesignSystem.colors.neutral.border,
    minHeight: 120
  },
  charCount: {
    fontSize: 12,
    color: DesignSystem.colors.neutral.text.secondary,
    textAlign: 'right',
    marginTop: DesignSystem.spacing.xs
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignSystem.colors.primary,
    paddingVertical: DesignSystem.spacing.md,
    borderRadius: DesignSystem.layout.borderRadius.md,
    gap: DesignSystem.spacing.sm,
    marginTop: DesignSystem.spacing.md
  },
  sendButtonDisabled: {
    backgroundColor: DesignSystem.colors.neutral.text.tertiary
  },
  sendButtonLoading: {
    opacity: 0.7
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white'
  },
  templatesSection: {
    paddingTop: DesignSystem.spacing.lg,
    paddingBottom: DesignSystem.spacing.md
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DesignSystem.colors.neutral.text.primary,
    marginBottom: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.lg
  },
  templateList: {
    flexDirection: 'row',
    paddingHorizontal: DesignSystem.spacing.lg
  },
  templateCard: {
    width: 240,
    backgroundColor: DesignSystem.colors.neutral.surface,
    borderRadius: DesignSystem.layout.borderRadius.md,
    padding: DesignSystem.spacing.md,
    marginRight: DesignSystem.spacing.md,
    borderWidth: 1,
    borderColor: DesignSystem.colors.neutral.border
  },
  templateName: {
    fontSize: 14,
    fontWeight: '600',
    color: DesignSystem.colors.neutral.text.primary,
    marginBottom: DesignSystem.spacing.xs
  },
  templatePreview: {
    fontSize: 13,
    color: DesignSystem.colors.neutral.text.secondary,
    lineHeight: 18,
    marginBottom: DesignSystem.spacing.sm
  },
  templateMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  templateCategory: {
    fontSize: 11,
    color: DesignSystem.colors.primary,
    fontWeight: '500'
  },
  templateLastUsed: {
    fontSize: 11,
    color: DesignSystem.colors.neutral.text.tertiary
  },
  noTemplates: {
    padding: DesignSystem.spacing.xl,
    alignItems: 'center'
  },
  noTemplatesText: {
    fontSize: 14,
    color: DesignSystem.colors.neutral.text.secondary
  },
  recentSection: {
    flex: 1,
    padding: DesignSystem.spacing.lg
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.md
  },
  messageStats: {
    fontSize: 12,
    color: DesignSystem.colors.neutral.text.secondary
  },
  recentMessage: {
    backgroundColor: DesignSystem.colors.neutral.surface,
    borderRadius: DesignSystem.layout.borderRadius.md,
    padding: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
    borderWidth: 1,
    borderColor: DesignSystem.colors.neutral.border
  },
  recentMessageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.sm,
    gap: DesignSystem.spacing.sm
  },
  recentMessageChannel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: DesignSystem.colors.primary
  },
  recentMessagePriority: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  recentMessageTime: {
    fontSize: 12,
    color: DesignSystem.colors.neutral.text.secondary
  },
  recentMessageSubject: {
    fontSize: 14,
    fontWeight: '600',
    color: DesignSystem.colors.neutral.text.primary,
    marginBottom: DesignSystem.spacing.xs
  },
  recentMessageText: {
    fontSize: 14,
    color: DesignSystem.colors.neutral.text.secondary,
    lineHeight: 20
  },
  recentMessageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: DesignSystem.spacing.sm
  },
  recentMessageRecipients: {
    fontSize: 12,
    color: DesignSystem.colors.neutral.text.tertiary
  },
  recentMessageRoutes: {
    fontSize: 12,
    color: DesignSystem.colors.neutral.text.tertiary
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignSystem.spacing.xl * 2
  },
  emptyText: {
    fontSize: 16,
    color: DesignSystem.colors.neutral.text.secondary,
    marginTop: DesignSystem.spacing.md
  },
  smartReplyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignSystem.colors.primary + '10',
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.layout.borderRadius.md,
    borderWidth: 1,
    borderColor: DesignSystem.colors.primary,
    marginBottom: DesignSystem.spacing.lg,
    gap: DesignSystem.spacing.sm
  },
  smartReplyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.primary
  },
  hintBadge: {
    backgroundColor: DesignSystem.colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  hintBadgeText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600'
  },
  hintsContainer: {
    backgroundColor: DesignSystem.colors.primary + '05',
    borderRadius: DesignSystem.layout.borderRadius.md,
    padding: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.xs
  },
  hintItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.sm
  },
  hintIcon: {
    fontSize: 16
  },
  hintText: {
    fontSize: 13,
    color: DesignSystem.colors.neutral.text.secondary,
    flex: 1
  },
  smartReplyModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  smartReplyContainer: {
    backgroundColor: DesignSystem.colors.neutral.background,
    borderTopLeftRadius: DesignSystem.layout.borderRadius.xl,
    borderTopRightRadius: DesignSystem.layout.borderRadius.xl,
    maxHeight: '80%',
    position: 'relative'
  },
  smartReplyClose: {
    position: 'absolute',
    top: DesignSystem.spacing.md,
    right: DesignSystem.spacing.md,
    zIndex: 1
  }
});

export default MessageDistributionEnhanced;