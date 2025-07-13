/*
 * Go Barry - Traffic Intelligence Platform
 * Home Page with Login Functionality
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSupervisor } from './hooks/useSupervisorSession';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from './common/AppHeader';

const { width: screenWidth } = Dimensions.get('window');

// Application cards configuration with refined styling
const APP_CARDS = [
  {
    id: 'control-room',
    title: 'Control Room Display',
    subtitle: '24/7 traffic monitoring display',
    description: 'Large screen optimized display for control room environments with real-time alerts',
    icon: 'tv',
    color: '#E31E24',
    gradient: ['#E31E24', '#C41E3A'],
    features: [
      'Real-time traffic alerts',
      'Live traffic map',
      '24/7 monitoring',
      'Large screen optimized'
    ],
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
    gradient: ['#9B59B6', '#8E44AD'],
    features: [
      'Email & messaging',
      '8x8 VoIP integration',
      'Automated reports',
      'SharePoint access'
    ],
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
    gradient: ['#16A085', '#138D75'],
    features: [
      'Duty boards',
      'Performance statistics',
      'Live traffic map',
      'Disruption database'
    ],
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
    gradient: ['#F39C12', '#E67E22'],
    features: [
      'Create and track incidents',
      'Manage roadworks',
      'Route matching',
      'Automated notifications'
    ],
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
    gradient: ['#DC2626', '#B91C1C'],
    features: [
      'Engineering troubleshooting',
      'Safety protocols',
      'Step-by-step guides',
      'Emergency procedures'
    ],
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
    gradient: ['#8E44AD', '#7D3C98'],
    features: [
      'Supervisor management',
      'System monitoring',
      'Health checks',
      'Configuration'
    ],
    buttonText: 'Admin Dashboard',
    requiresLogin: true,
    adminOnly: true,
    route: '/admin'
  }
];

const HomePageWithLogin = () => {
  const router = useRouter();
  const { isLoggedIn, supervisorName, isAdmin } = useSupervisor();
  
  // Force re-render when login state changes
  useEffect(() => {
    console.log('Login state changed:', { isLoggedIn, supervisorName, isAdmin });
  }, [isLoggedIn, supervisorName, isAdmin]);

  const navigateToApp = (card) => {
    if (card.requiresLogin && !isLoggedIn) {
      return; // Login handled by header
    }
    if (card.adminOnly && !isAdmin) {
      return; // Admin only
    }
    
    // Special handling for breakdown guide
    if (card.id === 'breakdown-guide') {
      // Check if we're in a web environment
      if (Platform.OS === 'web' && window) {
        // Open the existing breakdown guide application
        window.open('/breakdown-guide/guide.html', '_blank');
        return;
      }
    }
    
    console.log(`[Navigation] Navigating to: ${card.route}`);
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
    if (card.requiresLogin && !isLoggedIn) {
      return false; // Show as actionable but login required
    }
    if (card.adminOnly && !isAdmin) {
      return true; // Actually disabled for non-admins
    }
    return false;
  };

  return (
    <View style={styles.container}>
      <AppHeader />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeTitle}>
              {isLoggedIn ? `Welcome back, ${supervisorName}` : 'Welcome to Go BARRY'}
            </Text>
            <Text style={styles.welcomeSubtitle}>
              Bus Alerts & Roadworks Reporting for You
            </Text>
            <Text style={styles.welcomeDescription}>
              {isLoggedIn 
                ? 'Choose from the applications below to access your tools and dashboards.'
                : 'Select an application to get started. Supervisor tools require authentication via the login button above.'}
            </Text>
          </View>
          
          {/* Status Indicators */}
          <View style={styles.statusBar}>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.statusLabel}>System Online</Text>
            </View>
            <View style={styles.statusItem}>
              <Ionicons name="business" size={16} color="#6B7280" />
              <Text style={styles.statusLabel}>231 Routes Active</Text>
            </View>
            <View style={styles.statusItem}>
              <Ionicons name="people" size={16} color="#6B7280" />
              <Text style={styles.statusLabel}>9 Supervisors</Text>
            </View>
          </View>
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
                disabled={isCardDisabled(card)}
              >
                <View style={[styles.cardHeader, { backgroundColor: card.color + '15' }]}>
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
                  
                  <View style={styles.cardFeatures}>
                    {card.features.map((feature, index) => (
                      <View key={index} style={styles.featureItem}>
                        <Ionicons name="checkmark" size={14} color={card.color} />
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                  
                  <View style={[
                    styles.cardAction, 
                    { backgroundColor: isCardDisabled(card) ? '#9CA3AF' : card.color }
                  ]}>
                    <Text style={styles.cardActionText}>
                      {getCardButtonText(card)}
                    </Text>
                    <Ionicons 
                      name={isCardDisabled(card) ? "lock-closed" : "arrow-forward"} 
                      size={18} 
                      color="#fff" 
                    />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Links */}
        <View style={styles.quickLinksSection}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          <View style={styles.quickLinks}>
            <TouchableOpacity style={styles.quickLink}>
              <Ionicons name="help-circle" size={24} color="#3B82F6" />
              <Text style={styles.quickLinkText}>Help & Support</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickLink}>
              <Ionicons name="document-text" size={24} color="#059669" />
              <Text style={styles.quickLinkText}>Documentation</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickLink}>
              <Ionicons name="notifications" size={24} color="#F59E0B" />
              <Text style={styles.quickLinkText}>System Status</Text>
            </TouchableOpacity>
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
  
  // Welcome Section
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
  welcomeContent: {
    marginBottom: 24,
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
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  
  // Applications Section
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
  
  // Card Styles (matching Communications Hub)
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
  },
  cardIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  cardContent: {
    padding: 20,
    paddingTop: 0,
  },
  cardDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 16,
  },
  cardFeatures: {
    gap: 8,
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    color: '#6B7280',
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
  
  // Quick Links Section
  quickLinksSection: {
    marginBottom: 32,
  },
  quickLinks: {
    flexDirection: 'row',
    gap: 16,
  },
  quickLink: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickLinkText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default HomePageWithLogin;