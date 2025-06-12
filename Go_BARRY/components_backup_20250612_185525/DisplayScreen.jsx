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
  Dimensions,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBarryAPI } from './hooks/useBARRYapi';
import { useSupervisorPolling, CONNECTION_STATES } from './hooks/useSupervisorPolling';
import TrafficMap from './TrafficMap';
import {
  GoBarryLogo,
  StatusButton,
  PriorityIndicator,
  RefreshButton,
  ConnectionStatus,
  LoadingSpinner
} from './ui/DisplayUIElements';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

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

  // Use the optimized polling hook for display client
  const {
    connectionState,
    isConnected: wsConnected,
    acknowledgedAlerts,
    priorityOverrides,
    supervisorNotes,
    customMessages,
    dismissedFromDisplay,
    lockedOnDisplay,
    activeMode: displayMode,
    connectedSupervisors,
    activeSupervisors
  } = useSupervisorPolling({
    clientType: 'display',
    autoConnect: true,
    onConnectionChange: (connected) => {
      console.log('🔌 Display Polling:', connected ? 'Connected' : 'Disconnected');
    },
    onMessage: (message) => {
      console.log('📨 Display received message:', message.type, message);
    },
    onError: (error) => {
      console.error('❌ Display Polling error:', error);
    }
  });

  // Time and UI state
  const [currentTime, setCurrentTime] = useState(new Date());
  const [blinkAnimation] = useState(new Animated.Value(1));
  const [pulseAnimation] = useState(new Animated.Value(1));
  
  // Map state
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-rotate through alerts every 15 seconds (but respect locked alerts)
  useEffect(() => {
    if (!autoRotate || !visibleAlerts.length) return;
    
    // Check if current alert is locked - if so, don't auto-rotate
    const currentAlert = getCurrentAlert();
    if (currentAlert && lockedOnDisplay.has(currentAlert.id)) {
      console.log(`🔒 Alert ${currentAlert.id} is locked on display - skipping auto-rotation`);
      return;
    }
    
    const interval = setInterval(() => {
      setCurrentAlertIndex((prevIndex) => {
        const newIndex = (prevIndex + 1) % visibleAlerts.length;
        console.log(`🔄 Auto-rotating to alert ${newIndex + 1}/${visibleAlerts.length}`);
        return newIndex;
      });
    }, 15000); // Rotate every 15 seconds
    
    return () => clearInterval(interval);
  }, [autoRotate, visibleAlerts.length, lockedOnDisplay, getCurrentAlert]);

  // Reset alert index when alerts change
  useEffect(() => {
    if (currentAlertIndex >= visibleAlerts.length) {
      setCurrentAlertIndex(0);
    }
  }, [visibleAlerts.length, currentAlertIndex]);

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

  // Pulse animation for connection status
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnimation]);

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

  // Get current alert (from visible alerts only)
  const getCurrentAlert = () => {
    if (!visibleAlerts.length || currentAlertIndex >= visibleAlerts.length) return null;
    return visibleAlerts[currentAlertIndex];
  };

  // Navigate to next alert
  const nextAlert = () => {
    if (visibleAlerts.length > 1) {
      const newIndex = (currentAlertIndex + 1) % visibleAlerts.length;
      setCurrentAlertIndex(newIndex);
      setAutoRotate(false);
      console.log(`➡️ Manual navigation to alert ${newIndex + 1}/${visibleAlerts.length}`);
      
      // Resume auto-rotation after 30 seconds
      setTimeout(() => {
        setAutoRotate(true);
        console.log('🔄 Auto-rotation resumed');
      }, 30000);
    }
  };

  // Navigate to previous alert
  const previousAlert = () => {
    if (visibleAlerts.length > 1) {
      const newIndex = currentAlertIndex === 0 ? visibleAlerts.length - 1 : currentAlertIndex - 1;
      setCurrentAlertIndex(newIndex);
      setAutoRotate(false);
      console.log(`⬅️ Manual navigation to alert ${newIndex + 1}/${visibleAlerts.length}`);
      
      // Resume auto-rotation after 30 seconds
      setTimeout(() => {
        setAutoRotate(true);
        console.log('🔄 Auto-rotation resumed');
      }, 30000);
    }
  };

  const toggleAutoRotate = () => {
    setAutoRotate(!autoRotate);
    console.log(`🔄 Auto-rotation ${!autoRotate ? 'enabled' : 'disabled'}`);
  };

  // Helper function to format login time
  const formatLoginTime = (loginTime) => {
    if (!loginTime) return 'Unknown';
    const minutes = Math.floor((Date.now() - new Date(loginTime).getTime()) / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // Render supervisor activity feed
  const renderSupervisorActivity = () => {
    const activities = [];
    
    // Debug: Log supervisor data
    console.log('👥 Display Screen - Active Supervisors:', {
      count: activeSupervisors?.length || 0,
      supervisors: activeSupervisors,
      connectedCount: connectedSupervisors
    });
    
    // Add connection events
    activeSupervisors?.forEach((supervisor, index) => {
      activities.push({
        id: `login-${supervisor.id || index}`,
        type: 'connection',
        icon: 'log-in',
        iconColor: '#10B981',
        title: 'User Connected',
        description: `${supervisor.name || 'Supervisor'} logged in`,
        timestamp: supervisor.loginTime ? new Date(supervisor.loginTime).getTime() : Date.now() - Math.random() * 3600000
      });
    });
    
    // Add acknowledged alerts
    acknowledgedAlerts.forEach((alertId) => {
      const alert = alerts.find(a => a.id === alertId);
      if (alert) {
        activities.push({
          id: `ack-${alertId}`,
          type: 'acknowledgment',
          icon: 'checkmark-circle',
          iconColor: '#10B981',
          title: 'Alert Acknowledged',
          description: `${alert.title?.substring(0, 25)}...`,
          timestamp: Date.now() - Math.random() * 600000 // Mock recent time
        });
      }
    });
    
    // Add priority overrides
    priorityOverrides.forEach((override, alertId) => {
      const alert = alerts.find(a => a.id === alertId);
      if (alert) {
        activities.push({
          id: `priority-${alertId}`,
          type: 'priority',
          icon: 'flag',
          iconColor: '#F59E0B',
          title: 'Priority Override',
          description: `Set to ${override.priority} level`,
          timestamp: Date.now() - Math.random() * 300000
        });
      }
    });
    
    // Add supervisor notes
    supervisorNotes.forEach((note, alertId) => {
      activities.push({
        id: `note-${alertId}`,
        type: 'note',
        icon: 'document-text',
        iconColor: '#3B82F6',
        title: 'Note Added',
        description: note.note.substring(0, 30) + '...',
        timestamp: Date.now() - Math.random() * 900000
      });
    });
    
    // Add custom messages
    customMessages.forEach((message) => {
      activities.push({
        id: `msg-${message.id}`,
        type: 'message',
        icon: 'megaphone',
        iconColor: message.priority === 'critical' ? '#DC2626' : '#7C3AED',
        title: 'Broadcast Message',
        description: message.message.substring(0, 28) + '...',
        timestamp: new Date(message.timestamp).getTime()
      });
    });
    
    // Add system events
    if (alerts.length > 0) {
      activities.push({
        id: 'system-refresh',
        type: 'system',
        icon: 'refresh-circle',
        iconColor: '#6B7280',
        title: 'System Update',
        description: `${alerts.length} alerts processed`,
        timestamp: lastUpdated ? new Date(lastUpdated).getTime() : Date.now()
      });
    }
    
    // Sort by timestamp (most recent first)
    activities.sort((a, b) => b.timestamp - a.timestamp);
    
    // Take only recent activities
    const recentActivities = activities.slice(0, 12);
    
    if (recentActivities.length === 0) {
      return (
        <View style={styles.noActivityLog}>
          <Ionicons name="time-outline" size={18} color="#6B7280" />
          <Text style={styles.noActivityLogText}>No recent activity</Text>
          <Text style={styles.noActivityLogSubtext}>Actions will appear here</Text>
        </View>
      );
    }
    
    return recentActivities.map((activity) => (
      <View key={activity.id} style={styles.activityLogItem}>
        <View style={[styles.activityLogIcon, { backgroundColor: activity.iconColor }]}>
          <Ionicons name={activity.icon} size={10} color="#FFFFFF" />
        </View>
        
        <View style={styles.activityLogContent}>
          <Text style={styles.activityLogTitle}>{activity.title}</Text>
          <Text style={styles.activityLogDescription}>{activity.description}</Text>
          <Text style={styles.activityLogTimestamp}>
            {formatActivityTime(activity.timestamp)}
          </Text>
        </View>
      </View>

    ));
  };
  
  // Format activity timestamp
  const formatActivityTime = (timestamp) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
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

  // Filter out alerts dismissed from display
  const visibleAlerts = alerts.filter(alert => !dismissedFromDisplay.has(alert.id));
  const visibleCriticalAlerts = criticalAlerts.filter(alert => !dismissedFromDisplay.has(alert.id));
  const visibleUrgentAlerts = urgentAlerts.filter(alert => !dismissedFromDisplay.has(alert.id));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <GoBarryLogo size={60} animated={true} />
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
          <StatusButton
            status={loading ? 'updating' : wsConnected ? 'connected' : 'disconnected'}
            label={loading ? 'UPDATING' : wsConnected ? 'LIVE MONITORING' : 'DISCONNECTED'}
            size="medium"
            pulsing={wsConnected && !loading}
          />
          <Text style={styles.lastUpdate}>
            Last Update: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString('en-GB') : 'Never'}
          </Text>
          <ConnectionStatus
            connected={wsConnected}
            label="Supervisor Sync"
            showPulse={true}
          />
        </View>
      </View>

      {/* Supervisor Status Bar */}
      <View style={styles.supervisorStatusBar}>
        <View style={styles.supervisorStatusLeft}>
          <Ionicons 
            name="people" 
            size={16} 
            color={connectedSupervisors > 0 ? '#10B981' : '#6B7280'} 
          />
          <Text style={[
            styles.supervisorStatusText,
            { color: connectedSupervisors > 0 ? '#10B981' : '#6B7280' }
          ]}>
            {connectedSupervisors === 0 ? 'NO SUPERVISORS ONLINE' :
             connectedSupervisors === 1 ? '1 SUPERVISOR ONLINE' :
             `${connectedSupervisors} SUPERVISORS ONLINE`}
          </Text>
        </View>
        
        <View style={styles.supervisorStatusRight}>
          {activeSupervisors?.map((supervisor, index) => (
            <View key={supervisor.id || index} style={styles.supervisorQuickInfo}>
              <View style={[
                styles.supervisorQuickAvatar,
                { backgroundColor: supervisor.isAdmin ? '#7C3AED' : '#3B82F6' }
              ]}>
                <Text style={styles.supervisorInitial}>
                  {(supervisor.name || 'S').charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.supervisorQuickName}>
                {supervisor.name || `Sup${index + 1}`}
              </Text>
            </View>
          )).slice(0, 4)}
          
          {connectedSupervisors > 4 && (
            <Text style={styles.moreSupervisors}>+{connectedSupervisors - 4}</Text>
          )}
        </View>
      </View>

      {/* Main Content - 60/40 Split */}
      <View style={styles.mainContent}>
        {/* Alerts Section - 60% */}
        <View style={styles.alertsSection}>
          <View style={styles.alertDisplayHeader}>
            <View style={styles.alertsHeaderLeft}>
              <Ionicons name="alert-circle" size={20} color="#FFFFFF" />
              <Text style={styles.alertsTitle}>CURRENT ALERT</Text>
              <Text style={styles.alertPosition}>
                {visibleAlerts.length > 0 ? `${currentAlertIndex + 1} of ${visibleAlerts.length}` : '0 of 0'}
              </Text>
            </View>
            
            <View style={styles.alertNavigationControls}>
              <TouchableOpacity 
                style={[styles.navButton, visibleAlerts.length <= 1 && styles.navButtonDisabled]}
                onPress={previousAlert}
                disabled={visibleAlerts.length <= 1}
              >
                <Ionicons name="chevron-back" size={20} color={visibleAlerts.length > 1 ? "#FFFFFF" : "#6B7280"} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.autoRotateButton, autoRotate && styles.autoRotateButtonActive]}
                onPress={toggleAutoRotate}
              >
                <Ionicons 
                  name={autoRotate ? "pause" : "play"} 
                  size={16} 
                  color={autoRotate ? "#059669" : "#6B7280"} 
                />
                <Text style={[styles.autoRotateText, autoRotate && styles.autoRotateTextActive]}>
                  {autoRotate ? 'AUTO' : 'PAUSE'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.navButton, visibleAlerts.length <= 1 && styles.navButtonDisabled]}
                onPress={nextAlert}
                disabled={visibleAlerts.length <= 1}
              >
                <Ionicons name="chevron-forward" size={20} color={visibleAlerts.length > 1 ? "#FFFFFF" : "#6B7280"} />
              </TouchableOpacity>
              
              <RefreshButton
                onPress={refreshAlerts}
                loading={loading}
                size="small"
                variant="primary"
              />
            </View>
          </View>

          {/* Single Alert Content */}
          <View style={styles.singleAlertContent}>
            {/* Custom Messages from Supervisors */}
            {customMessages.length > 0 && (
              <View style={styles.customMessagesTop}>
                {customMessages.map(message => (
                  <View 
                    key={message.id} 
                    style={[
                      styles.customMessageLarge,
                      { borderLeftColor: message.priority === 'critical' ? '#DC2626' : 
                                        message.priority === 'warning' ? '#F59E0B' : '#3B82F6' }
                    ]}
                  >
                    <View style={styles.messageHeaderLarge}>
                      <Ionicons 
                        name={message.priority === 'critical' ? 'warning' : 
                             message.priority === 'warning' ? 'alert-circle' : 'information-circle'} 
                        size={20} 
                        color={message.priority === 'critical' ? '#DC2626' : 
                               message.priority === 'warning' ? '#F59E0B' : '#3B82F6'} 
                      />
                      <Text style={styles.messageLabelLarge}>SUPERVISOR BROADCAST</Text>
                      <Text style={styles.messageTimeLarge}>
                        {new Date(message.timestamp).toLocaleTimeString('en-GB')}
                      </Text>
                    </View>
                    <Text style={styles.messageTextLarge}>{message.message}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Single Alert Display - ONLY show current alert */}
            {visibleAlerts.length > 0 ? (
              (() => {
                const alert = getCurrentAlert();
                if (!alert) return null;
                
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
                  <View style={styles.singleAlertOnlyCard}>
                    {/* Priority Banner */}
                    <View style={[styles.singleAlertOnlyPriorityBanner, { backgroundColor: priorityColor }]}>
                      <View style={styles.priorityLeft}>
                        <Text style={styles.singleAlertOnlyPriorityText}>{priority}</Text>
                        {isCritical && (
                          <Ionicons name="warning" size={24} color="#FFFFFF" />
                        )}
                        {lockedOnDisplay.has(alert.id) && (
                          <View style={styles.lockedIndicatorLarge}>
                            <Ionicons name="lock-closed" size={20} color="#FFFFFF" />
                            <Text style={styles.lockedTextLarge}>LOCKED</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.alertSourceLarge}>
                        {alert.source?.toUpperCase() || 'SYSTEM'} • {alert.severity?.toUpperCase() || 'UNKNOWN'}
                      </Text>
                    </View>

                    {/* Alert Content */}
                    <View style={styles.singleAlertOnlyMainContent}>
                      <View style={styles.singleAlertOnlyHeader}>
                        <Ionicons 
                          name={alert.type === 'incident' ? 'alert-circle' : 'construct'} 
                          size={48} 
                          color={priorityColor}
                        />
                        <Text style={styles.singleAlertOnlyTitle}>{alert.title}</Text>
                      </View>
                      
                      <Text style={styles.singleAlertOnlyLocation}>{alert.location}</Text>
                      <Text style={styles.singleAlertOnlyDescription}>
                        {alert.description}
                      </Text>

                      {/* Service Impact */}
                      {alert.affectsRoutes && alert.affectsRoutes.length > 0 && (
                        <View style={styles.singleAlertOnlyServiceImpact}>
                          <Text style={styles.singleAlertOnlyServiceLabel}>AFFECTED SERVICES:</Text>
                          <View style={styles.singleAlertOnlyRoutesList}>
                            {alert.affectsRoutes.map((route, idx) => (
                              <View key={idx} style={[styles.singleAlertOnlyRouteBadge, { borderColor: priorityColor, backgroundColor: priorityColor }]}>
                                <Text style={styles.singleAlertOnlyRouteText}>
                                  {route}
                                </Text>
                              </View>
                            ))}
                          </View>
                          <Text style={styles.routeImpactSummaryLarge}>
                            {alert.affectsRoutes.length} service{alert.affectsRoutes.length !== 1 ? 's' : ''} affected
                          </Text>
                        </View>
                      )}

                      {/* Supervisor Actions */}
                      <View style={styles.singleAlertOnlySupervisorActions}>
                        {priorityOverride && (
                          <View style={styles.singleAlertOnlyPriorityOverride}>
                            <Ionicons name="shield-checkmark" size={20} color="#7C3AED" />
                            <Text style={styles.singleAlertOnlyOverrideText}>
                              Priority set to {priorityOverride.priority} by supervisor
                            </Text>
                          </View>
                        )}
                        
                        {supervisorNote && (
                          <View style={styles.singleAlertOnlySupervisorNote}>
                            <Ionicons name="document-text" size={20} color="#6B7280" />
                            <Text style={styles.singleAlertOnlyNoteText}>{supervisorNote.note}</Text>
                          </View>
                        )}
                        
                        <View style={styles.actionPromptOnlyLarge}>
                          <Text style={styles.actionPromptOnlyText}>
                            {isCritical && '🚨 IMMEDIATE ACTION: Check service status and consider diversions'}
                            {isUrgent && !isCritical && '⚠️ URGENT: Review affected routes and passenger impact'}
                            {!isCritical && !isUrgent && '👁️ MONITOR: Keep watching for service disruption'}
                          </Text>
                        </View>
                        
                        {!isAcknowledged && (isCritical || isUrgent) && (
                          <View style={[styles.singleAlertOnlyAcknowledgementPrompt, { borderColor: priorityColor }]}>
                            <Ionicons name="hand-left" size={24} color={priorityColor} />
                            <Text style={[styles.singleAlertOnlyAckText, { color: priorityColor }]}>
                              SUPERVISOR ACTION REQUIRED
                            </Text>
                          </View>
                        )}
                        
                        {isAcknowledged && (
                          <View style={styles.singleAlertOnlyAcknowledgedBadge}>
                            <Ionicons name="checkmark-circle" size={24} color="#059669" />
                            <Text style={styles.singleAlertOnlyAcknowledgedText}>ACKNOWLEDGED BY SUPERVISOR</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })()
            ) : (
              <View style={styles.noAlertsContainerOnlyLarge}>
                <Ionicons name="shield-checkmark" size={120} color="#059669" />
                <Text style={styles.noAlertsTitleOnlyLarge}>ALL CLEAR</Text>
                <Text style={styles.noAlertsTextOnlyLarge}>
                  No traffic alerts requiring supervisor attention
                </Text>
                <Text style={styles.noAlertsSubtextOnlyLarge}>
                  Services operating normally across the Go North East network
                </Text>
                <View style={styles.allClearStatsLarge}>
                  <Text style={styles.allClearTimeLarge}>
                    Last incident: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString('en-GB') : 'Never'}
                  </Text>
                  <Text style={styles.allClearStatusLarge}>
                    😍 Network Status: EXCELLENT
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Map Section - 40% */}
        <View style={styles.mapSectionMain}>
          <View style={styles.mapHeader}>
            <View style={styles.mapHeaderLeft}>
              <Ionicons name="map" size={18} color="#FFFFFF" />
              <Text style={styles.mapTitleCompact}>LIVE TRAFFIC MAP</Text>
              <Text style={styles.mapSubtitle}>Newcastle & Gateshead</Text>
            </View>
            
            <View style={styles.mapControls}>
              <Ionicons name="navigation" size={14} color="#10B981" />
              <Text style={styles.mapLegendText}>Live Data</Text>
            </View>
          </View>
          
          <View style={styles.mapContainerCompact}>
            <TrafficMap 
              alerts={alerts}
              currentAlert={getCurrentAlert()}
              alertIndex={currentAlertIndex}
            />
          </View>
          
          {/* Map Legend */}
          <View style={styles.mapLegendCompact}>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#DC2626' }]} />
              <Text style={styles.legendTextCompact}>Critical</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.legendTextCompact}>Delays</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.legendTextCompact}>Normal</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Go North East Control Room • 24/7 Traffic Intelligence • Supervisor Display
        </Text>
        <Text style={styles.instructionText}>
          View-only display • All interactions via Supervisor Screen
        </Text>
      </View>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <LoadingSpinner size="large" message="Processing traffic data..." />
        </View>
      )}
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
  refreshContainer: {
    alignItems: 'center',
    gap: 8,
  },
  refreshText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  alertsFeed: {
    // Legacy style - now using alertsScrollView
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    borderRadius: 12,
    borderLeftWidth: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    minHeight: 180,
  },
  alertCardAcknowledged: {
    opacity: 0.7,
    backgroundColor: '#F9FAFB',
  },
  priorityBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1.5,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  alertLocation: {
    fontSize: 18,
    color: '#3B82F6',
    fontWeight: '600',
    marginBottom: 10,
  },
  alertDescription: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 14,
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
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noAlertsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 2,
    textAlign: 'center',
  },
  noAlertsText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  noAlertsSubtext: {
    fontSize: 12,
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
  // Supervisor Control Styles
  supervisorControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  supervisorControlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
  },
  supervisorControlText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  supervisorControlPanel: {
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  controlPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0F172A',
  },
  controlPanelHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  controlPanelTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  controlPanelSubtitle: {
    fontSize: 10,
    color: '#9CA3AF',
    marginLeft: 8,
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
    fontSize: 11,
    color: '#9CA3AF',
  },
  errorButton: {
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  errorText: {
    fontSize: 10,
    color: '#EF4444',
  },
  controlPanelContent: {
    flexDirection: 'row',
    padding: 16,
    gap: 24,
  },
  modeSelector: {
    flex: 1,
  },
  modeSelectorLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 8,
    fontWeight: '500',
  },
  modeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  modeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: '#1F2937',
  },
  modeButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  modeButtonText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    marginTop: 2,
  },
  supervisorActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 4,
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
  supervisorActionText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
  },
  priorityControls: {
    marginTop: 8,
  },
  priorityControlLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 6,
    fontWeight: '500',
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  priorityButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityButtonActive: {
    opacity: 1,
  },
  priorityButtonText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  broadcastInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  prioritySelector: {
    marginBottom: 16,
  },
  priorityLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '500',
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
    fontSize: 12,
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
    fontSize: 14,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
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
  supervisorStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  supervisorStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  supervisorStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  supervisorStatusRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  supervisorQuickInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  supervisorQuickAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supervisorInitial: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  supervisorQuickName: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  moreSupervisors: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  mapSection: {
    backgroundColor: '#1F2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#000000',
  },
  mapSectionSideBySide: {
    flex: 0.4,
    backgroundColor: '#1F2937',
    borderRightWidth: 1,
    borderRightColor: '#374151',
  },
  centerSpacer: {
    // Legacy style - replaced by supervisorSection
  },
  supervisorSection: {
    flex: 0.2,
    backgroundColor: '#0F172A',
    borderRightWidth: 1,
    borderRightColor: '#374151',
    flexDirection: 'column',
  },
  onlineSupervisors: {
    flex: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  supervisorActivity: {
    flex: 0.5,
  },
  supervisorSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  supervisorSectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
    flex: 1,
    marginLeft: 8,
  },
  onlineCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineCountText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  activityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  activityText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  supervisorsList: {
    flex: 1,
    padding: 8,
  },
  noSupervisorsOnline: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  noSupervisorsText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  waitingText: {
    fontSize: 9,
    color: '#9CA3AF',
    marginTop: 2,
    textAlign: 'center',
  },
  supervisorOnlineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  supervisorOnlineAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  supervisorInitials: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  supervisorOnlineInfo: {
    flex: 1,
  },
  supervisorOnlineName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 1,
  },
  supervisorOnlineRole: {
    fontSize: 8,
    color: '#9CA3AF',
    marginBottom: 1,
  },
  supervisorOnlineTime: {
    fontSize: 7,
    color: '#6B7280',
  },
  supervisorOnlineStatus: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activityList: {
    flex: 1,
    padding: 8,
  },
  noActivity: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  noActivityText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  noActivitySubtext: {
    fontSize: 9,
    color: '#9CA3AF',
    marginTop: 2,
    textAlign: 'center',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  activityIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 1,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 8,
    color: '#9CA3AF',
    lineHeight: 12,
    marginBottom: 2,
  },
  activityTimestamp: {
    fontSize: 7,
    color: '#6B7280',
  },
  alertsFeedSideBySide: {
    flex: 0.4,
    backgroundColor: '#111827',
  },
  alertsFeedMain: {
    flex: 0.6,
    backgroundColor: '#111827',
    borderRightWidth: 1,
    borderRightColor: '#374151',
  },
  mapSectionMain: {
    flex: 0.4,
    backgroundColor: '#1F2937',
  },
  connectedUsersSection: {
    flex: 0.25,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  connectedUsersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  connectedUsersTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
    flex: 1,
    marginLeft: 8,
  },
  connectionIndicator: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  connectedUsersList: {
    flex: 1,
    padding: 8,
  },
  noUsersConnected: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  noUsersText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
  },
  waitingConnectionText: {
    fontSize: 8,
    color: '#9CA3AF',
    marginTop: 2,
    textAlign: 'center',
  },
  connectedUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  userInitials: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 1,
  },
  userRole: {
    fontSize: 9,
    color: '#9CA3AF',
    marginBottom: 1,
  },
  userConnectionTime: {
    fontSize: 8,
    color: '#6B7280',
  },
  userStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  mapSectionCompact: {
    flex: 0.45,
    backgroundColor: '#1F2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  mapTitleCompact: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  mapContainerCompact: {
    flex: 1,
    margin: 12,
    borderRadius: 8,
    overflow: 'hidden',
    minHeight: 200,
  },
  mapLegendCompact: {
    backgroundColor: '#0F172A',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendTextCompact: {
    fontSize: 9,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  activityLogSection: {
    flex: 0.3,
    backgroundColor: '#0F172A',
  },
  activityLogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  activityLogTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
    flex: 1,
    marginLeft: 8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  activityLogList: {
    flex: 1,
    padding: 8,
  },
  noActivityLog: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  noActivityLogText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
  },
  noActivityLogSubtext: {
    fontSize: 8,
    color: '#9CA3AF',
    marginTop: 2,
    textAlign: 'center',
  },
  activityLogItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginBottom: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  activityLogIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginTop: 1,
  },
  activityLogContent: {
    flex: 1,
  },
  activityLogTitle: {
    fontSize: 8,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 1,
  },
  activityLogDescription: {
    fontSize: 7,
    color: '#9CA3AF',
    lineHeight: 10,
    marginBottom: 1,
  },
  activityLogTimestamp: {
    fontSize: 6,
    color: '#6B7280',
  },
  mapContainerMain: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 500,
  },
  mapSubtitle: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
    marginLeft: 4,
  },
  mapLegendText: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '500',
    marginLeft: 4,
  },
  mapLegend: {
    backgroundColor: '#0F172A',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  alertsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  alertsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alertsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  alertsCounter: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  refreshButtonSmall: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  alertsScrollView: {
    flex: 1,
    padding: 12,
  },
  alertsScrollViewMain: {
    flex: 1,
    padding: 16,
  },
  customMessagesInline: {
    marginBottom: 16,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0F172A',
  },
  mapHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mapTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  mapAlertCounter: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mapControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapControlButton: {
    backgroundColor: '#374151',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapContainer: {
    height: 300,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapContainerSideBySide: {
    flex: 1,
    margin: 12,
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 400,
  },
  alertCardSelected: {
    backgroundColor: '#EBF8FF',
    borderLeftWidth: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
  
  // Single Alert Display Styles
  alertsSection: {
    flex: 0.6,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  alertDisplayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  alertPosition: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: 'monospace',
  },
  alertNavigationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navButton: {
    backgroundColor: '#374151',
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonDisabled: {
    backgroundColor: '#1F2937',
    opacity: 0.5,
  },
  autoRotateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  autoRotateButtonActive: {
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
    borderWidth: 1,
    borderColor: '#059669',
  },
  autoRotateText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  autoRotateTextActive: {
    color: '#059669',
  },
  singleAlertContent: {
    flex: 1,
    padding: 20,
  },
  customMessagesTop: {
    marginBottom: 20,
  },
  customMessageLarge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderLeftWidth: 6,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  messageHeaderLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  messageLabelLarge: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    letterSpacing: 1,
    flex: 1,
  },
  messageTimeLarge: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  messageTextLarge: {
    fontSize: 16,
    color: '#1F2937',
    padding: 20,
    lineHeight: 24,
  },
  singleAlertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderLeftWidth: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    minHeight: 400,
  },
  singleAlertCardAcknowledged: {
    opacity: 0.8,
    backgroundColor: '#F9FAFB',
  },
  singleAlertPriorityBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  priorityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lockedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  lockedText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  singleAlertPriorityText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  alertSource: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  singleAlertMainContent: {
    padding: 24,
  },
  singleAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  singleAlertTitle: {
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    lineHeight: 34,
  },
  singleAlertLocation: {
    fontSize: 22,
    color: '#3B82F6',
    fontWeight: '600',
    marginBottom: 16,
  },
  singleAlertDescription: {
    fontSize: 18,
    color: '#4B5563',
    lineHeight: 26,
    marginBottom: 20,
  },
  singleAlertServiceImpact: {
    marginBottom: 20,
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  singleAlertServiceLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 12,
    letterSpacing: 1,
  },
  singleAlertRoutesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  singleAlertRouteBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  singleAlertRouteText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  routeImpactSummary: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  singleAlertSupervisorActions: {
    borderTopWidth: 2,
    borderTopColor: '#F3F4F6',
    paddingTop: 20,
  },
  singleAlertPriorityOverride: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  singleAlertOverrideText: {
    fontSize: 13,
    color: '#7C3AED',
    fontWeight: '600',
  },
  singleAlertSupervisorNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  singleAlertNoteText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  actionPromptLarge: {
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  actionPromptText: {
    fontSize: 16,
    color: '#92400E',
    fontWeight: '600',
    lineHeight: 22,
    textAlign: 'center',
  },
  singleAlertAcknowledgementPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
  },
  singleAlertAckText: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  singleAlertAcknowledgedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 2,
    borderColor: '#BBF7D0',
  },
  singleAlertAcknowledgedText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  noAlertsContainerLarge: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  noAlertsTitleLarge: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#059669',
    marginTop: 20,
    marginBottom: 12,
    letterSpacing: 3,
    textAlign: 'center',
  },
  noAlertsTextLarge: {
    fontSize: 20,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 28,
  },
  noAlertsSubtextLarge: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
  },
  allClearStats: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  allClearTime: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  
  // Single Alert ONLY Display Styles (Much Larger for Room Visibility)
  singleAlertOnlyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    minHeight: '100%',
    margin: 8,
  },
  singleAlertOnlyPriorityBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  singleAlertOnlyPriorityText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  lockedIndicatorLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 16,
  },
  lockedTextLarge: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  alertSourceLarge: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  singleAlertOnlyMainContent: {
    padding: 32,
    flex: 1,
  },
  singleAlertOnlyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginBottom: 24,
  },
  singleAlertOnlyTitle: {
    flex: 1,
    fontSize: 42,
    fontWeight: 'bold',
    color: '#1F2937',
    lineHeight: 48,
  },
  singleAlertOnlyLocation: {
    fontSize: 32,
    color: '#3B82F6',
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
    backgroundColor: '#EBF8FF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  singleAlertOnlyDescription: {
    fontSize: 24,
    color: '#4B5563',
    lineHeight: 36,
    marginBottom: 32,
    textAlign: 'center',
  },
  singleAlertOnlyServiceImpact: {
    marginBottom: 32,
    backgroundColor: '#FEF2F2',
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FECACA',
  },
  singleAlertOnlyServiceLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 16,
    letterSpacing: 2,
    textAlign: 'center',
  },
  singleAlertOnlyRoutesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
    justifyContent: 'center',
  },
  singleAlertOnlyRouteBadge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    minWidth: 60,
    alignItems: 'center',
  },
  singleAlertOnlyRouteText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  routeImpactSummaryLarge: {
    fontSize: 16,
    color: '#DC2626',
    fontWeight: '600',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  singleAlertOnlySupervisorActions: {
    borderTopWidth: 3,
    borderTopColor: '#F3F4F6',
    paddingTop: 24,
  },
  singleAlertOnlyPriorityOverride: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  singleAlertOnlyOverrideText: {
    fontSize: 16,
    color: '#7C3AED',
    fontWeight: '600',
  },
  singleAlertOnlySupervisorNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  singleAlertOnlyNoteText: {
    flex: 1,
    fontSize: 18,
    color: '#4B5563',
    lineHeight: 24,
  },
  actionPromptOnlyLarge: {
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#FDE68A',
  },
  actionPromptOnlyText: {
    fontSize: 20,
    color: '#92400E',
    fontWeight: '600',
    lineHeight: 28,
    textAlign: 'center',
  },
  singleAlertOnlyAcknowledgementPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 3,
    justifyContent: 'center',
  },
  singleAlertOnlyAckText: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  singleAlertOnlyAcknowledgedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 16,
    alignSelf: 'center',
    borderWidth: 3,
    borderColor: '#BBF7D0',
  },
  singleAlertOnlyAcknowledgedText: {
    fontSize: 18,
    color: '#059669',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  
  // Enhanced All Clear Display for Room Visibility
  noAlertsContainerOnlyLarge: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 60,
    backgroundColor: '#F0FDF4',
    margin: 8,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#BBF7D0',
  },
  noAlertsTitleOnlyLarge: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#059669',
    marginTop: 32,
    marginBottom: 24,
    letterSpacing: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(5, 150, 105, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  noAlertsTextOnlyLarge: {
    fontSize: 28,
    color: '#059669',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 36,
    fontWeight: '600',
  },
  noAlertsSubtextOnlyLarge: {
    fontSize: 22,
    color: '#065F46',
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '500',
  },
  allClearStatsLarge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    alignItems: 'center',
    gap: 12,
  },
  allClearTimeLarge: {
    fontSize: 18,
    color: '#059669',
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  allClearStatusLarge: {
    fontSize: 24,
    color: '#059669',
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 2,
  },
});

export default DisplayScreen;
