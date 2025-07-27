// Go_BARRY/components/CreateRoadworkModal.jsx
// Modal for supervisors to manually create roadwork entries

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CreateRoadworkModal = ({ 
  visible, 
  onClose,
  onCreateRoadwork,
  supervisorData 
}) => {
  const [formData, setFormData] = useState({
    location: '',
    description: '',
    severity: 'medium',
    expectedDuration: '',
    affectedRoutes: [],
    trafficManagement: 'lane_restriction',
    startDate: '',
    endDate: '',
    promoter: '',
    contactDetails: '',
    pushToDisplay: false
  });
  
  const [availableRoutes, setAvailableRoutes] = useState([]);
  const [selectedRoutes, setSelectedRoutes] = useState(new Set());
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRouteSelector, setShowRouteSelector] = useState(false);

  // Common Go North East routes
  const commonRoutes = [
    '1', '2', '4', '6', '8', '8A', '9', '10', '10A', '10B', '12', '16', '16A', '16B',
    '20', '20A', '21', '22', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33',
    '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47',
    '49', '50', '51', '52', '53', '54', '55', '56', '57', '58', '60', '61', '62', '63',
    '64', '65', '67', '68', '69', '71', '72', '73', '74', '75', '76', '77', '78', '79',
    '80', '81', '82', '83', '84', '85', '86', '87', '88', '89', '90', '91', '92', '93',
    '94', '95', '96', '97', '98', '99', 'X1', 'X9', 'X10', 'X11', 'X12', 'X15', 'X18', 
    'X20', 'X21', 'X22', 'X24', 'X25', 'X30', 'X31', 'X45', 'X46', 'X47', 'X66', 'X70', 
    'X71', 'X72', 'X77', 'X78', 'X79', 'X80', 'X82', 'X84', 'X85', 'X88', 'Q1', 'Q2', 'Q3'
  ];

  const severityOptions = [
    { value: 'low', label: 'Low', description: 'Minor impact on traffic flow' },
    { value: 'medium', label: 'Medium', description: 'Moderate impact, some delays expected' },
    { value: 'high', label: 'High', description: 'Significant impact, major delays' },
    { value: 'critical', label: 'Critical', description: 'Severe impact, route diversions needed' }
  ];

  const trafficManagementOptions = [
    { value: 'lane_restriction', label: 'Lane Restriction' },
    { value: 'road_closure', label: 'Road Closure' },
    { value: 'temporary_signals', label: 'Temporary Traffic Signals' },
    { value: 'contraflow', label: 'Contraflow System' },
    { value: 'diversion', label: 'Traffic Diversion' },
    { value: 'parking_suspension', label: 'Parking Suspension' }
  ];

  useEffect(() => {
    if (visible) {
      resetForm();
      setAvailableRoutes(commonRoutes);
    }
  }, [visible]);

  const resetForm = () => {
    setFormData({
      location: '',
      description: '',
      severity: 'medium',
      expectedDuration: '',
      affectedRoutes: [],
      trafficManagement: 'lane_restriction',
      startDate: '',
      endDate: '',
      promoter: '',
      contactDetails: '',
      pushToDisplay: false
    });
    setSelectedRoutes(new Set());
    setError('');
    setShowRouteSelector(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = () => {
    setError('');

    if (!formData.location.trim()) {
      setError('Location is required');
      return false;
    }

    if (!formData.description.trim()) {
      setError('Description is required');
      return false;
    }

    if (formData.location.length < 10) {
      setError('Please provide a more detailed location (minimum 10 characters)');
      return false;
    }

    if (formData.description.length < 20) {
      setError('Please provide a more detailed description (minimum 20 characters)');
      return false;
    }

    return true;
  };

  const handleRouteToggle = (route) => {
    const newSelectedRoutes = new Set(selectedRoutes);
    if (newSelectedRoutes.has(route)) {
      newSelectedRoutes.delete(route);
    } else {
      newSelectedRoutes.add(route);
    }
    setSelectedRoutes(newSelectedRoutes);
    setFormData({
      ...formData,
      affectedRoutes: Array.from(newSelectedRoutes)
    });
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const roadworkData = {
        ...formData,
        id: `manual_${Date.now()}`,
        source: 'manual',
        createdBy: supervisorData?.id || 'unknown',
        createdAt: new Date().toISOString(),
        status: 'reported',
        priority: formData.severity,
        affectedRoutes: Array.from(selectedRoutes),
        coordinates: null, // Will be geocoded on the backend
        workType: 'Manual Entry'
      };

      const result = await onCreateRoadwork(roadworkData);
      if (result?.success) {
        Alert.alert(
          'Success', 
          'Roadwork entry created successfully.',
          [{ text: 'OK', onPress: handleClose }]
        );
      } else {
        setError(result?.error || 'Failed to create roadwork entry');
      }
    } catch (err) {
      console.error('Error creating roadwork:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRouteSelector = () => {
    if (!showRouteSelector) return null;

    return (
      <View style={styles.routeSelectorContainer}>
        <Text style={styles.routeSelectorTitle}>Select Affected Routes</Text>
        <ScrollView style={styles.routesList} nestedScrollEnabled>
          <View style={styles.routesGrid}>
            {availableRoutes.map((route) => (
              <TouchableOpacity
                key={route}
                style={[
                  styles.routeChip,
                  selectedRoutes.has(route) && styles.routeChipSelected
                ]}
                onPress={() => handleRouteToggle(route)}
              >
                <Text style={[
                  styles.routeChipText,
                  selectedRoutes.has(route) && styles.routeChipTextSelected
                ]}>
                  {route}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        <TouchableOpacity
          style={styles.routeSelectorCloseButton}
          onPress={() => setShowRouteSelector(false)}
        >
          <Text style={styles.routeSelectorCloseText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Create Roadwork Entry</Text>
              <Text style={styles.subtitle}>Manual roadwork notification</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <ScrollView style={styles.formScrollView} showsVerticalScrollIndicator={false}>
            {/* Location */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Location *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., A167 Durham Road, Gateshead"
                placeholderTextColor="#9CA3AF"
                value={formData.location}
                onChangeText={(text) => {
                  setFormData({...formData, location: text});
                  setError('');
                }}
                multiline
              />
            </View>

            {/* Description */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="e.g., Emergency gas leak repair requiring lane closure. Expected duration 4-6 hours."
                placeholderTextColor="#9CA3AF"
                value={formData.description}
                onChangeText={(text) => {
                  setFormData({...formData, description: text});
                  setError('');
                }}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Severity */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Severity Level</Text>
              <View style={styles.severityContainer}>
                {severityOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.severityOption,
                      formData.severity === option.value && styles.severityOptionSelected
                    ]}
                    onPress={() => setFormData({...formData, severity: option.value})}
                  >
                    <View style={styles.severityHeader}>
                      <Text style={[
                        styles.severityLabel,
                        formData.severity === option.value && styles.severityLabelSelected
                      ]}>
                        {option.label}
                      </Text>
                      <View style={[
                        styles.severityIndicator,
                        { backgroundColor: 
                          option.value === 'critical' ? '#DC2626' :
                          option.value === 'high' ? '#EA580C' :
                          option.value === 'medium' ? '#F59E0B' : '#10B981'
                        }
                      ]} />
                    </View>
                    <Text style={styles.severityDescription}>{option.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Traffic Management Type */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Traffic Management</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => {
                  Alert.alert('Traffic Management Type', 'Select the type of traffic management', 
                    trafficManagementOptions.map(option => ({
                      text: option.label,
                      onPress: () => setFormData({...formData, trafficManagement: option.value})
                    })).concat([{ text: 'Cancel', style: 'cancel' }])
                  );
                }}
              >
                <Text style={styles.selectButtonText}>
                  {trafficManagementOptions.find(opt => opt.value === formData.trafficManagement)?.label}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Expected Duration */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Expected Duration</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 2-4 hours, 3 days, 2 weeks"
                placeholderTextColor="#9CA3AF"
                value={formData.expectedDuration}
                onChangeText={(text) => setFormData({...formData, expectedDuration: text})}
              />
            </View>

            {/* Affected Routes */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Affected Bus Routes</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowRouteSelector(true)}
              >
                <Text style={styles.selectButtonText}>
                  {selectedRoutes.size === 0 
                    ? 'Select routes...' 
                    : `${selectedRoutes.size} route${selectedRoutes.size === 1 ? '' : 's'} selected`}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#6B7280" />
              </TouchableOpacity>
              {selectedRoutes.size > 0 && (
                <View style={styles.selectedRoutesContainer}>
                  {Array.from(selectedRoutes).map((route) => (
                    <View key={route} style={styles.selectedRouteChip}>
                      <Text style={styles.selectedRouteText}>{route}</Text>
                      <TouchableOpacity
                        onPress={() => handleRouteToggle(route)}
                        style={styles.removeRouteButton}
                      >
                        <Ionicons name="close" size={14} color="#6B7280" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Promoter */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Promoter/Contractor</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Northern Gas Networks, Northumbrian Water"
                placeholderTextColor="#9CA3AF"
                value={formData.promoter}
                onChangeText={(text) => setFormData({...formData, promoter: text})}
              />
            </View>

            {/* Push to Display */}
            <View style={styles.switchContainer}>
              <View style={styles.switchLabelContainer}>
                <Text style={styles.switchLabel}>Push to Display Screens</Text>
                <Text style={styles.switchDescription}>
                  Immediately show this roadwork on passenger information displays
                </Text>
              </View>
              <Switch
                value={formData.pushToDisplay}
                onValueChange={(value) => setFormData({...formData, pushToDisplay: value})}
                trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                thumbColor={formData.pushToDisplay ? '#FFFFFF' : '#9CA3AF'}
              />
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button, 
                styles.submitButton,
                isSubmitting && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting || !formData.location || !formData.description}
            >
              {isSubmitting ? (
                <Text style={styles.submitButtonText}>Creating...</Text>
              ) : (
                <Text style={styles.submitButtonText}>Create Roadwork</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Route Selector Overlay */}
        {renderRouteSelector()}
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '95%',
    maxWidth: 500,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  closeButton: {
    padding: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#DC2626',
    fontSize: 12,
  },
  formScrollView: {
    maxHeight: 400,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
  },
  selectButtonText: {
    fontSize: 14,
    color: '#1F2937',
  },
  severityContainer: {
    gap: 8,
  },
  severityOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  severityOptionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  severityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  severityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  severityLabelSelected: {
    color: '#3B82F6',
  },
  severityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  severityDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  selectedRoutesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  selectedRouteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  selectedRouteText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  removeRouteButton: {
    padding: 2,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  switchDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Route Selector Styles
  routeSelectorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  routeSelectorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  routesList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    maxHeight: 400,
    width: '100%',
  },
  routesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  routeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    minWidth: 60,
    alignItems: 'center',
  },
  routeChipSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  routeChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  routeChipTextSelected: {
    color: '#FFFFFF',
  },
  routeSelectorCloseButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  routeSelectorCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default CreateRoadworkModal;