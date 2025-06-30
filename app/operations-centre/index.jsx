import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Platform, Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSupervisor } from '../../components/hooks/useSupervisorSession';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { UK_LOCALE } from './constants/locale';

// Import UI components
import OperationsHeader from './components/OperationsHeader';
import StatusBar from './components/StatusBar';
import OperationsCard from './components/OperationsCard';
import QuickActions from './components/QuickActions';
import ActivityFeed from './components/ActivityFeed';

// Import operational components
import DutyBoardsCard from '../../components/operations/cards/DutyBoardsCard';
import IncidentsCard from '../../components/operations/cards/IncidentsCard';
import RoadworksCard from '../../components/operations/cards/RoadworksCard';
import DisruptionDatabaseCard from '../../components/operations/cards/DisruptionDatabaseCard';

// Import theme
import { operationsTheme } from './styles/theme';

export default function OperationsCentre() {
  const router = useRouter();
  const { isLoggedIn, supervisorName, logout } = useSupervisor();
  const [selectedCard, setSelectedCard] = useState(null);
  const [cardStats, setCardStats] = useState({
    dutyBoards: { value: '12', label: UK_LOCALE.ACTIVE },
    incidents: { value: '5', label: UK_LOCALE.ACTIVE },
    roadworks: { value: '24', label: UK_LOCALE.PLANNED },
    disruptions: { value: '156', label: UK_LOCALE.TOTAL },
    statistics: { value: '142', label: UK_LOCALE.TODAY },
    liveMap: { value: '37', label: UK_LOCALE.ALERTS },
  });
  
  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/');
    }
  }, [isLoggedIn]);
  
  // Fetch statistics
  useEffect(() => {
    fetchOperationsStats();
    const interval = setInterval(fetchOperationsStats, 30000);
    return () => clearInterval(interval);
  }, []);
  
  const fetchOperationsStats = async () => {
    try {
      const response = await fetch('https://go-barry.onrender.com/api/operations/stats');
      if (response.ok) {
        const data = await response.json();
        // Update card stats based on API response
        setCardStats(prev => ({
          ...prev,
          incidents: { value: data.incidents?.active || '0', label: UK_LOCALE.ACTIVE },
          roadworks: { value: data.roadworks?.planned || '0', label: UK_LOCALE.PLANNED },
        }));
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };
  
  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };
  
  const handleCardPress = (cardId) => {
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
      id: 'incidents',
      title: UK_LOCALE.INCIDENTS,
      subtitle: UK_LOCALE.TRACK_AND_MANAGE,
      icon: 'alert-circle',
      color: operationsTheme.colors.gradients.incidents,
      stats: cardStats.incidents,
    },
    {
      id: 'roadworks',
      title: UK_LOCALE.ROADWORKS,
      subtitle: UK_LOCALE.PLANNED_DIVERSIONS,
      icon: 'road-variant',
      color: operationsTheme.colors.gradients.roadworks,
      stats: cardStats.roadworks,
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
  ];
  
  // Render selected component in modal/overlay
  const renderSelectedComponent = () => {
    if (!selectedCard) return null;
    
    let Component;
    switch (selectedCard) {
      case 'duty-boards':
        Component = DutyBoardsCard;
        break;
      case 'incidents':
        Component = IncidentsCard;
        break;
      case 'roadworks':
        Component = RoadworksCard;
        break;
      case 'disruptions':
        Component = DisruptionDatabaseCard;
        break;
      case 'statistics':
        // TODO: Create statistics component
        Alert.alert(UK_LOCALE.STATISTICS, 'Statistics view coming soon!');
        setSelectedCard(null);
        return null;
      case 'live-map':
        // TODO: Create live map component
        Alert.alert(UK_LOCALE.LIVE_MAP, 'Live map view coming soon!');
        setSelectedCard(null);
        return null;
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
  
  return (
    <View style={styles.container}>
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
        
        {/* Quick Actions */}
        <QuickActions />
        
        {/* Activity Feed */}
        <ActivityFeed />
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
