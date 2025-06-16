// Go_BARRY/components/DisplayScreen.jsx
// Fixed Display Screen with Web-Compatible Styles
// Simple, working 50/50 layout for control room

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBarryAPI } from './hooks/useBARRYapi';
import { useSupervisorPolling } from './hooks/useSupervisorPolling';
import EnhancedTrafficMap from './EnhancedTrafficMap';
import FallbackMap from './FallbackMap';
import typography, { getAlertIcon, getSeverityIcon } from '../theme/typography';

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
  const [hoveredRoute, setHoveredRoute] = useState(null);
  const [hoveredNavBtn, setHoveredNavBtn] = useState(null);
  const [hoveredAlert, setHoveredAlert] = useState(false);
  const [hoveredActivity, setHoveredActivity] = useState(null);
  const [mapFallback, setMapFallback] = useState(false);
  const spinValue = useRef(new Animated.Value(0)).current;
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

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

  // Animate alert changes
  useEffect(() => {
    // Reset animations
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.95);
    slideAnim.setValue(20);
    
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentAlertIndex, visibleAlerts.length]);

  // Spin animation for refresh button
  useEffect(() => {
    if (loading) {
      const spin = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      spin.start();
      return () => spin.stop();
    } else {
      spinValue.setValue(0);
    }
  }, [loading]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

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
            <Text style={styles.statusIcon}>{loading ? typography.icons.status.updating : typography.icons.status.live}</Text>
            <Text style={styles.statusText}>{loading ? 'UPDATING' : 'LIVE'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: supervisorConnected ? '#10B981' : '#6B7280' }]}>
            <Text style={styles.statusIcon}>{supervisorConnected ? typography.icons.status.connected : typography.icons.status.disconnected}</Text>
            <Text style={styles.statusText}>{connectedSupervisors} SUPERVISORS</Text>
          </View>
        </View>
      </View>

      {/* MAIN CONTENT - TRUE 50/50 SPLIT */}
      <View style={styles.mainContent}>
        
        {/* LEFT SIDE - ALERTS (50%) */}
        <View style={styles.leftSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>{typography.icons.alert.emergency} LIVE ALERTS</Text>
              <View style={styles.alertCountBadge}>
                <Text style={styles.alertCountText}>{visibleAlerts.length}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.alertContent}>
            {visibleAlerts.length > 0 ? (
              <View style={styles.alertDisplayArea}>
                {/* Alert Navigation */}
                {visibleAlerts.length > 1 && (
                  <View style={styles.alertNavigation}>
                    <TouchableOpacity 
                      style={[
                        styles.navBtn,
                        hoveredNavBtn === 'prev' && styles.navBtnHovered
                      ]} 
                      onPress={prevAlert}
                      onMouseEnter={() => Platform.OS === 'web' && setHoveredNavBtn('prev')}
                      onMouseLeave={() => Platform.OS === 'web' && setHoveredNavBtn(null)}
                    >
                      <Text style={styles.navBtnText}>◀</Text>
                    </TouchableOpacity>
                    <Text style={styles.alertCounter}>
                      {currentAlertIndex + 1} of {visibleAlerts.length}
                    </Text>
                    <TouchableOpacity 
                      style={[
                        styles.navBtn,
                        hoveredNavBtn === 'next' && styles.navBtnHovered
                      ]} 
                      onPress={nextAlert}
                      onMouseEnter={() => Platform.OS === 'web' && setHoveredNavBtn('next')}
                      onMouseLeave={() => Platform.OS === 'web' && setHoveredNavBtn(null)}
                    >
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

                  // Get alert type icon
                  const getAlertTypeIcon = () => {
                    const type = alert.type?.toLowerCase() || alert.category?.toLowerCase() || '';
                    if (type.includes('roadwork') || type.includes('construction')) return '🚧';
                    if (type.includes('accident') || type.includes('crash') || type.includes('collision')) return '🚗';
                    if (type.includes('event') || type.includes('planned')) return '📅';
                    if (type.includes('congestion') || type.includes('traffic')) return '🚦';
                    if (type.includes('closure') || type.includes('closed')) return '🚫';
                    if (type.includes('weather')) return '🌧️';
                    if (type.includes('emergency')) return '🚨';
                    return typography.icons.alert.warning;
                  };

                  return (
                    <Animated.View 
                      style={[
                        styles.currentAlert,
                        hoveredAlert && styles.currentAlertHovered,
                        {
                          opacity: fadeAnim,
                          transform: [
                            { scale: scaleAnim },
                            { translateY: slideAnim }
                          ],
                        }
                      ]}
                      onMouseEnter={() => Platform.OS === 'web' && setHoveredAlert(true)}
                      onMouseLeave={() => Platform.OS === 'web' && setHoveredAlert(false)}
                    >
                      {/* Severity indicator bar */}
                      <View style={[styles.severityIndicator, { backgroundColor: getSeverityColor() }]} />
                      
                      {/* Severity badge */}
                      <View style={[styles.severityBadge, { backgroundColor: `${getSeverityColor()}15` }]}>
                        <Text style={[styles.severityBadgeText, { color: getSeverityColor() }]}>
                          {alert.severity?.toUpperCase() || 'ALERT'} IMPACT
                        </Text>
                      </View>

                      {/* END of Animated.View block */}
                      {/* START of alertTitleRow block */}
                      <View style={styles.alertTitleRow}>
                        <Text style={styles.alertTypeIcon}>{getAlertTypeIcon()}</Text>
                        <Text style={styles.alertTitle}>{alert.title}</Text>
                      </View>
                      <View style={styles.locationContainer}>
                        <Text style={styles.locationIcon}>📍</Text>
                        <Text style={styles.alertLocation}>{alert.location}</Text>
                      </View>
                      <Text style={styles.alertDescription}>{alert.description}</Text>
                      
                      {alert.affectsRoutes && alert.affectsRoutes.length > 0 && (
                        <View style={styles.routesSection}>
                          <Text style={styles.routesLabel}>AFFECTED SERVICES:</Text>
                          <View style={styles.routesList}>
                            {alert.affectsRoutes.map((route, idx) => {
                              const frequency = alert.routeFrequencySummaries?.[route];
                              const isHighFreq = alert.routeFrequencies?.[route]?.overall?.category === 'high-frequency';
                              
                              return (
                                <TouchableOpacity 
                                  key={idx} 
                                  style={[
                                    styles.routeBadge,
                                    isHighFreq && styles.routeBadgeHighFreq,
                                    hoveredRoute === `${alert.id}-${idx}` && styles.routeBadgeHovered
                                  ]}
                                  activeOpacity={0.8}
                                  onMouseEnter={() => Platform.OS === 'web' && setHoveredRoute(`${alert.id}-${idx}`)}
                                  onMouseLeave={() => Platform.OS === 'web' && setHoveredRoute(null)}
                                >
                                  <Text style={[styles.routeText, isHighFreq && styles.routeTextHighFreq]}>
                                    {route} {frequency && `(${frequency})`}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                          {alert.frequencyImpact && (
                            <View style={styles.frequencyImpactInfo}>
                              <Text style={[
                                styles.impactText,
                                { color: alert.frequencyImpact.impactLevel === 'severe' ? '#DC2626' : 
                                         alert.frequencyImpact.impactLevel === 'major' ? '#F59E0B' : '#3B82F6' }
                              ]}>
                                {alert.frequencyImpact.impactLevel.toUpperCase()} SERVICE IMPACT
                              </Text>
                            </View>
                          )}
                        </View>
                      )}

                      {priorityOverride && (
                        <View style={styles.priorityOverride}>
                          <Text style={styles.priorityText}>
                          {typography.icons.supervisor.flag} PRIORITY: {priorityOverride.priority}
                          </Text>
                        </View>
                      )}

                      {supervisorNote && (
                        <View style={styles.supervisorNote}>
                          <Text style={styles.noteText}>{typography.icons.supervisor.note} {supervisorNote.note}</Text>
                        </View>
                      )}

                      {isAcknowledged && (
                        <View style={styles.acknowledgedBadge}>
                          <Text style={styles.ackText}>{typography.icons.action.check} ACKNOWLEDGED</Text>
                        </View>
                      )}
                    </Animated.View>
                  );
                })()}
              </View>
            ) : (
              <View style={styles.noAlerts}>
                <Text style={styles.noAlertsIcon}>{typography.icons.supervisor.shield}</Text>
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
              <Text style={styles.sectionTitle}>{typography.icons.location.map} LIVE TRAFFIC MAP</Text>
              <TouchableOpacity 
                style={styles.refreshBtn} 
                onPress={refreshAlerts}
              >
                <Animated.Text style={[
                  styles.refreshText,
                  loading && {
                    transform: [{ rotate: spin }]
                  }
                ]}>🔄</Animated.Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.mapContainer}>
              {mapFallback ? (
                <FallbackMap 
                  alerts={alerts}
                  currentAlert={getCurrentAlert()}
                  alertIndex={currentAlertIndex}
                />
              ) : (
                <EnhancedTrafficMap 
                  alerts={alerts}
                  currentAlert={getCurrentAlert()}
                  alertIndex={currentAlertIndex}
                  onError={() => {
                    console.log('🗺️ TomTom map failed, switching to fallback');
                    setMapFallback(true);
                  }}
                />
              )}
              
              {/* Map Toggle Button */}
              <TouchableOpacity 
                style={styles.mapToggle}
                onPress={() => setMapFallback(!mapFallback)}
                onMouseEnter={() => Platform.OS === 'web' && setHoveredNavBtn('map-toggle')}
                onMouseLeave={() => Platform.OS === 'web' && setHoveredNavBtn(null)}
              >
                <Text style={styles.mapToggleText}>
                  {mapFallback ? '🗺️' : '📊'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ACTIVITY SECTION (30% of right side) */}
          <View style={styles.activitySection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{typography.icons.supervisor.user} SUPERVISOR ACTIVITY</Text>
            </View>
            
            <ScrollView style={styles.activityList}>
              {activityFeed.length > 0 ? (
                activityFeed.map((activity, index) => (
                  <TouchableOpacity 
                    key={activity.id} 
                    style={[
                      styles.activityItem,
                      hoveredActivity === activity.id && styles.activityItemHovered
                    ]}
                    activeOpacity={1}
                    onMouseEnter={() => Platform.OS === 'web' && setHoveredActivity(activity.id)}
                    onMouseLeave={() => Platform.OS === 'web' && setHoveredActivity(null)}
                  >
                    <View style={styles.activityIconContainer}>
                      <Text style={styles.activityIcon}>
                        {activity.icon === 'log-in' ? typography.icons.supervisor.user : 
                         activity.icon === 'checkmark-circle' ? typography.icons.action.check : 
                         typography.icons.supervisor.note}
                      </Text>
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={[
                        styles.activityTitle,
                        activity.icon === 'log-in' && styles.activityTitleSuccess
                      ]}>{activity.title}</Text>
                      <Text style={styles.activityDescription}>{activity.description}</Text>
                      <Text style={styles.activityTime}>
                        {new Date(activity.timestamp).toLocaleTimeString('en-GB', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </Text>
                    </View>
                  </TouchableOpacity>
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
    ...typography.styles.headerSmall,
    color: '#111827',
  },
  systemSubtitle: {
    ...typography.styles.bodyBase,
    color: '#DC2626',
    fontWeight: typography.fontWeight.extrabold,
    letterSpacing: typography.letterSpacing.widest,
    marginTop: 2,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  timeDisplay: {
    ...typography.styles.timeDisplay,
    color: '#111827',
  },
  dateDisplay: {
    ...typography.styles.labelBase,
    color: '#6B7280',
    fontWeight: typography.fontWeight.semibold,
    marginTop: 2,
    textTransform: 'none',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  statusIcon: {
    fontSize: 14,
  },
  statusText: {
    ...typography.styles.labelSmall,
    color: '#FFFFFF',
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
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    ...typography.styles.sectionTitle,
    color: '#111827',
  },
  alertCountBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    minWidth: 28,
    alignItems: 'center',
  },
  alertCountText: {
    ...typography.styles.badge,
    color: '#FFFFFF',
  },
  refreshBtn: {
    padding: 4,
    ...(Platform.OS === 'web' && {
      transition: 'transform 0.3s ease',
    }),
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
    ...(Platform.OS === 'web' && {
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer',
    }),
  },
  navBtnHovered: {
    backgroundColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    transform: [{ scale: 1.1 }],
  },
  navBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  alertCounter: {
    ...typography.styles.bodyLarge,
    color: '#111827',
    fontWeight: typography.fontWeight.black,
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'System',
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
    ...(Platform.OS === 'web' && {
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'default',
    }),
  },
  currentAlertHovered: {
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    transform: [{ scale: 1.02 }],
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
    ...typography.styles.labelBase,
    textTransform: 'uppercase',
  },
  
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginLeft: 16,
    marginRight: 16,
  },
  alertTypeIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  alertTitle: {
    ...typography.styles.headerMedium,
    color: '#111827',
    flex: 1,
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
    ...typography.styles.bodyLarge,
    color: '#1F2937',
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.tight,
    flex: 1,
  },
  alertDescription: {
    ...typography.styles.bodyLarge,
    color: '#6B7280',
    marginBottom: 24,
    marginLeft: 16,
    marginRight: 16,
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
    ...typography.styles.labelBase,
    color: '#6B7280',
    marginBottom: 14,
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
    ...(Platform.OS === 'web' && {
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer',
    }),
  },
  routeBadgeHighFreq: {
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
  },
  routeBadgeHovered: {
    backgroundColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    transform: [{ scale: 1.08 }],
  },
  routeText: {
    ...typography.styles.button,
    color: '#FFFFFF',
  },
  routeTextHighFreq: {
    fontWeight: '800',
  },
  frequencyImpactInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  impactText: {
    ...typography.styles.labelBase,
    fontWeight: typography.fontWeight.extrabold,
    letterSpacing: typography.letterSpacing.wider,
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
    ...typography.styles.bodyBase,
    fontWeight: typography.fontWeight.extrabold,
    color: '#92400E',
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
    ...typography.styles.bodyBase,
    color: '#1E40AF',
    fontWeight: typography.fontWeight.semibold,
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
    ...typography.styles.bodyBase,
    fontWeight: typography.fontWeight.extrabold,
    color: '#059669',
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
    ...typography.styles.headerMedium,
    color: '#10B981',
    marginBottom: 12,
  },
  noAlertsText: {
    ...typography.styles.bodyLarge,
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
    position: 'relative',
  },
  mapToggle: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
    ...(Platform.OS === 'web' && {
      transition: 'all 0.2s ease',
      cursor: 'pointer',
    }),
  },
  mapToggleText: {
    fontSize: 18,
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
    ...(Platform.OS === 'web' && {
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer',
    }),
  },
  activityItemHovered: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    transform: [{ scale: 1.02 }],
  },
  activityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityIcon: {
    fontSize: typography.fontSize['icon-sm'],
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    ...typography.styles.bodySmall,
    fontWeight: typography.fontWeight.extrabold,
    color: '#111827',
  },
  activityTitleSuccess: {
    color: '#059669',
  },
  activityDescription: {
    ...typography.styles.bodySmall,
    color: '#6B7280',
    marginTop: 3,
  },
  activityTime: {
    ...typography.styles.labelSmall,
    color: '#9CA3AF',
    marginTop: 4,
    textTransform: 'none',
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
    ...typography.styles.bodySmall,
    color: '#4B5563',
    fontWeight: typography.fontWeight.bold,
  },
});

export default DisplayScreen;