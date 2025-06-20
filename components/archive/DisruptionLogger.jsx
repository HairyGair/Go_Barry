// Go_BARRY/components/DisruptionLogger.jsx
// React Native component for logging disruption achievements
// Integrates with the BARRY disruption logging API

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Switch
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

const DisruptionLogger = ({ supervisorInfo, onClose, onLogSuccess }) => {
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'incident',
    location: '',
    affected_routes: [],
    resolution_method: '',
    actions_taken: '',
    resources_used: [],
    severity_level: 'medium',
    resolution_time_minutes: '',
    response_time_minutes: '',
    diversion_route: '',
    customer_communications: [],
    driver_notifications: '',
    lessons_learned: '',
    improvement_suggestions: '',
    preventable: false,
    recurring_issue: false,
    follow_up_required: false,
    cost_estimate: '',
    depot: supervisorInfo?.depot || '',
    shift: supervisorInfo?.shift || '',
    supervisor_id: supervisorInfo?.id || '',
    supervisor_name: supervisorInfo?.name || ''
  });

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Available options
  const disruptionTypes = [
    { label: 'Traffic Incident', value: 'incident' },
    { label: 'Roadworks', value: 'roadwork' },
    { label: 'Service Diversion', value: 'diversion' },
    { label: 'Service Change', value: 'service_change' },
    { label: 'Weather Related', value: 'weather' },
    { label: 'Vehicle Breakdown', value: 'breakdown' },
    { label: 'Accident', value: 'accident' },
    { label: 'Emergency', value: 'emergency' },
    { label: 'Planned Works', value: 'planned_works' },
    { label: 'Other', value: 'other' }
  ];

  const severityLevels = [
    { label: 'Low Impact', value: 'low' },
    { label: 'Medium Impact', value: 'medium' },
    { label: 'High Impact', value: 'high' },
    { label: 'Critical Impact', value: 'critical' }
  ];

  const commonRoutes = [
    '1', '2', '6', '7', '10', '11', '12', '13', '14', '16', '18', '19', '20', '21', '22', 
    '25', '28', '29', '35', '36', '39', '40', '43', '44', '45', '50', '53', '54', '56', 
    '61', '62', '63', '64', '65', 'X7', 'X8', 'X9', 'X10', 'X21', 'X84', 'X85',
    'Q1', 'Q2', 'Q3', 'QUAYSIDE', '93', '94', '308', '309', '311', '317', '602', '685'
  ];

  // Update form field
  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle route selection (multiple)
  const toggleRoute = (route) => {
    setFormData(prev => ({
      ...prev,
      affected_routes: prev.affected_routes.includes(route)
        ? prev.affected_routes.filter(r => r !== route)
        : [...prev.affected_routes, route]
    }));
  };

  // Submit the disruption log
  const submitDisruption = async () => {
    try {
      setLoading(true);

      // Validate required fields
      if (!formData.title || !formData.type || !formData.location || !formData.supervisor_id) {
        Alert.alert('Missing Information', 'Please fill in all required fields (Title, Type, Location)');
        return;
      }

      // Prepare data for API
      const submissionData = {
        ...formData,
        resolution_time_minutes: formData.resolution_time_minutes ? parseInt(formData.resolution_time_minutes) : null,
        response_time_minutes: formData.response_time_minutes ? parseInt(formData.response_time_minutes) : null,
        cost_estimate: formData.cost_estimate ? parseFloat(formData.cost_estimate) : null,
        disruption_resolved: new Date().toISOString(),
        resources_used: formData.resources_used.filter(r => r.trim()),
        customer_communications: formData.customer_communications.filter(c => c.trim())
      };

      // Call API
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/disruptions/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData)
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert(
          'Success! 🎉', 
          'Disruption logged successfully. Well done on resolving this issue!',
          [
            {
              text: 'Log Another',
              onPress: resetForm
            },
            {
              text: 'Close',
              onPress: () => {
                onLogSuccess?.(result.data);
                onClose?.();
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', `Failed to log disruption: ${result.error}`);
      }

    } catch (error) {
      console.error('Disruption logging error:', error);
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      ...formData,
      title: '',
      description: '',
      type: 'incident',
      location: '',
      affected_routes: [],
      resolution_method: '',
      actions_taken: '',
      resources_used: [],
      severity_level: 'medium',
      resolution_time_minutes: '',
      response_time_minutes: '',
      diversion_route: '',
      customer_communications: [],
      driver_notifications: '',
      lessons_learned: '',
      improvement_suggestions: '',
      preventable: false,
      recurring_issue: false,
      follow_up_required: false,
      cost_estimate: ''
    });
    setCurrentStep(1);
  };

  // Render step indicator
  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map(step => (
        <View 
          key={step} 
          style={[
            styles.stepDot, 
            currentStep >= step && styles.stepDotActive
          ]}
        >
          <Text style={[styles.stepText, currentStep >= step && styles.stepTextActive]}>
            {step}
          </Text>
        </View>
      ))}
    </View>
  );

  // Render step 1: Basic Information
  const renderStep1 = () => (
    <ScrollView style={styles.stepContent}>
      <Text style={styles.stepTitle}>📝 Basic Information</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={formData.title}
          onChangeText={(text) => updateField('title', text)}
          placeholder="Brief description of the disruption resolved"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Type *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.type}
            onValueChange={(value) => updateField('type', value)}
            style={styles.picker}
          >
            {disruptionTypes.map(type => (
              <Picker.Item key={type.value} label={type.label} value={type.value} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Location *</Text>
        <TextInput
          style={styles.input}
          value={formData.location}
          onChangeText={(text) => updateField('location', text)}
          placeholder="Where did this disruption occur?"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Severity Level</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.severity_level}
            onValueChange={(value) => updateField('severity_level', value)}
            style={styles.picker}
          >
            {severityLevels.map(level => (
              <Picker.Item key={level.value} label={level.label} value={level.value} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.description}
          onChangeText={(text) => updateField('description', text)}
          placeholder="Additional details about the disruption..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
        />
      </View>
    </ScrollView>
  );

  // Render step 2: Resolution Details
  const renderStep2 = () => (
    <ScrollView style={styles.stepContent}>
      <Text style={styles.stepTitle}>🔧 Resolution Details</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Affected Routes</Text>
        <View style={styles.routeGrid}>
          {commonRoutes.map(route => (
            <TouchableOpacity
              key={route}
              style={[
                styles.routeButton,
                formData.affected_routes.includes(route) && styles.routeButtonSelected
              ]}
              onPress={() => toggleRoute(route)}
            >
              <Text style={[
                styles.routeButtonText,
                formData.affected_routes.includes(route) && styles.routeButtonTextSelected
              ]}>
                {route}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>How was it resolved?</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.resolution_method}
          onChangeText={(text) => updateField('resolution_method', text)}
          placeholder="Describe the resolution method used..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Actions Taken</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.actions_taken}
          onChangeText={(text) => updateField('actions_taken', text)}
          placeholder="What specific actions were taken to resolve this?"
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputRow}>
        <View style={styles.inputHalf}>
          <Text style={styles.label}>Resolution Time (mins)</Text>
          <TextInput
            style={styles.input}
            value={formData.resolution_time_minutes}
            onChangeText={(text) => updateField('resolution_time_minutes', text)}
            placeholder="45"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        </View>
        <View style={styles.inputHalf}>
          <Text style={styles.label}>Response Time (mins)</Text>
          <TextInput
            style={styles.input}
            value={formData.response_time_minutes}
            onChangeText={(text) => updateField('response_time_minutes', text)}
            placeholder="10"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Driver Notifications</Text>
        <TextInput
          style={styles.input}
          value={formData.driver_notifications}
          onChangeText={(text) => updateField('driver_notifications', text)}
          placeholder="How were drivers notified?"
          placeholderTextColor="#999"
        />
      </View>
    </ScrollView>
  );

  // Render step 3: Learning & Follow-up
  const renderStep3 = () => (
    <ScrollView style={styles.stepContent}>
      <Text style={styles.stepTitle}>📚 Learning & Follow-up</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Lessons Learned</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.lessons_learned}
          onChangeText={(text) => updateField('lessons_learned', text)}
          placeholder="What did we learn from this incident?"
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Improvement Suggestions</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.improvement_suggestions}
          onChangeText={(text) => updateField('improvement_suggestions', text)}
          placeholder="How could we handle this better next time?"
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.switchGroup}>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Was this preventable?</Text>
          <Switch
            value={formData.preventable}
            onValueChange={(value) => updateField('preventable', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={formData.preventable ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Recurring issue?</Text>
          <Switch
            value={formData.recurring_issue}
            onValueChange={(value) => updateField('recurring_issue', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={formData.recurring_issue ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Follow-up required?</Text>
          <Switch
            value={formData.follow_up_required}
            onValueChange={(value) => updateField('follow_up_required', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={formData.follow_up_required ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Estimated Cost Impact (£)</Text>
        <TextInput
          style={styles.input}
          value={formData.cost_estimate}
          onChangeText={(text) => updateField('cost_estimate', text)}
          placeholder="150.00"
          placeholderTextColor="#999"
          keyboardType="numeric"
        />
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📝 Log Disruption Achievement</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      {renderStepIndicator()}

      <View style={styles.content}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </View>

      <View style={styles.footer}>
        {currentStep > 1 && (
          <TouchableOpacity 
            style={[styles.button, styles.buttonSecondary]} 
            onPress={() => setCurrentStep(currentStep - 1)}
          >
            <Text style={styles.buttonSecondaryText}>Previous</Text>
          </TouchableOpacity>
        )}

        {currentStep < 3 ? (
          <TouchableOpacity 
            style={[styles.button, styles.buttonPrimary]} 
            onPress={() => setCurrentStep(currentStep + 1)}
          >
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.button, styles.buttonSuccess]} 
            onPress={submitDisruption}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>🎉 Log Achievement</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  stepDotActive: {
    backgroundColor: '#007AFF',
  },
  stepText: {
    color: '#666',
    fontWeight: 'bold',
  },
  stepTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    padding: 16,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  inputHalf: {
    flex: 0.48,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  picker: {
    height: 50,
  },
  routeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  routeButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 4,
  },
  routeButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  routeButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  routeButtonTextSelected: {
    color: '#fff',
  },
  switchGroup: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#007AFF',
  },
  buttonSecondary: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonSuccess: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSecondaryText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DisruptionLogger;
