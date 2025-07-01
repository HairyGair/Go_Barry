import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const HealthCheck = () => {
  const [checks, setChecks] = useState({
    api: { status: 'checking', message: 'Checking API...' },
    convex: { status: 'checking', message: 'Checking Convex...' },
    auth: { status: 'checking', message: 'Checking Auth...' },
    env: { status: 'checking', message: 'Checking Environment...' },
  });

  useEffect(() => {
    performHealthChecks();
  }, []);

  const performHealthChecks = async () => {
    // Check API
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://go-barry.onrender.com';
      const response = await fetch(`${apiUrl}/api/health`);
      if (response.ok) {
        updateCheck('api', 'success', 'API Connected');
      } else {
        updateCheck('api', 'error', `API Error: ${response.status}`);
      }
    } catch (error) {
      updateCheck('api', 'error', 'API Unreachable');
    }

    // Check Convex
    if (process.env.EXPO_PUBLIC_CONVEX_URL) {
      updateCheck('convex', 'success', 'Convex Configured');
    } else {
      updateCheck('convex', 'error', 'Convex URL Missing');
    }

    // Check Auth
    const authRequired = process.env.EXPO_PUBLIC_OPERATIONS_AUTH_REQUIRED === 'true';
    updateCheck('auth', 'success', authRequired ? 'Auth Required' : 'Auth Optional');

    // Check Environment
    const env = process.env.NODE_ENV || 'development';
    updateCheck('env', 'success', `Environment: ${env}`);
  };

  const updateCheck = (key, status, message) => {
    setChecks(prev => ({
      ...prev,
      [key]: { status, message }
    }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <Ionicons name="checkmark-circle" size={20} color="#10b981" />;
      case 'error':
        return <Ionicons name="close-circle" size={20} color="#ef4444" />;
      default:
        return <Ionicons name="time" size={20} color="#6b7280" />;
    }
  };

  const allChecksPass = Object.values(checks).every(check => check.status === 'success');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Operations Centre Health</Text>
      
      {Object.entries(checks).map(([key, check]) => (
        <View key={key} style={styles.checkRow}>
          {getStatusIcon(check.status)}
          <Text style={styles.checkText}>{check.message}</Text>
        </View>
      ))}

      <View style={[styles.summary, allChecksPass ? styles.summarySuccess : styles.summaryWarning]}>
        <Text style={styles.summaryText}>
          {allChecksPass ? '✅ All systems operational' : '⚠️ Some checks failed'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1f2937',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  summary: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  summarySuccess: {
    backgroundColor: '#d1fae5',
  },
  summaryWarning: {
    backgroundColor: '#fee2e2',
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default HealthCheck;
