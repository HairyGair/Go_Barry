// Go_BARRY/components/admin/SupervisorManager.jsx
// Supervisor management component for admin panel

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupervisorSession } from '../hooks/useSupervisorSession';

const API_BASE = 'https://go-barry.onrender.com';

const SupervisorManager = () => {
  const { supervisorSession } = useSupervisorSession();
  const [supervisors, setSupervisors] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [auditTrailData, setAuditTrailData] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [showActivityView, setShowActivityView] = useState(false);
  const [activityData, setActivityData] = useState(null);
  const [activityLoading, setActivityLoading] = useState(false);

  // Load supervisors
  useEffect(() => {
    loadSupervisors();
    const interval = setInterval(loadSupervisors, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSupervisors = async () => {
    try {
      const [supervisorsRes, sessionsRes] = await Promise.all([
        fetch(`${API_BASE}/api/supervisors`),
        fetch(`${API_BASE}/api/supervisor/active-sessions`)
      ]);

      if (supervisorsRes.ok) {
        const data = await supervisorsRes.json();
        setSupervisors(data.supervisors || []);
      }

      if (sessionsRes.ok) {
        const data = await sessionsRes.json();
        setActiveSessions(data.activeSessions || []);
      }
    } catch (error) {
      console.error('Error loading supervisors:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditTrail = async (supervisorId) => {
    setAuditLoading(true);
    try {
      // TODO: Implement audit trail endpoint in backend
      // Expected endpoint: GET /api/supervisor/audit-trail/:supervisorId
      // Should return: { actions: [{ action, timestamp, details, type }] }
      const response = await fetch(`${API_BASE}/api/supervisor/audit-trail/${supervisorId}`);
      if (response.ok) {
        const data = await response.json();
        setAuditTrailData(data.actions || []);
      } else {
        // For now, show mock data
        setAuditTrailData([
          { action: 'Logged In', timestamp: new Date().toISOString(), details: 'Successfully authenticated' },
          { action: 'Dismissed Alert', timestamp: new Date(Date.now() - 3600000).toISOString(), details: 'Alert ID: A1234 - Traffic on A1' },
          { action: 'Created Incident', timestamp: new Date(Date.now() - 7200000).toISOString(), details: 'Route 21 - Major delay' },
        ]);
      }
    } catch (error) {
      console.error('Error loading audit trail:', error);
      Alert.alert('Note', 'Audit trail endpoint not yet implemented');
    } finally {
      setAuditLoading(false);
    }
  };

  const loadActivityData = async (supervisorId) => {
    setActivityLoading(true);
    try {
      // TODO: Implement activity endpoint in backend
      // Expected endpoint: GET /api/supervisor/activity/:supervisorId
      // Should return: { totalLogins, alertsDismissed, incidentsCreated, avgSessionTime, timeline }
      const response = await fetch(`${API_BASE}/api/supervisor/activity/${supervisorId}`);
      if (response.ok) {
        const data = await response.json();
        setActivityData(data);
      } else {
        // For now, show mock data
        setActivityData({
          totalLogins: 3,
          alertsDismissed: 12,
          incidentsCreated: 2,
          avgSessionTime: '45m',
          timeline: [
            { timestamp: new Date().toISOString(), action: 'Logged In', details: 'Via supervisor portal' },
            { timestamp: new Date(Date.now() - 1800000).toISOString(), action: 'Viewed Dashboard', details: 'Checked active alerts' },
            { timestamp: new Date(Date.now() - 3600000).toISOString(), action: 'Dismissed Alert', details: 'A1 congestion cleared' },
          ]
        });
      }
    } catch (error) {
      console.error('Error loading activity data:', error);
      Alert.alert('Note', 'Activity tracking endpoint not yet implemented');
    } finally {
      setActivityLoading(false);
    }
  };

  const forceLogout = async (sessionId) => {
    Alert.alert(
      'Force Logout',
      'Are you sure you want to force logout this supervisor?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Force Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE}/api/supervisor/force-logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId })
              });

              if (response.ok) {
                Alert.alert('Success', 'Supervisor logged out successfully');
                loadSupervisors();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to logout supervisor');
            }
          }
        }
      ]
    );
  };

  const resetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in both password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setResetLoading(true);

    try {
      const sessionId = supervisorSession?.sessionId;
      
      if (!sessionId) {
        Alert.alert('Error', 'Admin session not found. Please log in again.');
        setResetLoading(false);
        return;
      }
      
      const response = await fetch(`${API_BASE}/api/supervisor/admin/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          supervisorId: selectedSupervisor.id,
          newPassword
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert(
          'Success', 
          `Password reset successfully for ${selectedSupervisor.name}. They will be logged out and need to use the new password.`
        );
        setShowResetPassword(false);
        setNewPassword('');
        setConfirmPassword('');
        setSelectedSupervisor(null);
        loadSupervisors();
      } else {
        Alert.alert('Error', data.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      Alert.alert('Error', 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Sessions ({activeSessions.length})</Text>
        <Text style={styles.sectionDescription}>Currently logged in supervisors</Text>
      </View>
      
      <View style={styles.sessionsGrid}>
        {activeSessions.map(session => (
          <View key={session.sessionId} style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
              <View>
                <Text style={styles.sessionName}>{session.supervisorName}</Text>
                <Text style={styles.sessionBadge}>Badge: {session.badge}</Text>
                <Text style={styles.sessionDuty}>Duty: {session.duty || 'Unknown'}</Text>
              </View>
              <View style={styles.sessionStatus}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.sessionStatusText}>Active</Text>
              </View>
            </View>
            
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionInfoText}>
                Login: {new Date(session.loginTime).toLocaleTimeString()}
              </Text>
              <Text style={styles.sessionInfoText}>
                Last Activity: {new Date(session.lastActivity).toLocaleTimeString()}
              </Text>
              <Text style={styles.sessionInfoText}>
                Duration: {Math.floor((Date.now() - new Date(session.loginTime).getTime()) / 60000)} minutes
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.forceLogoutButton}
              onPress={() => forceLogout(session.sessionId)}
            >
              <Ionicons name="log-out" size={16} color="#EF4444" />
              <Text style={styles.forceLogoutText}>Force Logout</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>All Supervisors ({supervisors.length})</Text>
        <Text style={styles.sectionDescription}>Complete list of registered supervisors</Text>
      </View>
      
      <View style={styles.supervisorsList}>
        {supervisors.map(supervisor => {
          const isOnline = activeSessions.some(s => s.supervisorId === supervisor.id);
          
          return (
            <View key={supervisor.id} style={styles.supervisorItem}>
              <View style={styles.supervisorInfo}>
                <View style={[styles.statusIndicator, { 
                  backgroundColor: isOnline ? '#10B981' : '#E5E7EB' 
                }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.supervisorName}>{supervisor.name}</Text>
                  <Text style={styles.supervisorDetails}>
                    {supervisor.role} • Badge: {supervisor.badge}
                  </Text>
                  <View style={styles.supervisorMeta}>
                    {supervisor.isAdmin && (
                      <View style={styles.adminBadgeContainer}>
                        <Ionicons name="shield-checkmark" size={12} color="#F59E0B" />
                        <Text style={styles.adminBadge}>ADMIN</Text>
                      </View>
                    )}
                    {isOnline && (
                      <View style={styles.onlineBadgeContainer}>
                        <Ionicons name="radio-button-on" size={12} color="#10B981" />
                        <Text style={styles.onlineBadge}>ONLINE</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
              
              <View style={styles.supervisorActions}>
                <TouchableOpacity 
                  style={styles.activityButton}
                  onPress={() => {
                    setSelectedSupervisor(supervisor);
                    setShowActivityView(true);
                    loadActivityData(supervisor.id);
                  }}
                >
                  <Ionicons name="bar-chart" size={18} color="#10B981" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.auditButton}
                  onPress={() => {
                    setSelectedSupervisor(supervisor);
                    setShowAuditTrail(true);
                    loadAuditTrail(supervisor.id);
                  }}
                >
                  <Ionicons name="document-text" size={18} color="#6366F1" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.resetPasswordButton}
                  onPress={() => {
                    setSelectedSupervisor(supervisor);
                    setShowResetPassword(true);
                  }}
                >
                  <Ionicons name="key" size={18} color="#F59E0B" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.editButton}>
                  <Ionicons name="create" size={18} color="#3B82F6" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setShowAddForm(true)}
      >
        <Ionicons name="add-circle" size={20} color="#FFFFFF" />
        <Text style={styles.addButtonText}>Add New Supervisor</Text>
      </TouchableOpacity>

      {/* Audit Trail Modal */}
      {showAuditTrail && selectedSupervisor && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 600 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Audit Trail - {selectedSupervisor.name}</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAuditTrail(false);
                  setAuditTrailData([]);
                  setSelectedSupervisor(null);
                }}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.auditTrailContainer}>
              {auditLoading ? (
                <ActivityIndicator size="large" color="#3B82F6" />
              ) : auditTrailData.length === 0 ? (
                <Text style={styles.noDataText}>No audit trail data available</Text>
              ) : (
                auditTrailData.map((action, index) => (
                  <View key={index} style={styles.auditItem}>
                    <View style={styles.auditHeader}>
                      <Text style={styles.auditAction}>{action.action}</Text>
                      <Text style={styles.auditTime}>
                        {new Date(action.timestamp).toLocaleString()}
                      </Text>
                    </View>
                    {action.details && (
                      <Text style={styles.auditDetails}>{action.details}</Text>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Activity View Modal */}
      {showActivityView && selectedSupervisor && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 700 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Daily Activity - {selectedSupervisor.name}</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowActivityView(false);
                  setActivityData(null);
                  setSelectedSupervisor(null);
                }}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.activityContainer}>
              {activityLoading ? (
                <ActivityIndicator size="large" color="#3B82F6" />
              ) : !activityData ? (
                <Text style={styles.noDataText}>No activity data available</Text>
              ) : (
                <>
                  <View style={styles.activityStats}>
                    <View style={styles.statCard}>
                      <Text style={styles.statValue}>{activityData.totalLogins || 0}</Text>
                      <Text style={styles.statLabel}>Total Logins</Text>
                    </View>
                    <View style={styles.statCard}>
                      <Text style={styles.statValue}>{activityData.alertsDismissed || 0}</Text>
                      <Text style={styles.statLabel}>Alerts Dismissed</Text>
                    </View>
                    <View style={styles.statCard}>
                      <Text style={styles.statValue}>{activityData.incidentsCreated || 0}</Text>
                      <Text style={styles.statLabel}>Incidents Created</Text>
                    </View>
                    <View style={styles.statCard}>
                      <Text style={styles.statValue}>
                        {activityData.avgSessionTime || '0m'}
                      </Text>
                      <Text style={styles.statLabel}>Avg Session Time</Text>
                    </View>
                  </View>

                  <Text style={styles.sectionSubtitle}>Today's Timeline</Text>
                  <View style={styles.timeline}>
                    {activityData.timeline?.map((event, index) => (
                      <View key={index} style={styles.timelineItem}>
                        <View style={styles.timelineDot} />
                        <View style={styles.timelineContent}>
                          <Text style={styles.timelineTime}>
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </Text>
                          <Text style={styles.timelineAction}>{event.action}</Text>
                          {event.details && (
                            <Text style={styles.timelineDetails}>{event.details}</Text>
                          )}
                        </View>
                      </View>
                    )) || (
                      <Text style={styles.noDataText}>No timeline data for today</Text>
                    )}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Password Reset Modal */}
      {showResetPassword && selectedSupervisor && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reset Password</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowResetPassword(false);
                  setNewPassword('');
                  setConfirmPassword('');
                  setSelectedSupervisor(null);
                }}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Resetting password for: {selectedSupervisor.name} ({selectedSupervisor.badge})
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.warningText}>
              ⚠️ The supervisor will be immediately logged out and must use the new password to log in again.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowResetPassword(false);
                  setNewPassword('');
                  setConfirmPassword('');
                  setSelectedSupervisor(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.resetButton]}
                onPress={resetPassword}
                disabled={resetLoading}
              >
                {resetLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="key" size={16} color="#FFFFFF" />
                    <Text style={styles.resetButtonText}>Reset Password</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  sessionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  sessionCard: {
    flex: 1,
    minWidth: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sessionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  sessionBadge: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  sessionDuty: {
    fontSize: 12,
    color: '#6B7280',
  },
  sessionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sessionStatusText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  sessionInfo: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    marginBottom: 12,
  },
  sessionInfoText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  forceLogoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    paddingVertical: 8,
    borderRadius: 6,
  },
  forceLogoutText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
  supervisorsList: {
    gap: 8,
    marginBottom: 24,
  },
  supervisorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  supervisorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  supervisorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  supervisorDetails: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  supervisorMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  adminBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  adminBadge: {
    fontSize: 10,
    color: '#F59E0B',
    fontWeight: '700',
  },
  onlineBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  onlineBadge: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '700',
  },
  supervisorActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
  },
  resetPasswordButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#FEF8F1',
  },
  activityButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#D1FAE5',
  },
  auditButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#E0E7FF',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
  },
  warningText: {
    fontSize: 12,
    color: '#F59E0B',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  resetButton: {
    backgroundColor: '#F59E0B',
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  auditTrailContainer: {
    maxHeight: 400,
    marginVertical: 10,
  },
  auditItem: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  auditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  auditAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  auditTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  auditDetails: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 4,
  },
  noDataText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    paddingVertical: 20,
  },
  activityContainer: {
    maxHeight: 500,
  },
  activityStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    marginTop: 8,
  },
  timeline: {
    borderLeftWidth: 2,
    borderLeftColor: '#E5E7EB',
    marginLeft: 12,
    paddingLeft: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
    position: 'absolute',
    left: -26,
    top: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTime: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  timelineAction: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  timelineDetails: {
    fontSize: 12,
    color: '#4B5563',
  },
});

export default SupervisorManager;
