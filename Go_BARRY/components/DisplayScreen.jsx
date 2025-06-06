// Go_BARRY/components/DisplayScreen.jsx
// Large Display Screen Component for Control Room Monitors
// Optimized for 55"+ displays and wall-mounted screens

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBarryAPI } from './hooks/useBARRYapi';
import EnhancedTrafficCard from './EnhancedTrafficCard';
import { Colors } from '../constants/Colors';

const { width, height } = Dimensions.get('window');

const DisplayScreen = () => {
  const {
    alerts,
    activeAlerts,
    criticalAlerts,
    loading,
    lastUpdated,
    refreshAlerts
  } = useBarryAPI({
    autoRefresh: true,
    refreshInterval: 30000 // 30 seconds for display screen
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [displayMode, setDisplayMode] = useState('overview'); // overview, alerts, critical
  const [autoRotate, setAutoRotate] = useState(true);
  const [rotationInterval, setRotationInterval] = useState(15000); // 15 seconds

  // Update time every second for display screen
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-rotation between display modes
  useEffect(() => {
    if (!autoRotate) return;

    const modes = ['overview', 'alerts', 'critical'];
    let currentIndex = modes.indexOf(displayMode);

    const rotationTimer = setInterval(() => {
      currentIndex = (currentIndex + 1) % modes.length;
      setDisplayMode(modes[currentIndex]);
    }, rotationInterval);

    return () => clearInterval(rotationTimer);
  }, [autoRotate, displayMode, rotationInterval]);

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
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (severity) => {
    switch (severity) {
      case 'High': return '#EF4444';
      case 'Medium': return '#F59E0B';
      case 'Low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const renderOverviewMode = () => (
    <View style={styles.overviewContainer}>
      {/* Statistics Cards */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { borderColor: '#EF4444' }]}>
          <Text style={styles.statNumber}>{criticalAlerts.length}</Text>
          <Text style={styles.statLabel}>Critical Alerts</Text>
          <Ionicons name="alert-circle" size={32} color="#EF4444" />
        </View>
        
        <View style={[styles.statCard, { borderColor: '#F59E0B' }]}>
          <Text style={styles.statNumber}>{activeAlerts.length}</Text>
          <Text style={styles.statLabel}>Active Alerts</Text>
          <Ionicons name="warning" size={32} color="#F59E0B" />
        </View>
        
        <View style={[styles.statCard, { borderColor: '#3B82F6' }]}>
          <Text style={styles.statNumber}>{alerts.length}</Text>
          <Text style={styles.statLabel}>Total Alerts</Text>
          <Ionicons name="list" size={32} color="#3B82F6" />
        </View>
        
        <View style={[styles.statCard, { borderColor: '#10B981' }]}>
          <Text style={styles.statNumber}>
            {alerts.filter(a => a.source === 'streetmanager').length}
          </Text>
          <Text style={styles.statLabel}>Roadworks</Text>
          <Ionicons name="construct" size={32} color="#10B981" />
        </View>
      </View>

      {/* Recent Critical Alerts */}
      <View style={styles.criticalSection}>
        <Text style={styles.sectionTitle}>⚠️ Critical Alerts</Text>
        {criticalAlerts.length > 0 ? (
          <ScrollView style={styles.alertsList} showsVerticalScrollIndicator={false}>
            {criticalAlerts.slice(0, 4).map((alert, index) => (
              <View key={alert.id || index} style={styles.displayAlert}>
                <View style={[styles.alertIndicator, { backgroundColor: getStatusColor(alert.severity) }]} />
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertLocation}>{alert.location}</Text>
                  <Text style={styles.alertTime}>
                    {new Date(alert.lastUpdated || alert.timestamp).toLocaleTimeString('en-GB')}
                  </Text>
                </View>
                <View style={styles.alertMeta}>
                  <Text style={[styles.alertSeverity, { color: getStatusColor(alert.severity) }]}>
                    {alert.severity?.toUpperCase()}
                  </Text>
                  {alert.affectsRoutes && alert.affectsRoutes.length > 0 && (
                    <Text style={styles.alertRoutes}>
                      Routes: {alert.affectsRoutes.slice(0, 3).join(', ')}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.noAlertsContainer}>
            <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            <Text style={styles.noAlertsText}>No Critical Alerts</Text>
            <Text style={styles.noAlertsSubtext}>All systems operating normally</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderAlertsMode = () => (
    <View style={styles.alertsContainer}>
      <Text style={styles.sectionTitle}>🚨 All Active Alerts</Text>
      {activeAlerts.length > 0 ? (
        <ScrollView style={styles.alertsList} showsVerticalScrollIndicator={false}>
          {activeAlerts.slice(0, 8).map((alert, index) => (
            <View key={alert.id || index} style={styles.displayAlert}>
              <View style={[styles.alertIndicator, { backgroundColor: getStatusColor(alert.severity) }]} />
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertLocation}>{alert.location}</Text>
                <Text style={styles.alertDescription} numberOfLines={2}>
                  {alert.description}
                </Text>
                <Text style={styles.alertTime}>
                  {new Date(alert.lastUpdated || alert.timestamp).toLocaleTimeString('en-GB')}
                </Text>
              </View>
              <View style={styles.alertMeta}>
                <Text style={[styles.alertSeverity, { color: getStatusColor(alert.severity) }]}>
                  {alert.severity?.toUpperCase()}
                </Text>
                <Text style={styles.alertSource}>{alert.source?.toUpperCase()}</Text>
                {alert.affectsRoutes && alert.affectsRoutes.length > 0 && (
                  <Text style={styles.alertRoutes}>
                    {alert.affectsRoutes.slice(0, 5).join(', ')}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.noAlertsContainer}>
          <Ionicons name="checkmark-circle" size={64} color="#10B981" />
          <Text style={styles.noAlertsText}>No Active Alerts</Text>
          <Text style={styles.noAlertsSubtext}>Traffic flowing normally across the network</Text>
        </View>
      )}
    </View>
  );

  const renderCriticalMode = () => (
    <View style={styles.criticalContainer}>
      <Text style={styles.sectionTitle}>🔴 Critical Incidents</Text>
      {criticalAlerts.length > 0 ? (
        <ScrollView style={styles.alertsList} showsVerticalScrollIndicator={false}>
          {criticalAlerts.map((alert, index) => (
            <View key={alert.id || index} style={styles.criticalAlert}>
              <View style={styles.criticalHeader}>
                <Ionicons name="alert-circle" size={32} color="#EF4444" />
                <Text style={styles.criticalTitle}>{alert.title}</Text>
                <Text style={styles.criticalTime}>
                  {new Date(alert.lastUpdated || alert.timestamp).toLocaleTimeString('en-GB')}
                </Text>
              </View>
              <Text style={styles.criticalLocation}>{alert.location}</Text>
              <Text style={styles.criticalDescription}>{alert.description}</Text>
              {alert.affectsRoutes && alert.affectsRoutes.length > 0 && (
                <View style={styles.criticalRoutes}>
                  <Text style={styles.criticalRoutesLabel}>Affected Routes:</Text>
                  <Text style={styles.criticalRoutesText}>
                    {alert.affectsRoutes.join(', ')}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.noAlertsContainer}>
          <Ionicons name="shield-checkmark" size={80} color="#10B981" />
          <Text style={styles.noAlertsText}>No Critical Incidents</Text>
          <Text style={styles.noAlertsSubtext}>Network operating within normal parameters</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>🚦 BARRY Traffic Intelligence</Text>
          <Text style={styles.headerSubtitle}>Go North East Control Room Display</Text>
        </View>
        
        <View style={styles.headerCenter}>
          <Text style={styles.timeDisplay}>{formatTime(currentTime)}</Text>
          <Text style={styles.dateDisplay}>{formatDate(currentTime)}</Text>
        </View>
        
        <View style={styles.headerRight}>
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, { backgroundColor: loading ? '#F59E0B' : '#10B981' }]} />
            <Text style={styles.statusText}>
              {loading ? 'UPDATING' : 'LIVE'}
            </Text>
          </View>
          <Text style={styles.lastUpdated}>
            Last: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString('en-GB') : 'Never'}
          </Text>
        </View>
      </View>

      {/* Mode Controls */}
      <View style={styles.modeControls}>
        {['overview', 'alerts', 'critical'].map(mode => (
          <TouchableOpacity
            key={mode}
            style={[styles.modeButton, displayMode === mode && styles.modeButtonActive]}
            onPress={() => {
              setDisplayMode(mode);
              setAutoRotate(false); // Disable auto-rotation when manually switching
            }}
          >
            <Text style={[
              styles.modeButtonText,
              displayMode === mode && styles.modeButtonTextActive
            ]}>
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
        
        <TouchableOpacity
          style={[styles.autoRotateButton, autoRotate && styles.autoRotateActive]}
          onPress={() => setAutoRotate(!autoRotate)}
        >
          <Ionicons name="refresh" size={16} color={autoRotate ? '#FFFFFF' : '#6B7280'} />
          <Text style={[
            styles.autoRotateText,
            autoRotate && styles.autoRotateTextActive
          ]}>
            Auto
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {displayMode === 'overview' && renderOverviewMode()}
        {displayMode === 'alerts' && renderAlertsMode()}
        {displayMode === 'critical' && renderCriticalMode()}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Go North East • Real-time Traffic Intelligence • Display Screen Mode
        </Text>
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Black background for control room
    minHeight: '100vh',
  },
  
  // Header Styles
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
    textShadow: '0 0 10px #3B82F6',
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
  statusPanel: {
    alignItems: 'flex-end',
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 8,
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

  // Priority Summary
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

  // Alerts Feed
  alertsFeed: {
    flex: 1,
    padding: 16,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    borderRadius: 8,
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertCardBlink: {
    shadowColor: '#DC2626',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  alertCardAcknowledged: {
    opacity: 0.7,
    backgroundColor: '#F9FAFB',
  },

  // Priority Banner
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

  // Alert Content
  alertHeader: {
    padding: 16,
    paddingBottom: 8,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  alertTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    lineHeight: 24,
  },
  alertTime: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  alertContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
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
  },

  // Service Impact
  serviceImpact: {
    paddingHorizontal: 16,
    paddingBottom: 12,
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

  // Supervisor Actions
  supervisorActions: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 8,
    paddingTop: 12,
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

  // Alert Footer
  alertFooter: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  sourceText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },

  // No Alerts State
  noAlertsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noAlertsTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#059669',
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 2,
  },
  noAlertsText: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  noAlertsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // Footer
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
});

export default DisplayScreen;
