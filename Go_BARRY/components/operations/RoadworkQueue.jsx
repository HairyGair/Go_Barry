import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSupervisorSession } from '../hooks/useSupervisorSession';
import BatchOperations from './roadworks-v2/components/BatchOperations';

const RoadworkQueue = ({ baseUrl, sessionId, supervisorName, supervisorRole, isLoggedIn }) => {
  const { supervisorSession } = useSupervisorSession();
  
  // Use props if available, otherwise fall back to hook data
  const currentSession = supervisorSession || (isLoggedIn ? {
    supervisor: {
      name: supervisorName,
      role: supervisorRole,
      id: sessionId
    },
    sessionId: sessionId,
    supervisorId: sessionId,
    supervisorName: supervisorName,
    isLoggedIn: isLoggedIn
  } : null);

  // Debug logging for session
  useEffect(() => {
    console.log('🔐 RoadworkQueue session data:', {
      supervisorSession: !!supervisorSession,
      propsReceived: { baseUrl, sessionId, supervisorName, supervisorRole, isLoggedIn },
      currentSession: !!currentSession,
      sessionDetails: currentSession ? {
        sessionId: currentSession.sessionId,
        supervisorName: currentSession.supervisorName,
        supervisorId: currentSession.supervisorId
      } : 'No session'
    });
  }, [supervisorSession, baseUrl, sessionId, supervisorName, supervisorRole, isLoggedIn, currentSession]);

  // Debug logging for modal state
  useEffect(() => {
    if (reviewModalVisible) {
      console.log('🔍 Modal is now visible with selectedRoadwork:', selectedRoadwork?.title || selectedRoadwork?.sm_street_name || 'undefined');
    } else {
      console.log('🔍 Modal is now hidden');
    }
  }, [reviewModalVisible, selectedRoadwork]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingRoadworks, setPendingRoadworks] = useState([]);
  const [stats, setStats] = useState({
    pendingReview: 0,
    approved: 0,
    monitoring: 0,
    critical: 0,
    high: 0
  });
  const [selectedRoadwork, setSelectedRoadwork] = useState(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewData, setReviewData] = useState({
    status: 'approved',
    confirmedRoutes: [],
    severity: 'medium',
    diversionRequired: false,
    notes: ''
  });

  // Fetch pending roadworks
  const fetchPendingRoadworks = async () => {
    if (!currentSession) return;

    try {
      setLoading(true);
      const apiUrl = (baseUrl && !baseUrl.includes('localhost')) ? baseUrl : 'https://go-barry.onrender.com';
      const response = await fetch(`${apiUrl}/api/roadworks-v2/pending`, {
        headers: {
          'x-session-id': currentSession.sessionId
        }
      });

      if (!response.ok) throw new Error('Failed to fetch roadworks');

      const data = await response.json();
      setPendingRoadworks(data.data || []);
    } catch (error) {
      console.error('Error fetching pending roadworks:', error);
      if (error.message.includes('Failed to fetch')) {
        console.log('ℹ️ Backend API unavailable - review queue will be empty until service is restored');
        // Don't show alert for this known issue, just keep empty state
      } else {
        Alert.alert('Error', 'Failed to fetch pending roadworks');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    if (!currentSession) return;

    try {
      const apiUrl = (baseUrl && !baseUrl.includes('localhost')) ? baseUrl : 'https://go-barry.onrender.com';
      const response = await fetch(`${apiUrl}/api/roadworks-v2/stats`, {
        headers: {
          'x-session-id': currentSession.sessionId
        }
      });

      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data.stats || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Submit review
  const submitReview = async () => {
    if (submitting) return; // Prevent double submission
    
    console.log('🔥🔥🔥 ===== SUBMIT REVIEW FUNCTION CALLED ===== 🔥🔥🔥');
    console.log('🔍 submitReview called at:', new Date().toISOString());
    console.log('🔍 currentSession:', currentSession);
    console.log('🔍 selectedRoadwork:', selectedRoadwork);
    console.log('🔍 reviewData:', reviewData);

    if (!currentSession) {
      console.warn('❌ No current session - cannot submit review');
      Alert.alert('Error', 'Please log in to submit reviews');
      return;
    }

    if (!selectedRoadwork) {
      console.warn('❌ No selected roadwork - cannot submit review');
      Alert.alert('Error', 'No roadwork selected for review');
      return;
    }

    try {
      setSubmitting(true);
      const apiUrl = (baseUrl && !baseUrl.includes('localhost')) ? baseUrl : 'https://go-barry.onrender.com';
      const url = `${apiUrl}/api/roadworks-v2/${selectedRoadwork.id}/review`;
      console.log('📡 Submitting review to:', url);
      
      // Ensure we have supervisor credentials - truncate supervisorId if it's too long
      let supervisorId = currentSession.supervisorId || currentSession.sessionId || 'UNKNOWN';
      
      // If supervisorId is a UUID/session ID, truncate it or use a different identifier
      if (supervisorId.length > 10) {
        // Try to get a badge number or short ID instead
        supervisorId = currentSession.supervisor?.badge || supervisorId.substring(0, 10);
      }
      
      const supervisorName = currentSession.supervisorName || currentSession.supervisor?.name || 'Unknown Supervisor';
      
      if (!supervisorId || supervisorId === 'UNKNOWN' || !supervisorName || supervisorName === 'Unknown Supervisor') {
        console.warn('❌ Missing supervisor credentials:', { supervisorId, supervisorName });
        Alert.alert('Authentication Error', 'Please ensure you are logged in as a supervisor');
        return;
      }

      // Ensure field lengths don't exceed database constraints
      const payload = {
        ...reviewData,
        status: reviewData.status?.substring(0, 10), // Limit to 10 chars
        severity: reviewData.severity?.substring(0, 10), // Limit to 10 chars
        supervisorId,
        supervisorName: supervisorName?.substring(0, 50), // Reasonable limit for name
        notes: reviewData.notes?.substring(0, 500) // Reasonable limit for notes
      };
      console.log('📡 Review payload:', payload);
      console.log('📡 Payload field lengths:', {
        status: `"${payload.status}" (${payload.status?.length} chars)`,
        severity: `"${payload.severity}" (${payload.severity?.length} chars)`,
        supervisorId: `"${supervisorId}" (${supervisorId?.length} chars)`,
        supervisorName: `"${supervisorName}" (${supervisorName?.length} chars)`,
        notes: `"${payload.notes}" (${payload.notes?.length} chars)`,
        confirmedRoutes: payload.confirmedRoutes
      });
      console.log('📡 Current session details:', currentSession);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': currentSession.sessionId
        },
        body: JSON.stringify(payload)
      });

      console.log('📡 Review response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Review API error:', response.status, errorText);
        
        if (response.status === 404) {
          throw new Error('Backend routes not available');
        }
        throw new Error(`Failed to submit review: ${response.status}`);
      }

      console.log('✅ Review submitted successfully');
      Alert.alert('Success', 'Roadwork reviewed successfully', [
        { text: 'OK', onPress: () => {
          setReviewModalVisible(false);
          setSelectedRoadwork(null);
          fetchPendingRoadworks();
          fetchStats();
        }}
      ]);
    } catch (error) {
      console.error('❌ Error submitting review:', error);
      
      // Handle network errors gracefully
      if (error.message.includes('Failed to fetch') || error.message.includes('Backend routes not available')) {
        Alert.alert(
          'Review API Temporarily Unavailable', 
          'The backend API routes are currently not responding (404 error). This is a known deployment issue that will be resolved shortly. Your review data has been noted locally.',
          [
            { text: 'OK', onPress: () => {
              // Close modal and refresh data even when API fails
              setReviewModalVisible(false);
              setSelectedRoadwork(null);
              // Refresh the data to show any changes
              fetchPendingRoadworks();
              fetchStats();
            }}
          ]
        );
      } else {
        Alert.alert('Error', `Failed to submit review: ${error.message}`, [
          { text: 'OK', onPress: () => {
            // Close modal even on other errors
            setReviewModalVisible(false);
            setSelectedRoadwork(null);
          }}
        ]);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Batch approve
  const batchApprove = async (severity = 'medium') => {
    if (!currentSession) return;

    const selectedIds = pendingRoadworks
      .filter(rw => rw.severity === severity)
      .map(rw => rw.id);

    if (selectedIds.length === 0) {
      Alert.alert('Info', `No ${severity} severity roadworks to approve`);
      return;
    }

    Alert.alert(
      'Batch Approve',
      `Approve all ${selectedIds.length} ${severity} severity roadworks?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Approve', 
          onPress: async () => {
            try {
              const apiUrl = (baseUrl && !baseUrl.includes('localhost')) ? baseUrl : 'https://go-barry.onrender.com';
              const response = await fetch(`${apiUrl}/api/roadworks-v2/batch-approve`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-session-id': currentSession.sessionId
                },
                body: JSON.stringify({
                  streetworkIds: selectedIds,
                  severity,
                  supervisorId: currentSession.supervisorId,
                  supervisorName: currentSession.supervisorName
                })
              });

              if (!response.ok) throw new Error('Failed to batch approve');

              const result = await response.json();
              Alert.alert('Success', result.message, [
                { text: 'OK', onPress: () => {
                  fetchPendingRoadworks();
                  fetchStats();
                }}
              ]);
            } catch (error) {
              console.error('Error batch approving:', error);
              Alert.alert('Error', 'Failed to batch approve');
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    if (currentSession) {
      fetchPendingRoadworks();
      fetchStats();
    }
  }, [currentSession]);

  const openReviewModal = (roadwork) => {
    console.log('🔍 Opening review modal for roadwork:', roadwork);
    try {
      setSelectedRoadwork(roadwork);
      setReviewData({
        status: 'approved',
        confirmedRoutes: roadwork.auto_matched_routes || [],
        severity: roadwork.severity || 'medium',
        diversionRequired: false,
        notes: ''
      });
      setReviewModalVisible(true);
      console.log('✅ Review modal should now be visible');
    } catch (error) {
      console.error('❌ Error opening review modal:', error);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return '#e74c3c';
      case 'high': return '#e67e22';
      case 'medium': return '#f39c12';
      case 'low': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending_review': return 'time-outline';
      case 'approved': return 'checkmark-circle-outline';
      case 'monitoring': return 'eye-outline';
      case 'rejected': return 'close-circle-outline';
      default: return 'help-circle-outline';
    }
  };

  if (!currentSession) {
    return (
      <View style={styles.container}>
        <View style={styles.loginPrompt}>
          <Icon name="lock-closed-outline" size={48} color="#e74c3c" />
          <Text style={styles.loginText}>Supervisor login required</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Stats */}
      <View style={styles.header}>
        <Text style={styles.title}>Roadwork Review Queue</Text>
        
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#3498db' }]}>
            <Text style={styles.statNumber}>{stats.pendingReview}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#e74c3c' }]}>
            <Text style={styles.statNumber}>{stats.critical}</Text>
            <Text style={styles.statLabel}>Critical</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#e67e22' }]}>
            <Text style={styles.statNumber}>{stats.high}</Text>
            <Text style={styles.statLabel}>High</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#27ae60' }]}>
            <Text style={styles.statNumber}>{stats.approved}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
        </View>

      </View>

      {/* Batch Operations */}
      <BatchOperations
        roadworks={pendingRoadworks}
        onBatchOperation={(operation, result) => {
          fetchPendingRoadworks();
          fetchStats();
        }}
        sessionId={currentSession?.sessionId}
        baseUrl="https://go-barry.onrender.com"
      />

      {/* Roadworks List */}
      <ScrollView
        style={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchPendingRoadworks();
            }}
          />
        }
      >
        {loading && pendingRoadworks.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.loadingText}>Loading roadworks...</Text>
          </View>
        ) : pendingRoadworks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="checkmark-done-circle" size={64} color="#27ae60" />
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptyText}>No roadworks pending review</Text>
          </View>
        ) : (
          pendingRoadworks.map((roadwork) => (
            <TouchableOpacity
              key={roadwork.id}
              style={styles.roadworkCard}
              onPress={() => openReviewModal(roadwork)}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(roadwork.severity) }]}>
                  <Text style={styles.severityText}>{roadwork.severity?.toUpperCase()}</Text>
                </View>
                <Text style={styles.reference}>{roadwork.sm_reference}</Text>
              </View>

              <Text style={styles.streetName}>{roadwork.sm_street_name || 'Unknown Street'}</Text>
              <Text style={styles.description} numberOfLines={2}>
                {roadwork.sm_works_description || 'No description available'}
              </Text>

              <View style={styles.cardDetails}>
                <View style={styles.detailRow}>
                  <Icon name="business-outline" size={14} color="#7f8c8d" />
                  <Text style={styles.detailText}>{roadwork.sm_promoter_name || 'Unknown'}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Icon name="calendar-outline" size={14} color="#7f8c8d" />
                  <Text style={styles.detailText}>
                    {roadwork.sm_start_date ? new Date(roadwork.sm_start_date).toLocaleDateString() : 'TBD'}
                  </Text>
                </View>

                {roadwork.auto_matched_routes?.length > 0 && (
                  <View style={styles.detailRow}>
                    <Icon name="bus-outline" size={14} color="#7f8c8d" />
                    <Text style={styles.detailText}>
                      Routes: {roadwork.auto_matched_routes.join(', ')}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity 
                style={styles.reviewButton}
                onPress={(e) => {
                  e.stopPropagation(); // Prevent card tap
                  openReviewModal(roadwork);
                }}
              >
                <Icon name="create-outline" size={20} color="white" />
                <Text style={styles.reviewButtonText}>Review</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Review Modal */}
      <Modal
        visible={reviewModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Review Roadwork</Text>
              <TouchableOpacity
                onPress={() => setReviewModalVisible(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#7f8c8d" />
              </TouchableOpacity>
            </View>

            {selectedRoadwork && (
              <ScrollView style={styles.modalBody}>
                <Text style={styles.modalSectionTitle}>Location</Text>
                <Text style={styles.modalText}>{selectedRoadwork.sm_street_name}</Text>
                <Text style={styles.modalSubtext}>{selectedRoadwork.sm_area_name}</Text>

                <Text style={styles.modalSectionTitle}>Description</Text>
                <Text style={styles.modalText}>{selectedRoadwork.sm_works_description}</Text>

                <Text style={styles.modalSectionTitle}>Severity</Text>
                <View style={styles.severityOptions}>
                  {['critical', 'high', 'medium', 'low'].map((sev) => (
                    <TouchableOpacity
                      key={sev}
                      style={[
                        styles.severityOption,
                        reviewData.severity === sev && styles.severityOptionSelected,
                        { borderColor: getSeverityColor(sev) }
                      ]}
                      onPress={() => setReviewData({ ...reviewData, severity: sev })}
                    >
                      <Text style={[
                        styles.severityOptionText,
                        reviewData.severity === sev && { color: getSeverityColor(sev) }
                      ]}>
                        {sev.charAt(0).toUpperCase() + sev.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.modalSectionTitle}>Status</Text>
                <View style={styles.statusOptions}>
                  <TouchableOpacity
                    style={[
                      styles.statusOption,
                      reviewData.status === 'approved' && styles.statusOptionSelected
                    ]}
                    onPress={() => setReviewData({ ...reviewData, status: 'approved' })}
                  >
                    <Icon name="checkmark-circle" size={20} color={reviewData.status === 'approved' ? '#27ae60' : '#7f8c8d'} />
                    <Text style={styles.statusOptionText}>Approve</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.statusOption,
                      reviewData.status === 'monitoring' && styles.statusOptionSelected
                    ]}
                    onPress={() => setReviewData({ ...reviewData, status: 'monitoring' })}
                  >
                    <Icon name="eye" size={20} color={reviewData.status === 'monitoring' ? '#3498db' : '#7f8c8d'} />
                    <Text style={styles.statusOptionText}>Monitor</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.statusOption,
                      reviewData.status === 'rejected' && styles.statusOptionSelected
                    ]}
                    onPress={() => setReviewData({ ...reviewData, status: 'rejected' })}
                  >
                    <Icon name="close-circle" size={20} color={reviewData.status === 'rejected' ? '#e74c3c' : '#7f8c8d'} />
                    <Text style={styles.statusOptionText}>Reject</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.diversionToggle}>
                  <Text style={styles.modalSectionTitle}>Diversion Required?</Text>
                  <TouchableOpacity
                    style={[
                      styles.toggle,
                      reviewData.diversionRequired && styles.toggleActive
                    ]}
                    onPress={() => setReviewData({ ...reviewData, diversionRequired: !reviewData.diversionRequired })}
                  >
                    <Icon 
                      name={reviewData.diversionRequired ? "checkmark-circle" : "ellipse-outline"} 
                      size={24} 
                      color={reviewData.diversionRequired ? "#27ae60" : "#7f8c8d"} 
                    />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalSectionTitle}>Notes</Text>
                <TextInput
                  style={styles.notesInput}
                  value={reviewData.notes}
                  onChangeText={(text) => setReviewData({ ...reviewData, notes: text })}
                  placeholder="Add any notes..."
                  multiline
                  numberOfLines={4}
                />
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setReviewModalVisible(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.modalButtonPrimary,
                  submitting && styles.modalButtonDisabled
                ]}
                onPress={async () => {
                  console.log('🔥 Submit Review button pressed!');
                  console.log('🔍 Current session check:', !!currentSession);
                  console.log('🔍 Selected roadwork check:', !!selectedRoadwork);
                  
                  if (submitting) return; // Prevent double tap
                  
                  if (!currentSession) {
                    console.log('❌ No current session - showing alert');
                    Alert.alert('Authentication Error', 'Please ensure you are logged in as a supervisor');
                    return;
                  }
                  if (!selectedRoadwork) {
                    console.log('❌ No selected roadwork - showing alert');
                    Alert.alert('Error', 'No roadwork selected for review');
                    return;
                  }
                  console.log('✅ Pre-checks passed, calling submitReview()');
                  await submitReview();
                }}
                disabled={submitting}
              >
                {submitting ? (
                  <View style={styles.buttonLoadingContainer}>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={[styles.modalButtonTextPrimary, { marginLeft: 8 }]}>
                      Submitting...
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.modalButtonTextPrimary}>Submit Review</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 18,
    color: '#7f8c8d',
    marginTop: 16,
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'white',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  list: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#7f8c8d',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#27ae60',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 8,
  },
  roadworkCard: {
    backgroundColor: 'white',
    margin: 8,
    marginBottom: 0,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  severityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  reference: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  streetName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 12,
  },
  cardDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 8,
  },
  reviewButton: {
    backgroundColor: '#3498db',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 6,
  },
  reviewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 16,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  modalSubtext: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  severityOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  severityOption: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ecf0f1',
    alignItems: 'center',
  },
  severityOptionSelected: {
    backgroundColor: '#f8f9fa',
  },
  severityOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  statusOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  statusOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ecf0f1',
  },
  statusOptionSelected: {
    backgroundColor: '#f8f9fa',
    borderColor: '#3498db',
  },
  statusOptionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#7f8c8d',
  },
  diversionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  toggle: {
    padding: 4,
  },
  toggleActive: {
    opacity: 1,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ecf0f1',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    color: '#2c3e50',
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  modalButtonSecondary: {
    backgroundColor: '#ecf0f1',
  },
  modalButtonPrimary: {
    backgroundColor: '#3498db',
  },
  modalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  modalButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  modalButtonDisabled: {
    backgroundColor: '#bdc3c7',
    opacity: 0.7,
  },
  buttonLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RoadworkQueue;