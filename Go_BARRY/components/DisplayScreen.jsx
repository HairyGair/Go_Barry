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
                  
                  // Get severity color
                  const getSeverityColor = () => {
                    switch (alert.severity?.toLowerCase()) {
                      case 'critical':
                      case 'high':
                        return '#DC2626';
                      case 'medium':
                        return '#F59E0B';
                      case 'low':
                        return '#3B82F6';
                      default:
                        return '#6B7280';
                    }
                  };

                  return (
                    <View style={styles.currentAlert}>
                      {/* Severity indicator bar */}
                      <View style={[styles.severityIndicator, { backgroundColor: getSeverityColor() }]} />
                      
                      {/* Severity badge */}
                      <View style={[styles.severityBadge, { backgroundColor: `${getSeverityColor()}15` }]}>
                        <Text style={[styles.severityBadgeText, { color: getSeverityColor() }]}>
                          {alert.severity?.toUpperCase() || 'ALERT'} IMPACT
                        </Text>
                      </View>
                      <Text style={styles.alertTitle}>{alert.title}</Text>
                      <View style={styles.locationContainer}>
                        <Text style={styles.locationIcon}>📍</Text>
                        <Text style={styles.alertLocation}>{alert.location}</Text>
                      </View>
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
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: 0.8,
  },
  systemSubtitle: {
    fontSize: 15,
    color: '#DC2626',
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  timeDisplay: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111827',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'System',
    letterSpacing: -1,
  },
  dateDisplay: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 2,
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
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
    fontSize: 17,
    fontWeight: '900',
    color: '#111827',
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
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: Platform.OS === 'web' ? 'blur(10px)' : undefined,
    padding: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  navBtn: {
    backgroundColor: '#3B82F6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  navBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  alertCounter: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '900',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'System',
    letterSpacing: 0.3,
  },

  // Current alert - Modernized with severity indicators
  currentAlert: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: Platform.OS === 'web' ? 'blur(20px)' : undefined,
    borderRadius: 16,
    padding: 24,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    position: 'relative',
    overflow: 'hidden',
  },
  // Severity indicator bar
  severityIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  
  // Severity badge
  severityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    marginBottom: 20,
    marginLeft: 16,
  },
  severityBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  
  alertTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 16,
    marginLeft: 16,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginLeft: 16,
    marginRight: 16,
  },
  locationIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  alertLocation: {
    fontSize: 20,
    color: '#1F2937',
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 26,
    flex: 1,
  },
  alertDescription: {
    fontSize: 17,
    color: '#6B7280',
    lineHeight: 26,
    marginBottom: 24,
    marginLeft: 16,
    marginRight: 16,
    fontWeight: '500',
    letterSpacing: -0.1,
  },

  // Routes section
  routesSection: {
    marginBottom: 20,
    marginHorizontal: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  routesLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6B7280',
    marginBottom: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  routesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  routeBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  routeText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // Supervisor enhancements
  priorityOverride: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  priorityText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.3,
  },
  supervisorNote: {
    backgroundColor: '#EBF8FF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  noteText: {
    fontSize: 15,
    color: '#1E40AF',
    fontWeight: '600',
    lineHeight: 22,
  },
  acknowledgedBadge: {
    backgroundColor: '#D1FAE5',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ackText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
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
    fontSize: 28,
    fontWeight: '900',
    color: '#10B981',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  noAlertsText: {
    fontSize: 17,
    color: '#6B7280',
    fontWeight: '500',
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
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.1,
  },
  activityDescription: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 3,
    lineHeight: 18,
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
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default DisplayScreen;