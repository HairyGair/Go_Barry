import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ChangePasswordScreen from '../ChangePasswordScreen';

export default function PasswordExpiryModal({ visible, onClose, onPasswordChanged, daysUntilExpiry = 0 }) {
  const [showChangePassword, setShowChangePassword] = useState(false);

  const isExpired = daysUntilExpiry <= 0;
  const isWarning = daysUntilExpiry > 0 && daysUntilExpiry <= 14;

  const handlePasswordChanged = () => {
    setShowChangePassword(false);
    onPasswordChanged?.();
    onClose?.();
  };

  if (showChangePassword) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          if (!isExpired) {
            setShowChangePassword(false);
          }
        }}
      >
        <ChangePasswordScreen 
          onClose={handlePasswordChanged}
          forceChange={isExpired}
        />
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!isExpired) {
          onClose?.();
        }
      }}
    >
      <View style={styles.overlay}>
        <View style={[
          styles.modal,
          isExpired && styles.modalExpired,
          isWarning && styles.modalWarning
        ]}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons 
              name={isExpired ? "lock-alert" : "lock-clock"} 
              size={48} 
              color={isExpired ? "#dc2626" : "#f59e0b"} 
            />
          </View>

          <Text style={styles.title}>
            {isExpired ? 'Password Expired' : 'Password Expiring Soon'}
          </Text>

          <Text style={styles.message}>
            {isExpired 
              ? 'Your password has expired and must be changed to continue.'
              : `Your password will expire in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}.`
            }
          </Text>

          {!isExpired && (
            <Text style={styles.subMessage}>
              For security, passwords must be changed every 90 days.
            </Text>
          )}

          <View style={styles.actions}>
            {!isExpired && (
              <TouchableOpacity 
                style={styles.laterButton}
                onPress={onClose}
              >
                <Text style={styles.laterText}>Remind Me Later</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.changeButton, isExpired && styles.changeButtonFull]}
              onPress={() => setShowChangePassword(true)}
            >
              <Text style={styles.changeText}>Change Password Now</Text>
            </TouchableOpacity>
          </View>

          {isExpired && (
            <Text style={styles.cantClose}>
              You cannot proceed without changing your password.
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalExpired: {
    borderWidth: 2,
    borderColor: '#dc2626',
  },
  modalWarning: {
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 8,
  },
  subMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  laterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  laterText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  changeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  changeButtonFull: {
    flex: 1,
  },
  changeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cantClose: {
    fontSize: 12,
    color: '#dc2626',
    marginTop: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});