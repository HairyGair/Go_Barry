// Go_BARRY/components/DisplayScreen.jsx
// Fixed Display Screen with Web-Compatible Styles
// Simple, working 50/50 layout for control room

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBarryAPI } from './hooks/useBARRYapi';
import { useSupervisorPolling } from './hooks/useSupervisorPolling';
import TomTomTrafficMap from './TomTomTrafficMap';
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
    }, 20000); // Changed to 20 seconds for automatic rotation
    
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
                {/* Automatic Alert Display - No Manual Navigation */}
                <View style={styles.autoRotationInfo}>
                  <Text style={styles.rotationText}>
                    Auto-rotating every 20 seconds • Alert {currentAlertIndex + 1} of {visibleAlerts.length}
                  </Text>
                </View>

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
                        {
                          opacity: fadeAnim,
                          transform: [
                            { scale: scaleAnim },
                            { translateY: slideAnim }
                          ],
                        }
                      ]}
                    >
                      {/* REDESIGNED ALERT CARD */}
                      <View style={styles.alertCard}>
                        {/* Header Section */}
                        <View style={styles.alertHeader}>
                          <View style={styles.alertHeaderLeft}>
                            <Text style={styles.alertTypeIcon}>{getAlertTypeIcon()}</Text>
                            <View style={styles.alertHeaderText}>
                              <Text style={styles.alertTitle} numberOfLines={2}>
                                {alert.title}
                              </Text>
                              <View style={styles.alertMeta}>
                                <Text style={styles.alertTime}>
                                  Started: {(() => {
                                    const age = alert.timestamp ? Math.floor((Date.now() - new Date(alert.timestamp).getTime()) / 60000) : 0;
                                    return `${age}m ago`;
                                  })()} 
                                </Text>
                                <Text style={styles.alertSource}>
                                  • {alert.source || 'Traffic API'}
                                </Text>
                              </View>
                            </View>
                          </View>
                          <View style={[styles.severityBadge, {
                            backgroundColor: getSeverityColor() + '20',
                            borderColor: getSeverityColor()
                          }]}>
                            <Text style={[styles.severityText, { color: getSeverityColor() }]}>
                              {(alert.calculatedSeverity || alert.severity || 'UNKNOWN').toUpperCase()}
                            </Text>
                          </View>
                        </View>

                        {/* Location Section */}
                        <View style={styles.locationSection}>
                          <View style={styles.sectionIcon}>
                            <Text style={styles.iconText}>📍</Text>
                          </View>
                          <View style={styles.sectionContent}>
                            <Text style={styles.sectionTitle}>LOCATION</Text>
                            <Text style={styles.locationText} numberOfLines={2}>
                              {(() => {
                                const location = alert.location || 'Location not specified';
                                const parts = location.split(', ');
                                if (parts.length > 1) {
                                  return `${parts[0]}\n${parts.slice(1).join(', ')}`;
                                }
                                return location;
                              })()} 
                            </Text>
                            {alert.coordinates && (
                              <Text style={styles.coordinatesText}>
                                {Array.isArray(alert.coordinates) 
                                  ? `${alert.coordinates[0]?.toFixed(4)}, ${alert.coordinates[1]?.toFixed(4)}`
                                  : `${alert.coordinates.lat?.toFixed(4)}, ${alert.coordinates.lng?.toFixed(4)}`
                                }
                              </Text>
                            )}
                          </View>
                        </View>

                        {/* Impact Section */}
                        <View style={styles.impactSection}>
                          <View style={styles.sectionIcon}>
                            <Text style={styles.iconText}>⚠️</Text>
                          </View>
                          <View style={styles.sectionContent}>
                            <Text style={styles.sectionTitle}>IMPACT ASSESSMENT</Text>
                            <Text style={styles.impactText}>
                              {(() => {
                                const severity = alert.calculatedSeverity || alert.severity || 'Unknown';
                                const routeCount = alert.affectsRoutes?.length || 0;
                                const estimatedDelay = severity === 'High' ? '15-30min' : severity === 'Medium' ? '5-15min' : '2-8min';
                                return `Est. Delays: ${estimatedDelay} • ${routeCount} services potentially affected`;
                              })()} 
                            </Text>
                            {alert.routeMatchingConfidence && (
                              <Text style={styles.confidenceText}>
                                Route Confidence: {(alert.routeMatchingConfidence * 100).toFixed(0)}%
                              </Text>
                            )}
                          </View>
                        </View>

                        {/* Description */}
                        {alert.description && (
                          <View style={styles.descriptionSection}>
                            <Text style={styles.descriptionText} numberOfLines={3}>
                              {alert.description}
                            </Text>
                          </View>
                        )}
                      </View>
                      
                      {alert.affectsRoutes && alert.affectsRoutes.length > 0 && (
                        <View style={styles.routesSection}>
                          <View style={styles.routesHeader}>
                            <Text style={styles.routesLabel}>🚌 AFFECTED SERVICES</Text>
                            {alert.routeMatchingAccuracy && (
                              <View style={[
                                styles.confidenceBadge,
                                alert.routeMatchingAccuracy === 'high' && styles.confidenceBadgeHigh,
                                alert.routeMatchingAccuracy === 'medium' && styles.confidenceBadgeMedium,
                                alert.routeMatchingAccuracy === 'low' && styles.confidenceBadgeLow
                              ]}>
                                <Text style={[
                                  styles.confidenceBadgeText,
                                  alert.routeMatchingAccuracy === 'high' && styles.confidenceBadgeTextHigh,
                                  alert.routeMatchingAccuracy === 'medium' && styles.confidenceBadgeTextMedium,
                                  alert.routeMatchingAccuracy === 'low' && styles.confidenceBadgeTextLow
                                ]}>
                                  {alert.routeMatchingAccuracy?.toUpperCase()} CONFIDENCE
                                </Text>
                              </View>
                            )}
                          </View>
                          <View style={styles.routesList}>
                            {alert.affectsRoutes.map((route, idx) => {
                              const frequency = alert.routeFrequencySummaries?.[route];
                              const isHighFreq = alert.routeFrequencies?.[route]?.overall?.category === 'high-frequency';
                              const severity = alert.calculatedSeverity || alert.severity || 'Medium';
                              const estimatedDelay = severity === 'High' ? '+15-30min' : severity === 'Medium' ? '+5-15min' : '+2-8min';
                              
                              return (
                                <View 
                                  key={idx} 
                                  style={[
                                    styles.enhancedRouteBadge,
                                    isHighFreq && styles.routeBadgeHighFreq
                                  ]}
                                >
                                  <View style={styles.routeInfo}>
                                    <Text style={[styles.routeText, isHighFreq && styles.routeTextHighFreq]}>
                                      Route {route}
                                    </Text>
                                    <Text style={styles.routeFrequency}>
                                      {frequency || (isHighFreq ? 'High freq.' : 'Regular service')}
                                    </Text>
                                    <Text style={styles.routeDelay}>
                                      Est. delay: {estimatedDelay}
                                    </Text>
                                  </View>
                                </View>
                              );
                            })}
                          </View>
                          {alert.routeMatchMethod && (
                            <View style={styles.routeMatchingInfo}>
                              <Text style={styles.matchingMethod}>
                                📍 Matched using: {alert.routeMatchMethod}
                              </Text>
                            </View>
                          )}
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
              <TomTomTrafficMap 
                alerts={visibleAlerts}
                currentAlert={getCurrentAlert()}
                alertIndex={currentAlertIndex}
                autoZoom={true}
              />
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
                  <View 
                    key={activity.id} 
                    style={styles.activityItem}
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
  autoRotationInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: Platform.OS === 'web' ? 'blur(10px)' : undefined,
    padding: 12,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  rotationText: {
    ...typography.styles.bodyBase,
    color: '#3B82F6',
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
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
    padding: 0,
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

  // REDESIGNED ALERT CARD STYLES
  alertCard: {
    flex: 1,
  },

  // Alert Header
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
    backgroundColor: 'rgba(59, 130, 246, 0.02)',
  },
  alertHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 16,
  },
  alertTypeIcon: {
    fontSize: 28,
    marginRight: 12,
    marginTop: 2,
  },
  alertHeaderText: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 24,
    marginBottom: 8,
  },
  alertMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  alertTime: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    marginRight: 8,
  },
  alertSource: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '600',
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
    alignSelf: 'flex-start',
  },
  severityText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Section Styles
  locationSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  impactSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
    backgroundColor: 'rgba(245, 158, 11, 0.02)',
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 2,
  },
  iconText: {
    fontSize: 16,
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 22,
    marginBottom: 6,
  },
  coordinatesText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'System',
    fontWeight: '500',
  },
  impactText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 20,
    marginBottom: 6,
  },
  confidenceText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },

  // Description Section
  descriptionSection: {
    padding: 20,
    paddingTop: 16,
    backgroundColor: 'rgba(107, 114, 128, 0.02)',
  },
  descriptionText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    fontWeight: '500',
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
  routesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  routesLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  confidenceBadgeHigh: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10B981',
  },
  confidenceBadgeMedium: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: '#F59E0B',
  },
  confidenceBadgeLow: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#EF4444',
  },
  confidenceBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  confidenceBadgeTextHigh: {
    color: '#059669',
  },
  confidenceBadgeTextMedium: {
    color: '#D97706',
  },
  confidenceBadgeTextLow: {
    color: '#DC2626',
  },
  routesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  enhancedRouteBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 120,
    ...(Platform.OS === 'web' && {
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer',
    }),
  },
  routeInfo: {
    alignItems: 'center',
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
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  routeTextHighFreq: {
    fontWeight: '800',
  },
  routeFrequency: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  routeDelay: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  routeMatchingInfo: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 130, 246, 0.2)',
  },
  matchingMethod: {
    fontSize: 11,
    color: '#6B7280',
    fontStyle: 'italic',
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