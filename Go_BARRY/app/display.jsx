// Go_BARRY/app/display.jsx
// Control Room Display Screen - Non-Interactive Information Display
// Shows live alerts and supervisor status - controlled remotely by supervisors

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DisplayScreen from '../components/DisplayScreen';
import SupervisorCard from '../components/SupervisorCard';
import { useSupervisorSync } from '../components/hooks/useSupervisorSync';
import { useBarryAPI } from '../components/hooks/useBARRYapi';
import { API_CONFIG } from '../config/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ControlRoomDisplay = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [displayMode, setDisplayMode] = useState('alerts'); // alerts, map, analytics

  // Live supervisor sync for display control
  const {
    connectionState,
    isConnected: wsConnected,
    acknowledgedAlerts,
    priorityOverrides,
    supervisorNotes,
    customMessages,
    activeMode,
    connectedSupervisors,
    activeSupervisors
  } = useSupervisorSync({
    clientType: 'display',
    autoConnect: true,
    onConnectionChange: (connected) => {
      console.log('🔌 Control Room Display:', connected ? 'Connected' : 'Disconnected');
    },
    onError: (error) => {
      console.error('❌ Display WebSocket error:', error);
    }
  });

  // API data for alerts
  const {
    alerts,
    loading,
    lastUpdated,
    criticalAlerts,
    activeAlerts
  } = useBarryAPI({
    autoRefresh: true,
    refreshInterval: 15000 // 15 seconds for control room
  });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen for display mode changes from supervisors
  useEffect(() => {
    if (activeMode && activeMode !== displayMode) {
      setDisplayMode(activeMode);
      console.log('📺 Display mode changed by supervisor:', activeMode);
    }
  }, [activeMode]);

  // Get connection status color
  const getConnectionColor = () => {
    if (!wsConnected) return '#EF4444'; // Red - disconnected
    if (loading) return '#F59E0B'; // Orange - loading
    return '#10B981'; // Green - connected
  };

  // Format time for display
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <View style={styles.container}>
      {/* Control Room Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>🚦</Text>
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.systemTitle}>GO BARRY Control Room</Text>
            <Text style={styles.displayTitle}>Live Traffic Intelligence Display</Text>
          </View>
        </View>
        
        <View style={styles.headerCenter}>
          <View style={styles.systemMetrics}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{alerts.length}</Text>
              <Text style={styles.metricLabel}>Active Alerts</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{criticalAlerts.length}</Text>
              <Text style={styles.metricLabel}>Critical</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{connectedSupervisors}</Text>
              <Text style={styles.metricLabel}>Supervisors</Text>
            </View>
            <View style={styles.metric}>
              <View style={[styles.connectionDot, { backgroundColor: getConnectionColor() }]} />
              <Text style={styles.metricLabel}>System Status</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          <Text style={styles.timeDisplay}>{formatTime(currentTime)}</Text>
          <Text style={styles.dateDisplay}>
            {currentTime.toLocaleDateString('en-GB', {
              weekday: 'short',
              day: 'numeric',
              month: 'short'
            })}
          </Text>
          <Text style={styles.lastUpdate}>
            Last Update: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString('en-GB') : 'Never'}
          </Text>
        </View>
      </View>

      {/* Supervisor Messages (Priority Display) */}
      {customMessages.length > 0 && (
        <View style={styles.supervisorMessages}>
          {customMessages.map(message => (
            <View 
              key={message.id} 
              style={[
                styles.priorityMessage,
                { borderLeftColor: message.priority === 'critical' ? '#DC2626' : 
                                  message.priority === 'warning' ? '#F59E0B' : '#3B82F6' }
              ]}
            >
              <View style={styles.messageHeader}>
                <Ionicons 
                  name={message.priority === 'critical' ? 'warning' : 
                       message.priority === 'warning' ? 'alert-circle' : 'information-circle'} 
                  size={20} 
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

      {/* Main Display Content */}
      <View style={styles.mainContent}>
        {/* Live Alert Display - Main Focus */}
        <View style={styles.alertsSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="alert-circle" size={24} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Live Traffic Alerts</Text>
            <View style={styles.alertBadge}>
              <Text style={styles.alertBadgeText}>{alerts.length}</Text>
            </View>
          </View>
          
          {/* Main Alert Display Component */}
          <View style={styles.alertDisplayContainer}>
            <DisplayScreen />
          </View>
        </View>

        {/* Supervisor Status Panel */}
        <View style={styles.supervisorSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people" size={24} color="#8B5CF6" />
            <Text style={styles.sectionTitle}>Supervisor Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: getConnectionColor() }]}>
              <Text style={styles.statusBadgeText}>{connectedSupervisors}</Text>
            </View>
          </View>
          
          {/* Supervisor Card - Always Visible */}
          <View style={styles.supervisorDisplay}>
            <SupervisorCard 
              supervisors={activeSupervisors || []}
              connectedCount={connectedSupervisors}
              onCardPress={() => {}} // Non-interactive
              style={styles.supervisorCardDisplay}
            />
            
            {/* Connection Status Details */}
            <View style={styles.connectionDetails}>
              <View style={styles.connectionItem}>
                <Ionicons 
                  name={wsConnected ? "wifi" : "wifi-outline"} 
                  size={16} 
                  color={getConnectionColor()} 
                />
                <Text style={[styles.connectionText, { color: getConnectionColor() }]}>
                  {wsConnected ? 'Connected to Supervisor System' : 'Supervisor System Offline'}
                </Text>
              </View>
              
              <View style={styles.connectionItem}>
                <Ionicons 
                  name={loading ? "sync" : "checkmark-circle"} 
                  size={16} 
                  color={loading ? '#F59E0B' : '#10B981'} 
                />
                <Text style={styles.connectionText}>
                  {loading ? 'Refreshing Data...' : 'Data Current'}
                </Text>
              </View>
              
              {acknowledgedAlerts.size > 0 && (
                <View style={styles.connectionItem}>
                  <Ionicons name="checkmark-done" size={16} color="#10B981" />
                  <Text style={styles.connectionText}>
                    {acknowledgedAlerts.size} alerts acknowledged by supervisors
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Control Room Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerText}>
            Go North East Control Room • Professional Traffic Intelligence Display
          </Text>
          <Text style={styles.footerSubtext}>
            Display controlled remotely by supervisors • Non-interactive monitoring screen
          </Text>
        </View>
        
        <View style={styles.footerRight}>
          <Text style={styles.footerInfo}>
            {wsConnected ? '🟢 Live Monitoring' : '🔴 System Offline'} • 
            Auto-refresh: 15s
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    minHeight: '100vh',
  },
  
  // Control Room Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    flex: 1,
  },
  
  logoContainer: {
    width: 56,
    height: 56,
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  logoText: {
    fontSize: 28,
  },
  
  titleContainer: {
    flex: 1,
  },
  
  systemTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: 1,
  },
  
  displayTitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 4,
  },
  
  headerCenter: {
    flex: 2,
    alignItems: 'center',
  },
  
  systemMetrics: {
    flexDirection: 'row',
    gap: 40,
  },
  
  metric: {
    alignItems: 'center',
    minWidth: 100,
  },
  
  metricValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '700',
    textTransform: 'uppercase',
    textAlign: 'center',
    letterSpacing: 1,
  },
  
  connectionDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 4,
  },
  
  headerRight: {
    alignItems: 'flex-end',
    flex: 1,
  },
  
  timeDisplay: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 4,
  },
  
  dateDisplay: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 8,
  },
  
  lastUpdate: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  
  // Supervisor Messages
  supervisorMessages: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  
  priorityMessage: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 6,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  
  messageLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#374151',
    letterSpacing: 1.5,
    flex: 1,
  },
  
  messageTime: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
  },
  
  messageText: {
    fontSize: 18,
    color: '#1F2937',
    padding: 20,
    lineHeight: 26,
    fontWeight: '500',
  },
  
  // Main Content
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    gap: 24,
    padding: 24,
  },
  
  // Alert Section
  alertsSection: {
    flex: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  
  // Supervisor Section
  supervisorSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  
  alertBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  
  alertBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  
  alertDisplayContainer: {
    flex: 1,
  },
  
  supervisorDisplay: {
    flex: 1,
    padding: 20,
  },
  
  supervisorCardDisplay: {
    marginBottom: 20,
  },
  
  connectionDetails: {
    gap: 12,
  },
  
  connectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  
  connectionText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  
  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  
  footerLeft: {
    flex: 1,
  },
  
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  
  footerSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  
  footerRight: {
    alignItems: 'flex-end',
  },
  
  footerInfo: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});

export default ControlRoomDisplay;