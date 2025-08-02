// Go_BARRY/components/CoordinateVerificationButton.jsx
// Quick verification button for supervisor coordinate validation
import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSupervisor } from './hooks/useSupervisorSession';

const CoordinateVerificationButton = ({ roadwork, onVerified }) => {
  const { sessionData } = useSupervisor();
  const [showModal, setShowModal] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [confidence, setConfidence] = useState(0.8);

  const verificationMethods = [
    { id: 'site_visit', label: 'Site Visit', icon: 'car', confidence: 1.0 },
    { id: 'local_knowledge', label: 'Local Knowledge', icon: 'head-lightbulb', confidence: 0.9 },
    { id: 'street_view', label: 'Street View Check', icon: 'google-street-view', confidence: 0.8 },
    { id: 'photo_evidence', label: 'Photo Evidence', icon: 'camera', confidence: 0.95 }
  ];

  const handleVerify = async () => {
    if (!verificationMethod) {
      Alert.alert('Required', 'Please select a verification method');
      return;
    }

    try {
      const response = await fetch(
        `https://go-barry.onrender.com/api/coordinates/verify/${roadwork.id}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coordinates: roadwork.coordinates,
            verifiedBy: sessionData?.badgeNumber,
            verificationMethod,
            notes,
            confidence,
            previousCoordinates: roadwork.originalCoordinatesBeforeSnap
          })
        }
      );

      const result = await response.json();
      
      if (result.success) {
        Alert.alert('Success', 'Coordinates verified successfully');
        setShowModal(false);
        if (onVerified) onVerified(result.verification);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify coordinates');
    }
  };

  const isVerified = roadwork.coordinateMetadata?.verified;

  return (
    <>
      <TouchableOpacity 
        style={[
          styles.button,
          isVerified && styles.buttonVerified
        ]}
        onPress={() => setShowModal(true)}
        disabled={isVerified}
      >
        <MaterialCommunityIcons 
          name={isVerified ? 'check-circle' : 'check-circle-outline'} 
          size={20} 
          color={isVerified ? '#22c55e' : '#3b82f6'} 
        />
        <Text style={[
          styles.buttonText,
          isVerified && styles.buttonTextVerified
        ]}>
          {isVerified ? 'Verified' : 'Verify Location'}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Verify Coordinates</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.locationText}>
              {roadwork.sm_street_name || roadwork.street_name}
            </Text>
            <Text style={styles.coordinatesText}>
              {roadwork.coordinates[0].toFixed(7)}, {roadwork.coordinates[1].toFixed(7)}
            </Text>

            <Text style={styles.sectionTitle}>Verification Method</Text>
            <View style={styles.methodGrid}>
              {verificationMethods.map(method => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.methodCard,
                    verificationMethod === method.id && styles.methodCardSelected
                  ]}
                  onPress={() => {
                    setVerificationMethod(method.id);
                    setConfidence(method.confidence);
                  }}
                >
                  <MaterialCommunityIcons 
                    name={method.icon} 
                    size={24} 
                    color={verificationMethod === method.id ? '#3b82f6' : '#6b7280'} 
                  />
                  <Text style={[
                    styles.methodText,
                    verificationMethod === method.id && styles.methodTextSelected
                  ]}>
                    {method.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add any verification notes..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />

            <View style={styles.confidenceContainer}>
              <Text style={styles.confidenceLabel}>
                Confidence: {Math.round(confidence * 100)}%
              </Text>
              <View style={styles.confidenceBar}>
                <View 
                  style={[
                    styles.confidenceFill,
                    { width: `${confidence * 100}%` }
                  ]} 
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.verifyButton,
                !verificationMethod && styles.verifyButtonDisabled
              ]}
              onPress={handleVerify}
              disabled={!verificationMethod}
            >
              <MaterialCommunityIcons name="check-bold" size={20} color="#ffffff" />
              <Text style={styles.verifyButtonText}>Verify Coordinates</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  buttonVerified: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  buttonText: {
    marginLeft: 8,
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonTextVerified: {
    color: '#22c55e',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#1f2937',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  locationText: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 4,
  },
  coordinatesText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 20,
    fontFamily: 'monospace',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#60a5fa',
    marginBottom: 12,
    marginTop: 16,
  },
  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  methodCard: {
    width: '48%',
    padding: 16,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(107, 114, 128, 0.3)',
    alignItems: 'center',
  },
  methodCardSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  methodText: {
    marginTop: 8,
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  methodTextSelected: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  notesInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    color: '#ffffff',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  confidenceContainer: {
    marginTop: 20,
  },
  confidenceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  confidenceBar: {
    height: 8,
    backgroundColor: 'rgba(107, 114, 128, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  verifyButtonDisabled: {
    backgroundColor: 'rgba(107, 114, 128, 0.5)',
  },
  verifyButtonText: {
    marginLeft: 8,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CoordinateVerificationButton;
