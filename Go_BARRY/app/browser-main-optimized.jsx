// Optimized browser-main.jsx with lazy loading and code splitting
import React, { useState, useEffect, lazy, Suspense } from 'react';
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import SupervisorLogin from '../components/SupervisorLogin';
import { useSupervisorSession } from '../components/hooks/useSupervisorSession';
import { preloadCriticalComponents, usePerformanceMonitor } from '../utils/performance';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

// Lazy load heavy components
const AdminPanel = lazy(() => import('../app/admin/index'));
const SupervisorControl = lazy(() => import('../components/SupervisorControl'));
const EnhancedDashboard = lazy(() => import('../components/EnhancedDashboard'));
const IncidentManager = lazy(() => import('../components/operations/IncidentManager'));
const RoadworksManager = lazy(() => import('../components/operations/RoadworksManager'));
const AIDisruptionManager = lazy(() => import('../components/operations/DisruptionDatabase'));
const MessageDistributionCenter = lazy(() => import('../components/MessageDistributionCentre'));
const AutomatedReportingSystem = lazy(() => import('../components/AutomatedReportingSystem'));
const SystemHealthMonitor = lazy(() => import('../components/SystemHealthMonitor'));
const TrainingHelpSystem = lazy(() => import('../components/TrainingHelpSystem'));

// Loading component
const ComponentLoader = ({ name }) => (
  <View style={styles.loaderContainer}>
    <Text style={styles.loaderText}>Loading {name}...</Text>
  </View>
);

const BrowserMain = () => {
  const router = useRouter();
  const { supervisorSession, logout } = useSupervisorSession();
  const [selectedOption, setSelectedOption] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const perf = usePerformanceMonitor('BrowserMain');

  // Preload critical components after initial render
  useEffect(() => {
    if (isWeb) {
      preloadCriticalComponents();
    }
    perf?.measureRender();
  }, []);

  const navigationOptions = [
    { 
      id: 'admin', 
      title: 'Admin Panel', 
      description: 'System administration and supervisor management',
      icon: 'shield', 
      color: '#DC2626',
      component: AdminPanel,
      requiresAdmin: true,
      adminOnly: true 
    },
    { 
      id: 'supervisor-control', 
      title: 'Supervisor Control', 
      description: 'Interactive supervisor controls & display sync',
      icon: 'people', 
      color: '#F59E0B',
      component: SupervisorControl,
      requiresAuth: true 
    },
    { 
      id: 'dashboard', 
      title: 'Control Dashboard', 
      description: 'Real-time traffic intelligence overview',
      icon: 'grid', 
      color: '#10B981',
      component: EnhancedDashboard 
    },
    { 
      id: 'incidents', 
      title: 'Incident Manager', 
      description: 'Create & track incidents with GTFS route detection',
      icon: 'warning', 
      color: '#EF4444',
      component: IncidentManager,
      requiresAuth: true 
    },
    { 
      id: 'roadworks', 
      title: 'Roadworks Manager', 
      description: 'Manage roadworks & create Blink diversions',
      icon: 'construct', 
      color: '#F97316',
      component: RoadworksManager,
      requiresAuth: true 
    },
    { 
      id: 'disruptions', 
      title: 'AI Disruption Manager', 
      description: 'Smart diversions & automated messaging',
      icon: 'flash', 
      color: '#8B5CF6',
      component: AIDisruptionManager,
      requiresAuth: true,
      beta: true 
    },
    { 
      id: 'messages', 
      title: 'Message Distribution', 
      description: 'Multi-channel communication system',
      icon: 'mail', 
      color: '#3B82F6',
      component: MessageDistributionCenter,
      requiresAuth: true 
    },
    { 
      id: 'reports', 
      title: 'Automated Reports', 
      description: 'Daily reports & operational summaries',
      icon: 'document-text', 
      color: '#14B8A6',
      component: AutomatedReportingSystem,
      requiresAuth: true 
    },
    { 
      id: 'system-health', 
      title: 'System Health', 
      description: 'Real-time performance monitoring',
      icon: 'pulse', 
      color: '#059669',
      component: SystemHealthMonitor 
    },
    { 
      id: 'training', 
      title: 'Training & Help', 
      description: 'Learn Go Barry & get support',
      icon: 'school', 
      color: '#0EA5E9',
      component: TrainingHelpSystem 
    }
  ];

  const handleOptionSelect = (option) => {
    if (option.requiresAuth && !supervisorSession) {
      Alert.alert(
        'Authentication Required',
        `Please log in to access ${option.title}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => setShowLogin(true) }
        ]
      );
      return;
    }

    if (option.adminOnly && supervisorSession && !supervisorSession.supervisor.isAdmin) {
      Alert.alert(
        'Admin Access Required',
        'This feature is only available to administrators',
        [{ text: 'OK' }]
      );
      return;
    }

    setSelectedOption(option);
  };

  const renderSelectedComponent = () => {
    if (!selectedOption) return null;

    const Component = selectedOption.component;
    const componentProps = selectedOption.id === 'supervisor-control' && supervisorSession
      ? {
          supervisorId: supervisorSession.supervisor.backendId || supervisorSession.supervisor.id,
          supervisorName: supervisorSession.supervisor.name,
          sessionId: supervisorSession.sessionId,
          supervisorSession: supervisorSession,
          onClose: () => setSelectedOption(null)
        }
      : { onClose: () => setSelectedOption(null) };

    return (
      <Suspense fallback={<ComponentLoader name={selectedOption.title} />}>
        <Component {...componentProps} />
      </Suspense>
    );
  };

  if (selectedOption) {
    return renderSelectedComponent();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/')}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Go BARRY Supervisor</Text>
          <Text style={styles.headerSubtitle}>Traffic Intelligence Command Center</Text>
        </View>

        {supervisorSession ? (
          <View style={styles.userInfo}>
            <Ionicons name="person-circle" size={24} color="#10B981" />
            <Text style={styles.userName}>{supervisorSession.supervisor.name}</Text>
            <TouchableOpacity onPress={logout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => setShowLogin(true)}
          >
            <Ionicons name="log-in" size={20} color="white" />
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.optionsGrid}>
          {navigationOptions.map((option) => {
            const isDisabled = (option.requiresAuth && !supervisorSession) || 
                              (option.adminOnly && (!supervisorSession || !supervisorSession.supervisor.isAdmin));
            
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  isDisabled && styles.optionCardDisabled
                ]}
                onPress={() => handleOptionSelect(option)}
                disabled={isDisabled}
              >
                <View style={[styles.iconContainer, { backgroundColor: option.color }]}>
                  <Ionicons name={option.icon} size={28} color="white" />
                </View>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
                
                {option.beta && (
                  <View style={styles.betaBadge}>
                    <Text style={styles.betaText}>BETA</Text>
                  </View>
                )}
                
                {option.requiresAuth && !supervisorSession && (
                  <View style={styles.lockOverlay}>
                    <Ionicons name="lock-closed" size={20} color="#64748B" />
                  </View>
                )}
                
                {option.adminOnly && supervisorSession && !supervisorSession.supervisor.isAdmin && (
                  <View style={styles.lockOverlay}>
                    <Ionicons name="shield" size={20} color="#DC2626" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <SupervisorLogin
        visible={showLogin}
        onClose={() => setShowLogin(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // ... existing styles ...
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loaderText: {
    fontSize: 16,
    color: '#64748B',
  },
  // ... rest of styles ...
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    backgroundColor: '#1E293B',
    padding: 20,
    paddingTop: isWeb ? 20 : 40,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    color: '#10B981',
    fontWeight: '600',
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#DC2626',
    borderRadius: 4,
  },
  logoutText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 6,
  },
  loginText: {
    color: 'white',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingBottom: 40,
  },
  optionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    width: width > 768 ? (width - 56) / 3 : (width - 48) / 2,
    minHeight: 160,
    borderWidth: 1,
    borderColor: '#334155',
    position: 'relative',
  },
  optionCardDisabled: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },
  betaBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  betaText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
});

export default BrowserMain;