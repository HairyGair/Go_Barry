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
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBarryAPI } from './hooks/useBARRYapi';
import { useSupervisorSync, CONNECTION_STATES } from './hooks/useSupervisorSync';
import TrafficMap from './TrafficMap';

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

  // Use the shared WebSocket hook for display client
  const {
    connectionState,
    isConnected: wsConnected,
    acknowledgedAlerts,
    priorityOverrides,
    supervisorNotes,
    customMessages,
    activeMode: displayMode,
    connectedSupervisors,
    activeSupervisors
  } = useSupervisorSync({
    clientType: 'display',
    autoConnect: true,
    onConnectionChange: (connected) => {
      console.log('🔌 Display WebSocket:', connected ? 'Connected' : 'Disconnected');
    },
    onError: (error) => {
      console.error('❌ Display WebSocket error:', error);
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

  // Auto-rotate through alerts
  useEffect(() => {
    if (!autoRotate || !alerts.length) return;
    
    const interval = setInterval(() => {
      setCurrentAlertIndex((prevIndex) => {
        const newIndex = (prevIndex + 1) % alerts.length;
        console.log(`🔄 Auto-rotating to alert ${newIndex + 1}/${alerts.length}`);
        return newIndex;
      });
    }, 10000); // Rotate every 10 seconds
    
    return () => clearInterval(interval);
  }, [autoRotate, alerts.length]);

  // Reset alert index when alerts change
  useEffect(() => {
    if (currentAlertIndex >= alerts.length) {
      setCurrentAlertIndex(0);
    }
  }, [alerts.length, currentAlertIndex]);

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

  // Get current alert
  const getCurrentAlert = () => {
    if (!alerts.length || currentAlertIndex >= alerts.length) return null;
    return alerts[currentAlertIndex];
  };

  // Handle manual alert selection
  const selectAlert = (index) => {
    if (index >= 0 && index < alerts.length) {
      setCurrentAlertIndex(index);
      setAutoRotate(false); // Stop auto-rotation when manually selected
      console.log(`🖦️ Manual alert selection: ${index + 1}/${alerts.length}`);
      
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
          description: `${alert.title?.substring(0, 30)}...`,
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
          title: 'Priority Changed',
          description: `Set to ${override.priority} priority`,
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
        description: note.note.substring(0, 40) + '...',
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
        description: message.message.substring(0, 35) + '...',
        timestamp: new Date(message.timestamp).getTime()
      });
    });
    
    // Sort by timestamp (most recent first)
    activities.sort((a, b) => b.timestamp - a.timestamp);
    
    // Take only recent activities
    const recentActivities = activities.slice(0, 8);
    
    if (recentActivities.length === 0) {
      return (
        <View style={styles.noActivity}>
          <Ionicons name="time-outline" size={20} color="#6B7280" />
          <Text style={styles.noActivityText}>No recent activity</Text>
          <Text style={styles.noActivitySubtext}>Supervisor actions will appear here</Text>
        </View>
      );
    }
    
    return recentActivities.map((activity) => (
      <View key={activity.id} style={styles.activityItem}>
        <View style={[styles.activityIcon, { backgroundColor: activity.iconColor }]}>
          <Ionicons name={activity.icon} size={12} color="#FFFFFF" />
        </View>
        
        <View style={styles.activityContent}>
          <Text style={styles.activityTitle}>{activity.title}</Text>
          <Text style={styles.activityDescription}>{activity.description}</Text>
          <Text style={styles.activityTimestamp}>
            {formatActivityTime(activity.timestamp)}
          </Text>
        </View>
      </View>

      {/* Supervisor Control Panel */}
      {enableSupervisorMode && supervisorPanelVisible && (
        <View style={styles.supervisorControlPanel}>
          <View style={styles.controlPanelHeader}>
            <View style={styles.controlPanelHeaderLeft}>
              <Ionicons name="person-circle" size={20} color="#FFFFFF" />
              <Text style={styles.controlPanelTitle}>SUPERVISOR CONTROL PANEL</Text>
              <Text style={styles.controlPanelSubtitle}>
                {supervisorName} ({supervisorId})
              </Text>
            </View>
            
            <View style={styles.connectionStatus}>
              <View style={[styles.statusDot, { backgroundColor: wsConnected ? '#10B981' : '#EF4444' }]} />
              <Text style={styles.connectionText}>
                {wsConnected ? `Connected • ${connectedDisplays || 0} displays` : 'Disconnected'}
              </Text>
              {lastError && (
                <TouchableOpacity onPress={clearError} style={styles.errorButton}>
                  <Text style={styles.errorText}>{lastError}</Text>
                  <Ionicons name="close-circle" size={16} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          <View style={styles.controlPanelContent}>
            <View style={styles.modeSelector}>
              <Text style={styles.modeSelectorLabel}>Display Mode:</Text>
              <View style={styles.modeButtons}>
                {['normal', 'emergency', 'maintenance'].map(mode => (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.modeButton,
                      displayMode === mode && styles.modeButtonActive
                    ]}
                    onPress={() => handleModeChange(mode)}
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
            
            <View style={styles.statsContainer}>
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
                <Text style={styles.statValue}>{customMessages.length}</Text>
                <Text style={styles.statLabel}>Messages</Text>
              </View>
            </View>
          </View>
        </View>
      )}
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
          
          {enableSupervisorMode && (
            <View style={styles.supervisorControls}>
              <TouchableOpacity 
                style={[styles.supervisorControlButton, { backgroundColor: supervisorPanelVisible ? '#EF4444' : '#7C3AED' }]}
                onPress={() => setSupervisorPanelVisible(!supervisorPanelVisible)}
              >
                <Ionicons name={supervisorPanelVisible ? "close" : "settings"} size={16} color="#FFFFFF" />
                <Text style={styles.supervisorControlText}>
                  {supervisorPanelVisible ? 'CLOSE' : 'CONTROLS'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.supervisorControlButton, { backgroundColor: '#059669' }]}
                onPress={() => setShowBroadcastModal(true)}
              >
                <Ionicons name="megaphone" size={16} color="#FFFFFF" />
                <Text style={styles.supervisorControlText}>BROADCAST</Text>
              </TouchableOpacity>
            </View>
          )}
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

      {/* Main Content - Side by Side Layout */}
      <View style={styles.mainContent}>
        {/* Map Section - 40% */}
        <View style={styles.mapSectionSideBySide}>
          <View style={styles.mapHeader}>
            <View style={styles.mapHeaderLeft}>
              <Ionicons name="map" size={20} color="#FFFFFF" />
              <Text style={styles.mapTitle}>LIVE TRAFFIC MAP</Text>
              {alerts.length > 0 && (
                <Text style={styles.mapAlertCounter}>
                  Alert {currentAlertIndex + 1} of {alerts.length}
                </Text>
              )}
            </View>
            
            <View style={styles.mapControls}>
              {alerts.length > 1 && (
                <>
                  <TouchableOpacity 
                    style={styles.mapControlButton}
                    onPress={() => selectAlert((currentAlertIndex - 1 + alerts.length) % alerts.length)}
                  >
                    <Ionicons name="chevron-back" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.mapControlButton,
                      { backgroundColor: autoRotate ? '#10B981' : '#6B7280' }
                    ]}
                    onPress={toggleAutoRotate}
                  >
                    <Ionicons 
                      name={autoRotate ? "play" : "pause"} 
                      size={14} 
                      color="#FFFFFF" 
                    />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.mapControlButton}
                    onPress={() => selectAlert((currentAlertIndex + 1) % alerts.length)}
                  >
                    <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
          
          <View style={styles.mapContainerSideBySide}>
            <TrafficMap 
              alerts={alerts}
              currentAlert={getCurrentAlert()}
              alertIndex={currentAlertIndex}
            />
          </View>
        </View>

        {/* Center Supervisor Section - 20% */}
        <View style={styles.supervisorSection}>
          {/* Online Supervisors - Top Half */}
          <View style={styles.onlineSupervisors}>
            <View style={styles.supervisorSectionHeader}>
              <Ionicons name="people" size={18} color="#FFFFFF" />
              <Text style={styles.supervisorSectionTitle}>SUPERVISORS ONLINE</Text>
              <View style={[
                styles.onlineCount,
                { backgroundColor: connectedSupervisors > 0 ? '#10B981' : '#6B7280' }
              ]}>
                <Text style={styles.onlineCountText}>{connectedSupervisors}</Text>
              </View>
            </View>
            
            <ScrollView style={styles.supervisorsList} showsVerticalScrollIndicator={false}>
              {connectedSupervisors === 0 ? (
                <View style={styles.noSupervisorsOnline}>
                  <Ionicons name="person-outline" size={24} color="#6B7280" />
                  <Text style={styles.noSupervisorsText}>No supervisors online</Text>
                  <Text style={styles.waitingText}>Waiting for login...</Text>
                </View>
              ) : (
                activeSupervisors?.map((supervisor, index) => (
                  <View key={supervisor.id || index} style={styles.supervisorOnlineItem}>
                    <View style={[
                      styles.supervisorOnlineAvatar,
                      { backgroundColor: supervisor.isAdmin ? '#7C3AED' : '#3B82F6' }
                    ]}>
                      <Text style={styles.supervisorInitials}>
                        {(supervisor.name || 'S').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    
                    <View style={styles.supervisorOnlineInfo}>
                      <Text style={styles.supervisorOnlineName}>
                        {supervisor.name || `Supervisor ${index + 1}`}
                      </Text>
                      <Text style={styles.supervisorOnlineRole}>
                        {supervisor.role || 'Traffic Supervisor'}
                      </Text>
                      <Text style={styles.supervisorOnlineTime}>
                        Online {formatLoginTime(supervisor.loginTime)}
                      </Text>
                    </View>
                    
                    <View style={[
                      styles.supervisorOnlineStatus,
                      { backgroundColor: supervisor.status === 'active' ? '#10B981' : '#F59E0B' }
                    ]} />
                  </View>
                ))
              )}
            </ScrollView>
          </View>
          
          {/* Supervisor Activity - Bottom Half */}
          <View style={styles.supervisorActivity}>
            <View style={styles.supervisorSectionHeader}>
              <Ionicons name="document-text" size={18} color="#FFFFFF" />
              <Text style={styles.supervisorSectionTitle}>SUPERVISOR ACTIVITY</Text>
              <View style={styles.activityIndicator}>
                <View style={styles.activityDot} />
                <Text style={styles.activityText}>LIVE</Text>
              </View>
            </View>
            
            <ScrollView style={styles.activityList} showsVerticalScrollIndicator={false}>
              {renderSupervisorActivity()}
            </ScrollView>
          </View>
        </View>

        {/* Alerts Feed - 40% */}
        <View style={styles.alertsFeedSideBySide}>
          <View style={styles.alertsHeader}>
            <View style={styles.alertsHeaderLeft}>
              <Ionicons name="alert-circle" size={20} color="#FFFFFF" />
              <Text style={styles.alertsTitle}>ACTIVE ALERTS</Text>
              <Text style={styles.alertsCounter}>
                {alerts.length} Alert{alerts.length !== 1 ? 's' : ''}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.refreshButtonSmall}
              onPress={refreshAlerts}
            >
              <Ionicons name="refresh" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.alertsScrollView} showsVerticalScrollIndicator={false}>
            {/* Custom Messages from Supervisors */}
            {customMessages.length > 0 && (
              <View style={styles.customMessagesInline}>
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

            {/* Alerts List */}
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
                  isAcknowledged && styles.alertCardAcknowledged,
                  index === currentAlertIndex && styles.alertCardSelected
                ]}
                onPress={() => {
                  console.log('Alert selected from display:', alert.id, 'index:', index);
                  selectAlert(index);
                }}
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
                    
                    {/* Supervisor Interactive Controls */}
                    {enableSupervisorMode && (
                      <View style={styles.supervisorControls}>
                        {!isAcknowledged ? (
                          <TouchableOpacity
                            style={[styles.supervisorActionButton, styles.acknowledgeButton]}
                            onPress={() => handleAcknowledgeAlert(alert)}
                          >
                            <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                            <Text style={styles.supervisorActionText}>Acknowledge</Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.acknowledgedBadge}>
                            <Ionicons name="checkmark-circle" size={16} color="#059669" />
                            <Text style={styles.acknowledgedText}>ACKNOWLEDGED</Text>
                          </View>
                        )}
                        
                        <TouchableOpacity
                          style={[styles.supervisorActionButton, styles.noteButton]}
                          onPress={() => handleAddNote(alert)}
                        >
                          <Ionicons name="create" size={16} color="#FFFFFF" />
                          <Text style={styles.supervisorActionText}>Add Note</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[styles.supervisorActionButton, styles.templateButton]}
                          onPress={() => {
                            setSelectedAlert(alert);
                            setShowMessageTemplates(true);
                          }}
                        >
                          <Ionicons name="chatbubbles" size={16} color="#FFFFFF" />
                          <Text style={styles.supervisorActionText}>Quick Message</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    
                    {/* Priority Override Buttons */}
                    {enableSupervisorMode && (
                      <View style={styles.priorityControls}>
                        <Text style={styles.priorityControlLabel}>Priority Override:</Text>
                        <View style={styles.priorityButtons}>
                          {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(level => (
                            <TouchableOpacity
                              key={level}
                              style={[
                                styles.priorityButton,
                                priorityOverride?.priority === level && styles.priorityButtonActive,
                                { backgroundColor: getPriorityColor(level), opacity: priorityOverride?.priority === level ? 1 : 0.7 }
                              ]}
                              onPress={() => handleUpdatePriority(alert, level)}
                            >
                              <Text style={styles.priorityButtonText}>{level}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}
                    
                    {!enableSupervisorMode && !isAcknowledged && (isCritical || isUrgent) && (
                      <View style={styles.acknowledgementPrompt}>
                        <Ionicons name="hand-left" size={16} color={priorityColor} />
                        <Text style={[styles.ackText, { color: priorityColor }]}>
                          TAP TO ACKNOWLEDGE
                        </Text>
                      </View>
                    )}
                    
                    {!enableSupervisorMode && isAcknowledged && (
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
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Go North East Control Room • 24/7 Traffic Intelligence • Supervisor Display
        </Text>
        <Text style={styles.instructionText}>
          TAP alerts to acknowledge • Critical alerts require immediate supervisor review
        </Text>
      </View>

      {/* Broadcast Modal */}
      {enableSupervisorMode && (
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
      )}
      
      {/* Message Templates Modal */}
      {enableSupervisorMode && (
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
      )}
      
      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Processing...</Text>
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
    marginBottom: 12,
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
    padding: 12,
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
    flexDirection: 'row',
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
});

export default DisplayScreen;
