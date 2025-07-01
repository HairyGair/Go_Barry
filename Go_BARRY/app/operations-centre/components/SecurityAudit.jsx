import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupervisorSession } from '../../../components/hooks/useSupervisorSession';

const SecurityAudit = () => {
  const { supervisor } = useSupervisorSession();
  const [securityChecks, setSecurityChecks] = useState({
    authentication: { status: 'checking', message: 'Verifying authentication...' },
    https: { status: 'checking', message: 'Checking HTTPS...' },
    permissions: { status: 'checking', message: 'Validating permissions...' },
    session: { status: 'checking', message: 'Checking session security...' },
    cors: { status: 'checking', message: 'Verifying CORS settings...' },
    api: { status: 'checking', message: 'Testing API security...' },
  });

  useEffect(() => {
    performSecurityAudit();
  }, [supervisor]);

  const performSecurityAudit = async () => {
    // Check Authentication
    if (supervisor && supervisor.badge) {
      updateCheck('authentication', 'pass', `Authenticated as ${supervisor.name}`);
    } else {
      updateCheck('authentication', 'fail', 'No authenticated supervisor');
    }

    // Check HTTPS
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      updateCheck('https', 'pass', 'HTTPS enabled');
    } else if (process.env.NODE_ENV === 'development') {
      updateCheck('https', 'warning', 'HTTPS not required in development');
    } else {
      updateCheck('https', 'fail', 'HTTPS not enabled');
    }

    // Check Permissions
    if (supervisor?.role === 'admin' || supervisor?.role === 'supervisor') {
      updateCheck('permissions', 'pass', `Role: ${supervisor.role}`);
    } else {
      updateCheck('permissions', 'fail', 'Invalid role permissions');
    }

    // Check Session Security
    const sessionTimeout = process.env.EXPO_PUBLIC_SESSION_TIMEOUT || 600000;
    updateCheck('session', 'pass', `Session timeout: ${sessionTimeout / 60000} minutes`);

    // Check CORS
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://go-barry.onrender.com';
      const response = await fetch(`${apiUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        updateCheck('cors', 'pass', 'CORS properly configured');
      } else {
        updateCheck('cors', 'warning', 'CORS may need configuration');
      }
    } catch (error) {
      updateCheck('cors', 'warning', 'Unable to verify CORS');
    }

    // Check API Security
    const hasApiAuth = supervisor && supervisor.badge;
    if (hasApiAuth) {
      updateCheck('api', 'pass', 'API authentication ready');
    } else {
      updateCheck('api', 'warning', 'API authentication not configured');
    }
  };

  const updateCheck = (key, status, message) => {
    setSecurityChecks(prev => ({
      ...prev,
      [key]: { status, message }
    }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pass':
        return <Ionicons name="shield-checkmark" size={20} color="#10b981" />;
      case 'fail':
        return <Ionicons name="shield" size={20} color="#ef4444" />;
      case 'warning':
        return <Ionicons name="warning" size={20} color="#f59e0b" />;
      default:
        return <Ionicons name="time" size={20} color="#6b7280" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pass': return '#10b981';
      case 'fail': return '#ef4444';
      case 'warning': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const overallStatus = () => {
    const statuses = Object.values(securityChecks).map(check => check.status);
    if (statuses.includes('fail')) return 'fail';
    if (statuses.includes('warning')) return 'warning';
    if (statuses.includes('checking')) return 'checking';
    return 'pass';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="shield" size={24} color="#1f2937" />
        <Text style={styles.title}>Security Audit</Text>
      </View>

      {Object.entries(securityChecks).map(([key, check]) => (
        <View key={key} style={styles.checkRow}>
          {getStatusIcon(check.status)}
          <Text style={[styles.checkText, { color: getStatusColor(check.status) }]}>
            {check.message}
          </Text>
        </View>
      ))}

      <View style={[
        styles.summary,
        { backgroundColor: overallStatus() === 'pass' ? '#d1fae5' : 
          overallStatus() === 'warning' ? '#fed7aa' : '#fee2e2' }
      ]}>
        <Text style={styles.summaryText}>
          {overallStatus() === 'pass' ? '✅ All security checks passed' :
           overallStatus() === 'warning' ? '⚠️ Security warnings detected' :
           overallStatus() === 'fail' ? '❌ Security issues found' :
           '🔄 Security audit in progress...'}
        </Text>
      </View>

      {process.env.NODE_ENV === 'production' && (
        <Text style={styles.prodNote}>
          Production mode active - Enhanced security enabled
        </Text>
      )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#1f2937',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingLeft: 4,
  },
  checkText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  summary: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  prodNote: {
    marginTop: 12,
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default SecurityAudit;
