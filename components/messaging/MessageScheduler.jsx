// components/messaging/MessageScheduler.jsx
// Advanced message scheduler for Message Distribution Centre Phase 7
// Recurring schedules, conditional delivery, queue management

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

const MessageScheduler = ({ visible, onClose }) => {
  const { supervisor } = useSupervisor();
  const [loading, setLoading] = useState(false);
  const [scheduledMessages, setScheduledMessages] = useState([]);
  const [recurringRules, setRecurringRules] = useState([]);
  const [activeTab, setActiveTab] = useState('scheduled'); // scheduled, recurring, queue
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createMode, setCreateMode] = useState('schedule'); // schedule, recurring
  
  // Schedule form state
  const [scheduleForm, setScheduleForm] = useState({
    messageId: '',
    title: '',
    content: '',
    routes: [],
    scheduledFor: '',
    priority: 'normal',
    category: 'general',
    conditions: []
  });
  
  // Recurring form state
  const [recurringForm, setRecurringForm] = useState({
    name: '',
    template: '',
    frequency: 'daily', // daily, weekly, monthly, custom
    time: '09:00',
    days: [], // for weekly
    date: 1, // for monthly
    conditions: [],
    active: true,
    startDate: '',
    endDate: ''
  });

  // Load data when component opens
  useEffect(() => {
    if (visible) {
      loadScheduledMessages();
      loadRecurringRules();
    }
  }, [visible]);

  // Load scheduled messages
  const loadScheduledMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/messages/scheduled', {
        headers: {
          'Content-Type': 'application/json',
          'X-Supervisor-ID': supervisor?.badgeNumber || 'unknown'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setScheduledMessages(data.scheduledMessages || []);
      } else {
        setScheduledMessages([]);
      }
    } catch (error) {
      console.error('Failed to load scheduled messages:', error);
      setScheduledMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // Load recurring rules
  const loadRecurringRules = async () => {
    try {
      const response = await fetch('/api/messages/recurring-rules', {
        headers: {
          'Content-Type': 'application/json',
          'X-Supervisor-ID': supervisor?.badgeNumber || 'unknown'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setRecurringRules(data.recurringRules || []);
      } else {
        setRecurringRules([]);
      }
    } catch (error) {
      console.error('Failed to load recurring rules:', error);
      setRecurringRules([]);
    }
  };


  // Cancel scheduled message
  const cancelScheduledMessage = async (messageId) => {
    Alert.alert(
      'Cancel Scheduled Message',
      'Are you sure you want to cancel this scheduled message?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetch(`/api/messages/${messageId}/cancel`, {
                method: 'POST',
                headers: {
                  'X-Supervisor-ID': supervisor?.badgeNumber || 'unknown'
                }
              });
              
              // Remove from local state
              setScheduledMessages(prev => prev.filter(msg => msg.id !== messageId));
              Alert.alert('Success', 'Scheduled message cancelled successfully');
            } catch (error) {
              console.error('Cancel failed:', error);
              Alert.alert('Error', 'Failed to cancel scheduled message');
            }
          }
        }
      ]
    );
  };

  // Toggle recurring rule active status
  const toggleRecurringRule = async (ruleId, active) => {
    try {
      await fetch(`/api/messages/recurring-rules/${ruleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Supervisor-ID': supervisor?.badgeNumber || 'unknown'
        },
        body: JSON.stringify({ active })
      });
      
      // Update local state
      setRecurringRules(prev => prev.map(rule => 
        rule.id === ruleId ? { ...rule, active } : rule
      ));
    } catch (error) {
      console.error('Toggle failed:', error);
      Alert.alert('Error', 'Failed to update recurring rule');
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    const colors = {
      urgent: '#DC2626',
      normal: '#2563EB',
      low: '#6B7280'
    };
    return colors[priority] || colors.normal;
  };

  // Get frequency display text
  const getFrequencyText = (rule) => {
    switch (rule.frequency) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return `Weekly on ${rule.days.join(', ')}`;
      case 'monthly':
        return `Monthly on the ${rule.date}${getOrdinalSuffix(rule.date)}`;
      default:
        return rule.frequency;
    }
  };

  // Get ordinal suffix for dates
  const getOrdinalSuffix = (num) => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  };

  // Render tab navigation
  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {[
        { id: 'scheduled', label: 'Scheduled Messages', icon: 'time' },
        { id: 'recurring', label: 'Recurring Rules', icon: 'repeat' },
        { id: 'queue', label: 'Message Queue', icon: 'list' }
      ].map(tab => (
        <TouchableOpacity
          key={tab.id}
          style={[styles.tab, activeTab === tab.id && styles.activeTab]}
          onPress={() => setActiveTab(tab.id)}
        >
          <Ionicons 
            name={tab.icon} 
            size={20} 
            color={activeTab === tab.id ? '#2563EB' : '#6B7280'} 
          />
          <Text style={[
            styles.tabText,
            activeTab === tab.id && styles.activeTabText
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Render scheduled messages
  const renderScheduledMessages = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Scheduled Messages</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setCreateMode('schedule');
            setShowCreateModal(true);
          }}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Schedule Message</Text>
        </TouchableOpacity>
      </View>

      {scheduledMessages.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={48} color="#9CA3AF" />
          <Text style={styles.emptyStateText}>No scheduled messages</Text>
        </View>
      ) : (
        scheduledMessages.map(message => (
          <View key={message.id} style={styles.messageCard}>
            <View style={styles.messageHeader}>
              <Text style={styles.messageTitle}>{message.title}</Text>
              <View style={styles.messageActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => cancelScheduledMessage(message.id)}
                >
                  <Ionicons name="close" size={16} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </View>
            
            <Text style={styles.messageContent} numberOfLines={2}>
              {message.content}
            </Text>
            
            <View style={styles.messageInfo}>
              <View style={styles.infoRow}>
                <Ionicons name="time" size={16} color="#6B7280" />
                <Text style={styles.infoText}>
                  {new Date(message.scheduledFor).toLocaleString('en-GB')}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Ionicons name="bus" size={16} color="#6B7280" />
                <Text style={styles.infoText}>
                  Routes: {message.routes.join(', ')}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Ionicons name="flag" size={16} color={getPriorityColor(message.priority)} />
                <Text style={[styles.infoText, { color: getPriorityColor(message.priority) }]}>
                  {message.priority.toUpperCase()}
                </Text>
              </View>
            </View>

            {message.conditions.length > 0 && (
              <View style={styles.conditionsContainer}>
                <Text style={styles.conditionsTitle}>Conditions:</Text>
                {message.conditions.map((condition, index) => (
                  <Text key={index} style={styles.conditionText}>
                    • {condition.type} {condition.operator} {Array.isArray(condition.value) ? condition.value.join(', ') : condition.value}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ))
      )}
    </View>
  );

  // Render recurring rules
  const renderRecurringRules = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recurring Rules</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setCreateMode('recurring');
            setShowCreateModal(true);
          }}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Create Rule</Text>
        </TouchableOpacity>
      </View>

      {recurringRules.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="repeat-outline" size={48} color="#9CA3AF" />
          <Text style={styles.emptyStateText}>No recurring rules</Text>
        </View>
      ) : (
        recurringRules.map(rule => (
          <View key={rule.id} style={styles.ruleCard}>
            <View style={styles.ruleHeader}>
              <Text style={styles.ruleTitle}>{rule.name}</Text>
              <Switch
                value={rule.active}
                onValueChange={(active) => toggleRecurringRule(rule.id, active)}
                thumbColor={rule.active ? '#2563EB' : '#F3F4F6'}
                trackColor={{ false: '#D1D5DB', true: '#DBEAFE' }}
              />
            </View>
            
            <View style={styles.ruleInfo}>
              <View style={styles.infoRow}>
                <Ionicons name="repeat" size={16} color="#6B7280" />
                <Text style={styles.infoText}>
                  {getFrequencyText(rule)} at {rule.time}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Ionicons name="document-text" size={16} color="#6B7280" />
                <Text style={styles.infoText}>
                  Template: {rule.template}
                </Text>
              </View>
              
              {rule.nextExecution && (
                <View style={styles.infoRow}>
                  <Ionicons name="arrow-forward" size={16} color="#10B981" />
                  <Text style={styles.infoText}>
                    Next: {new Date(rule.nextExecution).toLocaleString('en-GB')}
                  </Text>
                </View>
              )}
              
              {rule.lastExecution && (
                <View style={styles.infoRow}>
                  <Ionicons name="checkmark" size={16} color="#6B7280" />
                  <Text style={styles.infoText}>
                    Last: {new Date(rule.lastExecution).toLocaleString('en-GB')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))
      )}
    </View>
  );

  // Render message queue
  const renderMessageQueue = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Message Queue</Text>
      <View style={styles.queueStats}>
        <View style={styles.queueStat}>
          <Text style={styles.queueStatNumber}>{scheduledMessages.length}</Text>
          <Text style={styles.queueStatLabel}>Scheduled</Text>
        </View>
        <View style={styles.queueStat}>
          <Text style={styles.queueStatNumber}>
            {recurringRules.filter(r => r.active).length}
          </Text>
          <Text style={styles.queueStatLabel}>Active Rules</Text>
        </View>
        <View style={styles.queueStat}>
          <Text style={styles.queueStatNumber}>0</Text>
          <Text style={styles.queueStatLabel}>Processing</Text>
        </View>
      </View>
      
      <Text style={styles.queueNote}>
        The message queue processes scheduled messages and recurring rules automatically. 
        Messages are checked every minute for execution conditions.
      </Text>
    </View>
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
            <Text style={styles.headerTitle}>Message Scheduler</Text>
            <Text style={styles.headerSubtitle}>
              Advanced scheduling and recurring message automation
            </Text>
          </View>
        </View>

        {renderTabs()}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Loading scheduler data...</Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'scheduled' && renderScheduledMessages()}
            {activeTab === 'recurring' && renderRecurringRules()}
            {activeTab === 'queue' && renderMessageQueue()}
          </ScrollView>
        )}

        {/* Create Modal - simplified for this implementation */}
        <Modal
          visible={showCreateModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCreateModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {createMode === 'schedule' ? 'Schedule Message' : 'Create Recurring Rule'}
                </Text>
                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalContent}>
                <Text style={styles.modalNote}>
                  Advanced scheduling features will be available in a future update. 
                  For now, use the main message composer to schedule individual messages.
                </Text>
              </View>
              
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowCreateModal(false)}
                >
                  <Text style={styles.modalButtonText}>Close</Text>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563EB',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#2563EB',
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
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
    textAlign: 'center',
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
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  messageActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  messageContent: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  messageInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4B5563',
  },
  conditionsContainer: {
    marginTop: 12,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  conditionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  conditionText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  ruleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ruleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  ruleInfo: {
    gap: 8,
  },
  queueStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  queueStat: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  queueStatNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2563EB',
  },
  queueStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  queueNote: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
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
  modalNote: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    textAlign: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
});

export default MessageScheduler;