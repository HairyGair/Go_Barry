import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

const CreateRoadworkModal = ({ visible, onClose, supervisorData, onRoadworkCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    areas: '',
    status: 'pending',
    startDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endDate: '',
    endTime: '17:00',
    allDay: false,
    routesAffected: '',
    severity: 'medium',
    contactInfo: supervisorData?.email || '',
    webLink: '',
    emailGroups: ['Traffic Control'] // Default selected groups
  });

  const [availableEmailGroups, setAvailableEmailGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  // Severity options with colors
  const severityOptions = [
    { value: 'low', label: 'Low Impact', color: '#22c55e' },
    { value: 'medium', label: 'Medium Impact', color: '#f59e0b' },
    { value: 'high', label: 'High Impact', color: '#ef4444' }
  ];

  // Load email groups on mount
  useEffect(() => {
    if (visible) {
      loadEmailGroups();
    }
  }, [visible]);

  const loadEmailGroups = async () => {
    try {
      const response = await fetch('https://go-barry.onrender.com/api/roadwork-alerts/email-groups');
      const result = await response.json();
      if (result.success) {
        setAvailableEmailGroups(result.data);
      }
    } catch (error) {
      console.error('Failed to load email groups:', error);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }
    if (!formData.location.trim()) {
      Alert.alert('Error', 'Location is required');
      return;
    }
    if (!formData.startDate) {
      Alert.alert('Error', 'Start date is required');
      return;
    }

    setLoading(true);
    
    try {
      const startDateTime = formData.allDay 
        ? formData.startDate 
        : `${formData.startDate}T${formData.startTime}:00`;
      
      const endDateTime = formData.endDate 
        ? (formData.allDay ? formData.endDate : `${formData.endDate}T${formData.endTime}:00`)
        : null;

      const roadworkData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        areas: formData.areas.split(',').map(a => a.trim()).filter(a => a),
        status: formData.status,
        start_date: startDateTime,
        end_date: endDateTime,
        all_day: formData.allDay,
        routes_affected: formData.routesAffected.split(',').map(r => r.trim()).filter(r => r),
        severity: formData.severity,
        contact_info: formData.contactInfo.trim(),
        web_link: formData.webLink.trim(),
        created_by_supervisor_id: supervisorData.id,
        created_by_name: supervisorData.name,
        email_groups: formData.emailGroups
      };

      const response = await fetch('https://go-barry.onrender.com/api/roadwork-alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roadworkData)
      });

      const result = await response.json();
      
      if (result.success) {
        Alert.alert('Success', 'Roadwork created and notifications sent!');
        onRoadworkCreated?.(result.data);
        resetForm();
        onClose();
      } else {
        Alert.alert('Error', result.error || 'Failed to create roadwork');
      }
    } catch (error) {
      console.error('Create roadwork error:', error);
      Alert.alert('Error', 'Failed to create roadwork');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      location: '',
      areas: '',
      status: 'pending',
      startDate: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endDate: '',
      endTime: '17:00',
      allDay: false,
      routesAffected: '',
      severity: 'medium',
      contactInfo: supervisorData?.email || '',
      webLink: '',
      emailGroups: ['Traffic Control']
    });
  };

  const toggleEmailGroup = (groupName) => {
    setFormData(prev => ({
      ...prev,
      emailGroups: prev.emailGroups.includes(groupName)
        ? prev.emailGroups.filter(g => g !== groupName)
        : [...prev.emailGroups, groupName]
    }));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Roadwork</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => setFormData({...formData, title: text})}
              placeholder="e.g., A1 Bridge Maintenance"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({...formData, description: text})}
              placeholder="Detailed description of the roadwork..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Location *</Text>
            <TextInput
              style={styles.input}
              value={formData.location}
              onChangeText={(text) => setFormData({...formData, location: text})}
              placeholder="e.g., A1 Western Bypass, Junction 75"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Areas Affected (comma separated)</Text>
            <TextInput
              style={styles.input}
              value={formData.areas}
              onChangeText={(text) => setFormData({...formData, areas: text})}
              placeholder="e.g., Newcastle, Gateshead, Durham"
              placeholderTextColor="#999"
            />
          </View>

          {/* Timing */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Timing</Text>
            
            <View style={styles.switchRow}>
              <Text style={styles.label}>All Day Event</Text>
              <Switch
                value={formData.allDay}
                onValueChange={(value) => setFormData({...formData, allDay: value})}
                trackColor={{ false: '#ccc', true: '#2196F3' }}
              />
            </View>

            <View style={styles.dateRow}>
              <View style={styles.dateColumn}>
                <Text style={styles.label}>Start Date *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.startDate}
                  onChangeText={(text) => setFormData({...formData, startDate: text})}
                  placeholder="YYYY-MM-DD"
                />
              </View>
              {!formData.allDay && (
                <View style={styles.dateColumn}>
                  <Text style={styles.label}>Start Time</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.startTime}
                    onChangeText={(text) => setFormData({...formData, startTime: text})}
                    placeholder="HH:MM"
                  />
                </View>
              )}
            </View>

            <View style={styles.dateRow}>
              <View style={styles.dateColumn}>
                <Text style={styles.label}>End Date</Text>
                <TextInput
                  style={styles.input}
                  value={formData.endDate}
                  onChangeText={(text) => setFormData({...formData, endDate: text})}
                  placeholder="YYYY-MM-DD (optional)"
                />
              </View>
              {!formData.allDay && (
                <View style={styles.dateColumn}>
                  <Text style={styles.label}>End Time</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.endTime}
                    onChangeText={(text) => setFormData({...formData, endTime: text})}
                    placeholder="HH:MM"
                  />
                </View>
              )}
            </View>
          </View>

          {/* Impact & Routes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Impact & Routes</Text>

            <Text style={styles.label}>Severity</Text>
            <View style={styles.severityButtons}>
              {severityOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.severityButton,
                    { backgroundColor: formData.severity === option.value ? option.color : '#f0f0f0' }
                  ]}
                  onPress={() => setFormData({...formData, severity: option.value})}
                >
                  <Text style={[
                    styles.severityText,
                    { color: formData.severity === option.value ? 'white' : '#333' }
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Routes Affected (comma separated)</Text>
            <TextInput
              style={styles.input}
              value={formData.routesAffected}
              onChangeText={(text) => setFormData({...formData, routesAffected: text})}
              placeholder="e.g., 21, X21, 1, 307"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Status</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.status}
                onValueChange={(value) => setFormData({...formData, status: value})}
                style={styles.picker}
              >
                <Picker.Item label="Pending" value="pending" />
                <Picker.Item label="Active" value="active" />
                <Picker.Item label="Finished" value="finished" />
              </Picker>
            </View>
          </View>

          {/* Contact & Links */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact & Links</Text>
            
            <Text style={styles.label}>Contact Information</Text>
            <TextInput
              style={styles.input}
              value={formData.contactInfo}
              onChangeText={(text) => setFormData({...formData, contactInfo: text})}
              placeholder="Email or phone number"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Web Link</Text>
            <TextInput
              style={styles.input}
              value={formData.webLink}
              onChangeText={(text) => setFormData({...formData, webLink: text})}
              placeholder="https://..."
              placeholderTextColor="#999"
            />
          </View>

          {/* Email Groups */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notify Email Groups</Text>
            {availableEmailGroups.map((group) => (
              <TouchableOpacity
                key={group.id}
                style={styles.emailGroupItem}
                onPress={() => toggleEmailGroup(group.name)}
              >
                <View style={[
                  styles.checkbox,
                  { backgroundColor: formData.emailGroups.includes(group.name) ? '#2196F3' : 'transparent' }
                ]}>
                  {formData.emailGroups.includes(group.name) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.groupDescription}>{group.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Creator Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Created By</Text>
            <Text style={styles.creatorInfo}>
              {supervisorData?.name} ({supervisorData?.id})
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.disabledButton]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitText}>
              {loading ? 'Creating...' : 'Create Roadwork'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  closeText: {
    fontSize: 24,
    color: '#666',
  },
  form: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateColumn: {
    flex: 1,
  },
  severityButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  severityButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  severityText: {
    fontSize: 14,
    fontWeight: '500',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  emailGroupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#2196F3',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  groupDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  creatorInfo: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '500',
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  submitButton: {
    flex: 2,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    alignItems: 'center',
  },
  submitText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
};

export default CreateRoadworkModal;