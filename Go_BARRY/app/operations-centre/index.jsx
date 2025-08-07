import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, Platform, Pressable, ActivityIndicator, Text, Animated, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSupervisor } from '../../components/hooks/useSupervisorSession';
import { useNavigationGuard } from '../../hooks/useNavigationGuard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AppHeader from '../../components/common/AppHeader';

// UK Locale constants
const UK_LOCALE = {
  DUTY_BOARDS: 'Duty Boards',
  VIEW_DRIVER_PDFS: 'View driver PDFs',
  DISRUPTIONS: 'Disruptions',
  DATABASE_VIEW: 'Database view',
  STATISTICS: 'Statistics',
  PERFORMANCE_METRICS: 'Performance metrics',
  LIVE_MAP: 'Live Map',
  REAL_TIME_VIEW: 'Real-time view',
  TOTAL: 'Total',
  TODAY: 'Today',
  ALERTS: 'Alerts',
};

// Mock utilities for now
const auditLog = (action, data) => {
  console.log(`[Audit] ${action}:`, data);
};

const useThrottle = (fn) => fn;

class PerformanceMonitor {
  startMeasure() {}
  endMeasure() {}
}

// Import UI components
import StatusBar from './components/StatusBar.jsx';
import OperationsCard from './components/OperationsCard.jsx';
import ActivityFeed from './components/ActivityFeed.jsx';
// Live data components  
import ActivityFeedLive from './components/ActivityFeedLive.jsx';

// Import operational components
import DutyBoardsCard from '../../components/operations/cards/DutyBoardsCard.jsx';
import StatisticsCard from '../../components/operations/cards/StatisticsCard.jsx';
import OnTimeRequestCard from '../../components/operations/cards/OnTimeRequestCard.jsx';
import DailyLostMileageCard from '../../components/operations/cards/DailyLostMileageCard.jsx';
// Improved SharePoint components (iframe-based but enhanced)
import OnTimeRequestImproved from '../../components/operations/cards/OnTimeRequestImproved.jsx';
import DailyLostMileageImproved from '../../components/operations/cards/DailyLostMileageImproved.jsx';
// Shift Management
import ShiftManagementScreen from '../../components/ShiftManagementScreen.jsx';
import ActivityDashboard from '../../components/ActivityDashboard.jsx';
import ChangePasswordScreen from '../../components/ChangePasswordScreen.jsx';

// Theme configuration
const operationsTheme = {
  colors: {
    gradients: {
      dutyBoards: ['#6366f1', '#8b5cf6'],
      onTimeRequest: ['#0ea5e9', '#06b6d4'],
      dailyLostMileage: ['#f59e0b', '#f97316'],
      disruptions: ['#10b981', '#34d399'],
      statistics: ['#3b82f6', '#6366f1'],
      liveMap: ['#06b6d4', '#0891b2'],
    }
  }
};

// Initialize performance monitor
const perfMonitor = new PerformanceMonitor();

export default function OperationsCentre() {
  const router = useRouter();
  const { supervisorName, logout, supervisor, currentShift, isClockedIn } = useSupervisor();
  
  // Use navigation guard hook
  const { 
    canRender, 
    shouldShowLoading, 
    safeLogout, 
    safeNavigate,
    isReady 
  } = useNavigationGuard('/');
  
  const [isInitializing, setIsInitializing] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [cardOrder, setCardOrder] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [summaryStats, setSummaryStats] = useState({
    totalAlerts: 0,
    activeDisruptions: 0,
    onTimePerformance: '95%',
    systemHealth: 'Good'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [cardStats, setCardStats] = useState({
    dutyBoards: { value: 'PDF', label: 'Viewer' },
    disruptions: { value: '156', label: UK_LOCALE.TOTAL },
    statistics: { value: '142', label: UK_LOCALE.TODAY },
    liveMap: { value: '37', label: UK_LOCALE.ALERTS },
    onTimeRequest: { value: 'Live', label: 'SharePoint' },
    dailyLostMileage: { value: 'SDC', label: 'Report' },
    shiftManagement: { value: 'OFF', label: 'Not Clocked In' },
    activityDashboard: { value: '7', label: 'Days' },
    changePassword: { value: '90', label: 'Days Left' },
  });
  
  // Initialize operations centre when ready
  useEffect(() => {
    console.log('[OperationsCentre] Checking readiness status...');
    
    if (!isReady) {
      console.log('[OperationsCentre] Still initializing, waiting...');
      return;
    }
    
    // Only initialize after navigation guard is ready
    perfMonitor.startMeasure('operations-centre-load');
    
    // Log access
    auditLog('operations-centre-access', { 
      supervisor: supervisorName,
      timestamp: new Date().toISOString() 
    });
    
    console.log('[OperationsCentre] Ready, showing content');
    setIsInitializing(false);
    perfMonitor.endMeasure('operations-centre-load');
  }, [isReady, supervisorName]);
  
  // Load card order from localStorage
  useEffect(() => {
    if (supervisor?.badge) {
      try {
        const savedOrder = window?.localStorage?.getItem(`cardOrder_${supervisor.badge}`);
        if (savedOrder) {
          setCardOrder(JSON.parse(savedOrder));
        }
      } catch (error) {
        console.log('No saved card order found');
      }
    }
  }, [supervisor?.badge]);

  // Fetch password status and update shift card
  useEffect(() => {
    if (supervisor?.badge) {
      fetchPasswordStatus();
    }
  }, [supervisor]);
  
  // Update shift management card based on current shift
  useEffect(() => {
    if (isClockedIn && currentShift) {
      setCardStats(prev => ({
        ...prev,
        shiftManagement: {
          value: `D${currentShift.duty_code}`,
          label: 'On Duty'
        }
      }));
    } else {
      setCardStats(prev => ({
        ...prev,
        shiftManagement: {
          value: 'OFF',
          label: 'Not Clocked In'
        }
      }));
    }
  }, [isClockedIn, currentShift]);

  const fetchPasswordStatus = async () => {
    try {
      const response = await fetch(`https://go-barry.onrender.com/api/password/password-status/${supervisor.badge}`);
      const data = await response.json();
      
      if (data.success) {
        setCardStats(prev => ({
          ...prev,
          changePassword: {
            value: data.daysUntilExpiry ? data.daysUntilExpiry.toString() : 'Set',
            label: data.daysUntilExpiry ? 'Days Left' : 'Password'
          }
        }));
      }
    } catch (error) {
      console.warn('Failed to fetch password status:', error);
    }
  };

  // Fetch statistics
  useEffect(() => {
    if (!isInitializing) {
      fetchOperationsStats();
      const interval = setInterval(fetchOperationsStats, 30000);
      return () => clearInterval(interval);
    }
  }, [isInitializing]);
  
  // Throttled fetch function
  const fetchOperationsStats = useThrottle(async () => {
    perfMonitor.startMeasure('fetch-stats');
    
    try {
      // Use production backend only for now to avoid local dev issues
      const API_BASE = 'https://go-barry.onrender.com';
      
      // Fetch multiple data sources in parallel
      const [alertsResponse, analyticsResponse, healthResponse] = await Promise.all([
        fetch(`${API_BASE}/api/alerts-enhanced`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          ...(typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? { signal: AbortSignal.timeout(10000) } : {})
        }),
        fetch(`${API_BASE}/api/analytics/summary`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          ...(typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? { signal: AbortSignal.timeout(10000) } : {})
        }),
        fetch(`${API_BASE}/api/health-extended`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          ...(typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? { signal: AbortSignal.timeout(10000) } : {})
        })
      ]);
      
      let alertsData = null;
      let analyticsData = null;
      let healthData = null;
      
      if (alertsResponse.ok) {
        alertsData = await alertsResponse.json();
      }
      
      if (analyticsResponse.ok) {
        analyticsData = await analyticsResponse.json();
      }
      
      if (healthResponse.ok) {
        healthData = await healthResponse.json();
      }
      
      // Update card stats and summary based on API responses
      const totalAlerts = alertsData?.alerts?.length || 0;
      const highPriorityAlerts = alertsData?.alerts?.filter(alert => alert.severity === 'high')?.length || 0;
      const todayEvents = analyticsData?.summary?.last24Hours?.events || 0;
      
      setCardStats(prev => ({
        ...prev,
        disruptions: { 
          value: totalAlerts.toString(), 
          label: UK_LOCALE.TOTAL 
        },
        liveMap: { 
          value: highPriorityAlerts.toString(), 
          label: UK_LOCALE.ALERTS 
        },
        statistics: { 
          value: todayEvents.toString(), 
          label: UK_LOCALE.TODAY 
        },
        dutyBoards: { 
          value: 'PDF', 
          label: 'Viewer' 
        },
      }));
      
      // Update summary dashboard
      setSummaryStats({
        totalAlerts,
        activeDisruptions: alertsData?.alerts?.filter(a => a.type === 'roadworks')?.length || 0,
        onTimePerformance: analyticsData?.summary?.onTimePercentage || '95%',
        systemHealth: healthData?.status === 'healthy' ? 'Good' : 'Warning'
      });
      
      // Smart notifications - detect important changes
      const newNotifications = [];
      if (highPriorityAlerts.length > 3) {
        newNotifications.push({
          type: 'alert',
          message: `${highPriorityAlerts.length} high priority alerts active`,
          priority: 'high'
        });
      }
      setNotifications(newNotifications);
      
      setLastUpdated(new Date());
      setConnectionStatus('connected');
      
      console.log('✅ Operations stats loaded successfully');
    } catch (error) {
      // Silently handle stats errors - not critical for app function
      console.warn('⚠️ Stats fetch failed (non-critical):', error.message);
      setConnectionStatus('disconnected');
    } finally {
      perfMonitor.endMeasure('fetch-stats');
    }
  }, 5000); // Throttle to max once per 5 seconds
  
  const handleLogout = async () => {
    await safeLogout(logout);
  };
  
  const handleCardPress = (cardId) => {
    // Audit log for card access
    auditLog('card-accessed', { 
      supervisor: supervisorName,
      card: cardId,
      timestamp: new Date().toISOString() 
    });
    
    // Special handling for Horizon VIX - open directly in new tab
    if (cardId === 'horizon-vix') {
      if (Platform.OS === 'web') {
        window.open('https://horizon.gag.vix-its.com/', '_blank');
      }
      return;
    }
    
    // Special handling for Blink - open directly in new tab
    if (cardId === 'blink') {
      if (Platform.OS === 'web') {
        window.open('https://app.joinblink.com/#/login', '_blank');
      }
      return;
    }
    
    
    setSelectedCard(cardId);
  };
  
  // Save card order when it changes
  const saveCardOrder = (newOrder) => {
    if (supervisor?.badge && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(`cardOrder_${supervisor.badge}`, JSON.stringify(newOrder));
      } catch (error) {
        console.warn('Failed to save card order:', error);
      }
    }
  };

  // Handle card reordering
  const moveCard = (fromIndex, toIndex) => {
    const newOrder = [...(cardOrder.length > 0 ? cardOrder : operationsCards.map(c => c.id))];
    const [movedItem] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedItem);
    setCardOrder(newOrder);
    saveCardOrder(newOrder);
  };

  // Format time ago
  const getTimeAgo = () => {
    const diff = Date.now() - lastUpdated.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min ago';
    return `${minutes} min ago`;
  };

  const operationsCards = [
    {
      id: 'shift-management',
      title: 'Shift Management',
      subtitle: 'Clock In/Out & Breaks',
      icon: 'clock-time-eight',
      color: ['#0891b2', '#0e7490'], // Cyan gradient
      stats: cardStats.shiftManagement,
      hasTimestamp: true,
    },
    {
      id: 'activity-dashboard',
      title: 'My Activity',
      subtitle: 'Personal Performance Stats',
      icon: 'chart-timeline-variant',
      color: ['#7c3aed', '#6d28d9'], // Purple gradient
      stats: cardStats.activityDashboard,
      hasTimestamp: true,
    },
    {
      id: 'change-password',
      title: 'Security',
      subtitle: 'Change Your Password',
      icon: 'lock-reset',
      color: ['#dc2626', '#b91c1c'], // Red gradient
      stats: cardStats.changePassword,
      hasTimestamp: false,
    },
    {
      id: 'duty-boards',
      title: UK_LOCALE.DUTY_BOARDS,
      subtitle: UK_LOCALE.VIEW_DRIVER_PDFS,
      icon: 'clipboard-list',
      color: operationsTheme.colors.gradients.dutyBoards,
      stats: cardStats.dutyBoards,
      hasTimestamp: false,
    },
    {
      id: 'on-time-request',
      title: 'On Time Request',
      subtitle: 'Driver Finish Times',
      icon: 'clock-check',
      color: operationsTheme.colors.gradients.onTimeRequest,
      stats: cardStats.onTimeRequest,
      hasTimestamp: false,
    },
    {
      id: 'daily-lost-mileage',
      title: 'Daily Lost Mileage',
      subtitle: 'SDC Report',
      icon: 'chart-line-variant',
      color: operationsTheme.colors.gradients.dailyLostMileage,
      stats: cardStats.dailyLostMileage,
      hasTimestamp: false,
    },
    {
      id: 'disruptions',
      title: UK_LOCALE.DISRUPTIONS,
      subtitle: UK_LOCALE.DATABASE_VIEW,
      icon: 'database',
      color: operationsTheme.colors.gradients.disruptions,
      stats: cardStats.disruptions,
      hasTimestamp: true,
    },
    {
      id: 'statistics',
      title: UK_LOCALE.STATISTICS,
      subtitle: UK_LOCALE.PERFORMANCE_METRICS,
      icon: 'chart-line',
      color: operationsTheme.colors.gradients.statistics,
      stats: cardStats.statistics,
      hasTimestamp: true,
    },
    {
      id: 'live-map',
      title: UK_LOCALE.LIVE_MAP,
      subtitle: UK_LOCALE.REAL_TIME_VIEW,
      icon: 'map-marker-radius',
      color: operationsTheme.colors.gradients.liveMap,
      stats: cardStats.liveMap,
      hasTimestamp: true,
    },
    {
      id: 'horizon-vix',
      title: 'Horizon VIX-ITS',
      subtitle: 'Traffic Management System • Opens a new tab',
      icon: 'traffic-light',
      color: ['#7c3aed', '#5b21b6'], // Purple gradient for traffic management
      stats: { count: '●', label: 'Live' },
      textColor: '#1e293b', // Dark text for better contrast on bright gradient
      hasTimestamp: false,
    },
    {
      id: 'blink',
      title: 'Blink',
      subtitle: 'Driver Communications • Opens a new tab',
      icon: 'message-text',
      color: ['#15803d', '#16a34a'], // Green gradient for communications
      stats: { count: '●', label: 'Live' },
      textColor: 'white',
      hasTimestamp: false,
    },
  ];
  
  // Render selected component in modal/overlay
  const renderSelectedComponent = () => {
    if (!selectedCard) return null;
    
    let Component;
    switch (selectedCard) {
      case 'shift-management':
        Component = () => <ShiftManagementScreen />;
        break;
      case 'activity-dashboard':
        Component = () => <ActivityDashboard />;
        break;
      case 'change-password':
        Component = () => <ChangePasswordScreen onClose={() => setSelectedCard(null)} />;
        break;
      case 'duty-boards':
        Component = DutyBoardsCard;
        break;
      case 'on-time-request':
        Component = () => <OnTimeRequestImproved onClose={() => setSelectedCard(null)} />;
        break;
      case 'daily-lost-mileage':
        Component = () => <DailyLostMileageImproved onClose={() => setSelectedCard(null)} />;
        break;
      case 'disruptions':
        Component = () => {
          const DisruptionDatabase = require('../../components/DisruptionDatabase.jsx').default;
          return (
            <DisruptionDatabase 
              baseUrl="https://go-barry.onrender.com"
              onBack={() => setSelectedCard(null)}
            />
          );
        };
        break;
      case 'statistics':
        Component = StatisticsCard;
        break;
      case 'live-map':
        Component = () => {
          const LiveMapContainer = require('../../components/operations/live-map/LiveMapContainer.jsx').default;
          return <LiveMapContainer onClose={() => setSelectedCard(null)} />;
        };
        break;
      default:
        return null;
    }
    
    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Pressable 
            style={styles.closeButton}
            onPress={() => setSelectedCard(null)}
          >
            <MaterialCommunityIcons name="close" size={24} color="#fff" />
          </Pressable>
          <Component />
        </View>
      </View>
    );
  };
  
  // Show loading state while navigation guard is working or initializing
  if (shouldShowLoading() || isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading Operations Centre...</Text>
      </View>
    );
  }

  // Don't render content if not ready
  if (!canRender()) {
    return null;
  }
  
  return (
    <View style={styles.container}>
      <AppHeader />
      
      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Bar */}
        <StatusBar />
        
        {/* Summary Dashboard */}
        <View style={styles.summaryDashboard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Operations Overview</Text>
            {notifications.length > 0 && (
              <View style={styles.notificationsBadge}>
                <MaterialCommunityIcons name="bell" size={16} color="#f59e0b" />
                <Text style={styles.notificationCount}>{notifications.length}</Text>
              </View>
            )}
          </View>
          
          {/* Quick Search */}
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={16} color="#6b7280" />
            <Text style={styles.searchPlaceholder}>Search operations, alerts, routes...</Text>
            <MaterialCommunityIcons name="microphone" size={16} color="#6b7280" />
          </View>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <MaterialCommunityIcons name="alert-circle" size={24} color="#f59e0b" />
              <Text style={styles.summaryValue}>{summaryStats.totalAlerts}</Text>
              <Text style={styles.summaryLabel}>Total Alerts</Text>
            </View>
            <View style={styles.summaryCard}>
              <MaterialCommunityIcons name="road-variant" size={24} color="#8b5cf6" />
              <Text style={styles.summaryValue}>{summaryStats.activeDisruptions}</Text>
              <Text style={styles.summaryLabel}>Active Disruptions</Text>
            </View>
            <View style={styles.summaryCard}>
              <MaterialCommunityIcons name="clock-check" size={24} color="#10b981" />
              <Text style={styles.summaryValue}>{summaryStats.onTimePerformance}</Text>
              <Text style={styles.summaryLabel}>On Time</Text>
            </View>
            <View style={styles.summaryCard}>
              <MaterialCommunityIcons name="heart-pulse" size={24} color="#3b82f6" />
              <Text style={styles.summaryValue}>{summaryStats.systemHealth}</Text>
              <Text style={styles.summaryLabel}>System Health</Text>
            </View>
          </View>
          <View style={styles.statusIndicator}>
            <View style={[styles.connectionDot, { backgroundColor: connectionStatus === 'connected' ? '#10b981' : '#f59e0b' }]} />
            <Text style={styles.lastUpdatedText}>Last updated {getTimeAgo()}</Text>
            {connectionStatus !== 'connected' && (
              <View style={styles.offlineIndicator}>
                <MaterialCommunityIcons name="wifi-off" size={12} color="#f59e0b" />
                <Text style={styles.offlineText}>Offline Mode</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Operations Cards Grid */}
        <View style={styles.cardsSection}>
          <Text style={styles.sectionTitle}>Operations Dashboard</Text>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionSubtitle}>Long press cards to reorder • Tap to open</Text>
            <Pressable 
              style={styles.resetButton}
              onPress={() => {
                Alert.alert(
                  'Reset Layout',
                  'Reset card layout to default order?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Reset', 
                      onPress: () => {
                        setCardOrder([]);
                        saveCardOrder([]);
                      }
                    }
                  ]
                );
              }}
            >
              <MaterialCommunityIcons name="restore" size={16} color="#6366f1" />
              <Text style={styles.resetButtonText}>Reset</Text>
            </Pressable>
          </View>
          <View style={styles.cardsGrid}>
            {(cardOrder.length > 0 ? 
              cardOrder.map(cardId => operationsCards.find(c => c.id === cardId)).filter(Boolean) : 
              operationsCards
            ).map((card, index) => (
              <Pressable
                key={card.id}
                style={styles.cardWrapper}
                onLongPress={() => {
                  Alert.alert(
                    'Reorder Card',
                    `Move "${card.title}" to which position?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Move to Start', onPress: () => moveCard(index, 0) },
                      { text: 'Move to End', onPress: () => moveCard(index, operationsCards.length - 1) }
                    ]
                  );
                }}
              >
                <OperationsCard
                  {...card}
                  onPress={() => handleCardPress(card.id)}
                  timestamp={card.hasTimestamp ? getTimeAgo() : null}
                  isLoading={connectionStatus === 'disconnected'}
                />
                {card.hasTimestamp && (
                  <Text style={styles.cardTimestamp}>Updated {getTimeAgo()}</Text>
                )}
              </Pressable>
            ))}
          </View>
        </View>
        
        {/* Activity Feed - Live Data */}
        <ActivityFeedLive refreshTrigger={refreshTrigger} />
      </ScrollView>
      
      {/* Modal/Overlay for selected component */}
      {renderSelectedComponent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#64748b',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingBottom: 40,
  },
  
  // Modern Summary Dashboard
  summaryDashboard: {
    margin: 24,
    padding: 32,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  notificationsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  notificationCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#d97706',
    marginLeft: 6,
  },
  
  // Enhanced Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: '#64748b',
    marginLeft: 12,
    fontWeight: '400',
  },
  
  // Improved Summary Grid with larger cards
  summaryGrid: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1e293b',
    marginTop: 8,
    letterSpacing: -0.5,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Enhanced Status Indicator
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  connectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  lastUpdatedText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  offlineText: {
    fontSize: 12,
    color: '#d97706',
    marginLeft: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Redesigned Cards Section
  cardsSection: {
    paddingHorizontal: 24,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: '#64748b',
    flex: 1,
    fontWeight: '400',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  resetButtonText: {
    fontSize: 14,
    color: '#6366f1',
    marginLeft: 6,
    fontWeight: '600',
  },
  
  // Completely new grid layout with wider cards
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'space-between',
  },
  cardWrapper: {
    position: 'relative',
    width: Platform.OS === 'web' ? 'calc(50% - 10px)' : '48%',
    marginBottom: 20,
  },
  cardTimestamp: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  
  // Modal styles remain the same but with updated colors
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: 1000,
  },
  modalContent: {
    flex: 1,
    margin: 20,
    marginTop: Platform.OS === 'web' ? 40 : 80,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 25,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
