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
  const [password, setPassword] = useState('');
  const [selectedDuty, setSelectedDuty] = useState('');
  const [currentStep, setCurrentStep] = useState('supervisor'); // 'supervisor', 'password', 'duty'
  const { login, isLoading, error } = useSupervisorSession();

  // Predefined supervisors
  const supervisors = [
    { id: 'alex_woodcock', name: 'Alex Woodcock', role: 'Supervisor', requiresPassword: false },
    { id: 'andrew_cowley', name: 'Andrew Cowley', role: 'Supervisor', requiresPassword: false },
    { id: 'anthony_gair', name: 'Anthony Gair', role: 'Supervisor', requiresPassword: false },
    { id: 'claire_fiddler', name: 'Claire Fiddler', role: 'Supervisor', requiresPassword: false },
    { id: 'david_hall', name: 'David Hall', role: 'Supervisor', requiresPassword: false },
    { id: 'james_daglish', name: 'James Daglish', role: 'Supervisor', requiresPassword: false },
    { id: 'john_paterson', name: 'John Paterson', role: 'Supervisor', requiresPassword: false },
    { id: 'simon_glass', name: 'Simon Glass', role: 'Supervisor', requiresPassword: false },
    { id: 'barry_perryman', name: 'Barry Perryman', role: 'Service Delivery Controller - Line Manager', requiresPassword: true, password: 'Barry123', isAdmin: true },
  ];

  // Duty options for supervisors
  const dutyOptions = [
    { id: '100', name: 'Duty 100 (6am-3:30pm)' },
    { id: '200', name: 'Duty 200 (7:30am-5pm)' },
    { id: '400', name: 'Duty 400 (12:30pm-10pm)' },
    { id: '500', name: 'Duty 500 (2:45pm-12:15am)' },
    { id: 'xops', name: 'XOps' },
  ];

  const selectedSupervisor = supervisors.find(s => s.id === supervisorId);

  const handleSupervisorSelect = (supervisor) => {
    setSupervisorId(supervisor.id);
    if (supervisor.requiresPassword) {
      setCurrentStep('password');
    } else {
      setCurrentStep('duty');
    }
  };

  const handlePasswordSubmit = () => {
    // Check password for Barry if required
    if (selectedSupervisor.requiresPassword) {
      if (!password || password !== selectedSupervisor.password) {
        Alert.alert('Error', 'Incorrect password for Line Manager access.');
        return;
      }
    }

    setCurrentStep('duty');
  };

  const handleDutySelect = async (duty) => {
    setSelectedDuty(duty.id);
    
    // Create login data with duty
    const loginData = {
      supervisorId,
      password: selectedSupervisor.requiresPassword ? password : undefined,
      duty: duty,
      isAdmin: selectedSupervisor.isAdmin || false
    };

    const result = await login(loginData);
    
    if (result.success) {
      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
    setSupervisorId('');
    setPassword('');
    setSelectedDuty('');
    setCurrentStep('supervisor');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleBack = () => {
    if (currentStep === 'password') {
      setCurrentStep('supervisor');
      setPassword('');
    } else if (currentStep === 'duty') {
      if (selectedSupervisor.requiresPassword) {
        setCurrentStep('password');
      } else {
        setCurrentStep('supervisor');
      }
      setSelectedDuty('');
    }
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
            {currentStep === 'supervisor' && (
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
                          {supervisor.isAdmin && (
                            <Text style={[
                              styles.supervisorBadge,
                              supervisorId === supervisor.id && styles.supervisorBadgeSelected,
                              { color: '#F59E0B', fontWeight: '600' }
                            ]}>
                              ⭐ Admin Access
                            </Text>
                          )}
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

            {/* Step 2: Password Verification (Only for Barry) */}
            {currentStep === 'password' && selectedSupervisor && (
              <View style={styles.section}>
                <TouchableOpacity 
                  onPress={handleBack}
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

                <Text style={styles.sectionTitle}>Line Manager Authentication</Text>
                <Text style={styles.sectionDescription}>
                  Enter your password to access Line Manager functions
                </Text>

                {/* Password input for Barry */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed" size={20} color="#6B7280" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter Line Manager password"
                      placeholderTextColor="#9CA3AF"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      autoCorrect={false}
                    />
                  </View>
                  <Text style={styles.inputHelper}>
                    Required for Line Manager access and admin functions
                  </Text>
                </View>

                {/* Security Notice */}
                <View style={styles.securityNotice}>
                  <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                  <Text style={styles.securityNoticeText}>
                    All Line Manager actions are logged for accountability and audit purposes
                  </Text>
                </View>
              </View>
            )}

            {/* Step 3: Duty Selection */}
            {currentStep === 'duty' && (
              <View style={styles.section}>
                <TouchableOpacity 
                  onPress={handleBack}
                  style={styles.backButton}
                >
                  <Ionicons name="arrow-back" size={20} color="#3B82F6" />
                  <Text style={styles.backButtonText}>Back</Text>
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

                <Text style={styles.sectionTitle}>Select Your Duty</Text>
                <Text style={styles.sectionDescription}>
                  Choose which duty you are performing today
                </Text>

                <View style={styles.dutyList}>
                  {dutyOptions.map((duty) => (
                    <TouchableOpacity
                      key={duty.id}
                      style={[
                        styles.dutyCard,
                        selectedDuty === duty.id && styles.dutyCardSelected
                      ]}
                      onPress={() => handleDutySelect(duty)}
                      disabled={isLoading}
                    >
                      <View style={styles.dutyInfo}>
                        <Text style={[
                          styles.dutyName,
                          selectedDuty === duty.id && styles.dutyNameSelected
                        ]}>
                          {duty.name}
                        </Text>
                      </View>
                      {isLoading && selectedDuty === duty.id ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Ionicons 
                          name="chevron-forward" 
                          size={20} 
                          color={selectedDuty === duty.id ? '#FFFFFF' : '#9CA3AF'} 
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actions}>
              {currentStep === 'supervisor' ? (
                <TouchableOpacity
                  style={[styles.continueButton, !supervisorId && styles.continueButtonDisabled]}
                  onPress={() => {
                    if (selectedSupervisor) {
                      if (selectedSupervisor.requiresPassword) {
                        setCurrentStep('password');
                      } else {
                        setCurrentStep('duty');
                      }
                    }
                  }}
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
              ) : currentStep === 'password' ? (
                <TouchableOpacity
                  style={[
                    styles.continueButton, 
                    !password && styles.continueButtonDisabled
                  ]}
                  onPress={handlePasswordSubmit}
                  disabled={!password}
                >
                  <Text style={[
                    styles.continueButtonText, 
                    !password && styles.continueButtonTextDisabled
                  ]}>
                    Continue to Duty Selection
                  </Text>
                  <Ionicons 
                    name="arrow-forward" 
                    size={20} 
                    color={password ? "#FFFFFF" : "#9CA3AF"} 
                  />
                </TouchableOpacity>
              ) : null}
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
  dutyList: {
    gap: 12,
  },
  dutyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
  },
  dutyCardSelected: {
    borderColor: '#10B981',
    backgroundColor: '#10B981',
  },
  dutyInfo: {
    flex: 1,
  },
  dutyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  dutyNameSelected: {
    color: '#FFFFFF',
  },
});

export default SupervisorLogin;
