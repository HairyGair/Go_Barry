// Go_BARRY/app/display.jsx
// Display Screen with Supervisor Interface Design
// Professional control room monitoring with supervisor layout

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DisplayScreen from '../components/DisplayScreen';
import SupervisorCard from '../components/SupervisorCard';
import { useSupervisorSync } from '../components/hooks/useSupervisorSync';
import { useBarryAPI } from '../components/hooks/useBARRYapi';
import { API_CONFIG } from '../config/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Display views for the sidebar
const DISPLAY_VIEWS = {
  alerts: {
    title: 'Live Traffic Alerts',
    icon: 'speedometer',
    description: 'Real-time traffic monitoring and alerts',
    color: '#3B82F6'
  },
  map: {
    title: 'Traffic Map View',
    icon: 'map',
    description: 'Interactive map with incident locations',
    color: '#10B981'
  },
  analytics: {
    title: 'System Analytics',
    icon: 'bar-chart',
    description: 'Performance metrics and data insights',
    color: '#8B5CF6'
  },
  supervisors: {
    title: 'Supervisor Status',
    icon: 'people',
    description: 'Connected supervisors and activity',
    color: '#F59E0B'
  }
};

const SupervisorDisplayScreen = () => {
  // Core state management
  const [activeView, setActiveView] = useState('alerts');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live supervisor sync for display
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

  // API data for alerts
  const {
    alerts,
    loading,
    lastUpdated,
    refreshAlerts,
    criticalAlerts,
    activeAlerts
  } = useBarryAPI({
    autoRefresh: true,
    refreshInterval: 15000 // 15 seconds for display
  });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcuts for display control
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (event) => {
      // Number keys for quick view switching
      if (event.key >= '1' && event.key <= '4') {
        event.preventDefault();
        const views = Object.keys(DISPLAY_VIEWS);
        const viewIndex = parseInt(event.key) - 1;
        if (views[viewIndex]) {
          setActiveView(views[viewIndex]);
        }
      }
      
      // 'B' to toggle sidebar
      if (event.key === 'b' || event.key === 'B') {
        event.preventDefault();
        setSidebarCollapsed(!sidebarCollapsed);
      }

      // 'R' to refresh data
      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        refreshAlerts();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarCollapsed, refreshAlerts]);

  // Get connection status color
  const getConnectionColor = () => {
    if (!wsConnected) return '#EF4444'; // Red - disconnected
    if (loading) return '#F59E0B'; // Orange - loading
    return '#10B981'; // Green - connected
  };

  // Render the active view content
  const renderActiveView = () => {
    const viewConfig = DISPLAY_VIEWS[activeView];
    
    switch (activeView) {
      case 'alerts':
        return (
          <View style={styles.viewContent}>
            <DisplayScreen />
          </View>
        );
      
      case 'map':
        return (
          <View style={styles.viewContent}>
            <View style={styles.placeholderContent}>
              <Ionicons name="map" size={64} color="#10B981" />
              <Text style={styles.placeholderTitle}>Interactive Traffic Map</Text>
              <Text style={styles.placeholderText}>
                Full-screen traffic map with real-time incident markers
              </Text>
            </View>
          </View>
        );
      
      case 'analytics':
        return (
          <View style={styles.viewContent}>
            <ScrollView style={styles.analyticsContainer}>
              <View style={styles.analyticsGrid}>
                <View style={styles.analyticsCard}>
                  <View style={styles.analyticsHeader}>
                    <Ionicons name="pulse" size={24} color="#3B82F6" />
                    <Text style={styles.analyticsTitle}>System Health</Text>
                  </View>
                  <Text style={styles.analyticsValue}>{wsConnected ? 'Online' : 'Offline'}</Text>
                  <Text style={styles.analyticsSubtext}>WebSocket Connection</Text>
                </View>
                
                <View style={styles.analyticsCard}>
                  <View style={styles.analyticsHeader}>
                    <Ionicons name="alert-circle" size={24} color="#EF4444" />
                    <Text style={styles.analyticsTitle}>Active Alerts</Text>
                  </View>
                  <Text style={styles.analyticsValue}>{alerts.length}</Text>
                  <Text style={styles.analyticsSubtext}>Total incidents</Text>
                </View>
                
                <View style={styles.analyticsCard}>
                  <View style={styles.analyticsHeader}>
                    <Ionicons name="warning" size={24} color="#F59E0B" />
                    <Text style={styles.analyticsTitle}>Critical</Text>
                  </View>
                  <Text style={styles.analyticsValue}>{criticalAlerts.length}</Text>
                  <Text style={styles.analyticsSubtext}>High priority</Text>
                </View>
                
                <View style={styles.analyticsCard}>
                  <View style={styles.analyticsHeader}>
                    <Ionicons name="people" size={24} color="#8B5CF6" />
                    <Text style={styles.analyticsTitle}>Supervisors</Text>
                  </View>
                  <Text style={styles.analyticsValue}>{connectedSupervisors}</Text>
                  <Text style={styles.analyticsSubtext}>Online now</Text>
                </View>
              </View>
              
              <View style={styles.analyticsDetails}>
                <Text style={styles.analyticsDetailsTitle}>Data Sources</Text>
                <View style={styles.dataSourcesList}>
                  <View style={styles.dataSourceItem}>
                    <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                    <Text style={styles.dataSourceText}>TomTom API - Active</Text>
                  </View>
                  <View style={styles.dataSourceItem}>
                    <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                    <Text style={styles.dataSourceText}>HERE API - Active</Text>
                  </View>
                  <View style={styles.dataSourceItem}>
                    <View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} />
                    <Text style={styles.dataSourceText}>MapQuest API - Auth Issue</Text>
                  </View>
                  <View style={styles.dataSourceItem}>
                    <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                    <Text style={styles.dataSourceText}>National Highways - Active</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        );
      
      case 'supervisors':
        return (
          <View style={styles.viewContent}>
            <ScrollView style={styles.supervisorsContainer}>
              <SupervisorCard 
                supervisors={activeSupervisors || []}
                connectedCount={connectedSupervisors}
                style={styles.supervisorCardExpanded}
              />
              
              {customMessages.length > 0 && (
                <View style={styles.messagesSection}>
                  <Text style={styles.sectionTitle}>Supervisor Messages</Text>
                  {customMessages.map(message => (
                    <View key={message.id} style={styles.messageCard}>
                      <View style={styles.messageHeader}>
                        <Ionicons 
                          name="chatbubble" 
                          size={16} 
                          color="#3B82F6" 
                        />
                        <Text style={styles.messageTime}>
                          {new Date(message.timestamp).toLocaleTimeString('en-GB')}
                        </Text>
                      </View>
                      <Text style={styles.messageText}>{message.message}</Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        );
      
      default:
        return (
          <View style={styles.viewContent}>
            <View style={styles.placeholderContent}>
              <Ionicons name="construct" size={64} color="#6B7280" />
              <Text style={styles.placeholderTitle}>View Not Available</Text>
              <Text style={styles.placeholderText}>This view is under development</Text>
            </View>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Sidebar Navigation */}
      <View style={[styles.sidebar, sidebarCollapsed && styles.sidebarCollapsed]}>
        {/* Header */}
        <View style={styles.sidebarHeader}>
          <View style={styles.logoContainer}>
            <View style={styles.logoImageContainer}>
              <Text style={styles.logoText}>🚦</Text>
            </View>
            {!sidebarCollapsed && (
              <View style={styles.logoTextContainer}>
                <Text style={styles.appTitle}>BARRY</Text>
                <Text style={styles.appVersion}>Control Room Display</Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity
            style={styles.collapseButton}
            onPress={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <Ionicons 
              name={sidebarCollapsed ? "chevron-forward" : "chevron-back"} 
              size={20} 
              color="#6B7280" 
            />
          </TouchableOpacity>
        </View>

        {/* System Status */}
        <View style={styles.systemStatus}>
          <View style={styles.statusInfo}>
            <View style={styles.statusAvatar}>
              <Ionicons 
                name={wsConnected ? "wifi" : "wifi-outline"} 
                size={sidebarCollapsed ? 16 : 20} 
                color={getConnectionColor()} 
              />
            </View>
            {!sidebarCollapsed && (
              <View style={styles.statusDetails}>
                <Text style={styles.statusTitle}>System Status</Text>
                <Text style={[styles.statusText, { color: getConnectionColor() }]}>
                  {wsConnected ? 'Connected' : 'Disconnected'}
                </Text>
                <Text style={styles.lastUpdateText}>
                  Last update: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString('en-GB') : 'Never'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Navigation Items */}
        <ScrollView style={styles.navigationContainer}>
          {Object.entries(DISPLAY_VIEWS).map(([viewId, view], index) => (
            <TouchableOpacity
              key={viewId}
              style={[
                styles.navItem,
                activeView === viewId && styles.navItemActive,
                sidebarCollapsed && styles.navItemCollapsed
              ]}
              onPress={() => setActiveView(viewId)}
            >
              <View style={styles.navItemContent}>
                <Ionicons 
                  name={view.icon} 
                  size={sidebarCollapsed ? 20 : 24} 
                  color={activeView === viewId ? view.color : '#6B7280'} 
                />
                {!sidebarCollapsed && (
                  <View style={styles.navItemText}>
                    <Text style={[
                      styles.navItemTitle,
                      activeView === viewId && { color: view.color }
                    ]}>
                      {view.title}
                    </Text>
                    <Text style={styles.keyboardShortcut}>
                      Press {index + 1}
                    </Text>
                  </View>
                )}
              </View>
              
              {activeView === viewId && (
                <View style={[styles.activeIndicator, { backgroundColor: view.color }]} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.sidebarFooter}>
          <TouchableOpacity
            style={styles.footerButton}
            onPress={refreshAlerts}
          >
            <Ionicons name="refresh" size={20} color="#3B82F6" />
            {!sidebarCollapsed && (
              <Text style={styles.footerButtonText}>Refresh (R)</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerTitleContainer}>
              <Ionicons 
                name={DISPLAY_VIEWS[activeView].icon} 
                size={24} 
                color={DISPLAY_VIEWS[activeView].color} 
              />
              <Text style={styles.headerTitle}>{DISPLAY_VIEWS[activeView].title}</Text>
            </View>
            <Text style={styles.headerDescription}>{DISPLAY_VIEWS[activeView].description}</Text>
          </View>
          
          <View style={styles.headerRight}>
            <View style={styles.headerStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{alerts.length}</Text>
                <Text style={styles.statLabel}>Alerts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{criticalAlerts.length}</Text>
                <Text style={styles.statLabel}>Critical</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{connectedSupervisors}</Text>
                <Text style={styles.statLabel}>Supervisors</Text>
              </View>
            </View>
            
            <Text style={styles.currentTime}>
              {currentTime.toLocaleTimeString('en-GB', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit',
                hour12: false 
              })}
            </Text>
          </View>
        </View>
        
        {/* View Content */}
        {renderActiveView()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    minHeight: '100vh',
  },
  
  // Sidebar styles (matching browser-main)
  sidebar: {
    width: 280,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    display: 'flex',
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  sidebarCollapsed: {
    width: 72,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoText: {
    fontSize: 28,
  },
  logoImageContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoTextContainer: {
    flexDirection: 'column',
  },
  appTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    letterSpacing: 1,
  },
  appVersion: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
  },
  collapseButton: {
    padding: 4,
  },
  
  // System status
  systemStatus: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDetails: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  lastUpdateText: {
    fontSize: 10,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  
  // Navigation
  navigationContainer: {
    flex: 1,
    paddingVertical: 8,
  },
  navItem: {
    marginHorizontal: 12,
    marginVertical: 2,
    borderRadius: 8,
    position: 'relative',
  },
  navItemActive: {
    backgroundColor: '#F8FAFC',
  },
  navItemCollapsed: {
    marginHorizontal: 8,
    alignItems: 'center',
  },
  navItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  navItemText: {
    flex: 1,
  },
  navItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  keyboardShortcut: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  activeIndicator: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderRadius: 2,
  },
  
  // Footer
  sidebarFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  
  // Main content
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  
  // Header
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  headerStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  currentTime: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  
  // View content
  viewContent: {
    flex: 1,
    overflow: 'hidden',
  },
  
  // Placeholder content
  placeholderContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 60,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // Analytics view
  analyticsContainer: {
    flex: 1,
    padding: 20,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  analyticsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    minWidth: 200,
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  analyticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  analyticsValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  analyticsSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  analyticsDetails: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  analyticsDetailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  dataSourcesList: {
    gap: 12,
  },
  dataSourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dataSourceText: {
    fontSize: 14,
    color: '#374151',
  },
  
  // Supervisors view
  supervisorsContainer: {
    flex: 1,
    padding: 20,
  },
  supervisorCardExpanded: {
    marginBottom: 24,
  },
  messagesSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  messageCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  messageTime: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  messageText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
});

export default SupervisorDisplayScreen;