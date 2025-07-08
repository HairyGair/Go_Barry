/*
 * Go Barry - Traffic Intelligence Platform
 * IncidentTab - Wrapper for IncidentManager in Disruptions page
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import IncidentManager from '../operations/IncidentManagerLegacy';

// Error Boundary for IncidentTab
class IncidentTabErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('IncidentTab error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Unable to load Incident Manager. Please try refreshing the page.
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function IncidentTab() {
  // Determine base URL based on environment
  const getBaseUrl = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        return 'http://localhost:3001';
      }
    }
    return 'https://go-barry.onrender.com';
  };

  return (
    <IncidentTabErrorBoundary>
      <View style={styles.container}>
        <IncidentManager baseUrl={getBaseUrl()} />
      </View>
    </IncidentTabErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e16',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#0a0e16',
  },
  errorText: {
    fontSize: 16,
    color: '#d1d5db',
    textAlign: 'center',
  },
});
