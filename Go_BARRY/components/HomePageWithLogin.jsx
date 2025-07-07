/*
 * Go Barry - Traffic Intelligence Platform
 * Home Page with Login Functionality
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSupervisor } from './hooks/useSupervisorSession';
import Icon from 'react-native-vector-icons/FontAwesome5';
import AppCard from './AppCard';
import AppHeader from './common/AppHeader';

const HomePageWithLogin = () => {
  const router = useRouter();
  const {
    isLoggedIn,
    supervisorName,
    isAdmin
  } = useSupervisor();

  // System status for display
  const [systemStatus, setSystemStatus] = useState('checking');

  // Check system status
  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        const response = await fetch('https://go-barry.onrender.com/api/health');
        setSystemStatus(response.ok ? 'operational' : 'issues');
      } catch (error) {
        setSystemStatus('offline');
      }
    };

    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const navigateToApp = (path) => {
    console.log(`[Navigation] Navigating to: ${path}`);
    router.push(path);
  };

  // Application cards configuration
  const appCards = [
    {
      id: 'control-room',
      icon: <Icon name="tv" size={36} color="#fff" />,
      title: 'Control Room Display',
      description: '24/7 traffic monitoring display designed for control room environments and large screens.',
      features: [
        { icon: 'eye', text: 'Real-time traffic alerts' },
        { icon: 'map', text: 'Live traffic map' },
        { icon: 'clock', text: '24/7 monitoring' },
        { icon: 'desktop', text: 'Large screen optimized' }
      ],
      buttonText: 'Open Control Room',
      onPress: () => navigateToApp('/display'),
      accessibilityLabel: 'Control Room Display - 24/7 traffic monitoring for control room environments',
      iconBackgroundColor: '#E31E24',
      testID: 'control-room-card'
    },
    {
      id: 'communications',
      icon: <Icon name="comments" size={36} color="#fff" />,
      title: 'Communications Hub',
      description: 'Unified messaging center for email, phone, and ticketing systems with automated reports.',
      features: [
        { icon: 'envelope', text: 'Email & messaging' },
        { icon: 'phone', text: '8x8 VoIP integration' },
        { icon: 'file-alt', text: 'Automated reports' },
        { icon: 'folder-open', text: 'SharePoint access' }
      ],
      buttonText: isLoggedIn ? 'Access Communications' : 'Login Required',
      onPress: () => {
        if (isLoggedIn) {
          navigateToApp('/communications-hub');
        }
        // If not logged in, user can use the header login
      },
      accessibilityLabel: 'Communications Hub - Unified messaging center for all communication channels',
      iconBackgroundColor: '#8B5CF6',
      testID: 'communications-card'
    },
    {
      id: 'operations',
      icon: <Icon name="tools" size={36} color="#fff" />,
      title: 'Operations',
      description: 'Daily operational tools including duty boards, performance monitoring, and live traffic overview.',
      features: [
        { icon: 'clipboard-list', text: 'Duty boards' },
        { icon: 'chart-line', text: 'Performance statistics' },
        { icon: 'map', text: 'Live traffic map' },
        { icon: 'database', text: 'Disruption database' }
      ],
      buttonText: isLoggedIn ? 'Access Operations' : 'Login Required',
      onPress: () => {
        if (isLoggedIn) {
          navigateToApp('/operations');
        }
        // If not logged in, user can use the header login
      },
      accessibilityLabel: 'Operations - Daily operational tools including duty boards and incident management',
      iconBackgroundColor: '#059669',
      testID: 'operations-card'
    },
    {
      id: 'disruptions',
      icon: <Icon name="traffic-cone" size={36} color="#fff" />,
      title: 'Disruptions',
      description: 'Manage network disruptions, incidents, and roadworks in real-time with intelligent route matching.',
      features: [
        { icon: 'exclamation-triangle', text: 'Create and track incidents' },
        { icon: 'road', text: 'Manage roadworks and diversions' },
        { icon: 'route', text: 'Real-time GTFS route matching' },
        { icon: 'bell', text: 'Automated supervisor notifications' }
      ],
      buttonText: isLoggedIn ? 'Manage Disruptions' : 'Login Required',
      onPress: () => {
        if (isLoggedIn) {
          navigateToApp('/disruptions');
        }
        // If not logged in, user can use the header login
      },
      accessibilityLabel: 'Open Disruptions Management - Create and manage network incidents and roadworks',
      iconBackgroundColor: '#FF9800',
      testID: 'disruptions-card'
    },
    {
      id: 'admin',
      icon: <Icon name="cog" size={36} color="#fff" />,
      title: 'Admin Dashboard',
      description: 'System administration tools for managing supervisors, monitoring health, and configuring settings.',
      features: [
        { icon: 'users-cog', text: 'Supervisor management' },
        { icon: 'chart-line', text: 'System monitoring' }
      ],
      buttonText: !isLoggedIn ? 'Admin Login Required' : 
                 isAdmin ? 'Open Admin Dashboard' : 'Admin Access Only',
      onPress: () => {
        if (isLoggedIn && isAdmin) {
          navigateToApp('/admin');
        }
        // If not logged in, user can use the header login
      },
      accessibilityLabel: 'Admin Dashboard - System administration tools for managing supervisors and monitoring',
      iconBackgroundColor: '#8b5cf6',
      disabled: !isAdmin,
      testID: 'admin-card'
    }
  ];

  // Render application cards
  const renderApps = () => {
    return (
      <View style={styles.appsGrid}>
        {appCards.map((app) => (
          <AppCard
            key={app.id}
            icon={app.icon}
            title={app.title}
            description={app.description}
            features={app.features}
            buttonText={app.buttonText}
            onPress={app.onPress}
            accessibilityLabel={app.accessibilityLabel}
            iconBackgroundColor={app.iconBackgroundColor}
            disabled={app.disabled}
            testID={app.testID}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader />
      <ScrollView style={styles.scrollContent}>
        {/* Main Content */}
        <View style={styles.mainContent}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            {isLoggedIn ? `Welcome, ${supervisorName}` : 'Welcome to Go Barry'}
          </Text>
          <Text style={styles.welcomeDescription}>
            {isLoggedIn ? 
              'Select the application you want to access.' : 
              'Select the application you want to access. Supervisor tools require authentication.'}
          </Text>
        </View>

        {/* Always show app options, with Control Room accessible without login */}
        {renderApps()}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  scrollContent: {
    flex: 1,
  },
  mainContent: {
    padding: 20,
  },
  welcomeSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  welcomeDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  appsGrid: {
    gap: 20,
  },
});

export default HomePageWithLogin;