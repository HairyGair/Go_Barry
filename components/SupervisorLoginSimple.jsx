// Go_BARRY/components/SupervisorLoginSimple.jsx
// Simplified supervisor login using backend API

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupervisorSession } from './hooks/useSupervisorSessionSimple';
import { DUTY_OPTIONS } from './hooks/useSupervisorSession';

const SupervisorLoginSimple = ({ visible, onClose, onLoginSuccess }) => {
  const { 
    login, 
    isLoading, 
    error, 
    getSupervisors,
    clearError
  } = useSupervisorSession();
  
  const [badge, setBadge] = useState('');
  const [password, setPassword] = useState('Barry123'); // Default password
  const [showPassword, setShowPassword] = useState(false);
  const [availableSupervisors, setAvailableSupervisors] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [selectedDuty, setSelectedDuty] = useState(null);

  // Load available supervisors when modal opens
  useEffect(() => {
    if (visible) {
      loadSupervisors();
      clearError();
      // Auto-select duty based on current time
      const hour = new Date().getHours();
      let suggestedDuty = null;
      if (hour >= 6 && hour < 12) suggestedDuty = DUTY_OPTIONS.find(d => d.id === '100');
      else if (hour >= 7 && hour < 17) suggestedDuty = DUTY_OPTIONS.find(d => d.id === '200');
      else if (hour >= 12 && hour < 22) suggestedDuty = DUTY_OPTIONS.find(d => d.id === '400');
      else if (hour >= 14 || hour < 1) suggestedDuty = DUTY_OPTIONS.find(d => d.id === '500');
      else suggestedDuty = DUTY_OPTIONS.find(d => d.id === 'xops');
      
      if (suggestedDuty) {
        setSelectedDuty(suggestedDuty);
      }
    }
  }, [visible]);

  const loadSupervisors = async () => {
    try {
      const supervisors = await getSupervisors();
      setAvailableSupervisors(supervisors);
    } catch (error) {
      console.error('Failed to load supervisors:', error);
    }
  };

  const handleLogin = async () => {
    if (!badge.trim()) {
      Alert.alert('Error', 'Please enter your badge number');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    if (!selectedDuty) {
      Alert.alert('Error', 'Please select a duty');
      return;
    }

    try {
      const result = await login({ 
        badge: badge.trim(), 
        password: password.trim(),
        duty: selectedDuty.id
      });
      
      if (result.success) {
        Alert.alert('Success', `Welcome ${result.session.supervisor.name}!\nDuty: ${selectedDuty.name}`);
        onLoginSuccess?.(result.session);
        onClose();
        // Reset form
        setBadge('');
        setPassword('Barry123');
        setSelectedSupervisor(null);
        setSelectedDuty(null);
      } else {
        Alert.alert('Login Failed', result.error || 'Invalid credentials');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Login failed');
    }
  };

  const handleSupervisorSelect = (supervisor) => {
    setSelectedSupervisor(supervisor);
    setBadge(supervisor.badge);
  };

  const handleQuickLogin = (supervisor) => {
    setBadge(supervisor.badge);
    setSelectedSupervisor(supervisor);
    
    // Check if duty is selected
    if (!selectedDuty) {
      Alert.alert('Error', 'Please select a duty first');
      return;
    }
    
    // Auto-trigger login with default password
    setTimeout(() => {
      login({ 
        badge: supervisor.badge, 
        password: 'Barry123',
        duty: selectedDuty.id
      }).then((result) => {
        if (result.success) {
          Alert.alert('Success', `Welcome ${result.session.supervisor.name}!\nDuty: ${selectedDuty.name}`);
          onLoginSuccess?.(result.session);
          onClose();
        } else {
          Alert.alert('Login Failed', result.error || 'Invalid credentials');
        }
      });
    }, 100);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Supervisor Login</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Duty Selection */}
          <Text style={styles.sectionTitle}>Select Duty</Text>
          <View style={styles.dutyGrid}>
            {DUTY_OPTIONS.map((duty) => (
              <TouchableOpacity
                key={duty.id}
                style={[
                  styles.dutyCard,
                  selectedDuty?.id === duty.id && styles.dutyCardSelected
                ]}
                onPress={() => setSelectedDuty(duty)}
              >
                <Text style={[
                  styles.dutyName,
                  selectedDuty?.id === duty.id && styles.dutyNameSelected
                ]}>
                  {duty.name}
                </Text>
                <Text style={[
                  styles.dutyShift,
                  selectedDuty?.id === duty.id && styles.dutyShiftSelected
                ]}>
                  {duty.shift}
                </Text>
                {selectedDuty?.id === duty.id && (
                  <Ionicons 
                    name="checkmark-circle" 
                    size={20} 
                    color="#10B981" 
                    style={styles.dutyCheck}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Select Supervisors */}
          <Text style={styles.sectionTitle}>Quick Login</Text>
          <View style={styles.supervisorGrid}>
            {availableSupervisors.slice(0, 6).map((supervisor) => (
              <TouchableOpacity
                key={supervisor.id}
                style={[
                  styles.supervisorCard,
                  selectedSupervisor?.id === supervisor.id && styles.supervisorCardSelected
                ]}
                onPress={() => handleQuickLogin(supervisor)}
              >
                <Text style={styles.supervisorBadge}>{supervisor.badge}</Text>
                <Text style={styles.supervisorName} numberOfLines={2}>
                  {supervisor.name}
                </Text>
                <Text style={styles.supervisorRole} numberOfLines={1}>
                  {supervisor.role}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Manual Login Form */}
          <Text style={styles.sectionTitle}>Manual Login</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Badge Number</Text>
            <TextInput
              style={styles.textInput}
              value={badge}
              onChangeText={setBadge}
              placeholder="Enter badge (e.g. AG003)"
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.textInput, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Error Display */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="log-in" size={20} color="#FFFFFF" />
                <Text style={styles.loginButtonText}>Login</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Helper Text */}
          <Text style={styles.helperText}>
            Default password: Barry123{'\n'}
            Contact IT if you need help accessing your account
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    marginTop: 16,
  },
  supervisorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  supervisorCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    margin: 4,
    minWidth: 120,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  supervisorCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  supervisorBadge: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  supervisorName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 2,
  },
  supervisorRole: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
    padding: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginLeft: 6,
  },
  loginButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  loginButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  dutyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  dutyCard: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  dutyCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#10B981',
  },
  dutyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  dutyNameSelected: {
    color: '#10B981',
  },
  dutyShift: {
    fontSize: 12,
    color: '#6B7280',
  },
  dutyShiftSelected: {
    color: '#10B981',
  },
  dutyCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});

export default SupervisorLoginSimple;