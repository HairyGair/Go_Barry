// Go_BARRY/components/DisruptionControlRoom.jsx
// Complete Disruption Control Room Interface
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ServiceFrequencyDashboard from './ServiceFrequencyDashboard';
import AIDisruptionManager from './AIDisruptionManager';

const { width } = Dimensions.get('window');

const DisruptionControlRoom = ({ baseUrl }) => {
  const [activeScreen, setActiveScreen] = useState('frequency');

  const screens = [
    {
      id: 'frequency',
      title: 'Service Frequency',
      subtitle: 'Monitor service gaps & breakdowns',
      icon: 'analytics',
      color: '#3B82F6',
      component: ServiceFrequencyDashboard
    },
    {
      id: 'ai',
      title: 'AI Disruption Manager',
      subtitle: 'Smart diversions & messaging',
      icon: 'bulb',
      color: '#10B981',
      component: AIDisruptionManager
    }
  ];

  const renderActiveScreen = () => {
    const activeScreenConfig = screens.find(screen => screen.id === activeScreen);
    const ScreenComponent = activeScreenConfig.component;
    
    return <ScreenComponent baseUrl={baseUrl} />;
  };

  return (
    <View style={styles.container}>
      {/* Top Navigation */}
      <View style={styles.navigation}>
        <View style={styles.navHeader}>
          <Text style={styles.navTitle}>🚦 Disruption Control Room</Text>
          <Text style={styles.navSubtitle}>AI-powered traffic intelligence</Text>
        </View>
        
        <View style={styles.navTabs}>
          {screens.map((screen) => (
            <TouchableOpacity
              key={screen.id}
              style={[
                styles.navTab,
                activeScreen === screen.id && styles.activeNavTab,
                { borderColor: screen.color }
              ]}
              onPress={() => setActiveScreen(screen.id)}
            >
              <View style={styles.navTabContent}>
                <Ionicons 
                  name={screen.icon} 
                  size={20} 
                  color={activeScreen === screen.id ? screen.color : '#6B7280'} 
                />
                <View style={styles.navTabText}>
                  <Text style={[
                    styles.navTabTitle,
                    activeScreen === screen.id && { color: screen.color }
                  ]}>
                    {screen.title}
                  </Text>
                  <Text style={styles.navTabSubtitle}>
                    {screen.subtitle}
                  </Text>
                </View>
              </View>
              
              {activeScreen === screen.id && (
                <View style={[styles.activeIndicator, { backgroundColor: screen.color }]} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Active Screen Content */}
      <View style={styles.screenContainer}>
        {renderActiveScreen()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  navigation: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  navHeader: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#1E293B',
  },
  navTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  navSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
  navTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
  },
  navTab: {
    flex: 1,
    position: 'relative',
  },
  navTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingVertical: 12,
    gap: 12,
  },
  navTabText: {
    flex: 1,
  },
  navTabTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  navTabSubtitle: {
    fontSize: 11,
    color: '#6B7280',
  },
  activeNavTab: {
    backgroundColor: '#F8FAFC',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  screenContainer: {
    flex: 1,
  },
});

export default DisruptionControlRoom;