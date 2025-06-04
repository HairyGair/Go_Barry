// Go_BARRY/components/SupervisorLogin.jsx
// Enhanced supervisor login component with professional UI

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupervisorSession } from './hooks/useSupervisorSession';

const SupervisorLogin = ({ visible, onClose }) => {
  const [supervisorId, setSupervisorId] = useState('');
  const [badge, setBadge] = useState('');
  const [showBadgeInput, setShowBadgeInput] = useState(false);
  const { login, isLoading, error } = useSupervisorSession();

  // Predefined supervisors (would normally come from API)
  const supervisors = [
    { id: 'supervisor001', name: 'John Smith', badge: 'JS001', role: 'Senior Supervisor' },
    { id: 'supervisor002', name: 'Sarah Johnson', badge: 'SJ002', role: 'Traffic Controller' },
  ];

  const selectedSupervisor = supervisors.find(s => s.id === supervisorId);

  const handleSupervisorSelect = (supervisor) => {
    setSupervisorId(supervisor.id);
    setShowBadgeInput(true);
  };

  const handleLogin = async () => {
    if (!supervisorId || !badge.trim()) {
      Alert.alert('Error', 'Please select a supervisor and enter your badge number.');
      return;
    }

    const result = await login(supervisorId, badge.trim());
    
    if (result.success) {
      setSupervisorId('');
      setBadge('');
      setShowBadgeInput(false);
      onClose();
    }
  };

  const handleClose = () => {
    setSupervisorId('');
    setBadge('');
    setShowBadgeInput(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="shield-checkmark" size={32} color="#3B82F6" />
                </View>
                <Text style={styles.title}>Supervisor Access</Text>
                <Text style={styles.subtitle}>
                  Log in to manage alerts and access supervisor functions
                </Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Error Display */}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Step 1: Supervisor Selection */}
            {!showBadgeInput && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Select Your Profile</Text>
                <Text style={styles.sectionDescription}>
                  Choose your supervisor profile from the list below
                </Text>
                
                <View style={styles.supervisorList}>
                  {supervisors.map((supervisor) => (
                    <TouchableOpacity
                      key={supervisor.id}
                      style={[
                        styles.supervisorCard,
                        supervisorId === supervisor.id && styles.supervisorCardSelected
                      ]}
                      onPress={() => handleSupervisorSelect(supervisor)}
                    >
                      <View style={styles.supervisorInfo}>
                        <View style={styles.supervisorAvatar}>
                          <Ionicons 
                            name="person" 
                            size={24} 
                            color={supervisorId === supervisor.id ? '#FFFFFF' : '#3B82F6'} 
                          />
                        </View>
                        <View style={styles.supervisorDetails}>
                          <Text style={[
                            styles.supervisorName,
                            supervisorId === supervisor.id && styles.supervisorNameSelected
                          ]}>
                            {supervisor.name}
                          </Text>
                          <Text style={[
                            styles.supervisorRole,
                            supervisorId === supervisor.id && styles.supervisorRoleSelected
                          ]}>
                            {supervisor.role}
                          </Text>
                          <Text style={[
                            styles.supervisorBadge,
                            supervisorId === supervisor.id && styles.supervisorBadgeSelected
                          ]}>
                            Badge: {supervisor.badge}
                          </Text>
                        </View>
                      </View>
                      {supervisorId === supervisor.id && (
                        <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Step 2: Badge Verification */}
            {showBadgeInput && selectedSupervisor && (
              <View style={styles.section}>
                <TouchableOpacity 
                  onPress={() => setShowBadgeInput(false)}
                  style={styles.backButton}
                >
                  <Ionicons name="arrow-back" size={20} color="#3B82F6" />
                  <Text style={styles.backButtonText}>Back to selection</Text>
                </TouchableOpacity>

                <View style={styles.selectedSupervisorCard}>
                  <View style={styles.selectedSupervisorInfo}>
                    <View style={styles.selectedSupervisorAvatar}>
                      <Ionicons name="person" size={24} color="#FFFFFF" />
                    </View>
                    <View>
                      <Text style={styles.selectedSupervisorName}>
                        {selectedSupervisor.name}
                      </Text>
                      <Text style={styles.selectedSupervisorRole}>
                        {selectedSupervisor.role}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.sectionTitle}>Verify Your Identity</Text>
                <Text style={styles.sectionDescription}>
                  Enter your badge number to complete authentication
                </Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Badge Number</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="card" size={20} color="#6B7280" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder={`Expected: ${selectedSupervisor.badge}`}
                      placeholderTextColor="#9CA3AF"
                      value={badge}
                      onChangeText={setBadge}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      maxLength={10}
                    />
                  </View>
                  <Text style={styles.inputHelper}>
                    Enter the badge number shown on your supervisor ID card
                  </Text>
                </View>

                {/* Security Notice */}
                <View style={styles.securityNotice}>
                  <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                  <Text style={styles.securityNoticeText}>
                    All supervisor actions are logged for accountability and audit purposes
                  </Text>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actions}>
              {!showBadgeInput ? (
                <TouchableOpacity
                  style={[styles.continueButton, !supervisorId && styles.continueButtonDisabled]}
                  onPress={() => setShowBadgeInput(true)}
                  disabled={!supervisorId}
                >
                  <Text style={[styles.continueButtonText, !supervisorId && styles.continueButtonTextDisabled]}>
                    Continue
                  </Text>
                  <Ionicons 
                    name="arrow-forward" 
                    size={20} 
                    color={supervisorId ? "#FFFFFF" : "#9CA3AF"} 
                  />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.loginButton, (!badge.trim() || isLoading) && styles.loginButtonDisabled]}
                  onPress={handleLogin}
                  disabled={!badge.trim() || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="log-in" size={20} color="#FFFFFF" />
                      <Text style={styles.loginButtonText}>Sign In</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Help Section */}
            <View style={styles.helpSection}>
              <Text style={styles.helpTitle}>Need Help?</Text>
              <Text style={styles.helpText}>
                Contact your shift manager or IT support if you're having trouble accessing your account.
              </Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '50%',
  },
  modalContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    paddingBottom: 16,
  },
  headerContent: {
    flex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    marginLeft: 8,
    color: '#DC2626',
    fontSize: 14,
    flex: 1,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  supervisorList: {
    gap: 12,
  },
  supervisorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
  },
  supervisorCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#3B82F6',
  },
  supervisorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  supervisorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  supervisorDetails: {
    flex: 1,
  },
  supervisorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  supervisorNameSelected: {
    color: '#FFFFFF',
  },
  supervisorRole: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  supervisorRoleSelected: {
    color: '#DBEAFE',
  },
  supervisorBadge: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },
  supervisorBadgeSelected: {
    color: '#DBEAFE',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backButtonText: {
    marginLeft: 4,
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedSupervisorCard: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginBottom: 20,
  },
  selectedSupervisorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedSupervisorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectedSupervisorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 2,
  },
  selectedSupervisorRole: {
    fontSize: 14,
    color: '#3730A3',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  inputIcon: {
    marginLeft: 12,
  },
  textInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  inputHelper: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  securityNoticeText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#15803D',
    flex: 1,
    lineHeight: 16,
  },
  actions: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  continueButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  continueButtonTextDisabled: {
    color: '#9CA3AF',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  helpSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  helpText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
});

export default SupervisorLogin;
