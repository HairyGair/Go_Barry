/*
 * Go Barry - Traffic Intelligence Platform
 * Home Page with Login Functionality - Simplified Version
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSupervisor } from './hooks/useSupervisorSession';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from './common/AppHeader';

const { width: screenWidth } = Dimensions.get('window');

// Application cards configuration
const APP_CARDS = [
  {
    id: 'control-room',
    title: 'Control Room Display',
    subtitle: '24/7 traffic monitoring display',
    description: 'Large screen optimized display for control room environments with real-time alerts',
    icon: 'tv',
    color: '#E31E24',
    buttonText: 'Open Control Room',
    requiresLogin: false,
    route: '/display'
  },
  {
    id: 'communications',
    title: 'Communications Hub',
    subtitle: 'Unified messaging center',
    description: 'Email, phone, and ticketing systems with automated reports and SharePoint access',
    icon: 'chatbubbles',
    color: '#8B5CF6',
    buttonText: 'Access Communications',
    requiresLogin: true,
    route: '/communications-hub'
  },
  {
    id: 'operations',
    title: 'Operations Centre',
    subtitle: 'Daily operational tools',
    description: 'Duty boards, performance monitoring, and live traffic overview for daily operations',
    icon: 'construct',
    color: '#059669',
    buttonText: 'Access Operations',
    requiresLogin: true,
    route: '/operations-centre'
  },
  {
    id: 'disruptions',
    title: 'Disruptions Manager',
    subtitle: 'Network disruption management',
    description: 'Create and manage incidents, roadworks, and diversions with intelligent route matching',
    icon: 'warning',
    color: '#FF9800',
    buttonText: 'Manage Disruptions',
    requiresLogin: true,
    route: '/disruptions'
  },
  {
    id: 'breakdown-guide',
    title: 'Breakdown Guide',
    subtitle: 'Engineering issues guide',
    description: 'SDC guide to engineering issues with troubleshooting steps and safety protocols',
    icon: 'construct-outline',
    color: '#DC2626',
    buttonText: 'Open Breakdown Guide',
    requiresLogin: false,
    route: '/breakdown-guide'
  },
  {
    id: 'admin',
    title: 'Admin Dashboard',
    subtitle: 'System administration',
    description: 'Supervisor management, system monitoring, and configuration settings',
    icon: 'settings',
    color: '#8B5CF6',
    buttonText: 'Admin Dashboard',
    requiresLogin: true,
    adminOnly: true,
    route: '/admin'
  }
];

const HomePageWithLogin = () => {
  const router = useRouter();
  const { isLoggedIn, supervisorName, isAdmin } = useSupervisor();
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Debug logging
  useEffect(() => {
    console.log('[HomePageWithLogin-Simple] Auth state:', { isLoggedIn, supervisorName, isAdmin });
  }, [isLoggedIn, supervisorName, isAdmin]);

  const navigateToApp = (card) => {
    console.log('[Navigation] Attempting to navigate:', {
      cardId: card.id,
      route: card.route,
      requiresLogin: card.requiresLogin,
      isLoggedIn,
      isAdmin
    });

    // Check permissions
    if (card.requiresLogin && !isLoggedIn) {
      console.log('[Navigation] Blocked - login required');
      alert('Please login to access this feature');
      return;
    }
    
    if (card.adminOnly && !isAdmin) {
      console.log('[Navigation] Blocked - admin only');
      alert('Admin access required');
      return;
    }
    
    // Special handling for breakdown guide
    if (card.id === 'breakdown-guide' && Platform.OS === 'web') {
      window.open('/breakdown-guide/guide.html', '_blank');
      return;
    }
    
    console.log(`[Navigation] Proceeding to: ${card.route}`);
    router.push(card.route);
  };

  const getCardButtonText = (card) => {
    if (card.requiresLogin && !isLoggedIn) {
      return 'Login Required';
    }
    if (card.adminOnly && !isAdmin && isLoggedIn) {
      return 'Admin Access Only';
    }
    return card.buttonText;
  };

  const isCardDisabled = (card) => {
    if (card.requiresLogin && !isLoggedIn) return true;
    if (card.adminOnly && !isAdmin) return true;
    return false;
  };

  // Force refresh when login state changes
  const handleLoginSuccess = () => {
    console.log('[HomePageWithLogin-Simple] Login success callback');
    setRefreshKey(prev => prev + 1);
  };

  return (
    <View style={styles.container} key={refreshKey}>
      <AppHeader onLoginSuccess={handleLoginSuccess} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            {isLoggedIn ? `Welcome back, ${supervisorName}` : 'Welcome to Go BARRY'}
          </Text>
          <Text style={styles.welcomeSubtitle}>
            Bus Alerts & Roadworks Reporting for You
          </Text>
          <Text style={styles.welcomeDescription}>
            {isLoggedIn 
              ? 'Choose from the applications below to access your tools and dashboards.'
              : 'Select an application to get started. Supervisor tools require authentication.'}
          </Text>
        </View>

        {/* Applications Grid */}
        <View style={styles.appsSection}>
          <Text style={styles.sectionTitle}>Applications</Text>
          <View style={styles.cardsGrid}>
            {APP_CARDS.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={[
                  styles.card,
                  { borderTopColor: card.color },
                  isCardDisabled(card) && styles.disabledCard
                ]}
                onPress={() => navigateToApp(card)}
                activeOpacity={0.8}
                disabled={false} // Always allow press, check permissions in handler
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIconContainer, { backgroundColor: card.color }]}>
                    <Ionicons name={card.icon} size={32} color="#fff" />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{card.title}</Text>
                    <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
                  </View>
                </View>
                
                <View style={styles.cardContent}>
                  <Text style={styles.cardDescription}>{card.description}</Text>
                  
                  <TouchableOpacity 
                    style={[
                      styles.cardAction, 
                      { backgroundColor: isCardDisabled(card) ? '#9CA3AF' : card.color }
                    ]}
                    onPress={() => navigateToApp(card)}
                  >
                    <Text style={styles.cardActionText}>
                      {getCardButtonText(card)}
                    </Text>
                    <Ionicons 
                      name={isCardDisabled(card) ? "lock-closed" : "arrow-forward"} 
                      size={18} 
                      color="#fff" 
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  welcomeSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 16,
    fontWeight: '500',
  },
  welcomeDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  appsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  card: {
    width: Platform.OS === 'web' ? 'calc(50% - 10px)' : '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderTopWidth: 4,
  },
  disabledCard: {
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
    backgroundColor: '#f8f9fa',
  },
  cardIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 4,
  },
  cardContent: {
    padding: 20,
    paddingTop: 0,
  },
  cardDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 20,
  },
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cardActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomePageWithLogin;