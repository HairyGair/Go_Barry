// Go_BARRY/components/SupervisorControl.jsx
// Enhanced Supervisor Control Panel using shared WebSocket hook
// Real-time control of display screens with improved state management

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupervisorPolling, CONNECTION_STATES } from './hooks/useSupervisorPolling';
import MessageTemplates from './MessageTemplates';
import EnhancedTrafficCard from './EnhancedTrafficCard';

const isWeb = Platform.OS === 'web';

// Helper function for priority colors
const getPriorityColor = (priority) => {
  switch (priority?.toUpperCase()) {
    case 'CRITICAL': return '#DC2626';
    case 'HIGH': return '#EF4444';
    case 'MEDIUM': return '#F59E0B';
    case 'LOW': return '#10B981';
    case 'WARNING': return '#F59E0B';
    case 'INFO': return '#3B82F6';
    default: return '#6B7280';
  }
};

const SupervisorControl = ({ 
  supervisorId,
  supervisorName,
  sessionId,
  alerts = [],
  onClose,
  sector = 1 // Sector 1: Supervisor Control
}) => {
  // Debug polling authentication
  useEffect(() => {
    console.log('🚀 SupervisorControl Polling Auth:', {
      supervisorId,
      sessionId,
      supervisorName,
      hasSessionId: !!sessionId,
      sessionIdLength: sessionId?.length
    });
  }, [supervisorId, sessionId, supervisorName]);
  
  // Use the optimized polling hook
  const {
    connectionState,
    isConnected,
    lastError,
    connectionStats,
    acknowledgedAlerts,
    priorityOverrides,
    supervisorNotes,
    customMessages,
    dismissedFromDisplay,
    lockedOnDisplay,
    activeMode,
    connectedDisplays,
    acknowledgeAlert,
    updateAlertPriority,
    addNoteToAlert,
    broadcastMessage,
    setDisplayMode,
    updateAlerts,
    dismissFromDisplay,
    lockOnDisplay,
    unlockFromDisplay,
    clearError
  } = useSupervisorPolling({
    clientType: 'supervisor',
    supervisorId,
    sessionId,
    autoConnect: true,
    onConnectionChange: (connected) => {
      console.log(`🔌 Supervisor ${supervisorName} connection:`, connected ? 'Connected' : 'Disconnected');
    },
    onMessage: (message) => {
      console.log(`📨 Supervisor received message:`, message.type, message);
    },
    onError: (error) => {
      console.error('❌ Supervisor Polling error:', error);
      showNotification(`Connection error: ${error}`, 'error');
    }
  });

  // UI state
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showMessageTemplates, setShowMessageTemplates] = useState(false);
  const [showDisplayQueue, setShowDisplayQueue] = useState(false);
  const [broadcastMessageText, setBroadcastMessageText] = useState('');
  const [broadcastPriority, setBroadcastPriority] = useState('info');
  const [loading, setLoading] = useState(false);
  
  // Display queue state
  const [displayQueue, setDisplayQueue] = useState([]);

  // Sync alerts when they change
  useEffect(() => {
    if (isConnected && alerts.length > 0) {
      updateAlerts(alerts);
    }
  }, [alerts, isConnected, updateAlerts]);

  // Show notification helper
  const showNotification = useCallback((message, type = 'info') => {
    if (isWeb) {
      console.log(`[${type.toUpperCase()}] ${message}`);
      // Could integrate with toast library here
    } else {
      Alert.alert(
        type === 'error' ? 'Error' : 'Notification',
        message
      );
    }
  }, []);

  // Handle alert acknowledgment
  const handleAcknowledgeAlert = useCallback(async (alert) => {
    if (!alert) return;
    
    const reason = isWeb 
      ? prompt('Reason for acknowledging this alert:')
      : 'Acknowledged via mobile';
      
    if (!reason) return;
    
    const notes = isWeb ? prompt('Additional notes (optional):') : '';
    
    setLoading(true);
    const success = acknowledgeAlert(alert.id, reason, notes);
    setLoading(false);
    
    if (success) {
      showNotification('Alert acknowledged successfully', 'success');
    } else {
      showNotification('Failed to acknowledge alert', 'error');
    }
  }, [acknowledgeAlert, showNotification]);

  // Handle priority update
  const handleUpdatePriority = useCallback(async (alert, newPriority) => {
    if (!alert) return;
    
    const reason = isWeb
      ? prompt('Reason for changing priority:')
      : 'Priority updated via mobile';
      
    if (!reason) return;
    
    setLoading(true);
    const success = updateAlertPriority(alert.id, newPriority, reason);
    setLoading(false);
    
    if (success) {
      showNotification(`Priority updated to ${newPriority}`, 'success');
    } else {
      showNotification('Failed to update priority', 'error');
    }
  }, [updateAlertPriority, showNotification]);

  // Handle adding note
  const handleAddNote = useCallback(async (alert) => {
    if (!alert) return;
    
    const note = isWeb
      ? prompt('Add a note to this alert:')
      : 'Note added via mobile';
      
    if (!note) return;
    
    setLoading(true);
    const success = addNoteToAlert(alert.id, note);
    setLoading(false);
    
    if (success) {
      showNotification('Note added successfully', 'success');
    } else {
      showNotification('Failed to add note', 'error');
    }
  }, [addNoteToAlert, showNotification]);

  // Handle broadcast message
  const handleBroadcastMessage = useCallback(async () => {
    if (!broadcastMessageText.trim()) {
      showNotification('Please enter a message', 'error');
      return;
    }
    
    const duration = broadcastPriority === 'critical' ? 60000 : 30000;
    
    setLoading(true);
    const success = broadcastMessage(broadcastMessageText, broadcastPriority, duration);
    setLoading(false);
    
    if (success) {
      showNotification('Message broadcast to all displays', 'success');
      setBroadcastMessageText('');
      setShowBroadcastModal(false);
    } else {
      showNotification('Failed to broadcast message', 'error');
    }
  }, [broadcastMessage, broadcastMessageText, broadcastPriority, showNotification]);

  // Handle display control actions
  const handleDismissFromDisplay = useCallback(async (alert) => {
    if (!alert) return;
    
    const reason = isWeb 
      ? prompt('Reason for hiding this alert from display:')
      : 'Hidden from display via mobile';
      
    if (!reason) return;
    
    setLoading(true);
    const success = dismissFromDisplay(alert.id, reason);
    setLoading(false);
    
    if (success) {
      showNotification('Alert hidden from display', 'success');
    } else {
      showNotification('Failed to hide alert from display', 'error');
    }
  }, [dismissFromDisplay, showNotification]);

  const handleLockOnDisplay = useCallback(async (alert) => {
    if (!alert) return;
    
    const reason = isWeb 
      ? prompt('Reason for locking this alert on display:')
      : 'Locked on display via mobile';
      
    if (!reason) return;
    
    setLoading(true);
    const success = lockOnDisplay(alert.id, reason);
    setLoading(false);
    
    if (success) {
      showNotification('Alert locked on display', 'success');
    } else {
      showNotification('Failed to lock alert on display', 'error');
    }
  }, [lockOnDisplay, showNotification]);

  const handleUnlockFromDisplay = useCallback(async (alert) => {
    if (!alert) return;
    
    const reason = isWeb 
      ? prompt('Reason for unlocking this alert from display:')
      : 'Unlocked from display via mobile';
      
    if (!reason) return;
    
    setLoading(true);
    const success = unlockFromDisplay(alert.id, reason);
    setLoading(false);
    
    if (success) {
      showNotification('Alert unlocked from display', 'success');
    } else {
      showNotification('Failed to unlock alert from display', 'error');
    }
  }, [unlockFromDisplay, showNotification]);

  // Handle display mode change
  const handleModeChange = useCallback(async (newMode) => {
    const reason = isWeb
      ? prompt(`Reason for changing to ${newMode} mode:`)
      : `Mode changed to ${newMode}`;
      
    if (!reason) return;
    
    setLoading(true);
    const success = setDisplayMode(newMode, reason);
    setLoading(false);
    
    if (success) {
      showNotification(`Display mode changed to ${newMode}`, 'success');
    } else {
      showNotification('Failed to change display mode', 'error');
    }
  }, [setDisplayMode, showNotification]);

  // Connection status component
  const ConnectionStatus = () => {
    const getStatusColor = () => {
      switch (connectionState) {
        case CONNECTION_STATES.CONNECTED: return '#10B981';
        case CONNECTION_STATES.CONNECTING: return '#F59E0B';
        case CONNECTION_STATES.RECONNECTING: return '#F59E0B';
        case CONNECTION_STATES.ERROR: return '#EF4444';
        default: return '#6B7280';
      }
    };

    const getStatusText = () => {
      switch (connectionState) {
        case CONNECTION_STATES.CONNECTED: return `Connected • ${connectedDisplays} display${connectedDisplays !== 1 ? 's' : ''}`;
        case CONNECTION_STATES.CONNECTING: return 'Connecting...';
        case CONNECTION_STATES.RECONNECTING: return `Reconnecting... (${connectionStats.reconnectAttempts})`;
        case CONNECTION_STATES.ERROR: return 'Connection Error';
        default: return 'Disconnected';
      }
    };

    return (
      <View style={styles.connectionStatus}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
        <Text style={styles.connectionText}>{getStatusText()}</Text>
        {lastError && (
          <TouchableOpacity onPress={clearError} style={styles.errorButton}>
            <Text style={styles.errorText}>{lastError}</Text>
            <Ionicons name="close-circle" size={16} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Alert control panel
  const AlertControlPanel = ({ alert }) => {
    const isAcknowledged = acknowledgedAlerts.has(alert.id);
    const priority = priorityOverrides.get(alert.id);
    const note = supervisorNotes.get(alert.id);
    const isDismissedFromDisplay = dismissedFromDisplay.has(alert.id);
    const isLockedOnDisplay = lockedOnDisplay.has(alert.id);
    
    return (
      <View style={styles.alertPanel}>
        <Text style={styles.alertPanelTitle}>{alert.title}</Text>
        <Text style={styles.alertPanelLocation}>{alert.location}</Text>
        
        <View style={styles.alertActions}>
          {!isAcknowledged ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.acknowledgeButton]}
              onPress={() => handleAcknowledgeAlert(alert)}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Acknowledge</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.acknowledgedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
              <Text style={styles.acknowledgedText}>Acknowledged</Text>
            </View>
          )}
          
          <TouchableOpacity
            style={[styles.actionButton, styles.noteButton]}
            onPress={() => handleAddNote(alert)}
          >
            <Ionicons name="create" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Add Note</Text>
          </TouchableOpacity>
        </View>
        
        {/* Display Control Actions */}
        <View style={styles.displayControlActions}>
          <Text style={styles.displayControlLabel}>Display Control:</Text>
          
          <View style={styles.displayControlButtons}>
            {!isDismissedFromDisplay ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.dismissButton]}
                onPress={() => handleDismissFromDisplay(alert)}
              >
                <Ionicons name="eye-off" size={18} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Hide from Display</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.statusBadge}>
                <Ionicons name="eye-off" size={14} color="#6B7280" />
                <Text style={styles.statusBadgeText}>Hidden from Display</Text>
              </View>
            )}
            
            {!isLockedOnDisplay ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.lockButton]}
                onPress={() => handleLockOnDisplay(alert)}
              >
                <Ionicons name="lock-closed" size={18} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Lock on Display</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, styles.unlockButton]}
                onPress={() => handleUnlockFromDisplay(alert)}
              >
                <Ionicons name="lock-open" size={18} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Unlock Display</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        <View style={styles.priorityControls}>
          <Text style={styles.priorityLabel}>Priority Override:</Text>
          <View style={styles.priorityButtons}>
            {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(level => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.priorityButton,
                  priority?.priority === level && styles.priorityButtonActive,
                  { backgroundColor: getPriorityColor(level) }
                ]}
                onPress={() => handleUpdatePriority(alert, level)}
              >
                <Text style={styles.priorityButtonText}>{level}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {note && (
          <View style={styles.noteDisplay}>
            <Ionicons name="document-text" size={16} color="#6B7280" />
            <Text style={styles.noteText}>{note.note}</Text>
          </View>
        )}
      </View>
    );
  };

  // Broadcast modal
  const BroadcastModal = () => (
    <Modal
      visible={showBroadcastModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowBroadcastModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Broadcast Message</Text>
            <TouchableOpacity onPress={() => setShowBroadcastModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={styles.broadcastInput}
            placeholder="Enter message to broadcast to all displays..."
            value={broadcastMessageText}
            onChangeText={setBroadcastMessageText}
            multiline
            numberOfLines={3}
            placeholderTextColor="#9CA3AF"
          />
          
          <View style={styles.prioritySelector}>
            <Text style={styles.priorityLabel}>Message Priority:</Text>
            <View style={styles.priorityOptions}>
              {['info', 'warning', 'critical'].map(priority => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.priorityOption,
                    broadcastPriority === priority && styles.priorityOptionActive
                  ]}
                  onPress={() => setBroadcastPriority(priority)}
                >
                  <Text style={[
                    styles.priorityOptionText,
                    broadcastPriority === priority && styles.priorityOptionTextActive
                  ]}>
                    {priority.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.broadcastButton, { backgroundColor: getPriorityColor(broadcastPriority.toUpperCase()) }]}
            onPress={handleBroadcastMessage}
          >
            <Ionicons name="megaphone" size={20} color="#FFFFFF" />
            <Text style={styles.broadcastButtonText}>Broadcast Message</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Loading screen
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Connecting to control system...</Text>
      </View>
    );
  }

  // Main render
  // Display Queue Modal
  const DisplayQueueModal = () => (
      <Modal
        visible={showDisplayQueue}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDisplayQueue(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.displayQueueModal]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Current Display Queue</Text>
              <TouchableOpacity onPress={() => setShowDisplayQueue(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.queueList}>
              <View style={styles.queueStats}>
                <View style={styles.queueStat}>
                  <Text style={styles.queueStatValue}>{connectedDisplays}</Text>
                  <Text style={styles.queueStatLabel}>Connected Displays</Text>
                </View>
                <View style={styles.queueStat}>
                  <Text style={styles.queueStatValue}>{alerts.filter(a => !dismissedFromDisplay.has(a.id)).length}</Text>
                  <Text style={styles.queueStatLabel}>Visible Alerts</Text>
                </View>
                <View style={styles.queueStat}>
                  <Text style={styles.queueStatValue}>{lockedOnDisplay.size}</Text>
                  <Text style={styles.queueStatLabel}>Locked Items</Text>
                </View>
              </View>
              
              <Text style={styles.queueSectionTitle}>Priority Queue Order:</Text>
              
              {alerts
                .filter(alert => !dismissedFromDisplay.has(alert.id))
                .sort((a, b) => {
                  const priorityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
                  const aPriority = priorityOverrides.get(a.id)?.priority || a.priority || 'LOW';
                  const bPriority = priorityOverrides.get(b.id)?.priority || b.priority || 'LOW';
                  return priorityOrder[bPriority] - priorityOrder[aPriority];
                })
                .map((alert, index) => {
                  const priority = priorityOverrides.get(alert.id)?.priority || alert.priority || 'LOW';
                  const isLocked = lockedOnDisplay.has(alert.id);
                  
                  return (
                    <View key={alert.id} style={styles.queueItem}>
                      <View style={styles.queueItemHeader}>
                        <Text style={styles.queuePosition}>#{index + 1}</Text>
                        <View style={[styles.queuePriority, { backgroundColor: getPriorityColor(priority) }]}>
                          <Text style={styles.queuePriorityText}>{priority}</Text>
                        </View>
                        {isLocked && (
                          <View style={styles.queueLocked}>
                            <Ionicons name="lock-closed" size={12} color="#F59E0B" />
                            <Text style={styles.queueLockedText}>LOCKED</Text>
                          </View>
                        )}
                      </View>
                      
                      <Text style={styles.queueItemTitle}>{alert.title}</Text>
                      <Text style={styles.queueItemLocation}>{alert.location}</Text>
                      
                      <View style={styles.queueItemActions}>
                        <TouchableOpacity
                          style={styles.queueActionButton}
                          onPress={() => {
                            setShowDisplayQueue(false);
                            setSelectedAlert(alert);
                          }}
                        >
                          <Text style={styles.queueActionText}>Control</Text>
                        </TouchableOpacity>
                        
                        {!isLocked ? (
                          <TouchableOpacity
                            style={[styles.queueActionButton, styles.lockAction]}
                            onPress={() => handleLockOnDisplay(alert)}
                          >
                            <Ionicons name="lock-closed" size={14} color="#FFFFFF" />
                            <Text style={styles.queueActionText}>Lock</Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={[styles.queueActionButton, styles.unlockAction]}
                            onPress={() => handleUnlockFromDisplay(alert)}
                          >
                            <Ionicons name="lock-open" size={14} color="#FFFFFF" />
                            <Text style={styles.queueActionText}>Unlock</Text>
                          </TouchableOpacity>
                        )}
                        
                        <TouchableOpacity
                          style={[styles.queueActionButton, styles.hideAction]}
                          onPress={() => handleDismissFromDisplay(alert)}
                        >
                          <Ionicons name="eye-off" size={14} color="#FFFFFF" />
                          <Text style={styles.queueActionText}>Hide</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              }
              
              {customMessages.length > 0 && (
                <>
                  <Text style={styles.queueSectionTitle}>Custom Messages:</Text>
                  {customMessages.map((message, index) => (
                    <View key={`msg-${index}`} style={[styles.queueItem, styles.messageItem]}>
                      <View style={styles.queueItemHeader}>
                        <View style={[styles.queuePriority, { backgroundColor: getPriorityColor(message.priority?.toUpperCase() || 'INFO') }]}>
                          <Text style={styles.queuePriorityText}>{message.priority?.toUpperCase() || 'INFO'}</Text>
                        </View>
                        <Text style={styles.messageTimestamp}>
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </Text>
                      </View>
                      <Text style={styles.messageText}>{message.message}</Text>
                    </View>
                  ))}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );

    return (
      <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Sector 1: Supervisor Control</Text>
          <Text style={styles.subtitle}>
            {supervisorName} ({supervisorId})
          </Text>
        </View>
        
        <View style={styles.headerRight}>
          <ConnectionStatus />
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.controlBar}>
        <View style={styles.controlButtonGroup}>
          <TouchableOpacity
            style={[styles.controlButton, styles.broadcastControlButton]}
            onPress={() => setShowBroadcastModal(true)}
          >
            <Ionicons name="megaphone" size={20} color="#FFFFFF" />
            <Text style={styles.controlButtonText}>Broadcast Message</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, styles.queueControlButton]}
            onPress={() => setShowDisplayQueue(true)}
          >
            <Ionicons name="list" size={20} color="#FFFFFF" />
            <Text style={styles.controlButtonText}>Display Queue</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.modeSelector}>
          <Text style={styles.modeSelectorLabel}>Display Mode:</Text>
          {['normal', 'emergency', 'maintenance'].map(mode => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.modeButton,
                activeMode === mode && styles.modeButtonActive
              ]}
              onPress={() => handleModeChange(mode)}
            >
              <Text style={[
                styles.modeButtonText,
                activeMode === mode && styles.modeButtonTextActive
              ]}>
                {mode.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{acknowledgedAlerts.size}</Text>
          <Text style={styles.statLabel}>Acknowledged</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{priorityOverrides.size}</Text>
          <Text style={styles.statLabel}>Overrides</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{supervisorNotes.size}</Text>
          <Text style={styles.statLabel}>Notes</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{dismissedFromDisplay.size}</Text>
          <Text style={styles.statLabel}>Hidden</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{lockedOnDisplay.size}</Text>
          <Text style={styles.statLabel}>Locked</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{customMessages.length}</Text>
          <Text style={styles.statLabel}>Messages</Text>
        </View>
      </View>

      <ScrollView style={styles.alertsList} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Active Alerts ({alerts.length})</Text>
        
        {alerts.length > 0 ? (
          alerts.map((alert) => (
            <View key={alert.id} style={styles.alertWrapper}>
              <EnhancedTrafficCard
                alert={alert}
                supervisorSession={{
                  supervisor: {
                    name: supervisorName,
                    badge: supervisorId,
                    role: 'Supervisor'
                  },
                  sessionId: sessionId
                }}
                onDismiss={(alertId, reason, notes) => {
                  console.log(`🗑️ Dismissing alert ${alertId}: ${reason}`);
                  handleAcknowledgeAlert(alert);
                }}
                onAcknowledge={(alertId) => {
                  console.log(`✅ Acknowledging alert ${alertId}`);
                  handleAcknowledgeAlert(alert);
                }}
                style={{ marginHorizontal: 0 }}
              />
              
              {selectedAlert?.id === alert.id && (
                <View style={styles.alertExtendedActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.templateButton]}
                    onPress={() => {
                      setSelectedAlert(alert);
                      setShowMessageTemplates(true);
                    }}
                  >
                    <Ionicons name="chatbubbles" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Quick Message</Text>
                  </TouchableOpacity>
                  
                  <AlertControlPanel alert={alert} />
                </View>
              )}
              
              <TouchableOpacity
                style={styles.expandControls}
                onPress={() => setSelectedAlert(alert.id === selectedAlert?.id ? null : alert)}
              >
                <Text style={styles.expandControlsText}>
                  {selectedAlert?.id === alert.id ? 'Hide Supervisor Controls' : 'Show Supervisor Controls'}
                </Text>
                <Ionicons 
                  name={selectedAlert?.id === alert.id ? 'chevron-up' : 'chevron-down'} 
                  size={16} 
                  color="#3B82F6" 
                />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.noAlertsContainer}>
            <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            <Text style={styles.noAlertsText}>No active alerts</Text>
          </View>
        )}
      </ScrollView>
      
      {/* Message Templates Modal */}
      <Modal
        visible={showMessageTemplates}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowMessageTemplates(false)}
      >
        <MessageTemplates
          supervisorId={supervisorId}
          sessionId={sessionId}
          selectedAlert={selectedAlert}
          onMessageSent={() => {
            setShowMessageTemplates(false);
            setSelectedAlert(null);
            showNotification('Message sent successfully', 'success');
          }}
          onClose={() => {
            setShowMessageTemplates(false);
            setSelectedAlert(null);
          }}
        />
      </Modal>
      
      <BroadcastModal />
      <DisplayQueueModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...Platform.select({
      web: { paddingTop: 16 },
      default: { paddingTop: 40 }
    }),
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  closeButton: {
    padding: 8,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectionText: {
    fontSize: 12,
    color: '#6B7280',
  },
  errorButton: {
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
  },
  controlBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexWrap: 'wrap',
    gap: 12,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  broadcastControlButton: {
    backgroundColor: '#7C3AED',
  },
  templatesButton: {
    backgroundColor: '#059669',
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modeSelectorLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  modeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  modeButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  modeButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  alertsList: {
    flex: 1,
    padding: 16,
  },
  alertWrapper: {
    marginBottom: 8,
  },
  expandControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    borderRadius: 8,
    marginTop: -8,
    marginHorizontal: 16,
    gap: 6,
  },
  expandControlsText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  alertCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  alertCardInfo: {
    flex: 1,
    marginRight: 12,
  },
  alertCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  alertCardLocation: {
    fontSize: 14,
    color: '#6B7280',
  },
  alertCardStatus: {
    flexDirection: 'row',
    gap: 8,
  },
  acknowledgedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  acknowledgedText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  alertPanel: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  alertPanelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  alertPanelLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  alertActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  displayControlActions: {
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  displayControlLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    fontWeight: '600',
  },
  displayControlButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusBadgeText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  acknowledgeButton: {
    backgroundColor: '#10B981',
  },
  noteButton: {
    backgroundColor: '#6B7280',
  },
  templateButton: {
    backgroundColor: '#059669',
  },
  dismissButton: {
    backgroundColor: '#EF4444',
  },
  lockButton: {
    backgroundColor: '#F59E0B',
  },
  unlockButton: {
    backgroundColor: '#3B82F6',
  },
  alertExtendedActions: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  priorityControls: {
    marginBottom: 16,
  },
  priorityLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    opacity: 0.7,
  },
  priorityButtonActive: {
    opacity: 1,
  },
  priorityButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  noteDisplay: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 6,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
  },
  noAlertsContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  noAlertsText: {
    fontSize: 16,
    color: '#10B981',
    marginTop: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  broadcastInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  prioritySelector: {
    marginBottom: 20,
  },
  priorityOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  priorityOptionActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  priorityOptionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  priorityOptionTextActive: {
    color: '#FFFFFF',
  },
  broadcastButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  broadcastButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Display Queue Modal Styles
  displayQueueModal: {
    maxWidth: 600,
    maxHeight: '80%',
  },
  queueList: {
    flex: 1,
    maxHeight: 400,
  },
  queueStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  queueStat: {
    alignItems: 'center',
  },
  queueStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  queueStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  queueSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    marginTop: 16,
  },
  queueItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  queueItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  queuePosition: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 32,
    textAlign: 'center',
  },
  queuePriority: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  queuePriorityText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  queueLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  queueLockedText: {
    fontSize: 10,
    color: '#F59E0B',
    fontWeight: 'bold',
  },
  queueItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  queueItemLocation: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  queueItemActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  queueActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#6B7280',
  },
  lockAction: {
    backgroundColor: '#F59E0B',
  },
  unlockAction: {
    backgroundColor: '#3B82F6',
  },
  hideAction: {
    backgroundColor: '#EF4444',
  },
  queueActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  messageItem: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0EA5E9',
  },
  messageTimestamp: {
    fontSize: 10,
    color: '#6B7280',
    marginLeft: 'auto',
  },
  messageText: {
    fontSize: 14,
    color: '#1F2937',
    fontStyle: 'italic',
  },
  // Control Button Group
  controlButtonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  queueControlButton: {
    backgroundColor: '#059669',
  },
});

export default SupervisorControl;