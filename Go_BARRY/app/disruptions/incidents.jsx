/*
 * Go Barry - Traffic Intelligence Platform
 * Incidents Management Page
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React from 'react';
import { View, Text, StyleSheet, Platform, Pressable, ActivityIndicator, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useSupervisor } from '../../components/hooks/useSupervisorSession';
import Icon from 'react-native-vector-icons/FontAwesome5';
import IncidentsManagerV2 from '../../components/operations/incidents-v2/IncidentsManagerV2';

// Error Boundary Component
class IncidentsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Incidents page error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Icon name="exclamation-triangle" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'An unexpected error occurred in the incidents manager'}
          </Text>
          <Pressable 
            style={styles.errorButton}
            onPress={() => router.push('/')}
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

// Main Incidents Page Component
export default function IncidentsPage() {
  const { isLoggedIn, supervisorName, isLoading } = useSupervisor();

  // Redirect if not logged in
  React.useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace('/');
    }
  }, [isLoggedIn, isLoading]);

  const handleBack = () => {
    router.push('/');
  };

  // Show loading if authentication is still being determined
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.loadingText}>Loading Incidents Manager...</Text>
      </View>
    );
  }

  // Force localhost for development - override production settings
  const baseUrl = 'http://localhost:3001';

  return (
    <IncidentsErrorBoundary>
      <SafeAreaView style={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable 
              style={styles.backButton}
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel="Go back to disruptions"
            >
              <Icon name="arrow-left" size={20} color="#fff" />
            </Pressable>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Incidents Management</Text>
              <Text style={styles.headerSubtitle}>Create and track network incidents</Text>
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
          <Text style={styles.breadcrumbText}>Disruptions</Text>
          <Icon name="chevron-right" size={12} color="#9ca3af" />
          <Text style={[styles.breadcrumbText, styles.breadcrumbActive]}>Incidents</Text>
        </View>

        {/* Main Content - IncidentsManagerV2 */}
        <View style={styles.contentContainer}>
          <IncidentsManagerV2 baseUrl={baseUrl} />
        </View>
      </SafeAreaView>
    </IncidentsErrorBoundary>
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
    backgroundColor: '#DC2626',
    paddingTop: Platform.OS === 'web' ? 20 : 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: '#B91C1C',
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
    color: '#fca5a5',
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
    color: '#DC2626',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
});
