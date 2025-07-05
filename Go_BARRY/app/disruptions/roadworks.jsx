/*
 * Go Barry - Traffic Intelligence Platform
 * Roadworks Management Page
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React from 'react';
import { View, Text, StyleSheet, Platform, Pressable, ActivityIndicator, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useSupervisor } from '../../components/hooks/useSupervisorSession';
import Icon from 'react-native-vector-icons/FontAwesome5';
import RoadworksManagerV2 from '../../components/operations/roadworks-v2/RoadworksManagerV2';

// Error Boundary Component
class RoadworksErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Roadworks page error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Icon name="exclamation-triangle" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'An unexpected error occurred in the roadworks manager'}
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

// Main Roadworks Page Component
export default function RoadworksPage() {
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

  // Show loading if authentication is still being determined
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading Roadworks Manager...</Text>
      </View>
    );
  }

  const baseUrl = Platform.OS === 'web' 
    ? (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://go-barry.onrender.com')
    : 'https://go-barry.onrender.com';

  return (
    <RoadworksErrorBoundary>
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
              <Text style={styles.headerTitle}>Roadworks Management</Text>
              <Text style={styles.headerSubtitle}>Manage roadworks and diversions</Text>
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
          <Text style={[styles.breadcrumbText, styles.breadcrumbActive]}>Roadworks</Text>
        </View>

        {/* Main Content - RoadworksManager V2 */}
        <View style={styles.contentContainer}>
          <RoadworksManagerV2 baseUrl={baseUrl} />
        </View>
      </SafeAreaView>
    </RoadworksErrorBoundary>
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
  header: {
    backgroundColor: '#1a1a2e',
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerContent: {
    flexDirection: 'column',
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
  sessionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  breadcrumbText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  breadcrumbActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
});
