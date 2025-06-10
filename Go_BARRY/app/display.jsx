// Go_BARRY/app/display.jsx
// Large-scale non-interactive display optimized for control room visibility
// Receives real-time updates from supervisor controls via WebSocket

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBarryAPI } from '../components/hooks/useBARRYapi';
import { useSupervisorSync } from '../components/hooks/useSupervisorSync';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ControlRoomDisplay = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

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
  } = useSupervisorSync({
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

  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Categorize alerts for control room priority
  const criticalCount = alerts.filter(alert => 
    alert.severity === 'High' || 
    (alert.affectsRoutes && alert.affectsRoutes.length >= 4)
  ).length;

  const urgentCount = alerts.filter(alert => 
    alert.severity === 'Medium' && 
    alert.affectsRoutes && 
    alert.affectsRoutes.length > 0
  ).length;

  const monitorCount = alerts.length - criticalCount - urgentCount;

  return (
    <View style={styles.container}>
      {/* CONNECTION STATUS */}
      <View style={[styles.emergencyNotice, wsConnected ? styles.connectedNotice : null]}>
        <Ionicons name={wsConnected ? "wifi" : "wifi-off"} size={20} color={wsConnected ? "#10B981" : "#F59E0B"} />
        <Text style={styles.emergencyText}>
          {wsConnected 
            ? `Supervisor sync active • ${connectedSupervisors} supervisor${connectedSupervisors !== 1 ? 's' : ''} connected`
            : 'Supervisor sync offline • Display functioning with live traffic data'
          }
        </Text>
      </View>

      {/* CONTROL ROOM HEADER - Visible from anywhere in room */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoSection}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>🚦</Text>
            </View>
            <View style={styles.titleSection}>
              <Text style={styles.systemTitle}>GO NORTH EAST</Text>
              <Text style={styles.displayTitle}>LIVE TRAFFIC CONTROL ROOM</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.headerCenter}>
          <Text style={styles.timeDisplay}>{formatTime(currentTime)}</Text>
          <Text style={styles.dateDisplay}>{formatDate(currentTime)}</Text>
        </View>
        
        <View style={styles.headerRight}>
          <View style={[styles.statusCard, { borderColor: systemStatus.color }]}>
            <Ionicons name={systemStatus.icon} size={32} color={systemStatus.color} />
            <Text style={[styles.statusText, { color: systemStatus.color }]}>
              {systemStatus.text}
            </Text>
          </View>
          <Text style={styles.lastUpdateText}>
            Last Update: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString('en-GB') : 'Never'}
          </Text>
        </View>
      </View>

      {/* LIVE METRICS DASHBOARD - Large numbers visible from distance */}
      <View style={styles.metricsSection}>
        <View style={[styles.metricCard, styles.criticalMetric]}>
          <Text style={styles.metricNumber}>{criticalCount}</Text>
          <Text style={styles.metricLabel}>CRITICAL ALERTS</Text>
          <Text style={styles.metricAction}>IMMEDIATE RESPONSE</Text>
        </View>
        
        <View style={[styles.metricCard, styles.urgentMetric]}>
          <Text style={styles.metricNumber}>{urgentCount}</Text>
          <Text style={styles.metricLabel}>URGENT ALERTS</Text>
          <Text style={styles.metricAction}>REVIEW REQUIRED</Text>
        </View>
        
        <View style={[styles.metricCard, styles.monitorMetric]}>
          <Text style={styles.metricNumber}>{monitorCount}</Text>
          <Text style={styles.metricLabel}>MONITORING</Text>
          <Text style={styles.metricAction}>NORMAL STATUS</Text>
        </View>
        
        <View style={[styles.metricCard, styles.supervisorMetric]}>
          <Text style={styles.metricNumber}>{connectedSupervisors}</Text>
          <Text style={styles.metricLabel}>SUPERVISORS</Text>
          <Text style={styles.metricAction}>LIVE CONTROL</Text>
        </View>
      </View>

      {/* MAIN CONTROL ROOM CONTENT */}
      <View style={styles.mainContent}>
        {/* LARGE TRAFFIC MAP - 60% of screen for room visibility */}
        <View style={styles.mapSection}>
          <View style={styles.mapHeader}>
            <Ionicons name="map" size={32} color="#3B82F6" />
            <Text style={styles.mapTitle}>LIVE TRAFFIC MAP</Text>
            <View style={styles.mapMetrics}>
              <Text style={styles.mapMetric}>Newcastle & Gateshead</Text>
            </View>
          </View>
          
          <View style={styles.mapContainer}>
            {/* Large map placeholder - will be replaced with real map component */}
            <View style={styles.mapPlaceholder}>
              <Ionicons name="map-outline" size={120} color="#6B7280" />
              <Text style={styles.mapPlaceholderText}>LIVE TRAFFIC MAP</Text>
              <Text style={styles.mapPlaceholderSubtext}>
                Real-time traffic data from TomTom, HERE, National Highways
              </Text>
              <View style={styles.mapLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#DC2626' }]} />
                  <Text style={styles.legendText}>Critical Incidents</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={styles.legendText}>Traffic Delays</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#059669' }]} />
                  <Text style={styles.legendText}>Normal Flow</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* LARGE ALERT CARDS - 40% of screen, readable from distance */}
        <View style={styles.alertsSection}>
          <View style={styles.alertsHeader}>
            <Ionicons name="alert-circle" size={32} color="#DC2626" />
            <Text style={styles.alertsTitle}>LIVE ALERTS</Text>
            <View style={styles.alertsBadge}>
              <Text style={styles.alertsCount}>{alerts.length}</Text>
            </View>
          </View>
          
          <ScrollView style={styles.alertsList} showsVerticalScrollIndicator={false}>
            {alerts.length > 0 ? (
              alerts.map((alert, index) => {
                // Get priority with supervisor overrides
                const priorityOverride = priorityOverrides.get(alert.id);
                const supervisorNote = supervisorNotes.get(alert.id);
                const isAcknowledged = acknowledgedAlerts.has(alert.id);
                
                let priority = 'MONITOR';
                let priorityColor = '#059669';
                let priorityBg = '#064E3B';
                
                if (priorityOverride) {
                  switch (priorityOverride.priority) {
                    case 'CRITICAL':
                      priority = 'CRITICAL';
                      priorityColor = '#FECACA';
                      priorityBg = '#7F1D1D';
                      break;
                    case 'HIGH':
                      priority = 'URGENT';
                      priorityColor = '#FED7AA';
                      priorityBg = '#92400E';
                      break;
                    case 'MEDIUM':
                      priority = 'MONITOR';
                      priorityColor = '#BBF7D0';
                      priorityBg = '#064E3B';
                      break;
                  }
                } else {
                  // Auto-priority based on impact
                  if (alert.severity === 'High' || (alert.affectsRoutes && alert.affectsRoutes.length >= 4)) {
                    priority = 'CRITICAL';
                    priorityColor = '#FECACA';
                    priorityBg = '#7F1D1D';
                  } else if (alert.severity === 'Medium' && alert.affectsRoutes && alert.affectsRoutes.length > 0) {
                    priority = 'URGENT';
                    priorityColor = '#FED7AA';
                    priorityBg = '#92400E';
                  }
                }

                return (
                  <View 
                    key={alert.id || index} 
                    style={[
                      styles.alertCard,
                      { backgroundColor: priorityBg },
                      isAcknowledged && styles.acknowledgedAlert
                    ]}
                  >
                    {/* Priority Banner - Large and visible */}
                    <View style={styles.priorityBanner}>
                      <View style={styles.priorityLeft}>
                        <Text style={[styles.priorityLabel, { color: priorityColor }]}>
                          {priority}
                        </Text>
                        {priority === 'CRITICAL' && (
                          <Ionicons name="warning" size={24} color={priorityColor} />
                        )}
                      </View>
                      {isAcknowledged && (
                        <View style={styles.acknowledgedBadge}>
                          <Ionicons name="checkmark-circle" size={20} color="#059669" />
                          <Text style={styles.acknowledgedText}>ACKNOWLEDGED</Text>
                        </View>
                      )}
                    </View>

                    {/* Alert Content - Large text for distance reading */}
                    <View style={styles.alertBody}>
                      <View style={styles.alertMain}>
                        <Ionicons 
                          name={alert.type === 'incident' ? 'alert-circle' : 'construct'} 
                          size={32} 
                          color={priorityColor}
                        />
                        <View style={styles.alertInfo}>
                          <Text style={[styles.alertTitle, { color: priorityColor }]}>
                            {alert.title}
                          </Text>
                          <Text style={[styles.alertLocation, { color: priorityColor }]}>
                            {alert.location}
                          </Text>
                        </View>
                      </View>
                      
                      <Text style={[styles.alertDescription, { color: priorityColor }]}>
                        {alert.description}
                      </Text>

                      {/* Service Impact - Large route badges */}
                      {alert.affectsRoutes && alert.affectsRoutes.length > 0 && (
                        <View style={styles.serviceImpact}>
                          <Text style={[styles.impactLabel, { color: priorityColor }]}>
                            AFFECTED SERVICES:
                          </Text>
                          <View style={styles.routesList}>
                            {alert.affectsRoutes.slice(0, 8).map((route, idx) => (
                              <View 
                                key={idx} 
                                style={[styles.routeBadge, { backgroundColor: priorityColor }]}
                              >
                                <Text style={[styles.routeText, { color: priorityBg }]}>
                                  {route}
                                </Text>
                              </View>
                            ))}
                            {alert.affectsRoutes.length > 8 && (
                              <Text style={[styles.moreRoutes, { color: priorityColor }]}>
                                +{alert.affectsRoutes.length - 8} MORE SERVICES
                              </Text>
                            )}
                          </View>
                        </View>
                      )}

                      {/* Supervisor Notes */}
                      {supervisorNote && (
                        <View style={styles.supervisorNote}>
                          <Ionicons name="document-text" size={20} color={priorityColor} />
                          <Text style={[styles.noteText, { color: priorityColor }]}>
                            SUPERVISOR: {supervisorNote.note}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Alert Footer */}
                    <View style={styles.alertFooter}>
                      <Text style={[styles.sourceInfo, { color: priorityColor }]}>
                        SOURCE: {alert.source?.toUpperCase() || 'SYSTEM'} • 
                        SEVERITY: {alert.severity?.toUpperCase() || 'UNKNOWN'}
                      </Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.noAlertsDisplay}>
                <Ionicons name="shield-checkmark" size={80} color="#059669" />
                <Text style={styles.noAlertsTitle}>ALL SYSTEMS NORMAL</Text>
                <Text style={styles.noAlertsText}>
                  No traffic alerts requiring attention
                </Text>
                <Text style={styles.noAlertsSubtext}>
                  Services operating normally across the Go North East network
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {/* CONTROL ROOM FOOTER */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerTitle}>Go North East Traffic Control Room</Text>
          <Text style={styles.footerSubtitle}>
            Live Production System • Real-time Traffic Intelligence • Supervisor Sync {wsConnected ? 'Online' : 'Offline'}
          </Text>
        </View>
        
        <View style={styles.footerRight}>
          <Text style={styles.systemInfo}>
            {wsConnected ? '🟢' : '🟡'} LIVE MONITORING • Auto-refresh: 10s • Supervisor Sync {wsConnected ? 'Active' : 'Standby'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    minHeight: '100vh',
  },
  
  // CONNECTION STATUS
  emergencyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#92400E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#F59E0B',
  },
  
  connectedNotice: {
    backgroundColor: '#064E3B',
    borderBottomColor: '#10B981',
  },
  
  emergencyText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
  },
  
  // CONTROL ROOM HEADER - Large and visible
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#1E293B',
    borderBottomWidth: 4,
    borderBottomColor: '#DC2626',
    minHeight: 120,
  },
  
  headerLeft: {
    flex: 1,
  },
  
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  
  logo: {
    width: 80,
    height: 80,
    backgroundColor: '#DC2626',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  
  logoText: {
    fontSize: 40,
  },
  
  titleSection: {
    flex: 1,
  },
  
  systemTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 4,
  },
  
  displayTitle: {
    fontSize: 20,
    color: '#F59E0B',
    fontWeight: '700',
    letterSpacing: 1,
  },
  
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  
  timeDisplay: {
    fontSize: 56,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 8,
  },
  
  dateDisplay: {
    fontSize: 18,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#1F2937',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 3,
    marginBottom: 12,
  },
  
  statusText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  
  lastUpdateText: {
    fontSize: 14,
    color: '#94A3B8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
  },
  
  // METRICS SECTION - Large numbers
  metricsSection: {
    flexDirection: 'row',
    gap: 24,
    padding: 32,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  
  metricCard: {
    flex: 1,
    alignItems: 'center',
    padding: 32,
    borderRadius: 20,
    borderWidth: 3,
  },
  
  criticalMetric: {
    backgroundColor: '#7F1D1D',
    borderColor: '#DC2626',
  },
  
  urgentMetric: {
    backgroundColor: '#92400E',
    borderColor: '#F59E0B',
  },
  
  monitorMetric: {
    backgroundColor: '#064E3B',
    borderColor: '#059669',
  },
  
  supervisorMetric: {
    backgroundColor: '#1E3A8A',
    borderColor: '#3B82F6',
  },
  
  metricNumber: {
    fontSize: 64,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  
  metricLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 8,
  },
  
  metricAction: {
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '600',
    letterSpacing: 1,
    textAlign: 'center',
  },
  
  // MAIN CONTENT - Map and Alerts
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    gap: 32,
    padding: 32,
  },
  
  // LARGE MAP SECTION - 60% width
  mapSection: {
    flex: 3,
    backgroundColor: '#1F2937',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 24,
    backgroundColor: '#374151',
    borderBottomWidth: 1,
    borderBottomColor: '#4B5563',
  },
  
  mapTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    flex: 1,
  },
  
  mapMetrics: {
    alignItems: 'flex-end',
  },
  
  mapMetric: {
    fontSize: 16,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  
  mapContainer: {
    flex: 1,
  },
  
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  
  mapPlaceholderText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#6B7280',
    marginTop: 24,
    letterSpacing: 2,
  },
  
  mapPlaceholderSubtext: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  
  mapLegend: {
    flexDirection: 'row',
    gap: 32,
    marginTop: 32,
  },
  
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  
  legendText: {
    fontSize: 14,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  
  // ALERTS SECTION - 40% width
  alertsSection: {
    flex: 2,
    backgroundColor: '#1F2937',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  
  alertsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 24,
    backgroundColor: '#374151',
    borderBottomWidth: 1,
    borderBottomColor: '#4B5563',
  },
  
  alertsTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    flex: 1,
  },
  
  alertsBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  
  alertsCount: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  
  alertsList: {
    flex: 1,
    padding: 16,
  },
  
  // LARGE ALERT CARDS - Readable from distance
  alertCard: {
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  acknowledgedAlert: {
    opacity: 0.6,
  },
  
  priorityBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  
  priorityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  
  priorityLabel: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
  
  acknowledgedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(5, 150, 105, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  
  acknowledgedText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '700',
    letterSpacing: 1,
  },
  
  alertBody: {
    padding: 20,
  },
  
  alertMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  
  alertInfo: {
    flex: 1,
  },
  
  alertTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    lineHeight: 28,
  },
  
  alertLocation: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  
  alertDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    fontWeight: '500',
  },
  
  serviceImpact: {
    marginBottom: 16,
  },
  
  impactLabel: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },
  
  routesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  
  routeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  
  routeText: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  
  moreRoutes: {
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  
  supervisorNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  
  noteText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  
  alertFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  sourceInfo: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
    letterSpacing: 1,
  },
  
  // NO ALERTS STATE
  noAlertsDisplay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  
  noAlertsTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#059669',
    marginTop: 24,
    marginBottom: 16,
    letterSpacing: 2,
  },
  
  noAlertsText: {
    fontSize: 20,
    color: '#CBD5E1',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },
  
  noAlertsSubtext: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // FOOTER
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  
  footerLeft: {
    flex: 1,
  },
  
  footerTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 4,
  },
  
  footerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  
  footerRight: {
    alignItems: 'flex-end',
  },
  
  systemInfo: {
    fontSize: 14,
    color: '#CBD5E1',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});

export default ControlRoomDisplay;