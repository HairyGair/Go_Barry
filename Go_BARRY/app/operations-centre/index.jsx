import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Platform, Pressable, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useSupervisor } from '../../components/hooks/useSupervisorSession';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { UK_LOCALE } from '../../lib/_constants-index.js';
import AppHeader from '../../components/common/AppHeader';

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
import OperationsHeader from './components/OperationsHeader.jsx';
import StatusBar from './components/StatusBar.jsx';
import OperationsCard from './components/OperationsCard.jsx';
import QuickActions from './components/QuickActions.jsx';
import ActivityFeed from './components/ActivityFeed.jsx';
// Live data components
import QuickActionsLive from './components/QuickActionsLive.jsx';
import ActivityFeedLive from './components/ActivityFeedLive.jsx';

// Import operational components
import DutyBoardsCard from '../../components/operations/cards/DutyBoardsCard.jsx';
import DisruptionDatabaseCard from '../../components/operations/cards/DisruptionDatabaseCard.jsx';
import StatisticsCard from '../../components/operations/cards/StatisticsCard.jsx';
import OnTimeRequestCard from '../../components/operations/cards/OnTimeRequestCard.jsx';
import DailyLostMileageCard from '../../components/operations/cards/DailyLostMileageCard.jsx';
// Improved SharePoint components (iframe-based but enhanced)
import OnTimeRequestImproved from '../../components/operations/cards/OnTimeRequestImproved.jsx';
import DailyLostMileageImproved from '../../components/operations/cards/DailyLostMileageImproved.jsx';
import HorizonVixCard from '../../components/operations/cards/HorizonVixCard.jsx';

// Import theme
import { operationsTheme } from '../../lib/_styles-index.js';

// Initialize performance monitor
const perfMonitor = new PerformanceMonitor();

export default function OperationsCentre() {
  const router = useRouter();
  const { isLoggedIn, supervisorName, logout, supervisor, isLoading } = useSupervisor();
  const [isInitializing, setIsInitializing] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [cardStats, setCardStats] = useState({
    dutyBoards: { value: '12', label: UK_LOCALE.ACTIVE },
    disruptions: { value: '156', label: UK_LOCALE.TOTAL },
    statistics: { value: '142', label: UK_LOCALE.TODAY },
    liveMap: { value: '37', label: UK_LOCALE.ALERTS },
    onTimeRequest: { value: 'Live', label: 'SharePoint' },
    dailyLostMileage: { value: 'SDC', label: 'Report' },
  });
  
  // Security check with loading state
  useEffect(() => {
    console.log('[OperationsCentre] Checking authentication status...');
    console.log('[OperationsCentre] isLoggedIn:', isLoggedIn);
    console.log('[OperationsCentre] isLoading:', isLoading);
    console.log('[OperationsCentre] supervisorName:', supervisorName);
    
    // Wait for authentication to be determined
    if (isLoading) {
      console.log('[OperationsCentre] Auth still loading, waiting...');
      return;
    }
    
    // Only check authentication after loading is complete
    perfMonitor.startMeasure('operations-centre-load');
    
    if (!isLoggedIn) {
      console.log('[OperationsCentre] Not logged in, redirecting to home...');
      router.replace('/');
      return;
    }
    
    // Log access
    auditLog('operations-centre-access', { 
      supervisor: supervisorName,
      timestamp: new Date().toISOString() 
    });
    
    console.log('[OperationsCentre] Authentication successful, showing content');
    setIsInitializing(false);
    perfMonitor.endMeasure('operations-centre-load');
  }, [isLoggedIn, isLoading, supervisorName]);
  
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
      
      const response = await fetch(`${API_BASE}/api/operations/stats`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        // Add timeout to prevent hanging
        ...(typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? { signal: AbortSignal.timeout(10000) } : {})
      });
      
      if (response.ok) {
        const data = await response.json();
        // Update card stats based on API response
        setCardStats(prev => ({
          ...prev,
          // Stats can be updated here as needed for remaining cards
        }));
        console.log('✅ Operations stats loaded successfully');
      } else {
        console.warn('⚠️ Operations stats API returned:', response.status);
      }
    } catch (error) {
      // Silently handle stats errors - not critical for app function
      console.warn('⚠️ Stats fetch failed (non-critical):', error.message);
    } finally {
      perfMonitor.endMeasure('fetch-stats');
    }
  }, 5000); // Throttle to max once per 5 seconds
  
  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };
  
  const handleCardPress = (cardId) => {
    // Audit log for card access
    auditLog('card-accessed', { 
      supervisor: supervisorName,
      card: cardId,
      timestamp: new Date().toISOString() 
    });
    
    setSelectedCard(cardId);
  };
  
  const operationsCards = [
    {
      id: 'duty-boards',
      title: UK_LOCALE.DUTY_BOARDS,
      subtitle: UK_LOCALE.VIEW_DRIVER_PDFS,
      icon: 'clipboard-list',
      color: operationsTheme.colors.gradients.dutyBoards,
      stats: cardStats.dutyBoards,
    },
    {
      id: 'on-time-request',
      title: 'On Time Request',
      subtitle: 'Driver Finish Times',
      icon: 'clock-check',
      color: operationsTheme.colors.gradients.onTimeRequest || ['#0ea5e9', '#0284c7'],
      stats: cardStats.onTimeRequest,
    },
    {
      id: 'daily-lost-mileage',
      title: 'Daily Lost Mileage',
      subtitle: 'SDC Report',
      icon: 'chart-line-variant',
      color: operationsTheme.colors.gradients.dailyLostMileage || ['#dc2626', '#b91c1c'],
      stats: cardStats.dailyLostMileage,
    },
    {
      id: 'disruptions',
      title: UK_LOCALE.DISRUPTIONS,
      subtitle: UK_LOCALE.DATABASE_VIEW,
      icon: 'database',
      color: operationsTheme.colors.gradients.disruptions,
      stats: cardStats.disruptions,
    },
    {
      id: 'statistics',
      title: UK_LOCALE.STATISTICS,
      subtitle: UK_LOCALE.PERFORMANCE_METRICS,
      icon: 'chart-line',
      color: operationsTheme.colors.gradients.statistics,
      stats: cardStats.statistics,
    },
    {
      id: 'live-map',
      title: UK_LOCALE.LIVE_MAP,
      subtitle: UK_LOCALE.REAL_TIME_VIEW,
      icon: 'map-marker-radius',
      color: operationsTheme.colors.gradients.liveMap,
      stats: cardStats.liveMap,
    },
    {
      id: 'horizon-vix',
      title: 'Horizon VIX-ITS',
      subtitle: 'Traffic Management System',
      icon: 'traffic-light',
      color: ['#7c3aed', '#5b21b6'], // Purple gradient for traffic management
      stats: { count: '●', label: 'Live' },
    },
  ];
  
  // Render selected component in modal/overlay
  const renderSelectedComponent = () => {
    if (!selectedCard) return null;
    
    let Component;
    switch (selectedCard) {
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
        Component = DisruptionDatabaseCard;
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
      case 'horizon-vix':
        Component = () => <HorizonVixCard onClose={() => setSelectedCard(null)} />;
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
  
  // Show loading state while checking authentication
  if (isLoading || isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading Operations Centre...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <AppHeader />
      {/* Header */}
      <OperationsHeader 
        supervisorName={supervisorName}
        onLogout={handleLogout}
      />
      
      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Bar */}
        <StatusBar />
        
        {/* Operations Cards Grid */}
        <View style={styles.cardsSection}>
          <View style={styles.cardsGrid}>
            {operationsCards.map((card) => (
              <OperationsCard
                key={card.id}
                {...card}
                onPress={() => handleCardPress(card.id)}
              />
            ))}
          </View>
        </View>
        
        {/* Quick Actions - Live Data */}
        <QuickActionsLive onRefresh={() => setRefreshTrigger(prev => prev + 1)} />
        
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
    backgroundColor: operationsTheme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: operationsTheme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#6b7280',
  },
  content: {
    flex: 1,
  },
  cardsSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
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
    backgroundColor: operationsTheme.colors.background,
    borderRadius: operationsTheme.borderRadius.xl,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001,
  },
});
