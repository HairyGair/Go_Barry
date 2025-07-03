// Go_BARRY/app/communications-hub.jsx
// Go Barry v3.0 - Communications Hub
// Dedicated interface for messaging, alerts, and communications

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import only communications-related components
import MessageDistributionEnhanced from '../components/communications/MessageDistributionEnhanced';
import EmailIntegrationEnhanced from '../components/communications/EmailIntegrationEnhanced';
import VoIPIntegrationEnhanced from '../components/communications/voip/VoIPIntegrationEnhanced';
import SharePointIntegration from '../components/communications/sharepoint/SharePointIntegration';
import AutomatedReportingSystem from '../components/AutomatedReportingSystem';

import { useSupervisor } from '../components/hooks/useSupervisorSession';
import { API_CONFIG } from '../config/api';

const { width, height } = Dimensions.get('window');

// Communications-only navigation
const COMMUNICATIONS_NAV = {
  messaging: {
    title: 'Message Distribution',
    icon: 'chatbubbles',
    component: MessageDistributionEnhanced,
    description: 'Unified Ticketer & Email messaging with templates',
    color: '#8B5CF6'
  },
  email: {
    title: 'Email Integration',
    icon: 'mail',
    component: EmailIntegrationEnhanced,
    description: 'Outlook Web Access & Quick Compose',
    color: '#10B981'
  },
  voip: {
    title: '8x8 VoIP',
    icon: 'call',
    component: VoIPIntegrationEnhanced,
    description: 'Phone system with quick dial & emergency numbers',
    color: '#7C3AED'
  },
  reports: {
    title: 'Automated Reports',
    icon: 'document-text',
    component: AutomatedReportingSystem,
    description: 'Daily reports & operational summaries',
    color: '#F59E0B'
  },
  sharepoint: {
    title: 'SharePoint',
    icon: 'folder-open',
    component: SharePointIntegration,
    description: 'Team documents, reports & file storage',
    color: '#059669'
  }
};

const CommunicationsHub = () => {
  const {
    isLoggedIn,
    supervisorName,
    supervisorRole,
    supervisorId,
    logout
  } = useSupervisor();

  const [activeScreen, setActiveScreen] = useState('messaging');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Check if user is logged in
  useEffect(() => {
    if (!isLoggedIn) {
      window.location.href = '/';
    }
  }, [isLoggedIn]);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key >= '1' && event.key <= '5') {
        event.preventDefault();
        const screens = Object.keys(COMMUNICATIONS_NAV);
        const screenIndex = parseInt(event.key) - 1;
        if (screens[screenIndex]) {
          setActiveScreen(screens[screenIndex]);
        }
      }
      
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        setSidebarCollapsed(!sidebarCollapsed);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarCollapsed]);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const renderActiveScreen = () => {
    const screenConfig = COMMUNICATIONS_NAV[activeScreen];
    const ScreenComponent = screenConfig.component;
    
    return (
      <View style={styles.screenContainer}>
        <View style={styles.screenHeader}>
          <View style={styles.screenHeaderContent}>
            <View style={styles.screenTitleContainer}>
              <Ionicons 
                name={screenConfig.icon} 
                size={24} 
                color={screenConfig.color} 
              />
              <Text style={styles.screenTitle}>{screenConfig.title}</Text>
            </View>
            <Text style={styles.screenDescription}>{screenConfig.description}</Text>
          </View>
          
          <View style={styles.screenActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => window.location.href = '/display'}
              title="Go to Control Room Display"
            >
              <Ionicons name="desktop" size={20} color="#6B7280" />
              <Text style={styles.actionButtonText}>Control Room</Text>
            </TouchableOpacity>
            
            <Text style={styles.currentTime}>
              {currentTime.toLocaleTimeString('en-GB', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              })}
            </Text>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => {}}
            >
              <Ionicons name="person-circle" size={24} color="#6B7280" />
              <Text style={styles.profileText}>{supervisorName}</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.screenContent}>
          {activeScreen === 'email' ? (
            <EmailIntegrationEnhanced onClose={() => setActiveScreen('messaging')} />
          ) : activeScreen === 'voip' ? (
            <VoIPIntegrationEnhanced onClose={() => setActiveScreen('messaging')} />
          ) : activeScreen === 'messaging' ? (
            <MessageDistributionEnhanced baseUrl={API_CONFIG.baseURL} onClose={() => setActiveScreen('reports')} />
          ) : (
            <ScreenComponent baseUrl={API_CONFIG.baseURL} />
          )}        
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Sidebar Navigation */}
      <View style={[styles.sidebar, sidebarCollapsed && styles.sidebarCollapsed]}>
        {/* Header */}
        <View style={styles.sidebarHeader}>
          <View style={styles.logoContainer}>
            <View style={styles.logoImageContainer}>
              <Text style={styles.logoText}>💬</Text>
            </View>
            {!sidebarCollapsed && (
              <View style={styles.logoTextContainer}>
                <Text style={styles.appTitle}>Communications Hub</Text>
                <Text style={styles.appVersion}>Go Barry v3.0</Text>
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

        {/* User Status */}
        {isLoggedIn && (
          <View style={styles.supervisorStatus}>
            <View style={styles.supervisorInfo}>
              <View style={styles.supervisorAvatar}>
                <Ionicons name="person-circle" size={sidebarCollapsed ? 16 : 20} color="#8B5CF6" />
              </View>
              {!sidebarCollapsed && (
                <View style={styles.supervisorDetails}>
                  <Text style={styles.supervisorName}>{supervisorName}</Text>
                  <Text style={styles.supervisorRoleText}>{supervisorRole}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Navigation Items */}
        <ScrollView style={styles.navigationContainer}>
          {Object.entries(COMMUNICATIONS_NAV).map(([screenId, screen], index) => (
            <TouchableOpacity
              key={screenId}
              style={[
                styles.navItem,
                activeScreen === screenId && styles.navItemActive,
                sidebarCollapsed && styles.navItemCollapsed
              ]}
              onPress={() => setActiveScreen(screenId)}
            >
              <View style={styles.navItemContent}>
                <Ionicons 
                  name={screen.icon} 
                  size={sidebarCollapsed ? 20 : 24} 
                  color={activeScreen === screenId ? screen.color : '#6B7280'} 
                />
                {!sidebarCollapsed && (
                  <View style={styles.navItemText}>
                    <Text style={[
                      styles.navItemTitle,
                      activeScreen === screenId && { color: screen.color }
                    ]}>
                      {screen.title}
                    </Text>
                    <Text style={styles.keyboardShortcut}>
                      Ctrl+{index + 1}
                    </Text>
                  </View>
                )}
              </View>
              
              {activeScreen === screenId && (
                <View style={[styles.activeIndicator, { backgroundColor: screen.color }]} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.sidebarFooter}>
          <TouchableOpacity
            style={styles.footerButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out" size={20} color="#EF4444" />
            {!sidebarCollapsed && (
              <Text style={[styles.footerButtonText, { color: '#EF4444' }]}>Logout</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        {renderActiveScreen()}
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
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
  supervisorStatus: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  supervisorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  supervisorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supervisorDetails: {
    flex: 1,
  },
  supervisorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  supervisorRoleText: {
    fontSize: 12,
    color: '#6B7280',
  },
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
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  screenContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  screenHeader: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  screenHeaderContent: {
    flex: 1,
  },
  screenTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  screenDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  screenActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  currentTime: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'monospace',
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  profileText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  screenContent: {
    flex: 1,
    overflow: 'hidden',
  },
});

export default CommunicationsHub;
