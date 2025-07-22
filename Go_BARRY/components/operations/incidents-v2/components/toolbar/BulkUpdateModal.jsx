/*
 * Go Barry - Bulk Update Modal
 * Allows updating multiple incidents at once
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, shadows } from '../../styles/incidents.styles';

const BulkUpdateModal = ({
  visible,
  onClose,
  selectedIncidents = [],
  onUpdate,
  baseUrl
}) => {
  const [updating, setUpdating] = useState(false);
  const [updateData, setUpdateData] = useState({
    status: '',
    addNote: '',
    actionTaken: '',
    updateMessages: false
  });

  const handleUpdate = async () => {
    if (!updateData.status && !updateData.addNote && !updateData.actionTaken) {
      Alert.alert('No Changes', 'Please select at least one update to apply');
      return;
    }

    setUpdating(true);

    try {
      const updates = [];
      const updatePayload = {};

      if (updateData.status) {
        updatePayload.status = updateData.status;
      }
      if (updateData.addNote) {
        updatePayload.note = updateData.addNote;
      }
      if (updateData.actionTaken) {
        updatePayload.actionTaken = updateData.actionTaken;
      }

      // Update each incident
      for (const incident of selectedIncidents) {
        const response = await fetch(`${baseUrl}/api/incidents/${incident.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatePayload)
        });

        if (response.ok) {
          updates.push(incident.id);
        }
      }

      console.log(`✅ Updated ${updates.length} incidents`);

      // Show success message
      if (Platform.OS === 'web') {
        alert(`Successfully updated ${updates.length} incidents`);
      } else {
        Alert.alert('Success', `Updated ${updates.length} incidents`);
      }

      // Call parent update handler
      if (onUpdate) {
        onUpdate(updates);
      }

      // Reset and close
      handleClose();
    } catch (error) {
      console.error('Error updating incidents:', error);
      Alert.alert('Error', 'Failed to update incidents. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleClose = () => {
    setUpdateData({
      status: '',
      addNote: '',
      actionTaken: '',
      updateMessages: false
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Bulk Update Incidents</Text>
              <Text style={styles.modalSubtitle}>
                Updating {selectedIncidents.length} selected incidents
              </Text>
            </View>
            <Pressable 
              style={styles.closeButton} 
              onPress={handleClose}
              disabled={updating}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Selected Incidents Summary */}
            <View style={styles.selectedSummary}>
              <Text style={styles.sectionTitle}>Selected Incidents</Text>
              <View style={styles.incidentChips}>
                {selectedIncidents.slice(0, 5).map((incident) => (
                  <View key={incident.id} style={styles.incidentChip}>
                    <Text style={styles.incidentChipText} numberOfLines={1}>
                      {incident.location?.description || incident.title || incident.id}
                    </Text>
                  </View>
                ))}
                {selectedIncidents.length > 5 && (
                  <View style={[styles.incidentChip, styles.moreChip]}>
                    <Text style={styles.incidentChipText}>
                      +{selectedIncidents.length - 5} more
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Status Update */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Update Status</Text>
              <View style={styles.statusOptions}>
                {['active', 'monitoring', 'resolved'].map((status) => (
                  <Pressable
                    key={status}
                    style={[
                      styles.statusButton,
                      updateData.status === status && styles.statusButtonActive
                    ]}
                    onPress={() => setUpdateData(prev => ({ 
                      ...prev, 
                      status: prev.status === status ? '' : status 
                    }))}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      updateData.status === status && styles.statusButtonTextActive
                    ]}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Add Note */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Add Note (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={updateData.addNote}
                onChangeText={(text) => setUpdateData(prev => ({ ...prev, addNote: text }))}
                placeholder="Add a note to all selected incidents..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Action Taken */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Action Taken (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={updateData.actionTaken}
                onChangeText={(text) => setUpdateData(prev => ({ ...prev, actionTaken: text }))}
                placeholder="Describe action taken for all incidents..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>

            {/* Update Messages Checkbox */}
            <Pressable 
              style={styles.checkboxRow}
              onPress={() => setUpdateData(prev => ({ 
                ...prev, 
                updateMessages: !prev.updateMessages 
              }))}
            >
              <View style={[
                styles.checkbox,
                updateData.updateMessages && styles.checkboxChecked
              ]}>
                {updateData.updateMessages && (
                  <Ionicons name="checkmark" size={16} color={colors.textInverse} />
                )}
              </View>
              <Text style={styles.checkboxLabel}>
                Regenerate messages for updated incidents
              </Text>
            </Pressable>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.modalFooter}>
            <Pressable
              style={[styles.footerButton, styles.cancelButton]}
              onPress={handleClose}
              disabled={updating}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            
            <Pressable
              style={[styles.footerButton, styles.updateButton]}
              onPress={handleUpdate}
              disabled={updating || (!updateData.status && !updateData.addNote && !updateData.actionTaken)}
            >
              {updating ? (
                <ActivityIndicator size="small" color={colors.textInverse} />
              ) : (
                <>
                  <Ionicons name="checkmark-done" size={20} color={colors.textInverse} />
                  <Text style={styles.updateButtonText}>
                    Update {selectedIncidents.length} Incidents
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = {
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContainer: {
    backgroundColor: colors.surface,
    borderRadius: spacing.lg,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    ...shadows.lg,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  modalTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },

  modalSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },

  closeButton: {
    padding: spacing.sm,
  },

  modalContent: {
    flex: 1,
    padding: spacing.xl,
  },

  section: {
    marginBottom: spacing.xl,
  },

  sectionTitle: {
    ...typography.h4,
    marginBottom: spacing.md,
  },

  selectedSummary: {
    backgroundColor: colors.backgroundDark,
    borderRadius: spacing.borderRadius,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },

  incidentChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },

  incidentChip: {
    backgroundColor: colors.primary,
    borderRadius: spacing.borderRadiusSm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    maxWidth: 150,
  },

  moreChip: {
    backgroundColor: colors.textMuted,
  },

  incidentChipText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: '500',
  },

  statusOptions: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  statusButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: spacing.borderRadius,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },

  statusButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  statusButtonText: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  statusButtonTextActive: {
    color: colors.textInverse,
  },

  textInput: {
    backgroundColor: colors.backgroundDark,
    borderRadius: spacing.borderRadius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...typography.body,
    color: colors.text,
  },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: spacing.borderRadiusSm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  checkboxLabel: {
    ...typography.body,
    flex: 1,
  },

  modalFooter: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  footerButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: spacing.borderRadius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },

  cancelButton: {
    backgroundColor: colors.backgroundDark,
  },

  cancelButtonText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  updateButton: {
    backgroundColor: colors.primary,
  },

  updateButtonText: {
    ...typography.body,
    color: colors.textInverse,
    fontWeight: '600',
  },
};

export default BulkUpdateModal;
