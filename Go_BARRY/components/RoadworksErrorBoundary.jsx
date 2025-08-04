import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

class RoadworksErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error: error
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error for debugging
    console.error('RoadworksErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);

    // Update state with error details
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Report to any error tracking service if available
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = async () => {
    const { maxRetries = 3 } = this.props;
    
    if (this.state.retryCount >= maxRetries) {
      return;
    }

    this.setState({ 
      isRetrying: true 
    });

    // Wait a moment before retrying
    await new Promise(resolve => setTimeout(resolve, 1000));

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: this.state.retryCount + 1,
      isRetrying: false
    });
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false
    });
  };

  getErrorMessage = () => {
    const { error } = this.state;
    
    // Provide user-friendly error messages for common roadworks errors
    if (error?.message?.includes('Convex')) {
      return 'Unable to connect to the roadworks data service. Please check your internet connection.';
    }
    
    if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
      return 'Network connection issue. Please check your internet connection and try again.';
    }
    
    if (error?.message?.includes('geocoding') || error?.message?.includes('location')) {
      return 'Location services are temporarily unavailable. Some roadworks may not display correctly.';
    }
    
    if (error?.message?.includes('permission') || error?.message?.includes('unauthorized')) {
      return 'You do not have permission to access this roadworks feature. Please contact your supervisor.';
    }
    
    // Default message for unknown errors
    return 'The roadworks manager encountered an unexpected error. Please try again.';
  };

  render() {
    const { hasError, isRetrying, retryCount } = this.state;
    const { maxRetries = 3, fallbackComponent, onClose } = this.props;

    if (hasError) {
      // Use custom fallback component if provided
      if (fallbackComponent) {
        return fallbackComponent(this.state.error, this.handleRetry, this.handleReset);
      }

      // Default error UI
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContent}>
            {/* Error Icon */}
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons 
                name="road-variant" 
                size={64} 
                color="#ef4444" 
                style={styles.errorIcon}
              />
              <MaterialCommunityIcons 
                name="alert-circle" 
                size={24} 
                color="#ef4444" 
                style={styles.alertIcon}
              />
            </View>

            {/* Error Title */}
            <Text style={styles.errorTitle}>
              Roadworks Manager Error
            </Text>

            {/* User-friendly error message */}
            <Text style={styles.errorMessage}>
              {this.getErrorMessage()}
            </Text>

            {/* Technical details for debugging (only in development) */}
            {__DEV__ && this.state.error && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Information:</Text>
                <Text style={styles.debugText}>
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo?.componentStack && (
                  <Text style={styles.debugText}>
                    Component Stack: {this.state.errorInfo.componentStack.slice(0, 200)}...
                  </Text>
                )}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              {retryCount < maxRetries && (
                <TouchableOpacity
                  style={[styles.button, styles.retryButton]}
                  onPress={this.handleRetry}
                  disabled={isRetrying}
                >
                  {isRetrying ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <MaterialCommunityIcons 
                        name="refresh" 
                        size={20} 
                        color="#ffffff" 
                        style={styles.buttonIcon}
                      />
                      <Text style={styles.buttonText}>
                        Try Again ({maxRetries - retryCount} left)
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.button, styles.resetButton]}
                onPress={this.handleReset}
              >
                <MaterialCommunityIcons 
                  name="restart" 
                  size={20} 
                  color="#4f46e5" 
                  style={styles.buttonIcon}
                />
                <Text style={[styles.buttonText, styles.resetButtonText]}>
                  Reset Component
                </Text>
              </TouchableOpacity>

              {onClose && (
                <TouchableOpacity
                  style={[styles.button, styles.closeButton]}
                  onPress={onClose}
                >
                  <MaterialCommunityIcons 
                    name="close" 
                    size={20} 
                    color="#6b7280" 
                    style={styles.buttonIcon}
                  />
                  <Text style={[styles.buttonText, styles.closeButtonText]}>
                    Close Roadworks
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Retry count warning */}
            {retryCount >= maxRetries && (
              <View style={styles.warningContainer}>
                <MaterialCommunityIcons 
                  name="information" 
                  size={16} 
                  color="#f59e0b" 
                />
                <Text style={styles.warningText}>
                  Maximum retry attempts reached. Please reset the component or contact support.
                </Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    maxWidth: Math.min(screenWidth - 48, 500),
    alignSelf: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  errorIcon: {
    opacity: 0.8,
  },
  alertIcon: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 2,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  debugContainer: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
    maxHeight: 200,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 16,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minHeight: 44,
  },
  retryButton: {
    backgroundColor: '#10b981',
  },
  resetButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#4f46e5',
  },
  closeButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  resetButtonText: {
    color: '#4f46e5',
  },
  closeButtonText: {
    color: '#6b7280',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 6,
    marginTop: 16,
    width: '100%',
  },
  warningText: {
    fontSize: 14,
    color: '#92400e',
    marginLeft: 8,
    flex: 1,
  },
});

export default RoadworksErrorBoundary;