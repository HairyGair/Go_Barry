// Go_BARRY/components/DisplayScreen.jsx
// Enhanced 24/7 Control Room Display Screen with Modern Design
// Real-time supervisor sync with professional control room aesthetics

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBarryAPI } from './hooks/useBARRYapi';

const { width: screenWidth } = Dimensions.get('window');

const DisplayScreen = () => {
  const {
    alerts,
    loading,
    lastUpdated,
    refreshAlerts
  } = useBarryAPI({
    autoRefresh: true,
    refreshInterval: 15000 // 15 seconds for critical monitoring
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState(new Set());
  const [wsConnected, setWsConnected] = useState(false);
  const [blinkAnimation] = useState(new Animated.Value(1));
  
  // State for supervisor sync
  const [priorityOverrides, setPriorityOverrides] = useState(new Map());
  const [supervisorNotes, setSupervisorNotes] = useState(new Map());
  const [customMessages, setCustomMessages] = useState([]);
  const [displayMode, setDisplayMode] = useState('normal');
  const [connectedSupervisors, setConnectedSupervisors] = useState(0);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Blinking animation for critical alerts
  useEffect(() => {
    const criticalCount = alerts.filter(alert => {
      const override = priorityOverrides.get(alert.id);
      return override?.priority === 'CRITICAL' || 
             (!override && (alert.severity === 'High' || 
             (alert.affectsRoutes && alert.affectsRoutes.length >= 3)));
    }).length;

    if (criticalCount > 0) {
      const blink = Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnimation, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(blinkAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      blink.start();
      return () => blink.stop();
    } else {
      blinkAnimation.setValue(1);
    }
  }, [alerts, priorityOverrides, blinkAnimation]);

  // WebSocket connection for supervisor-sync
  useEffect(() => {
    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const baseUrl = window.location.hostname === 'localhost' 
        ? 'localhost:3001'
        : 'go-barry.onrender.com';
      const wsUrl = `${protocol}//${baseUrl}/ws/supervisor-sync`;
      
      console.log('🔌 Display connecting to:', wsUrl);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✅ Display connected to supervisor sync');
        setWsConnected(true);
        ws.send(JSON.stringify({ 
          type: 'auth', 
          clientType: 'display' 
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Display received:', data.type);

          switch (data.type) {
            case 'welcome':
              console.log('👋 Display welcomed');
              break;
              
            case 'auth_success':
              console.log('✅ Display authenticated');
              if (data.currentState) {
                updateDisplayState(data.currentState);
              }
              break;
              
            case 'state_update':
              updateDisplayState(data.state);
              break;
              
            case 'alert_acknowledged':
              setAcknowledgedAlerts(prev => new Set([...prev, data.alertId]));
              if (data.notes) {
                setSupervisorNotes(prev => new Map(prev).set(data.alertId, {
                  note: data.notes,
                  supervisorId: data.supervisorId,
                  timestamp: data.timestamp
                }));
              }
              break;
              
            case 'priority_updated':
              setPriorityOverrides(prev => new Map(prev).set(data.alertId, {
                priority: data.priority,
                reason: data.reason,
                supervisorId: data.supervisorId,
                timestamp: data.timestamp
              }));
              break;
              
            case 'note_added':
              setSupervisorNotes(prev => new Map(prev).set(data.alertId, {
                note: data.note,
                supervisorId: data.supervisorId,
                timestamp: data.timestamp
              }));
              break;
              
            case 'custom_message':
              setCustomMessages(prev => [...prev, data.message]);
              // Auto-remove message after duration
              setTimeout(() => {
                setCustomMessages(prev => prev.filter(m => m.id !== data.message.id));
              }, 30000);
              break;
              
            case 'message_removed':
              setCustomMessages(prev => prev.filter(m => m.id !== data.messageId));
              break;
              
            case 'mode_changed':
              setDisplayMode(data.mode);
              break;
              
            case 'alerts_updated':
              // Refresh alerts from API to get latest data
              refreshAlerts();
              break;
              
            case 'supervisor_connected':
              console.log(`👮 Supervisor ${data.supervisorName} connected`);
              break;
              
            case 'supervisor_disconnected':
              console.log(`👮 Supervisor disconnected`);
              break;
              
            case 'error':
              console.error('❌ WebSocket error:', data.error);
              break;
          }
        } catch (error) {
          console.error('❌ Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('🔌 Display WebSocket disconnected');
        setWsConnected(false);
        // Attempt reconnection after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };

      ws.onerror = (err) => {
        console.error('❌ Display WebSocket error:', err);
        setWsConnected(false);
      };

      return ws;
    };

    const ws = connectWebSocket();
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [refreshAlerts]);

  // Update display state from supervisor sync
  const updateDisplayState = (state) => {
    if (state.acknowledgedAlerts) {
      setAcknowledgedAlerts(new Set(state.acknowledgedAlerts));
    }
    if (state.priorityOverrides) {
      setPriorityOverrides(new Map(Object.entries(state.priorityOverrides)));
    }
    if (state.supervisorNotes) {
      setSupervisorNotes(new Map(Object.entries(state.supervisorNotes)));
    }
    if (state.customMessages) {
      setCustomMessages(state.customMessages);
    }
    if (state.activeMode) {
      setDisplayMode(state.activeMode);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const acknowledgeAlert = (alertId) => {
    setAcknowledgedAlerts(prev => new Set([...prev, alertId]));
  };

  const criticalAlerts = alerts.filter(alert => 
    alert.severity === 'High' || 
    (alert.affectsRoutes && alert.affectsRoutes.length >= 3)
  );

  const urgentAlerts = alerts.filter(alert => 
    alert.severity === 'Medium' && 
    alert.affectsRoutes && 
    alert.affectsRoutes.length > 0
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>GO BARRY</Text>
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.systemTitle}>GO NORTH EAST CONTROL ROOM</Text>
              <Text style={styles.displayTitle}>24/7 TRAFFIC MONITORING DISPLAY</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.headerCenter}>
          <Text style={styles.timeDisplay}>{formatTime(currentTime)}</Text>
          <Text style={styles.dateDisplay}>{formatDate(currentTime)}</Text>
        </View>
        
        <View style={styles.headerRight}>
          <View style={[styles.statusIndicator, { backgroundColor: wsConnected ? '#059669' : '#EF4444' }]}>
            <Text style={styles.statusText}>
              {loading ? 'UPDATING' : wsConnected ? 'LIVE MONITORING' : 'DISCONNECTED'}
            </Text>
          </View>
          <Text style={styles.lastUpdate}>
            Last Update: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString('en-GB') : 'Never'}
          </Text>
          {wsConnected && (
            <View style={styles.syncStatus}>
              <Ionicons name="wifi" size={12} color="#10B981" />
              <Text style={styles.syncText}>Supervisor Sync Active</Text>
            </View>
          )}
        </View>
      </View>

      {/* Priority Summary */}
      <View style={styles.prioritySummary}>
        <View style={[styles.priorityCount, { backgroundColor: '#FEE2E2' }]}>
          <Text style={[styles.priorityNumber, { color: '#DC2626' }]}>
            {criticalAlerts.length}
          </Text>
          <Text style={[styles.priorityLabel, { color: '#DC2626' }]}>
            CRITICAL
          </Text>
        </View>
        
        <View style={[styles.priorityCount, { backgroundColor: '#FED7AA' }]}>
          <Text style={[styles.priorityNumber, { color: '#EA580C' }]}>
            {urgentAlerts.length}
          </Text>
          <Text style={[styles.priorityLabel, { color: '#EA580C' }]}>
            URGENT
          </Text>
        </View>
        
        <View style={[styles.priorityCount, { backgroundColor: '#FEF3C7' }]}>
          <Text style={[styles.priorityNumber, { color: '#CA8A04' }]}>
            {alerts.length - criticalAlerts.length - urgentAlerts.length}
          </Text>
          <Text style={[styles.priorityLabel, { color: '#CA8A04' }]}>
            MONITOR
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={refreshAlerts}
        >
          <Ionicons name="refresh" size={20} color="#FFFFFF" />
          <Text style={styles.refreshText}>REFRESH</Text>
        </TouchableOpacity>
      </View>

      {/* Custom Messages from Supervisors */}
      {customMessages.length > 0 && (
        <View style={styles.customMessages}>
          {customMessages.map(message => (
            <View 
              key={message.id} 
              style={[
                styles.customMessage,
                { borderLeftColor: message.priority === 'critical' ? '#DC2626' : 
                                  message.priority === 'warning' ? '#F59E0B' : '#3B82F6' }
              ]}
            >
              <View style={styles.messageHeader}>
                <Ionicons 
                  name={message.priority === 'critical' ? 'warning' : 
                       message.priority === 'warning' ? 'alert-circle' : 'information-circle'} 
                  size={16} 
                  color={message.priority === 'critical' ? '#DC2626' : 
                         message.priority === 'warning' ? '#F59E0B' : '#3B82F6'} 
                />
                <Text style={styles.messageLabel}>SUPERVISOR MESSAGE</Text>
                <Text style={styles.messageTime}>
                  {new Date(message.timestamp).toLocaleTimeString('en-GB')}
                </Text>
              </View>
              <Text style={styles.messageText}>{message.message}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Alerts Feed */}
      <ScrollView style={styles.alertsFeed} showsVerticalScrollIndicator={false}>
        {alerts.length > 0 ? (
          alerts.map((alert, index) => {
            // Check for supervisor priority override
            const priorityOverride = priorityOverrides.get(alert.id);
            const supervisorNote = supervisorNotes.get(alert.id);
            
            const isCritical = priorityOverride?.priority === 'CRITICAL' || 
                             (!priorityOverride && criticalAlerts.includes(alert));
            const isUrgent = priorityOverride?.priority === 'HIGH' || 
                           (!priorityOverride && !isCritical && urgentAlerts.includes(alert));
            const isAcknowledged = acknowledgedAlerts.has(alert.id);
            
            let priority = 'MONITOR';
            let priorityColor = '#CA8A04';
            
            if (priorityOverride) {
              // Use supervisor override
              switch (priorityOverride.priority) {
                case 'CRITICAL':
                  priority = 'CRITICAL';
                  priorityColor = '#DC2626';
                  break;
                case 'HIGH':
                  priority = 'URGENT';
                  priorityColor = '#EA580C';
                  break;
                case 'MEDIUM':
                  priority = 'MONITOR';
                  priorityColor = '#CA8A04';
                  break;
                case 'LOW':
                  priority = 'LOW';
                  priorityColor = '#10B981';
                  break;
              }
            } else {
              // Use automatic priority
              if (isCritical) {
                priority = 'CRITICAL';
                priorityColor = '#DC2626';
              } else if (isUrgent) {
                priority = 'URGENT';
                priorityColor = '#EA580C';
              }
            }

            return (
              <TouchableOpacity
                key={alert.id || index}
                style={[
                  styles.alertCard,
                  { borderLeftColor: priorityColor },
                  isAcknowledged && styles.alertCardAcknowledged
                ]}
                onPress={() => acknowledgeAlert(alert.id)}
              >
                {/* Priority Banner */}
                <View style={[styles.priorityBanner, { backgroundColor: priorityColor }]}>
                  <Text style={styles.priorityText}>{priority}</Text>
                  {isCritical && (
                    <Ionicons name="warning" size={16} color="#FFFFFF" />
                  )}
                </View>

                {/* Alert Content */}
                <View style={styles.alertContent}>
                  <View style={styles.alertHeader}>
                    <Ionicons 
                      name={alert.type === 'incident' ? 'alert-circle' : 'construct'} 
                      size={24} 
                      color={priorityColor}
                    />
                    <Text style={styles.alertTitle}>{alert.title}</Text>
                  </View>
                  
                  <Text style={styles.alertLocation}>{alert.location}</Text>
                  <Text style={styles.alertDescription} numberOfLines={3}>
                    {alert.description}
                  </Text>

                  {/* Service Impact */}
                  {alert.affectsRoutes && alert.affectsRoutes.length > 0 && (
                    <View style={styles.serviceImpact}>
                      <Text style={styles.serviceImpactLabel}>AFFECTED SERVICES:</Text>
                      <View style={styles.routesList}>
                        {alert.affectsRoutes.slice(0, 6).map((route, idx) => (
                          <View key={idx} style={[styles.routeBadge, { borderColor: priorityColor }]}>
                            <Text style={[styles.routeText, { color: priorityColor }]}>
                              {route}
                            </Text>
                          </View>
                        ))}
                        {alert.affectsRoutes.length > 6 && (
                          <Text style={styles.moreRoutes}>
                            +{alert.affectsRoutes.length - 6} more
                          </Text>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Supervisor Action */}
                  <View style={styles.supervisorActions}>
                    {priorityOverride && (
                      <View style={styles.priorityOverride}>
                        <Ionicons name="shield-checkmark" size={14} color="#7C3AED" />
                        <Text style={styles.overrideText}>
                          Priority set to {priorityOverride.priority} by supervisor
                        </Text>
                      </View>
                    )}
                    
                    {supervisorNote && (
                      <View style={styles.supervisorNote}>
                        <Ionicons name="document-text" size={14} color="#6B7280" />
                        <Text style={styles.noteText}>{supervisorNote.note}</Text>
                      </View>
                    )}
                    
                    <Text style={styles.actionPrompt}>
                      {isCritical && 'IMMEDIATE: Check service status and consider diversions'}
                      {isUrgent && !isCritical && 'URGENT: Review affected routes and passenger impact'}
                      {!isCritical && !isUrgent && 'MONITOR: Keep watching for service disruption'}
                    </Text>
                    
                    {!isAcknowledged && (isCritical || isUrgent) && (
                      <View style={styles.acknowledgementPrompt}>
                        <Ionicons name="hand-left" size={16} color={priorityColor} />
                        <Text style={[styles.ackText, { color: priorityColor }]}>
                          TAP TO ACKNOWLEDGE
                        </Text>
                      </View>
                    )}
                    
                    {isAcknowledged && (
                      <View style={styles.acknowledgedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#059669" />
                        <Text style={styles.acknowledgedText}>ACKNOWLEDGED</Text>
                      </View>
                    )}
                  </View>

                  {/* Source Info */}
                  <View style={styles.alertFooter}>
                    <Text style={styles.sourceText}>
                      Source: {alert.source?.toUpperCase() || 'SYSTEM'} • 
                      Severity: {alert.severity?.toUpperCase() || 'UNKNOWN'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.noAlertsContainer}>
            <Ionicons name="shield-checkmark" size={64} color="#059669" />
            <Text style={styles.noAlertsTitle}>ALL CLEAR</Text>
            <Text style={styles.noAlertsText}>
              No traffic alerts requiring supervisor attention
            </Text>
            <Text style={styles.noAlertsSubtext}>
              Services operating normally across the network
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Go North East Control Room • 24/7 Traffic Intelligence • Supervisor Display
        </Text>
        <Text style={styles.instructionText}>
          TAP alerts to acknowledge • Critical alerts require immediate supervisor review
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    minHeight: '100vh',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1F2937',
    borderBottomWidth: 3,
    borderBottomColor: '#DC2626',
  },
  headerLeft: {
    flex: 1,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#E31E24',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
  },
  titleContainer: {
    flex: 1,
  },
  systemTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  displayTitle: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '600',
    marginTop: 2,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  timeDisplay: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  dateDisplay: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: '#059669',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  lastUpdate: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },
  prioritySummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  priorityCount: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    minWidth: 80,
  },
  priorityNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  priorityLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  alertsFeed: {
    flex: 1,
    padding: 16,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    borderRadius: 8,
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertCardAcknowledged: {
    opacity: 0.7,
    backgroundColor: '#F9FAFB',
  },
  priorityBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  alertContent: {
    padding: 16,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  alertTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  alertLocation: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
    marginBottom: 8,
  },
  alertDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  serviceImpact: {
    marginBottom: 12,
  },
  serviceImpactLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 8,
    letterSpacing: 1,
  },
  routesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  routeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  routeText: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  moreRoutes: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  supervisorActions: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    marginBottom: 12,
  },
  actionPrompt: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 8,
    lineHeight: 18,
  },
  acknowledgementPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  ackText: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  acknowledgedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  acknowledgedText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  alertFooter: {
    marginTop: 8,
  },
  sourceText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },
  noAlertsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noAlertsTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#059669',
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 2,
  },
  noAlertsText: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  noAlertsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1F2937',
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  footerText: {
    fontSize: 11,
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  instructionText: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  syncText: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '500',
  },
  customMessages: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  customMessage: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderLeftWidth: 4,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  messageLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#374151',
    letterSpacing: 1,
    flex: 1,
  },
  messageTime: {
    fontSize: 10,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  messageText: {
    fontSize: 14,
    color: '#1F2937',
    padding: 16,
    lineHeight: 20,
  },
  priorityOverride: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 8,
  },
  overrideText: {
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: '600',
  },
  supervisorNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 16,
  },
});

export default DisplayScreen;
