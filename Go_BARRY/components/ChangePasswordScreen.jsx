import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSupervisorSession } from './hooks/useSupervisorSession';

const PASSWORD_REQUIREMENTS = [
  { id: 'length', label: 'At least 8 characters', check: (pwd) => pwd.length >= 8 },
  { id: 'uppercase', label: 'One uppercase letter', check: (pwd) => /[A-Z]/.test(pwd) },
  { id: 'lowercase', label: 'One lowercase letter', check: (pwd) => /[a-z]/.test(pwd) },
  { id: 'number', label: 'One number', check: (pwd) => /[0-9]/.test(pwd) },
  { id: 'special', label: 'One special character (!@#$%^&*)', check: (pwd) => /[!@#$%^&*]/.test(pwd) }
];

export default function ChangePasswordScreen({ onClose }) {
  const { supervisorSession, supervisorName, changePassword } = useSupervisorSession();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Calculate password strength
  const calculateStrength = (pwd) => {
    let strength = 0;
    PASSWORD_REQUIREMENTS.forEach(req => {
      if (req.check(pwd)) strength++;
    });
    setPasswordStrength(strength);
    return strength;
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 2) return '#ef4444'; // Red
    if (passwordStrength <= 3) return '#f59e0b'; // Orange
    if (passwordStrength <= 4) return '#eab308'; // Yellow
    return '#10b981'; // Green
  };

  const getStrengthText = () => {
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 3) return 'Fair';
    if (passwordStrength <= 4) return 'Good';
    return 'Strong';
  };

  const validateForm = () => {
    if (!currentPassword) {
      Alert.alert('Error', 'Please enter your current password');
      return false;
    }
    
    if (!newPassword) {
      Alert.alert('Error', 'Please enter a new password');
      return false;
    }
    
    if (newPassword === currentPassword) {
      Alert.alert('Error', 'New password must be different from current password');
      return false;
    }
    
    if (passwordStrength < 3) {
      Alert.alert('Error', 'Password is too weak. Please meet at least 3 requirements');
      return false;
    }
    
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const result = await changePassword(currentPassword, newPassword);
      
      if (result.success) {
        Alert.alert(
          'Success', 
          'Your password has been changed successfully!',
          [{ text: 'OK', onPress: () => onClose?.() }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to change password');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <MaterialCommunityIcons name="lock-reset" size={32} color="#3b82f6" />
          <View style={styles.headerText}>
            <Text style={styles.title}>Change Password</Text>
            <Text style={styles.subtitle}>{supervisorName} ({supervisorSession?.supervisor?.badge})</Text>
          </View>
        </View>
        {supervisorSession?.supervisor?.passwordLastChanged && (
          <Text style={styles.lastChanged}>
            Last changed: {new Date(supervisorSession.supervisor.passwordLastChanged).toLocaleDateString()}
          </Text>
        )}
      </View>

      <View style={styles.form}>
        {/* Current Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Current Password</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrentPassword}
              placeholder="Enter current password"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              <MaterialCommunityIcons 
                name={showCurrentPassword ? "eye-off" : "eye"} 
                size={20} 
                color="#6b7280" 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* New Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>New Password</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                calculateStrength(text);
              }}
              secureTextEntry={!showNewPassword}
              placeholder="Enter new password"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowNewPassword(!showNewPassword)}
            >
              <MaterialCommunityIcons 
                name={showNewPassword ? "eye-off" : "eye"} 
                size={20} 
                color="#6b7280" 
              />
            </TouchableOpacity>
          </View>
          
          {/* Password Strength Indicator */}
          {newPassword.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBar}>
                <View 
                  style={[
                    styles.strengthFill,
                    { 
                      width: `${(passwordStrength / 5) * 100}%`,
                      backgroundColor: getStrengthColor()
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.strengthText, { color: getStrengthColor() }]}>
                {getStrengthText()}
              </Text>
            </View>
          )}
        </View>

        {/* Confirm Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm New Password</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              placeholder="Confirm new password"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <MaterialCommunityIcons 
                name={showConfirmPassword ? "eye-off" : "eye"} 
                size={20} 
                color="#6b7280" 
              />
            </TouchableOpacity>
          </View>
          {confirmPassword && newPassword && (
            <Text style={[
              styles.matchText,
              { color: confirmPassword === newPassword ? '#10b981' : '#ef4444' }
            ]}>
              {confirmPassword === newPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
            </Text>
          )}
        </View>

        {/* Password Requirements */}
        <View style={styles.requirements}>
          <Text style={styles.requirementsTitle}>Password Requirements:</Text>
          {PASSWORD_REQUIREMENTS.map(req => (
            <View key={req.id} style={styles.requirement}>
              <MaterialCommunityIcons 
                name={req.check(newPassword) ? "check-circle" : "circle-outline"} 
                size={16} 
                color={req.check(newPassword) ? '#10b981' : '#6b7280'} 
              />
              <Text style={[
                styles.requirementText,
                { color: req.check(newPassword) ? '#10b981' : '#6b7280' }
              ]}>
                {req.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.submitButton,
              (loading || passwordStrength < 3) && styles.submitButtonDisabled
            ]}
            onPress={handleChangePassword}
            disabled={loading || passwordStrength < 3}
          >
            {loading ? (
              <Text style={styles.submitText}>Changing...</Text>
            ) : (
              <Text style={styles.submitText}>Change Password</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Security Tips */}
        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>Security Tips:</Text>
          <Text style={styles.tipText}>• Don't use personal information</Text>
          <Text style={styles.tipText}>• Avoid common words or patterns</Text>
          <Text style={styles.tipText}>• Use a unique password for Go BARRY</Text>
          <Text style={styles.tipText}>• Consider using a password manager</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  lastChanged: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  eyeButton: {
    padding: 12,
  },
  strengthContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  matchText: {
    fontSize: 12,
    marginTop: 4,
  },
  requirements: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  submitButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  tips: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: '#1e40af',
    marginBottom: 4,
  },
});