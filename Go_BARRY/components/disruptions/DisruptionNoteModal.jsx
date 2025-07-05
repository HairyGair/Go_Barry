// Modal for adding notes to disruptions
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const NOTE_TYPES = [
  { value: 'update', label: 'Status Update', icon: 'information-circle' },
  { value: 'action', label: 'Action Taken', icon: 'checkmark-circle' },
  { value: 'observation', label: 'Observation', icon: 'eye' },
];

export default function DisruptionNoteModal({
  visible,
  disruption,
  onClose,
  onSubmit
}) {
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState('update');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!noteContent.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(noteContent.trim(), noteType);
      setNoteContent('');
      setNoteType('update');
    } catch (error) {
      console.error('Failed to submit note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setNoteContent('');
    setNoteType('update');
    onClose();
  };

  if (!disruption) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add Note</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Disruption Info */}
          <View style={styles.disruptionInfo}>
            <Text style={styles.disruptionTitle} numberOfLines={2}>
              {disruption.title}
            </Text>
            <Text style={styles.disruptionLocation} numberOfLines={1}>
              <Ionicons name="location-outline" size={14} color="#6b7280" />
              {' ' + disruption.location?.description}
            </Text>
          </View>

          {/* Note Type Selection */}
          <View style={styles.typeSection}>
            <Text style={styles.sectionTitle}>Note Type</Text>
            <View style={styles.typeOptions}>
              {NOTE_TYPES.map(type => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeOption,
                    noteType === type.value && styles.typeOptionActive
                  ]}
                  onPress={() => setNoteType(type.value)}
                >
                  <Ionicons
                    name={type.icon}
                    size={20}
                    color={noteType === type.value ? '#2563eb' : '#6b7280'}
                  />
                  <Text style={[
                    styles.typeText,
                    noteType === type.value && styles.typeTextActive
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Note Input */}
          <View style={styles.inputSection}>
            <Text style={styles.sectionTitle}>Note Content</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your note here..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              value={noteContent}
              onChangeText={setNoteContent}
              maxLength={500}
            />
            <Text style={styles.charCount}>
              {noteContent.length}/500
            </Text>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => setNoteContent(noteContent + ' Monitoring situation.')}
              >
                <Text style={styles.quickActionText}>Monitoring</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => setNoteContent(noteContent + ' Diversion in place.')}
              >
                <Text style={styles.quickActionText}>Diversion</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => setNoteContent(noteContent + ' Delays expected.')}
              >
                <Text style={styles.quickActionText}>Delays</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => setNoteContent(noteContent + ' Clearing now.')}
              >
                <Text style={styles.quickActionText}>Clearing</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!noteContent.trim() || isSubmitting) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={!noteContent.trim() || isSubmitting}
            >
              <Text style={styles.submitText}>
                {isSubmitting ? 'Adding...' : 'Add Note'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  disruptionInfo: {
    backgroundColor: '#f9fafb',
    padding: 16,
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  disruptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  disruptionLocation: {
    fontSize: 14,
    color: '#6b7280',
  },
  typeSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  typeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  typeOptionActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  typeText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
  },
  typeTextActive: {
    color: '#2563eb',
    fontWeight: '500',
  },
  inputSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 4,
  },
  quickActions: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  quickAction: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    marginRight: 8,
  },
  quickActionText: {
    fontSize: 14,
    color: '#374151',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});
