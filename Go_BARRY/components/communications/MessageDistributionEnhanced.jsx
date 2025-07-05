/*
 * Go Barry - Enhanced Message Distribution Centre
 * Complete Phase 1 & 2 Implementation
 * Unified communication platform with Ticketer, Passenger Cloud, and Email integration
 */

import React, { useState, useEffect } from 'react';
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
  Dimensions,
  Clipboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupervisor } from '../hooks/useSupervisorSession';
import { useConvexSync } from '../../hooks/useConvexSync';
import { useMessageTemplates } from '../hooks/useMessageTemplates';
import TemplateManager from '../messaging/TemplateManager';
import QuickActions from '../messaging/QuickActions';
import MessageHistory from '../messaging/MessageHistory';
import MessageAuditLog from '../messaging/MessageAuditLog';
// Phase 7 Components
import MessageAnalytics from '../messaging/MessageAnalytics';
import BulkMessageManager from '../messaging/BulkMessageManager';
import MessageScheduler from '../messaging/MessageScheduler';
import IntegrationStatus from '../messaging/IntegrationStatus';
import AdvancedSearch from '../messaging/AdvancedSearch';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isTablet = screenWidth >= 768;

const MessageDistributionEnhanced = ({ baseUrl, onClose, visible = true }) => {
  const { supervisorName, supervisorId, isLoggedIn } = useSupervisor();
  const { logCommunication } = useConvexSync();
  const { 
    templates: convexTemplates, 
    useTemplate,
    initializeDefaultTemplates 
  } = useMessageTemplates();
  
  // State management
  const [activeTab, setActiveTab] = useState('driver'); // driver, customer, email
  const [loading, setLoading] = useState(false);
  // REMOVED: const [templates, setTemplates] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [messageStats, setMessageStats] = useState(null);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(null);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showMessageHistory, setShowMessageHistory] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  
  // Phase 7 Modal states
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showBulkManager, setShowBulkManager] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showIntegrationStatus, setShowIntegrationStatus] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  
  // Message composition state
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

  // Tab configuration
  const tabs = [
    {
      id: 'driver',
      name: 'Driver Messages',
      icon: 'bus',
      color: '#2563EB',
      url: 'https://portal.ticketer.org.uk/DriverMessagingCompose/CreateOutboundMessage',
      description: 'Send messages to driver Ticketer devices',
      authRequired: true,
      authMessage: 'Ticketer requires separate login. Use "Open in New Window" to access the portal directly.'
    },
    {
      id: 'customer',
      name: 'Customer Messages',
      icon: 'people',
      color: '#10B981',
      url: 'https://gonortheast.passenger-app.com/login',
      description: 'Update passengers via Passenger Cloud',
      authRequired: true,
      authMessage: 'Passenger Cloud requires separate login. Use "Open in New Window" to access the portal directly.'
    },
    {
      id: 'email',
      name: 'Email Centre',
      icon: 'mail',
      color: '#8B5CF6',
      url: 'https://outlook.office365.com/mail/',
      description: 'Send emails to directors and management',
      authRequired: true,
      authMessage: 'Outlook requires Microsoft 365 login. Use "Open in New Window" to access the portal directly.'
    },
    {
      id: 'history',
      name: 'Message History',
      icon: 'time',
      color: '#F59E0B',
      description: 'View sent messages, drafts, and scheduled messages',
      authRequired: false,
      isModal: true
    },
    {
      id: 'audit',
      name: 'Audit Log',
      icon: 'shield-checkmark',
      color: '#DC2626',
      description: 'Track all message activities and changes',
      authRequired: false,
      isModal: true
    },
    // Phase 7 Advanced Features
    {
      id: 'analytics',
      name: 'Analytics',
      icon: 'stats-chart',
      color: '#3B82F6',
      description: 'View delivery metrics and performance insights',
      authRequired: false,
      isModal: true
    },
    {
      id: 'bulk',
      name: 'Bulk Manager',
      icon: 'checkbox',
      color: '#10B981',
      description: 'Select and manage multiple messages at once',
      authRequired: false,
      isModal: true
    },
    {
      id: 'scheduler',
      name: 'Scheduler',
      icon: 'calendar',
      color: '#8B5CF6',
      description: 'Advanced scheduling and recurring messages',
      authRequired: false,
      isModal: true
    },
    {
      id: 'integration',
      name: 'Integration Status',
      icon: 'pulse',
      color: '#EF4444',
      description: 'Monitor external service health and API status',
      authRequired: false,
      isModal: true
    },
    {
      id: 'search',
      name: 'Advanced Search',
      icon: 'search',
      color: '#06B6D4',
      description: 'Search across messages, templates, and audit logs',
      authRequired: false,
      isModal: true
    }
  ];

  // Quick action templates
  const quickActions = [
    {
      id: 'roadwork',
      icon: 'construct',
      label: 'Alert from Roadwork',
      color: '#F59E0B'
    },
    {
      id: 'incident',
      icon: 'warning',
      label: 'Alert from Incident',
      color: '#EF4444'
    },
    {
      id: 'custom',
      icon: 'create',
      label: 'Custom Message',
      color: '#6366F1'
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
    { id: 'low', name: 'Low', color: '#94A3B8', icon: 'time-outline' },
    { id: 'normal', name: 'Normal', color: '#2563EB', icon: 'checkmark-circle-outline' },
    { id: 'high', name: 'High', color: '#F59E0B', icon: 'alert-circle-outline' },
    { id: 'urgent', name: 'Urgent', color: '#EF4444', icon: 'warning-outline' }
  ];

  // Load data on mount
  useEffect(() => {
    if (isLoggedIn) {
      // Initialize default templates (High Level Bridge)
      initializeDefaultTemplates(supervisorId, supervisorName);
      // Convex templates are now used directly from the hook
      fetchRecentMessages();
      fetchMessageStats();
    }
  }, [isLoggedIn]);

  // Fetch templates (removed - now using Convex)
  // const fetchTemplates = async () => { ... }

  // Fetch recent messages
  const fetchRecentMessages = async () => {
    try {
      const response = await fetch('/api/messages/recent', {
        headers: {
          'Content-Type': 'application/json',
          'X-Supervisor-ID': supervisorId || 'unknown'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRecentMessages(data.messages || []);
        } else {
          setRecentMessages([]);
        }
      } else {
        setRecentMessages([]);
      }
    } catch (error) {
      console.error('Error fetching recent messages:', error);
      setRecentMessages([]);
    }
  };

  // Fetch message stats
  const fetchMessageStats = async () => {
    try {
      const response = await fetch('/api/messages/stats', {
        headers: {
          'Content-Type': 'application/json',
          'X-Supervisor-ID': supervisorId || 'unknown'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessageStats(data.stats || {
            todayCount: 0,
            weekCount: 0,
            monthCount: 0
          });
        } else {
          setMessageStats({
            todayCount: 0,
            weekCount: 0,
            monthCount: 0
          });
        }
      } else {
        setMessageStats({
          todayCount: 0,
          weekCount: 0,
          monthCount: 0
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setMessageStats({
        todayCount: 0,
        weekCount: 0,
        monthCount: 0
      });
    }
  };

  // Handle tab press (including modal tabs)
  const handleTabPress = (tab) => {
    if (tab.isModal) {
      switch (tab.id) {
        case 'history':
          setShowMessageHistory(true);
          break;
        case 'audit':
          setShowAuditLog(true);
          break;
        // Phase 7 Advanced Features
        case 'analytics':
          setShowAnalytics(true);
          break;
        case 'bulk':
          setShowBulkManager(true);
          break;
        case 'scheduler':
          setShowScheduler(true);
          break;
        case 'integration':
          setShowIntegrationStatus(true);
          break;
        case 'search':
          setShowAdvancedSearch(true);
          break;
        default:
          setActiveTab(tab.id);
      }
    } else {
      setActiveTab(tab.id);
    }
  };

  // Handle template selection
  const handleTemplateSelect = async (template) => {
    setMessageForm(prev => ({
      ...prev,
      message: template.content,
      subject: template.subject || template.name,
      category: template.category || 'general',
      priority: template.isUrgent ? 'urgent' : (template.priority || 'normal'),
      template: template.templateId
    }));
    
    // Track template usage
    await useTemplate(template.templateId);
  };

  // Handle quick action
  const handleQuickAction = (actionId) => {
    switch (actionId) {
      case 'custom':
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
        break;
    }
  };

  // Handle message generated from alerts
  const handleMessageGenerated = (messageData) => {
    setMessageForm(prev => ({
      ...prev,
      subject: messageData.subject,
      message: messageData.content,
      routes: messageData.routes || [],
      priority: messageData.priority || 'normal',
      category: messageData.category || 'general',
      template: null
    }));
    
    // Log the communication in Convex
    if (logCommunication) {
      logCommunication({
        type: 'message_generated',
        source: messageData.alertType,
        alertId: messageData.alertId,
        routes: messageData.routes,
        supervisorBadge: supervisorId,
        timestamp: Date.now()
      });
    }
    
    Alert.alert(
      'Message Generated', 
      'A message has been generated from the alert and populated in the form. You can now copy it to the appropriate channel.',
      [{ text: 'OK', style: 'default' }]
    );
  };

  // Copy message to clipboard and show modal
  const handleCopyMessage = async () => {
    if (!messageForm.message.trim()) {
      Alert.alert('Error', 'Please compose a message first');
      return;
    }

    const formattedMessage = formatMessageForChannel(activeTab);
    const currentTab = tabs.find(t => t.id === activeTab);
    
    // Create message record for history and audit
    const messageRecord = {
      id: `copy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      subject: messageForm.subject || `${currentTab?.name} Message`,
      content: formattedMessage,
      channel: activeTab,
      status: 'copied',
      priority: messageForm.priority,
      category: messageForm.category,
      routes: messageForm.routes,
      depots: messageForm.depots,
      createdAt: new Date().toISOString(),
      createdBy: supervisorId || supervisorName || 'Unknown',
      action: 'message_copied',
      details: `Message copied to clipboard for ${currentTab?.name}`
    };

    try {
      // Save to message history
      await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Supervisor-ID': supervisorId || 'unknown'
        },
        body: JSON.stringify({
          action: 'create',
          message: messageRecord
        })
      });

      // Save to audit log
      await fetch('/api/messages/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Supervisor-ID': supervisorId || 'unknown'
        },
        body: JSON.stringify({
          action: 'message_copied',
          messageId: messageRecord.id,
          details: messageRecord.details,
          userId: supervisorId || supervisorName || 'Unknown',
          timestamp: new Date().toISOString(),
          metadata: {
            channel: activeTab,
            subject: messageRecord.subject,
            priority: messageForm.priority,
            category: messageForm.category,
            routes: messageForm.routes,
            messageLength: formattedMessage.length
          }
        })
      });

      // Copy to clipboard
      if (Platform.OS === 'web') {
        navigator.clipboard.writeText(formattedMessage).then(() => {
          setCopiedMessage(formattedMessage);
          setShowCopyModal(true);
        });
      } else {
        Clipboard.setString(formattedMessage);
        setCopiedMessage(formattedMessage);
        setShowCopyModal(true);
      }

      console.log(`[Copy Message] Logged to history and audit: ${messageRecord.id}`);
      
    } catch (error) {
      console.error('Error logging copy action:', error);
      // Still copy to clipboard even if logging fails
      if (Platform.OS === 'web') {
        navigator.clipboard.writeText(formattedMessage).then(() => {
          setCopiedMessage(formattedMessage);
          setShowCopyModal(true);
        });
      } else {
        Clipboard.setString(formattedMessage);
        setCopiedMessage(formattedMessage);
        setShowCopyModal(true);
      }
    }
  };

  // Format message based on channel
  const formatMessageForChannel = (channel) => {
    let formatted = messageForm.message;
    
    if (channel === 'email' && messageForm.subject) {
      formatted = `Subject: ${messageForm.subject}\n\n${formatted}`;
    }
    
    if (messageForm.routes.length > 0) {
      formatted = formatted.replace('{routes}', messageForm.routes.join(', '));
    }
    
    return formatted;
  };

  // Render header
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Ionicons name="chatbubbles" size={32} color="#1E293B" />
            <View>
              <Text style={styles.headerTitle}>Message Distribution Centre</Text>
              <Text style={styles.headerSubtitle}>Unified Communication Platform</Text>
            </View>
          </View>
        </View>
        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{messageStats?.todayCount || 0}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{messageStats?.weekCount || 0}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
        </View>
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close-circle" size={32} color="#64748B" />
        </Pressable>
      </View>
    </View>
  );

  // Render tabs
  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <Pressable
            key={tab.id}
            style={[styles.tab, isActive && styles.activeTab]}
            onPress={() => handleTabPress(tab)}
          >
            <Ionicons
              name={tab.icon}
              size={20}
              color={isActive ? tab.color : '#64748B'}
            />
            <Text style={[styles.tabText, isActive && { color: tab.color }]}>
              {tab.name}
            </Text>
            {isActive && <View style={[styles.tabIndicator, { backgroundColor: tab.color }]} />}
          </Pressable>
        );
      })}
    </View>
  );

  // Render quick actions using the enhanced QuickActions component
  const renderQuickActions = () => (
    <QuickActions 
      onActionSelect={handleQuickAction}
      onMessageGenerated={handleMessageGenerated}
    />
  );

  // Render message composition
  const renderMessageComposition = () => (
    <View style={styles.compositionSection}>
      <Text style={styles.sectionTitle}>Compose Message</Text>
      
      {/* Template selector */}
      <View style={styles.templateSelector}>
        <View style={styles.templateSelectorHeader}>
          <Text style={styles.fieldLabel}>Template</Text>
          <Pressable
            style={styles.manageTemplatesButton}
            onPress={() => setShowTemplateManager(true)}
          >
            <Ionicons name="settings-outline" size={16} color="#2563EB" />
            <Text style={styles.manageTemplatesText}>Manage Templates</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.templateList}>
            {convexTemplates.map((template) => (
              <Pressable
                key={template.templateId}
                style={[
                  styles.templateCard,
                  messageForm.template === template.templateId && styles.templateCardActive
                ]}
                onPress={() => handleTemplateSelect(template)}
              >
                <Text style={styles.templateName}>{template.name}</Text>
                {template.isUrgent && (
                  <View style={styles.urgentIndicator}>
                    <Ionicons name="warning" size={12} color="#EF4444" />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Category */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Category</Text>
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
                  color={messageForm.category === category.id ? '#2563EB' : '#64748B'}
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

      {/* Priority */}
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
              <Ionicons
                name={priority.icon}
                size={16}
                color={messageForm.priority === priority.id ? priority.color : '#64748B'}
              />
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

      {/* Routes */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Affected Routes (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter route numbers (e.g., 21, X21, 307)"
          value={messageForm.routes.join(', ')}
          onChangeText={(text) => {
            const routes = text.split(',').map(r => r.trim()).filter(r => r);
            setMessageForm(prev => ({ ...prev, routes }));
          }}
        />
      </View>

      {/* Subject (for email) */}
      {activeTab === 'email' && (
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Subject</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter email subject"
            value={messageForm.subject}
            onChangeText={(text) => setMessageForm(prev => ({ ...prev, subject: text }))}
          />
        </View>
      )}

      {/* Message content */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Message</Text>
        <TextInput
          style={styles.messageInput}
          placeholder="Type your message here..."
          value={messageForm.message}
          onChangeText={(text) => setMessageForm(prev => ({ ...prev, message: text }))}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{messageForm.message.length} characters</Text>
      </View>

      {/* Copy button */}
      <Pressable
        style={[
          styles.copyButton,
          !messageForm.message.trim() && styles.copyButtonDisabled
        ]}
        onPress={handleCopyMessage}
        disabled={!messageForm.message.trim()}
      >
        <Ionicons name="copy" size={20} color="#FFFFFF" />
        <Text style={styles.copyButtonText}>Copy Message</Text>
      </Pressable>
    </View>
  );

  // State for iframe loading
  const [loadedIframes, setLoadedIframes] = useState({});

  // Render iframe content
  const renderIframeContent = () => {
    if (!isWeb) {
      return (
        <View style={styles.mobileWarning}>
          <Ionicons name="desktop" size={48} color="#94A3B8" />
          <Text style={styles.mobileWarningText}>
            This feature is only available on desktop browsers
          </Text>
        </View>
      );
    }

    const currentTab = tabs.find(t => t.id === activeTab);
    const isLoaded = loadedIframes[activeTab];
    
    return (
      <View style={styles.iframeSection}>
        <View style={styles.iframeTitleBar}>
          <Text style={styles.iframeTitle}>{currentTab.name} Portal</Text>
          <Text style={styles.iframeDescription}>{currentTab.description}</Text>
          {isLoaded && (
            <Pressable
              style={styles.iframeRefresh}
              onPress={() => {
                const iframe = document.getElementById(`iframe-${activeTab}`);
                if (iframe) iframe.src = iframe.src;
              }}
            >
              <Ionicons name="refresh" size={20} color="#64748B" />
            </Pressable>
          )}
        </View>
        <View style={styles.iframeContainer}>
          {!isLoaded ? (
            <View style={styles.iframeLoadPrompt}>
              <Ionicons name={currentTab.icon} size={64} color={currentTab.color} />
              <Text style={styles.iframeLoadTitle}>{currentTab.name}</Text>
              <Text style={styles.iframeLoadDescription}>
                Click below to load the {currentTab.name} portal.
              </Text>
              {currentTab.authRequired && (
                <View style={styles.authWarning}>
                  <Ionicons name="information-circle" size={20} color="#F59E0B" />
                  <Text style={styles.authWarningText}>{currentTab.authMessage}</Text>
                </View>
              )}
              <View style={styles.portalOptions}>
                <Pressable
                  style={[styles.openNewWindowButton, { borderColor: currentTab.color }]}
                  onPress={() => window.open(currentTab.url, '_blank')}
                >
                  <Ionicons name="open-outline" size={20} color={currentTab.color} />
                  <Text style={[styles.openNewWindowButtonText, { color: currentTab.color }]}>Open in New Window</Text>
                </Pressable>
                <Text style={styles.orText}>or</Text>
                <Pressable
                  style={[styles.copyMessageFirstButton]}
                  onPress={handleCopyMessage}
                >
                  <Ionicons name="copy" size={20} color="#2563EB" />
                  <Text style={styles.copyMessageFirstButtonText}>Copy Your Message First</Text>
                </Pressable>
              </View>
              <View style={styles.iframeInstruction}>
                <Text style={styles.instructionBold}>Recommended workflow:</Text>
                <Text>1. Compose your message on the left</Text>
                <Text>2. Click "Copy Your Message First"</Text>
                <Text>3. Click "Open in New Window"</Text>
                <Text>4. Log in to {currentTab.name} if needed</Text>
                <Text>5. Paste your message</Text>
              </View>
            </View>
          ) : (
            <iframe
              id={`iframe-${activeTab}`}
              src={currentTab.url}
              style={{
                width: '100%',
                height: 600,
                border: 'none',
                backgroundColor: '#FFFFFF'
              }}
              title={`${currentTab.name} Portal`}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-popups-to-escape-sandbox"
            />
          )}
        </View>
      </View>
    );
  };

  // Render message history sidebar
  const renderMessageHistory = () => (
    <View style={styles.historySection}>
      <Text style={styles.sectionTitle}>Recent Messages</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {recentMessages.map((msg) => {
          const tab = tabs.find(t => t.id === msg.channel);
          return (
            <View key={msg.id} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <Ionicons name={tab?.icon} size={16} color={tab?.color} />
                <Text style={styles.historyChannel}>{tab?.name}</Text>
                <Text style={[
                  styles.historyPriority,
                  { color: priorityLevels.find(p => p.id === msg.priority)?.color }
                ]}>
                  {msg.priority}
                </Text>
              </View>
              <Text style={styles.historySubject}>{msg.subject}</Text>
              <Text style={styles.historyMessage} numberOfLines={2}>
                {msg.message}
              </Text>
              <Text style={styles.historyTime}>
                {msg.timestamp.toLocaleTimeString()} • {msg.recipientCount} recipients
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );

  // Copy modal
  const renderCopyModal = () => (
    <Modal
      visible={showCopyModal}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setShowCopyModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.copyModal}>
          <View style={styles.copyModalHeader}>
            <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            <Text style={styles.copyModalTitle}>Message Copied!</Text>
          </View>
          <Text style={styles.copyModalText}>
            Your message has been copied to the clipboard. You can now paste it into the {tabs.find(t => t.id === activeTab)?.name} system.
          </Text>
          <View style={styles.copyModalMessage}>
            <Text style={styles.copyModalMessageText}>{copiedMessage}</Text>
          </View>
          <Pressable
            style={styles.copyModalButton}
            onPress={() => setShowCopyModal(false)}
          >
            <Text style={styles.copyModalButtonText}>Continue</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );

  // Check authentication
  if (!isLoggedIn) {
    return (
      <View style={styles.authRequired}>
        <Ionicons name="lock-closed" size={48} color="#94A3B8" />
        <Text style={styles.authRequiredTitle}>Authentication Required</Text>
        <Text style={styles.authRequiredText}>
          Please log in as a supervisor to access the Message Distribution Centre
        </Text>
      </View>
    );
  }

  // Main render
  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {renderHeader()}
        {renderTabs()}
        
        <View style={styles.mainContent}>
          <View style={styles.leftPanel}>
            {renderQuickActions()}
            {renderMessageComposition()}
          </View>
          
          <View style={styles.centerPanel}>
            {renderIframeContent()}
          </View>
          
          <View style={styles.rightPanel}>
            {renderMessageHistory()}
          </View>
        </View>
        
        {renderCopyModal()}
        
        {/* Template Manager Modal */}
        {showTemplateManager && (
          <Modal
            visible={showTemplateManager}
            animationType="slide"
            transparent={false}
            onRequestClose={() => setShowTemplateManager(false)}
          >
            <View style={styles.templateManagerContainer}>
              <View style={styles.templateManagerHeader}>
                <Text style={styles.templateManagerTitle}>Message Templates</Text>
                <Pressable
                  style={styles.templateManagerClose}
                  onPress={() => setShowTemplateManager(false)}
                >
                  <Ionicons name="close" size={24} color="#64748B" />
                </Pressable>
              </View>
              <TemplateManager />
            </View>
          </Modal>
        )}

        {/* Phase 6: Message History Modal */}
        <MessageHistory
          visible={showMessageHistory}
          onClose={() => setShowMessageHistory(false)}
        />

        {/* Phase 6: Audit Log Modal */}
        <MessageAuditLog
          visible={showAuditLog}
          onClose={() => setShowAuditLog(false)}
        />

        {/* Phase 7: Advanced Features Modals */}
        <MessageAnalytics
          visible={showAnalytics}
          onClose={() => setShowAnalytics(false)}
        />

        <BulkMessageManager
          visible={showBulkManager}
          onClose={() => setShowBulkManager(false)}
        />

        <MessageScheduler
          visible={showScheduler}
          onClose={() => setShowScheduler(false)}
        />

        <IntegrationStatus
          visible={showIntegrationStatus}
          onClose={() => setShowIntegrationStatus(false)}
        />

        <AdvancedSearch
          visible={showAdvancedSearch}
          onClose={() => setShowAdvancedSearch(false)}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  
  // Header
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: isWeb ? 24 : 48,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  titleSection: {
    flex: 1
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.5
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 20
  },
  statItem: {
    alignItems: 'center'
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A'
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#CBD5E1'
  },
  closeButton: {
    padding: 8,
    marginLeft: 16
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 8,
    position: 'relative'
  },
  activeTab: {
    backgroundColor: '#F8FAFC'
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B'
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3
  },

  // Main content layout
  mainContent: {
    flex: 1,
    flexDirection: 'row'
  },
  leftPanel: {
    width: isTablet ? 400 : '100%',
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0'
  },
  centerPanel: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  rightPanel: {
    width: 300,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
    display: isTablet ? 'flex' : 'none'
  },

  // Quick actions
  quickActionsSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12
  },
  quickActionCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center'
  },

  // Message composition
  compositionSection: {
    padding: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16
  },
  templateSelector: {
    marginBottom: 20
  },
  templateSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  manageTemplatesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#EFF6FF'
  },
  manageTemplatesText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#2563EB'
  },
  templateList: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4
  },
  templateCard: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  templateCardActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#2563EB'
  },
  templateName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155'
  },
  urgentIndicator: {
    backgroundColor: '#FEE2E2',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  fieldGroup: {
    marginBottom: 20
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 8
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6
  },
  categoryChipActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#2563EB'
  },
  categoryText: {
    fontSize: 13,
    color: '#64748B'
  },
  categoryTextActive: {
    color: '#2563EB',
    fontWeight: '500'
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 8
  },
  priorityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0'
  },
  priorityButtonActive: {
    backgroundColor: '#FFFFFF'
  },
  priorityText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B'
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A'
  },
  messageInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 16,
    fontSize: 14,
    color: '#0F172A',
    minHeight: 120,
    textAlignVertical: 'top'
  },
  charCount: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 4
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
    marginTop: 8
  },
  copyButtonDisabled: {
    backgroundColor: '#CBD5E1'
  },
  copyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF'
  },

  // iframe section
  iframeSection: {
    flex: 1,
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3
  },
  iframeTitleBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  iframeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A'
  },
  iframeDescription: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
    marginLeft: 16
  },
  iframeRefresh: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  iframeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  mobileWarning: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  mobileWarningText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 16
  },

  // History sidebar
  historySection: {
    flex: 1,
    padding: 20
  },
  historyCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8
  },
  historyChannel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    flex: 1
  },
  historyPriority: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  historySubject: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4
  },
  historyMessage: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 8
  },
  historyTime: {
    fontSize: 11,
    color: '#94A3B8'
  },

  // Copy modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  copyModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    width: '90%',
    maxWidth: 480,
    alignItems: 'center'
  },
  copyModalHeader: {
    alignItems: 'center',
    marginBottom: 24
  },
  copyModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 16
  },
  copyModalText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24
  },
  copyModalMessage: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  copyModalMessageText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20
  },
  copyModalButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8
  },
  copyModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF'
  },

  // Auth required
  authRequired: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F8FAFC'
  },
  authRequiredTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 24,
    marginBottom: 8
  },
  authRequiredText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24
  },

  // iframe load prompt
  iframeLoadPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48
  },
  iframeLoadTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 24,
    marginBottom: 8
  },
  iframeLoadDescription: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 400
  },
  loadPortalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
    marginBottom: 24
  },
  loadPortalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF'
  },
  iframeWarning: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 400,
    fontStyle: 'italic'
  },
  portalOptions: {
    flexDirection: 'column',
    gap: 12,
    alignItems: 'center'
  },
  openNewWindowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 8
  },
  openNewWindowButtonText: {
    fontSize: 16,
    fontWeight: '600'
  },
  authWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    gap: 12,
    maxWidth: 500
  },
  authWarningText: {
    fontSize: 14,
    color: '#92400E',
    flex: 1,
    lineHeight: 20
  },
  orText: {
    fontSize: 14,
    color: '#94A3B8',
    marginVertical: 8
  },
  copyMessageFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#2563EB',
    gap: 8
  },
  copyMessageFirstButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB'
  },
  iframeInstruction: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
    marginTop: 32,
    padding: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    maxWidth: 500
  },
  instructionBold: {
    fontWeight: '700',
    color: '#334155'
  },
  
  // Template Manager Modal
  templateManagerContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  templateManagerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: isWeb ? 24 : 48,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3
  },
  templateManagerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A'
  },
  templateManagerClose: {
    padding: 8
  }
});

export default MessageDistributionEnhanced;
