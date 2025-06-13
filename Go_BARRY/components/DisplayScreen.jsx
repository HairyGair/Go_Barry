// Go_BARRY/components/DisplayScreen.jsx
// Fixed Display Screen with Web-Compatible Styles
// Simple, working 50/50 layout for control room

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBarryAPI } from './hooks/useBARRYapi';
import { useSupervisorPolling } from './hooks/useSupervisorPolling';
import TrafficMap from './TrafficMap';

const DisplayScreen = () => {
  const {
    alerts,
    loading,
    lastUpdated,
    refreshAlerts
  } = useBarryAPI({
    autoRefresh: true,
    refreshInterval: 15000
  });

  const {
    isConnected: supervisorConnected,
    connectedSupervisors,
    activeSupervisors,
    acknowledgedAlerts,
    priorityOverrides,
    supervisorNotes,
    customMessages,
    dismissedFromDisplay,
    lockedOnDisplay
  } = useSupervisorPolling({
    clientType: 'display',
    autoConnect: true
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const visibleAlerts = alerts.filter(alert => !dismissedFromDisplay.has(alert.id));

  useEffect(() => {
    if (visibleAlerts.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentAlertIndex((prev) => {
        const current = visibleAlerts[prev];
        if (current && lockedOnDisplay.has(current.id)) {
          return prev; // Don't rotate locked alerts
        }
        return (prev + 1) % visibleAlerts.length;
      });
    }, 10000);
    
    return () => clearInterval(interval);
  }, [visibleAlerts.length, lockedOnDisplay]);

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

  const getCurrentAlert = () => {
    if (!visibleAlerts.length || currentAlertIndex >= visibleAlerts.length) return null;
    return visibleAlerts[currentAlertIndex];
  };

  const nextAlert = () => {
    if (visibleAlerts.length > 1) {
      setCurrentAlertIndex((prev) => (prev + 1) % visibleAlerts.length);
    }
  };

  const prevAlert = () => {
    if (visibleAlerts.length > 1) {
      setCurrentAlertIndex((prev) => prev === 0 ? visibleAlerts.length - 1 : prev - 1);
    }
  };

  // Generate activity feed
  const generateActivityFeed = () => {
    const activities = [];
    
    // Add supervisor connections
    activeSupervisors?.forEach((supervisor, index) => {
      activities.push({
        id: `login-${supervisor.id || index}`,
        icon: 'log-in',
        iconColor: '#10B981',
        title: 'Supervisor Connected',
        description: supervisor.name || 'Supervisor',
        timestamp: supervisor.loginTime ? new Date(supervisor.loginTime).getTime() : Date.now() - (index * 30000)
      });
    });
    
    // Add acknowledged alerts
    acknowledgedAlerts.forEach((alertId) => {
      const alert = alerts.find(a => a.id === alertId);
      if (alert) {
        activities.push({
          id: `ack-${alertId}`,
          icon: 'checkmark-circle',
          iconColor: '#10B981',
          title: 'Alert Acknowledged',
          description: alert.title?.substring(0, 30) + '...',
          timestamp: Date.now() - Math.random() * 600000
        });
      }
    });
    
    return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
  };

  const activityFeed = generateActivityFeed();

  return (
    <View style={styles.container}>
      {/* DEBUG INDICATOR */}
      <View style={styles.debugIndicator}>
        <Text style={styles.debugText}>✅ WORKING DISPLAY v3.0 - LAYOUT FIXED</Text>
      </View>

      {/* HEADER - Fixed Height */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.systemTitle}>GO NORTH EAST</Text>
          <Text style={styles.systemSubtitle}>CONTROL ROOM</Text>
        </View>
        
        <View style={styles.headerCenter}>
          <Text style={styles.timeDisplay}>{formatTime(currentTime)}</Text>
          <Text style={styles.dateDisplay}>{formatDate(currentTime)}</Text>
        </View>
        
        <View style={styles.headerRight}>
          <View style={[styles.statusBadge, { backgroundColor: loading ? '#F59E0B' : '#10B981' }]}>
            <Text style={styles.statusText}>{loading ? 'UPDATING' : 'LIVE'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: supervisorConnected ? '#10B981' : '#6B7280' }]}>
            <Text style={styles.statusText}>{connectedSupervisors} SUPERVISORS</Text>
          </View>
        </View>
      </View>

      {/* MAIN CONTENT - TRUE 50/50 SPLIT */}
      <View style={styles.mainContent}>
        
        {/* LEFT SIDE - ALERTS (50%) */}
        <View style={styles.leftSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🚨 LIVE ALERTS ({visibleAlerts.length})</Text>
          </View>
          
          <View style={styles.alertContent}>
            {visibleAlerts.length > 0 ? (
              <View style={styles.alertDisplayArea}>
                {/* Alert Navigation */}
                {visibleAlerts.length > 1 && (
                  <View style={styles.alertNavigation}>
                    <TouchableOpacity style={styles.navBtn} onPress={prevAlert}>
                      <Text style={styles.navBtnText}>◀</Text>
                    </TouchableOpacity>
                    <Text style={styles.alertCounter}>
                      {currentAlertIndex + 1} of {visibleAlerts.length}
                    </Text>
                    <TouchableOpacity style={styles.navBtn} onPress={nextAlert}>
                      <Text style={styles.navBtnText}>▶</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Current Alert Display */}
                {(() => {
                  const alert = getCurrentAlert();
                  if (!alert) return null;

                  const isAcknowledged = acknowledgedAlerts.has(alert.id);
                  const priorityOverride = priorityOverrides.get(alert.id);
                  const supervisorNote = supervisorNotes.get(alert.id);

                  return (
                    <View style={styles.currentAlert}>
                      <Text style={styles.alertTitle}>{alert.title}</Text>
                      <Text style={styles.alertLocation}>{alert.location}</Text>
                      <Text style={styles.alertDescription}>{alert.description}</Text>
                      
                      {alert.affectsRoutes && alert.affectsRoutes.length > 0 && (
                        <View style={styles.routesSection}>
                          <Text style={styles.routesLabel}>AFFECTED SERVICES:</Text>
                          <View style={styles.routesList}>
                            {alert.affectsRoutes.map((route, idx) => (
                              <View key={idx} style={styles.routeBadge}>
                                <Text style={styles.routeText}>{route}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}

                      {priorityOverride && (
                        <View style={styles.priorityOverride}>
                          <Text style={styles.priorityText}>
                            🏁 PRIORITY: {priorityOverride.priority}
                          </Text>
                        </View>
                      )}

                      {supervisorNote && (
                        <View style={styles.supervisorNote}>
                          <Text style={styles.noteText}>📝 {supervisorNote.note}</Text>
                        </View>
                      )}

                      {isAcknowledged && (
                        <View style={styles.acknowledgedBadge}>
                          <Text style={styles.ackText}>✅ ACKNOWLEDGED</Text>
                        </View>
                      )}
                    </View>
                  );
                })()}
              </View>
            ) : (
              <View style={styles.noAlerts}>
                <Text style={styles.noAlertsIcon}>🛡️</Text>
                <Text style={styles.noAlertsTitle}>ALL CLEAR</Text>
                <Text style={styles.noAlertsText}>No active traffic alerts</Text>
              </View>
            )}
          </View>
        </View>

        {/* RIGHT SIDE - MAP & ACTIVITY (50%) */}
        <View style={styles.rightSection}>
          {/* MAP SECTION (70% of right side) */}
          <View style={styles.mapSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🗺️ LIVE TRAFFIC MAP</Text>
              <TouchableOpacity style={styles.refreshBtn} onPress={refreshAlerts}>
                <Text style={styles.refreshText}>🔄</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.mapContainer}>
              <TrafficMap 
                alerts={alerts}
                currentAlert={getCurrentAlert()}
                alertIndex={currentAlertIndex}
              />
            </View>
          </View>

          {/* ACTIVITY SECTION (30% of right side) */}
          <View style={styles.activitySection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>👥 SUPERVISOR ACTIVITY</Text>
            </View>
            
            <ScrollView style={styles.activityList}>
              {activityFeed.length > 0 ? (
                activityFeed.map((activity) => (
                  <View key={activity.id} style={styles.activityItem}>
                    <Text style={styles.activityIcon}>
                      {activity.icon === 'log-in' ? '👤' : 
                       activity.icon === 'checkmark-circle' ? '✅' : '📝'}
                    </Text>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>{activity.title}</Text>
                      <Text style={styles.activityDescription}>{activity.description}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.noActivity}>
                  <Text style={styles.noActivityText}>No recent supervisor activity</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Go Barry v3.0 • {alerts.length} alerts • {connectedSupervisors} supervisors online
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: Platform.OS === 'web' ? '100vh' : '100%',
    background: Platform.OS === 'web' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#667eea',
    backgroundColor: '#667eea',
    display: 'flex',
    flexDirection: 'column',
  },
  
  // Debug indicator
  debugIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#059669',
    padding: 8,
    zIndex: 9999,
  },
  debugText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Header - Fixed height
  header: {
    height: 80,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: Platform.OS === 'web' ? 'blur(20px)' : undefined,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
    alignItems: 'center',
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerLeft: {
    flex: 1,
  },
  systemTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1F2937',
    letterSpacing: 1,
  },
  systemSubtitle: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  timeDisplay: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'System',
    letterSpacing: -0.5,
  },
  dateDisplay: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // Main content - True 50/50 split
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    height: Platform.OS === 'web' ? 'calc(100vh - 120px)' : 'auto',
  },

  // Left section - Alerts (50%)
  leftSection: {
    flex: 1,
    width: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: Platform.OS === 'web' ? 'blur(10px)' : undefined,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    margin: 8,
    marginRight: 4,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  // Right section - Map & Activity (50%)  
  rightSection: {
    flex: 1,
    width: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: Platform.OS === 'web' ? 'blur(10px)' : undefined,
    display: 'flex',
    flexDirection: 'column',
    margin: 8,
    marginLeft: 4,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  // Section headers
  sectionHeader: {
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: Platform.OS === 'web' ? 'blur(15px)' : undefined,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
    flexDirection: 'row',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: 0.5,
  },
  refreshBtn: {
    padding: 4,
  },
  refreshText: {
    fontSize: 16,
  },

  // Alert content
  alertContent: {
    flex: 1,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  alertDisplayArea: {
    flex: 1,
  },
  alertNavigation: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: Platform.OS === 'web' ? 'blur(10px)' : undefined,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navBtn: {
    backgroundColor: '#3B82F6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  navBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  alertCounter: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'System',
    letterSpacing: 0.5,
  },

  // Current alert
  currentAlert: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: Platform.OS === 'web' ? 'blur(20px)' : undefined,
    borderRadius: 20,
    padding: 24,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  alertTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 12,
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  alertLocation: {
    fontSize: 18,
    color: '#3B82F6',
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  alertDescription: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 20,
    fontWeight: '500',
  },

  // Routes section
  routesSection: {
    marginBottom: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  routesLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
    marginBottom: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  routesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  routeBadge: {
    background: Platform.OS === 'web' ? 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)' : '#DC2626',
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  routeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // Supervisor enhancements
  priorityOverride: {
    background: Platform.OS === 'web' ? 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)' : '#FEF3C7',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.3,
  },
  supervisorNote: {
    background: Platform.OS === 'web' ? 'linear-gradient(135deg, #EBF8FF 0%, #DBEAFE 100%)' : '#EBF8FF',
    backgroundColor: '#EBF8FF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  noteText: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '600',
  },
  acknowledgedBadge: {
    background: Platform.OS === 'web' ? 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)' : '#D1FAE5',
    backgroundColor: '#D1FAE5',
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ackText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.3,
  },

  // No alerts
  noAlerts: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noAlertsIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noAlertsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 8,
  },
  noAlertsText: {
    fontSize: 16,
    color: '#6B7280',
  },

  // Map section (70% of right side)
  mapSection: {
    flex: 0.7,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  mapContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: Platform.OS === 'web' ? 'blur(10px)' : undefined,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  // Activity section (30% of right side)
  activitySection: {
    flex: 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  activityList: {
    flex: 1,
    padding: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: Platform.OS === 'web' ? 'blur(10px)' : undefined,
    padding: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activityIcon: {
    fontSize: 20,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 0.2,
  },
  activityDescription: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
  },
  noActivity: {
    padding: 16,
    alignItems: 'center',
  },
  noActivityText: {
    fontSize: 12,
    color: '#6B7280',
  },

  // Footer - Fixed height
  footer: {
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: Platform.OS === 'web' ? 'blur(20px)' : undefined,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  footerText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default DisplayScreen;