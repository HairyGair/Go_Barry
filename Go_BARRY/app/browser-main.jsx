// Go_BARRY/app/browser-main.jsx
// Go Barry v3.0 - Browser-First Application Entry Point
// Optimized for supervisor workstations, tablets, and desktop use

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

// Import all our v3.0 components
import SupervisorLogin from '../components/SupervisorLogin';
import SupervisorControl from '../components/SupervisorControl';
import SupervisorDisplayIntegrationTest from '../components/dev/SupervisorDisplayIntegrationTest';
import EnhancedDashboard from '../components/EnhancedDashboard';
import IncidentManager from '../components/IncidentManager';
import AIDisruptionManager from '../components/AIDisruptionManager';
import MessageDistributionCenter from '../components/MessageDistributionCenter';
import AutomatedReportingSystem from '../components/AutomatedReportingSystem';
import SystemHealthMonitor from '../components/SystemHealthMonitor';
import TrainingHelpSystem from '../components/TrainingHelpSystem';
import SimpleAPITest from '../components/dev/SimpleAPITest';
import RoadworksManager from '../components/RoadworksManager';
import SupervisorCard from '../components/archive/SupervisorCard';
import SupervisorCardDemo from '../components/dev/SupervisorCardDemo';
import QuickSupervisorTest from '../components/dev/QuickSupervisorTest';
import WebSocketTest from '../components/dev/WebSocketTest';
import WebSocketDiagnostics from '../components/dev/WebSocketDiagnostics';
import AdminPanel from '../components/admin/AdminPanel';
import { useSupervisorSession } from '../components/hooks/useSupervisorSession';
import { useBarryAPI } from '../components/hooks/useBARRYapi';
import { API_CONFIG } from '../config/api';

const { width, height } = Dimensions.get('window');

// Main navigation structure for browser
const BROWSER_NAVIGATION = {
  admin: {
    title: 'Admin Panel',
    icon: 'shield-checkmark',
    component: AdminPanel,
    description: '⭐ System administration & accountability center',
    color: '#F59E0B',
    adminOnly: true
  },
  supervisor: {
    title: 'Supervisor Control',
    icon: 'people-circle',
    component: SupervisorControl,
    description: 'Interactive supervisor controls & display sync',
    color: '#DC2626'
  },
  integration_test: {
    title: 'Integration Test',
    icon: 'flask',
    component: SupervisorDisplayIntegrationTest,
    description: '🧪 Test supervisor ↔ display real-time sync',
    color: '#7C3AED'
  },
  dashboard: {
    title: 'Control Dashboard',
    icon: 'stats-chart',
    component: EnhancedDashboard,
    description: 'Real-time traffic intelligence overview',
    color: '#3B82F6'
  },
  incidents: {
    title: 'Incident Manager',
    icon: 'alert-circle',
    component: IncidentManager,
    description: 'Create & track incidents with GTFS route detection',
    color: '#EF4444'
  },
  roadworks: {
    title: 'Roadworks Manager',
    icon: 'construct',
    component: RoadworksManager,
    description: 'Manage roadworks & create Blink diversions',
    color: '#F59E0B'
  },
  ai: {
    title: 'AI Disruption Manager',
    icon: 'bulb',
    component: AIDisruptionManager,
    description: 'Smart diversions & automated messaging',
    color: '#10B981'
  },
  messaging: {
    title: 'Message Distribution',
    icon: 'chatbubbles',
    component: MessageDistributionCenter,
    description: 'Multi-channel communication system',
    color: '#8B5CF6'
  },
  reports: {
    title: 'Automated Reports',
    icon: 'document-text',
    component: AutomatedReportingSystem,
    description: 'Daily reports & operational summaries',
    color: '#F59E0B'
  },
  health: {
    title: 'System Health',
    icon: 'medical',
    component: SystemHealthMonitor,
    description: 'Real-time performance monitoring',
    color: '#DC2626'
  },
  training: {
    title: 'Training & Help',
    icon: 'school',
    component: TrainingHelpSystem,
    description: 'Learn Go Barry & get support',
    color: '#6366F1'
  },
  test: {
    title: 'Quick Supervisor Test',
    icon: 'people-circle',
    component: QuickSupervisorTest,
    description: 'Quick test of supervisor card components',
    color: '#10B981'
  },
  apitest: {
    title: 'API Test',
    icon: 'bug',
    component: SimpleAPITest,
    description: 'Test API connectivity and data flow',
    color: '#F97316'
  },
  supervisordemo: {
    title: 'Supervisor Card Demo',
    icon: 'people',
    component: SupervisorCardDemo,
    description: 'Demo individual supervisor tracking features',
    color: '#7C3AED'
  },
  websockettest: {
    title: 'WebSocket Test',
    icon: 'wifi',
    component: WebSocketTest,
    description: 'Test WebSocket connections and authentication',
    color: '#EC4899'
  },
  diagnostics: {
    title: 'WebSocket Diagnostics',
    icon: 'pulse',
    component: WebSocketDiagnostics,
    description: 'Advanced diagnostics for connection issues',
    color: '#DC2626'
  }
};

const BrowserMainApp = () => {
  const {
    isLoggedIn,
    supervisorName,
    supervisorRole,
    supervisorId,
    sessionId,
    isAdmin,
    supervisorSession, // Add this to access backendId
    logout
  } = useSupervisorSession();

  // Get live alerts for supervisor control
  const { alerts } = useBarryAPI({ autoRefresh: true, refreshInterval: 15000 });

  const [activeScreen, setActiveScreen] = useState('supervisor');
  const [showSupervisorLogin, setShowSupervisorLogin] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcuts for browser efficiency
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (event) => {
      // Ctrl/Cmd + number keys for quick navigation
      if ((event.ctrlKey || event.metaKey) && event.key >= '1' && event.key <= '9') {
        event.preventDefault();
        const screens = Object.keys(BROWSER_NAVIGATION);
        const screenIndex = parseInt(event.key) - 1;
        if (screens[screenIndex]) {
          setActiveScreen(screens[screenIndex]);
        }
      }
      
      // Ctrl/Cmd + B to toggle sidebar
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        setSidebarCollapsed(!sidebarCollapsed);
      }
      
      // F11 for fullscreen toggle
      if (event.key === 'F11') {
        event.preventDefault();
        toggleFullscreen();
      }
      
      // Escape to exit fullscreen
      if (event.key === 'Escape' && isFullscreen) {
        exitFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarCollapsed, isFullscreen]);

  // Fullscreen functionality for immersive supervisor experience
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Enhanced logout function that ensures modal opens
  const handleLogout = async () => {
    console.log('🔄 Logout clicked - clearing session...');
    await logout();
    // Force login modal to open after logout
    setTimeout(() => {
      setShowSupervisorLogin(true);
      console.log('✅ Login modal should now be open');
    }, 100);
  };

  // Monitor login state for debugging
  useEffect(() => {
    console.log('🖔 Login state changed:', {
      isLoggedIn,
      supervisorName,
      sessionId,
      showSupervisorLogin
    });
  }, [isLoggedIn, supervisorName, sessionId, showSupervisorLogin]);

  const renderActiveScreen = () => {
    const screenConfig = BROWSER_NAVIGATION[activeScreen];
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
            {/* Keyboard shortcuts help */}
            <TouchableOpacity
              style={styles.helpButton}
              onPress={() => setActiveScreen('training')}
              title="Keyboard Shortcuts: Ctrl+1-9 for navigation, Ctrl+B for sidebar, F11 for fullscreen"
            >
              <Ionicons name="help-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
            
            {/* Fullscreen toggle */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Enter Fullscreen (F11)'}
            >
              <Ionicons 
                name={isFullscreen ? "contract" : "expand"} 
                size={20} 
                color="#6B7280" 
              />
            </TouchableOpacity>
            
            <Text style={styles.currentTime}>
              {currentTime.toLocaleTimeString('en-GB', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              })}
            </Text>
            {isLoggedIn ? (
              <TouchableOpacity
                style={styles.profileButton}
                onPress={() => setShowSupervisorLogin(true)}
              >
                <Ionicons name="person-circle" size={24} color="#6B7280" />
                <Text style={styles.profileText}>{supervisorName}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.profileButton, { backgroundColor: '#3B82F6' }]}
                onPress={() => {
                  console.log('🔓 Header login button clicked');
                  setShowSupervisorLogin(true);
                }}
              >
                <Ionicons name="log-in" size={20} color="#FFFFFF" />
                <Text style={[styles.profileText, { color: '#FFFFFF' }]}>Login</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        <View style={styles.screenContent}>
          {activeScreen === 'supervisor' ? (
            <SupervisorControl
              supervisorId={supervisorSession?.supervisor?.backendId || 'supervisor001'} // Force backend ID
              supervisorName={supervisorName}
              sessionId={sessionId}
              supervisorSession={supervisorSession} // Pass full session
              alerts={alerts}
            />
          ) : activeScreen === 'integration_test' ? (
            <SupervisorDisplayIntegrationTest />
          ) : activeScreen === 'admin' ? (
            <AdminPanel onClose={() => setActiveScreen('supervisor')} />
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
              {/* Try to load the actual logo, fallback to emoji */}
              <Text style={styles.logoText}>🚦</Text>
            </View>
            {!sidebarCollapsed && (
              <View style={styles.logoTextContainer}>
                <View style={styles.logoMainContainer}>
                  <Text style={styles.appTitle}>BARRY</Text>
                </View>
                <Text style={styles.appVersion}>v3.0 Pro • Supervisor Browser</Text>
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

        {/* Supervisor Status */}
        {isLoggedIn && (
          <View style={styles.supervisorStatus}>
            <View style={styles.supervisorInfo}>
              <View style={styles.supervisorAvatar}>
                <Ionicons name="shield-checkmark" size={sidebarCollapsed ? 16 : 20} color="#10B981" />
              </View>
              {!sidebarCollapsed && (
                <View style={styles.supervisorDetails}>
                  <Text style={styles.supervisorName}>{supervisorName}</Text>
                  <Text style={styles.supervisorRoleText}>{supervisorRole}</Text>
                  {isAdmin && (
                    <View style={styles.adminBadgeContainer}>
                      <Ionicons name="shield-checkmark" size={12} color="#F59E0B" />
                      <Text style={styles.adminBadge}>Admin Access</Text>
                    </View>
                  )}
                  <View style={styles.connectionStatus}>
                    <View style={[
                      styles.connectionDot,
                      { backgroundColor: '#EF4444' }
                    ]} />
                    <Text style={[
                      styles.connectionText,
                      { color: '#EF4444' }
                    ]}>
                      Display Sync Offline (Testing Mode)
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Navigation Items */}
        <ScrollView style={styles.navigationContainer}>
          {Object.entries(BROWSER_NAVIGATION)
            .filter(([screenId, screen]) => {
              // Only show admin panel to admin users
              if (screen.adminOnly && !isAdmin) return false;
              return true;
            })
            .map(([screenId, screen], index) => (
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
          {!isLoggedIn ? (
            <TouchableOpacity
              style={styles.footerButton}
              onPress={() => {
                console.log('🔐 Login button clicked');
                setShowSupervisorLogin(true);
              }}
            >
              <Ionicons name="log-in" size={20} color="#3B82F6" />
              {!sidebarCollapsed && (
                <Text style={styles.footerButtonText}>Login</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.footerButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out" size={20} color="#EF4444" />
              {!sidebarCollapsed && (
                <Text style={[styles.footerButtonText, { color: '#EF4444' }]}>Logout</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        {renderActiveScreen()}
      </View>

      {/* Supervisor Login Modal */}
      <SupervisorLogin
        visible={showSupervisorLogin}
        onClose={() => {
          console.log('🔒 Closing login modal');
          setShowSupervisorLogin(false);
        }}
        onLoginSuccess={() => {
          console.log('✅ Login success in BrowserMainApp');
          // Modal will close automatically after successful login
        }}
      />
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
  logoMainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoEmoji: {
    fontSize: 24,
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
    backgroundColor: '#F0FDF4',
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
    marginBottom: 2,
  },
  adminBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
  },
  adminBadge: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '700',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  connectionText: {
    fontSize: 10,
    fontWeight: '500',
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
    color: '#3B82F6',
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
  helpButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
    marginRight: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
    marginRight: 8,
  },
  screenContent: {
    flex: 1,
    overflow: 'hidden',
  },
});

export default BrowserMainApp;
