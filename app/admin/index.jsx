/*
 * Go Barry - Traffic Intelligence Platform
 * Admin Dashboard - Modern UI with All Admin Features
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSupervisorSession } from '../../components/hooks/useSupervisorSession';

export default function AdminDashboard() {
  const router = useRouter();
  const { supervisorSession, isAdmin, logout, supervisorName } = useSupervisorSession();
  const [navigating, setNavigating] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState('');

  // Redirect if not admin
  React.useEffect(() => {
    if (supervisorSession && !isAdmin) {
      Alert.alert(
        'Access Denied',
        'This page is restricted to administrators only.',
        [{ text: 'OK', onPress: () => router.replace('/') }]
      );
    }
  }, [supervisorSession, isAdmin, router]);

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  // Navigation handler for dashboard cards
  const handleCardNavigation = async (cardId) => {
    setNavigating(true);
    setNavigatingTo(cardId);
    
    // Small delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 100));
    
    switch(cardId) {
      case 'system-overview':
        router.push('/admin/system-overview');
        break;
      case 'intelligence':
        router.push('/admin/intelligence');
        break;
      case 'roadworks':
        router.push('/admin/roadworks');
        break;
      case 'supervisors':
        router.push('/admin/supervisors');
        break;
      case 'audit':
        router.push('/admin/audit');
        break;
      case 'analytics':
        router.push('/admin/analytics');
        break;
      case 'api-usage':
        router.push('/admin/api-usage');
        break;
      case 'live-map':
        router.push('/admin/live-map');
        break;
      default:
        console.warn('Unknown card ID:', cardId);
    }
  };

  if (!supervisorSession || !isAdmin) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Access Denied</Text>
      </View>
    );
  }

  const dashboardCards = [
    {
      id: 'system-overview',
      title: 'System Overview',
      subtitle: 'Real-time health monitoring',
      icon: 'monitor-dashboard',
      color: '#667eea',
      stats: { label: 'Uptime', value: '99.9%' }
    },
    {
      id: 'intelligence',
      title: 'Intelligence Dashboard',
      subtitle: 'ML predictions & insights',
      icon: 'brain',
      color: '#f093fb',
      stats: { label: 'Accuracy', value: '87%' }
    },
    {
      id: 'roadworks',
      title: 'Roadworks Manager',
      subtitle: 'Active disruptions control',
      icon: 'road-variant',
      color: '#fa709a',
      stats: { label: 'Active', value: '24' }
    },
    {
      id: 'supervisors',
      title: 'Supervisor Management',
      subtitle: 'Team & permissions',
      icon: 'account-group',
      color: '#30cfd0',
      stats: { label: 'Online', value: '5/9' }
    },
    {
      id: 'audit',
      title: 'Activity Audit Trail',
      subtitle: 'System activity logs',
      icon: 'file-document-outline',
      color: '#a8edea',
      stats: { label: 'Today', value: '142' }
    },
    {
      id: 'analytics',
      title: 'Alert Analytics',
      subtitle: 'Performance metrics',
      icon: 'chart-line',
      color: '#ffecd2',
      stats: { label: 'Processed', value: '8.2k' }
    },
    {
      id: 'api-usage',
      title: 'API Usage',
      subtitle: 'Service consumption',
      icon: 'api',
      color: '#ff9a9e',
      stats: { label: 'Calls/hr', value: '1.2k' }
    },
    {
      id: 'live-map',
      title: 'Live Map',
      subtitle: 'Real-time traffic view',
      icon: 'map-marker-radius',
      color: '#fbc2eb',
      stats: { label: 'Alerts', value: '37' }
    }
  ];

  const quickActions = [
    { icon: 'backup-restore', label: 'Backup System', color: '#4CAF50' },
    { icon: 'cached', label: 'Clear Cache', color: '#FF9800' },
    { icon: 'shield-check', label: 'Security Scan', color: '#2196F3' },
    { icon: 'bell-off', label: 'Mute Alerts', color: '#9C27B0' }
  ];

  const systemStatus = [
    { service: 'Backend API', status: 'operational', icon: 'check-circle' },
    { service: 'Convex Sync', status: 'operational', icon: 'check-circle' },
    { service: 'TomTom API', status: 'operational', icon: 'check-circle' },
    { service: 'WebSocket', status: 'degraded', icon: 'alert-circle' }
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <Pressable onPress={() => router.replace('/')} style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
              <Text style={styles.backText}>Home</Text>
            </Pressable>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
            <Text style={styles.headerSubtitle}>Go Barry Traffic Intelligence</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.userInfo}>
              <MaterialCommunityIcons name="shield-crown" size={24} color="#ffd700" />
              <Text style={styles.userName}>{supervisorName || 'Admin'}</Text>
            </Pressable>
            <Pressable onPress={handleLogout} style={styles.logoutButton}>
              <MaterialCommunityIcons name="logout" size={20} color="#ff6b6b" />
              <Text style={styles.logoutText}>Logout</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Status Bar */}
        <View style={styles.statusBar}>
          {systemStatus.map((item, index) => (
            <View key={index} style={styles.statusItem}>
              <MaterialCommunityIcons 
                name={item.icon} 
                size={16} 
                color={item.status === 'operational' ? '#4CAF50' : '#FF9800'} 
              />
              <Text style={styles.statusText}>{item.service}</Text>
            </View>
          ))}
        </View>

        {/* Main Dashboard Grid */}
        <View style={styles.grid}>
          {dashboardCards.map((card) => (
            <Pressable
              key={card.id}
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed
              ]}
              onPress={() => handleCardNavigation(card.id)}
            >
              <View style={[styles.cardGradient, { backgroundColor: card.color }]}>
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <MaterialCommunityIcons 
                      name={card.icon} 
                      size={32} 
                      color="white" 
                    />
                    <View style={styles.cardStat}>
                      <Text style={styles.statValue}>{card.stats.value}</Text>
                      <Text style={styles.statLabel}>{card.stats.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <Pressable
                key={index}
                style={({ pressed }) => [
                  styles.quickAction,
                  pressed && styles.quickActionPressed
                ]}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
                  <MaterialCommunityIcons 
                    name={action.icon} 
                    size={24} 
                    color={action.color} 
                  />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Activity Feed */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityFeed}>
            {[
              { time: '2 min ago', action: 'Supervisor AG003 dismissed alert #1247', type: 'dismiss' },
              { time: '15 min ago', action: 'New roadwork created: A1 Northbound', type: 'create' },
              { time: '1 hour ago', action: 'System backup completed successfully', type: 'system' },
              { time: '2 hours ago', action: 'API rate limit increased to 2000/hr', type: 'config' }
            ].map((item, index) => (
              <View key={index} style={styles.activityItem}>
                <View style={styles.activityDot} />
                <View style={styles.activityContent}>
                  <Text style={styles.activityText}>{item.action}</Text>
                  <Text style={styles.activityTime}>{item.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Navigation Actions */}
        <View style={styles.navigationSection}>
          <Text style={styles.sectionTitle}>Quick Navigation</Text>
          <View style={styles.navigationGrid}>
            <Pressable 
              style={[styles.navButton, styles.primaryNav]}
              onPress={() => router.push('/browser-main-optimized')}
            >
              <MaterialCommunityIcons name="desktop" size={24} color="#fff" />
              <Text style={styles.navText}>Supervisor Dashboard</Text>
            </Pressable>
            
            <Pressable 
              style={[styles.navButton, styles.secondaryNav]}
              onPress={() => {
                if (Platform.OS === 'web') {
                  window.open('/display', '_blank');
                }
              }}
            >
              <MaterialCommunityIcons name="television" size={24} color="#fff" />
              <Text style={styles.navText}>Control Room Display</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      
      {navigating && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>
            Loading {dashboardCards.find(c => c.id === navigatingTo)?.title}...
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    backgroundColor: '#1a1a2e',
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleSection: {
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  backText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  logoutText: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 24,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#64748b',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  card: {
    width: Platform.OS === 'web' ? 'calc(25% - 12px)' : '48%',
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  cardGradient: {
    flex: 1,
    padding: 20,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardStat: {
    alignItems: 'flex-end',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  quickActionsSection: {
    marginBottom: 32,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionPressed: {
    transform: [{ scale: 0.95 }],
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  activitySection: {
    marginBottom: 32,
  },
  activityFeed: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    marginTop: 6,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
  navigationSection: {
    marginBottom: 32,
  },
  navigationGrid: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  navButton: {
    flex: 1,
    minWidth: 200,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryNav: {
    backgroundColor: '#3b82f6',
  },
  secondaryNav: {
    backgroundColor: '#10b981',
  },
  navText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
});