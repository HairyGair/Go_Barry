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
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupervisorSession } from './hooks/useSupervisorSession';
import { useBARRYapi } from './hooks/useBARRYapi';

export default function DisruptionWorkflowModal({ 
  visible, 
  onClose, 
  alert,
  onComplete 
}) {
  const { supervisorBadge } = useSupervisorSession();
  const { postToAPI } = useBARRYapi();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [workflowData, setWorkflowData] = useState({
    acknowledged: false,
    affectedServices: [],
    ticketMachineMessage: '',
    passengerCloudMessage: '',
    serviceMessages: []
  });

  const handleAcknowledge = () => {
    setWorkflowData(prev => ({ ...prev, acknowledged: true }));
    setStep(2);
  };

  const handleAddServiceMessage = () => {
    setWorkflowData(prev => ({
      ...prev,
      serviceMessages: [...prev.serviceMessages, { service: '', message: '' }]
    }));
  };

  const updateServiceMessage = (index, field, value) => {
    setWorkflowData(prev => {
      const messages = [...prev.serviceMessages];
      messages[index][field] = value;
      return { ...prev, serviceMessages: messages };
    });
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Push to Display Screen via Convex
      await postToAPI('/api/alerts/push-to-display', {
        alert: {
          ...alert,
          isPushed: true,
          pushedBy: supervisorBadge,
          pushedAt: new Date().toISOString()
        }
      });

      // Save to Disruption Database
      await postToAPI('/api/disruptions/create', {
        ...alert,
        workflowData,
        supervisorBadge,
        completedAt: new Date().toISOString(),
        source: 'streetmanager'
      });

      Alert.alert('Success', 'Disruption workflow completed and pushed to Display Screen');
      onComplete?.();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to complete workflow: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    if (Platform.OS === 'web') {
      navigator.clipboard.writeText(text);
      Alert.alert('Copied', 'Message copied to clipboard');
    }
  };

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
            <Text style={styles.title}>Disruption Workflow</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={30} color="#FF6B6B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
            {/* Alert Info */}
            <View style={styles.alertInfo}>
              <Text style={styles.sectionTitle}>Alert Details</Text>
              <Text style={styles.alertText}>{alert?.title || alert?.location}</Text>
              <Text style={styles.alertSubtext}>
                {alert?.description || alert?.works_description}
              </Text>
            </View>

            {/* Step 1: Acknowledge */}
            <View style={[styles.step, step === 1 && styles.activeStep]}>
              <Text style={styles.stepTitle}>
                <Ionicons name={workflowData.acknowledged ? "checkmark-circle" : "alert-circle"} size={20} />
                {' '}Step 1: Acknowledge Disruption
              </Text>
              {step === 1 && (
                <TouchableOpacity 
                  style={styles.primaryButton}
                  onPress={handleAcknowledge}
                >
                  <Text style={styles.buttonText}>Acknowledge as Network Disruption</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Step 2: Ticket Machine Messages */}
            {step >= 2 && (
              <View style={[styles.step, step === 2 && styles.activeStep]}>
                <Text style={styles.stepTitle}>
                  <Ionicons name="phone-portrait" size={20} />
                  {' '}Step 2: Ticket Machine Messages
                </Text>
                
                <TextInput
                  style={styles.input}
                  placeholder="Enter ticket machine message..."
                  value={workflowData.ticketMachineMessage}
                  onChangeText={(text) => setWorkflowData(prev => ({ ...prev, ticketMachineMessage: text }))}
                  multiline
                />

                {workflowData.serviceMessages.map((msg, index) => (
                  <View key={index} style={styles.serviceMessage}>
                    <TextInput
                      style={[styles.input, styles.serviceInput]}
                      placeholder="Service number (e.g., 21)"
                      value={msg.service}
                      onChangeText={(text) => updateServiceMessage(index, 'service', text)}
                    />
                    <TextInput
                      style={[styles.input, styles.messageInput]}
                      placeholder="Custom message for this service"
                      value={msg.message}
                      onChangeText={(text) => updateServiceMessage(index, 'message', text)}
                    />
                  </View>
                ))}

                <TouchableOpacity style={styles.addButton} onPress={handleAddServiceMessage}>
                  <Text style={styles.addButtonText}>+ Add Service-Specific Message</Text>
                </TouchableOpacity>

                {workflowData.ticketMachineMessage && (
                  <TouchableOpacity 
                    style={styles.copyButton}
                    onPress={() => copyToClipboard(workflowData.ticketMachineMessage)}
                  >
                    <Text style={styles.copyButtonText}>Copy Message</Text>
                  </TouchableOpacity>
                )}

                {step === 2 && (
                  <TouchableOpacity 
                    style={styles.primaryButton}
                    onPress={() => setStep(3)}
                  >
                    <Text style={styles.buttonText}>Continue to Passenger Cloud</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Step 3: Passenger Cloud */}
            {step >= 3 && (
              <View style={[styles.step, step === 3 && styles.activeStep]}>
                <Text style={styles.stepTitle}>
                  <Ionicons name="cloud-upload" size={20} />
                  {' '}Step 3: Passenger Cloud Message
                </Text>
                
                <TextInput
                  style={styles.input}
                  placeholder="Enter passenger cloud message..."
                  value={workflowData.passengerCloudMessage}
                  onChangeText={(text) => setWorkflowData(prev => ({ ...prev, passengerCloudMessage: text }))}
                  multiline
                />

                {workflowData.passengerCloudMessage && (
                  <TouchableOpacity 
                    style={styles.copyButton}
                    onPress={() => copyToClipboard(workflowData.passengerCloudMessage)}
                  >
                    <Text style={styles.copyButtonText}>Copy Message</Text>
                  </TouchableOpacity>
                )}

                {step === 3 && (
                  <TouchableOpacity 
                    style={styles.primaryButton}
                    onPress={() => setStep(4)}
                  >
                    <Text style={styles.buttonText}>Review & Push to Display</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Step 4: Review & Complete */}
            {step >= 4 && (
              <View style={[styles.step, styles.activeStep]}>
                <Text style={styles.stepTitle}>
                  <Ionicons name="checkmark-done-circle" size={20} />
                  {' '}Step 4: Review & Complete
                </Text>
                
                <View style={styles.summary}>
                  <Text style={styles.summaryItem}>✓ Disruption Acknowledged</Text>
                  <Text style={styles.summaryItem}>✓ Ticket Machine Message: {workflowData.ticketMachineMessage ? 'Ready' : 'Not set'}</Text>
                  <Text style={styles.summaryItem}>✓ Passenger Cloud Message: {workflowData.passengerCloudMessage ? 'Ready' : 'Not set'}</Text>
                  <Text style={styles.summaryItem}>✓ Service Messages: {workflowData.serviceMessages.length} configured</Text>
                </View>

                <TouchableOpacity 
                  style={[styles.completeButton, loading && styles.disabledButton]}
                  onPress={handleComplete}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.buttonText}>Push to Display & Save to Database</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: '#FFF',
    width: '90%',
    maxWidth: 600,
    maxHeight: '80%',
    borderRadius: 12,
    overflow: 'hidden'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#005EB8',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF'
  },
  body: {
    padding: 20
  },
  alertInfo: {
    backgroundColor: '#FFF3CD',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8
  },
  alertText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4
  },
  alertSubtext: {
    fontSize: 12,
    color: '#666'
  },
  step: {
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: '#F8F9FA'
  },
  activeStep: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: '#005EB8'
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#005EB8'
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#FFF',
    minHeight: 60
  },
  serviceMessage: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10
  },
  serviceInput: {
    flex: 1,
    minHeight: 40
  },
  messageInput: {
    flex: 2,
    minHeight: 40
  },
  primaryButton: {
    backgroundColor: '#005EB8',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10
  },
  completeButton: {
    backgroundColor: '#28A745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10
  },
  copyButton: {
    backgroundColor: '#6C757D',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10
  },
  addButton: {
    borderWidth: 1,
    borderColor: '#005EB8',
    borderStyle: 'dashed',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10
  },
  addButtonText: {
    color: '#005EB8',
    fontWeight: '600'
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16
  },
  copyButtonText: {
    color: '#FFF',
    fontWeight: '600'
  },
  disabledButton: {
    opacity: 0.7
  },
  summary: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15
  },
  summaryItem: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333'
  }
});