

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      const message = this.props.message || 'Something went wrong.';
      return (
        <View style={styles.container}>
          <Text style={styles.message}>{message}</Text>
          {this.state.error && (
            <Text style={styles.details}>{this.state.error.toString()}</Text>
          )}
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  message: {
    fontWeight: '600',
    marginBottom: 8,
  },
  details: {
    color: '#dc2626',
  },
});

export default ErrorBoundary;