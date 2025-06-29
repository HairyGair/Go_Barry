// components/SupervisorCoordination.jsx
// Multi-Supervisor Coordination Interface - Phase 4.1
// Real-time messaging and coordination between supervisors

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Platform } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { useSupervisorSession } from './hooks/useSupervisorSession';

const SupervisorCoordination = () => {
  const [activeTab, setActiveTab] = useState('messages');
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  
  const { supervisor } = useSupervisorSession();
  
  // Convex queries and mutations
  const messages = useQuery(api.coordination.getCoordinationMessages, {
    supervisorId: supervisor?.supervisorId || "",
    depotCode: supervisor?.depot || ""
  });
  
  const depotChannels = useQuery(api.coordination.getDepotChannels, {
    depotCode: supervisor?.depot
  });
  
  const coordinationStats = useQuery(api.coordination.getCoordinationStats, {
    supervisorId: supervisor?.supervisorId,
    timeframe: '24h'
  });
  
  const sendMessage = useMutation(api.coordination.sendCoordinationMessage);
  const markAsRead = useMutation(api.coordination.markMessageAsRead);
  const respondToMessage = useMutation(api.coordination.respondToMessage);

  // Tab configuration
  const tabs = [
    { id: 'messages', label: 'Messages', icon: '💬', count: messages?.filter(m => !m.readBy.some(r => r.supervisorId === supervisor?.supervisorId)).length },
    { id: 'broadcast', label: 'Broadcast', icon: '📢', count: null },
    { id: 'depot', label: 'Depot Channels', icon: '🏢', count: depotChannels?.length },
    { id: 'stats', label: 'Analytics', icon: '📊', count: null },
  ];

  // Mark message as read when viewing
  const handleMessageClick = async (message) => {
    setSelectedMessage(message);
    
    // Mark as read if not already
    const alreadyRead = message.readBy.some(r => r.supervisorId === supervisor?.supervisorId);
    if (!alreadyRead && supervisor) {
      try {
        await markAsRead({
          messageId: message.messageId,
          supervisorId: supervisor.supervisorId,
          supervisorName: supervisor.supervisorName
        });
      } catch (error) {
        console.error('Failed to mark message as read:', error);
      }
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'messages':
        return <MessagesView 
          messages={messages || []} 
          supervisor={supervisor}
          onMessageClick={handleMessageClick}
          onCompose={() => setShowComposeModal(true)}
        />;
      case 'broadcast':
        return <BroadcastView 
          supervisor={supervisor}
          onSend={sendMessage}
        />;
      case 'depot':
        return <DepotChannelsView 
          channels={depotChannels || []}
          supervisor={supervisor}
        />;
      case 'stats':
        return <CoordinationStatsView 
          stats={coordinationStats}
          supervisor={supervisor}
        />;
      default:
        return <MessagesView 
          messages={messages || []} 
          supervisor={supervisor}
          onMessageClick={handleMessageClick}
          onCompose={() => setShowComposeModal(true)}
        />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Supervisor Coordination</Text>
        <TouchableOpacity 
          style={styles.composeButton}
          onPress={() => setShowComposeModal(true)}
        >
          <Text style={styles.composeButtonText}>✏️ Compose</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id)}
          >
            <View style={styles.tabContent}>
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, activeTab === tab.id && styles.activeTabLabel]}>
                {tab.label}
              </Text>
              {tab.count !== null && tab.count > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{tab.count}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {renderTabContent()}
      </View>

      {/* Compose Message Modal */}
      {showComposeModal && (
        <ComposeMessageModal
          visible={showComposeModal}
          onClose={() => setShowComposeModal(false)}
          supervisor={supervisor}
          onSend={sendMessage}
        />
      )}

      {/* Message Detail Modal */}
      {selectedMessage && (
        <MessageDetailModal
          visible={!!selectedMessage}
          message={selectedMessage}
          supervisor={supervisor}
          onClose={() => setSelectedMessage(null)}
          onRespond={(message) => {
            setSelectedMessage(null);
            setShowResponseModal(message);
          }}
          onSend={respondToMessage}
        />
      )}
    </View>
  );
};

// Messages View Component
const MessagesView = ({ messages, supervisor, onMessageClick, onCompose }) => {
  const unreadMessages = messages.filter(m => !m.readBy.some(r => r.supervisorId === supervisor?.supervisorId));
  const readMessages = messages.filter(m => m.readBy.some(r => r.supervisorId === supervisor?.supervisorId));

  return (
    <ScrollView style={styles.messagesContent}>
      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <StatCard title="Unread" value={unreadMessages.length} color="#ff6b6b" />
        <StatCard title="Total Today" value={messages.length} color="#4ecdc4" />
        <StatCard title="Urgent" value={messages.filter(m => m.priority === 'urgent').length} color="#ff9f43" />
      </View>

      {/* Unread Messages */}
      {unreadMessages.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📬 Unread Messages</Text>
          {unreadMessages.map((message, index) => (
            <MessageCard 
              key={message.messageId} 
              message={message} 
              isUnread={true}
              onPress={() => onMessageClick(message)}
            />
          ))}
        </View>
      )}

      {/* Recent Messages */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💬 Recent Messages</Text>
        {readMessages.length > 0 ? (
          readMessages.slice(0, 10).map((message, index) => (
            <MessageCard 
              key={message.messageId} 
              message={message} 
              isUnread={false}
              onPress={() => onMessageClick(message)}
            />
          ))
        ) : (
          <Text style={styles.emptyText}>No recent messages</Text>
        )}
      </View>
    </ScrollView>
  );
};

// Broadcast View Component  
const BroadcastView = ({ supervisor, onSend }) => {
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('medium');
  const [targetType, setTargetType] = useState('all');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || !supervisor) return;
    
    setSending(true);
    try {
      await onSend({
        content: message,
        messageType: 'broadcast',
        priority,
        fromSupervisorId: supervisor.supervisorId,
        fromSupervisorName: supervisor.supervisorName,
        fromSupervisorBadge: supervisor.badge,
        targetType,
        subject: `Broadcast from ${supervisor.supervisorName}`,
        requiresResponse: false,
      });
      
      setMessage('');
      alert('✅ Broadcast message sent successfully!');
    } catch (error) {
      console.error('Failed to send broadcast:', error);
      alert('❌ Failed to send broadcast message');
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView style={styles.broadcastContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📢 Broadcast Message</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Target Audience</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={[styles.optionButton, targetType === 'all' && styles.activeOption]}
              onPress={() => setTargetType('all')}
            >
              <Text style={styles.optionText}>All Supervisors</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.optionButton, targetType === 'depot' && styles.activeOption]}
              onPress={() => setTargetType('depot')}
            >
              <Text style={styles.optionText}>My Depot</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Priority Level</Text>
          <View style={styles.buttonGroup}>
            {['low', 'medium', 'high', 'urgent'].map((p) => (
              <TouchableOpacity 
                key={p}
                style={[styles.priorityButton, priority === p && styles.activePriority]}
                onPress={() => setPriority(p)}
              >
                <Text style={[styles.priorityText, { color: getPriorityColor(p) }]}>
                  {p.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Message</Text>
          <TextInput
            style={styles.messageInput}
            multiline
            numberOfLines={4}
            placeholder="Enter your broadcast message..."
            value={message}
            onChangeText={setMessage}
            maxLength={500}
          />
          <Text style={styles.charCount}>{message.length}/500</Text>
        </View>

        <TouchableOpacity 
          style={[styles.sendButton, (!message.trim() || sending) && styles.disabledButton]}
          onPress={handleSend}
          disabled={!message.trim() || sending}
        >
          <Text style={styles.sendButtonText}>
            {sending ? '📤 Sending...' : '📢 Send Broadcast'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// Depot Channels View Component
const DepotChannelsView = ({ channels, supervisor }) => {
  return (
    <ScrollView style={styles.depotContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏢 Depot Channels</Text>
        
        {channels.length > 0 ? (
          channels.map((channel, index) => (
            <ChannelCard key={channel.channelId} channel={channel} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No depot channels available</Text>
            <Text style={styles.emptySubtext}>Contact admin to set up channels for your depot</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

// Coordination Stats View Component
const CoordinationStatsView = ({ stats, supervisor }) => {
  return (
    <ScrollView style={styles.statsContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Coordination Analytics (24h)</Text>
        
        <View style={styles.statsGrid}>
          <StatCard title="Messages Sent" value={stats?.messagesSent || 0} color="#0984e3" />
          <StatCard title="Messages Received" value={stats?.messagesReceived || 0} color="#00b894" />
          <StatCard title="Response Rate" value={`${Math.round((stats?.responseRate || 0) * 100)}%`} color="#fdcb6e" />
        </View>

        <Text style={styles.subSectionTitle}>By Priority</Text>
        <View style={styles.statsGrid}>
          <StatCard title="Urgent" value={stats?.byPriority?.urgent || 0} color="#e17055" />
          <StatCard title="High" value={stats?.byPriority?.high || 0} color="#fd79a8" />
          <StatCard title="Medium" value={stats?.byPriority?.medium || 0} color="#fdcb6e" />
          <StatCard title="Low" value={stats?.byPriority?.low || 0} color="#55efc4" />
        </View>

        <Text style={styles.subSectionTitle}>By Type</Text>
        <View style={styles.statsGrid}>
          <StatCard title="Broadcast" value={stats?.byType?.broadcast || 0} color="#a29bfe" />
          <StatCard title="Depot" value={stats?.byType?.depot || 0} color="#fd79a8" />
          <StatCard title="Direct" value={stats?.byType?.direct || 0} color="#6c5ce7" />
          <StatCard title="Alert Coord" value={stats?.byType?.alert_coordination || 0} color="#ffeaa7" />
        </View>
      </View>
    </ScrollView>
  );
};

// Utility Components
const MessageCard = ({ message, isUnread, onPress }) => (
  <TouchableOpacity style={[styles.messageCard, isUnread && styles.unreadCard]} onPress={onPress}>
    <View style={styles.messageHeader}>
      <View style={styles.messageFrom}>
        <Text style={styles.fromName}>{message.fromSupervisorName}</Text>
        <Text style={styles.fromBadge}>{message.fromSupervisorBadge}</Text>
      </View>
      <View style={styles.messageMetadata}>
        <Text style={[styles.priorityBadge, { backgroundColor: getPriorityColor(message.priority) }]}>
          {message.priority.toUpperCase()}
        </Text>
        <Text style={styles.messageTime}>
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
    
    {message.subject && (
      <Text style={styles.messageSubject}>{message.subject}</Text>
    )}
    
    <Text style={styles.messageContent} numberOfLines={2}>
      {message.content}
    </Text>
    
    <View style={styles.messageFooter}>
      <Text style={styles.messageType}>📋 {message.messageType}</Text>
      {message.requiresResponse && (
        <Text style={styles.requiresResponse}>⚡ Response Required</Text>
      )}
      {message.responses.length > 0 && (
        <Text style={styles.responseCount}>💬 {message.responses.length} responses</Text>
      )}
    </View>
  </TouchableOpacity>
);

const ChannelCard = ({ channel }) => (
  <View style={styles.channelCard}>
    <View style={styles.channelHeader}>
      <Text style={styles.channelName}>{channel.name}</Text>
      <Text style={styles.channelCode}>{channel.depotCode}</Text>
    </View>
    <Text style={styles.channelDescription}>{channel.description}</Text>
    <View style={styles.channelFooter}>
      <Text style={styles.channelStats}>📝 {channel.messageCount} messages</Text>
      {channel.lastMessageAt && (
        <Text style={styles.lastMessage}>
          Last: {new Date(channel.lastMessageAt).toLocaleDateString()}
        </Text>
      )}
    </View>
  </View>
);

const StatCard = ({ title, value, color }) => (
  <View style={styles.statCard}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </View>
);

// Compose Message Modal (simplified for now)
const ComposeMessageModal = ({ visible, onClose, supervisor, onSend }) => {
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('medium');
  const [messageType, setMessageType] = useState('direct');
  const [targetType, setTargetType] = useState('all');

  const handleSend = async () => {
    if (!message.trim() || !supervisor) return;
    
    try {
      await onSend({
        content: message,
        messageType,
        priority,
        fromSupervisorId: supervisor.supervisorId,
        fromSupervisorName: supervisor.supervisorName,
        fromSupervisorBadge: supervisor.badge,
        targetType,
        requiresResponse: false,
      });
      
      setMessage('');
      onClose();
      alert('✅ Message sent successfully!');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('❌ Failed to send message');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Compose Message</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Message Type</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity 
                style={[styles.optionButton, messageType === 'direct' && styles.activeOption]}
                onPress={() => setMessageType('direct')}
              >
                <Text style={styles.optionText}>Direct</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.optionButton, messageType === 'broadcast' && styles.activeOption]}
                onPress={() => setMessageType('broadcast')}
              >
                <Text style={styles.optionText}>Broadcast</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Priority</Text>
            <View style={styles.buttonGroup}>
              {['low', 'medium', 'high', 'urgent'].map((p) => (
                <TouchableOpacity 
                  key={p}
                  style={[styles.priorityButton, priority === p && styles.activePriority]}
                  onPress={() => setPriority(p)}
                >
                  <Text style={[styles.priorityText, { color: getPriorityColor(p) }]}>
                    {p.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Message</Text>
            <TextInput
              style={styles.messageInput}
              multiline
              numberOfLines={6}
              placeholder="Enter your message..."
              value={message}
              onChangeText={setMessage}
              maxLength={500}
            />
          </View>

          <TouchableOpacity 
            style={[styles.sendButton, !message.trim() && styles.disabledButton]}
            onPress={handleSend}
            disabled={!message.trim()}
          >
            <Text style={styles.sendButtonText}>📤 Send Message</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

// Message Detail Modal (simplified for now)
const MessageDetailModal = ({ visible, message, supervisor, onClose, onRespond, onSend }) => {
  const [response, setResponse] = useState('');
  const [sending, setSending] = useState(false);

  const handleRespond = async () => {
    if (!response.trim() || !supervisor) return;
    
    setSending(true);
    try {
      await onSend({
        messageId: message.messageId,
        supervisorId: supervisor.supervisorId,
        supervisorName: supervisor.supervisorName,
        response: response,
      });
      
      setResponse('');
      onClose();
      alert('✅ Response sent successfully!');
    } catch (error) {
      console.error('Failed to send response:', error);
      alert('❌ Failed to send response');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Message Details</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.messageDetail}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailFrom}>From: {message.fromSupervisorName} ({message.fromSupervisorBadge})</Text>
              <Text style={styles.detailTime}>
                {new Date(message.createdAt).toLocaleString()}
              </Text>
            </View>
            
            {message.subject && (
              <Text style={styles.detailSubject}>{message.subject}</Text>
            )}
            
            <Text style={styles.detailContent}>{message.content}</Text>
            
            {message.responses.length > 0 && (
              <View style={styles.responsesSection}>
                <Text style={styles.responsesTitle}>Responses ({message.responses.length})</Text>
                {message.responses.map((resp, index) => (
                  <View key={resp.responseId} style={styles.responseItem}>
                    <Text style={styles.responseFrom}>{resp.supervisorName}</Text>
                    <Text style={styles.responseContent}>{resp.response}</Text>
                    <Text style={styles.responseTime}>
                      {new Date(resp.respondedAt).toLocaleString()}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            
            {message.requiresResponse && (
              <View style={styles.responseForm}>
                <Text style={styles.formLabel}>Your Response</Text>
                <TextInput
                  style={styles.responseInput}
                  multiline
                  numberOfLines={3}
                  placeholder="Enter your response..."
                  value={response}
                  onChangeText={setResponse}
                  maxLength={300}
                />
                
                <TouchableOpacity 
                  style={[styles.respondButton, (!response.trim() || sending) && styles.disabledButton]}
                  onPress={handleRespond}
                  disabled={!response.trim() || sending}
                >
                  <Text style={styles.respondButtonText}>
                    {sending ? '📤 Sending...' : '💬 Send Response'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

// Utility functions
const getPriorityColor = (priority) => {
  switch (priority) {
    case 'urgent': return '#e17055';
    case 'high': return '#fd79a8';
    case 'medium': return '#fdcb6e';
    case 'low': return '#55efc4';
    default: return '#b2bec3';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    }),
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  composeButton: {
    backgroundColor: '#0984e3',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  composeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#0984e3',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  tabLabel: {
    fontSize: 13,
    color: '#636e72',
  },
  activeTabLabel: {
    color: '#0984e3',
    fontWeight: '600',
  },
  countBadge: {
    backgroundColor: '#ff6b6b',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  countText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
  },
  messagesContent: {
    flex: 1,
    padding: 16,
  },
  broadcastContent: {
    flex: 1,
    padding: 16,
  },
  depotContent: {
    flex: 1,
    padding: 16,
  },
  statsContent: {
    flex: 1,
    padding: 16,
  },
  quickStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 12,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginTop: 16,
    marginBottom: 8,
  },
  messageCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#b2bec3',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      },
    }),
  },
  unreadCard: {
    borderLeftColor: '#0984e3',
    backgroundColor: '#f0f8ff',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageFrom: {
    flex: 1,
  },
  fromName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3436',
  },
  fromBadge: {
    fontSize: 12,
    color: '#636e72',
  },
  messageMetadata: {
    alignItems: 'flex-end',
  },
  priorityBadge: {
    fontSize: 10,
    color: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  messageTime: {
    fontSize: 11,
    color: '#b2bec3',
  },
  messageSubject: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 4,
  },
  messageContent: {
    fontSize: 13,
    color: '#636e72',
    lineHeight: 18,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
  },
  messageType: {
    fontSize: 11,
    color: '#636e72',
  },
  requiresResponse: {
    fontSize: 11,
    color: '#ff6b6b',
    fontWeight: 'bold',
  },
  responseCount: {
    fontSize: 11,
    color: '#0984e3',
  },
  channelCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      },
    }),
  },
  channelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  channelName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
  },
  channelCode: {
    fontSize: 12,
    color: '#636e72',
    backgroundColor: '#f1f3f4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  channelDescription: {
    fontSize: 13,
    color: '#636e72',
    marginBottom: 8,
  },
  channelFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  channelStats: {
    fontSize: 11,
    color: '#636e72',
  },
  lastMessage: {
    fontSize: 11,
    color: '#b2bec3',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    minWidth: 100,
    alignItems: 'center',
    flex: 1,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      },
    }),
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statTitle: {
    fontSize: 12,
    color: '#636e72',
    textAlign: 'center',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#636e72',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#b2bec3',
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  optionButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  activeOption: {
    backgroundColor: '#0984e3',
    borderColor: '#0984e3',
  },
  optionText: {
    fontSize: 13,
    color: '#636e72',
  },
  priorityButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  activePriority: {
    borderWidth: 2,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  messageInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: '#b2bec3',
    textAlign: 'right',
    marginTop: 4,
  },
  sendButton: {
    backgroundColor: '#0984e3',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#b2bec3',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  closeButton: {
    fontSize: 18,
    color: '#636e72',
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  messageDetail: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  detailHeader: {
    marginBottom: 12,
  },
  detailFrom: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 4,
  },
  detailTime: {
    fontSize: 12,
    color: '#636e72',
  },
  detailSubject: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 8,
  },
  detailContent: {
    fontSize: 14,
    color: '#2d3436',
    lineHeight: 20,
    marginBottom: 16,
  },
  responsesSection: {
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
    paddingTop: 16,
    marginBottom: 16,
  },
  responsesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 8,
  },
  responseItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    padding: 8,
    marginBottom: 6,
  },
  responseFrom: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0984e3',
    marginBottom: 2,
  },
  responseContent: {
    fontSize: 13,
    color: '#2d3436',
    marginBottom: 2,
  },
  responseTime: {
    fontSize: 11,
    color: '#b2bec3',
  },
  responseForm: {
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
    paddingTop: 16,
  },
  responseInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  respondButton: {
    backgroundColor: '#00b894',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
  },
  respondButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SupervisorCoordination;
