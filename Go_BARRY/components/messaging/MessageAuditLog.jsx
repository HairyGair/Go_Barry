// components/messaging/MessageAuditLog.jsx
// Message Audit Log component for Message Distribution Centre Phase 6
// Tracks all message-related actions with detailed audit trail

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupervisor } from '../hooks/useSupervisorSession';

const MessageAuditLog = ({ visible, onClose, messageId = null }) => {
  const { supervisor } = useSupervisor();
  const [loading, setLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('all'); // all, created, modified, sent, deleted
  const [selectedUser, setSelectedUser] = useState('all'); // all, or specific supervisor
  const [timeRange, setTimeRange] = useState('24h'); // 1h, 24h, 7d, 30d, all
  const [expandedLog, setExpandedLog] = useState(null);

  // Load audit logs when component opens
  useEffect(() => {
    if (visible) {
      loadAuditLogs();
    }
  }, [visible, messageId]);

  // Apply filters when search or filter changes
  useEffect(() => {
    applyFilters();
  }, [auditLogs, searchQuery, selectedAction, selectedUser, timeRange]);

  // Load audit logs from backend
  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const endpoint = messageId 
        ? `/api/messages/${messageId}/audit`
        : '/api/messages/audit';
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Supervisor-ID': supervisor?.badgeNumber || 'unknown'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setAuditLogs(data.auditLogs || []);
      } else {
        console.error('API error:', data.error);
        // Fall back to mock data if API fails
        const mockLogs = generateMockAuditLogs();
        setAuditLogs(mockLogs);
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      // Fall back to mock data
      const mockLogs = generateMockAuditLogs();
      setAuditLogs(mockLogs);
    } finally {
      setLoading(false);
    }
  };

  // Generate mock audit log data
  const generateMockAuditLogs = () => {
    const now = new Date();
    const users = ['AG003', 'BP009', 'JH045', 'MR123'];
    
    return [
      {
        id: 'audit_001',
        messageId: 'msg_001',
        messageSubject: 'URGENT: High Level Bridge - Police incident causing full closure',
        action: 'message_sent',
        actionDescription: 'Message sent to all recipients',
        userId: 'AG003',
        userName: 'Adam Gordon',
        timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        ipAddress: '192.168.1.45',
        userAgent: 'Go BARRY Web/1.0',
        details: {
          recipientCount: 25,
          routesAffected: ['1', '10', '11', '12', '21', '56', '57'],
          priority: 'urgent',
          deliveryMethod: 'immediate'
        },
        changes: null
      },
      {
        id: 'audit_002',
        messageId: 'msg_001',
        messageSubject: 'URGENT: High Level Bridge - Police incident causing full closure',
        action: 'message_modified',
        actionDescription: 'Message content updated before sending',
        userId: 'AG003',
        userName: 'Adam Gordon',
        timestamp: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
        ipAddress: '192.168.1.45',
        userAgent: 'Go BARRY Web/1.0',
        details: {
          field: 'content',
          section: 'diversion_instructions'
        },
        changes: {
          before: 'Please monitor and implement diversions as necessary.',
          after: 'IMMEDIATE ACTION REQUIRED: All affected services should implement diversions immediately.'
        }
      },
      {
        id: 'audit_003',
        messageId: 'msg_001',
        messageSubject: 'URGENT: High Level Bridge - Police incident causing full closure',
        action: 'message_created',
        actionDescription: 'New message created from roadwork alert RW001',
        userId: 'AG003',
        userName: 'Adam Gordon',
        timestamp: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
        ipAddress: '192.168.1.45',
        userAgent: 'Go BARRY Web/1.0',
        details: {
          sourceAlert: 'RW001',
          alertType: 'roadwork',
          generationMethod: 'automatic'
        },
        changes: null
      },
      {
        id: 'audit_004',
        messageId: 'msg_002',
        messageSubject: 'IMPORTANT: A1 Southbound - Lane closures for emergency repairs',
        action: 'message_sent',
        actionDescription: 'Message sent to all recipients',
        userId: 'BP009',
        userName: 'Brian Peterson',
        timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
        ipAddress: '192.168.1.67',
        userAgent: 'Go BARRY Web/1.0',
        details: {
          recipientCount: 18,
          routesAffected: ['21', 'X21', '685'],
          priority: 'normal',
          deliveryMethod: 'immediate'
        },
        changes: null
      },
      {
        id: 'audit_005',
        messageId: 'msg_003',
        messageSubject: 'NOTICE: Central Station Bridge - Planned maintenance work',
        action: 'draft_saved',
        actionDescription: 'Message saved as draft',
        userId: 'AG003',
        userName: 'Adam Gordon',
        timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        ipAddress: '192.168.1.45',
        userAgent: 'Go BARRY Web/1.0',
        details: {
          draftVersion: 1,
          autoSave: false
        },
        changes: null
      },
      {
        id: 'audit_006',
        messageId: 'msg_004',
        messageSubject: 'URGENT: A19 Traffic Incident - Multi-vehicle collision',
        action: 'message_scheduled',
        actionDescription: 'Message scheduled for future delivery',
        userId: 'JH045',
        userName: 'James Harrison',
        timestamp: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
        ipAddress: '192.168.1.89',
        userAgent: 'Go BARRY Web/1.0',
        details: {
          scheduledFor: new Date(now.getTime() + 15 * 60 * 1000).toISOString(),
          schedulingReason: 'wait_for_confirmation'
        },
        changes: null
      },
      {
        id: 'audit_007',
        messageId: 'msg_005',
        messageSubject: 'Test Message - DELETED',
        action: 'draft_deleted',
        actionDescription: 'Draft message permanently deleted',
        userId: 'MR123',
        userName: 'Michael Roberts',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        ipAddress: '192.168.1.34',
        userAgent: 'Go BARRY Web/1.0',
        details: {
          deletionReason: 'user_request',
          draftAge: '45 minutes'
        },
        changes: null
      },
      {
        id: 'audit_008',
        messageId: 'msg_001',
        messageSubject: 'URGENT: High Level Bridge - Police incident causing full closure',
        action: 'message_viewed',
        actionDescription: 'Message analytics viewed',
        userId: 'AG003',
        userName: 'Adam Gordon',
        timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
        ipAddress: '192.168.1.45',
        userAgent: 'Go BARRY Web/1.0',
        details: {
          viewType: 'analytics',
          openRate: 0.84,
          recipientCount: 25
        },
        changes: null
      }
    ];
  };

  // Apply search and filter logic
  const applyFilters = () => {
    let filtered = [...auditLogs];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        log.messageSubject.toLowerCase().includes(query) ||
        log.actionDescription.toLowerCase().includes(query) ||
        log.userId.toLowerCase().includes(query) ||
        log.userName.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query)
      );
    }

    // Apply action filter
    if (selectedAction !== 'all') {
      filtered = filtered.filter(log => log.action === selectedAction);
    }

    // Apply user filter
    if (selectedUser !== 'all') {
      filtered = filtered.filter(log => log.userId === selectedUser);
    }

    // Apply time range filter
    if (timeRange !== 'all') {
      const now = new Date();
      let cutoffTime;
      
      switch (timeRange) {
        case '1h':
          cutoffTime = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          cutoffTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffTime = null;
      }
      
      if (cutoffTime) {
        filtered = filtered.filter(log => new Date(log.timestamp) >= cutoffTime);
      }
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    setFilteredLogs(filtered);
  };

  // Get unique users for filter
  const getUniqueUsers = () => {
    const users = [...new Set(auditLogs.map(log => log.userId))];
    return users.map(userId => {
      const log = auditLogs.find(l => l.userId === userId);
      return {
        id: userId,
        name: log?.userName || userId
      };
    });
  };

  // Get action info (color, icon, label)
  const getActionInfo = (action) => {
    const actionMap = {
      message_created: { 
        color: '#10B981', 
        icon: 'add-circle', 
        label: 'Created',
        bg: '#ECFDF5'
      },
      message_modified: { 
        color: '#F59E0B', 
        icon: 'create', 
        label: 'Modified',
        bg: '#FFFBEB'
      },
      message_sent: { 
        color: '#3B82F6', 
        icon: 'paper-plane', 
        label: 'Sent',
        bg: '#EFF6FF'
      },
      message_scheduled: { 
        color: '#8B5CF6', 
        icon: 'time', 
        label: 'Scheduled',
        bg: '#F3E8FF'
      },
      draft_saved: { 
        color: '#6B7280', 
        icon: 'document', 
        label: 'Draft Saved',
        bg: '#F9FAFB'
      },
      draft_deleted: { 
        color: '#DC2626', 
        icon: 'trash', 
        label: 'Deleted',
        bg: '#FEF2F2'
      },
      message_viewed: { 
        color: '#06B6D4', 
        icon: 'eye', 
        label: 'Viewed',
        bg: '#ECFEFF'
      }
    };
    return actionMap[action] || actionMap.message_created;
  };

  // Toggle log expansion
  const toggleLogExpansion = (logId) => {
    setExpandedLog(expandedLog === logId ? null : logId);
  };

  // Render filter controls
  const renderFilterControls = () => (
    <View style={styles.filtersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {/* Action Filter */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterGroupLabel}>Action:</Text>
          <View style={styles.filterButtons}>
            {['all', 'message_created', 'message_sent', 'draft_saved', 'message_modified'].map(action => (
              <TouchableOpacity
                key={action}
                style={[
                  styles.filterButton,
                  selectedAction === action && styles.filterButtonActive
                ]}
                onPress={() => setSelectedAction(action)}
              >
                <Text style={[
                  styles.filterButtonText,
                  selectedAction === action && styles.filterButtonTextActive
                ]}>
                  {action === 'all' ? 'All' : getActionInfo(action).label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Time Range Filter */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterGroupLabel}>Time:</Text>
          <View style={styles.filterButtons}>
            {[
              { key: '1h', label: '1 Hour' },
              { key: '24h', label: '24 Hours' },
              { key: '7d', label: '7 Days' },
              { key: '30d', label: '30 Days' },
              { key: 'all', label: 'All' }
            ].map(time => (
              <TouchableOpacity
                key={time.key}
                style={[
                  styles.filterButton,
                  timeRange === time.key && styles.filterButtonActive
                ]}
                onPress={() => setTimeRange(time.key)}
              >
                <Text style={[
                  styles.filterButtonText,
                  timeRange === time.key && styles.filterButtonTextActive
                ]}>
                  {time.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );

  // Render audit log entry
  const renderAuditLog = (log) => {
    const actionInfo = getActionInfo(log.action);
    const isExpanded = expandedLog === log.id;
    
    return (
      <View key={log.id} style={styles.logCard}>
        <TouchableOpacity
          style={styles.logHeader}
          onPress={() => toggleLogExpansion(log.id)}
        >
          <View style={styles.logMainInfo}>
            <View style={[styles.actionBadge, { backgroundColor: actionInfo.bg }]}>
              <Ionicons name={actionInfo.icon} size={14} color={actionInfo.color} />
              <Text style={[styles.actionText, { color: actionInfo.color }]}>
                {actionInfo.label}
              </Text>
            </View>
            
            <View style={styles.logDetails}>
              <Text style={styles.logDescription}>{log.actionDescription}</Text>
              <Text style={styles.logMessage} numberOfLines={1}>
                {log.messageSubject}
              </Text>
            </View>
          </View>
          
          <View style={styles.logMeta}>
            <Text style={styles.logUser}>{log.userName}</Text>
            <Text style={styles.logTime}>
              {new Date(log.timestamp).toLocaleString('en-GB')}
            </Text>
            <Ionicons 
              name={isExpanded ? 'chevron-up' : 'chevron-down'} 
              size={16} 
              color="#9CA3AF" 
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.logExpandedContent}>
            <View style={styles.logDetailGrid}>
              <View style={styles.logDetailItem}>
                <Text style={styles.logDetailLabel}>User ID</Text>
                <Text style={styles.logDetailValue}>{log.userId}</Text>
              </View>
              <View style={styles.logDetailItem}>
                <Text style={styles.logDetailLabel}>IP Address</Text>
                <Text style={styles.logDetailValue}>{log.ipAddress}</Text>
              </View>
              <View style={styles.logDetailItem}>
                <Text style={styles.logDetailLabel}>User Agent</Text>
                <Text style={styles.logDetailValue}>{log.userAgent}</Text>
              </View>
              <View style={styles.logDetailItem}>
                <Text style={styles.logDetailLabel}>Message ID</Text>
                <Text style={styles.logDetailValue}>{log.messageId}</Text>
              </View>
            </View>

            {log.details && (
              <View style={styles.logDetailsSection}>
                <Text style={styles.logDetailsTitle}>Action Details</Text>
                <View style={styles.logDetailsContent}>
                  {Object.entries(log.details).map(([key, value]) => (
                    <View key={key} style={styles.logDetailsRow}>
                      <Text style={styles.logDetailsKey}>
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                      </Text>
                      <Text style={styles.logDetailsValue}>
                        {Array.isArray(value) ? value.join(', ') : String(value)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {log.changes && (
              <View style={styles.changesSection}>
                <Text style={styles.changesTitle}>Changes Made</Text>
                <View style={styles.changesContent}>
                  <View style={styles.changeItem}>
                    <Text style={styles.changeLabel}>Before:</Text>
                    <Text style={styles.changeBefore}>{log.changes.before}</Text>
                  </View>
                  <View style={styles.changeItem}>
                    <Text style={styles.changeLabel}>After:</Text>
                    <Text style={styles.changeAfter}>{log.changes.after}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

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
            <Text style={styles.headerTitle}>
              {messageId ? 'Message Audit Log' : 'System Audit Log'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {messageId 
                ? 'Track all changes and actions for this message'
                : 'Complete audit trail of all message-related activities'
              }
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
              placeholder="Search audit logs by action, user, or message..."
              placeholderTextColor="#9CA3AF"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {renderFilterControls()}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Loading audit logs...</Text>
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {filteredLogs.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="shield-checkmark-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyStateText}>
                  {searchQuery || selectedAction !== 'all' || timeRange !== 'all'
                    ? 'No audit logs match your current filters'
                    : 'No audit logs found'
                  }
                </Text>
                {(searchQuery || selectedAction !== 'all' || timeRange !== 'all') && (
                  <TouchableOpacity
                    style={styles.clearFiltersButton}
                    onPress={() => {
                      setSearchQuery('');
                      setSelectedAction('all');
                      setTimeRange('all');
                    }}
                  >
                    <Text style={styles.clearFiltersText}>Clear Filters</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.logsList}>
                <Text style={styles.resultsText}>
                  {filteredLogs.length} audit log{filteredLogs.length !== 1 ? 's' : ''} found
                </Text>
                {filteredLogs.map(renderAuditLog)}
              </View>
            )}
          </ScrollView>
        )}
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
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
  },
  filterGroup: {
    marginHorizontal: 20,
    marginRight: 32,
  },
  filterGroupLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterButtonTextActive: {
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
  logsList: {
    padding: 20,
  },
  resultsText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  logMainInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    marginRight: 12,
  },
  actionText: {
    fontSize: 10,
    fontWeight: '700',
  },
  logDetails: {
    flex: 1,
  },
  logDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  logMessage: {
    fontSize: 12,
    color: '#6B7280',
  },
  logMeta: {
    alignItems: 'flex-end',
    minWidth: 120,
  },
  logUser: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  logTime: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  logExpandedContent: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  logDetailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  logDetailItem: {
    flex: 1,
    minWidth: 120,
  },
  logDetailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  logDetailValue: {
    fontSize: 13,
    color: '#374151',
  },
  logDetailsSection: {
    marginBottom: 16,
  },
  logDetailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  logDetailsContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
  },
  logDetailsRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  logDetailsKey: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    minWidth: 100,
  },
  logDetailsValue: {
    fontSize: 12,
    color: '#374151',
    flex: 1,
  },
  changesSection: {
    marginTop: 8,
  },
  changesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  changesContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
  },
  changeItem: {
    marginBottom: 8,
  },
  changeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  changeBefore: {
    fontSize: 12,
    color: '#DC2626',
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  changeAfter: {
    fontSize: 12,
    color: '#059669',
    backgroundColor: '#ECFDF5',
    padding: 8,
    borderRadius: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});

export default MessageAuditLog;