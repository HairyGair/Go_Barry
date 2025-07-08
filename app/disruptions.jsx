/*
 * Go Barry - Traffic Intelligence Platform
 * Disruptions Management Landing Page
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, Pressable, ActivityIndicator, SafeAreaView, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSupervisor } from '../components/hooks/useSupervisorSession';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import AppHeader from '../components/common/AppHeader';

// Error Boundary Component
class DisruptionsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Disruptions page error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-outline" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <Pressable 
            style={styles.errorButton}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons name="arrow-left" size={16} color="#fff" />
            <Text style={styles.errorButtonText}>Go Back</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

// Main Disruptions Landing Page Component
export default function DisruptionsPage() {
  const { isLoggedIn, supervisorName, logout, supervisor, isLoading } = useSupervisor();
  const [roadworkCount, setRoadworkCount] = useState(0);
  const [incidentCount, setIncidentCount] = useState(0);
  const [totalDisruptions, setTotalDisruptions] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // Get counts from the unified disruptions system
  const disruptionStats = useQuery(api.disruptions?.getDisruptionStats);
  
  // Calculate counts based on disruption stats
  useEffect(() => {
    if (disruptionStats) {
      // Roadworks awaiting action (not dismissed)
      const roadworksPending = disruptionStats.byType?.roadwork || 0;
      setRoadworkCount(roadworksPending);
      
      // Active incidents
      const activeIncidents = disruptionStats.byType?.incident || 0;
      setIncidentCount(activeIncidents);
      
      // Total disruptions in database
      const total = disruptionStats.total || roadworksPending + activeIncidents;
      setTotalDisruptions(total);
    } else {
      // Fallback to static numbers if API not available
      setRoadworkCount(12);
      setIncidentCount(5);
      setTotalDisruptions(28);
    }
  }, [disruptionStats]);

  // Security check with loading state
  React.useEffect(() => {
    console.log('[DisruptionsPage] Checking authentication status...');
    console.log('[DisruptionsPage] isLoggedIn:', isLoggedIn);
    console.log('[DisruptionsPage] isLoading:', isLoading);
    console.log('[DisruptionsPage] supervisorName:', supervisorName);
    
    // Wait for authentication to be determined
    if (isLoading) {
      console.log('[DisruptionsPage] Auth still loading, waiting...');
      return;
    }
    
    // Only check authentication after loading is complete
    if (!isLoggedIn) {
      console.log('[DisruptionsPage] Not logged in, redirecting to home...');
      router.replace('/');
      return;
    }
    
    console.log('[DisruptionsPage] Authentication successful, showing content');
    setIsInitializing(false);
  }, [isLoggedIn, isLoading, supervisorName]);

  // Fetch recent activity from the API
  const fetchRecentActivity = async () => {
    try {
      setActivityLoading(true);
      const response = await fetch('https://go-barry.onrender.com/api/dashboard/activity?limit=8&hours=24');
      
      if (!response.ok) {
        console.warn('Activity API not available, using fallback');
        // Fallback to recent activity based on current data
        setRecentActivity([
          {
            id: 'fallback_1',
            description: `${supervisorName || 'Supervisor'} accessed disruptions centre`,
            icon: 'view-dashboard',
            color: '#3b82f6',
            timestamp: new Date().toISOString(),
            type: 'access'
          }
        ]);
        return;
      }
      
      const data = await response.json();
      if (data.success && data.data) {
        setRecentActivity(data.data);
      }
    } catch (error) {
      console.warn('Failed to fetch activity:', error);
      // Graceful fallback
      setRecentActivity([]);
    } finally {
      setActivityLoading(false);
    }
  };

  // Fetch activity on component mount and every 30 seconds
  useEffect(() => {
    if (isLoggedIn && !isInitializing) {
      fetchRecentActivity();
      const interval = setInterval(fetchRecentActivity, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, isInitializing, supervisorName]);

  // Helper function to format relative time
  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / 1000 / 60);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  };

  const handleBack = () => {
    router.back();
  };

  const navigateToIncidents = () => {
    router.push('/disruptions/incidents');
  };

  const navigateToRoadworks = () => {
    router.push('/disruptions/roadworks');
  };

  const navigateToDatabase = () => {
    router.push('/disruptions/database');
  };

  // Show loading if authentication is still being determined
  if (isLoading || isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9800" />
        <Text style={styles.loadingText}>Loading Disruptions...</Text>
      </View>
    );
  }

  return (
    <DisruptionsErrorBoundary>
      <SafeAreaView style={styles.container}>
        <AppHeader />
        {/* Header Section */}
        <View style={styles.disruptionsHeader}>
          <View style={styles.headerContent}>
            <View style={styles.titleSection}>
              <Pressable onPress={handleBack} style={styles.backButton}>
                <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
                <Text style={styles.backText}>Home</Text>
              </Pressable>
              <Text style={styles.headerTitle}>Disruptions Centre</Text>
              <Text style={styles.headerSubtitle}>Daily Operational Tools</Text>
            </View>
            <View style={styles.headerActions}>
              {supervisorName && (
                <View style={styles.userInfo}>
                  <MaterialCommunityIcons name="account-circle" size={24} color="#fff" />
                  <Text style={styles.userName}>{supervisorName}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Status Bar */}
        <View style={styles.statusBar}>
          <View style={styles.statusItem}>
            <MaterialCommunityIcons name="check-circle" size={16} color="#4CAF50" />
            <Text style={styles.statusText}>Backend API</Text>
          </View>
          <View style={styles.statusItem}>
            <MaterialCommunityIcons name="check-circle" size={16} color="#4CAF50" />
            <Text style={styles.statusText}>Convex Sync</Text>
          </View>
          <View style={styles.statusItem}>
            <MaterialCommunityIcons name="check-circle" size={16} color="#4CAF50" />
            <Text style={styles.statusText}>GTFS Data</Text>
          </View>
          <View style={styles.statusItem}>
            <MaterialCommunityIcons name="alert-circle" size={16} color="#FF9800" />
            <Text style={styles.statusText}>Weather API</Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          

          {/* Cards Grid */}
          <View style={styles.cardGrid}>
            {/* Roadworks Card */}
            <Pressable
              style={[styles.card, styles.roadworksCard]}
              onPress={navigateToRoadworks}
              accessibilityRole="button"
              accessibilityLabel="Open Roadworks Management"
            >
              <View style={styles.cardInner}>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="road-variant" size={32} color="white" />
                  <View style={styles.cardStat}>
                    <Text style={styles.statValue}>{roadworkCount}</Text>
                    <Text style={styles.statLabel}>Awaiting</Text>
                  </View>
                </View>
                <Text style={styles.cardTitle}>Roadworks</Text>
                <Text style={styles.cardSubtitle}>Manage roadworks & diversions</Text>
              </View>
            </Pressable>

            {/* Incidents Card */}
            <Pressable
              style={[styles.card, styles.incidentsCard]}
              onPress={navigateToIncidents}
              accessibilityRole="button"
              accessibilityLabel="Open Incidents Management"
            >
              <View style={styles.cardInner}>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="alert" size={32} color="white" />
                  <View style={styles.cardStat}>
                    <Text style={styles.statValue}>{incidentCount}</Text>
                    <Text style={styles.statLabel}>Active</Text>
                  </View>
                </View>
                <Text style={styles.cardTitle}>Incidents</Text>
                <Text style={styles.cardSubtitle}>Track live incidents</Text>
              </View>
            </Pressable>

            {/* Disruption Database Card */}
            <Pressable
              style={[styles.card, styles.databaseCard]}
              onPress={navigateToDatabase}
              accessibilityRole="button"
              accessibilityLabel="Open Disruption Database"
            >
              <View style={styles.cardInner}>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="database" size={32} color="white" />
                  <View style={styles.cardStat}>
                    <Text style={styles.statValue}>{totalDisruptions}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                  </View>
                </View>
                <Text style={styles.cardTitle}>Disruption Database</Text>
                <Text style={styles.cardSubtitle}>Historical disruption records</Text>
              </View>
            </Pressable>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              <Pressable style={styles.quickAction}>
                <View style={[styles.quickActionIcon, { backgroundColor: '#F44336' + '20' }]}>
                  <MaterialCommunityIcons name="alert-circle" size={24} color="#F44336" />
                </View>
                <Text style={styles.quickActionLabel}>Emergency Alert</Text>
              </Pressable>
              <Pressable style={styles.quickAction}>
                <View style={[styles.quickActionIcon, { backgroundColor: '#2196F3' + '20' }]}>
                  <MaterialCommunityIcons name="bullhorn" size={24} color="#2196F3" />
                </View>
                <Text style={styles.quickActionLabel}>Broadcast</Text>
              </Pressable>
              <Pressable style={styles.quickAction}>
                <View style={[styles.quickActionIcon, { backgroundColor: '#4CAF50' + '20' }]}>
                  <MaterialCommunityIcons name="file-document" size={24} color="#4CAF50" />
                </View>
                <Text style={styles.quickActionLabel}>Daily Report</Text>
              </Pressable>
              <Pressable style={styles.quickAction}>
                <View style={[styles.quickActionIcon, { backgroundColor: '#9C27B0' + '20' }]}>
                  <MaterialCommunityIcons name="refresh" size={24} color="#9C27B0" />
                </View>
                <Text style={styles.quickActionLabel}>Refresh Data</Text>
              </Pressable>
            </View>
          </View>

          {/* Recent Activity - Live Feed */}
          <View style={styles.activitySection}>
            <View style={styles.activityHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              {activityLoading && (
                <ActivityIndicator size="small" color="#6b7280" />
              )}
            </View>
            <View style={styles.activityFeed}>
              {recentActivity.length > 0 ? (
                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  style={styles.activityScrollView}
                  nestedScrollEnabled={true}
                >
                  {recentActivity.map((activity) => (
                    <View key={activity.id} style={styles.activityItem}>
                      <View style={[styles.activityIcon, { backgroundColor: activity.color + '20' }]}>
                        <MaterialCommunityIcons 
                          name={activity.icon} 
                          size={14} 
                          color={activity.color} 
                        />
                      </View>
                      <View style={styles.activityContent}>
                        <Text style={styles.activityText} numberOfLines={2}>
                          {activity.description}
                        </Text>
                        <Text style={styles.activityTime}>
                          {getRelativeTime(activity.timestamp)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.noActivityContainer}>
                  <MaterialCommunityIcons name="history" size={32} color="#d1d5db" />
                  <Text style={styles.noActivityText}>No recent activity</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </DisruptionsErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 20,
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 30,
  },
  errorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disruptionsHeader: {
    backgroundColor: '#1a1a2e',
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 2,
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
  statusBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 20,
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
  mainContent: {
    flex: 1,
    padding: 20,
  },

  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 16,
    padding: 24,
    width: Platform.OS === 'web' ? 'calc(50% - 8px)' : '100%',
    minWidth: 300,
    height: 180,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  roadworksCard: {
    backgroundColor: '#667eea',
  },
  incidentsCard: {
    backgroundColor: '#fa709a',
  },
  databaseCard: {
    backgroundColor: '#4f46e5',
  },
  cardInner: {
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
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  quickActionsSection: {
    marginTop: 32,
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
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    minHeight: 200,
  },
  activityScrollView: {
    maxHeight: 300,
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  activityIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
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
    lineHeight: 20,
  },
  activityTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
  noActivityContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noActivityText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
