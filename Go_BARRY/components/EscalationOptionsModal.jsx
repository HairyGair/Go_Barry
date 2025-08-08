import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Switch
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSupervisor } from './hooks/useSupervisorSession';

const EscalationOptionsModal = ({ 
  visible, 
  onClose, 
  roadwork,
  onComplete 
}) => {
  const { supervisorBadge, supervisorName, supervisor } = useSupervisor();
  
  // Early return if roadwork is null or undefined
  if (!roadwork) {
    return null;
  }
  
  const [loading, setLoading] = useState(false);
  const [escalationOptions, setEscalationOptions] = useState({
    pushToDatabase: true,        // Always enabled by default
    pushToDisplay: false,        // Optional
    emailManager: false,         // Optional
    reason: '',
    urgencyLevel: 'medium',
    workflowNotes: '',
    servicesAffected: [],
    ticketMachineMessage: '',
    customerMessage: ''
  });

  const urgencyLevels = [
    { value: 'low', label: 'Low Priority', color: '#22c55e', icon: 'alert-circle-outline' },
    { value: 'medium', label: 'Medium Priority', color: '#f59e0b', icon: 'alert' },
    { value: 'high', label: 'High Priority', color: '#ef4444', icon: 'alert-circle' },
    { value: 'critical', label: 'Critical', color: '#dc2626', icon: 'alert-octagon' }
  ];

  const commonServices = [
    '21', '22', '27', '28', '29', '56', '57', '58', '62', 'X1', 'X21', 'X22', 
    'Q1', 'Q2', 'Q3', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'
  ];

  const escalationReasons = [
    'Major delays expected - significant traffic impact',
    'Road closure affecting multiple bus routes', 
    'Emergency services required - public safety concern',
    'Commercial impact assessment needed',
    'Requires coordination with traffic management',
    'Customer complaints received',
    'Extended duration - longer than initially planned',
    'Complex diversion routes needed',
    'Other (specify in notes)'
  ];

  const handleServiceToggle = (service) => {
    setEscalationOptions(prev => ({
      ...prev,
      servicesAffected: prev.servicesAffected.includes(service)
        ? prev.servicesAffected.filter(s => s !== service)
        : [...prev.servicesAffected, service]
    }));
  };

  const handleEscalate = async () => {
    if (!escalationOptions.reason) {
      Alert.alert('Required Field', 'Please select or enter an escalation reason.');
      return;
    }

    setLoading(true);
    
    try {
      // Prepare comprehensive alert data
      const alertData = {
        ...roadwork,
        // Ensure we have proper coordinates
        coordinates: roadwork.coordinates || [roadwork.latitude, roadwork.longitude].filter(Boolean),
        // Add workflow-specific data
        workflowNotes: escalationOptions.workflowNotes,
        servicesAffected: escalationOptions.servicesAffected,
        ticketMachineMessage: escalationOptions.ticketMachineMessage || generateDefaultTicketMessage(),
        customerMessage: escalationOptions.customerMessage || generateDefaultCustomerMessage(),
        escalationReason: escalationOptions.reason,
        urgencyLevel: escalationOptions.urgencyLevel
      };

      // Call the comprehensive escalation API
      const response = await fetch('/api/escalation/escalate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          alertData,
          options: escalationOptions,
          supervisorBadge
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Escalation failed');
      }

      // Show success message with actions taken
      const actionsText = result.results?.actions?.map(action => 
        `✓ ${action.message}`
      ).join('\n') || 'Escalation completed';

      Alert.alert(
        'Escalation Complete', 
        `Alert has been escalated successfully:\n\n${actionsText}`,
        [{ text: 'OK', style: 'default' }]
      );

      // Close modal and notify parent
      onComplete?.(result);
      onClose();
      resetForm();

    } catch (error) {
      console.error('❌ Escalation failed:', error);
      Alert.alert('Escalation Failed', `Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generateDefaultTicketMessage = () => {
    const location = roadwork.street_name || roadwork.location || 'affected area';
    return `TRAFFIC DISRUPTION: Delays expected in ${location}. Services may be diverted. Please allow extra journey time.`;
  };

  const generateDefaultCustomerMessage = () => {
    const location = roadwork.street_name || roadwork.location || 'the area';
    return `We're experiencing traffic delays in ${location}. Your journey may take longer than usual. We apologize for any inconvenience.`;
  };

  const resetForm = () => {
    setEscalationOptions({
      pushToDatabase: true,
      pushToDisplay: false,
      emailManager: false,
      reason: '',
      urgencyLevel: 'medium',
      workflowNotes: '',
      servicesAffected: [],
      ticketMachineMessage: '',
      customerMessage: ''
    });
  };

  const selectedUrgency = urgencyLevels.find(level => level.value === escalationOptions.urgencyLevel);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <MaterialCommunityIcons name="alert-octagon" size={24} color="#ef4444" />
              <Text style={styles.title}>Escalate Roadwork Alert</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={30} color="#ef4444" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Alert Summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Alert Details</Text>
              <View style={styles.alertInfo}>
                <Text style={styles.alertLocation}>{roadwork.street_name || roadwork.location}</Text>
                <Text style={styles.alertDescription}>
                  {roadwork.sm_works_description || roadwork.description || 'Roadwork disruption'}
                </Text>
              </View>
            </View>

            {/* Escalation Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Escalation Actions</Text>
              
              <View style={styles.option}>
                <View style={styles.optionHeader}>
                  <View style={styles.optionLeft}>
                    <MaterialCommunityIcons name="database" size={20} color="#3b82f6" />
                    <Text style={styles.optionTitle}>Save to Disruption Database</Text>
                  </View>
                  <Switch
                    value={escalationOptions.pushToDatabase}
                    onValueChange={(value) => setEscalationOptions(prev => ({ ...prev, pushToDatabase: value }))}
                    trackColor={{ false: '#374151', true: 'rgba(59, 130, 246, 0.3)' }}
                    thumbColor={escalationOptions.pushToDatabase ? '#3b82f6' : '#9ca3af'}
                  />
                </View>
                <Text style={styles.optionDescription}>
                  Store comprehensive workflow data for tracking and reporting
                </Text>
              </View>

              <View style={styles.option}>
                <View style={styles.optionHeader}>
                  <View style={styles.optionLeft}>
                    <MaterialCommunityIcons name="monitor-eye" size={20} color="#f59e0b" />
                    <Text style={styles.optionTitle}>Push to Display Screens</Text>
                  </View>
                  <Switch
                    value={escalationOptions.pushToDisplay}
                    onValueChange={(value) => setEscalationOptions(prev => ({ ...prev, pushToDisplay: value }))}
                    trackColor={{ false: '#374151', true: 'rgba(245, 158, 11, 0.3)' }}
                    thumbColor={escalationOptions.pushToDisplay ? '#f59e0b' : '#9ca3af'}
                  />
                </View>
                <Text style={styles.optionDescription}>
                  Display alert with map zoom on control room screens
                </Text>
              </View>

              <View style={styles.option}>
                <View style={styles.optionHeader}>
                  <View style={styles.optionLeft}>
                    <MaterialCommunityIcons name="email-alert" size={20} color="#dc2626" />
                    <Text style={styles.optionTitle}>Email Line Manager</Text>
                  </View>
                  <Switch
                    value={escalationOptions.emailManager}
                    onValueChange={(value) => setEscalationOptions(prev => ({ ...prev, emailManager: value }))}
                    trackColor={{ false: '#374151', true: 'rgba(220, 38, 38, 0.3)' }}
                    thumbColor={escalationOptions.emailManager ? '#dc2626' : '#9ca3af'}
                  />
                </View>
                <Text style={styles.optionDescription}>
                  Send escalation email to barry.perryman@gonortheast.co.uk
                </Text>
              </View>
            </View>

            {/* Urgency Level */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Urgency Level</Text>
              <View style={styles.urgencyGrid}>
                {urgencyLevels.map((level) => (
                  <TouchableOpacity
                    key={level.value}
                    style={[
                      styles.urgencyOption,
                      escalationOptions.urgencyLevel === level.value && {
                        backgroundColor: `${level.color}20`,
                        borderColor: level.color
                      }
                    ]}
                    onPress={() => setEscalationOptions(prev => ({ ...prev, urgencyLevel: level.value }))}
                  >
                    <MaterialCommunityIcons name={level.icon} size={20} color={level.color} />
                    <Text style={[styles.urgencyLabel, { color: level.color }]}>{level.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Escalation Reason */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Escalation Reason *</Text>
              <View style={styles.reasonGrid}>
                {escalationReasons.map((reason, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.reasonOption,
                      escalationOptions.reason === reason && styles.reasonOptionSelected
                    ]}
                    onPress={() => setEscalationOptions(prev => ({ ...prev, reason }))}
                  >
                    <Text style={[
                      styles.reasonText,
                      escalationOptions.reason === reason && styles.reasonTextSelected
                    ]}>
                      {reason}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {escalationOptions.reason === 'Other (specify in notes)' && (
                <TextInput
                  style={styles.input}
                  placeholder="Please specify the escalation reason..."
                  placeholderTextColor="#6b7280"
                  value={escalationOptions.workflowNotes}
                  onChangeText={(text) => setEscalationOptions(prev => ({ ...prev, workflowNotes: text }))}
                  multiline
                />
              )}
            </View>

            {/* Affected Services */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Affected Services (Optional)</Text>
              <View style={styles.servicesGrid}>
                {commonServices.map((service) => (
                  <TouchableOpacity
                    key={service}
                    style={[
                      styles.serviceChip,
                      escalationOptions.servicesAffected.includes(service) && styles.serviceChipSelected
                    ]}
                    onPress={() => handleServiceToggle(service)}
                  >
                    <Text style={[
                      styles.serviceChipText,
                      escalationOptions.servicesAffected.includes(service) && styles.serviceChipTextSelected
                    ]}>
                      {service}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Additional Notes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Additional Notes</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Add any additional information for the escalation..."
                placeholderTextColor="#6b7280"
                value={escalationOptions.workflowNotes}
                onChangeText={(text) => setEscalationOptions(prev => ({ ...prev, workflowNotes: text }))}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.escalateButton, loading && styles.buttonDisabled]}
              onPress={handleEscalate}
              disabled={loading || !escalationOptions.reason}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="alert-octagon" size={18} color="#ffffff" />
                  <Text style={styles.escalateButtonText}>Escalate Alert</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    width: Platform.OS === 'web' ? '90%' : '95%',
    maxWidth: 600,
    maxHeight: '90%',
    margin: 20
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#374151'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff'
  },
  body: {
    flex: 1,
    padding: 20,
    paddingTop: 15
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f3f4f6',
    marginBottom: 12
  },
  alertInfo: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444'
  },
  alertLocation: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4
  },
  alertDescription: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20
  },
  option: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff'
  },
  optionDescription: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 18
  },
  urgencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  urgencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#374151',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    flex: 1,
    minWidth: '45%'
  },
  urgencyLabel: {
    fontSize: 14,
    fontWeight: '500'
  },
  reasonGrid: {
    gap: 8
  },
  reasonOption: {
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  reasonOptionSelected: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)'
  },
  reasonText: {
    fontSize: 14,
    color: '#d1d5db'
  },
  reasonTextSelected: {
    color: '#93c5fd',
    fontWeight: '500'
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  serviceChip: {
    backgroundColor: '#374151',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4b5563'
  },
  serviceChipSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#60a5fa'
  },
  serviceChipText: {
    fontSize: 14,
    color: '#d1d5db',
    fontWeight: '500'
  },
  serviceChipTextSelected: {
    color: '#ffffff'
  },
  input: {
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4b5563',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#ffffff',
    marginTop: 8
  },
  textArea: {
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4b5563',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#ffffff',
    minHeight: 80,
    textAlignVertical: 'top'
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    gap: 12
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#374151',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center'
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d1d5db'
  },
  escalateButton: {
    flex: 2,
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  escalateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff'
  },
  buttonDisabled: {
    opacity: 0.5
  }
});

export default EscalationOptionsModal;