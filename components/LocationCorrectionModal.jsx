// Go_BARRY/components/LocationCorrectionModal.jsx
// Modal for supervisors to correct alert locations

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../config/api';
import { useSupervisorSession } from './hooks/useSupervisorSession';

const LocationCorrectionModal = ({ visible, onClose, alert, onCorrectionSaved }) => {
  const { session } = useSupervisorSession();
  
  // Simple API call wrapper
  const apiCall = async (endpoint, options = {}) => {
    try {
      const response = await apiRequest(endpoint, options);
      return { success: true, ...response };
    } catch (error) {
      console.error('API call error:', error);
      return { success: false, error: error.message };
    }
  };
  
  const [correctedLocation, setCorrectedLocation] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState(null);
  const [nearestLocation, setNearestLocation] = useState(null);

  useEffect(() => {
    if (alert && visible) {
      setCorrectedLocation(alert.location || '');
      setReason('');
      setValidation(null);
      setNearestLocation(null);
      
      // Validate current location
      if (alert.coordinates && alert.coordinates.length >= 2) {
        validateCurrentLocation();
      }
    }
  }, [alert, visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const validateCurrentLocation = async () => {
    if (!alert || !alert.coordinates) return;
    
    setValidating(true);
    try {
      const response = await apiCall('/api/location/validate-location', {
        method: 'POST',
        body: JSON.stringify({
          description: alert.location,
          latitude: alert.coordinates[0],
          longitude: alert.coordinates[1]
        })
      });

      if (response.success) {
        setValidation(response.validation);
        setNearestLocation(response.nearestLocation);
      }
    } catch (error) {
      console.error('❌ Location validation error:', error);
    } finally {
      setValidating(false);
    }
  };

  const handleSaveCorrection = async () => {
    if (!correctedLocation.trim()) {
      Alert.alert('Error', 'Please enter a corrected location');
      return;
    }

    if (!reason.trim()) {
      Alert.alert('Error', 'Please provide a reason for the correction');
      return;
    }

    setLoading(true);
    try {
      const response = await apiCall('/api/location/corrections', {
        method: 'POST',
        body: JSON.stringify({
          originalLocation: alert.location,
          originalCoords: alert.coordinates,
          correctedLocation: correctedLocation.trim(),
          correctedCoords: alert.coordinates, // Keep same coords for now
          reason: reason.trim(),
          supervisorId: session.supervisor.id,
          sessionToken: session.sessionId
        })
      });

      if (response.success) {
        Alert.alert(
          'Success', 
          'Location correction saved successfully',
          [{ text: 'OK', onPress: () => {
            onCorrectionSaved && onCorrectionSaved(response.correction);
            onClose();
          }}]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to save correction');
      }
    } catch (error) {
      console.error('❌ Save correction error:', error);
      Alert.alert('Error', 'Failed to save location correction');
    } finally {
      setLoading(false);
    }
  };

  const handleTestEnhancement = async () => {
    if (!correctedLocation.trim()) return;

    setValidating(true);
    try {
      const response = await apiCall('/api/location/test-enhancement', {
        method: 'POST',
        body: JSON.stringify({
          location: correctedLocation.trim(),
          coordinates: alert.coordinates
        })
      });

      if (response.success && response.enhanced) {
        Alert.alert(
          'Location Test',
          `Original: ${response.original.location}\n\n` +
          `Enhanced: ${response.enhanced.correctedLocation}\n\n` +
          `Confidence: ${(response.enhanced.confidence * 100).toFixed(0)}%\n` +
          `Source: ${response.enhanced.source}`
        );
      }
    } catch (error) {
      console.error('❌ Test enhancement error:', error);
    } finally {
      setValidating(false);
    }
  };

  const getSuggestedLocation = () => {
    if (validation && !validation.isValid && validation.suggestedCorrection) {
      return validation.suggestedCorrection;
    }
    if (nearestLocation && nearestLocation.distance < 2) {
      return nearestLocation.name;
    }
    return null;
  };

  const applySuggestion = () => {
    const suggestion = getSuggestedLocation();
    if (suggestion) {
      setCorrectedLocation(suggestion);
      setReason(`Location mismatch detected - corrected to ${suggestion}`);
    }
  };

  if (!alert) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>Correct Location</Text>
            
            {/* Current Alert Info */}
            <View style={styles.alertInfo}>
              <Text style={styles.label}>Current Alert:</Text>
              <Text style={styles.alertTitle}>{alert.title}</Text>
              <Text style={styles.alertLocation}>📍 {alert.location}</Text>
              {alert.coordinates && (
                <Text style={styles.coordinates}>
                  Coordinates: {alert.coordinates[0].toFixed(4)}, {alert.coordinates[1].toFixed(4)}
                </Text>
              )}
            </View>

            {/* Validation Results */}
            {validating && (
              <View style={styles.validationContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.validatingText}>Validating location...</Text>
              </View>
            )}

            {validation && !validation.isValid && (
              <View style={styles.warningContainer}>
                <Text style={styles.warningTitle}>⚠️ Location Mismatch Detected</Text>
                <Text style={styles.warningText}>
                  Expected: {validation.expectedArea}
                </Text>
                <Text style={styles.warningText}>
                  Actual: {validation.actualArea}
                </Text>
                {validation.suggestedCorrection && (
                  <TouchableOpacity 
                    style={styles.suggestionButton}
                    onPress={applySuggestion}
                  >
                    <Text style={styles.suggestionButtonText}>
                      Apply Suggestion: {validation.suggestedCorrection}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {nearestLocation && nearestLocation.distance < 5 && (
              <View style={styles.nearestContainer}>
                <Text style={styles.nearestText}>
                  Nearest known location: {nearestLocation.name} ({nearestLocation.distance.toFixed(1)}km away)
                </Text>
              </View>
            )}

            {/* Correction Form */}
            <View style={styles.formContainer}>
              <Text style={styles.label}>Corrected Location:</Text>
              <TextInput
                style={styles.input}
                value={correctedLocation}
                onChangeText={setCorrectedLocation}
                placeholder="Enter the correct location description"
                multiline
                numberOfLines={2}
              />

              <TouchableOpacity 
                style={styles.testButton}
                onPress={handleTestEnhancement}
                disabled={!correctedLocation.trim() || validating}
              >
                <Text style={styles.testButtonText}>Test Location</Text>
              </TouchableOpacity>

              <Text style={styles.label}>Reason for Correction:</Text>
              <TextInput
                style={styles.input}
                value={reason}
                onChangeText={setReason}
                placeholder="e.g., Westerhope showing as Ryton"
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Suggestion */}
            {getSuggestedLocation() && !correctedLocation.includes(getSuggestedLocation()) && (
              <TouchableOpacity 
                style={styles.suggestionChip}
                onPress={applySuggestion}
              >
                <Text style={styles.suggestionChipText}>
                  💡 Suggestion: {getSuggestedLocation()}
                </Text>
              </TouchableOpacity>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, styles.saveButton, loading && styles.disabledButton]}
                onPress={handleSaveCorrection}
                disabled={loading || !correctedLocation.trim() || !reason.trim()}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Correction</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 20,
    textAlign: 'center',
  },
  alertInfo: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 5,
  },
  alertLocation: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  coordinates: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  validationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginBottom: 15,
  },
  validatingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#007AFF',
  },
  warningContainer: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 4,
  },
  suggestionButton: {
    backgroundColor: '#fff',
    borderColor: '#856404',
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginTop: 10,
  },
  suggestionButtonText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
  nearestContainer: {
    backgroundColor: '#e3f2fd',
    padding: 10,
    borderRadius: 6,
    marginBottom: 15,
  },
  nearestText: {
    fontSize: 14,
    color: '#1976d2',
  },
  formContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 15,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  testButton: {
    backgroundColor: '#f8f9fa',
    borderColor: '#dee2e6',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginBottom: 15,
  },
  testButtonText: {
    fontSize: 14,
    color: '#495057',
    textAlign: 'center',
  },
  suggestionChip: {
    backgroundColor: '#e8f5e9',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  suggestionChipText: {
    fontSize: 14,
    color: '#2e7d32',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#495057',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default LocationCorrectionModal;
