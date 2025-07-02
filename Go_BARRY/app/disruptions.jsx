/*
 * Go Barry - Traffic Intelligence Platform
 * Disruptions Management Landing Page
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React from 'react';
import { View, Text, StyleSheet, Platform, Pressable, ActivityIndicator, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useSupervisor } from '../components/hooks/useSupervisorSession';
import Icon from 'react-native-vector-icons/FontAwesome5';

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
          <Icon name="exclamation-triangle" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <Pressable 
            style={styles.errorButton}
            onPress={() => router.back()}
          >
            <Icon name="arrow-left" size={16} color="#fff" />
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
  const { isLoggedIn, supervisorName, isLoading } = useSupervisor();

  // Redirect if not logged in
  React.useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace('/');
    }
  }, [isLoggedIn, isLoading]);

  const handleBack = () => {
    router.back();
  };

  const navigateToIncidents = () => {
    router.push('/disruptions/incidents');
  };

  const navigateToRoadworks = () => {
    router.push('/disruptions/roadworks');
  };

  // Show loading if authentication is still being determined
  if (isLoading) {
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
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable 
              style={styles.backButton}
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel="Go back to homepage"
            >
              <Icon name="arrow-left" size={20} color="#fff" />
            </Pressable>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Disruptions Management</Text>
              <Text style={styles.headerSubtitle}>Choose your management tool</Text>
            </View>
          </View>
          
          {supervisorName && (
            <View style={styles.sessionInfo}>
              <Icon name="user-circle" size={16} color="#fff" />
              <Text style={styles.sessionText}>{supervisorName}</Text>
            </View>
          )}
        </View>

        {/* Breadcrumb Navigation */}
        <View style={styles.breadcrumb}>
          <Text style={styles.breadcrumbText}>Home</Text>
          <Icon name="chevron-right" size={12} color="#9ca3af" />
          <Text style={[styles.breadcrumbText, styles.breadcrumbActive]}>Disruptions</Text>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Disruptions Management</Text>
            <Text style={styles.welcomeDescription}>
              Select the disruption management tool you want to access.
            </Text>
          </View>

          {/* Cards Grid */}
          <View style={styles.cardGrid}>
            <Pressable
              style={[styles.card, styles.incidentsCard]}
              onPress={navigateToIncidents}
              accessibilityRole="button"
              accessibilityLabel="Open Incidents Management"
            >
              <View style={styles.cardIcon}>
                <Icon name="exclamation-triangle" size={28} color="#fff" />
              </View>
              <View style={styles.cardStats}>
                <Text style={styles.cardStatsNumber}>5</Text>
                <Text style={styles.cardStatsLabel}>ACTIVE</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Incidents</Text>
                <Text style={styles.cardSubtitle}>Create and track incidents</Text>
              </View>
            </Pressable>

            <Pressable
              style={[styles.card, styles.roadworksCard]}
              onPress={navigateToRoadworks}
              accessibilityRole="button"
              accessibilityLabel="Open Roadworks Management"
            >
              <View style={styles.cardIcon}>
                <Icon name="road" size={28} color="#fff" />
              </View>
              <View style={styles.cardStats}>
                <Text style={styles.cardStatsNumber}>12</Text>
                <Text style={styles.cardStatsLabel}>PLANNED</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Roadworks</Text>
                <Text style={styles.cardSubtitle}>Manage roadworks and diversions</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </DisruptionsErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e16',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0e16',
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
    backgroundColor: '#0a0e16',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: '#d1d5db',
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
  header: {
    backgroundColor: '#E31E24',
    paddingTop: Platform.OS === 'web' ? 20 : 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: '#B71C1C',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'column',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ffcdd2',
    marginTop: 2,
  },
  sessionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sessionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  breadcrumbText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  breadcrumbActive: {
    color: '#FF9800',
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    padding: 32,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeDescription: {
    fontSize: 16,
    color: '#d1d5db',
    maxWidth: 500,
    textAlign: 'center',
    lineHeight: 22,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 24,
    width: Platform.OS === 'web' ? '48%' : '100%',
    minWidth: 300,
    minHeight: 180,
    position: 'relative',
  },
  incidentsCard: {
    backgroundColor: 'rgba(220, 38, 38, 0.8)',
  },
  roadworksCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
  },
  cardIcon: {
    position: 'absolute',
    top: 24,
    left: 24,
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardStats: {
    position: 'absolute',
    top: 24,
    right: 24,
    alignItems: 'flex-end',
  },
  cardStatsNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 32,
  },
  cardStatsLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginTop: 2,
  },
  cardContent: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
});
