import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Platform, Pressable, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useSupervisor } from '../../components/hooks/useSupervisorSession';
import { useNavigationGuard } from '../../hooks/useNavigationGuard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppHeader from '../../components/common/AppHeader';

// Import the existing DisruptionDatabase component
import DisruptionDatabase from '../../components/DisruptionDatabase';
// Import the Roadworks Manager component
import RoadworksManagerDashboard from '../../components/RoadworksManagerDashboard';
import RoadworksErrorBoundary from '../../components/RoadworksErrorBoundary';

// Theme based on operations theme
const disruptionTheme = {
  colors: {
    background: '#f9fafb',
    primary: '#3b82f6',
    gradients: {
      disruptionDatabase: ['#8b5cf6', '#7c3aed'], // Purple
      roadworksManager: ['#f59e0b', '#d97706'], // Amber
      incidentsManager: ['#ef4444', '#dc2626'], // Red
    }
  },
  borderRadius: {
    xl: 16,
  }
};

export default function DisruptionCentre() {
  const router = useRouter();
  const { supervisorName, logout, supervisor } = useSupervisor();

  // Use navigation guard hook
  const { 
    canRender, 
    shouldShowLoading, 
    safeLogout, 
    safeNavigate,
    isReady 
  } = useNavigationGuard('/');

  // Determine base URL based on environment
  const getBaseUrl = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        // Point to production API during development since local backend might not be running
        return 'https://go-barry.onrender.com';
      }
    }
    return 'https://go-barry.onrender.com';
  };
  const [isInitializing, setIsInitializing] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Stats for each card
  const [cardStats, setCardStats] = useState({
    disruptionDatabase: { value: '0', label: 'Total' },
    roadworksManager: { value: '0', label: 'Active' },
    incidentsManager: { value: '0', label: 'Active' },
  });
  
  // Initialize disruption centre when ready
  useEffect(() => {
    console.log('[DisruptionCentre] Checking readiness status...');
    
    if (!isReady) {
      console.log('[DisruptionCentre] Still initializing, waiting...');
      return;
    }
    
    console.log('[DisruptionCentre] Ready, showing content');
    setIsInitializing(false);
  }, [isReady]);
  
  // Fetch disruption statistics with reduced frequency to prevent component re-renders
  useEffect(() => {
    if (!isInitializing) {
      fetchDisruptionStats();
      // Increased from 60s to 120s to reduce duplicate calls
      const interval = setInterval(fetchDisruptionStats, 120000);
      return () => clearInterval(interval);
    }
  }, [isInitializing]);
  
  const fetchDisruptionStats = async () => {
    try {
      const API_BASE = 'https://go-barry.onrender.com';
      
      // Fetch disruption data
      const [roadworksResponse, incidentsResponse] = await Promise.all([
        fetch(`${API_BASE}/api/roadworks/unified`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${API_BASE}/api/incident-alerts`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        })
      ]);
      
      let roadworksData = null;
      let incidentsData = null;
      
      if (roadworksResponse.ok) {
        roadworksData = await roadworksResponse.json();
      }
      
      if (incidentsResponse.ok) {
        incidentsData = await incidentsResponse.json();
      }
      
      // Update card stats
      const activeRoadworks = roadworksData?.data?.filter(r => r.status === 'active')?.length || 0;
      const activeIncidents = incidentsData?.incidents?.filter(i => i.status === 'active')?.length || 0;
      const totalDisruptions = (roadworksData?.data?.length || 0) + (incidentsData?.incidents?.length || 0);
      
      setCardStats({
        disruptionDatabase: { value: totalDisruptions.toString(), label: 'Total' },
        roadworksManager: { value: activeRoadworks.toString(), label: 'Active' },
        incidentsManager: { value: activeIncidents.toString(), label: 'Active' },
      });
      
      console.log('✅ Disruption stats loaded successfully');
    } catch (error) {
      console.warn('⚠️ Stats fetch failed (non-critical):', error.message);
    }
  };
  
  const handleCardPress = (cardId) => {
    console.log(`[DisruptionCentre] Card pressed: ${cardId}`);
    setSelectedCard(cardId);
  };
  
  const disruptionCards = [
    {
      id: 'disruption-database',
      title: 'Disruption Database',
      subtitle: 'All roadworks and incidents',
      icon: 'database',
      color: disruptionTheme.colors.gradients.disruptionDatabase,
      stats: cardStats.disruptionDatabase,
    },
    {
      id: 'roadworks-manager',
      title: 'Roadworks Manager',
      subtitle: 'Manage planned roadworks',
      icon: 'traffic-cone',
      color: disruptionTheme.colors.gradients.roadworksManager,
      stats: cardStats.roadworksManager,
    },
    {
      id: 'incidents-manager',
      title: 'Incidents Manager',
      subtitle: 'Monitor live incidents',
      icon: 'alert-circle',
      color: disruptionTheme.colors.gradients.incidentsManager,
      stats: cardStats.incidentsManager,
    },
  ];
  
  // Render selected component
  const renderSelectedComponent = () => {
    if (!selectedCard) return null;
    
    let Component;
    switch (selectedCard) {
      case 'disruption-database':
        Component = () => (
          <DisruptionDatabase 
            onClose={() => setSelectedCard(null)}
          />
        );
        break;
      case 'roadworks-manager':
        console.log('🚧 Roadworks Manager component selected!');
        Component = () => {
          console.log('🚧 Rendering RoadworksManagerDashboard component...');
          return (
            <RoadworksErrorBoundary
              onClose={() => setSelectedCard(null)}
              onError={(error, errorInfo) => {
                console.error('Roadworks dashboard error in disruption centre:', error);
                console.error('Error info:', errorInfo);
              }}
            >
              <RoadworksManagerDashboard 
                onClose={() => setSelectedCard(null)}
              />
            </RoadworksErrorBoundary>
          );
        };
        break;
      case 'incidents-manager':
        // We'll create this component next
        Component = () => (
          <View style={styles.placeholderContainer}>
            <MaterialCommunityIcons name="alert-circle" size={64} color="#ef4444" />
            <Text style={styles.placeholderTitle}>Incidents Manager</Text>
            <Text style={styles.placeholderText}>Coming soon...</Text>
          </View>
        );
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
        <Text style={styles.loadingText}>Loading Disruption Centre...</Text>
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
        
        {/* Cards Grid */}
        <View style={styles.cardsSection}>
          <View style={styles.cardsGrid}>
            {disruptionCards.map((card) => (
              <OperationsCard
                key={card.id}
                {...card}
                onPress={() => handleCardPress(card.id)}
              />
            ))}
          </View>
        </View>
        
        {/* Summary Stats */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Quick Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{cardStats.disruptionDatabase.value}</Text>
              <Text style={styles.summaryLabel}>Total Disruptions</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: '#f59e0b' }]}>{cardStats.roadworksManager.value}</Text>
              <Text style={styles.summaryLabel}>Active Roadworks</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: '#ef4444' }]}>{cardStats.incidentsManager.value}</Text>
              <Text style={styles.summaryLabel}>Active Incidents</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Modal/Overlay for selected component */}
      {renderSelectedComponent()}
    </View>
  );
}

// Operations Card Component (copied from operations centre)
const OperationsCard = ({ title, subtitle, icon, color, stats, onPress }) => {
  const isGradient = Array.isArray(color);
  
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: isGradient ? color[0] : color },
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      {isGradient && (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            styles.cardGradient,
            { backgroundColor: color[1] },
          ]}
        />
      )}
      
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name={icon} size={32} color="#ffffff" />
          {stats && (
            <View style={styles.statsContainer}>
              <Text style={styles.statsValue}>{stats.value}</Text>
              <Text style={styles.statsLabel}>{stats.label}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: disruptionTheme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: disruptionTheme.colors.background,
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
  card: {
    width: Platform.OS === 'web' ? 'calc(33% - 11px)' : '48%',
    minHeight: 140,
    borderRadius: disruptionTheme.borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.9,
  },
  cardContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statsContainer: {
    alignItems: 'flex-end',
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statsLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: -2,
  },
  cardInfo: {
    marginTop: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  summarySection: {
    paddingHorizontal: 20,
    marginTop: 30,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
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
    backgroundColor: disruptionTheme.colors.background,
    borderRadius: disruptionTheme.borderRadius.xl,
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
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 16,
    color: '#6b7280',
  },
});
