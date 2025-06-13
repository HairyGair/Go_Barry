// Go_BARRY/app/display.jsx
// Large-scale non-interactive display optimized for control room visibility
// Receives real-time updates from supervisor controls via WebSocket

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Platform, Image, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBarryAPI } from '../components/hooks/useBARRYapi';
import { useSupervisorPolling, CONNECTION_STATES } from '../components/hooks/useSupervisorPolling';
import TrafficMap from '../components/TrafficMap';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ControlRoomDisplay = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  const [pulseAnim] = useState(new Animated.Value(1));

  // LIVE PRODUCTION DATA - No demo data
  const {
    alerts,
    loading,
    lastUpdated,
    criticalAlerts,
    activeAlerts
  } = useBarryAPI({
    autoRefresh: true,
    refreshInterval: 10000 // 10 seconds for live production monitoring
  });

  // WebSocket sync with supervisor controls
  const {
    connectionState,
    isConnected: wsConnected,
    acknowledgedAlerts,
    priorityOverrides,
    supervisorNotes,
    customMessages,
    connectedSupervisors,
    activeSupervisors
  } = useSupervisorPolling({
    clientType: 'display',
    autoConnect: true,
    onConnectionChange: (connected) => {
      console.log('🔌 LIVE Control Room Display:', connected ? 'Connected' : 'Disconnected');
    },
    onError: (error) => {
      console.warn('⚠️ Display WebSocket error (non-critical):', error);
    }
  });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Rotate alerts every 20 seconds
  useEffect(() => {
    if (alerts.length > 1) {
      const alertTimer = setInterval(() => {
        setCurrentAlertIndex((prev) => (prev + 1) % alerts.length);
      }, 20000); // 20 seconds
      return () => clearInterval(alertTimer);
    }
  }, [alerts.length]);

  // Reset alert index when alerts change
  useEffect(() => {
    setCurrentAlertIndex(0);
  }, [alerts]);

  // Pulse animation for alert visibility
  useEffect(() => {
    if (alerts.length > 0) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [alerts.length]);

  // Get system status for large display
  const getSystemStatus = () => {
    if (loading) return { text: 'UPDATING DATA', color: '#F59E0B', icon: 'sync' };
    return { text: 'LIVE MONITORING', color: '#059669', icon: 'checkmark-circle' };
  };

  const systemStatus = getSystemStatus();

  // Format time for large display
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
      {/* SIMPLE LOGO HEADER */}
      <View style={styles.logoHeader}>
        {/* <Image 
          source={require('../assets/gobarry-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        /> */}
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>GO BARRY</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.currentTime}>{formatTime(currentTime)}</Text>
          <View style={[styles.statusIndicator, { backgroundColor: systemStatus.color }]}>
            <Ionicons name={systemStatus.icon} size={16} color="#FFFFFF" />
            <Text style={styles.statusText}>{systemStatus.text}</Text>
          </View>
        </View>
      </View>

      {/* MAIN CONTROL ROOM CONTENT */}
      <View style={styles.mainContent}>
        {/* ALERTS SECTION - 60% */}
        <View style={styles.leftPanel}>
          {/* LIVE ALERTS SECTION */}
          <View style={styles.alertsSection}>
            <View style={styles.alertsHeader}>
              <Ionicons name="alert-circle" size={32} color="#DC2626" />
              <Text style={styles.alertsTitle}>LIVE ALERTS</Text>
              <View style={styles.alertsBadge}>
                <Text style={styles.alertsCount}>{alerts.length}</Text>
              </View>
            </View>
            
            <View style={styles.alertsList}>
              {alerts.length > 0 ? (
                <Animated.View style={[styles.alertCard, { transform: [{ scale: pulseAnim }] }]}>
                  <View style={styles.alertMain}>
                    <Ionicons 
                      name={alerts[currentAlertIndex]?.type === 'incident' ? 'alert-circle' : 'construct'} 
                      size={56} 
                      color="#DC2626"
                    />
                    <View style={styles.alertInfo}>
                      <Text style={styles.alertTitle}>{alerts[currentAlertIndex]?.title}</Text>
                      <Text style={styles.alertLocation}>{alerts[currentAlertIndex]?.location}</Text>
                    </View>
                    {alerts.length > 1 && (
                      <View style={styles.alertCounter}>
                        <Text style={styles.alertCounterText}>
                          {currentAlertIndex + 1} of {alerts.length}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.alertDescription}>{alerts[currentAlertIndex]?.description}</Text>
                  {alerts.length > 1 && (
                    <View style={styles.rotationIndicator}>
                      <Ionicons name="refresh" size={20} color="#6B7280" />
                      <Text style={styles.rotationText}>Rotating every 20 seconds</Text>
                    </View>
                  )}
                </Animated.View>
              ) : (
                <View style={styles.noAlertsDisplay}>
                  <Ionicons name="shield-checkmark" size={60} color="#059669" />
                  <Text style={styles.noAlertsTitle}>ALL SYSTEMS NORMAL</Text>
                  <Text style={styles.noAlertsText}>No traffic alerts requiring attention</Text>
                </View>
              )}
            </View>
          </View>

          {/* SUPERVISORS ONLINE SECTION */}
          <View style={styles.supervisorsSection}>
            <View style={styles.supervisorsHeader}>
              <Ionicons name="people" size={24} color="#3B82F6" />
              <Text style={styles.supervisorsTitle}>SUPERVISORS ONLINE</Text>
              <View style={styles.supervisorsBadge}>
                <Text style={styles.supervisorsCount}>{connectedSupervisors}</Text>
              </View>
            </View>
            
            <ScrollView style={styles.supervisorsList} showsVerticalScrollIndicator={false}>
              {activeSupervisors.length > 0 ? (
                activeSupervisors.map((supervisor, index) => (
                  <View key={supervisor.id || index} style={styles.supervisorCard}>
                    <View style={styles.supervisorInfo}>
                      <Ionicons name="person-circle" size={24} color="#3B82F6" />
                      <Text style={styles.supervisorName}>
                        {supervisor.name || `Supervisor ${supervisor.id}`}
                      </Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={16} color="#059669" />
                  </View>
                ))
              ) : (
                <View style={styles.noSupervisors}>
                  <Ionicons name="person-outline" size={32} color="#6B7280" />
                  <Text style={styles.noSupervisorsText}>No supervisors connected</Text>
                </View>
              )}
            </ScrollView>
          </View>

          {/* ACTIVITY FEED SECTION */}
          <View style={styles.activitySection}>
            <View style={styles.activityHeader}>
              <Ionicons name="pulse" size={24} color="#F59E0B" />
              <Text style={styles.activityTitle}>LIVE ACTIVITY FEED</Text>
            </View>
            
            <ScrollView style={styles.activityFeed} showsVerticalScrollIndicator={false}>
              {customMessages.length > 0 ? (
                customMessages.map((message, index) => (
                  <View key={message.id || index} style={styles.activityItem}>
                    <Text style={styles.activityText}>{message.text || message.message}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.noActivity}>
                  <Ionicons name="time-outline" size={32} color="#6B7280" />
                  <Text style={styles.noActivityText}>No recent activity</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>

        {/* MAP SECTION - 40% */}
        <View style={styles.mapSection}>
          <View style={styles.mapHeader}>
            <Ionicons name="map" size={32} color="#3B82F6" />
            <Text style={styles.mapTitle}>LIVE TRAFFIC MAP</Text>
          </View>
          
          <View style={styles.mapContainer}>
            <TrafficMap 
              alerts={alerts}
              currentAlert={alerts[currentAlertIndex]}
              alertIndex={currentAlertIndex}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    minHeight: '100vh',
    minWidth: '100vw',
  },
  
  logoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Math.max(20, screenWidth * 0.03),
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  
  logo: {
    height: Math.min(48, screenHeight * 0.06),
    width: Math.min(160, screenWidth * 0.15),
    maxWidth: 200,
  },
  
  logoPlaceholder: {
    height: Math.min(48, screenHeight * 0.06),
    width: Math.min(160, screenWidth * 0.15),
    maxWidth: 200,
    backgroundColor: '#E31E24',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  logoText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  
  currentTime: {
    fontSize: Math.min(24, screenWidth * 0.025),
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: Platform.OS === 'ios' ? 'SF Mono' : 'monospace',
    letterSpacing: 0.5,
  },
  
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  
  mainContent: {
    flex: 1,
    flexDirection: 'column',
    gap: Math.max(20, screenWidth * 0.02),
    padding: Math.max(16, screenWidth * 0.025),
    backgroundColor: '#FAFAFA',
  },
  
  leftPanel: {
    flex: 0.6,
    gap: Math.max(16, screenHeight * 0.02),
  },
  
  alertsSection: {
    flex: screenWidth > 1024 ? 2 : 1,
    minHeight: Math.max(300, screenHeight * 0.4),
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  
  alertsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: Math.max(16, screenWidth * 0.015),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  
  alertsTitle: {
    fontSize: Math.min(20, screenWidth * 0.02),
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0.5,
    flex: 1,
  },
  
  alertsBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 32,
    alignItems: 'center',
  },
  
  alertsCount: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  
  alertsList: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 48,
    borderWidth: 3,
    borderColor: '#DC2626',
    minHeight: 280,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  
  alertMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
    marginBottom: 28,
  },
  
  alertInfo: {
    flex: 1,
  },
  
  alertTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 12,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  
  alertLocation: {
    fontSize: 22,
    color: '#64748B',
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  
  alertDescription: {
    fontSize: 20,
    color: '#374151',
    lineHeight: 28,
    marginBottom: 20,
    fontWeight: '500',
  },
  
  alertCounter: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  
  alertCounterText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  
  rotationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F8FAFC',
    marginHorizontal: -48,
    marginBottom: -48,
    paddingHorizontal: 48,
    paddingBottom: 24,
  },
  
  rotationText: {
    fontSize: 16,
    color: '#374151',
    fontStyle: 'italic',
    fontWeight: '600',
  },
  
  noAlertsDisplay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  
  noAlertsTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#059669',
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 1,
  },
  
  noAlertsText: {
    fontSize: 16,
    color: '#0F172A',
    textAlign: 'center',
    fontWeight: '500',
  },
  
  supervisorsSection: {
    flex: 1,
    minHeight: Math.max(200, screenHeight * 0.25),
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  
  supervisorsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  
  supervisorsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0.5,
    flex: 1,
  },
  
  supervisorsBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    minWidth: 28,
    alignItems: 'center',
  },
  
  supervisorsCount: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  
  supervisorsList: {
    flex: 1,
    padding: 12,
  },
  
  supervisorCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  
  supervisorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  
  supervisorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  
  noSupervisors: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  
  noSupervisorsText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  
  activitySection: {
    flex: 1,
    minHeight: Math.max(200, screenHeight * 0.25),
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  
  activityTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0.5,
    flex: 1,
  },
  
  activityFeed: {
    flex: 1,
    padding: 12,
  },
  
  activityItem: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  
  activityText: {
    fontSize: 14,
    color: '#0F172A',
    lineHeight: 18,
    fontWeight: '500',
  },
  
  noActivity: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  
  noActivityText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  
  mapSection: {
    flex: 0.4,
    minHeight: Math.max(300, screenHeight * 0.3),
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  
  mapTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0.5,
    flex: 1,
  },
  
  mapContainer: {
    flex: 1,
  },
});

export default ControlRoomDisplay;
