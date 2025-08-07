import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

class RoadworksErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      errorMessage: '',
      errorDetails: '',
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      errorMessage: error.message || 'An unexpected error occurred',
      errorDetails: error.stack || ''
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console for debugging
    console.error('RoadworksErrorBoundary caught an error:', error, errorInfo);
    
    // Check if it's the offlineCoordinateCache error
    if (error.message && error.message.includes('offlineCoordinateCache')) {
      console.log('Caught offlineCoordinateCache error - this feature is not yet implemented');
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      errorMessage: '',
      errorDetails: '',
      retryCount: this.state.retryCount + 1
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-octagon" size={72} color="#ef4444" />
          <Text style={styles.errorTitle}>Roadworks Manager Error</Text>
          <Text style={styles.errorMessage}>
            The roadworks manager encountered an unexpected error.
          </Text>
          <Text style={styles.errorSubtext}>
            Please try again.
          </Text>
          
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={this.handleReset}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="refresh" size={20} color="#fff" />
            <Text style={styles.retryText}>Try Again ({this.state.retryCount + 1} left)</Text>
          </TouchableOpacity>
          
          {this.props.onClose && (
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={this.props.onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeText}>Close Roadworks</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0f',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: '#93c5fd',
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 40,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 30,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  closeButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(147, 197, 253, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.3)',
  },
  closeText: {
    color: '#93c5fd',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RoadworksErrorBoundary;
