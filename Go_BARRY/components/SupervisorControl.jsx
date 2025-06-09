// Go_BARRY/components/SupervisorControl.jsx
// Supervisor Control Panel for managing display screens in real-time

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Switch,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_CONFIG } from '../config/api';

const isWeb = Platform.OS === 'web';

const SupervisorControl = ({ 
  supervisorId,
  supervisorName,
  sessionId,
  alerts = [],
  onClose
}) => {
  // WebSocket connection
  const ws = useRef(null);
  const reconnectTimeout = useRef(null);
  const reconnectAttempts = useRef(0);
  
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [connectedDisplays, setConnectedDisplays] = useState(0);
  const [syncStatus, setSyncStatus] = useState({
    acknowledgedAlerts: 0,
    priorityOverrides: 0,
    supervisorNotes: 0,
    customMessages: 0,
    activeMode: 'normal'
  });
  
  // UI state
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastPriority, setBroadcastPriority] = useState('info');
  const [displayMode, setDisplayMode] = useState('normal');
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(null);
  
  // Alert management state
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState(new Set());
  const [alertPriorities, setAlertPriorities] = useState(new Map());
  const [alertNotes, setAlertNotes] = useState(new Map());
  
  // WebSocket URL
  const getWebSocketUrl = () => {
    const baseUrl = API_CONFIG.baseURL.replace('http://', '').replace('https://', '');
    const protocol = API_CONFIG.baseURL.startsWith('https') ? 'wss' : 'ws';
    return `${protocol}://${baseUrl}/ws/supervisor-sync`;
  };

  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;
    
    try {
      const wsUrl = getWebSocketUrl();
      console.log('🔌 Connecting to WebSocket:', wsUrl);
      
      ws.current = new WebSocket(wsUrl);
      
      ws.current.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttempts.current = 0;
        
        // Authenticate
        ws.current.send(JSON.stringify({
          type: 'auth',
          clientType: 'supervisor',
          supervisorId,
          sessionId
        }));
      };
      
      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('❌ Failed to parse WebSocket message:', error);
        }
      };
      
      ws.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setConnectionError('Connection error occurred');
      };
      
      ws.current.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        setIsConnected(false);
        setConnectedDisplays(0);
        
        // Attempt reconnection
        if (reconnectAttempts.current < 5) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
          
          reconnectTimeout.current = setTimeout(() => {
            connectWebSocket();
          }, delay);
        } else {
          setConnectionError('Unable to maintain connection. Please refresh.');
        }
      };
    } catch (error) {
      console.error('❌ Failed to create WebSocket:', error);
      setConnectionError('Failed to establish connection');
    }
  }, [supervisorId, sessionId]);

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = (data) => {
    console.log('📨 WebSocket message:', data.type);
    
    switch (data.type) {
      case 'welcome':
        console.log('👋 Connected with ID:', data.clientId);
        // Request current state
        ws.current.send(JSON.stringify({ type: 'request_state' }));
        break;
        
      case 'auth_success':
        console.log('✅ Authentication successful');
        setLoading(false);
        setConnectedDisplays(data.connectedDisplays || 0);
        if (data.currentState) {
          updateSyncState(data.currentState);
        }
        break;
        
      case 'auth_failed':
        console.error('❌ Authentication failed:', data.error);
        setConnectionError('Authentication failed. Please login again.');
        if (onClose) onClose();
        break;
        
      case 'state_update':
        updateSyncState(data.state);
        break;
        
      case 'display_connected':
        setConnectedDisplays(data.displayCount);
        showNotification('Display screen connected', 'success');
        break;
        
      case 'display_disconnected':
        setConnectedDisplays(data.remainingDisplays);
        showNotification('Display screen disconnected', 'warning');
        break;
        
      case 'alert_acknowledged':
        handleAlertAcknowledged(data);
        break;
        
      case 'priority_updated':
        handlePriorityUpdated(data);
        break;
        
      case 'note_added':
        handleNoteAdded(data);
        break;
        
      case 'mode_changed':
        setDisplayMode(data.mode);
        showNotification(`Display mode changed to ${data.mode}`, 'info');
        break;
        
      case 'error':
        console.error('❌ Server error:', data.error);
        showNotification(data.error, 'error');
        break;
        
      case 'pong':
        // Keep-alive response
        break;
        
      default:
        console.log('⚠️ Unknown message type:', data.type);
    }
  };

  // Update sync state from server
  const updateSyncState = (state) => {
    if (state.acknowledgedAlerts) {
      setAcknowledgedAlerts(new Set(state.acknowledgedAlerts));
    }
    
    if (state.priorityOverrides) {
      const overrides = new Map(Object.entries(state.priorityOverrides));
      setAlertPriorities(overrides);
    }
    
    if (state.supervisorNotes) {
      const notes = new Map(Object.entries(state.supervisorNotes));
      setAlertNotes(notes);
    }
    
    setSyncStatus({
      acknowledgedAlerts: state.acknowledgedAlerts?.length || 0,
      priorityOverrides: Object.keys(state.priorityOverrides || {}).length,
      supervisorNotes: Object.keys(state.supervisorNotes || {}).length,
      customMessages: state.customMessages?.length || 0,
      activeMode: state.activeMode || 'normal',
      connectedSupervisors: state.connectedSupervisors || 0,
      connectedDisplays: state.connectedDisplays || 0
    });
    
    setDisplayMode(state.activeMode || 'normal');
    setConnectedDisplays(state.connectedDisplays || 0);
  };

  // Handle alert acknowledged
  const handleAlertAcknowledged = (data) => {
    setAcknowledgedAlerts(prev => new Set([...prev, data.alertId]));
    if (data.notes) {
      setAlertNotes(prev => new Map(prev).set(data.alertId, {
        note: data.notes,
        supervisorId: data.supervisorId,
        timestamp: data.timestamp
      }));
    }
  };

  // Handle priority updated
  const handlePriorityUpdated = (data) => {
    setAlertPriorities(prev => new Map(prev).set(data.alertId, {
      priority: data.priority,
      reason: data.reason,
      supervisorId: data.supervisorId,
      timestamp: data.timestamp
    }));
  };

  // Handle note added
  const handleNoteAdded = (data) => {
    setAlertNotes(prev => new Map(prev).set(data.alertId, {
      note: data.note,
      supervisorId: data.supervisorId,
      timestamp: data.timestamp
    }));
  };

  // Send WebSocket message
  const sendMessage = (message) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
      return true;
    } else {
      showNotification('Not connected to server', 'error');
      return false;
    }
  };

  // Acknowledge alert
  const acknowledgeAlert = (alert) => {
    if (!alert) return;
    
    if (isWeb) {
      const reason = prompt('Reason for acknowledging this alert:');
      if (!reason) return;
      
      const notes = prompt('Additional notes (optional):');
      
      if (sendMessage({
        type: 'acknowledge_alert',
        alertId: alert.id,
        reason,
        notes
      })) {
        showNotification('Alert acknowledged', 'success');
      }
    } else {
      // Mobile implementation would use a modal
      Alert.alert(
        'Acknowledge Alert',
        'Please provide a reason for acknowledging this alert',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Acknowledge', 
            onPress: () => {
              sendMessage({
                type: 'acknowledge_alert',
                alertId: alert.id,
                reason: 'Acknowledged via mobile',
                notes: ''
              });
            }
          }
        ]
      );
    }
  };

  // Update alert priority
  const updateAlertPriority = (alert, newPriority) => {
    if (!alert) return;
    
    const reason = isWeb 
      ? prompt('Reason for changing priority:')
      : 'Priority updated via mobile';
      
    if (!reason) return;
    
    if (sendMessage({
      type: 'update_priority',
      alertId: alert.id,
      priority: newPriority,
      reason
    })) {
      showNotification(`Priority updated to ${newPriority}`, 'success');
    }
  };

  // Add note to alert
  const addNoteToAlert = (alert) => {
    if (!alert) return;
    
    const note = isWeb
      ? prompt('Add a note to this alert:')
      : 'Note added via mobile';
      
    if (!note) return;
    
    if (sendMessage({
      type: 'add_note',
      alertId: alert.id,
      note
    })) {
      showNotification('Note added', 'success');
    }
  };

  // Broadcast custom message
  const broadcastCustomMessage = () => {
    if (!broadcastMessage.trim()) {
      showNotification('Please enter a message', 'error');
      return;
    }
    
    const duration = broadcastPriority === 'critical' ? 60000 : 30000;
    
    if (sendMessage({
      type: 'broadcast_message',
      message: broadcastMessage,
      priority: broadcastPriority,
      duration
    })) {
      showNotification('Message broadcast to all displays', 'success');
      setBroadcastMessage('');
      setShowBroadcastModal(false);
    }
  };

  // Change display mode
  const changeDisplayMode = (newMode) => {
    const reason = isWeb
      ? prompt(`Reason for changing to ${newMode} mode:`)
      : `Mode changed to ${newMode}`;
      
    if (!reason) return;
    
    if (sendMessage({
      type: 'set_mode',
      mode: newMode,
      reason
    })) {
      setDisplayMode(newMode);
      showNotification(`Display mode changed to ${newMode}`, 'success');
    }
  };

  // Show notification
  const showNotification = (message, type = 'info') => {
    if (isWeb) {
      // Web notification
      console.log(`[${type.toUpperCase()}] ${message}`);
    } else {
      // Mobile notification
      Alert.alert(
        type === 'error' ? 'Error' : 'Notification',
        message
      );
    }
  };

  // Initialize WebSocket connection
  useEffect(() => {
    connectWebSocket();
    
    // Ping interval
    const pingInterval = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
    
    return () => {
      clearInterval(pingInterval);
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connectWebSocket]);

  // Sync alerts when they change
  useEffect(() => {
    if (isConnected && alerts.length > 0) {
      sendMessage({
        type: 'update_alerts',
        alerts
      });
    }
  }, [alerts, isConnected]);

  // Connection status indicator
  const ConnectionStatus = () => (
    <View style={styles.connectionStatus}>
      <View style={[styles.statusDot, { backgroundColor: isConnected ? '#10B981' : '#EF4444' }]} />
      <Text style={styles.connectionText}>
        {isConnected ? `Connected • ${connectedDisplays} display${connectedDisplays !== 1 ? 's' : ''}` : 'Disconnected'}
      </Text>
      {connectionError && (
        <Text style={styles.errorText}>{connectionError}</Text>
      )}
    </View>
  );

  // Alert control panel
  const AlertControlPanel = ({ alert }) => {
    const isAcknowledged = acknowledgedAlerts.has(alert.id);
    const priority = alertPriorities.get(alert.id);
    const note = alertNotes.get(alert.id);
    
    return (
      <View style={styles.alertPanel}>
        <Text style={styles.alertPanelTitle}>{alert.title}</Text>
        <Text style={styles.alertPanelLocation}>{alert.location}</Text>
        
        <View style={styles.alertActions}>
          {!isAcknowledged ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.acknowledgeButton]}
              onPress={() => acknowledgeAlert(alert)}
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
            onPress={() => addNoteToAlert(alert)}
          >
            <Ionicons name="create" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Add Note</Text>
          </TouchableOpacity>
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
                onPress={() => updateAlertPriority(alert, level)}
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

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'CRITICAL': return '#DC2626';
      case 'HIGH': return '#F59E0B';
      case 'MEDIUM': return '#3B82F6';
      case 'LOW': return '#10B981';
      default: return '#6B7280';
    }
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
            value={broadcastMessage}
            onChangeText={setBroadcastMessage}
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
            onPress={broadcastCustomMessage}
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
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Supervisor Control Panel</Text>
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
        <TouchableOpacity
          style={[styles.controlButton, styles.broadcastControlButton]}
          onPress={() => setShowBroadcastModal(true)}
        >
          <Ionicons name="megaphone" size={20} color="#FFFFFF" />
          <Text style={styles.controlButtonText}>Broadcast Message</Text>
        </TouchableOpacity>
        
        <View style={styles.modeSelector}>
          <Text style={styles.modeSelectorLabel}>Display Mode:</Text>
          {['normal', 'emergency', 'maintenance'].map(mode => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.modeButton,
                displayMode === mode && styles.modeButtonActive
              ]}
              onPress={() => changeDisplayMode(mode)}
            >
              <Text style={[
                styles.modeButtonText,
                displayMode === mode && styles.modeButtonTextActive
              ]}>
                {mode.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{syncStatus.acknowledgedAlerts}</Text>
          <Text style={styles.statLabel}>Acknowledged</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{syncStatus.priorityOverrides}</Text>
          <Text style={styles.statLabel}>Overrides</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{syncStatus.supervisorNotes}</Text>
          <Text style={styles.statLabel}>Notes</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{syncStatus.customMessages}</Text>
          <Text style={styles.statLabel}>Messages</Text>
        </View>
      </View>

      <ScrollView style={styles.alertsList} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Active Alerts ({alerts.length})</Text>
        
        {alerts.length > 0 ? (
          alerts.map((alert) => (
            <TouchableOpacity
              key={alert.id}
              style={styles.alertCard}
              onPress={() => setSelectedAlert(alert.id === selectedAlert?.id ? null : alert)}
            >
              <View style={styles.alertCardHeader}>
                <View style={styles.alertCardInfo}>
                  <Text style={styles.alertCardTitle}>{alert.title}</Text>
                  <Text style={styles.alertCardLocation}>{alert.location}</Text>
                </View>
                
                <View style={styles.alertCardStatus}>
                  {acknowledgedAlerts.has(alert.id) && (
                    <View style={styles.acknowledgedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#059669" />
                    </View>
                  )}
                  {alertPriorities.has(alert.id) && (
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(alertPriorities.get(alert.id)?.priority) }]}>
                      <Text style={styles.priorityBadgeText}>
                        {alertPriorities.get(alert.id)?.priority}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              
              {selectedAlert?.id === alert.id && (
                <AlertControlPanel alert={alert} />
              )}
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.noAlertsContainer}>
            <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            <Text style={styles.noAlertsText}>No active alerts</Text>
          </View>
        )}
      </ScrollView>
      
      <BroadcastModal />
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
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginLeft: 8,
  },
  controlBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
});

export default SupervisorControl;