/*
 * Go Barry - Create Incident Modal
 * Modal for creating new incidents manually
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { colors, spacing } from '../styles/incidents.styles';

const CreateIncidentModal = ({ 
  visible, 
  onClose, 
  onCreateIncident, 
  supervisorName,
  supervisorRole,
  sessionId,
  baseUrl
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Traffic Incident',
    subtype: '',
    location: '',
    description: '',
    severity: 'Medium',
    notes: '',
    affectsRoutes: ''
  });

  const incidentTypes = [
    'Traffic Incident',
    'Road Closure',
    'Accident',
    'Breakdown',
    'Congestion',
    'Event',
    'Weather',
    'Other'
  ];

  const severityLevels = ['Low', 'Medium', 'High'];

  const handleCreate = async () => {
    // Validate required fields
    if (!formData.location || !formData.description) {
      if (Platform.OS === 'web') {
        alert('Please fill in location and description');
      } else {
        Alert.alert('Required Fields', 'Please fill in location and description');
      }
      return;
    }

    setLoading(true);
    try {
      // Parse routes
      const routesArray = formData.affectsRoutes
        .split(',')
        .map(r => r.trim())
        .filter(r => r);

      const incidentData = {
        type: formData.type,
        subtype: formData.subtype,
        location: formData.location,
        description: formData.description,
        severity: formData.severity,
        notes: formData.notes,
        affectsRoutes: routesArray,
        createdBy: supervisorName,
        createdByRole: supervisorRole,
        startTime: new Date().toISOString(),
        status: 'active'
      };

      // Add retry logic for 429 errors
      let response;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount <= maxRetries) {
        response = await fetch(`${baseUrl}/api/incidents`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(incidentData),
          timeout: 15000 // 15 second timeout
        });

        if (response.status !== 429) break;
        
        retryCount++;
        if (retryCount <= maxRetries) {
          console.log(`Retry attempt ${retryCount}/${maxRetries} due to 429 error`);
          await new Promise(resolve => setTimeout(resolve, 2000 * retryCount)); // Exponential backoff
        }
      }

      if (!response.ok) {
        throw new Error(`Failed to create incident: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Reset form
        setFormData({
          type: 'Traffic Incident',
          subtype: '',
          location: '',
          description: '',
          severity: 'Medium',
          notes: '',
          affectsRoutes: ''
        });
        
        // Notify parent component
        if (onCreateIncident) {
          onCreateIncident(result.incident);
        }
        
        // Close modal
        onClose();
        
        if (Platform.OS === 'web') {
          alert('Incident created successfully');
        } else {
          Alert.alert('Success', 'Incident created successfully');
        }
      } else {
        throw new Error(result.error || 'Failed to create incident');
      }
    } catch (error) {
      console.error('Error creating incident:', error);
      if (Platform.OS === 'web') {
        alert(`Error: ${error.message}`);
      } else {
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const modalStyles = {
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg
    },
    container: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.xl,
      width: '100%',
      maxWidth: 500,
      maxHeight: '90%',
      ...(Platform.OS === 'web' ? {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25)'
      } : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
      })
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text
    },
    closeButton: {
      padding: spacing.sm
    },
    form: {
      flex: 1
    },
    inputGroup: {
      marginBottom: spacing.lg
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: spacing.xs
    },
    input: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: spacing.md,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border
    },
    textArea: {
      minHeight: 100,
      textAlignVertical: 'top'
    },
    picker: {
      backgroundColor: colors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing.md,
      marginTop: spacing.xl,
      paddingTop: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border
    },
    button: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs
    },
    cancelButton: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border
    },
    createButton: {
      backgroundColor: colors.primary
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600'
    },
    cancelButtonText: {
      color: colors.text
    },
    createButtonText: {
      color: '#fff'
    },
    required: {
      color: colors.danger
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>Create New Incident</Text>
            <Pressable 
              style={modalStyles.closeButton}
              onPress={onClose}
              disabled={loading}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={modalStyles.form} showsVerticalScrollIndicator={false}>
            {/* Type */}
            <View style={modalStyles.inputGroup}>
              <Text style={modalStyles.label}>Type</Text>
              <View style={modalStyles.picker}>
                <Picker
                  selectedValue={formData.type}
                  onValueChange={(value) => setFormData({...formData, type: value})}
                  enabled={!loading}
                >
                  {incidentTypes.map(type => (
                    <Picker.Item key={type} label={type} value={type} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Subtype */}
            <View style={modalStyles.inputGroup}>
              <Text style={modalStyles.label}>Subtype (Optional)</Text>
              <TextInput
                style={modalStyles.input}
                value={formData.subtype}
                onChangeText={(text) => setFormData({...formData, subtype: text})}
                placeholder="e.g., Multi-vehicle collision"
                placeholderTextColor={colors.textTertiary}
                editable={!loading}
              />
            </View>

            {/* Location */}
            <View style={modalStyles.inputGroup}>
              <Text style={modalStyles.label}>
                Location <Text style={modalStyles.required}>*</Text>
              </Text>
              <TextInput
                style={modalStyles.input}
                value={formData.location}
                onChangeText={(text) => setFormData({...formData, location: text})}
                placeholder="e.g., A1 Northbound at Junction 65"
                placeholderTextColor={colors.textTertiary}
                editable={!loading}
              />
            </View>

            {/* Description */}
            <View style={modalStyles.inputGroup}>
              <Text style={modalStyles.label}>
                Description <Text style={modalStyles.required}>*</Text>
              </Text>
              <TextInput
                style={[modalStyles.input, modalStyles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({...formData, description: text})}
                placeholder="Describe the incident details..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={4}
                editable={!loading}
              />
            </View>

            {/* Severity */}
            <View style={modalStyles.inputGroup}>
              <Text style={modalStyles.label}>Severity</Text>
              <View style={modalStyles.picker}>
                <Picker
                  selectedValue={formData.severity}
                  onValueChange={(value) => setFormData({...formData, severity: value})}
                  enabled={!loading}
                >
                  {severityLevels.map(level => (
                    <Picker.Item key={level} label={level} value={level} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Affected Routes */}
            <View style={modalStyles.inputGroup}>
              <Text style={modalStyles.label}>Affected Routes</Text>
              <TextInput
                style={modalStyles.input}
                value={formData.affectsRoutes}
                onChangeText={(text) => setFormData({...formData, affectsRoutes: text})}
                placeholder="e.g., 21, X21, 56 (comma separated)"
                placeholderTextColor={colors.textTertiary}
                editable={!loading}
              />
            </View>

            {/* Notes */}
            <View style={modalStyles.inputGroup}>
              <Text style={modalStyles.label}>Additional Notes</Text>
              <TextInput
                style={[modalStyles.input, modalStyles.textArea]}
                value={formData.notes}
                onChangeText={(text) => setFormData({...formData, notes: text})}
                placeholder="Any additional information..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
                editable={!loading}
              />
            </View>
          </ScrollView>

          <View style={modalStyles.footer}>
            <Pressable 
              style={[modalStyles.button, modalStyles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={[modalStyles.buttonText, modalStyles.cancelButtonText]}>
                Cancel
              </Text>
            </Pressable>
            
            <Pressable 
              style={[modalStyles.button, modalStyles.createButton]}
              onPress={handleCreate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="add-circle" size={20} color="#fff" />
                  <Text style={[modalStyles.buttonText, modalStyles.createButtonText]}>
                    Create Incident
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CreateIncidentModal;