/*
 * Go Barry - Traffic Intelligence Platform
 * RoadworksTab - Wrapper for RoadworksManager in Disruptions page
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import RoadworksManager from '../operations/RoadworksManager';

// Error Boundary for RoadworksTab
class RoadworksTabErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('RoadworksTab error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Unable to load Roadworks Manager. Please try refreshing the page.
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RoadworksTab() {
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
    <RoadworksTabErrorBoundary>
      <View style={styles.container}>
        <RoadworksManager baseUrl={getBaseUrl()} />
      </View>
    </RoadworksTabErrorBoundary>
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
