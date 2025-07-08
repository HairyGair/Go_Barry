// Go_BARRY/components/operations/cards/OnTimeRequestNative.jsx
// Native React component for On Time Request management via SharePoint Graph API

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, TextInput, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useSupervisor } from '../../hooks/useSupervisorSession';

const OnTimeRequestNative = ({ onClose }) => {
  const { supervisor } = useSupervisor();
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUrl, setAuthUrl] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Form state for new requests
  const [newRequest, setNewRequest] = useState({
    driverName: '',
    badge: '',
    shift: 'Early Turn',
    route: '',
    scheduledFinish: '',
    requestedFinish: '',
    reason: ''
  });

  const API_BASE = Platform.OS === 'web' 
    ? (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://go-barry.onrender.com')
    : 'https://go-barry.onrender.com';

  useEffect(() => {
    checkAuthenticationAndLoad();
  }, [supervisor]);

  const checkAuthenticationAndLoad = async () => {
    if (!supervisor?.badge) {
      setError('Supervisor not authenticated');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔐 Checking SharePoint authentication for:', supervisor.badge);
      
      // Check authentication status
      const authResponse = await fetch(`${API_BASE}/api/sharepoint/auth-status/${supervisor.badge}`);
      const authData = await authResponse.json();

      console.log('🔐 Auth response:', authData);

      if (authData.success && authData.isAuthenticated) {
        setIsAuthenticated(true);
        await loadOnTimeRequests();
      } else {
        setIsAuthenticated(false);
        setAuthUrl(authData.loginUrl);
        setError('SharePoint authentication required');
      }
    } catch (error) {
      console.error('🔐 Authentication check failed:', error);
      setError('Failed to check authentication: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOnTimeRequests = async () => {
    try {
      console.log('📊 Loading On Time Request data...');
      setIsLoading(true);

      const response = await fetch(`${API_BASE}/api/sharepoint/documents/onTimeRequest/data/${supervisor.badge}`);
      const data = await response.json();

      console.log('📊 Data response:', data);

      if (data.success) {
        setRequests(data.requests || []);
        setLastUpdated(data.lastModified);
        setError(null);
      } else {
        throw new Error(data.error || 'Failed to load data');
      }
    } catch (error) {
      console.error('📊 Load data failed:', error);
      setError('Failed to load On Time Requests: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthenticate = () => {
    if (authUrl) {
      if (Platform.OS === 'web') {
        window.open(authUrl, '_blank');
      } else {
        // For mobile, would use Linking
        console.log('Open auth URL:', authUrl);
      }
    }
  };

  const handleAddRequest = async () => {
    try {
      console.log('📝 Submitting new On Time Request:', newRequest);
      
      const response = await fetch(`${API_BASE}/api/sharepoint/documents/onTimeRequest/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supervisorId: supervisor.badge,
          ...newRequest
        })
      });

      const result = await response.json();
      console.log('📝 Submit response:', result);

      if (result.success) {
        // Clear form
        setNewRequest({
          driverName: '',
          badge: '',
          shift: 'Early Turn',
          route: '',
          scheduledFinish: '',
          requestedFinish: '',
          reason: ''
        });
        setShowAddForm(false);
        
        // Reload data
        await loadOnTimeRequests();
        
        // Show success message
        if (Platform.OS === 'web') {
          Alert.alert('Success', 'On Time Request submitted successfully');
        }
      } else {
        throw new Error(result.error || 'Submission failed');
      }
    } catch (error) {
      console.error('📝 Submit failed:', error);
      Alert.alert('Error', 'Failed to submit request: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return '#10b981';
      case 'denied': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'check-circle';
      case 'denied': return 'close-circle';
      case 'pending': return 'clock';
      default: return 'help-circle';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🕐 On Time Request</Text>
          <Text style={styles.subtitle}>Loading...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loadingText}>Connecting to SharePoint...</Text>
        </View>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🕐 On Time Request</Text>
          <Text style={styles.subtitle}>Authentication Required</Text>
        </View>
        <View style={styles.authContainer}>
          <MaterialCommunityIcons name="shield-lock" size={64} color="#0ea5e9" />
          <Text style={styles.authTitle}>SharePoint Access Required</Text>
          <Text style={styles.authText}>
            You need to authenticate with Microsoft 365 to access and edit On Time Request documents.
          </Text>
          <Pressable style={styles.authButton} onPress={handleAuthenticate}>
            <MaterialCommunityIcons name="microsoft" size={20} color="#ffffff" />
            <Text style={styles.authButtonText}>Authenticate with Microsoft</Text>
          </Pressable>
          <Text style={styles.authNote}>
            This will open a new window for secure Microsoft authentication.
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🕐 On Time Request</Text>
          <Text style={styles.subtitle}>Error Loading Data</Text>
        </View>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Unable to Load Data</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={checkAuthenticationAndLoad}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <MaterialCommunityIcons name="clock-check" size={32} color="#ffffff" />
          <View style={styles.headerText}>
            <Text style={styles.title}>🕐 On Time Request</Text>
            <Text style={styles.subtitle}>
              {requests.length} requests • Updated: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'Never'}
            </Text>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          <Pressable
            style={styles.addButton}
            onPress={() => setShowAddForm(!showAddForm)}
          >
            <MaterialCommunityIcons name={showAddForm ? "close" : "plus"} size={20} color="#ffffff" />
          </Pressable>
          <Pressable
            style={styles.refreshButton}
            onPress={loadOnTimeRequests}
          >
            <MaterialCommunityIcons name="refresh" size={20} color="#ffffff" />
          </Pressable>
          <Pressable
            style={styles.closeButton}
            onPress={onClose}
          >
            <MaterialCommunityIcons name="close" size={24} color="#ffffff" />
          </Pressable>
        </View>
      </View>

      {/* Add Request Form */}
      {showAddForm && (
        <View style={styles.addForm}>
          <Text style={styles.formTitle}>Add New On Time Request</Text>
          
          <View style={styles.formRow}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Driver Name</Text>
              <TextInput
                style={styles.fieldInput}
                value={newRequest.driverName}
                onChangeText={(text) => setNewRequest({...newRequest, driverName: text})}
                placeholder="Enter driver name"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Badge Number</Text>
              <TextInput
                style={styles.fieldInput}
                value={newRequest.badge}
                onChangeText={(text) => setNewRequest({...newRequest, badge: text})}
                placeholder="e.g. DR001"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Route</Text>
              <TextInput
                style={styles.fieldInput}
                value={newRequest.route}
                onChangeText={(text) => setNewRequest({...newRequest, route: text})}
                placeholder="e.g. 21, Q3"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Shift</Text>
              <View style={styles.shiftButtons}>
                {['Early Turn', 'Late Turn', 'Middle Turn'].map((shift) => (
                  <Pressable
                    key={shift}
                    style={[
                      styles.shiftButton,
                      newRequest.shift === shift && styles.shiftButtonActive
                    ]}
                    onPress={() => setNewRequest({...newRequest, shift})}
                  >
                    <Text style={[
                      styles.shiftButtonText,
                      newRequest.shift === shift && styles.shiftButtonTextActive
                    ]}>
                      {shift}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Scheduled Finish</Text>
              <TextInput
                style={styles.fieldInput}
                value={newRequest.scheduledFinish}
                onChangeText={(text) => setNewRequest({...newRequest, scheduledFinish: text})}
                placeholder="e.g. 15:00"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Requested Finish</Text>
              <TextInput
                style={styles.fieldInput}
                value={newRequest.requestedFinish}
                onChangeText={(text) => setNewRequest({...newRequest, requestedFinish: text})}
                placeholder="e.g. 14:30"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Reason</Text>
            <TextInput
              style={[styles.fieldInput, styles.reasonInput]}
              value={newRequest.reason}
              onChangeText={(text) => setNewRequest({...newRequest, reason: text})}
              placeholder="Enter reason for early finish request"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formActions}>
            <Pressable
              style={styles.cancelButton}
              onPress={() => setShowAddForm(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={styles.submitButton}
              onPress={handleAddRequest}
            >
              <MaterialCommunityIcons name="check" size={16} color="#ffffff" />
              <Text style={styles.submitButtonText}>Submit Request</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
        {requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="clipboard-text" size={64} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No On Time Requests</Text>
            <Text style={styles.emptyText}>
              No requests found. Add a new request using the + button above.
            </Text>
          </View>
        ) : (
          requests.map((request, index) => (
            <View key={request.id || index} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <View style={styles.driverInfo}>
                  <Text style={styles.driverName}>{request.driverName || 'Unknown Driver'}</Text>
                  <Text style={styles.driverBadge}>Badge: {request.badge || 'N/A'}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                  <MaterialCommunityIcons 
                    name={getStatusIcon(request.status)} 
                    size={16} 
                    color="#ffffff" 
                  />
                  <Text style={styles.statusText}>{request.status || 'Pending'}</Text>
                </View>
              </View>

              <View style={styles.requestDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Route:</Text>
                  <Text style={styles.detailValue}>{request.route || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Shift:</Text>
                  <Text style={styles.detailValue}>{request.shift || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Scheduled Finish:</Text>
                  <Text style={styles.detailValue}>{request.scheduledFinish || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Requested Finish:</Text>
                  <Text style={[styles.detailValue, styles.requestedTime]}>
                    {request.requestedFinish || 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reason:</Text>
                  <Text style={styles.detailValue}>{request.reason || 'No reason provided'}</Text>
                </View>
                {request.submittedAt && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Submitted:</Text>
                    <Text style={styles.detailValue}>
                      {new Date(request.submittedAt).toLocaleString('en-GB')}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <MaterialCommunityIcons name="microsoft-sharepoint" size={16} color="#64748b" />
          <Text style={styles.footerText}>
            Live data from SharePoint • Real-time sync enabled
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 20,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 16,
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#bae6fd',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addForm: {
    backgroundColor: '#f8fafc',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  formField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  reasonInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  shiftButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  shiftButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  shiftButtonActive: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  shiftButtonText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  shiftButtonTextActive: {
    color: '#ffffff',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#0ea5e9',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  authTitle: {
    marginTop: 24,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
  },
  authText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  authButton: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  authNote: {
    marginTop: 16,
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ef4444',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 8,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#ef4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4b5563',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  requestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  driverBadge: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  requestDetails: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  requestedTime: {
    color: '#dc2626',
    fontWeight: 'bold',
  },
  footer: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
});

export default OnTimeRequestNative;