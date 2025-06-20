// Go_BARRY/components/SupervisorControl.jsx
// Enhanced Supervisor Control Panel with real-time sync
// Improved supervisor identity display, session management, and polling-based updates

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Modal,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupervisorPolling, CONNECTION_STATES } from './hooks/useSupervisorPolling';
import MessageTemplates from './MessageTemplates';
import RoadworksDatabase from './RoadworksDatabase';
import MonitoringDashboard from './MonitoringDashboard';
import { useSupervisorSession } from './hooks/useSupervisorSession';
import SupervisorLogin from './SupervisorLogin';
import SupervisorManagement from './SupervisorManagement';
// Simple Alert Card component for supervisor control
const SimpleAlertCard = ({ alert, supervisorSession, onDismiss, onAcknowledge, style }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'red': return '#EF4444';
      case 'amber': return '#F59E0B';
      case 'green': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'High': return '#DC2626';
      case 'Medium': return '#D97706';
      case 'Low': return '#059669';
      default: return '#4B5563';
    }
  };

  return (
    <View style={[
      {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginVertical: 4,
        borderLeftWidth: 4,
        borderLeftColor: getStatusColor(alert.status),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
      },
      style
    ]}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 }}>
            {alert.title || 'Traffic Alert'}
          </Text>
          <Text style={{ fontSize: 14, color: '#6B7280' }}>
            {alert.location || 'Location not specified'}
          </Text>
        </View>
        <View style={[
          {
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
            backgroundColor: getSeverityColor(alert.severity)
          }
        ]}>
          <Text style={{ fontSize: 12, color: '#FFFFFF', fontWeight: '600' }}>
            {alert.severity || 'Unknown'}
          </Text>
        </View>
      </View>

      {/* Description */}
      {alert.description && (
        <Text style={{ fontSize: 14, color: '#374151', marginBottom: 12, lineHeight: 20 }}>
          {alert.description}
        </Text>
      )}

      {/* Routes affected with frequency info */}
      {alert.affectsRoutes && alert.affectsRoutes.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Affects Routes:</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
            {alert.affectsRoutes.slice(0, 6).map((route, index) => {
              const frequency = alert.routeFrequencySummaries?.[route] || '';
              const impactCategory = alert.routeFrequencies?.[route]?.overall?.category;
              const isHighFreq = impactCategory === 'high-frequency';
              
              return (
                <View key={index} style={[
                  {
                    backgroundColor: isHighFreq ? '#FEF3C7' : '#EFF6FF',
                    borderColor: isHighFreq ? '#F59E0B' : '#3B82F6',
                    borderWidth: 1,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 4
                  }
                ]}>
                  <Text style={{ fontSize: 11, color: isHighFreq ? '#D97706' : '#3B82F6', fontWeight: '600' }}>
                    {route} {frequency && `(${frequency})`}
                  </Text>
                </View>
              );
            })}
            {alert.affectsRoutes.length > 6 && (
              <Text style={{ fontSize: 11, color: '#6B7280', alignSelf: 'center' }}>
                +{alert.affectsRoutes.length - 6} more
              </Text>
            )}
          </View>
          {alert.frequencyImpact && (
            <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[
                {
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 4,
                  backgroundColor: alert.frequencyImpact.impactLevel === 'severe' ? '#DC2626' :
                               alert.frequencyImpact.impactLevel === 'major' ? '#F59E0B' : '#3B82F6'
                }
              ]}>
                <Text style={{ fontSize: 10, color: '#FFFFFF', fontWeight: '700' }}>
                  {alert.frequencyImpact.impactLevel.toUpperCase()} SERVICE IMPACT
                </Text>
              </View>
              {alert.frequencyImpact.affectedHighFrequency.length > 0 && (
                <Text style={{ fontSize: 11, color: '#DC2626', fontWeight: '600' }}>
                  ⚠️ Affects {alert.frequencyImpact.affectedHighFrequency.length} high-frequency route{alert.frequencyImpact.affectedHighFrequency.length > 1 ? 's' : ''}
                </Text>
              )}
            </View>
          )}
        </View>
      )}

      {/* Supervisor Actions */}
      {supervisorSession && (
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          paddingTop: 12, 
          borderTopWidth: 1, 
          borderTopColor: '#F3F4F6' 
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ fontSize: 12, color: '#6B7280' }}>
              {alert.type || 'Alert'} • {alert.status || 'Unknown'}
            </Text>
            {alert.lastUpdated && (
              <Text style={{ fontSize: 12, color: '#6B7280' }}>
                {new Date(alert.lastUpdated).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
          </View>
          
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={{
                backgroundColor: '#F59E0B',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4
              }}
              onPress={() => onAcknowledge && onAcknowledge(alert.id)}
            >
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              <Text style={{ fontSize: 12, color: '#FFFFFF', fontWeight: '600' }}>ACK</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: '#3B82F6',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4
              }}
              onPress={() => openIncidentMap(alert)}
            >
              <Ionicons name="map" size={14} color="#FFFFFF" />
              <Text style={{ fontSize: 12, color: '#FFFFFF', fontWeight: '600' }}>MAP</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: '#EF4444',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4
              }}
              onPress={() => onDismiss && onDismiss(alert.id, 'Supervisor dismissed', 'Supervisor action')}
            >
              <Ionicons name="close" size={14} color="#FFFFFF" />
              <Text style={{ fontSize: 12, color: '#FFFFFF', fontWeight: '600' }}>DISMISS</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const isWeb = Platform.OS === 'web';
const API_BASE = 'https://go-barry.onrender.com';

// Helper function to format activity details
const formatActivityDetails = (action, details) => {
  if (!details) return action;
  
  switch (action) {
    case 'supervisor_login':
      return `${details.supervisor_name || 'Supervisor'} logged in`;
    case 'supervisor_logout':
      return `${details.supervisor_name || 'Supervisor'} logged out`;
    case 'alert_dismissed':
      return `Dismissed alert at ${details.location || 'unknown location'}: ${details.reason || 'No reason'}`;
    case 'roadwork_created':
      return `Created roadwork at ${details.location || 'unknown location'} (${details.severity || 'Unknown'} severity)`;
    case 'email_sent':
      return `Sent ${details.type || 'notification'} email to ${details.recipients?.length || 0} recipients`;
    case 'duty_started':
      return `Started Duty ${details.duty_number || 'Unknown'}`;
    case 'duty_ended':
      return `Ended Duty ${details.duty_number || 'Unknown'}`;
    case 'alert_acknowledged':
      return `Acknowledged alert: ${details.reason || 'No reason'}`;
    case 'priority_updated':
      return `Updated alert priority to ${details.priority || 'Unknown'}`;
    case 'note_added':
      return `Added note to alert: ${details.note || ''}`;
    case 'message_broadcast':
      return `Broadcast message: "${details.message || ''}" (${details.priority || 'info'})`;
    default:
      return typeof details === 'object' ? JSON.stringify(details) : details;
  }
};

// Helper function for activity icons
const getActivityIcon = (type) => {
  switch (type) {
    case 'supervisor_login':
    case 'LOGIN':
      return { name: 'log-in', color: '#3B82F6' };
    case 'supervisor_logout':
    case 'LOGOUT':
      return { name: 'log-out', color: '#6B7280' };
    case 'alert_dismissed':
    case 'DISMISS_ALERT':
      return { name: 'close-circle', color: '#EF4444' };
    case 'roadwork_created':
      return { name: 'construct', color: '#F59E0B' };
    case 'email_sent':
      return { name: 'mail', color: '#10B981' };
    case 'duty_started':
      return { name: 'play-circle', color: '#8B5CF6' };
    case 'duty_ended':
      return { name: 'stop-circle', color: '#8B5CF6' };
    case 'alert_acknowledged':
      return { name: 'checkmark-circle', color: '#059669' };
    case 'priority_updated':
      return { name: 'flag', color: '#F59E0B' };
    case 'note_added':
      return { name: 'create', color: '#6B7280' };
    case 'message_broadcast':
      return { name: 'megaphone', color: '#3B82F6' };
    default:
      return { name: 'information-circle', color: '#6B7280' };
  }
};

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
  supervisorSession: passedSession, // Accept passed session
  alerts = [],
  onClose,
  sector = 1 // Sector 1: Supervisor Control
}) => {
  // Get session management functions - FIXED: Use the hook properly
  const { 
    supervisorSession: hookSession,
    getSupervisorActivity, 
    logout,
    login,
    isLoading: sessionLoading,
    error: sessionError
  } = useSupervisorSession();
  
  // State for login modal
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // Use passed session or hook session
  const session = passedSession || hookSession || null;
  
  // Debug logging - Enhanced
  useEffect(() => {
    console.log('🔍 SupervisorControl Session Debug:', {
      passedSession,
      hookSession,
      finalSession: session,
      hasValidSession: !!session?.sessionId,
      supervisorId,
      supervisorName,
      sessionId,
      supervisorData: session?.supervisor,
      duty: session?.supervisor?.duty
    });
    
    // Check if we have a valid session
    if (!session || !session.sessionId) {
      console.warn('⚠️ No valid session found');
      // Don't automatically show login modal - let the parent component handle it
    } else {
      console.log('✅ Valid session found:', session.supervisor?.name);
    }
  }, [session, passedSession, hookSession, supervisorId, supervisorName, sessionId]);
  
  // Extract supervisor info from session or props
  const supervisorData = session?.supervisor || passedSession?.supervisor || {};
  const displayName = supervisorData?.name || supervisorName || 'Unknown';
  const supervisorBadge = supervisorData?.badge || supervisorName?.match(/\((\w+)\)/)?.[1] || '';
  const supervisorDuty = supervisorData?.duty || {};
  const loginTime = session?.loginTime || passedSession?.loginTime;
  
  // Check if supervisor is admin (AG003 or BP009) - Enhanced check
  const isAdmin = useMemo(() => {
    // Check multiple sources for admin status
    const badgeCheck = supervisorBadge === 'AG003' || supervisorBadge === 'BP009';
    const sessionCheck = session?.supervisor?.isAdmin || passedSession?.supervisor?.isAdmin;
    const roleCheck = supervisorData?.role?.toLowerCase().includes('admin') || 
                      supervisorData?.role?.toLowerCase().includes('developer');
    
    // Return true if any check passes
    const result = badgeCheck || sessionCheck || roleCheck;
    
    console.log('🔐 Admin access check:', {
      badge: supervisorBadge,
      badgeCheck,
      sessionCheck,
      roleCheck,
      finalResult: result
    });
    
    return result;
  }, [supervisorBadge, session, passedSession, supervisorData]);
  
  // Session timer state
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(600); // 10 minutes
  const [recentActivity, setRecentActivity] = useState([]);
  const [showRouteFilter, setShowRouteFilter] = useState(false);
  const [selectedRoutes, setSelectedRoutes] = useState([]);
  const [handoverNotes, setHandoverNotes] = useState('');
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [showSupervisorManagement, setShowSupervisorManagement] = useState(false);
  
  // REMOVED: Aggressive localStorage cleanup that was preventing login
  // The session management should be handled by the useSupervisorSession hook
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
  const [showMessageTemplates, setShowMessageTemplates] = useState(false);
  const [showDisplayQueue, setShowDisplayQueue] = useState(false);
  const [showRoadworksDatabase, setShowRoadworksDatabase] = useState(false);
  const [showMonitoringDashboard, setShowMonitoringDashboard] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Display queue state
  const [displayQueue, setDisplayQueue] = useState([]);

  // Sync alerts when they change
  useEffect(() => {
    if (isConnected && alerts.length > 0) {
      updateAlerts(alerts);
    }
  }, [alerts, isConnected, updateAlerts]);

  // Session timer effect
  useEffect(() => {
    if (!loginTime) return;
    
    const timer = setInterval(() => {
      const elapsed = Date.now() - new Date(loginTime).getTime();
      const remaining = Math.max(0, 600 - Math.floor(elapsed / 1000)); // 10 minutes
      setSessionTimeRemaining(remaining);
      
      // Auto-logout at 0
      if (remaining === 0) {
        showNotification('Session expired. Please log in again.', 'warning');
        logout();
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [loginTime, logout]);
  
  // Load recent activity from backend
  useEffect(() => {
    const loadActivity = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/activity-logs?limit=20`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.logs) {
            // Transform backend format to match frontend expectations
            const transformedActivity = data.logs.map(log => ({
              id: log.id,
              type: log.action,
              details: typeof log.details === 'string' ? log.details : 
                     formatActivityDetails(log.action, log.details),
              timestamp: log.created_at,
              supervisorName: log.supervisor_name,
              supervisorId: log.supervisor_id
            }));
            setRecentActivity(transformedActivity);
          }
        }
      } catch (error) {
        console.error('❌ Error loading activity:', error);
      }
    };
    
    loadActivity();
    const interval = setInterval(loadActivity, 30000); // Refresh every 30s
    
    return () => clearInterval(interval);
  }, []);
  
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

  // Handle opening map for incident
  const openIncidentMap = useCallback((alert) => {
    if (!alert) return;
    
    let mapUrl;
    
    // Check if incident has coordinates
    if (alert.coordinates && Array.isArray(alert.coordinates) && alert.coordinates.length === 2) {
      const [lat, lng] = alert.coordinates;
      // Use Google Maps with coordinates (more reliable for supervisor use)
      mapUrl = `https://www.google.com/maps?q=${lat},${lng}&zoom=16&t=m`;
      console.log(`🗺️ Opening map with coordinates: ${lat}, ${lng}`);
    } else if (alert.location) {
      // Fallback to location search
      const encodedLocation = encodeURIComponent(`${alert.location}, UK`);
      mapUrl = `https://www.google.com/maps/search/${encodedLocation}`;
      console.log(`🗺️ Opening map with location search: ${alert.location}`);
    } else {
      // Final fallback to general Newcastle area
      mapUrl = 'https://www.google.com/maps?q=Newcastle+upon+Tyne,+UK&zoom=12';
      console.log('🗺️ Opening map with fallback to Newcastle area');
      showNotification('No specific location available, showing Newcastle area', 'info');
    }
    
    // Open in new tab/window
    if (isWeb) {
      window.open(mapUrl, '_blank', 'noopener,noreferrer');
    } else {
      // For mobile, could integrate with native maps
      console.log('📱 Map URL for mobile:', mapUrl);
      showNotification('Map feature optimized for web supervisor interface', 'info');
    }
  }, [showNotification]);

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

  // Format session time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Get alert stats
  const getAlertStats = () => {
    const severityCount = {
      High: alerts.filter(a => a.severity === 'High').length,
      Medium: alerts.filter(a => a.severity === 'Medium').length,
      Low: alerts.filter(a => a.severity === 'Low').length
    };
    
    const avgResponseTime = recentActivity
      .filter(a => a.type === 'DISMISS_ALERT')
      .slice(0, 5)
      .reduce((acc, act, idx, arr) => {
        if (idx === 0) return 0;
        const timeDiff = new Date(act.timestamp) - new Date(arr[idx - 1].timestamp);
        return acc + timeDiff;
      }, 0) / Math.max(1, recentActivity.filter(a => a.type === 'DISMISS_ALERT').length - 1);
    
    return { severityCount, avgResponseTime };
  };

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

  // Handover modal
  const HandoverModal = () => (
    <Modal
      visible={showHandoverModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowHandoverModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Shift Handover Notes</Text>
            <TouchableOpacity onPress={() => setShowHandoverModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={styles.handoverInput}
            placeholder="Enter handover notes for the next shift..."
            value={handoverNotes}
            onChangeText={setHandoverNotes}
            multiline
            numberOfLines={6}
            placeholderTextColor="#9CA3AF"
          />
          
          <View style={styles.handoverInfo}>
            <Ionicons name="information-circle" size={16} color="#3B82F6" />
            <Text style={styles.handoverInfoText}>
              These notes will be visible to the next supervisor on {supervisorDuty.name}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.saveHandoverButton}
            onPress={() => {
              showNotification('Handover notes saved', 'success');
              setShowHandoverModal(false);
            }}
          >
            <Ionicons name="save" size={20} color="#FFFFFF" />
            <Text style={styles.saveHandoverText}>Save Handover Notes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
  
  // Recent Activity Panel
  const RecentActivityPanel = () => (
    <View style={styles.activityPanel}>
      <View style={styles.activityHeader}>
        <Text style={styles.activityTitle}>Recent Activity</Text>
        <TouchableOpacity 
          onPress={() => {
            // Refresh activity immediately
            const loadActivity = async () => {
              try {
                const response = await fetch(`${API_BASE}/api/activity-logs?limit=20`);
                if (response.ok) {
                  const data = await response.json();
                  if (data.success && data.logs) {
                    const transformedActivity = data.logs.map(log => ({
                      id: log.id,
                      type: log.action,
                      details: typeof log.details === 'string' ? log.details : 
                             formatActivityDetails(log.action, log.details),
                      timestamp: log.created_at,
                      supervisorName: log.supervisor_name,
                      supervisorId: log.supervisor_id
                    }));
                    setRecentActivity(transformedActivity);
                  }
                }
              } catch (error) {
                console.error('❌ Error refreshing activity:', error);
              }
            };
            loadActivity();
          }}
          style={styles.refreshButton}
        >
          <Ionicons name="refresh" size={16} color="#3B82F6" />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.activityList} nestedScrollEnabled>
        {recentActivity.length > 0 ? (
          recentActivity.map((activity) => {
            const icon = getActivityIcon(activity.type);
            return (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Ionicons 
                    name={icon.name}
                    size={16} 
                    color={icon.color} 
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityText}>{activity.details}</Text>
                  <View style={styles.activityMeta}>
                    <Text style={styles.activitySupervisor}>
                      {activity.supervisorName || 'System'}
                    </Text>
                    <Text style={styles.activityTime}>
                      {new Date(activity.timestamp).toLocaleTimeString('en-GB', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.noActivityText}>No recent activity</Text>
        )}
      </ScrollView>
    </View>
  );

  // Handle login from modal
  const handleLogin = useCallback(async (loginData) => {
    setIsAuthenticating(true);
    setLoginError(null);
    
    try {
      console.log('🔐 Attempting login from SupervisorControl modal...');
      const result = await login(loginData);
      
      if (result && result.success) {
        console.log('✅ Login successful, closing modal');
        setShowLoginModal(false);
        showNotification('Login successful', 'success');
        // Force a small delay to ensure session is established
        setTimeout(() => {
          // Session should now be available
          console.log('🔍 Session after login:', session);
        }, 100);
      } else {
        console.error('❌ Login failed:', result?.error || 'Unknown error');
        setLoginError(result?.error || 'Login failed - please try again');
        showNotification(result?.error || 'Login failed', 'error');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      setLoginError(error.message || 'An error occurred during login');
      showNotification(error.message || 'Login failed', 'error');
    } finally {
      setIsAuthenticating(false);
    }
  }, [login, showNotification, session]);

  // Loading screen
  if (loading || sessionLoading || isAuthenticating) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>
          {isAuthenticating ? 'Authenticating...' : 'Connecting to control system...'}
        </Text>
      </View>
    );
  }
  
  // Show login modal if explicitly requested or no valid session
  if (showLoginModal && (!session || !session.sessionId)) {
    return (
      <Modal
        visible={true}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          setShowLoginModal(false);
          if (onClose) onClose();
        }}
      >
        <View style={styles.loginModalContainer}>
          <View style={styles.loginModalHeader}>
            <Text style={styles.loginModalTitle}>Supervisor Login Required</Text>
            <TouchableOpacity 
              onPress={() => {
                setShowLoginModal(false);
                if (onClose) onClose();
              }} 
              style={styles.loginModalClose}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          {(loginError || sessionError) && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={20} color="#DC2626" />
              <Text style={styles.errorBannerText}>
                {loginError || sessionError}
              </Text>
            </View>
          )}
          
          <SupervisorLogin
            visible={true}
            onClose={() => {
              setShowLoginModal(false);
              if (onClose) onClose();
            }}
            onLoginSuccess={(loginData) => {
              console.log('✅ Login success callback from SupervisorLogin');
              handleLogin(loginData);
            }}
            embedded={true}
          />
        </View>
      </Modal>
    );
  }

  // Main render
  
  // If no session and modal not showing, show login prompt
  if (!session || !session.sessionId) {
    if (!showLoginModal) {
      return (
        <View style={styles.loginPromptContainer}>
          <View style={styles.loginPromptCard}>
            <Ionicons name="shield-checkmark" size={48} color="#3B82F6" />
            <Text style={styles.loginPromptTitle}>Supervisor Login Required</Text>
            <Text style={styles.loginPromptText}>
              You need to log in to access supervisor controls
            </Text>
            <TouchableOpacity
              style={styles.loginPromptButton}
              onPress={() => setShowLoginModal(true)}
            >
              <Ionicons name="log-in" size={20} color="#FFFFFF" />
              <Text style={styles.loginPromptButtonText}>Log In Now</Text>
            </TouchableOpacity>
            {onClose && (
              <TouchableOpacity
                style={styles.loginPromptCancelButton}
                onPress={onClose}
              >
                <Text style={styles.loginPromptCancelText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }
  }
  
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
          <Image 
            source={require('../assets/gobarry-logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.supervisorIdentity}>
            <Text style={styles.supervisorNameHeader}>
              {displayName} {supervisorBadge && `(${supervisorBadge})`}
            </Text>
            <Text style={styles.dutyInfo}>
              {supervisorDuty?.name || supervisorDuty?.id || 'No duty selected'}
            </Text>
            {supervisorData?.role && (
              <Text style={styles.roleInfo}>
                {supervisorData.role}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.headerRight}>
          <View style={styles.sessionTimer}>
            <Ionicons name="timer" size={16} color={sessionTimeRemaining < 120 ? '#EF4444' : '#6B7280'} />
            <Text style={[styles.sessionTimerText, sessionTimeRemaining < 120 && styles.sessionTimerWarning]}>
              Session: {formatTime(sessionTimeRemaining)}
            </Text>
          </View>
          <ConnectionStatus />
          {onClose && (
            <TouchableOpacity onPress={logout} style={styles.logoutButton}>
              <Ionicons name="log-out" size={20} color="#EF4444" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.controlBar}>
        <View style={styles.controlButtonGroup}>
          <TouchableOpacity
            style={[styles.controlButton, styles.queueControlButton]}
            onPress={() => setShowDisplayQueue(true)}
          >
            <Ionicons name="list" size={20} color="#FFFFFF" />
            <Text style={styles.controlButtonText}>Display Queue</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, styles.roadworksControlButton]}
            onPress={() => setShowRoadworksDatabase(true)}
          >
            <Ionicons name="construct" size={20} color="#FFFFFF" />
            <Text style={styles.controlButtonText}>Roadworks Database</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, styles.handoverControlButton]}
            onPress={() => setShowHandoverModal(true)}
          >
            <Ionicons name="clipboard" size={20} color="#FFFFFF" />
            <Text style={styles.controlButtonText}>Handover Notes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, styles.filterControlButton]}
            onPress={() => setShowRouteFilter(!showRouteFilter)}
          >
            <Ionicons name="filter" size={20} color="#FFFFFF" />
            <Text style={styles.controlButtonText}>Route Filter</Text>
            {selectedRoutes.length > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{selectedRoutes.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          
          {isAdmin && (
            <>
              <TouchableOpacity
                style={[styles.controlButton, styles.monitoringControlButton]}
                onPress={() => setShowMonitoringDashboard(true)}
              >
                <Ionicons name="analytics" size={20} color="#FFFFFF" />
                <Text style={styles.controlButtonText}>System Monitor</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.controlButton, styles.supervisorManagementButton]}
                onPress={() => setShowSupervisorManagement(true)}
              >
                <Ionicons name="people" size={20} color="#FFFFFF" />
                <Text style={styles.controlButtonText}>Manage Supervisors</Text>
              </TouchableOpacity>
            </>
          )}
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

      {/* Service Frequency Impact Summary */}
      {(() => {
        const highFreqAlerts = alerts.filter(a => 
          a.frequencyImpact?.affectedHighFrequency?.length > 0
        );
        const severeImpact = alerts.filter(a => 
          a.frequencyImpact?.impactLevel === 'severe'
        );
        
        if (highFreqAlerts.length > 0 || severeImpact.length > 0) {
          return (
            <View style={styles.frequencyImpactBar}>
              <Text style={styles.frequencyImpactTitle}>🚌 Service Frequency Impact</Text>
              <View style={styles.frequencyStats}>
                {highFreqAlerts.length > 0 && (
                  <View style={[styles.frequencyStat, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={styles.frequencyStatValue}>{highFreqAlerts.length}</Text>
                    <Text style={styles.frequencyStatLabel}>High-Freq Disrupted</Text>
                  </View>
                )}
                {severeImpact.length > 0 && (
                  <View style={[styles.frequencyStat, { backgroundColor: '#FEE2E2' }]}>
                    <Text style={styles.frequencyStatValue}>{severeImpact.length}</Text>
                    <Text style={styles.frequencyStatLabel}>Severe Impact</Text>
                  </View>
                )}
              </View>
            </View>
          );
        }
        return null;
      })()}

      <View style={styles.mainContent}>
        <View style={styles.leftPanel}>
          <ScrollView style={styles.alertsList} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Active Alerts ({alerts.length})</Text>
            
            {alerts.length > 0 ? (
          alerts.map((alert) => (
            <View key={alert.id} style={styles.alertWrapper}>
              <SimpleAlertCard
                alert={alert}
                supervisorSession={{
                  supervisor: {
                    name: supervisorName,
                    badge: supervisorBadge,
                    role: session?.supervisor?.role || 'Supervisor'
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
        </View>
        
        <View style={styles.rightPanel}>
          <RecentActivityPanel />
          
          <View style={styles.quickStats}>
            <Text style={styles.quickStatsTitle}>Quick Stats</Text>
            {(() => {
              const stats = getAlertStats();
              return (
                <>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>High Severity:</Text>
                    <Text style={[styles.statValue, { color: '#DC2626' }]}>
                      {stats.severityCount.High}
                    </Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Medium Severity:</Text>
                    <Text style={[styles.statValue, { color: '#F59E0B' }]}>
                      {stats.severityCount.Medium}
                    </Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Low Severity:</Text>
                    <Text style={[styles.statValue, { color: '#10B981' }]}>
                      {stats.severityCount.Low}
                    </Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Avg Response:</Text>
                    <Text style={styles.statValue}>
                      {stats.avgResponseTime > 0 ? 
                        `${Math.round(stats.avgResponseTime / 60000)}m` : 
                        'N/A'
                      }
                    </Text>
                  </View>
                </>
              );
            })()}
          </View>
        </View>
      </View>
      
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
      
      {/* Roadworks Database Modal */}
      <Modal
        visible={showRoadworksDatabase}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowRoadworksDatabase(false)}
      >
        <View style={styles.roadworksModalContainer}>
          <View style={styles.roadworksModalHeader}>
            <Text style={styles.roadworksModalTitle}>Roadworks Management Database</Text>
            <TouchableOpacity 
              onPress={() => setShowRoadworksDatabase(false)}
              style={styles.roadworksCloseButton}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <RoadworksDatabase />
        </View>
      </Modal>
      
      <HandoverModal />
      <DisplayQueueModal />
      
      {/* Monitoring Dashboard Modal - Admin Only */}
      {isAdmin && (
        <Modal
          visible={showMonitoringDashboard}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setShowMonitoringDashboard(false)}
        >
          <View style={styles.monitoringModalContainer}>
            <View style={styles.monitoringModalHeader}>
              <Text style={styles.monitoringModalTitle}>System Monitoring Dashboard</Text>
              <TouchableOpacity 
                onPress={() => setShowMonitoringDashboard(false)}
                style={styles.monitoringCloseButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <MonitoringDashboard 
              supervisorInfo={{
                name: supervisorName,
                badge: supervisorBadge,
                isAdmin: true
              }}
            />
          </View>
        </Modal>
      )}
      
      {/* Supervisor Management Modal - Admin Only */}
      {isAdmin && (
        <SupervisorManagement
          visible={showSupervisorManagement}
          onClose={() => setShowSupervisorManagement(false)}
          sessionId={sessionId || session?.sessionId || passedSession?.sessionId}
          adminInfo={{
            name: displayName,
            badge: supervisorBadge,
            id: supervisorData?.id
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    ...Platform.select({
      web: { paddingTop: 20 },
      default: { paddingTop: 44 }
    }),
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },

  subtitle: {
    fontSize: 16,
    color: '#4B5563',
    marginTop: 2,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  closeButton: {
    padding: 8,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backdropFilter: 'blur(10px)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  connectionText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
    letterSpacing: 0.2,
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
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    backdropFilter: 'blur(15px)',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
    flexWrap: 'wrap',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    transform: [{ scale: 1 }],
  },
  broadcastControlButton: {
    backgroundColor: '#8B5CF6',
  },
  templatesButton: {
    backgroundColor: '#059669',
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
    textShadow: '0 1px 2px rgba(0,0,0,0.1)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(20px)',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.03)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    backdropFilter: 'blur(10px)',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 6,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  alertsList: {
    flex: 1,
    padding: 20,
    paddingTop: 24,
  },
  alertWrapper: {
    marginBottom: 8,
  },
  expandControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.04)',
    borderRadius: 12,
    marginTop: -8,
    marginHorizontal: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  expandControlsText: {
    color: '#3B82F6',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
    letterSpacing: -0.3,
    paddingLeft: 4,
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
    paddingVertical: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    marginHorizontal: 4,
    borderRadius: 20,
    backdropFilter: 'blur(10px)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  noAlertsText: {
    fontSize: 18,
    color: '#10B981',
    marginTop: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
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
  frequencyImpactBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
  },
  frequencyImpactTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  frequencyStats: {
    flexDirection: 'row',
    gap: 12,
  },
  frequencyStat: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 120,
  },
  frequencyStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  frequencyStatLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '600',
  },
  // Control Button Group
  controlButtonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  queueControlButton: {
    backgroundColor: '#10B981',
  },
  roadworksControlButton: {
    backgroundColor: '#F59E0B',
  },
  roadworksModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  roadworksModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...Platform.select({
      web: { paddingTop: 16 },
      default: { paddingTop: 44 }
    }),
  },
  roadworksModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  roadworksCloseButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  monitoringControlButton: {
    backgroundColor: '#7C3AED', // Purple for admin features
    position: 'relative',
    zIndex: 10, // Ensure it's above other elements
    elevation: 10, // For Android shadow
  },
  supervisorManagementButton: {
    backgroundColor: '#EC4899', // Pink for supervisor management
    position: 'relative',
    zIndex: 10,
    elevation: 10,
  },
  monitoringModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  monitoringModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...Platform.select({
      web: { paddingTop: 16 },
      default: { paddingTop: 44 }
    }),
  },
  monitoringModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  monitoringCloseButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  // New styles for enhanced supervisor identity
  supervisorIdentity: {
    marginLeft: 8,
  },
  supervisorNameHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 0.2,
  },
  dutyInfo: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  roleInfo: {
    fontSize: 12,
    color: '#8B5CF6',
    marginTop: 2,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  sessionTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sessionTimerText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  sessionTimerWarning: {
    color: '#EF4444',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  logoutText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  handoverControlButton: {
    backgroundColor: '#8B5CF6',
  },
  filterControlButton: {
    backgroundColor: '#6B7280',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  handoverInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  handoverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  handoverInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#3B82F6',
  },
  saveHandoverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#8B5CF6',
  },
  saveHandoverText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  leftPanel: {
    flex: 2,
  },
  rightPanel: {
    flex: 1,
    padding: 20,
    paddingTop: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0, 0, 0, 0.06)',
  },
  activityPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  refreshButton: {
    padding: 4,
  },
  activityList: {
    maxHeight: 300,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 2,
    lineHeight: 18,
  },
  activityMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activitySupervisor: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  noActivityText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 20,
  },
  quickStats: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickStatsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  // Login Modal Styles
  loginModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loginModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...Platform.select({
      web: { paddingTop: 16 },
      default: { paddingTop: 44 }
    }),
  },
  loginModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  loginModalClose: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    padding: 12,
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
  },
  // Login Prompt Styles
  loginPromptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 20,
  },
  loginPromptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  loginPromptTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  loginPromptText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  loginPromptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
  },
  loginPromptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginPromptCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  loginPromptCancelText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default SupervisorControl;